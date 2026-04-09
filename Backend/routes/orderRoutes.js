const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');

router.get('/', orderController.getAllOrders);
router.get('/my-orders', auth(), orderController.getMyOrders);
router.get('/my', auth(), orderController.getMyOrders); // Alias for compatibility
router.get('/available', auth(['Rider']), orderController.getAvailableOrders);

// Razorpay Payment Routes
router.post('/razorpay/create-order', auth(), orderController.createRazorpayOrder);
router.post('/razorpay/verify', auth(), orderController.verifyRazorpayPayment);

router.post('/', auth(), orderController.checkout);
router.post('/checkout', auth(), orderController.checkout);

router.get('/:id', orderController.getOrderById);

// Rider actions
router.post('/:id/accept', auth(['Rider']), orderController.acceptOrder);
router.patch('/:id/status', auth(['Rider', 'Admin']), orderController.updateStatus);

module.exports = router;