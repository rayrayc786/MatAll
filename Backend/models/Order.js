const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalWeight: { type: Number, required: true }, // Pre-calculated weight
  totalVolume: { type: Number, required: true }  // Pre-calculated volume
});

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  darkStoreId: { type: mongoose.Schema.Types.ObjectId, ref: 'DarkStore', required: true },
  items: [OrderItemSchema],
  
  status: { 
    type: String, 
    enum: ['pending', 'vendor-confirmed', 'picking', 'packing', 'handover-ready', 'dispatched', 'delivered', 'cancelled', 'rejected-by-vendor'], 
    default: 'pending' 
  },
  
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paymentMethod: { type: String, enum: ['upi', 'credit', 'bank', 'COD'], default: 'COD' },
  proofImageUrl: { type: String },

  // VehicleClass requirement based on total cart weight
  // Examples: 'Bike', 'Pickup Truck', 'Flatbed', 'Heavy Trailer'
  vehicleClass: { type: String, required: true },
  
  totalAmount: { type: Number, required: true },
  totalWeight: { type: Number, required: true },
  totalVolume: { type: Number, required: true },
  
  deliveryAddress: {
    name: String,
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: [Number]
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);