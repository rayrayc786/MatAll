const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  isServiceEnabled: { type: Boolean, default: true },
  offlineMessage: { type: String, default: "We are currently offline. Please try again later." },
  useOperatingHours: { type: Boolean, default: false },
  serviceStartTime: { type: String, default: "09:00" }, // HH:mm format
  serviceEndTime: { type: String, default: "21:00" },   // HH:mm format
  deliveryCharge: { type: Number, default: 150 },
  freeDeliveryThreshold: { type: Number, default: 5000 },
  platformFee: { type: Number, default: 9 },
  isCodEnabled: { type: Boolean, default: true },
  isPartPaymentEnabled: { type: Boolean, default: true },
  isFullPaymentEnabled: { type: Boolean, default: true },
  partPaymentPercentage: { type: Number, default: 50 },
  logisticsRates: {
    light: { rate: { type: Number, default: 50 }, mode: { type: String, default: "Bike" } },
    medium: { rate: { type: Number, default: 150 }, mode: { type: String, default: "Three Wheeler" } },
    heavy: { rate: { type: Number, default: 500 }, mode: { type: String, default: "Truck" } }
  },
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
