const Order = require('../models/Order');
const Vendor = require('../models/Vendor');

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
    const vendor = await Vendor.findById(req.user.vendorId);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    // Find orders where status is pending and NO vendor assigned yet
    // AND at least one item category matches vendor's categories
    const orders = await Order.find({ 
      status: 'pending',
      vendorId: { $exists: false },
      'items.category': { $in: vendor.categories }
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.acceptOrder = async (req, res) => {
  try {
    // Vendor accepts a pending order
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, status: 'pending', vendorId: { $exists: false } },
      { 
        status: 'vendor-confirmed', 
        vendorId: req.user.vendorId 
      },
      { new: true }
    );

    if (!order) return res.status(400).json({ message: 'Order already accepted or unavailable' });

    const io = req.app.get('socketio');
    if (order.userId) {
      io.of('/customer').to(order.userId.toString()).emit('order-status-update', { 
        orderId: order._id, 
        status: 'vendor-confirmed' 
      });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
