const mongoose = require('mongoose');

const VariantSchema = new mongoose.Schema({
  variantId: { type: String }, // NEW: Variant identification for bulk upload
  sku: { type: String }, // SKU Number
  productCode: { type: String }, // Product Code
  name: { type: String }, // Generated human-readable name
  attributes: {
    type: Map,
    of: String
  },
  pricing: {
    mrp: { type: Number },
    salePrice: { type: Number },
    gst: { type: Number },
    dealerDiscount: { type: Number },
    discountValue: { type: Number },
    discountRate: { type: Number },
    buyingPrice: { type: Number },
    marginValue: { type: Number },
    sellingMeasureRate: { type: Number }, // Rate per sq ft / per mt
    revMargin: { type: Number }, // NEW: Revenue margin
    priceAfterDiscount: { type: Number } // NEW: Price after dealer discount
  },
  inventory: {
    packOf: { type: Number },
    unitWeight: { type: Number },
    bulkApplication: { type: String }
  },
  measure: {
    value: { type: String }, // e.g., "32"
    term: { type: String },  // e.g., "Area"
    unit: { type: String }   // e.g., "sq ft"
  },
  meta: {
    suppliedWith: { type: String },
    suitableFor: { type: String },
    warranty: { type: String }
  },
  images: [{ type: String }] // Variant-level images with full paths
});

const ProductSchema = new mongoose.Schema({
  name: { type: String, trim: true }, // For compatibility with existing frontend
  productName: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  brand: { type: String },
  alternateNames: [{ type: String }],
  description: { type: String },
  productId: { type: String, index: true }, // NEW: Product identification for bulk upload
  productCode: { type: String }, // Root level Product Code
  
  // Shared Parent Attributes
  hsnCode: { type: String },
  sellingMeasure: { type: String }, // e.g. "per sq ft" - usually shared for one product type
  measureValue: { type: String }, // NEW: Root level measure value
  sellingMeasureRate: { type: Number }, // NEW: Root level measure rate
  deliveryTime: { type: String },
  returns: { type: String },
  logisticsRule: { type: String },
  logisticsCategory: { type: String, enum: ['Light', 'Medium', 'Heavy'], default: 'Light' },
  status: { type: String },
  
  variants: [VariantSchema],

  isActive: { type: Boolean, default: true },
  isPopular: { type: Boolean, default: false },
  
  // Flattened fields for fast search/compatibility
  imageUrl: { type: String },
  price: { type: Number },
  mrp: { type: Number },
  salePrice: { type: Number },

  // Rating and Reviews
  avgRating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 }
}, { timestamps: true });

ProductSchema.index({ productName: 'text', alternateNames: 'text', description: 'text', category: 'text', brand: 'text', 'variants.sku': 'text' });

module.exports = mongoose.model('Product', ProductSchema);