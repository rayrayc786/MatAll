const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Supplier = require('../models/Supplier');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const Brand = require('../models/Brand');
const Unit = require('../models/Unit');
const SubVariantTitle = require('../models/SubVariantTitle');
const DeliveryTime = require('../models/DeliveryTime');
const FooterLink = require('../models/FooterLink');
const Offer = require('../models/Offer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const GSTClassification = require('../models/GSTClassification');
const ServiceableArea = require('../models/ServiceableArea');
const Settings = require('../models/Settings');
const SearchLog = require('../models/SearchLog');
const axios = require('axios');


// Inline Revenue Margin mapping if sheet exists
let globalMarginMap = new Map();

// Helper to resolve image names to actual file paths from public/images
const getAvailableFiles = () => {
  const imgDir = path.join(__dirname, '..', 'public', 'images');
  try {
    if (fs.existsSync(imgDir)) {
      return fs.readdirSync(imgDir);
    }
  } catch (err) {
    console.error('Error reading images directory:', err);
  }
  return [];
};

const normalizeName = (str) => (str || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

const resolveImageExtension = (name, files) => {
  if (!name) return null;
  // If it's already a full URL or has an extension, return as is
  if (name.startsWith('http') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name)) return name;
  
  const target = normalizeName(name);
  const found = files.find(f => {
    const baseName = f.split('.')[0];
    return normalizeName(baseName) === target || normalizeName(f) === target;
  });

  return found ? `/images/${found}` : `/images/${name}`; // Fallback to original if not found
};

const resolveProductImages = (product) => {
  const files = getAvailableFiles();
  const findFile = (name) => {
    if (!name) return null;
    const target = normalizeName(name);
    return files.find(f => {
      const baseName = f.split('.')[0];
      return normalizeName(baseName) === target || normalizeName(f) === target;
    });
  };

  let resolved = [];
  if (product.imageNames && product.imageNames.length > 0) {
    resolved = product.imageNames.map(name => {
      const found = findFile(name);
      return found ? `/images/${found}` : null;
    }).filter(Boolean);
  }
  
  if (resolved.length === 0 && product.sku) {
    const foundBySku = findFile(product.sku);
    if (foundBySku) resolved.push(`/images/${foundBySku}`);
  }

  if (resolved.length > 0) {
    product.images = resolved;
    product.imageUrl = resolved[0];
  } else {
    // Preserve existing local images if present
    product.images = product.images || [];
    if (product.images.length > 0 && !product.images[0].includes('unsplash')) {
      product.imageUrl = product.images[0];
    } else if (!product.imageUrl || product.imageUrl.includes('unsplash')) {
       product.imageUrl = 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=400';
    }
  }

  return product;
};

const downloadImage = async (url) => {
  if (!url || !url.startsWith('http')) return url;
  
  // Skip if already a local path
  if (url.startsWith('/images/')) return url;

  let downloadUrl = url;
  // Handle Google Drive view links specifically
  if (url.includes('drive.google.com/file/d/')) {
    try {
      const fileId = url.split('/d/')[1].split('/')[0];
      downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    } catch (e) {
      console.error('Error parsing GDrive link:', e);
    }
  }

  try {
    const response = await axios({
      url: downloadUrl,
      method: 'GET',
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const contentType = response.headers['content-type'];
    let extension = 'png';
    if (contentType) {
      if (contentType.includes('jpeg')) extension = 'jpg';
      else if (contentType.includes('png')) extension = 'png';
      else if (contentType.includes('webp')) extension = 'webp';
      else if (contentType.includes('gif')) extension = 'gif';
    }
    
    const filename = `auto-${Date.now()}-${Math.floor(Math.random() * 1000)}.${extension}`;
    const dir = path.join(__dirname, '..', 'public', 'images');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, response.data);
    console.log('Successfully saved remote image to:', filename);
    return `/images/${filename}`;
  } catch (err) {
    console.error(`Failed to download image from ${url}:`, err.message);
    return url; // Return original URL if download fails
  }
};

const processImageFields = async (data) => {
  if (data.imageUrl) {
    data.imageUrl = await downloadImage(data.imageUrl);
  }
  if (data.logoUrl) {
    data.logoUrl = await downloadImage(data.logoUrl);
  }
  if (data.images && Array.isArray(data.images)) {
    data.images = await Promise.all(data.images.map(img => downloadImage(img)));
  }
  // Also check nested variants if any
  if (data.variants && Array.isArray(data.variants)) {
    for (let v of data.variants) {
      if (v.imageUrl) v.imageUrl = await downloadImage(v.imageUrl);
      if (v.images && Array.isArray(v.images)) {
        v.images = await Promise.all(v.images.map(img => downloadImage(img)));
      }
    }
  }
  return data;
};


exports.getDashboardStats = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('userId', 'fullName').sort({ createdAt: -1 });
    const totalOrders = orders.length;
    const gmv = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const activeDeliveries = orders.filter(o => ['picking', 'dispatched', 'Order on way'].includes(o.status)).length;
    const lateOrders = orders.filter(o => o.status === 'Accepted' && (new Date() - o.createdAt) > 3600000).length;

    const hourlyGMV = [{ time: '10:00', amount: 450 }, { time: '15:00', amount: gmv }];
    
    // New stats
    const activeOrders = orders.filter(o => !['Order Delivered', 'Cancelled'].includes(o.status)).length;
    const activeSuppliers = await Supplier.countDocuments({ isActive: true });
    const activeCategories = await Category.countDocuments({ isActive: true });
    
    // Mock delivery time for now, or calculate from delivered orders
    const avgDeliveryTime = '25 mins';

    // Group revenue by day for current week mock
    const revenueData = [
      { day: 'S', revenue: 10000 },
      { day: 'M', revenue: 11000 },
      { day: 'T', revenue: 12000 },
      { day: 'W', revenue: 13000 },
      { day: 'T', revenue: 16000 },
      { day: 'F', revenue: gmv > 0 ? gmv : 14000 },
      { day: 'S', revenue: 15000 },
    ];

    const ordersStatsData = [
      { week: 'Mar\'25 W1', orders: 25, fulfilled: 25, delayed: 5 },
      { week: 'Mar\'25 W2', orders: 32, fulfilled: 30, delayed: 2 },
      { week: 'Mar\'25 W3', orders: 16, fulfilled: 16, delayed: 5 },
      { week: 'Mar\'25 W4', orders: totalOrders > 0 ? totalOrders : 20, fulfilled: orders.filter(o=>o.status==='Order Delivered').length, delayed: lateOrders },
    ];

    // Format top 5 recent orders for the B2B Orders list
    const recentOrders = orders.slice(0, 5).map(o => {
      const name = o.userId && o.userId.fullName ? o.userId.fullName : 'Guest or Unknown';
      const codeArr = name.split(' ');
      const code = codeArr.length > 1 ? (codeArr[0][0] + codeArr[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
      
      return {
        id: o._id,
        name: name,
        date: new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        amount: '+ ' + o.totalAmount.toLocaleString('en-IN'),
        code: code,
        status: o.status
      };
    });

    res.json({ 
      gmv, activeDeliveries, lateOrders, totalOrders, hourlyGMV,
      activeOrders, activeSuppliers, activeCategories, avgDeliveryTime,
      revenueData, ordersStatsData, recentOrders
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    
    // Emit socket event to the customer
    const io = req.app.get('socketio');
    const userId = order.userId?._id ? order.userId._id.toString() : order.userId?.toString();
    
    if (io && userId) {
      console.log(`Emitting status update to customer room: ${userId}`);
      io.of('/customer').to(userId).emit('order-status-update', {
        orderId: order._id,
        status: order.status
      });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFleetStatus = async (req, res) => {
  try {
    res.json(await User.find({ role: 'Rider' }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const ExcelJS = require('exceljs');

exports.bulkUploadProducts = async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No file uploaded.');
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet(1);

    const productMap = new Map();
    const headers = [];
    
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber] = String(cell.value || '').trim();
    });

    const skippedDetails = [];
    let totalRows = 0;

    // Prefetch all available local image files to avoid disk overhead in the loop
    const availableFiles = getAvailableFiles();

    // First Pass: Parse and Group by Product Id
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // Skip headers
      totalRows++;

      const rowData = {};
      row.eachCell((cell, colNumber) => {
        let val = cell.value;
        if (val && typeof val === 'object') {
          if (val.richText) val = val.richText.map(rt => rt.text).join('');
          else if (val.result !== undefined) val = val.result;
        }
        rowData[headers[colNumber]] = val;
      });

      // Flexible attribute getter
      const getVal = (names) => {
        for (let name of names) {
          if (rowData[name] !== undefined && rowData[name] !== null) return rowData[name];
        }
        return null;
      };

      const productId = String(getVal(['Product Id', 'Product ID', 'productId']) || '').trim();
      const variantId = String(getVal(['Variant Id', 'Variant ID', 'variantId']) || '').trim();
      const productCode = String(getVal(['Product Code', 'ProductCode', 'productCode']) || '').trim();
      const productName = String(getVal(['Product Name', 'ProductName', 'Product name']) || '').trim();
      
      if (!productId) {
        skippedDetails.push({ row: rowNumber, name: productName || 'Unknown', reason: 'Missing Product Id' });
        return;
      }

      // Extract Variant Attributes (Variant 1 to Variant 5)
      const attributes = [];
      for (let i = 1; i <= 5; i++) {
        const vName = getVal([`Variant ${i} Name`]);
        const vValue = getVal([`Variant ${i} Value`]);
        if (vName && vValue !== null && vValue !== '') {
          attributes.push({ name: String(vName).trim(), value: String(vValue).trim() });
        }
      }

      // Existing attribute fallbacks for compatibility
      const legacyVTitle = getVal(['Variant Title', 'VariantTitle']);
      if (legacyVTitle && attributes.length === 0) {
        const legacyVValue = getVal(['Variant Value', 'VariantValue']);
        if (legacyVValue !== null) attributes.push({ name: String(legacyVTitle).trim(), value: String(legacyVValue).trim() });
      }

      const imageValue = String(getVal(['Images', 'images', 'Image']) || '').trim();
      const images = imageValue.split(',').map(name => {
        const cleanName = name.trim();
        if (!cleanName) return null;
        return resolveImageExtension(cleanName, availableFiles);
      }).filter(Boolean);

      const variantData = {
        variantId,
        sku: String(getVal(['SKU Number', 'SKU', 'Sku', 'skuNumber']) || '').trim(),
        productId: productId,
        productCode: productCode,
        name: attributes.map(a => `${a.name}: ${a.value}`).join(', ') || 'Standard',
        price: parseFloat(getVal(['Sale Price', 'SalePrice'])) || 0,
        attributes: attributes.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.value }), {}),
        pricing: {
          mrp: parseFloat(getVal(['MRP (Incl GST)', 'MRP', 'mrp'])) || 0,
          salePrice: parseFloat(getVal(['Sale Price', 'SalePrice'])) || 0,
          gst: (() => {
            const v = parseFloat(getVal(['GST', 'gst'])) || 0;
            return v > 0 && v < 1 ? v * 100 : v; // Normalize 0.18 to 18
          })(),
          dealerDiscount: (() => {
            const v = parseFloat(getVal(['Dealer Discount', 'DealerDiscount'])) || 0;
            return v > 0 && v < 1 ? v * 100 : v; // Normalize 0.19 to 19
          })(),
          priceAfterDiscount: parseFloat(getVal(['Price after discount', 'priceAfterDiscount'])) || 0,
          discountValue: parseFloat(getVal(['Discount Value', 'DiscountValue'])) || 0,
          discountRate: (() => {
            const v = parseFloat(getVal(['Discount Rate', 'DiscountRate'])) || 0;
            return Math.abs(v) > 0 && Math.abs(v) < 1 ? v * 100 : v;
          })(),
          buyingPrice: parseFloat(getVal(['Buying Price', 'BuyingPrice'])) || 0,
          revMargin: (() => {
            const v = parseFloat(getVal(['Rev Margin', 'revMargin'])) || 0;
            return v > 0 && v < 1 ? v * 100 : v;
          })(),
          marginValue: parseFloat(getVal(['Margin Value', 'MarginValue'])) || 0,
          sellingMeasureRate: parseFloat(getVal(['Selling Measure Rate', 'SellingMeasureRate'])) || 0
        },
        inventory: {
          packOf: parseInt(getVal(['Pack of', 'PackOf'])) || 1,
          unitWeight: parseFloat(getVal(['Unit Weight \n(in gm)', 'Unit Weight', 'unitWeight'])) || 0,
          bulkApplication: getVal(['Bulk application', 'BulkApplication'])
        },
        measure: {
          value: String(getVal(['Measure Value', 'measureValue']) || '').trim(),
          term: String(getVal(['Measure Term', 'measureTerm']) || '').trim(),
          unit: String(getVal(['Measure', 'Unit', 'unit']) || '').trim()
        },
        meta: {
          suppliedWith: getVal(['Supplied With', 'SuppliedWith']),
          suitableFor: getVal(['Suitable For', 'SuitableFor']),
          warranty: getVal(['Warranty', 'warranty'])
        },
        images
      };

      if (!productMap.has(productId)) {
        productMap.set(productId, {
          productId,
          productData: {
            productName: productName,
            category: String(getVal(['Category', 'category']) || '').trim(),
            subCategory: String(getVal(['Sub Category', 'subCategory']) || '').trim(),
            brand: String(getVal(['Brand', 'brand']) || '').trim(),
            alternateNames: (getVal(['Alternate Names', 'alternateNames']) ? String(getVal(['Alternate Names', 'alternateNames'])).split(',').map(s => s.trim()) : []),
            description: getVal(['Product Description', 'description']),
            productId: productId,
            productCode: productCode,
            hsnCode: String(getVal(['HSN Code', 'hsnCode']) || '').trim(),
            sellingMeasure: getVal(['Selling Measure', 'sellingMeasure']),
            measureValue: getVal(['Measure Value', 'measureValue']),
            sellingMeasureRate: parseFloat(getVal(['Selling Measure Rate', 'sellingMeasureRate'])) || 0,
            deliveryTime: getVal(['Delivery Time', 'deliveryTime']),
            returns: getVal(['Returns', 'returns']),
            logisticsRule: getVal(['Logistics Rule', 'logisticsRule']),
            logisticsCategory: getVal(['Logistics', 'logisticsCategory']) || 'Light',
            status: getVal(['Status', 'status']) || 'In stock',
          },
          variants: [variantData]
        });

        const statusVal = getVal(['Status', 'status']);
        if (statusVal !== null) {
          productMap.get(productId).productData.isActive = String(statusVal).trim().toLowerCase() === 'active';
        }
      } else {
        const p = productMap.get(productId);
        // Fill in missing product metadata if this row has it
        if (!p.productData.productName && productName) p.productData.productName = productName;
        if (!p.productData.category && getVal(['Category'])) p.productData.category = String(getVal(['Category'])).trim();
        
        const statusVal = getVal(['Status', 'status']);
        if (statusVal !== null) {
          p.productData.isActive = String(statusVal).trim().toLowerCase() === 'active';
        }
        
        // Avoid duplicate Variant Ids in the same product group from Excel
        if (variantId && p.variants.some(v => v.variantId === variantId)) {
          skippedDetails.push({ row: rowNumber, name: `PID: ${productId}, VID: ${variantId}`, reason: 'Duplicate Variant Id in Excel for this product' });
        } else {
          p.variants.push(variantData);
        }
      }
    });

    let createdCount = 0;
    let updatedCount = 0;

    // Second Pass: DB Upsert
    for (const item of productMap.values()) {
      const existingProduct = await Product.findOne({ productId: item.productId });

      if (!existingProduct) {
        if (!item.productData.productName || !item.productData.category) {
          skippedDetails.push({ 
            name: `PID: ${item.productId}`, 
            reason: `Missing mandatory fields for creation: ${!item.productData.productName ? 'productName ' : ''}${!item.productData.category ? 'category' : ''}` 
          });
          continue;
        }

        const newProduct = new Product({
          ...item.productData,
          name: item.productData.productName, // Compatibility
          productId: item.productId,
          variants: item.variants,
          imageUrl: item.variants[0]?.images[0] || '',
          price: item.variants[0]?.pricing.salePrice || 0,
          mrp: item.variants[0]?.pricing.mrp || 0,
          salePrice: item.variants[0]?.pricing.salePrice || 0
        });
        await newProduct.save();
        createdCount++;
      } else {
        const updateData = {};
        Object.entries(item.productData).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') updateData[key] = val;
        });
        updateData.name = item.productData.productName; // Compatibility
        Object.assign(existingProduct, updateData);

        const existingVariantsMap = new Map();
        existingProduct.variants.forEach(v => {
          if (v.variantId) existingVariantsMap.set(v.variantId, v);
        });

        for (const incoming of item.variants) {
          if (incoming.variantId && existingVariantsMap.has(incoming.variantId)) {
            Object.assign(existingVariantsMap.get(incoming.variantId), incoming);
          } else {
            existingProduct.variants.push(incoming);
          }
        }

        if (existingProduct.variants.length > 0) {
          const mainVariant = existingProduct.variants[0];
          existingProduct.imageUrl = mainVariant.images[0] || existingProduct.imageUrl;
          existingProduct.price = mainVariant.pricing.salePrice;
          existingProduct.mrp = mainVariant.pricing.mrp;
          existingProduct.salePrice = mainVariant.pricing.salePrice;
        }

        await existingProduct.save();
        updatedCount++;
      }
    }

    res.json({ 
      message: 'Upload complete', 
      summary: { 
        totalRows,
        processedProducts: productMap.size,
        created: createdCount,
        updated: updatedCount,
        skipped: skippedDetails.length,
        extractedFields: [
          'Product Id', 'Variant Id', 'Product Code', 'Category', 'Sub Category', 'Brand', 'Product Name',
          'Alternate Names', 'Variant 1-5 Name/Value', 'Warranty', 'Pack of', 'Unit Weight',
          'Supplied With', 'Suitable For', 'Measure', 'Images', 'HSN Code', 'Selling Measure',
          'Measure Term', 'Measure Value', 'Selling Measure Rate', 'MRP (Incl GST)', 'Dealer Discount',
          'Price after discount', 'GST', 'Buying Price', 'Rev Margin', 'Margin Value', 'Sale Price',
          'Discount Value', 'Discount Rate', 'Delivery Time', 'Logistics Rule', 'Status', 'Product Description'
        ]
      },
      skippedDetails
    });
  } catch (err) {
    console.error('Bulk Upload Error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllProductsAdmin = async (req, res) => {
  try {
    const CATEGORY_MAP = {
      'Wooden Material': '03',
      'Electrical Material': '04',
      'Modular Hardware': '22',
      'Paint': '06',
      'Tools': 'tools',
      'Civil': '26',
      'Bathroom': 'Bathroom',
      'Plumbing': 'Plumbing'
    };
    const reverseMap = {};
    Object.entries(CATEGORY_MAP).forEach(([name, id]) => {
      if (!reverseMap[id] || name.length < reverseMap[id].length) reverseMap[id] = name;
    });

    const products = await Product.find({}).sort({ createdAt: -1 }).lean();
    const hydrated = products.map(p => {
      const p2 = resolveProductImages(p);
      if (reverseMap[p2.category]) p2.category = reverseMap[p2.category];
      return p2;
    });
    
    res.json(hydrated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createHandlers = (Model, name) => ({
  getAll: async (req, res) => { try { res.json(await Model.find({}).sort({ name: 1 })); } catch (err) { res.status(500).json({ error: err.message }); } },
  create: async (req, res) => { 
    try { 
      const processedData = await processImageFields(req.body);
      const d = new Model(processedData); 
      await d.save(); 
      res.status(201).json({ ...d.toObject(), _image_processing: 'Remote images saved locally' }); 
    } catch (err) { res.status(500).json({ error: err.message }); } 
  },
  update: async (req, res) => { 
    try { 
      const processedData = await processImageFields(req.body);
      const d = await Model.findByIdAndUpdate(req.params.id, processedData, { new: true });
      res.json({ ...d.toObject(), _image_processing: 'Remote images saved locally' }); 
    } catch (err) { res.status(500).json({ error: err.message }); } 
  },
  delete: async (req, res) => { try { await Model.findByIdAndDelete(req.params.id); res.json({ message: `${name} deleted` }); } catch (err) { res.status(500).json({ error: err.message }); } }
});

const sh = createHandlers(Supplier, 'Supplier');
exports.getAllSuppliers = sh.getAll; exports.createSupplier = sh.create; exports.updateSupplier = sh.update; exports.deleteSupplier = sh.delete;

const uh = createHandlers(User, 'User');
exports.getAllUsers = uh.getAll;
exports.createUser = uh.create;
exports.updateUser = uh.update;
exports.deleteUser = uh.delete;
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.id }).populate('items.productId');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const ch = createHandlers(Category, 'Category');
exports.getAllCategories = ch.getAll; exports.createCategory = ch.create; exports.updateCategory = ch.update; exports.deleteCategory = ch.delete;

const sch = createHandlers(SubCategory, 'SubCategory');
exports.getAllSubCategories = async (req, res) => {
  try {
    let filter = {};
    if (req.query.categoryId) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.query.categoryId);
      if (isObjectId) {
        filter.categoryId = req.query.categoryId;
      } else {
        // Find category by name if it's not an ID
        const cat = await Category.findOne({ name: req.query.categoryId });
        if (cat) filter.categoryId = cat._id;
        else return res.json([]); // Not found
      }
    }
    res.json(await SubCategory.find(filter).populate('categoryId parentSubCategoryId').sort({ name: 1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createSubCategory = async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.parentSubCategoryId || data.parentSubCategoryId === "") {
      data.parentSubCategoryId = null;
    }
    const d = new SubCategory(data);
    await d.save();
    res.status(201).json(d);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSubCategory = async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.parentSubCategoryId || data.parentSubCategoryId === "") {
      data.parentSubCategoryId = null;
    }
    const d = await SubCategory.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json(d);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSubCategory = sch.delete;

const bh = createHandlers(Brand, 'Brand');
exports.getAllBrands = bh.getAll; exports.createBrand = bh.create; exports.updateBrand = bh.update; exports.deleteBrand = bh.delete;

const uuh = createHandlers(Unit, 'Unit');
exports.getAllUnits = uuh.getAll; exports.createUnit = uuh.create; exports.updateUnit = uuh.update; exports.deleteUnit = uuh.delete;

const vth = createHandlers(SubVariantTitle, 'SubVariantTitle');
exports.getAllVariantTitles = vth.getAll; exports.createVariantTitle = vth.create; exports.updateVariantTitle = vth.update; exports.deleteVariantTitle = vth.delete;

const dth = createHandlers(DeliveryTime, 'DeliveryTime');
exports.getAllDeliveryTimes = dth.getAll; exports.createDeliveryTime = dth.create; exports.updateDeliveryTime = dth.update; exports.deleteDeliveryTime = dth.delete;

const oh = createHandlers(Offer, 'Offer');
exports.getAllOffers = oh.getAll; exports.createOffer = oh.create; exports.updateOffer = oh.update; exports.deleteOffer = oh.delete;

const flh = createHandlers(FooterLink, 'FooterLink');
exports.getAllFooterLinks = flh.getAll; exports.createFooterLink = flh.create; exports.updateFooterLink = flh.update; exports.deleteFooterLink = flh.delete;

exports.createProduct = async (req, res) => { 
  try { 
    const processedData = await processImageFields(req.body);
    const p = new Product(processedData); 
    await p.save(); 
    res.status(201).json({ ...p.toObject(), _image_processing: 'Remote images saved locally' }); 
  } catch (err) { res.status(500).json({ error: err.message }); } 
};
exports.updateProduct = async (req, res) => { 
  try { 
    const processedData = await processImageFields(req.body);
    res.json(await Product.findByIdAndUpdate(req.params.id, processedData, { new: true })); 
  } catch (err) { res.status(500).json({ error: err.message }); } 
};
exports.deleteProduct = async (req, res) => { try { await Product.findByIdAndDelete(req.params.id); res.json({ message: 'Product deleted' }); } catch (err) { res.status(500).json({ error: err.message }); } };
exports.clearAllProducts = async (req, res) => { try { const r = await Product.deleteMany({}); res.json({ message: `Deleted ${r.deletedCount} products.` }); } catch (err) { res.status(500).json({ error: err.message }); } };

exports.uploadProductImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const filename = `${Date.now()}-${req.file.originalname}`;
    const filepath = path.join(__dirname, '..', 'public', 'images', filename);
    
    // Ensure the images directory exists
    const dir = path.join(__dirname, '..', 'public', 'images');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    fs.writeFileSync(filepath, req.file.buffer);
    res.json({ imageUrl: `/images/${filename}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const gstH = createHandlers(GSTClassification, 'GST Classification');
exports.getAllGstClassifications = gstH.getAll; 
exports.createGstClassification = gstH.create; 
exports.updateGstClassification = gstH.update; 
exports.deleteGstClassification = gstH.delete;

const sah = createHandlers(ServiceableArea, 'ServiceableArea');
exports.getAllServiceableAreas = sah.getAll;
exports.createServiceableArea = sah.create;
exports.updateServiceableArea = sah.update;
exports.deleteServiceableArea = sah.delete;

exports.bulkUpdateServiceableAreas = async (req, res) => {
  try {
    const { ids, city, isActive } = req.body;
    let filter = {};
    if (ids) filter = { _id: { $in: ids } };
    else if (city) filter = { city };
    else return res.status(400).json({ error: 'City or IDs required' });
    
    const result = await ServiceableArea.updateMany(filter, { isActive });
    res.json({ message: `Updated ${result.modifiedCount} areas`, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.bulkCreateServiceableAreas = async (req, res) => {
  try {
    const { areas } = req.body; // Array of { pincode, city, state, isActive }
    if (!areas || !Array.isArray(areas)) return res.status(400).json({ error: 'Areas array required' });

    const bulkOps = areas.map(area => ({
      updateOne: {
        filter: { pincode: area.pincode },
        update: { $set: area },
        upsert: true
      }
    }));

    const result = await ServiceableArea.bulkWrite(bulkOps);
    res.json({ 
      message: 'Bulk creation complete', 
      upsertedCount: result.upsertedCount,
      modifiedCount: result.modifiedCount 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.checkServiceability = async (req, res) => {
  try {
    const { pincode } = req.params;
    // Check if it's a 6 digit number
    const isPincode = /^\d{6}$/.test(pincode);
    
    let area;
    if (isPincode) {
        area = await ServiceableArea.findOne({ pincode, isActive: true });
    } else {
        // Treat as city name - check if any pincode in this city is active
        area = await ServiceableArea.findOne({ 
          city: { $regex: new RegExp(`^${pincode}$`, 'i') }, 
          isActive: true 
        });
    }

    if (area) {
      res.json({ serviceable: true, city: area.city });
    } else {
      res.json({ serviceable: false });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Settings Handlers
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({ isServiceEnabled: true });
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({ ...req.body, lastUpdatedBy: req.user.id });
    } else {
      Object.assign(settings, req.body);
      settings.lastUpdatedBy = req.user.id;
    }
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.togglePopularStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    product.isPopular = !product.isPopular;
    await product.save();
    res.json({ message: `Product is now ${product.isPopular ? 'Popular' : 'Standard'}`, isPopular: product.isPopular });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleActiveStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    product.isActive = !product.isActive;
    await product.save();
    res.json({ message: `Product is now ${product.isActive ? 'Active' : 'Hidden'}`, isActive: product.isActive });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSearchLogs = async (req, res) => {
  try {
    const logs = await SearchLog.find().populate('user', 'fullName phoneNumber').sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllReviewsAdmin = async (req, res) => {
  try {
    const Review = require('../models/Review');
    const reviews = await Review.find({}).populate('productId', 'productName').sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteReviewAdmin = async (req, res) => {
  try {
    const Review = require('../models/Review');
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    
    // Recalculate avgRating for the product
    const reviews = await Review.find({ productId: review.productId });
    const avgRating = reviews.length > 0 ? reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length : 0;

    await Product.findByIdAndUpdate(review.productId, {
      avgRating,
      numReviews: reviews.length
    });

    res.json({ message: 'Review deleted and product stats updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.proxyCityPincodes = async (req, res) => {
  try {
    const { city } = req.params;
    const { data } = await axios.get(`https://api.postalpincode.in/postoffice/${encodeURIComponent(city)}`);
    res.json(data);
  } catch (err) {
    console.error('Proxy lookup failed:', err);
    res.status(500).json({ error: 'Failed to fetch pincodes from external service' });
  }
};
