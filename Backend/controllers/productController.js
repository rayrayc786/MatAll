const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');
const Brand = require('../models/Brand');

// Helper to resolve image names to actual file paths from Image Master
const resolveProductImages = (product) => {
  const imageMasterPath = path.resolve(__dirname, '..', '..', 'Image Master');
  
  let files = [];
  try {
    if (fs.existsSync(imageMasterPath)) {
      files = fs.readdirSync(imageMasterPath);
    }
  } catch (err) {
    console.error('Error reading Image Master directory:', err);
  }

  const normalize = (str) => (str || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

  const findFile = (name) => {
    if (!name) return null;
    const target = normalize(name);
    return files.find(f => {
      const baseName = f.split('.')[0];
      return normalize(baseName) === target || normalize(f) === target;
    });
  };

  const processImageField = (item) => {
    let resolved = [];
    if (item.imageNames && item.imageNames.length > 0) {
      resolved = item.imageNames.map(name => {
        const found = findFile(name);
        return found ? `/images/${found}` : null;
      }).filter(Boolean);
    }
    
    // Fallback to SKU for image matching
    if (resolved.length === 0 && (item.sku || item.productCode)) {
      const foundBySku = findFile(item.sku || item.productCode);
      if (foundBySku) resolved.push(`/images/${foundBySku}`);
    }

    if (resolved.length > 0) {
      item.images = resolved;
      item.imageUrl = resolved[0];
    } else {
      item.images = item.images || [];
      if (!item.imageUrl || item.imageUrl.includes('unsplash')) {
         item.imageUrl = 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=400';
      }
    }
    return item;
  };

  product = processImageField(product);
  if (product.variants && Array.isArray(product.variants)) {
    product.variants = product.variants.map(v => processImageField(v));
  }

  return product;
};

// Helper to group products by Name + Brand (Legacy Support for flat products)
const groupProductsByVariants = (products) => {
  const groupedMap = new Map();
  
  products.forEach(p => {
    // If it's already a grouped product (has variants with attributes or many variants), skip dynamic grouping
    if (p.variants && p.variants.length > 1) {
      const key = `grouped-${p._id}`;
      groupedMap.set(key, p);
      return;
    }

    const baseName = (p.name || '').toString().split('|')[0].trim().toLowerCase();
    const cleanBrand = (p.brand || '').toString().toLowerCase().trim();
    const key = `${cleanBrand}-${baseName}`;
    
    if (!groupedMap.has(key)) {
      const groupHeader = { ...p };
      groupHeader.variants = p.variants && p.variants.length > 0 ? [...p.variants] : [];
      groupedMap.set(key, groupHeader);
    }
    
    const group = groupedMap.get(key);
    let variantName = '';
    const nameParts = (p.name || '').toString().split('|');

    if (nameParts.length > 1) {
      variantName = nameParts[1].trim();
    } else if (p.subVariants?.length > 0) {
      variantName = p.subVariants.map((sv) => sv.value).join(' / ');
    } else if (p.size && p.size !== 'Material' && p.size !== 'Standard') {
      variantName = p.size;
    } else {
      variantName = p.sku || p.productCode;
    }
    
    if (!variantName) variantName = p.sku || p.productCode || 'Standard';

    const exists = group.variants && group.variants.some((v) => v.productCode === p.productCode || v.sku === p.sku || v.name === variantName);
    if (!exists) {
      if (!group.variants) group.variants = [];
      group.variants.push({
        name: variantName,
        price: p.salePrice || p.price,
        mrp: p.mrp || 0,
        sku: p.sku || p.productCode,
        productCode: p.productCode || p.sku,
        _id: p._id,
        image: p.imageUrl,
        unitLabel: p.unitLabel,
        isPopular: p.isPopular
      });
    }

    const groupHasPlaceholder = !group.imageUrl || group.imageUrl.includes('unsplash');
    const pHasRealImg = p.imageUrl && !p.imageUrl.includes('unsplash');
    
    if (groupHasPlaceholder && pHasRealImg) {
      group.imageUrl = p.imageUrl;
      group.images = p.images;
    }
  });

  return Array.from(groupedMap.values());
};

// Shared Hydration utility
const hydrateProduct = (product) => {
  return resolveProductImages(product);
};

exports.getAllProducts = async (req, res) => {
  try {
    const { category, brand, subCategory, search, isPopular } = req.query;
    let query = { isActive: true };

    const CATEGORY_MAP = {
      'Wooden & Boards': '03',
      'Wooden Material': '03',
      'Electricals': '04',
      'Electrical Material': '04',
      'Hardware': '22',
      'Modular Hardware': '22',
      'Paint & POP': '06',
      'Paint': '06',
      'Tiles & Flooring': 'tiles',
      'Power Tools': 'tools',
      'Tools': 'tools',
      'Civil': '26',
      'Bathroom': 'Bathroom',
      'Plumbing': 'Plumbing'
    };

    const getCategoryIdFromName = (name) => CATEGORY_MAP[name] || null;

    if (category) {
      const categoryValues = Array.isArray(category) ? category : [category];
      const queryValues = [];
      categoryValues.forEach(val => {
        queryValues.push(val);
        queryValues.push(val.toLowerCase());
        queryValues.push(val.toUpperCase());
        const id = getCategoryIdFromName(val);
        if (id) queryValues.push(id);
      });
      
      const uniqueValues = Array.from(new Set(queryValues));
      const regexPattern = uniqueValues.map(v => v.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
      query.category = { $regex: new RegExp(`^(${regexPattern})$`, 'i') };
    }
    
    if (brand) {
      const brands = Array.isArray(brand) ? brand : [brand];
      query.brand = { $in: brands };
    }

    if (subCategory) {
      const subCategoriesList = Array.isArray(subCategory) ? subCategory : [subCategory];
      query.subCategory = { $in: subCategoriesList };
    }

    if (isPopular === 'true') {
      query.isPopular = true;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      const orConditions = [
        { productName: regex },
        { brand: regex },
        { subCategory: regex },
        { category: regex },
        { 'variants.name': regex },
        { 'variants.productCode': regex },
        { 'variants.sku': regex }
      ];

      Object.entries(CATEGORY_MAP).forEach(([name, id]) => {
        if (name.toLowerCase().includes(search.toLowerCase())) {
          orConditions.push({ category: id });
        }
      });

      query.$or = orConditions;
    }

    let products = await Product.find(query).lean();
    const hydrated = products.map(p => {
      const h = hydrateProduct(p);
      if (p.subCategory && !h.subCategory) h.subCategory = p.subCategory;
      return h;
    });

    hydrated.sort((a, b) => {
      const aHasImg = a.imageUrl && !a.imageUrl.includes('unsplash');
      const bHasImg = b.imageUrl && !b.imageUrl.includes('unsplash');
      if (aHasImg && !bHasImg) return -1;
      if (!aHasImg && bHasImg) return 1;
      return 0;
    });

    res.json(hydrated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    const hydrated = hydrateProduct(product);
    res.json(hydrated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.autocomplete = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const regex = new RegExp(q, 'i');
    let products = await Product.find({
      $or: [
        { productName: regex },
        { brand: regex },
        { subCategory: regex },
        { category: regex },
        { 'variants.name': regex },
        { 'variants.productCode': regex },
        { 'variants.sku': regex }
      ],
      isActive: true
    }).limit(10).lean();

    const hydrated = products.map(hydrateProduct);
    res.json(hydrated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFilters = async (req, res) => {
  try {
    const brands = await Product.distinct('brand', { isActive: true });
    const categories = await Product.distinct('category', { isActive: true });
    const subCategories = await Product.distinct('subCategory', { isActive: true });
    
    res.json({
      brands: brands.filter(Boolean).sort(),
      categories: categories.filter(Boolean).sort(),
      subCategories: subCategories.filter(Boolean).sort()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.togglePopularStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.isPopular = !product.isPopular;
    await product.save();

    res.json({ message: `Product is now ${product.isPopular ? 'Popular' : 'Standard'}`, isPopular: product.isPopular });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBrands = async (req, res) => {
  try {
    const { isFeatured } = req.query;
    let query = { isActive: true };
    if (isFeatured === 'true' || isFeatured === true) {
      query.isFeatured = true;
    }
    
    const brands = await Brand.find(query).sort({ name: 1 });
    res.json(brands);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const { isFeatured } = req.query;
    let query = { isActive: true };
    if (isFeatured === 'true' || isFeatured === true) {
      query.isFeatured = true;
    }
    
    const Category = require('../models/Category');
    const categories = await Category.find(query).sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOffers = async (req, res) => {
  try {
    const Offer = require('../models/Offer');
    res.json(await Offer.find({ isActive: true }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
