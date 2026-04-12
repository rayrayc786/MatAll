const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  category: { type: String }, // Store category for routing
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  basePrice: { type: Number }, // item price excluding GST
  taxRate: { type: Number }, // total GST %
  igstAmount: { type: Number },
  cgstAmount: { type: Number },
  sgstAmount: { type: Number },
  totalWeight: { type: Number, required: true }, // Pre-calculated weight
  totalVolume: { type: Number, required: true },  // Pre-calculated volume
  selectedVariant: { type: String } // Human readable name of the variant selected
});

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  darkStoreId: { type: mongoose.Schema.Types.ObjectId, ref: 'DarkStore', required: true },
  items: [OrderItemSchema],
  
  status: { 
    type: String, 
    enum: ['Accepted', 'Order Ready to Ship', 'Rider at hub for pickup', 'Order Picked', 'Order on way', 'Order Delivered', 'Payment Received', 'Cancelled'], 
    default: 'Accepted' 
  },
  
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paymentMethod: { type: String, default: 'COD' },
  paymentReference: { type: String },
  proofImageUrl: { type: String },

  // VehicleClass requirement based on total cart weight
  // Examples: 'Bike', 'Pickup Truck', 'Flatbed', 'Heavy Trailer'
  vehicleClass: { type: String, required: true },
  
  totalAmount: { type: Number, required: true }, // Grand Total (incl all fees & taxes)
  paidAmount: { type: Number }, // Amount paid via Gateway (for partial/full tracking)
  subTotal: { type: Number }, // Sum of items (incl GST)
  totalBaseAmount: { type: Number }, // Sum of items base price
  totalTaxAmount: { type: Number }, // Sum of IGST/CGST/SGST from items
  
  platformFee: { type: Number, default: 19 }, // incl GST
  platformFeeGST: { type: Number, default: 2.9 }, // 18% of 16.10 approx
  
  deliveryCharge: { type: Number, default: 0 },
  deliveryChargeGST: { type: Number, default: 0 },

  totalWeight: { type: Number, required: true },
  totalVolume: { type: Number, required: true },
  
  deliveryAddress: {
    name: String,
    area: String, // Neighborhood, Sector, or Zone
    fullAddress: String,
    pincode: String,
    city: String,
    state: String,
    country: String,
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: [Number]
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);