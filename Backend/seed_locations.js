require('dotenv').config();
const mongoose = require('mongoose');
const ServiceableArea = require('./models/ServiceableArea');

const locations = [
  { pincode: '122001', city: 'Gurgaon', state: 'Haryana', isActive: true },
  { pincode: '122002', city: 'Gurgaon', state: 'Haryana', isActive: true },
  { pincode: '122003', city: 'Gurgaon', state: 'Haryana', isActive: true },
  { pincode: '122018', city: 'Gurgaon', state: 'Haryana', isActive: true }
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await ServiceableArea.deleteMany({});
    await ServiceableArea.insertMany(locations);
    console.log('Seed successful: Serviceable areas added');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
