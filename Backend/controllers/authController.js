const User = require('../models/User');
const jwt = require('jsonwebtoken');
const msg91Service = require('../services/msg91Service');

exports.login = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
    if (isDev && phoneNumber === '9999988888') {
      return res.json({ message: 'Dev mode: Use 111111' });
    }

    await msg91Service.sendOTP(phoneNumber);
    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    
    let isValid = false;
    const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
    if (isDev && phoneNumber === '9999988888' && otp === '111111') {
      isValid = true;
    } else {
      isValid = await msg91Service.verifyOTP(phoneNumber, otp);
    }

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Upsert User
    let user = await User.findOne({ phoneNumber }).populate('supplierId');
    if (!user) {
      user = new User({
        phoneNumber,
        fullName: 'New User', // Default name since we only have phone
        isVerified: true
      });
      await user.save();
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        id: user._id.toString(), 
        role: user.role, 
        phoneNumber: user.phoneNumber,
        supplierId: user.supplierId ? user.supplierId.toString() : undefined
      },
      process.env.JWT_SECRET || 'supersecretkey_matall',
      { expiresIn: '7d' }
    );
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-__v');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { fullName, email, jobsites } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (jobsites) user.jobsites = jobsites;

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleFavorite = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const index = user.favorites.indexOf(productId);
    if (index === -1) {
      user.favorites.push(productId);
    } else {
      user.favorites.splice(index, 1);
    }
    await user.save();
    res.json({ favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('favorites');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleDuty = async (req, res) => {

  try {
    const user = await User.findById(req.user.id);
    user.isOnline = !user.isOnline;
    await user.save();
    res.json({ isOnline: user.isOnline });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDriverStats = async (req, res) => {
  try {
    // Mocking driver performance metrics
    res.json({
      todayEarnings: 450.00,
      totalDeliveries: 12,
      missedDeliveries: 1,
      rating: 4.9,
      onlineHours: '6h 30m'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addJobsite = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.jobsites.push(req.body);
    await user.save();
    res.json(user.jobsites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
