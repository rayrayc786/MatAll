require('dotenv').config();
const mongoose = require('mongoose');

// Using system defaults for DNS since custom servers are failing or blocked
const uri = process.env.MONGO_URI;
console.log('Testing connection to MongoDB Atlas with system default DNS...');

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 5000,
  family: 4
})
.then(() => {
  console.log('✅ Connected successfully with system DNS!');
  process.exit(0);
})
.catch(err => {
  console.error('❌ Connection failed with system DNS:', err.message);
  process.exit(1);
});
