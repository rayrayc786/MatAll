const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const dns = require('dns');

// Fix for Windows querySrv issue
dns.setServers(['8.8.8.8', '1.1.1.1']);

const uri = process.env.MONGO_URI;
console.log('Testing connection to MongoDB Atlas with custom DNS...');

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 5000,
  family: 4
})
.then(() => {
  console.log('✅ Connected successfully!');
  process.exit(0);
})
.catch(err => {
  console.error('❌ Connection failed:', err.message);
  process.exit(1);
});
