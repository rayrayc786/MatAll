const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const fixIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collections = await db.collections();
    
    for (let c of collections) {
      if (c.collectionName === 'products') {
        const indexes = await c.indexes();
        console.log('Current indexes on products:', indexes.map(i => i.name));
        
        try {
          await c.dropIndex('sku_1');
          console.log('Dropped index sku_1 successfully.');
        } catch (err) {
          console.log('Skipping sku_1 drop:', err.message);
        }
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

fixIndex();
