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

  let resolved = [];
  if (product.imageNames && product.imageNames.length > 0) {
    resolved = product.imageNames.map(name => {
      const found = findFile(name);
      return found ? `/images/${found}` : null;
    }).filter(Boolean);
  }
  
  if (resolved.length === 0 && product.sku) {
    const foundBySku = findFile(product.sku);
    if (foundBySku) resolved.push(`/images/${foundBySku}`);
  }

  if (resolved.length > 0) {
    product.images = resolved;
    product.imageUrl = resolved[0];
  } else {
    product.images = product.images || [];
    if (!product.imageUrl || product.imageUrl.includes('unsplash')) {
       product.imageUrl = 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=400';
    }
  }

  return product;
};

// Helper to group products by Name + Brand to create variants dynamically
const groupProductsByVariants = (products) => {
  const groupedMap = new Map();
  
  products.forEach(p => {
    // Grouping Key: Brand + Base Name (strip everything after '|')
    const baseName = (p.name || '').toString().split('|')[0].trim().toLowerCase();
    const cleanBrand = (p.brand || '').toString().toLowerCase().trim();
    const key = `${cleanBrand}-${baseName}`;
    
    if (!groupedMap.has(key)) {
      const groupHeader = { ...p };
      // Keep existing variants if any, otherwise initialize empty array
      groupHeader.variants = p.variants && p.variants.length > 0 ? [...p.variants] : [];
      groupedMap.set(key, groupHeader);
    }
    
    const group = groupedMap.get(key);
    
    // Variant Label: Use the specific part after '|', or the Size field, or the first SubVariant
    let variantName = '';

    const nameParts = (p.name || '').toString().split('|');

    if (nameParts.length > 1) {
      variantName = nameParts[1].trim();
    } else if (p.subVariants?.length > 0) {
      variantName = p.subVariants.map(sv => sv.value).join(' / ');
    } else if (p.size && p.size !== 'Material' && p.size !== 'Standard') {
      variantName = p.size;
    } else {
      variantName = p.sku;
    }
    
    if (!variantName) variantName = p.sku || 'Standard';

    // If variants were dynamically grouped (not pre-defined in DB), add current SKU if not present
    const exists = group.variants.some(v => v.sku === p.sku || v.name === variantName);
    if (!exists) {
      group.variants.push({
        name: variantName,
        price: p.salePrice || p.price,
        mrp: p.mrp || 0,
        sku: p.sku,
        _id: p._id,
        image: p.imageUrl,
        unitLabel: p.unitLabel,
        isPopular: p.isPopular
      });
    }

    // Image Preference: If group leader has a placeholder but this product has a real image, promote it
    const groupHasPlaceholder = !group.imageUrl || group.imageUrl.includes('unsplash');
    const pHasRealImg = p.imageUrl && !p.imageUrl.includes('unsplash');
    
    if (groupHasPlaceholder && pHasRealImg) {
      group.imageUrl = p.imageUrl;
      group.images = p.images;
    }
  });

  return Array.from(groupedMap.values());
};

exports.getAllProducts = async (req, res) => {
  try {
    const { category, brand, subCategory, search, isPopular } = req.query;
    let query = { isActive: true };

    const CATEGORY_MAP = {
      'Wooden & Boards': '03',
      'Electricals': '04',
      'Hardware': '22',
      'Paint & POP': '06',
      'Tiles & Flooring': 'tiles',
      'Power Tools': 'tools',
      'Civil': '26'
    };

    const getCategoryIdFromName = (name) => CATEGORY_MAP[name] || null;

    if (category) {
      let categoryValues = Array.isArray(category) ? category : [category];
      
      // Expand query to include numeric IDs if names were provided
      const expandedValues = [...categoryValues];
      categoryValues.forEach(val => {
        const id = getCategoryIdFromName(val);
        if (id) expandedValues.push(id);
      });
      
      query.category = { $in: expandedValues };
    }
    
    if (brand) {
      const brands = Array.isArray(brand) ? brand : [brand];
      query.brand = { $in: brands };
    }

    if (subCategory) {
      const subCategories = Array.isArray(subCategory) ? subCategory : [subCategory];
      query.subCategory = { $in: subCategories };
    }

    if (isPopular === 'true') {
      query.isPopular = true;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      const orConditions = [
        { name: regex }, { productCode: regex },
        { category: regex }, { subCategory: regex }, { brand: regex },
        { size: regex }, { 'subVariants.value': regex }, { 'variants.name': regex }
      ];

      // If search matches a category name, add the numeric ID too
      Object.entries(CATEGORY_MAP).forEach(([name, id]) => {
        if (name.toLowerCase().includes(search.toLowerCase())) {
          orConditions.push({ category: id });
        }
      });

      query.$or = orConditions;
    }

    let products = await Product.find(query).lean();
    
    // 1. Resolve images first
    products = products.map(resolveProductImages);
    
    // 2. Group into variants
    let groupedProducts = groupProductsByVariants(products);

    // 3. Sort: Products with images first
    groupedProducts.sort((a, b) => {
      const aHasImg = a.imageUrl && !a.imageUrl.includes('unsplash');
      const bHasImg = b.imageUrl && !b.imageUrl.includes('unsplash');
      if (aHasImg && !bHasImg) return -1;
      if (!aHasImg && bHasImg) return 1;
      return 0;
    });

    res.json(groupedProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    const baseName = (product.name || '').toString().split('|')[0].trim();
    const relatedProducts = await Product.find({
      brand: product.brand,
      name: { $regex: new RegExp('^' + baseName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i') },
      isActive: true
    }).lean();

    const resolved = relatedProducts.map(resolveProductImages);
    const grouped = groupProductsByVariants(resolved);
    
    res.json(grouped[0] || resolveProductImages(product));
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
        { name: regex }, { productCode: regex },
        { category: regex }, { subCategory: regex }, { brand: regex },
        { size: regex }, { 'subVariants.value': regex }, { 'variants.name': regex }
      ],
      isActive: true
    }).limit(40).lean();

    products = products.map(resolveProductImages);
    const grouped = groupProductsByVariants(products);
    
    res.json(grouped.slice(0, 10));
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
    
    // We need the Category model
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
