const mongoose = require('mongoose');

const FooterLinkSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true }, // Column title e.g. "Company"
  links: [{
    label: { type: String, required: true },
    path: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  }],
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('FooterLink', FooterLinkSchema);
