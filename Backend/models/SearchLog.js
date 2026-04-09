const mongoose = require('mongoose');

const searchLogSchema = new mongoose.Schema({
  query: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  resultsCount: { type: Number, default: 0 },
  ip: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('SearchLog', searchLogSchema);
