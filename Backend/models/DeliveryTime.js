const mongoose = require('mongoose');

const DeliveryTimeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true }, // e.g., '60 mins', '2 Hours', 'Same Day'
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('DeliveryTime', DeliveryTimeSchema);
