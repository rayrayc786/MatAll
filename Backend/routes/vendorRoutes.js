const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const auth = require('../middleware/auth');

router.get('/orders', auth(['Vendor']), vendorController.getVendorOrders);
router.patch('/orders/:id/status', auth(['Vendor']), vendorController.updateOrderStatus);

module.exports = router;
