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
    const filePath = path.join(__dirname, '..', 'SAFE_Cleaned_Product_Master.xlsx');
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(sheet);

    console.log(`Processing ${rawData.length} rows...`);

    // Create a map of existing filenames in public/images (name without ext -> full filename)
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
      // Grouping logic: Same Product Name + Brand + Category + Sub Category
      const groupKey = `${row['Product Name']}-${row['Brand']}-${row['Category']}-${row['Sub Category']}`.trim().toLowerCase();
      if (!groupKey) return; 

      if (!productsMap.has(groupKey)) {
        productsMap.set(groupKey, {
          productId: row['Product ID'],
          name: row['Product Name'] || 'Unnamed Product',
          productName: row['Product Name'] || 'Unnamed Product',
          category: String(row['Category'] || ''),
          subCategory: String(row['Sub Category'] || ''),
          brand: row['Brand'] || '',
          description: row['Product Description'] || '',
          hsnCode: String(row['HSN Code'] || ''),
          sellingMeasure: row['Selling Measure'] || '',
          measureTerm: row['Measure Term'] || '',
          measureValue: String(row['Measure Value'] || ''),
          deliveryTime: row['Delivery Time'] || '',
          logisticsRule: row['Logistics Rule'] || '',
          status: row['Status'] || 'Active',
          imageUrl: '', 
          price: 0,
          variants: []
        });
      }

      const product = productsMap.get(groupKey);

      // Extract dynamic attributes as an Object
      const attributes = {};
      let lastAttrName = '';
      for (let i = 1; i <= 5; i++) {
        let name = row[`Variant ${i} Name`];
        let value = row[`Variant ${i} Value`];

        if (value !== undefined && value !== null && String(value).trim() !== '') {
          if (!name || String(name).trim() === '') {
            name = lastAttrName || `Attribute ${i}`;
          } else {
            lastAttrName = name;
          }
          attributes[name.trim()] = String(value).trim();
        }
      }

      // Add "Size" if exists
      if (row['Size'] && String(row['Size']).trim() !== '' && String(row['Size']).trim().toLowerCase() !== 'size') {
        attributes['Size'] = String(row['Size']).trim();
      }

      // Add "Pack of" if exists and > 1
      const packOf = parseInt(row['Pack of']) || 1;
      if (packOf > 1) {
        attributes['Pack of'] = String(packOf);
      }

      // Handle images mapping
      const rawImages = row['Images'] ? String(row['Images']).split(',').map(img => img.trim()).filter(Boolean) : [];
      const images = rawImages.map(img => {
        if (img.startsWith('http')) return img;
        let cleanName = img.replace(/^public\/images\//, '').replace(/^images\//, '');
        if (cleanName.includes('.')) return `/images/${cleanName}`;
        if (imageFilesMap.has(cleanName)) {
          return `/images/${imageFilesMap.get(cleanName)}`;
        }
        return `/images/${cleanName}.png`; 
      });

      // Prepare variant
      const variantAttrsString = Object.entries(attributes)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');

      const gstVal = parseFloat(row['GST']) || 0;
      // If GST is provided as 0.18, we want it as 18 for DB consistency with frontend expectation of percentage
      const gstPercentage = gstVal < 1 ? gstVal * 100 : gstVal;

      const variant = {
        sku: row['Product Code'] || `V-${row['Product ID']}-${product.variants.length + 1}`,
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
          marginValue: parseFloat(row['Margin Value']) || 0
        },
        inventory: {
          packOf: packOf,
          unitWeight: parseFloat(row['Unit Weight \n(in gm)']) || 0,
          bulkApplication: row['Application'] || ''
        },
        meta: {
          suppliedWith: row['Supplied With'] || '',
          suitableFor: row['Suitable For'] || ''
        },
        images: images
      };

      if (product.variants.length === 0) {
        product.imageUrl = variant.images[0] || '';
        product.price = variant.pricing.salePrice;
      }

      product.variants.push(variant);
    });

    console.log(`Successfully grouped into ${productsMap.size} unique products.`);

    const bulkData = Array.from(productsMap.values());
    
    // Save in chunks
    const chunkSize = 100;
    for (let i = 0; i < bulkData.length; i += chunkSize) {
      const chunk = bulkData.slice(i, i + chunkSize);
      await Product.insertMany(chunk);
      console.log(`Inserted chunk ${Math.floor(i / chunkSize) + 1}...`);
    }

    console.log('Bulk seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seedBulk();
