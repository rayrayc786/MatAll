const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Public endpoints for location and serviceability
router.get('/check-serviceability/:pincode', adminController.checkServiceability);

module.exports = router;
