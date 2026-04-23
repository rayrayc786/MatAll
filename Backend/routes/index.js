const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const orderRoutes = require('./orderRoutes');
const adminRoutes = require('./adminRoutes');
const supplierRoutes = require('./supplierRoutes');
const userRequestRoutes = require('./userRequestRoutes');
const onDemandRoutes = require('./onDemandRoutes');
const reviewRoutes = require('./reviewRoutes');
const locationRoutes = require('./locationRoutes');

// API Routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);
router.use('/supplier', supplierRoutes);
router.use('/user-requests', userRequestRoutes);
router.use('/on-demand', onDemandRoutes);
router.use('/reviews', reviewRoutes);
router.use('/location', locationRoutes);

// Root route
router.get('/', (req, res) => {
  res.send('MatAll API Server is running.');
});

module.exports = router;
