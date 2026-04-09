const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/verify', authController.verifyOTP);
router.get('/profile', auth(['End User', 'Admin', 'Rider', 'Supplier']), authController.getProfile);
router.put('/profile', auth(['End User', 'Admin', 'Rider', 'Supplier']), authController.updateProfile);
router.post('/profile/jobsites', auth(['End User', 'Admin', 'Supplier']), authController.addJobsite);
router.post('/favorites/toggle', auth(['End User', 'Admin', 'Supplier']), authController.toggleFavorite);
router.get('/favorites', auth(['End User', 'Admin', 'Supplier']), authController.getFavorites);

// Rider endpoints
router.post('/toggle-duty', auth(['Rider']), authController.toggleDuty);
router.get('/rider-stats', auth(['Rider']), authController.getDriverStats);

module.exports = router;
