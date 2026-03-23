const mongoose = require('mongoose');

const SubVariantTitleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true }, // e.g., 'Color', 'Length', 'Size', 'Diameter'
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('SubVariantTitle', SubVariantTitleSchema);
