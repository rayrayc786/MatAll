const { Server } = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const socketAuth = require('../middleware/socketAuth');

const initSocket = async (server, allowedOrigins) => {
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Redis setup for scaling sockets
  const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
  const subClient = pubClient.duplicate();

  try {
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    console.log('✅ Redis adapter connected for Socket.io');
  } catch (err) {
    console.warn('⚠️ Redis connection failed, using memory adapter for Socket.io');
  }

  // Socket Namespaces
  const adminNamespace = io.of('/admin');
  const customerNamespace = io.of('/customer');
  const supplierNamespace = io.of('/supplier');

  // Auth Middleware
  adminNamespace.use(socketAuth(['Admin']));
  supplierNamespace.use(socketAuth(['Supplier']));
  customerNamespace.use(socketAuth(['End User', 'Rider', 'Admin']));

  // Connections
  adminNamespace.on('connection', (socket) => {
    console.log(`👤 Admin connected: ${socket.id}`);
  });

  supplierNamespace.on('connection', (socket) => {
    console.log(`👤 Supplier connected: ${socket.id} (Supplier ID: ${socket.user.supplierId})`);
    if (socket.user.supplierId) {
      socket.join(socket.user.supplierId.toString());
    }
  });

  customerNamespace.on('connection', (socket) => {
    console.log(`👤 Customer connected: ${socket.id} (User ID: ${socket.user.id})`);
    if (socket.user.id) {
      socket.join(socket.user.id.toString());
    }
  });

  return io;
};

module.exports = initSocket;
