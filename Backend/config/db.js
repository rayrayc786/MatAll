const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
      family: 4 // Force IPv4
    });
    console.log(`✅ MongoDB connected successfully to: ${conn.connection.name}`);
  } catch (err) {
    console.error('❌ MongoDB connection error details:');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    if (err.reason) console.error('Reason:', err.reason);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
