require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const cors = require('cors');
const mongoose = require('mongoose');
const socketAuth = require('./middleware/socketAuth');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/builditquick')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
const allowedOrigins = ['https://build-it-quick-gules.vercel.app', 'http://localhost:5173'];
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
app.use(express.json());

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
const vendorRoutes = require('./routes/vendorRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vendor', vendorRoutes);

app.set('socketio', io);

app.get('/', (req, res) => {
  res.send('BuildItQuick API Server is running.');
});

// Socket Namespaces
const adminNamespace = io.of('/admin');
const customerNamespace = io.of('/customer');
const vendorNamespace = io.of('/vendor');

adminNamespace.use(socketAuth(['Admin']));
vendorNamespace.use(socketAuth(['Vendor']));
customerNamespace.use(socketAuth(['Buyer', 'Driver']));

adminNamespace.on('connection', (socket) => {
  console.log(`Admin connected: ${socket.id}`);
});

vendorNamespace.on('connection', (socket) => {
  console.log(`Vendor connected: ${socket.id} (Vendor ID: ${socket.user.vendorId})`);
  if (socket.user.vendorId) {
    socket.join(socket.user.vendorId.toString());
  }
});

customerNamespace.on('connection', (socket) => {
  console.log(`Customer/Driver connected: ${socket.id} (User ID: ${socket.user.id})`);
  if (socket.user.id) {
    socket.join(socket.user.id.toString());
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`BuildItQuick server running on port ${PORT}`);
});
