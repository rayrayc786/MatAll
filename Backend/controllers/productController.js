const Product = require('../models/Product');
const User = require('../models/User');
const MissingProduct = require('../models/MissingProduct');
const SearchLog = require('../models/SearchLog');
const emailService = require('../services/emailService');
const fs = require('fs');
const path = require('path');
const Brand = require('../models/Brand');
const Settings = require('../models/Settings');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');

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

// Helper to resolve image names to actual file paths from Image Master
const resolveProductImages = (product) => {
  const imageMasterPath = path.join(__dirname, '..', 'public', 'images');
  
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
      // If no new images resolved, preserve existing local images if present
      item.images = item.images || [];
      if (item.images.length > 0 && !item.images[0].includes('unsplash')) {
        item.imageUrl = item.images[0];
      } else if (!item.imageUrl || item.imageUrl.includes('unsplash')) {
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
    const { category, brand, subCategory, search: rawSearch, isPopular } = req.query;
    const search = Array.isArray(rawSearch) ? rawSearch[0] : (rawSearch || '');
    let query = { isActive: true };

    if (category) {
      const categoryValues = typeof category === 'string' ? category.split(',') : (Array.isArray(category) ? category : [category]);
      const queryValues = [];
      categoryValues.forEach(val => {
        const trimmed = val.trim();
        queryValues.push(trimmed);
        queryValues.push(trimmed.toLowerCase());
        queryValues.push(trimmed.toUpperCase());
        const id = getCategoryIdFromName(trimmed);
        if (id) queryValues.push(id);
      });
      
      const uniqueValues = Array.from(new Set(queryValues));
      const regexPattern = uniqueValues.map(v => v.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
      query.category = { $regex: new RegExp(`^(${regexPattern})$`, 'i') };
    }
    
    if (brand) {
      const brands = typeof brand === 'string' ? brand.split(',') : (Array.isArray(brand) ? brand : [brand]);
      query.brand = { $in: brands.map(b => b.trim()) };
    }

    if (subCategory) {
      const subCategoriesList = typeof subCategory === 'string' ? subCategory.split(',') : (Array.isArray(subCategory) ? subCategory : [subCategory]);
      query.subCategory = { $in: subCategoriesList.map(s => s.trim()) };
    }

    if (isPopular === 'true') {
      query.isPopular = true;
    }

    if (search) {
      // Split by commas first (OR groups)
      const orGroups = search.split(',').map(g => g.trim()).filter(Boolean);
      
      if (orGroups.length > 0) {
        const orConditions = orGroups.map(group => {
          // Within each group, split by spaces (AND terms)
          const searchTerms = group.split(/\s+/).filter(Boolean);
          
          if (searchTerms.length === 0) return null;

          const andConditions = searchTerms.map(term => {
            const regex = new RegExp(term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
            const termOrConditions = [
              { productName: regex },
              { brand: regex },
              { subCategory: regex },
              { category: regex },
              { alternateNames: regex },
              { 'variants.name': regex },
              { 'variants.productCode': regex },
              { 'variants.sku': regex }
            ];

            // Add category ID mappings if they match the term
            Object.entries(CATEGORY_MAP).forEach(([name, id]) => {
              if (name.toLowerCase().includes(term.toLowerCase())) {
                termOrConditions.push({ category: id });
              }
            });

            return { $or: termOrConditions };
          });

          return andConditions.length === 1 ? andConditions[0] : { $and: andConditions };
        }).filter(Boolean);

        if (orConditions.length > 0) {
          query.$or = orConditions;
        }
      }
    }

    let productsQuery = Product.find(query);
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 2000; // Large default to keep backward compatibility if needed, but we will change frontend to request 8.
    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments(query);
    
    let products = await productsQuery.lean();
    
    // Log the search (same as before)
    if (search) {
      try {
        await SearchLog.create({
          query: search,
          resultsCount: products.length,
          ip: req.ip || req.connection.remoteAddress,
          user: req.user ? req.user.id || req.user._id : null
        });

        if (products.length === 0) {
          let userData = { 
            searchTerm: search, 
            userName: 'Guest', 
            userPhone: 'N/A', 
            userEmail: 'N/A' 
          };

          if (req.user) {
            const user = await User.findById(req.user.id || req.user._id).lean();
            if (user) {
              userData.userName = user.fullName || 'User';
              userData.userPhone = user.phoneNumber || 'N/A';
              userData.userEmail = user.email || 'N/A';
            }
          }

          try {
            await MissingProduct.create({
              userId: req.user ? (req.user.id || req.user._id) : null,
              userName: userData.userName,
              userPhone: userData.userPhone,
              userEmail: userData.userEmail,
              searchTerm: search
            });
          } catch (missingErr) {
            console.error('Error saving missing product record:', missingErr);
          }

          await emailService.sendMissingProductEmail(userData);
        }
      } catch (logErr) {
        console.error('Error logging search or sending alert:', logErr);
      }
    }

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

    // Apply pagination after hydration/sorting if specific order is needed, 
    // but usually better to do filter at DB level.
    // However, the current code sorts by image presence in JS.
    // If I want to paginate properly, I should either sort in DB or paginate in JS.
    // Given the sorting is based on 'imageUrl' (which is resolved in JS), I have to paginate in JS.
    
    const paginatedProducts = hydrated.slice(skip, skip + limit);

    res.json({
      products: paginatedProducts,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page
    });
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

    const orGroups = q.split(',').map(g => g.trim()).filter(Boolean);
    if (orGroups.length === 0) return res.json([]);

    const orConditions = orGroups.map(group => {
      const searchTerms = group.split(/\s+/).filter(Boolean);
      if (searchTerms.length === 0) return null;

      const andConditions = searchTerms.map(term => {
        const regex = new RegExp(term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
        const termOrConditions = [
          { productName: regex },
          { brand: regex },
          { subCategory: regex },
          { category: regex },
          { alternateNames: regex },
          { 'variants.name': regex },
          { 'variants.productCode': regex },
          { 'variants.sku': regex }
        ];

        // Add category ID mappings if they match the term
        Object.entries(CATEGORY_MAP).forEach(([name, id]) => {
          if (name.toLowerCase().includes(term.toLowerCase())) {
            termOrConditions.push({ category: id });
          }
        });

        return { $or: termOrConditions };
      });

      return andConditions.length === 1 ? andConditions[0] : { $and: andConditions };
    }).filter(Boolean);

    if (orConditions.length === 0) return res.json([]);

    let products = await Product.find({
      $or: orConditions,
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

exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({ isServiceEnabled: true });
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSubCategories = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.categoryId) {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(req.query.categoryId)) {
        filter.categoryId = req.query.categoryId;
      } else {
        const cat = await Category.findOne({ name: req.query.categoryId });
        if (cat) filter.categoryId = cat._id;
        else return res.json([]); 
      }
    }
    const subCategories = await SubCategory.find(filter).sort({ name: 1 });
    res.json(subCategories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    const userId = req.user.id || req.user._id;
    const Review = require('../models/Review');

    // Check if user already reviewed
    const existing = await Review.findOne({ productId, userId });
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    const review = new Review({
      productId,
      userId,
      userName: req.user.fullName || 'User',
      rating: Number(rating),
      comment
    });

    await review.save();

    // Update Product average rating
    const reviews = await Review.find({ productId });
    const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

    await Product.findByIdAndUpdate(productId, {
      avgRating,
      numReviews: reviews.length
    });

    res.status(201).json({ message: 'Review added successfully', review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const Review = require('../models/Review');
    const reviews = await Review.find({ productId: req.params.id, isApproved: true }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
