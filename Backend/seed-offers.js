require('dotenv').config();
const mongoose = require('mongoose');
const Offer = require('./models/Offer');

const INITIAL_OFFERS = [
  { 
    title: 'Plyboard + Modular Hardware', 
    discount: 'Flat 20% OFF', 
    description: 'Upgrade your furniture with premium plywood and sleek modular hardware combos.',
    imageUrl: 'https://images.unsplash.com/photo-1623057000739-386c8d66717a?auto=format&fit=crop&q=80&w=400',
    isActive: true,
    link: '/products?category=Wooden%20Material'
  },
  { 
    title: 'Cieling Transformation Kit', 
    discount: 'Combo Deal ₹2999', 
    description: 'Dry Wall Screw + Fasteners + GI Wire Mesh + POP. All-in-one ceiling solution.',
    imageUrl: 'https://images.unsplash.com/photo-1589481169991-40ee028883cd?auto=format&fit=crop&q=80&w=400',
    isActive: true,
    link: '/products?category=Cieling'
  },
  { 
    title: 'Electrical Essentials Bundle', 
    discount: 'Upto 40% OFF', 
    description: 'Premium wires, switches, and lighting fixtures from top brands like Havells.',
    imageUrl: 'https://images.unsplash.com/photo-1558402529-d2638a7023e9?auto=format&fit=crop&q=80&w=400',
    isActive: true,
    link: '/products?category=Electrical%20Material'
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Offer.deleteMany({});
    console.log('🗑️  Cleared existing offers.');

    for (const offer of INITIAL_OFFERS) {
      await Offer.create(offer);
      console.log(`✅ Seeded: ${offer.title}`);
    }

    console.log('\n🌟 Initial offers successfully seeded!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
