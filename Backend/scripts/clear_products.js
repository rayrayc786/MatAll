const mongoose = require('mongoose');
const Product = require('../models/Product');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function clear() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');
    const result = await Product.deleteMany({});
    console.log(`Deleted ${result.deletedCount} products.`);
    process.exit(0);
  } catch (err) {
    console.error('Clear failed:', err);
    process.exit(1);
  }
}

clear();
