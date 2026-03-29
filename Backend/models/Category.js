const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String },
  imageUrl: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Category', CategorySchema);
