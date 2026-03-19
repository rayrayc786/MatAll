const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const xlsx = require('xlsx');

exports.getDashboardStats = async (req, res) => {
  try {
    const orders = await Order.find({});
    const totalOrders = orders.length;
    const gmv = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const activeDeliveries = orders.filter(o => ['picking', 'dispatched'].includes(o.status)).length;
    const lateOrders = orders.filter(o => o.status === 'pending' && (new Date() - o.createdAt) > 3600000).length; // Older than 1hr

    // Hourly GMV (mocking data for the last 6 hours)
    const hourlyGMV = [
      { time: '10:00', amount: 450 },
      { time: '11:00', amount: 800 },
      { time: '12:00', amount: 1200 },
      { time: '13:00', amount: 950 },
      { time: '14:00', amount: 1500 },
      { time: '15:00', amount: gmv },
    ];

    res.json({
      gmv,
      activeDeliveries,
      lateOrders,
      totalOrders,
      hourlyGMV
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFleetStatus = async (req, res) => {
  try {
    const drivers = await User.find({ role: 'Driver' });
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.bulkUploadProducts = async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No file uploaded.');

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    const products = data.map(item => ({
      name: item.Name,
      sku: item.SKU,
      description: item.Description,
      unitType: item.UnitType || 'individual',
      unitLabel: item.UnitLabel || 'unit',
      weightPerUnit: parseFloat(item.Weight) || 0,
      volumePerUnit: parseFloat(item.Volume) || 0,
      price: parseFloat(item.Price) || 0,
      imageUrl: item.ImageURL || 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=400',
      csiMasterFormat: item.CSI,
      isActive: true
    }));

    await Product.insertMany(products, { ordered: false });
    res.json({ message: `${products.length} products uploaded successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
