const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  sku: { type: String, required: true, unique: true },
  
  // Smart Units: individual, weight-based (lbs/kg), or packs/bundles
  unitType: { 
    type: String, 
    enum: ['individual', 'weight-based', 'pack', 'bundle'], 
    default: 'individual'
  },
  unitLabel: { type: String, default: 'unit' }, // e.g., 'lbs', 'kg', 'pack of 10'
  
  // Technical Specifications
  csiMasterFormat: { type: String }, // e.g., '03 30 00' (Cast-in-Place Concrete)
  specifications: { type: Map, of: String }, // Key-Value pair for extra details
  
  // Logistics & Vehicle Matching
  weightPerUnit: { type: Number, default: 0 }, // Weight in kg/lbs for calculations
  volumePerUnit: { type: Number, default: 0 }, // Volume in cubic units for vehicle fitting
  
  price: { type: Number, required: true },
  imageUrl: { type: String, default: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=400' },
  images: [{ type: String }],
  imageNames: [{ type: String }], // Raw names from Excel column

  // Data.xlsx specific fields
  category: { type: String },
  subCategory: { type: String },
  brand: { type: String },
  size: { type: String },
  productCode: { type: String },
  mrp: { type: Number },
  salePrice: { type: Number },
  deliveryTime: { type: String },
  subVariants: [{
    title: String,
    value: String
  }],

  // Variants: e.g., different bag sizes, steel diameters
  variants: [{
    name: { type: String }, // e.g., "50kg Bag", "10kg Bag"
    price: { type: Number },
    weight: { type: Number },
    volume: { type: Number },
    sku: { type: String }
  }],

  // Bulk Pricing: e.g., Buy 100+ for 10% off
  bulkPricing: [{
    minQty: { type: Number, required: true },
    discount: { type: Number, required: true } // Percentage (0-100)
  }],

  // Compliance Documentation (mock URLs/paths)
  complianceDocs: [{
    label: { type: String, required: true },
    url: { type: String, required: true }
  }],

  isActive: { type: Boolean, default: true }
  }, { timestamps: true });

  ProductSchema.index({ name: 'text', sku: 'text', csiMasterFormat: 'text', description: 'text', category: 'text', brand: 'text' });

  module.exports = mongoose.model('Product', ProductSchema);