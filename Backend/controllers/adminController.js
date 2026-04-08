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


// Inline Revenue Margin mapping if sheet exists
let globalMarginMap = new Map();

// Helper to resolve image names to actual file paths from public/images
const resolveProductImages = (product) => {
  const imgDir = path.join(__dirname, '..', 'public', 'images');
  let files = [];
  try {
    if (fs.existsSync(imgDir)) {
      files = fs.readdirSync(imgDir);
    }
  } catch (err) {
    console.error('Error reading images directory:', err);
  }

  const normalize = (str) => (str || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

  const findFile = (name) => {
    if (!name) return null;
    const target = normalize(name);
    return files.find(f => {
      const baseName = f.split('.')[0];
      return normalize(baseName) === target || normalize(f) === target;
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
    product.images = product.images || [];
    if (!product.imageUrl || product.imageUrl.includes('unsplash')) {
       product.imageUrl = 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=400';
    }
  }

  return product;
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
    // Using buffer for multer setup (can move to stream if file is very large)
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet(1);

    const productGroups = new Map();
    const headers = [];
    
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber] = String(cell.value || '').trim();
    });

    const skippedDetails = [];
    let totalRows = 0;

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // Skip headers
      totalRows++;

      const rowData = {};
      row.eachCell((cell, colNumber) => {
        let val = cell.value;
        if (val && typeof val === 'object') {
          if (val.richText) {
            val = val.richText.map(rt => rt.text).join('');
          } else if (val.result !== undefined) {
            val = val.result;
          }
        }
        rowData[headers[colNumber]] = val;
      });

      const category = String(rowData['Category'] || '').trim();
      const subCategory = String(rowData['Sub Category'] || '').trim();
      const brand = String(rowData['Brand'] || '').trim();
      const productName = String(rowData['Product Name'] || '').trim();

      if (!category || !subCategory || !productName) {
        skippedDetails.push({
          row: rowNumber,
          name: productName || 'Unnamed',
          reason: `Missing mandatory fields: ${!category ? 'Category ' : ''}${!subCategory ? 'SubCategory ' : ''}${!productName ? 'ProductName' : ''}`
        });
        return;
      }

      const groupKey = `${category}_${subCategory}_${brand}_${productName}`;

      // Attribute Mapping
      const attributes = [];
      if (rowData['Variant Title'] && rowData['Variant Value'] !== undefined) {
        attributes.push({ name: String(rowData['Variant Title']).trim(), value: String(rowData['Variant Value']).trim() });
      }
      if (rowData['Size']) {
        attributes.push({ name: 'Size', value: String(rowData['Size']).trim() });
      }
      if (rowData['Sub Variant Title'] && rowData['Sub Variant Value'] !== undefined) {
        attributes.push({ name: String(rowData['Sub Variant Title']).trim(), value: String(rowData['Sub Variant Value']).trim() });
      }

      const variantToken = attributes.map(a => `${a.name}:${a.value}`).sort().join('|');

      const imageValue = String(rowData['Images'] || '').trim();
      const images = imageValue.split(',').map(name => {
        const cleanName = name.trim();
        if (!cleanName) return null;
        if (cleanName.startsWith('http') || cleanName.startsWith('/images/')) return cleanName;
        return `/images/${cleanName}`;
      }).filter(Boolean);

      const variant = {
        sku: String(rowData['Product Code (SKU)'] || rowData['SKU'] || '').trim(),
        name: attributes.map(a => `${a.name}: ${a.value}`).join(', ') || 'Standard',
        price: parseFloat(rowData['Sale Price']) || 0,
        attributes,
        pricing: {
          mrp: parseFloat(rowData['MRP']) || 0,
          salePrice: parseFloat(rowData['Sale Price']) || 0,
          gst: parseFloat(rowData['GST']) || 0,
          dealerDiscount: parseFloat(rowData['Dealer Discount']) || 0,
          discountValue: parseFloat(rowData['Discount Value']) || 0,
          discountRate: parseFloat(rowData['Discount Rate']) || 0,
          buyingPrice: parseFloat(rowData['Buying Price']) || 0,
          marginValue: parseFloat(rowData['Margin Value']) || 0
        },
        inventory: {
          packOf: parseInt(rowData['Pack of']) || 1,
          unitWeight: parseFloat(rowData['Unit Weight']) || 0,
          bulkApplication: rowData['Bulk application']
        },
        meta: {
          suppliedWith: rowData['Supplied With'],
          suitableFor: rowData['Suitable For']
        },
        images
      };

      if (!productGroups.has(groupKey)) {
        productGroups.set(groupKey, {
          productName,
          category,
          subCategory,
          brand,
          alternateNames: (rowData['Alternate Names'] ? String(rowData['Alternate Names']).split(',').map(s => s.trim()) : []),
          description: rowData['Product Description'],
          hsnCode: String(rowData['HSN Code'] || '').trim(),
          sellingMeasure: rowData['Selling Measure'],
          measureTerm: rowData['Measure Term'],
          measureValue: rowData['Measure Value'],
          deliveryTime: rowData['Delivery Time'],
          returns: rowData['Returns'],
          logisticsRule: rowData['Logistics Rule'],
          status: rowData['Status'] || 'In stock',
          variants: [variant],
          variantTokens: new Set([variantToken]),
          price: variant.pricing.salePrice,
          salePrice: variant.pricing.salePrice,
          mrp: variant.pricing.mrp,
          imageUrl: images[0] || '',
          images: images
        });
      } else {
        const product = productGroups.get(groupKey);
        if (!product.variantTokens.has(variantToken)) {
          product.variants.push(variant);
          product.variantTokens.add(variantToken);
          if (variant.pricing.salePrice < product.price) {
            product.price = variant.pricing.salePrice;
          }
        } else {
          skippedDetails.push({ 
            row: rowNumber, 
            name: `${productName} (${variant.name})`, 
            reason: 'Duplicate variant for this product' 
          });
        }
      }
    });

    const bulkOps = Array.from(productGroups.values()).map(p => {
      delete p.variantTokens;
      return {
        updateOne: {
          filter: { productName: p.productName, category: p.category, subCategory: p.subCategory, brand: p.brand },
          update: { $set: p },
          upsert: true
        }
      };
    });

    const result = await Product.bulkWrite(bulkOps);

    res.json({ 
      message: 'Upload complete', 
      summary: { 
        totalRows,
        extracted: totalRows - skippedDetails.length,
        skipped: skippedDetails.length,
        totalGroups: productGroups.size, 
        upserted: result.upsertedCount, 
        modified: result.modifiedCount 
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
  create: async (req, res) => { try { const d = new Model(req.body); await d.save(); res.status(201).json(d); } catch (err) { res.status(500).json({ error: err.message }); } },
  update: async (req, res) => { try { res.json(await Model.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch (err) { res.status(500).json({ error: err.message }); } },
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

exports.createProduct = async (req, res) => { try { const p = new Product(req.body); await p.save(); res.status(201).json(p); } catch (err) { res.status(500).json({ error: err.message }); } };
exports.updateProduct = async (req, res) => { try { res.json(await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch (err) { res.status(500).json({ error: err.message }); } };
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

exports.checkServiceability = async (req, res) => {
  try {
    const { pincode } = req.params;
    const area = await ServiceableArea.findOne({ pincode, isActive: true });
    if (area) {
      res.json({ serviceable: true, city: area.city });
    } else {
      res.json({ serviceable: false });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

