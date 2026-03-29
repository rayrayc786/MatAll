const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  discount: { type: String },
  imageUrl: { type: String },
  isActive: { type: Boolean, default: true },
  link: { type: String } // Optional: where it redirects to
}, { timestamps: true });

module.exports = mongoose.model('Offer', OfferSchema);
