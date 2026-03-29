const mongoose = require('mongoose');

const SubCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  parentSubCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory', default: null },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

SubCategorySchema.index({ name: 1, categoryId: 1, parentSubCategoryId: 1 }, { unique: true });

module.exports = mongoose.model('SubCategory', SubCategorySchema);
