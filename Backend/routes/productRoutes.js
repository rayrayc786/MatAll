const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const optionalAuth = require('../middleware/optionalAuth');
const auth = require('../middleware/auth');

// Static routes MUST come before parameterized routes like /:id
router.get('/sub-categories', productController.getSubCategories);
router.get('/site/settings', productController.getSettings);
router.get('/filters', productController.getFilters);
router.get('/autocomplete', productController.autocomplete);
router.get('/categories', productController.getCategories);
router.get('/brands', productController.getBrands);
router.get('/offers', productController.getOffers);
router.get('/', optionalAuth, productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Reviews
router.get('/:id/reviews', productController.getProductReviews);
router.post('/:id/reviews', auth(), productController.createReview);

module.exports = router;
