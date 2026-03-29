const Order = require('../models/Order');
const Supplier = require('../models/Supplier');

exports.getSupplierOrders = async (req, res) => {
  try {
    const orders = await Order.find({ 
      supplierId: req.user.supplierId
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
      { _id: req.params.id, supplierId: req.user.supplierId },
      { status },
      { new: true }
    );
    
    if (!order) return res.status(404).json({ message: 'Order not found for this supplier' });

    // Emit socket event for real-time update to supplier
    const io = req.app.get('socketio');
    io.of('/supplier').to(req.user.supplierId.toString()).emit('order-updated', order);
    
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
    const supplier = await Supplier.findById(req.user.supplierId);
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

    // Find orders where status is pending and NO supplier assigned yet
    // AND at least one item category matches supplier's categories
    const orders = await Order.find({ 
      status: 'pending',
      supplierId: { $exists: false },
      'items.category': { $in: supplier.categories }
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.acceptOrder = async (req, res) => {
  try {
    // Supplier accepts a pending order
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, status: 'pending', supplierId: { $exists: false } },
      { 
        status: 'supplier-confirmed', 
        supplierId: req.user.supplierId 
      },
      { new: true }
    );

    if (!order) return res.status(400).json({ message: 'Order already accepted or unavailable' });

    const io = req.app.get('socketio');
    if (order.userId) {
      io.of('/customer').to(order.userId.toString()).emit('order-status-update', { 
        orderId: order._id, 
        status: 'supplier-confirmed' 
      });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
