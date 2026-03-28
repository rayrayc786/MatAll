const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

console.log('--- Admin Routes Initializing ---');

router.get('/ping', (req, res) => res.json({ status: 'Admin routes active' }));

router.get('/stats', adminController.getDashboardStats);
router.get('/fleet', adminController.getFleetStatus);
router.patch('/orders/:id/status', adminController.updateOrderStatus);

// Product management
router.post('/products/bulk-upload', upload.single('file'), adminController.bulkUploadProducts);
router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/clear-all', adminController.clearAllProducts);
router.delete('/products/:id', adminController.deleteProduct);

// User management
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Vendor management
router.get('/vendors', adminController.getAllVendors);
router.post('/vendors', adminController.createVendor);
router.put('/vendors/:id', adminController.updateVendor);
router.delete('/vendors/:id', adminController.deleteVendor);

// Category management
router.get('/categories', adminController.getAllCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// Sub-Category management
router.get('/sub-categories', adminController.getAllSubCategories);
router.post('/sub-categories', adminController.createSubCategory);
router.put('/sub-categories/:id', adminController.updateSubCategory);
router.delete('/sub-categories/:id', adminController.deleteSubCategory);

// Brand management
router.get('/brands', adminController.getAllBrands);
router.post('/brands', adminController.createBrand);
router.put('/brands/:id', adminController.updateBrand);
router.delete('/brands/:id', adminController.deleteBrand);

// Unit management
router.get('/units', adminController.getAllUnits);
router.post('/units', adminController.createUnit);
router.put('/units/:id', adminController.updateUnit);
router.delete('/units/:id', adminController.deleteUnit);

// Variant Title management
router.get('/variant-titles', adminController.getAllVariantTitles);
router.post('/variant-titles', adminController.createVariantTitle);
router.put('/variant-titles/:id', adminController.updateVariantTitle);
router.delete('/variant-titles/:id', adminController.deleteVariantTitle);

// Delivery Time management
router.get('/delivery-times', adminController.getAllDeliveryTimes);
router.post('/delivery-times', adminController.createDeliveryTime);
router.put('/delivery-times/:id', adminController.updateDeliveryTime);
router.delete('/delivery-times/:id', adminController.deleteDeliveryTime);

module.exports = router;
