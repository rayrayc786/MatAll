const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/verify', authController.verifyOTP);
router.get('/profile', auth(['Buyer', 'Admin', 'Driver', 'Vendor']), authController.getProfile);
router.put('/profile', auth(['Buyer', 'Admin', 'Driver', 'Vendor']), authController.updateProfile);
router.post('/favorites/toggle', auth(['Buyer', 'Admin', 'Vendor']), authController.toggleFavorite);
router.get('/favorites', auth(['Buyer', 'Admin', 'Vendor']), authController.getFavorites);

// Driver endpoints
router.post('/toggle-duty', auth(['Driver']), authController.toggleDuty);
router.get('/driver-stats', auth(['Driver']), authController.getDriverStats);

module.exports = router;
