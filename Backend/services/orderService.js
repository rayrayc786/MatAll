const Order = require('../models/Order');
const DarkStore = require('../models/DarkStore');
const axios = require('axios');

const calculateOrderTotals = (items, settings = null) => {
  let totalWeight = 0;
  let totalVolume = 0;
  let totalBaseAmount = 0; // Cumulative base amount for all items
  let totalTaxAmount = 0;  // Cumulative tax amount for all items
  
  // Use settings or default values
  const fee_platform = settings?.platformFee ?? 15;
  const threshold_free = settings?.freeDeliveryThreshold ?? 5000;

  // 1. Determine logistics category based on items
  let maxCat = 'light';
  items.forEach(item => {
    const product = item.product;
    const selectedVariantName = item.selectedVariant;
    const variant = product?.variants?.find(v => v.name === selectedVariantName);
    
    // Priority: 1. Variant Logistics Category, 2. Product Logistics Category, 3. Item Category (backwards compatibility), 4. Default 'Light'
    const cat = (variant?.logisticsCategory || product?.logisticsCategory || item.category || 'Light').toLowerCase();
    
    if (cat === 'heavy') maxCat = 'heavy';
    else if (cat === 'medium' && maxCat !== 'heavy') maxCat = 'medium';
  });

  const logisticsRates = settings?.logisticsRates || {
    light: { rate: 50, mode: "Bike" },
    medium: { rate: 150, mode: "Three Wheeler" },
    heavy: { rate: 500, mode: "Truck" }
  };

  const selectedLogistics = logisticsRates[maxCat] || { rate: 50, mode: "Bike" };
  const fee_delivery = selectedLogistics.rate;

  const mappedItems = items.map(item => {
    // unitPrice is considered BASE price
    const unitPrice = item.unitPrice || item.price || 0; 
    const hydratedProduct = item.product;
    const productId = hydratedProduct?._id || item.productId || item.product;
    const quantity = item.quantity || 1;
    
    // Fallback to product metadata for weight/volume if not in item
    const weight = item.totalWeight || (hydratedProduct?.inventory?.unitWeight ? (hydratedProduct.inventory.unitWeight * quantity) / 1000 : 0);
    const volume = item.totalVolume || 0;

    const totalTaxRate = item.taxRate || 18; // Default 18% GST
    
    const rowBaseTotal = unitPrice * quantity;
    const rowTaxTotal = rowBaseTotal * (totalTaxRate / 100);

    totalWeight += weight;
    totalVolume += volume;
    totalBaseAmount += rowBaseTotal;
    totalTaxAmount += rowTaxTotal;

    return {
      productId,
      quantity,
      unitPrice,
      basePrice: unitPrice,
      taxRate: totalTaxRate,
      igstAmount: rowTaxTotal,
      cgstAmount: rowTaxTotal / 2,
      sgstAmount: rowTaxTotal / 2,
      totalWeight: weight,
      totalVolume: volume,
      category: item.category || hydratedProduct?.category || 'General'
    };
  });

  // Additional Fees logic: treating them as INCLUSIVE of GST (matches Frontend display)
  const platformFeeTotal = fee_platform; 
  const platformFeeBase = platformFeeTotal / 1.18; 
  const platformFeeGST = platformFeeTotal - platformFeeBase; 

  const subTotalInclGST = totalBaseAmount + totalTaxAmount;
  const deliveryChargeInclGST = subTotalInclGST > threshold_free ? 0 : fee_delivery;
  const deliveryChargeBase = deliveryChargeInclGST / 1.18;
  const deliveryChargeGST = deliveryChargeInclGST - deliveryChargeBase;

  const grandTotal = subTotalInclGST + platformFeeTotal + deliveryChargeInclGST;

  return { 
    totalAmount: grandTotal, 
    subTotal: subTotalInclGST, // Total of items incl GST
    totalBaseAmount: totalBaseAmount + platformFeeBase + deliveryChargeBase,
    totalTaxAmount: totalTaxAmount + platformFeeGST + deliveryChargeGST,
    platformFee: platformFeeTotal,
    platformFeeGST,
    deliveryCharge: deliveryChargeInclGST,
    deliveryChargeGST,
    totalWeight, 
    totalVolume, 
    vehicleClass: selectedLogistics.mode,
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
  const Product = require('../models/Product');
  const Settings = require('../models/Settings');
  const settings = await Settings.findOne();

  // Populate products for each item to get correct category/logistics category
  const hydratedItems = await Promise.all(orderData.items.map(async (item) => {
    const product = await Product.findById(item.productId || item.product);
    return {
      ...item,
      product // pass the full product object for calculateOrderTotals
    };
  }));

  const { 
    totalAmount, subTotal, totalBaseAmount, totalTaxAmount, 
    platformFee, platformFeeGST, deliveryCharge, deliveryChargeGST,
    totalWeight, totalVolume, vehicleClass, mappedItems 
  } = calculateOrderTotals(hydratedItems, settings);

  // Auto-fetch darkStoreId if missing
  let darkStoreId = orderData.darkStoreId;
  if (!darkStoreId) {
    let defaultStore = await DarkStore.findOne();
    if (!defaultStore) {
      console.log('No DarkStore found. Creating a Default Hub for you...');
      defaultStore = await DarkStore.create({
        storeName: 'Main Warehouse Hub',
        location: { type: 'Point', coordinates: [0, 0] },
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
      area: orderData.deliveryAddress?.area || '',
      fullAddress: orderData.deliveryAddress?.fullAddress || '',
      contactPhone: orderData.deliveryAddress?.contactPhone || '',
      pincode: orderData.deliveryAddress?.pincode || '',
      city: orderData.deliveryAddress?.city || '',
      state: orderData.deliveryAddress?.state || '',
      country: orderData.deliveryAddress?.country || 'India',
      location: orderData.deliveryAddress?.location || {
        type: 'Point',
        coordinates: [0, 0] // Default fallback if no location provided
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
