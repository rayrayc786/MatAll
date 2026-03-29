const mongoose = require('mongoose');

const BrandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String },
  logoUrl: { type: String },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Brand', BrandSchema);
