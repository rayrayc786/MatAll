const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
const Vendor = require('./models/Vendor');
const DarkStore = require('./models/DarkStore');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/builditquick';

const seedDarkStore = {
  storeName: 'Main Hub - Punjab',
  location: {
    type: 'Point',
    coordinates: [76.7179, 30.7046] // Mohali coordinates
  },
  serviceabilityRadius: 50000, // 50km
  isOpen: true
};

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
    isVerified: true
  },
  {
    fullName: 'Rahul Buyer',
    phoneNumber: '8888877777',
    role: 'Buyer',
    isVerified: true
  }
];

const seedProducts = [
  // Wooden (03)
  {
    name: 'Century Ply Sainik 710',
    sku: 'PLY-CEN-710-19',
    category: '03',
    subCategory: 'Plywood',
    brand: 'Century Ply',
    price: 105,
    mrp: 125,
    unitLabel: 'sq.ft',
    deliveryTime: '10 mins',
    imageUrl: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=400',
    variants: [
      { name: '19mm - sq.ft', price: 105, mrp: 125, sku: 'PLY-CEN-710-19' },
      { name: '12mm - sq.ft', price: 85, mrp: 100, sku: 'PLY-CEN-710-12' },
      { name: '6mm - sq.ft', price: 65, mrp: 80, sku: 'PLY-CEN-710-06' }
    ]
  },
  {
    name: 'Greenlam Laminate 1mm',
    sku: 'LAM-GRN-1MM',
    category: '03',
    subCategory: 'Laminate',
    brand: 'Greenlam',
    price: 950,
    mrp: 1200,
    unitLabel: 'Sheet',
    deliveryTime: '60 mins',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400'
  },
  // Electrical (04)
  {
    name: 'Polycab 2.5sqmm Wire',
    sku: 'ELE-POL-25',
    category: '04',
    subCategory: 'Wires',
    brand: 'Polycab',
    price: 1600,
    mrp: 2200,
    unitLabel: '90m Coil',
    deliveryTime: '10 mins',
    imageUrl: 'https://images.unsplash.com/photo-1558402529-d2638a7023e9?auto=format&fit=crop&q=80&w=400'
  },
  {
    name: 'Havells 16A Switch',
    sku: 'ELE-HAV-16S',
    category: '04',
    subCategory: 'Switches',
    brand: 'Havells',
    price: 45,
    mrp: 60,
    unitLabel: 'Unit',
    deliveryTime: '10 mins',
    imageUrl: 'https://images.unsplash.com/photo-1558402529-d2638a7023e9?auto=format&fit=crop&q=80&w=400'
  },
  // Plumbing (05)
  {
    name: 'Astral CPVC Pipe 1 inch',
    sku: 'PLM-AST-1',
    category: '05',
    subCategory: 'Pipes',
    brand: 'Astral',
    price: 320,
    mrp: 400,
    unitLabel: '3m Length',
    deliveryTime: '60 mins',
    imageUrl: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=400'
  },
  // Paint & POP (06)
  {
    name: 'Asian Paints Apex 20L',
    sku: 'PNT-AP-APX-20',
    category: '06',
    subCategory: 'Emulsion',
    brand: 'Asian Paints',
    price: 4500,
    mrp: 5200,
    unitLabel: 'Bucket',
    deliveryTime: '60 mins',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400'
  },
  // Hardware (22)
  {
    name: 'Godrej Mortise Lock',
    sku: 'HRD-GOD-MOR',
    category: '22',
    subCategory: 'Locks',
    brand: 'Godrej',
    price: 1850,
    mrp: 2400,
    unitLabel: 'Set',
    deliveryTime: '10 mins',
    imageUrl: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=400'
  },
  // Civil (26)
  {
    name: 'UltraTech Cement OPC 53',
    sku: 'CIV-ULT-53',
    category: '26',
    subCategory: 'Cement',
    brand: 'UltraTech',
    price: 450,
    mrp: 480,
    unitLabel: '50kg Bag',
    deliveryTime: '60 mins',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400'
  },
  {
    name: 'TATA Tiscon 12mm Rebar',
    sku: 'CIV-TAT-12',
    category: '26',
    subCategory: 'Steel',
    brand: 'TATA',
    price: 75000,
    mrp: 82000,
    unitLabel: 'Ton',
    deliveryTime: 'Next Day',
    imageUrl: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?auto=format&fit=crop&q=80&w=400'
  },
  // Tools
  {
    name: 'Bosch GSB 13 RE Drill',
    sku: 'TLS-BOS-DRILL',
    category: 'tools',
    subCategory: 'Power Tools',
    brand: 'Bosch',
    price: 3200,
    mrp: 4500,
    unitLabel: 'Unit',
    deliveryTime: '10 mins',
    imageUrl: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=400'
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB...');
    
    await Product.deleteMany({});
    await User.deleteMany({});
    await Vendor.deleteMany({});
    await DarkStore.deleteMany({});
    console.log('Cleared existing data...');
    
    await DarkStore.create(seedDarkStore);
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
