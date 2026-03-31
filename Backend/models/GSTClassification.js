const mongoose = require('mongoose');

const GSTClassificationSchema = new mongoose.Schema({
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  gst: { type: Number, default: 0 },
  hsnCode: { type: String },
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Index for quick lookup during product upload
GSTClassificationSchema.index({ category: 1, subCategory: 1 }, { unique: true });

module.exports = mongoose.model('GSTClassification', GSTClassificationSchema);
