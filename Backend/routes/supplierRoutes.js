const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const auth = require('../middleware/auth');

router.get('/orders', auth(['Supplier']), supplierController.getSupplierOrders);
router.get('/orders/available', auth(['Supplier']), supplierController.getAvailableOrders);
router.post('/orders/:id/accept', auth(['Supplier']), supplierController.acceptOrder);
router.patch('/orders/:id/status', auth(['Supplier']), supplierController.updateOrderStatus);

module.exports = router;
