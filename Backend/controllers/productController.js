const Product = require('../models/Product');

exports.getAllProducts = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = { isActive: true };

    if (category) {
      query.csiMasterFormat = { $regex: `^${category}` };
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const products = await Product.find(query);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.autocomplete = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const regex = new RegExp(q, 'i');
    const products = await Product.find({
      $or: [
        { name: regex },
        { sku: regex },
        { csiMasterFormat: regex },
        { description: regex }
      ],
      isActive: true
    }).limit(10).select('name sku csiMasterFormat imageUrl price unitLabel');

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};