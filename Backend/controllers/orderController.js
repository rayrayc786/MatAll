const OrderService = require('../services/orderService');
const Order = require('../models/Order');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Settings = require('../models/Settings');

const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock12345',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret12345'
  });
};

/**
 * Centralized logic to check if the store is currently offline.
 * 
 * LOGIC EXPLAINED:
 * 1. MANUAL OVERRIDE: If 'isServiceEnabled' is false, the store is forced OFF.
 * 2. AUTOMATED SCHEDULE: If 'useOperatingHours' is true, we check the current time:
 *    a) NORMAL SHIFT (Start < End): Open if current time is BETWEEN start and end.
 *       Example: 09:00 - 21:00 -> Open if time is 10:00.
 *    b) OVERNIGHT SHIFT (Start > End): Open if current time is AFTER start OR BEFORE end.
 *       Example: 21:00 - 03:00 -> Open if time is 23:00 (after start) OR 01:00 (before end).
 * 3. FALLBACK: If neither of the above forces it OFF, the store is ONLINE.
 */
const isServiceOffline = async () => {
  const settings = await Settings.findOne();
  if (!settings) return false;
  
  // 1. Manual override (Always Closed) takes precedence
  if (!settings.isServiceEnabled) return settings.offlineMessage;

  // 2. Schedule-based check
  if (settings.useOperatingHours) {
    const now = new Date();
    // Minutes since midnight (0-1439)
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startH, startM] = settings.serviceStartTime.split(':').map(Number);
    const [endH, endM] = settings.serviceEndTime.split(':').map(Number);
    
    const startTime = startH * 60 + startM;
    const endTime = endH * 60 + endM;

    let isWithinHours = false;

    if (startTime < endTime) {
      // Normal case: e.g., 09:00 to 21:00
      isWithinHours = (currentTime >= startTime && currentTime <= endTime);
    } else {
      // Overnight case: e.g., 21:00 to 06:00
      isWithinHours = (currentTime >= startTime || currentTime <= endTime);
    }

    if (!isWithinHours) {
      return settings.offlineMessage || `We are currently closed. Our hours are ${settings.serviceStartTime} to ${settings.serviceEndTime}.`;
    }
  }

  // Store is LIVE
  return false;
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('userId', 'fullName phoneNumber email')
      .populate('items.productId', 'name images sku')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate('items.productId')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createRazorpayOrder = async (req, res) => {
  try {
    const offlineError = await isServiceOffline();
    if (offlineError) {
      return res.status(403).json({ message: offlineError });
    }

    const { amount } = req.body; // Amount in INR
    console.log(`[Razorpay] Creating order for amount: ${amount} INR`);
    
    const rzp = getRazorpayInstance();

    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}_${req.user.id.substring(0, 5)}`,
      payment_capture: 1
    };

    console.log('[Razorpay] Requesting order from Razorpay API...');
    const order = await rzp.orders.create(options);
    console.log(`[Razorpay] Order created: ${order.id}`);
    res.json(order);
  } catch (err) {
    console.error('Razorpay create order error:', err);
    const errorMessage = err.error?.description || err.message || 'Failed to create payment session';
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? err : undefined 
    });
  }
};

exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'secret12345')
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      return res.status(200).json({ message: "Payment verified successfully" });
    } else {
      return res.status(400).json({ message: "Invalid signature sent!" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.checkout = async (req, res) => {
  try {
    const offlineError = await isServiceOffline();
    if (offlineError) {
      return res.status(403).json({ message: offlineError });
    }

    const orderData = {
      ...req.body,
      userId: req.user.id
    };

    console.log('Processing Order Data:', orderData);
    const order = await OrderService.createOrder(orderData);

    const io = req.app.get('socketio');
    if (order.supplierId) {
      io.of('/supplier').to(order.supplierId.toString()).emit('new-order', order);
    }
    const safeOrder = order.toJSON ? order.toJSON() : order;
    
    // Real-time notification for Admin
    if (io) {
      console.log(`[Socket] Broadcasting new order ${safeOrder._id} to /admin namespace`);
      io.of('/admin').emit('new-order', safeOrder);
    } else {
      console.warn('[Socket] Server io instance not found in orderController!');
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await OrderService.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAvailableOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: 'handover-ready' }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.acceptOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id, 
      { status: 'dispatched', riderId: req.user.id }, 
      { new: true }
    );

    const io = req.app.get('socketio');
    if (order.userId) {
      io.of('/customer').to(order.userId.toString()).emit('order-status-update', { 
        orderId: order._id, 
        status: 'dispatched' 
      });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status, proofImageUrl } = req.body;
    const updateData = { status };
    if (proofImageUrl) updateData.proofImageUrl = proofImageUrl;

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });

    const io = req.app.get('socketio');
    if (order.userId) {
      io.of('/customer').to(order.userId.toString()).emit('order-status-update', { 
        orderId: order._id, 
        status: order.status 
      });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
