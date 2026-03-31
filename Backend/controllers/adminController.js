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

exports.bulkUploadProducts = async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No file uploaded.');
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const dataSheet = workbook.Sheets['Data'] || workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(dataSheet);

    const gstSheet = workbook.Sheets['GST & Classification'] || workbook.Sheets['GST'];
    const marginSheet = workbook.Sheets['Revenue Margin'];
    
    const gstMappingRaw = gstSheet ? xlsx.utils.sheet_to_json(gstSheet) : [];
    const marginMappingRaw = marginSheet ? xlsx.utils.sheet_to_json(marginSheet) : [];

    const extracted = [], skipped = [], seenSkus = new Set();
    const masterData = { categories: new Set(), subCategories: new Map(), brands: new Set(), variantTitles: new Set(), deliveryTimes: new Set() };

    let availableImages = [];
    try {
      const imgDir = path.join(__dirname, '..', 'public', 'images');
      if (fs.existsSync(imgDir)) {
        availableImages = fs.readdirSync(imgDir);
      }
    } catch(err) {
      console.error('Error reading images directory', err);
    }

    // Sync GST Classification Sheet
    if (gstMappingRaw.length > 0) {
      const gstOps = gstMappingRaw.map(item => ({
        updateOne: {
          filter: { category: String(item['Category']).trim(), subCategory: String(item['Sub Category']).trim() },
          update: { 
            $set: { 
              gst: parseFloat(item['GST']) || 0, 
              hsnCode: String(item['HSN Code'] || '').trim() 
            }
          },
          upsert: true
        }
      }));
      await GSTClassification.bulkWrite(gstOps);
    }

    if (marginMappingRaw.length > 0) {
      marginMappingRaw.forEach(m => {
          const key = `${String(m['Category']).trim()}|${String(m['Sub Category']).trim()}`;
          globalMarginMap.set(key, parseFloat(m['Rev Margin']) || 0);
      });
    }

    const availableGstMaps = await GSTClassification.find({});
    const gstLookup = new Map(availableGstMaps.map(g => [`${g.category}|${g.subCategory}`, g]));

    const CATEGORY_MAP = {
      'Wooden Material': '03',
      'Electrical Material': '04',
      'Modular Hardware': '22',
      'Paint': '06',
      'Tools': 'tools',
      'Civil': '26',
      'Bathroom': 'Bathroom',
      'Plumbing': 'Plumbing',
      'Wooden & Boards': '03',
      'Electricals': '04',
      'Hardware': '22',
      'Paint & POP': '06',
      'Tiles & Flooring': 'tiles',
      'Power Tools': 'tools'
    };
    const reverseMap = {};
    Object.entries(CATEGORY_MAP).forEach(([name, id]) => {
      // Prioritize shorter, nicer names for display
      if (!reverseMap[id] || name.length < reverseMap[id].length) {
        reverseMap[id] = name;
      }
    });

    data.forEach((item, index) => {
      const sku = String(item['Product Code'] || item['SKU'] || '').trim();
      seenSkus.add(sku);

      const cat = String(item['Category'] || '').trim();
      const subCat = String(item['Sub Category'] || '').trim();
      if (cat) {
        masterData.categories.add(cat);
        if (subCat) {
          if (!masterData.subCategories.has(cat)) masterData.subCategories.set(cat, new Set());
          masterData.subCategories.get(cat).add(subCat);
        }
      }
      if (item['Brand']) masterData.brands.add(String(item['Brand']).trim());
      if (item['Delivery Time']) masterData.deliveryTimes.add(String(item['Delivery Time']).trim());

      const subVariants = [];
      if (item['Size']) {
        masterData.variantTitles.add(String(item['Size']).trim());
        if (item['Sub Variant Value']) subVariants.push({ title: String(item['Size']), value: String(item['Sub Variant Value']) });
      }
      
      const titles = Object.keys(item).filter(k => k.startsWith('Sub Variant Title')).sort();
      const values = Object.keys(item).filter(k => k.startsWith('Sub Variant Value')).filter(k => k !== 'Sub Variant Value').sort();
      titles.forEach((t, i) => {
        if (item[t]) {
          masterData.variantTitles.add(String(item[t]).trim());
          if (values[i] && item[values[i]]) subVariants.push({ title: String(item[t]), value: String(item[values[i]]) });
        }
      });

      const imageKey = Object.keys(item).find(k => {
        const lk = k.trim().toLowerCase();
        return lk === 'images' || lk === 'image' || lk === 'product images' || lk.includes('images left');
      });
      const imageValue = imageKey && item[imageKey] ? String(item[imageKey]).trim() : '';
      const rawImageNames = imageValue.split(',').map(s => s.trim()).filter(Boolean);
      
      const images = rawImageNames.map(name => {
        if (name.indexOf('://') !== -1 || name.startsWith('data:')) return name;
        if (name.startsWith('/')) return name;
        const matchedImage = availableImages.find(f => {
          const fileNameWithoutExt = f.substring(0, f.lastIndexOf('.'));
          return f.toLowerCase().includes(name.toLowerCase()) || (fileNameWithoutExt && fileNameWithoutExt.toLowerCase() === name.toLowerCase());
        });
        return matchedImage ? `/images/${matchedImage}` : `/images/${name}`;
      });

      const mrp = parseFloat(String(item['MRP (Incl GST)'] || 0).replace(/,/g, ''));
      const salePrice = parseFloat(item['Sale Price']) || 0;
      
      // Resolve GST and Margin from Classification Sheet primarily, fallback to Data sheet
      const mappedGst = gstLookup.get(`${cat}|${subCat}`);
      const gstRate = mappedGst ? mappedGst.gst : (parseFloat(item['GST']) || 0);
      const hsnCode = mappedGst ? mappedGst.hsnCode : (item['HSN Code'] || '');
      
      const revMargin = globalMarginMap.get(`${cat}|${subCat}`) || parseFloat(item['Rev Margin']) || 0;

      const igst = gstRate;
      const cgst = gstRate / 2;
      const sgst = gstRate / 2;
      const basePrice = salePrice / (1 + (gstRate / 100));

      extracted.push({
        name: item['Product Name'] || 'Unnamed Product',
        sku,
        category: cat,
        subCategory: subCat,
        brand: item['Brand'],
        size: item['Size'],
        productCode: sku,
        packOf: parseInt(item['Pack of']) || 1,
        bulkApplication: item['Bulk application'],
        unitWeightGm: parseFloat(String(item['Unit Weight (in gm)'] || item['Unit Weight \r\n(in gm)'] || '0').replace(/,/g, '')) || 0,
        suppliedWith: item['Supplied With'],
        suitableFor: item['Suitable For'],
        measure: item['Measure'],
        images,
        imageNames: rawImageNames,
        hsnCode,
        sellingMeasure: item['Selling Measure'],
        measureTerm: item['Measure Term'],
        measureValue: item['Measure Value'],
        sellingMeasureRate: parseFloat(item['Selling Measure Rate']) || 0,
        subVariants, // ATTACH SUBVARIANTS HERE
        mrp: mrp || 0,
        dealerDiscount: parseFloat(item['Dealer Discount']) || 0,
        priceAfterDiscount: parseFloat(item['Price after discount']) || 0,
        igst: igst || 0,
        cgst: cgst || 0,
        sgst: sgst || 0,
        buyingPrice: parseFloat(item['Buying Price']) || 0,
        revMargin: revMargin,
        marginValue: parseFloat(item['Margin Value']) ||  (salePrice * revMargin),
        salePrice: salePrice || 0,
        price: salePrice || 0,
        basePrice: basePrice || 0,
        discountValue: parseFloat(item['Discount Value']) || 0,
        discountRate: parseFloat(item['Discount Rate']) || 0,
        deliveryTime: item['Delivery Time'],
        returns: item['Returns'],
        logisticsRule: item['Logistics Rule'],
        status: item['Status'] || 'In stock',
        productDescription: item['Product Description'],
        imageUrl: images.length > 0 ? images[0] : undefined,
        unitType: 'individual', unitLabel: 'unit', isActive: true,
      });
    });

    // Sync Master Data
    await Promise.all(Array.from(masterData.categories).map(name => Category.updateOne({ name }, { $setOnInsert: { name, isActive: true } }, { upsert: true })));
    const catMap = new Map((await Category.find({ name: { $in: Array.from(masterData.categories) } })).map(c => [c.name, c._id]));
    
    const subCatOps = [];
    masterData.subCategories.forEach((subs, catName) => {
      const catId = catMap.get(catName);
      if (catId) subs.forEach(name => subCatOps.push(SubCategory.updateOne({ name, categoryId: catId }, { $setOnInsert: { name, categoryId: catId, isActive: true } }, { upsert: true })));
    });
    
    await Promise.all([
      ...subCatOps,
      ...Array.from(masterData.brands).map(name => Brand.updateOne({ name }, { $setOnInsert: { name, isActive: true } }, { upsert: true })),
      ...Array.from(masterData.variantTitles).map(name => SubVariantTitle.updateOne({ name }, { $setOnInsert: { name, isActive: true } }, { upsert: true })),
      ...Array.from(masterData.deliveryTimes).map(name => DeliveryTime.updateOne({ name }, { $setOnInsert: { name, isActive: true } }, { upsert: true }))
    ]);

    // Always insert new products as separate entries (allow duplicates as requested)
    const bulkOps = extracted.map(p => ({ insertOne: { document: p } }));
    const result = await Product.bulkWrite(bulkOps);
    res.json({ message: 'Upload complete', summary: { totalRows: data.length, extracted: extracted.length, skipped: data.length - extracted.length, matched: result.matchedCount, upserted: result.upsertedCount, modified: result.modifiedCount }, skippedDetails: skipped });
  } catch (err) {
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
