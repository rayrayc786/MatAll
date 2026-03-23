const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, default: 4.5 },
  location: { type: String, required: true },
  categories: [String], // e.g., ["Electrical Material", "Wires"]
  isVerified: { type: Boolean, default: false },
  contactPhone: { type: String },
  logoUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Vendor', VendorSchema);
