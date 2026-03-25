require('dotenv').config();
const mongoose = require('mongoose');

console.log('URI from env:', process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Successfully connected to:', mongoose.connection.name);
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection failed:', err.message);
    process.exit(1);
  });
