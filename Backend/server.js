require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const cors = require('cors');
const mongoose = require('mongoose');
const socketAuth = require('./middleware/socketAuth');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
console.log('Attempting to connect to MongoDB...');
mongoose.connect(process.env.MONGO_URI , {
  serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s for faster debugging
})
  .then(() => console.log('✅ MongoDB connected successfully to:', mongoose.connection.name))
  .catch(err => {
    console.error('❌ MongoDB connection error details:');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    if (err.reason) console.error('Reason:', err.reason);
  });

// Monitor connection events
mongoose.connection.on('error', err => {
  console.error('Mongoose runtime connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('Mongoose disconnected from MongoDB');
});

// Middleware
const allowedOrigins = [
  'https://build-it-quick-gules.vercel.app', 
  'http://localhost:5173', 
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve images from the "public/images" directory
const imagePath = path.join(__dirname, 'public', 'images');
console.log('Static images directory:', imagePath);
app.use('/images', express.static(imagePath));
// Fallback for /api/images if VITE_API_BASE_URL includes /api
app.use('/api/images', express.static(imagePath));

// Initialize Socket.io
const io = new Server(server, {
  cors: { 
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Redis setup
const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  console.log('Redis adapter connected');
}).catch((err) => {
  console.warn('Redis connection failed, using memory adapter');
});

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const userRequestRoutes = require('./routes/userRequestRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/user-requests', userRequestRoutes);

app.set('socketio', io);

app.get('/', (req, res) => {
  res.send('BuildItQuick API Server is running.');
});

// Socket Namespaces
const adminNamespace = io.of('/admin');
const customerNamespace = io.of('/customer');
const supplierNamespace = io.of('/supplier');

adminNamespace.use(socketAuth(['Admin']));
supplierNamespace.use(socketAuth(['Supplier']));
customerNamespace.use(socketAuth(['End User', 'Rider']));

adminNamespace.on('connection', (socket) => {
  console.log(`Admin connected: ${socket.id}`);
});

supplierNamespace.on('connection', (socket) => {
  console.log(`Supplier connected: ${socket.id} (Supplier ID: ${socket.user.supplierId})`);
  if (socket.user.supplierId) {
    socket.join(socket.user.supplierId.toString());
  }
});

customerNamespace.on('connection', (socket) => {
  console.log(`Customer/Rider connected: ${socket.id} (User ID: ${socket.user.id})`);
  if (socket.user.id) {
    socket.join(socket.user.id.toString());
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`BuildItQuick server running on port ${PORT}`);
});
