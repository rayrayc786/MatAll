const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Static routes MUST come before parameterized routes like /:id
router.get('/filters', productController.getFilters);
router.get('/autocomplete', productController.autocomplete);
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

module.exports = router;
