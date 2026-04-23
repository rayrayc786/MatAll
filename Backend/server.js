const dns = require('dns');
// Priority for modern Node versions (v17+) to fix connection issues on some networks
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
// Set DNS servers to Google's to fix querySrv ECONNREFUSED issues on some networks
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const express = require('express');
const compression = require('compression');
const http = require('http');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');

// Configurations
const connectDB = require('./config/db');
const initSocket = require('./config/socket');
const routes = require('./routes/index');
const { initCronJobs } = require('./services/cronService');

const app = express();
const server = http.createServer(app);

// Connect to Database
connectDB();

// Middleware
app.use(compression());
app.set('trust proxy', true);

const allowedOrigins = [
  'https://build-it-quick-gules.vercel.app',
  'https://matall.app',
  'https://www.matall.app', 
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

// Static Files & Uploads
const imagePath = path.join(__dirname, 'public', 'images');
const uploadPath = path.join(__dirname, 'uploads', 'products');

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

app.use('/images', express.static(imagePath));
app.use('/uploads/products', express.static(uploadPath));
app.use('/api/images', express.static(imagePath));
app.use('/api/uploads/products', express.static(uploadPath));

// API Routes
app.use('/api', routes);

// Initialize Socket.io (Returns IO instance)
let io;
initSocket(server, allowedOrigins).then(socketIo => {
  io = socketIo;
  app.set('socketio', io);
});

// Initialize Cron Jobs
initCronJobs();

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 MatAll server running on port ${PORT}`);
});

