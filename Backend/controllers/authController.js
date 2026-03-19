const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Mock OTP service (in-memory storage for simplicity)
const otpStore = new Map();

exports.login = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    // In a real app, send actual SMS here.
    const mockOTP = '1111';
    otpStore.set(phoneNumber, { mockOTP });

    console.log(`Sending Mock OTP ${mockOTP} to ${phoneNumber}`);
    res.json({ message: 'OTP sent successfully (Hint: 1111)' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    const storedData = otpStore.get(phoneNumber);

    if (!storedData || storedData.mockOTP !== otp) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Upsert User
    let user = await User.findOne({ phoneNumber });
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
        vendorId: user.vendorId ? user.vendorId.toString() : undefined
      },
      process.env.JWT_SECRET || 'supersecretkey_builditquick',
      { expiresIn: '7d' }
    );

    otpStore.delete(phoneNumber);
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
