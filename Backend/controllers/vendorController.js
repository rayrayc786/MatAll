const Order = require('../models/Order');

exports.getVendorOrders = async (req, res) => {
  try {
    const orders = await Order.find({ 
      vendorId: req.user.vendorId
    }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, vendorId: req.user.vendorId },
      { status },
      { new: true }
    );
    
    if (!order) return res.status(404).json({ message: 'Order not found for this vendor' });

    // Emit socket event for real-time update to vendor
    const io = req.app.get('socketio');
    io.of('/vendor').to(req.user.vendorId.toString()).emit('order-updated', order);
    
    // Emit socket event to customer for status tracking
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

exports.getAvailableOrders = async (req, res) => {
  try {
    // Orders that are pending and haven't been assigned to a vendor yet, 
    // OR orders specifically assigned to this vendor that are pending.
    const orders = await Order.find({ 
      $or: [
        { vendorId: req.user.vendorId, status: 'pending' },
        { vendorId: { $exists: false }, status: 'pending' }
      ]
    }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
