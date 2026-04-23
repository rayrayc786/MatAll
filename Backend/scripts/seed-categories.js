const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Category = require('../models/Category');

const CATEGORIES = [
  { name: 'Wooden Material', description: 'Plywood, Boards, Laminates & Veneers', imageUrl: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&q=80&w=400', isFeatured: true },
  { name: 'Modular Hardware', description: 'Hinges, Channels, Door Handles & Locks', imageUrl: 'https://images.unsplash.com/photo-1540350394557-8d14678e7f91?auto=format&fit=crop&q=80&w=400', isFeatured: true },
  { name: 'Cieling', description: 'False Ceiling Materials, POP & Panels', imageUrl: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=400', isFeatured: true },
  { name: 'Electrical Material', description: 'Wires, Switches, Lighting & MCBs', imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400', isFeatured: true },
  { name: 'Paint', description: 'Interior, Exterior Paints & Polishes', imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400', isFeatured: true },
  { name: 'Plumbing', description: 'Pipes, Fittings, Valves & Pumps', imageUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&q=80&w=400', isFeatured: true },
  { name: 'Bathroom', description: 'Faucets, Showers, Washbasins & Sanitaryware', imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400', isFeatured: true },
  { name: 'Tools', description: 'Power Tools, Hand Tools & Measuring Equipment', imageUrl: 'https://images.unsplash.com/photo-1530124560676-587cad3213ec?auto=format&fit=crop&q=80&w=400', isFeatured: true },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // First delete all existing categories
    await Category.deleteMany({});
    console.log('🗑️  Cleared existing categories.');

    for (const cat of CATEGORIES) {
      await Category.create({ ...cat, isActive: true });
      console.log(`✅ Seeded: ${cat.name}`);
    }

    console.log('\n🌟 All initial categories successfully seeded!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
