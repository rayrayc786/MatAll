const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Product = require('./models/Product');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/matall';

async function seedBulk() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB...');

    await Product.deleteMany({});
    console.log('Cleared existing products...');

    // Use the new master file
    const filePath = path.join(__dirname, '..', 'Final_Full_Product_Master NEW.xlsx');
    if (!fs.existsSync(filePath)) {
      console.error('Master file not found at:', filePath);
      return;
    }
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(sheet);

    console.log(`Processing ${rawData.length} rows from Excel...`);

    const imagesDir = path.join(__dirname, 'public', 'images');
    const imageFilesMap = new Map();
    if (fs.existsSync(imagesDir)) {
      const files = fs.readdirSync(imagesDir);
      files.forEach(file => {
        const ext = path.extname(file);
        const name = path.basename(file, ext);
        imageFilesMap.set(name, file);
      });
      console.log(`Found ${imageFilesMap.size} unique image names in public/images`);
    }

    const productsMap = new Map();

    rawData.forEach((row, index) => {
      const pName = row['Product Name'] || 'Unnamed Product';
      const brand = row['Brand'] || '';
      const cat = String(row['Category'] || '');
      const subCat = String(row['Sub Category'] || '');
      
      const groupKey = `${pName}-${brand}-${cat}-${subCat}`.trim().toLowerCase();
      
      if (!groupKey) return;

      if (!productsMap.has(groupKey)) {
        const altNamesRaw = row['Alternate Names (for search)'] || '';
        const altNames = String(altNamesRaw).split(',').map(n => n.trim()).filter(Boolean);

        productsMap.set(groupKey, {
          productName: pName,
          name: pName, 
          category: cat,
          subCategory: subCat,
          brand: brand,
          alternateNames: altNames,
          description: row['Product Description'] || '',
          productCode: row['Product ID'] || '',
          hsnCode: String(row['HSN Code'] || ''),
          sellingMeasure: row['Selling Measure'] || '',
          deliveryTime: row['Delivery Time'] || '',
          returns: row['Returns'] || '',
          logisticsRule: row['Logistics Rule'] || '',
          status: row['Status'] || 'Active',
          imageUrl: '', 
          price: 0,
          mrp: 0,
          variants: []
        });
      }

      const product = productsMap.get(groupKey);

      // Extract dynamic attributes
      const attributes = {};
      for (let i = 1; i <= 5; i++) {
        let name = row[`Variant ${i} Name`];
        let value = row[`Variant ${i} Value`];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          // If name is missing but value exists, use generic name to avoid overwriting previous attributes
          if (!name || String(name).trim() === '') {
            name = `Attribute ${i}`;
          }
          attributes[name.trim()] = String(value).trim();
        }
      }

      if (row['Size'] && String(row['Size']).trim() !== '' && String(row['Size']).trim().toLowerCase() !== 'size') {
        attributes['Size'] = String(row['Size']).trim();
      }
      const packOf = parseInt(row['Pack of']) || 1;
      if (packOf > 1) {
        attributes['Pack of'] = String(packOf);
      }

      // Images
      const rawImages = row['Images'] ? String(row['Images']).split(',').map(img => img.trim()).filter(Boolean) : [];
      const images = rawImages.map(img => {
        if (img.startsWith('http')) return img;
        let cleanName = img.replace(/^public\/images\//, '').replace(/^images\//, '');
        if (cleanName.includes('.')) return `/images/${cleanName}`;
        if (imageFilesMap.has(cleanName)) return `/images/${imageFilesMap.get(cleanName)}`;
        return `/images/${cleanName}.png`; 
      });

      const variantAttrsString = Object.entries(attributes).map(([k, v]) => `${k}: ${v}`).join(', ');
      const gstVal = parseFloat(row['GST']) || 0;
      const gstPercentage = gstVal < 1 ? gstVal * 100 : gstVal;

      const variant = {
        sku: row['SKU Number'] || row['SKU']  `V-${index}`,
        productCode:  row['Product ID'] || '',
        name: variantAttrsString ? `${product.productName} - ${variantAttrsString}` : product.productName,
        attributes: attributes, 
        pricing: {
          mrp: parseFloat(row['MRP (Incl GST)']) || 0,
          salePrice: parseFloat(row['Sale Price']) || 0,
          dealerDiscount: parseFloat(row['Dealer Discount']) || 0,
          discountValue: parseFloat(row['Discount Value']) || 0,
          discountRate: parseFloat(row['Discount Rate']) || 0,
          gst: gstPercentage,
          buyingPrice: parseFloat(row['Buying Price']) || 0,
          marginValue: parseFloat(row['Margin Value']) || 0,
          sellingMeasureRate: parseFloat(row['Selling Measure Rate']) || 0
        },
        inventory: {
          packOf: packOf,
          unitWeight: parseFloat(row['Unit Weight \r\n(in gm)'] || row['Unit Weight \n(in gm)'] || row['Unit Weight (in gm)']) || 0,
          bulkApplication: row['Application'] || row['Bulk application'] || ''
        },
        measure: {
          value: String(row['Measure Value'] || ''),
          term: row['Measure Term'] || '',
          unit: row['Measure'] || '' // The 'Measure' column usually contains 'sq ft', 'mt', etc.
        },
        meta: {
          suppliedWith: row['Supplied With'] || '',
          suitableFor: row['Suitable For'] || '',
          warranty: row['Warranty'] || ''
        },
        images: images
      };

      product.variants.push(variant);

      if (product.variants.length === 1 || (!product.price && variant.pricing.salePrice)) {
        product.price = variant.pricing.salePrice;
        product.mrp = variant.pricing.mrp;
        product.imageUrl = images[0] || '';
      }
    });

    console.log(`Saving ${productsMap.size} unique products to database...`);
    await Product.insertMany(Array.from(productsMap.values()));
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seedBulk();
