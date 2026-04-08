const Order = require('../models/Order');
const DarkStore = require('../models/DarkStore');
const axios = require('axios');

const calculateOrderTotals = (items) => {
  let totalWeight = 0;
  let totalVolume = 0;
  let subTotal = 0; // Sum of (unitPrice * quantity) - basically item total incl GST
  let totalBaseAmount = 0; // Sum of items excluding GST
  let totalTaxAmount = 0;
  
  const mappedItems = items.map(item => {
    // Basic fields
    const unitPrice = item.unitPrice || item.price || 0; // Sale price (incl GST)
    const productId = item.productId || item.product;
    const quantity = item.quantity || 1;
    const weight = (item.totalWeight || 0);
    const volume = (item.totalVolume || 0);

    // GST Calculation logic
    // We now treat unitPrice as the BASE price (Excl GST)
    const totalTaxRate = item.taxRate || item.igst || 18; // Use provided tax rate or default
    
    const itemBasePrice = unitPrice;
    const itemTaxAmount = itemBasePrice * (totalTaxRate / 100);
    const itemTotalPrice = itemBasePrice + itemTaxAmount;
    
    const rowBaseTotal = itemBasePrice * quantity;
    const rowTaxTotal = itemTaxAmount * quantity;
    const rowTotal = itemTotalPrice * quantity;

    totalWeight += weight;
    totalVolume += volume;
    subTotal += rowTotal;
    totalBaseAmount += rowBaseTotal;
    totalTaxAmount += rowTaxTotal;

    return {
      productId,
      quantity,
      unitPrice,
      basePrice: itemBasePrice,
      taxRate: totalTaxRate,
      igstAmount: rowTaxTotal, // Simplified: storing total tax as IGST for now unless Split is needed
      cgstAmount: rowTaxTotal / 2,
      sgstAmount: rowTaxTotal / 2,
      totalWeight: weight,
      totalVolume: volume,
      category: item.category || 'General'
    };
  });

  // Additional Fees
  const platformFee = 19; // Fixed Rs. 19 incl GST
  const platformFeeBase = 19 / 1.18; // approx 16.10
  const platformFeeGST = 19 - platformFeeBase; // approx 2.90

  // Delivery Logic (example: Rs 150 incl GST if < 5000)
  const deliveryChargeInclGST = subTotal > 5000 ? 0 : 150;
  const deliveryChargeBase = deliveryChargeInclGST / 1.18;
  const deliveryChargeGST = deliveryChargeInclGST - deliveryChargeBase;

  const grandTotal = subTotal + platformFee + deliveryChargeInclGST;

  return { 
    totalAmount: grandTotal, 
    subTotal,
    totalBaseAmount: totalBaseAmount + platformFeeBase + deliveryChargeBase,
    totalTaxAmount: totalTaxAmount + platformFeeGST + deliveryChargeGST,
    platformFee,
    platformFeeGST,
    deliveryCharge: deliveryChargeInclGST,
    deliveryChargeGST,
    totalWeight, 
    totalVolume, 
    mappedItems 
  };
};

const determineVehicleClass = (weight) => {
  if (weight < 20) return 'Bike';
  if (weight < 200) return 'Pickup Truck';
  if (weight < 2000) return 'Flatbed Truck';
  return 'Heavy Trailer';
};

const createOrder = async (orderData) => {
  const { 
    totalAmount, subTotal, totalBaseAmount, totalTaxAmount, 
    platformFee, platformFeeGST, deliveryCharge, deliveryChargeGST,
    totalWeight, totalVolume, mappedItems 
  } = calculateOrderTotals(orderData.items);
  const vehicleClass = determineVehicleClass(totalWeight);

  // Auto-fetch darkStoreId if missing
  let darkStoreId = orderData.darkStoreId;
  if (!darkStoreId) {
    let defaultStore = await DarkStore.findOne();
    if (!defaultStore) {
      console.log('No DarkStore found. Creating a Default Hub for you...');
      defaultStore = await DarkStore.create({
        storeName: 'Default Hub - Punjab',
        location: { type: 'Point', coordinates: [76.7179, 30.7046] },
        serviceabilityRadius: 50000,
        isOpen: true
      });
    }
    darkStoreId = defaultStore._id;
  }

  const newOrder = new Order({
    ...orderData,
    userId: orderData.userId,
    items: mappedItems,
    totalAmount,
    subTotal,
    totalBaseAmount,
    totalTaxAmount,
    platformFee,
    platformFeeGST,
    deliveryCharge,
    deliveryChargeGST,
    totalWeight,
    totalVolume,
    vehicleClass,
    darkStoreId,
    deliveryAddress: {
      name: orderData.shippingAddress || 'Home',
      location: {
        type: 'Point',
        coordinates: [76.7179, 30.7046] // Default Punjab for mock
      }
    }
  });

  const savedOrder = await newOrder.save();
  
  // Async Sync to Hisaab Kitaab (Don't await to avoid slowing down checkout)
  // syncToHisaabKitaab(savedOrder).catch(err => console.error('HisaabKitaab Sync Error:', err.message));

  return savedOrder;
};

// const syncToHisaabKitaab = async (order) => {
//   const API_KEY = process.env.HISAAB_KITAAB_API_KEY;
//   if (!API_KEY) return;

//   try {
//     const invoiceData = {
//       invoice_number: `MATALL-${order._id.toString().slice(-6).toUpperCase()}`,
//       date: new Date(order.createdAt).toISOString().split('T')[0],
//       customer_name: order.deliveryAddress?.name || 'Walk-in Customer',
//       payment_method: order.paymentMethod || 'Cash',
//       items: order.items.map(item => ({
//         name: `Product ID: ${item.productId}`,
//         qty: item.quantity,
//         rate: item.unitPrice,
//         tax_rate: 0 // Modify if you have tax logic
//       })),
//       total_amount: order.totalAmount,
//       notes: `Automated sync from MatAll App. Order ID: ${order._id}. Incl platform fee Rs 19.`
//     };

//     await axios.post('https://api.hisabkitab.co/v1/invoices', invoiceData, {
//       headers: {
//         'Authorization': `Bearer ${API_KEY}`,
//         'Content-Type': 'application/json'
//       }
//     });
//     console.log(`[HisaabKitaab] Invoice synced successfully for Order ${order._id}`);
//   } catch (err) {
//     throw new Error(`Failed to sync: ${err.response?.data?.message || err.message}`);
//   }
// };

const getOrderById = async (orderId) => {
  return await Order.findById(orderId).populate('items.productId');
};

module.exports = {
  calculateOrderTotals,
  determineVehicleClass,
  createOrder,
  getOrderById
};
