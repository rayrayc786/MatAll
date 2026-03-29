const mongoose = require('mongoose');

const userRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  imageUrl: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Reviewed'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('UserRequest', userRequestSchema);
