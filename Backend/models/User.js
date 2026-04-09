const mongoose = require('mongoose');

const JobsiteSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Bridge Construction Site A"
  addressType: { 
    type: String, 
    enum: ['Home', 'Office', 'Site', 'Other'], 
    default: 'Other' 
  },
  addressText: { type: String, required: true },
  pincode: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String, default: 'India' },
  isBilling: { type: Boolean, default: false },
  isShipping: { type: Boolean, default: true },
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
  contactPerson: { type: String },
  contactPhone: { type: String }
});

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phoneNumber: { type: String, unique: true, required: true }, // For OTP Login
  isVerified: { type: Boolean, default: false },
  email: { type: String, unique: true, sparse: true }, // Made sparse for OTP-only signup
  role: { 
    type: String, 
    enum: ['End User', 'Admin', 'Rider', 'Supplier'], 
    default: 'End User' 
  },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }, // Links user to a Supplier entity
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  
  // Rider Specific Fields
  vehicleType: { 
    type: String, 
    enum: ['Scooter', 'Pickup Truck', 'Flatbed', 'Heavy Trailer', 'None'], 
    default: 'None' 
  },
  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [77.5946, 12.9716] } // Default to Bangalore
  },
  isOnline: { type: Boolean, default: false },

  // MatAll Pay (Financing)
  creditLimit: { type: Number, default: 0 },
  availableCredit: { type: Number, default: 0 },

  // Multiple jobsites with geospatial support
  jobsites: [JobsiteSchema]
}, { timestamps: true });

// Index for geospatial queries
UserSchema.index({ 'jobsites.location': '2dsphere' });

module.exports = mongoose.model('User', UserSchema);
