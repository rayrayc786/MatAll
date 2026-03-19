const Order = require('../models/Order');

const calculateOrderTotals = (items) => {
  let totalWeight = 0;
  let totalVolume = 0;
  let totalAmount = 0;
  
  items.forEach(item => {
    totalWeight += (item.totalWeight || 0);
    totalVolume += (item.totalVolume || 0);
    totalAmount += (item.unitPrice * item.quantity);
  });

  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  if (totalQty > 10) {
    totalAmount *= 0.9;
  }

  return { totalAmount, totalWeight, totalVolume };
};

const determineVehicleClass = (weight) => {
  if (weight < 20) return 'Bike';
  if (weight < 200) return 'Pickup Truck';
  if (weight < 2000) return 'Flatbed Truck';
  return 'Heavy Trailer';
};

const createOrder = async (orderData) => {
  const totals = calculateOrderTotals(orderData.items);
  const vehicleClass = determineVehicleClass(totals.totalWeight);

  const newOrder = new Order({
    ...orderData,
    ...totals,
    vehicleClass,
    status: 'pending'
  });

  return await newOrder.save();
};

const getOrderById = async (orderId) => {
  return await Order.findById(orderId).populate('items.productId');
};

module.exports = {
  calculateOrderTotals,
  determineVehicleClass,
  createOrder,
  getOrderById
};
