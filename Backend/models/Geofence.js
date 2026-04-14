const mongoose = require('mongoose');

const geofenceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['Polygon', 'Circle'], default: 'Polygon' },
  // For Polygons
  coordinates: [{
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  }],
  // For Circles
  center: {
    lat: { type: Number },
    lng: { type: Number }
  },
  radius: { type: Number },
  isActive: { type: Boolean, default: true },
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Geofence', geofenceSchema);
