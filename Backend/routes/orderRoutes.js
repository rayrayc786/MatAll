const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');

router.get('/', orderController.getAllOrders);
router.get('/my', auth(), orderController.getMyOrders);
router.get('/available', auth(['Driver']), orderController.getAvailableOrders);
router.post('/', auth(), orderController.checkout);
router.post('/checkout', auth(), orderController.checkout); // Keep for compatibility if needed
router.get('/:id', orderController.getOrderById);

// Driver actions
router.post('/:id/accept', auth(['Driver']), orderController.acceptOrder);
router.patch('/:id/status', auth(['Driver', 'Admin']), orderController.updateStatus);

module.exports = router;