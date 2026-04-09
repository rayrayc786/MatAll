const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const optionalAuth = require('../middleware/optionalAuth');

// Static routes MUST come before parameterized routes like /:id
router.get('/site/settings', productController.getSettings);
router.get('/filters', productController.getFilters);
router.get('/autocomplete', productController.autocomplete);
router.get('/categories', productController.getCategories);
router.get('/brands', productController.getBrands);
router.get('/offers', productController.getOffers);
router.get('/', optionalAuth, productController.getAllProducts);
router.get('/:id', productController.getProductById);

module.exports = router;
