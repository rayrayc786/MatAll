const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function dropIndex() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get the products collection
    const collection = mongoose.connection.collection('products');
    
    console.log('Dropping sku_1 index...');
    await collection.dropIndex('sku_1');
    console.log('Successfully dropped sku_1 index');

  } catch (err) {
    if (err.codeName === 'IndexNotFound' || err.message.includes('not found')) {
      console.log('Index sku_1 not found, nothing to drop.');
    } else {
      console.error('Error dropping index:', err);
    }
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

dropIndex();
