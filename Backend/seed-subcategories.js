require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');
const SubCategory = require('./models/SubCategory');

const DATA = {
  'Bathroom': ['Door Hook/ Cloth Hook', 'Jet Spray'],
  'Cieling': ['Dry Wall Screw', 'Fasteners', 'GI Wire Mesh (Jaali)', 'Gypsum Board', 'POP'],
  'Electrical Material': ['COB Light', 'Cieling Lights', 'Clip', 'Fan', 'Flexible Pipe', 'GI Box', 'MCB/ RCCB', 'Pipe', 'Regulator', 'Rope Light', 'Sockets', 'Strip Light', 'Surface Light', 'Switch', 'Tape', 'Tube Light', 'Wires'],
  'Modular Hardware': ['Box Profile', 'Cabinet Edge Profile', 'Channels', 'Common Accessories', 'Door Edge Profile', 'Door Profile', 'Drawers & Pullout', 'Fixtures', 'Glass Door Profiles', 'Hinges', 'Kitchen Accessories', 'Locks', 'Pistons & Shocker', 'Wardrobe Accessories', 'Wardrobe Sliding System'],
  'Paint': ['Exterior Paint', 'Floor Covering Sheet', 'Grout', 'Interior Paint', 'Tools', 'Wall Putty', 'Waterproofing'],
  'Plumbing': ['Adhesive Tape', 'Bends & Connectors', 'Connection Pipe', 'Faucets', 'Pipes', 'Silicon Sealant', 'Solvent', 'Waste Pipe'],
  'Tools': ['Inch Tape'],
  'Wooden Material': ['Adhesive', 'Blockboard', 'Door Closure', 'Door Latch', 'Door Stopper', 'Edgeband', 'HDHMR', 'MDF', 'PVC Board', 'Plywood']
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // First clear ALL existing sub-categories to prevent duplicates or orphans
    await SubCategory.deleteMany({});
    console.log('🗑️  Cleared existing sub-categories.');

    for (const [catName, subCats] of Object.entries(DATA)) {
      const category = await Category.findOne({ name: catName });
      if (!category) {
        console.warn(`⚠️  Category "${catName}" not found. Skipping...`);
        continue;
      }

      console.log(`\n📂 Seeding sub-categories for: ${catName}`);
      for (const subName of subCats) {
        await SubCategory.create({
          name: subName,
          categoryId: category._id,
          isActive: true
        });
        console.log(`  - ${subName}`);
      }
    }

    console.log('\n🌟 All sub-categories successfully seeded!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
