const mongoose = require('mongoose');

const VariantSchema = new mongoose.Schema({
  sku: { type: String }, // Product Code
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
    marginValue: { type: Number }
  },
  inventory: {
    packOf: { type: Number },
    unitWeight: { type: Number },
    bulkApplication: { type: String }
  },
  meta: {
    suppliedWith: { type: String },
    suitableFor: { type: String }
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
  
  // Shared Parent Attributes
  hsnCode: { type: String },
  sellingMeasure: { type: String },
  measureTerm: { type: String },
  measureValue: { type: String },
  deliveryTime: { type: String },
  returns: { type: String },
  logisticsRule: { type: String },
  status: { type: String },
  
  variants: [VariantSchema],

  isActive: { type: Boolean, default: true },
  isPopular: { type: Boolean, default: false },
  
  // Flattened fields for fast search/compatibility
  imageUrl: { type: String },
  price: { type: Number },
  mrp: { type: Number },
  salePrice: { type: Number }
}, { timestamps: true });

ProductSchema.index({ productName: 'text', alternateNames: 'text', description: 'text', category: 'text', brand: 'text', 'variants.sku': 'text' });

module.exports = mongoose.model('Product', ProductSchema);