const mongoose = require('mongoose');

const UnitSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true }, // e.g., 'unit', 'kg', 'lbs', 'bag', '50kg Bag'
  description: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Unit', UnitSchema);
