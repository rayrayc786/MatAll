const OrderService = require('../services/orderService');
const Order = require('../models/Order');

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.checkout = async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      userId: req.user.id
    };

    console.log('Processing Order Data:', orderData);
    const order = await OrderService.createOrder(orderData);

    const io = req.app.get('socketio');
    if (order.vendorId) {
      io.of('/vendor').to(order.vendorId.toString()).emit('new-order', order);
      console.log(`Real-time notification sent to vendor: ${order.vendorId}`);
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
      { status: 'dispatched', driverId: req.user.id }, 
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
