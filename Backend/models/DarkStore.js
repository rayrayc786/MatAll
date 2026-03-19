const mongoose = require('mongoose');

const DarkStoreSchema = new mongoose.Schema({
  storeName: { type: String, required: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [Longitude, Latitude]
      required: true
    }
  },
  
  // Serviceability radius in meters
  serviceabilityRadius: { type: Number, required: true },
  
  // Real-time inventory counts
  inventory: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 0 },
    lastRestocked: { type: Date }
  }],
  
  isOpen: { type: Boolean, default: true }
}, { timestamps: true });

// Index for proximity searches
DarkStoreSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('DarkStore', DarkStoreSchema);