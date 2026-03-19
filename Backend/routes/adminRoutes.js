const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/stats', adminController.getDashboardStats);
router.get('/fleet', adminController.getFleetStatus);
router.patch('/orders/:id/status', adminController.updateOrderStatus);

// Product management
router.post('/products/bulk-upload', upload.single('file'), adminController.bulkUploadProducts);
router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

module.exports = router;
