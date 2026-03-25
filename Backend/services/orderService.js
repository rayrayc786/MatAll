const Order = require('../models/Order');
const DarkStore = require('../models/DarkStore');

const calculateOrderTotals = (items) => {
  let totalWeight = 0;
  let totalVolume = 0;
  let totalAmount = 0;
  
  const mappedItems = items.map(item => {
    const unitPrice = item.unitPrice || item.price || 0;
    const productId = item.productId || item.product;
    const quantity = item.quantity || 1;
    const weight = item.totalWeight || 0;
    const volume = item.totalVolume || 0;

    totalWeight += weight;
    totalVolume += volume;
    totalAmount += (unitPrice * quantity);

    return {
      productId,
      quantity,
      unitPrice,
      totalWeight: weight,
      totalVolume: volume,
      category: item.category || 'General'
    };
  });

  // Example discount logic
  const totalQty = mappedItems.reduce((sum, item) => sum + item.quantity, 0);
  if (totalQty > 10) {
    totalAmount *= 0.9;
  }

  return { totalAmount, totalWeight, totalVolume, mappedItems };
};

const determineVehicleClass = (weight) => {
  if (weight < 20) return 'Bike';
  if (weight < 200) return 'Pickup Truck';
  if (weight < 2000) return 'Flatbed Truck';
  return 'Heavy Trailer';
};

const createOrder = async (orderData) => {
  const { totalAmount, totalWeight, totalVolume, mappedItems } = calculateOrderTotals(orderData.items);
  const vehicleClass = determineVehicleClass(totalWeight);

  // Auto-fetch darkStoreId if missing
  let darkStoreId = orderData.darkStoreId;
  if (!darkStoreId) {
    const defaultStore = await DarkStore.findOne();
    if (defaultStore) {
      darkStoreId = defaultStore._id;
    } else {
      throw new Error('No DarkStore available to fulfill the order');
    }
  }

  const newOrder = new Order({
    ...orderData,
    userId: orderData.userId,
    items: mappedItems,
    totalAmount,
    totalWeight,
    totalVolume,
    vehicleClass,
    darkStoreId,
    status: 'pending',
    deliveryAddress: {
      name: orderData.shippingAddress || 'Home',
      location: {
        type: 'Point',
        coordinates: [76.7179, 30.7046] // Default Punjab for mock
      }
    }
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
