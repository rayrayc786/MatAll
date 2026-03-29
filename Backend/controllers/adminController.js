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

exports.getDashboardStats = async (req, res) => {
  try {
    const orders = await Order.find({});
    const totalOrders = orders.length;
    const gmv = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const activeDeliveries = orders.filter(o => ['picking', 'dispatched'].includes(o.status)).length;
    const lateOrders = orders.filter(o => o.status === 'pending' && (new Date() - o.createdAt) > 3600000).length;

    const hourlyGMV = [{ time: '10:00', amount: 450 }, { time: '15:00', amount: gmv }];
    res.json({ gmv, activeDeliveries, lateOrders, totalOrders, hourlyGMV });
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
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    const imageDirPath = path.join(__dirname, '..', 'public', 'images');
    const files = fs.existsSync(imageDirPath) ? fs.readdirSync(imageDirPath) : [];

    const extracted = [], skipped = [], seenSkus = new Set();
    const masterData = { categories: new Set(), subCategories: new Map(), brands: new Set(), variantTitles: new Set(), deliveryTimes: new Set() };

    data.forEach((item, index) => {
      const sku = String(item['Product Code'] || '').trim();
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

      const imageValue = String(item['IMAGES 24 Images left'] || item['image'] || item['Image'] || item['Images'] || '').trim();
      const rawImageNames = imageValue.split(',').map(s => s.trim()).filter(Boolean);
      
      let images = rawImageNames.map(name => {
        // Try to find a file that matches the name (with or without extension)
        const found = files.find(f => {
          const parts = f.split('.');
          const baseName = parts.length > 1 ? parts.slice(0, -1).join('.') : f;
          const fullName = f.toLowerCase();
          const searchName = name.toLowerCase();
          return baseName.toLowerCase() === searchName || fullName === searchName;
        });
        return found ? `/images/${found}` : null;
      }).filter(Boolean);

      // Fallback 1: Match by SKU or Product Code
      if (images.length === 0 && sku) {
        const foundBySku = files.find(f => {
          const parts = f.split('.');
          const baseName = parts.length > 1 ? parts.slice(0, -1).join('.') : f;
          return baseName.toLowerCase() === sku.toLowerCase();
        });
        if (foundBySku) images.push(`/images/${foundBySku}`);
      }

      // Fallback 2: Fuzzy match by Product Name or SKU substrings
      if (images.length === 0) {
        const name = String(item['Product Name'] || '').toLowerCase();
        const foundFuzzy = files.find(f => {
          const fLow = f.toLowerCase();
          // Check if file name contains SKU or if SKU contains file name (min 4 chars)
          if (sku && sku.length > 3 && (fLow.includes(sku.toLowerCase()) || sku.toLowerCase().includes(fLow.split('.')[0]))) return true;
          // Check if file name contains product name or vice-versa
          if (name && name.length > 5 && (fLow.includes(name) || name.includes(fLow.split('.')[0]))) return true;
          return false;
        });
        if (foundFuzzy) images.push(`/images/${foundFuzzy}`);
      }

      const mrpRaw = item['MRP \n(Incl GST)'] || item['MRP \r\n(Incl GST)'] || item['MRP'] || 0;
      const mrp = typeof mrpRaw === 'string' ? parseFloat(mrpRaw.replace(/,/g, '')) : parseFloat(mrpRaw);

      extracted.push({
        name: item['Product Name'] || 'Unnamed Product', sku, 
        category: cat, subCategory: subCat, brand: item['Brand'], size: item['Size'],
        productCode: sku, mrp: mrp || 0,
        salePrice: parseFloat(item['Sale Price']) || 0, price: parseFloat(item['Sale Price']) || 0,
        deliveryTime: item['Delivery Time'], subVariants, images, imageNames: rawImageNames,
        imageUrl: images.length > 0 ? images[0] : undefined, // Let default handle if truly empty, but we try harder now
        unitType: 'individual', unitLabel: 'unit', isActive: true
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
    res.json({ message: 'Upload complete', summary: { totalRows: data.length, extracted: extracted.length, skipped: skipped.length, matched: result.matchedCount, upserted: result.upsertedCount, inserted: result.insertedCount }, skippedDetails: skipped });
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
