const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
const Supplier = require('./models/Supplier');
const DarkStore = require('./models/DarkStore');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/builditquick';

const seedDarkStore = {
  storeName: 'Main Hub - Punjab',
  location: {
    type: 'Point',
    coordinates: [76.7179, 30.7046]
  },
  serviceabilityRadius: 50000,
  isOpen: true
};

const seedSupplier = {
  _id: new mongoose.Types.ObjectId('65f1a2b3c4d5e6f7a8b9c0d1'),
  name: 'Global Construction Supplies',
  location: 'Bangalore Industrial Area',
  categoryExpertise: ['Cement', 'Steel', 'Blocks'],
  isVerified: true
};

const seedUsers = [
  { fullName: 'Admin User', phoneNumber: '9999988888', role: 'Admin', isVerified: true },
  { fullName: 'Supplier Manager', phoneNumber: '6666655555', role: 'Supplier', isVerified: true },
  { fullName: 'Rahul End User', phoneNumber: '8888877777', role: 'End User', isVerified: true }
];

const seedProducts = [
  // Wooden & Boards (03)
  {
    name: 'Century Ply Sainik 710',
    sku: 'PLY-CEN-710',
    category: '03',
    subCategory: 'Plywood',
    brand: 'Century Ply',
    price: 105,
    mrp: 125,
    unitLabel: 'sq.ft',
    deliveryTime: '10 mins',
    imageUrl: 'https://images.unsplash.com/photo-1546487817-f9a39d48b560?auto=format&fit=crop&q=80&w=400',
    variants: [
      { name: '19mm - sq.ft', price: 105, sku: 'PLY-CEN-710-19' },
      { name: '12mm - sq.ft', price: 85, sku: 'PLY-CEN-710-12' },
      { name: '6mm - sq.ft', price: 65, sku: 'PLY-CEN-710-06' }
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
    imageUrl: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&q=80&w=400'
  },

  // Electricals (04)
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
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400',
    variants: [
      { name: '1.0 sqmm - 90m', price: 950, sku: 'ELE-POL-10' },
      { name: '1.5 sqmm - 90m', price: 1250, sku: 'ELE-POL-15' },
      { name: '2.5 sqmm - 90m', price: 1600, sku: 'ELE-POL-25-V' }
    ]
  },
  {
    name: 'Havells Reo Switches',
    sku: 'ELE-HAV-REO',
    category: '04',
    subCategory: 'Switches',
    brand: 'Havells',
    price: 45,
    mrp: 60,
    unitLabel: 'Unit',
    deliveryTime: '10 mins',
    imageUrl: 'https://images.unsplash.com/photo-1558402529-d2638a7023e9?auto=format&fit=crop&q=80&w=400'
  },

  // Hardware (05)
  {
    name: 'Godrej Mortise Lock Handle',
    sku: 'HRD-GOD-MOR',
    category: '05',
    subCategory: 'Locks',
    brand: 'Godrej',
    price: 1850,
    mrp: 2400,
    unitLabel: 'Set',
    deliveryTime: '10 mins',
    imageUrl: 'https://images.unsplash.com/photo-1540350394557-8d14678e7f91?auto=format&fit=crop&q=80&w=400'
  },
  {
    name: 'Hafele Soft Close Hinges',
    sku: 'HRD-HAF-HINGE',
    category: '05',
    subCategory: 'Hinges',
    brand: 'Hafele',
    price: 450,
    mrp: 600,
    unitLabel: 'Pair',
    deliveryTime: '10 mins',
    imageUrl: 'https://images.unsplash.com/photo-1540350394557-8d14678e7f91?auto=format&fit=crop&q=80&w=400'
  },

  // Paint & POP (06)
  {
    name: 'Asian Paints Apex Ultima',
    sku: 'PNT-AP-APX-U',
    category: '06',
    subCategory: 'Emulsion',
    brand: 'Asian Paints',
    price: 4500,
    mrp: 5200,
    unitLabel: 'Bucket',
    deliveryTime: '60 mins',
    imageUrl: 'https://images.unsplash.com/photo-1562591176-329e4cb28de2?auto=format&fit=crop&q=80&w=400',
    variants: [
      { name: '1 Litre', price: 350, sku: 'PNT-AP-1L' },
      { name: '4 Litre', price: 1250, sku: 'PNT-AP-4L' },
      { name: '20 Litre', price: 4500, sku: 'PNT-AP-20L' }
    ]
  },

  // Kitchen & Wardrobe (07)
  {
    name: 'Sleek Kitchen Basket',
    sku: 'KIT-SLE-BAS',
    category: '07',
    subCategory: 'Baskets',
    brand: 'Sleek',
    price: 2200,
    mrp: 2800,
    unitLabel: 'Unit',
    deliveryTime: 'Next Day',
    imageUrl: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&q=80&w=400'
  },

  // Sanitary (08)
  {
    name: 'Kohler Western Closet',
    sku: 'SAN-KOH-WC',
    category: '08',
    subCategory: 'Closets',
    brand: 'Kohler',
    price: 12500,
    mrp: 15800,
    unitLabel: 'Set',
    deliveryTime: 'Next Day',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400'
  },

  // Flooring & Pavings (09)
  {
    name: 'Kajaria Vitrified Tiles 2x2',
    sku: 'FLR-KAJ-VIT',
    category: '09',
    subCategory: 'Tiles',
    brand: 'Kajaria',
    price: 55,
    mrp: 75,
    unitLabel: 'sq.ft',
    deliveryTime: '2 Days',
    imageUrl: 'https://images.unsplash.com/photo-1523413555809-0fb83cf74382?auto=format&fit=crop&q=80&w=400'
  },

  // Bath Fitting (10)
  {
    name: 'Jaquar Overhead Shower',
    sku: 'BTH-JAQ-SHWR',
    category: '10',
    subCategory: 'Showers',
    brand: 'Jaquar',
    price: 2450,
    mrp: 3200,
    unitLabel: 'Unit',
    deliveryTime: '10 mins',
    imageUrl: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?auto=format&fit=crop&q=80&w=400'
  },

  // Steel & Iron (12)
  {
    name: 'Tata Tiscon 12mm TMT Bar',
    sku: 'STL-TAT-12',
    category: '12',
    subCategory: 'TMT Bars',
    brand: 'Tata Tiscon',
    price: 68000,
    mrp: 75000,
    unitLabel: 'Ton',
    deliveryTime: 'Next Day',
    imageUrl: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?auto=format&fit=crop&q=80&w=400',
    variants: [
      { name: '8mm Bundle', price: 69000, sku: 'STL-TAT-08' },
      { name: '10mm Bundle', price: 68500, sku: 'STL-TAT-10' },
      { name: '12mm Bundle', price: 68000, sku: 'STL-TAT-12V' }
    ]
  },

  // Building Materials (13)
  {
    name: 'UltraTech Cement OPC 53',
    sku: 'BLD-ULT-53',
    category: '13',
    subCategory: 'Cement',
    brand: 'UltraTech',
    price: 450,
    mrp: 495,
    unitLabel: '50kg Bag',
    deliveryTime: '60 mins',
    imageUrl: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?auto=format&fit=crop&q=80&w=400'
  },

  // Solar Panels (14)
  {
    name: 'Loom Solar 440W Mono',
    sku: 'SOL-LOM-440',
    category: '14',
    subCategory: 'Panels',
    brand: 'Loom Solar',
    price: 21000,
    mrp: 28000,
    unitLabel: 'Unit',
    deliveryTime: '3 Days',
    imageUrl: 'https://images.unsplash.com/photo-1509391366360-fe5bb58583fb?auto=format&fit=crop&q=80&w=400'
  },

  // Stone & Tiles (17)
  {
    name: 'Italian Marble Statuario',
    sku: 'STN-MAR-STA',
    category: '17',
    subCategory: 'Marble',
    brand: 'Universal Stone',
    price: 450,
    mrp: 600,
    unitLabel: 'sq.ft',
    deliveryTime: '2 Days',
    imageUrl: 'https://images.unsplash.com/photo-1523413555809-0fb83cf74382?auto=format&fit=crop&q=80&w=400'
  },

  // Adhesives (22)
  {
    name: 'Fevicol SH Water Proof',
    sku: 'ADH-FEV-SH-5',
    category: '22',
    subCategory: 'Wood Adhesive',
    brand: 'Fevicol',
    price: 1100,
    mrp: 1350,
    unitLabel: '5kg Jar',
    deliveryTime: '10 mins',
    imageUrl: 'https://images.unsplash.com/photo-1540350394557-8d14678e7f91?auto=format&fit=crop&q=80&w=400',
    variants: [
      { name: '500g', price: 150, sku: 'ADH-FEV-500' },
      { name: '1kg', price: 280, sku: 'ADH-FEV-1K' },
      { name: '5kg', price: 1100, sku: 'ADH-FEV-5K' }
    ]
  },

  // Pipes & Pumps (24)
  {
    name: 'Astral CPVC Pipe 1"',
    sku: 'PIP-AST-1',
    category: '24',
    subCategory: 'Pipes',
    brand: 'Astral Pipes',
    price: 380,
    mrp: 450,
    unitLabel: '3m Length',
    deliveryTime: '60 mins',
    imageUrl: 'https://images.unsplash.com/photo-1581244101140-fd6b4ac2f33b?auto=format&fit=crop&q=80&w=400'
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
    imageUrl: 'https://images.unsplash.com/photo-1504194103403-99b4561ed21d?auto=format&fit=crop&q=80&w=400'
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB...');
    
    await Product.deleteMany({});
    await User.deleteMany({});
    await Supplier.deleteMany({});
    await DarkStore.deleteMany({});
    console.log('Cleared existing data...');
    
    await DarkStore.create(seedDarkStore);
    await Supplier.create(seedSupplier);
    await Product.insertMany(seedProducts);
    await User.insertMany(seedUsers);
    
    console.log(`Seeding complete! Added ${seedProducts.length} products to all construction categories.`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
