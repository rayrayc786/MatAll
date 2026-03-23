require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
const Product = require('./models/Product');

async function reseedData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    const workbook = xlsx.readFile(path.join(__dirname, '..', 'Data new.xlsx'));
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    console.log(`Processing ${data.length} rows from Excel...`);

    let updatedCount = 0;
    for (const item of data) {
      const sku = String(item['Product Code'] || '').trim();
      const imageValue = String(item['IMAGES 5 Images left'] || '').trim();
      const mrpRaw = item['MRP \n(Incl GST)'] || item['MRP \r\n(Incl GST)'] || item['MRP'] || 0;
      const mrp = typeof mrpRaw === 'string' ? parseFloat(mrpRaw.replace(/,/g, '')) : parseFloat(mrpRaw);
      
      if (sku) {
        const updateData = {};
        if (imageValue) {
          updateData.imageNames = imageValue.split(',').map(s => s.trim()).filter(Boolean);
        }
        if (!isNaN(mrp)) {
          updateData.mrp = mrp;
        }
        
        if (Object.keys(updateData).length > 0) {
          const result = await Product.updateOne(
            { sku: sku },
            { $set: updateData }
          );

          if (result.modifiedCount > 0) {
            updatedCount++;
          }
        }
      }
    }

    console.log(`Successfully updated ${updatedCount} products with new data.`);
    process.exit(0);
  } catch (err) {
    console.error('Reseed failed:', err);
    process.exit(1);
  }
}

reseedData();
