const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const Product = require('../models/Product');

async function reseedData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    const workbook = xlsx.readFile(path.join(__dirname, '..', '..', 'Data new.xlsx'));
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    const fs = require('fs');
    const imageDirPath = path.join(__dirname, '..', 'public', 'images');
    const files = fs.existsSync(imageDirPath) ? fs.readdirSync(imageDirPath) : [];

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
          const rawImageNames = imageValue.split(',').map(s => s.trim()).filter(Boolean);
          updateData.imageNames = rawImageNames;
          
          let matchedImages = rawImageNames.map(name => {
            const found = files.find(f => {
              const parts = f.split('.');
              const baseName = parts.length > 1 ? parts.slice(0, -1).join('.') : f;
              const fullName = f.toLowerCase();
              const searchName = name.toLowerCase();
              return baseName.toLowerCase() === searchName || fullName === searchName;
            });
            return found ? `/images/${found}` : null;
          }).filter(Boolean);

          if (matchedImages.length === 0) {
             const foundBySku = files.find(f => f.split('.')[0].toLowerCase() === sku.toLowerCase());
             if (foundBySku) matchedImages.push(`/images/${foundBySku}`);
          }

          updateData.images = matchedImages;
          if (matchedImages.length > 0) {
            updateData.imageUrl = matchedImages[0];
          }
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
