const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
const Vendor = require('./models/Vendor');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/builditquick';

const seedVendor = {
  _id: new mongoose.Types.ObjectId('65f1a2b3c4d5e6f7a8b9c0d1'),
  name: 'Global Construction Supplies',
  location: 'Bangalore Industrial Area',
  categoryExpertise: ['Cement', 'Steel', 'Blocks'],
  isVerified: true
};

const seedUsers = [
  {
    fullName: 'Admin User',
    phoneNumber: '9999988888',
    role: 'Admin',
    isVerified: true
  },
  {
    fullName: 'Vendor Manager',
    phoneNumber: '6666655555',
    role: 'Vendor',
    vendorId: seedVendor._id,
    isVerified: true
  },
  {
    fullName: 'Rahul Buyer',
    phoneNumber: '8888877777',
    role: 'Buyer',
    isVerified: true
  },
  {
    fullName: 'Express Driver',
    phoneNumber: '7777766666',
    role: 'Driver',
    vehicleType: 'Pickup Truck',
    isOnline: true,
    isVerified: true
  }
];

const seedProducts = [
  {
    name: 'OPC 53 Grade Cement',
    sku: 'CEM-53-BIRLA',
    unitType: 'individual',
    unitLabel: '50kg Bag',
    csiMasterFormat: '03 00 00',
    weightPerUnit: 50,
    volumePerUnit: 0.035,
    price: 6.50,
    vendorId: seedVendor._id,
    variants: [{ name: '50kg Bag', price: 6.50, weight: 50, volume: 0.035, sku: 'CEM-53-50KG' }],
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400'
  },
  {
    name: '12mm TMT Steel Rebar',
    sku: 'REBAR-12MM-TATA',
    unitType: 'weight-based',
    unitLabel: 'Ton',
    csiMasterFormat: '03 21 00',
    weightPerUnit: 1000,
    volumePerUnit: 0.12,
    price: 850.00,
    vendorId: seedVendor._id,
    imageUrl: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?auto=format&fit=crop&q=80&w=400'
  },
  {
    name: 'Washed M-Sand',
    sku: 'SND-M-WSH',
    unitType: 'weight-based',
    unitLabel: 'Ton',
    csiMasterFormat: '04 05 13',
    weightPerUnit: 1000,
    volumePerUnit: 0.65,
    price: 18.00,
    vendorId: seedVendor._id,
    imageUrl: 'https://images.unsplash.com/photo-1533062609701-2274b74bb881?auto=format&fit=crop&q=80&w=400'
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB...');
    
    await Product.deleteMany({});
    await User.deleteMany({});
    await Vendor.deleteMany({});
    console.log('Cleared existing data...');
    
    await Vendor.create(seedVendor);
    await Product.insertMany(seedProducts);
    await User.insertMany(seedUsers);
    
    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
