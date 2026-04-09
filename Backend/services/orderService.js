const Order = require('../models/Order');
const DarkStore = require('../models/DarkStore');
const axios = require('axios');

const calculateOrderTotals = (items, settings = null) => {
  let totalWeight = 0;
  let totalVolume = 0;
  let subTotal = 0; // Sum of (unitPrice * quantity) - basically item total incl GST
  let totalBaseAmount = 0; // Sum of items excluding GST
  let totalTaxAmount = 0;
  
  // Use settings or default values
  const fee_platform = settings?.platformFee ?? 19;
  const fee_delivery = settings?.deliveryCharge ?? 150;
  const threshold_free = settings?.freeDeliveryThreshold ?? 5000;

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
  const platformFee = fee_platform; 
  const platformFeeBase = platformFee / 1.18; 
  const platformFeeGST = platformFee - platformFeeBase; 

  // Delivery Logic
  const deliveryChargeInclGST = subTotal > threshold_free ? 0 : fee_delivery;
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
  const Settings = require('../models/Settings');
  const settings = await Settings.findOne();

  const { 
    totalAmount, subTotal, totalBaseAmount, totalTaxAmount, 
    platformFee, platformFeeGST, deliveryCharge, deliveryChargeGST,
    totalWeight, totalVolume, mappedItems 
  } = calculateOrderTotals(orderData.items, settings);
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
      name: orderData.deliveryAddress?.name || 'Home',
      fullAddress: orderData.deliveryAddress?.fullAddress || '',
      pincode: orderData.deliveryAddress?.pincode || '',
      city: orderData.deliveryAddress?.city || '',
      state: orderData.deliveryAddress?.state || '',
      country: orderData.deliveryAddress?.country || 'India',
      location: orderData.deliveryAddress?.location || {
        type: 'Point',
        coordinates: [76.7179, 30.7046] // Fallback Punjab
      }
    }
  });

  const savedOrder = await newOrder.save();
  
  // Async Sync to Hisaab Kitaab (Don't await to avoid slowing down checkout)
  syncToHisaabKitaab(savedOrder._id).catch(err => console.error('HisaabKitaab Sync Error:', err.message));

  return savedOrder;
};

const syncToHisaabKitaab = async (orderId) => {
  const API_KEY = process.env.HISAAB_KITAAB_API_KEY;
  if (!API_KEY) {
    console.warn('[HisabKitab] API Key missing. Skipping sync.');
    return;
  }

  try {
    // Populate the order with product details for naming
    const order = await Order.findById(orderId).populate('items.productId');
    if (!order) return;

    const invoiceData = {
      invoice_number: `BIQ-${order._id.toString().slice(-6).toUpperCase()}`,
      date: new Date(order.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-'), // DD-MM-YYYY
      customer_ledger_id: parseInt(process.env.HISABKITAB_CASH_LEDGER_ID || '1604700'),
      invoice_type: 1, // Standard Tax Invoice
      customer_name: order.deliveryAddress?.name || 'Customer',
      billing_address: {
        address_1: order.deliveryAddress?.fullAddress || 'N/A',
        country_id: 1, // India
        state_id: 1,   // Default
        city_id: 1,    // Default
        pin_code: order.deliveryAddress?.pincode || '110001'
      },
      payment_method: order.paymentMethod || 'COD',
      items: order.items.map(item => ({
        name: item.productId?.name || `Product ${item.productId}`,
        qty: item.quantity,
        rate: item.unitPrice,
        tax_rate: item.taxRate || 18
      })),
      total_amount: order.totalAmount,
      notes: `Order ID: ${order._id}. Paid: ₹${order.paidAmount || 0}. Balance: ₹${(order.totalAmount - (order.paidAmount || 0)).toFixed(2)}. Automated sync from BuildItQuick App.`
    };

    await axios.post('https://api.hisabkitab.co/third-party/sale-transactions', invoiceData, {
      headers: {
        'ApiKey': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log(`[HisabKitab] Invoice synced successfully for Order ${order._id}`);
  } catch (err) {
    console.error(`[HisabKitab] Sync Failed for Order ${orderId}: ${err.response?.data?.message || err.message}`);
  }
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
