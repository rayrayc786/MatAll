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
    // unitPrice is considered INCLUSIVE of GST (matches salePrice)
    const unitPrice = item.unitPrice || item.price || 0; 
    const hydratedProduct = item.product;
    const productId = hydratedProduct?._id || item.productId || item.product;
    const quantity = item.quantity || 1;
    
    // Fallback to product metadata for weight/volume if not in item
    const weight = item.totalWeight || (hydratedProduct?.inventory?.unitWeight ? (hydratedProduct.inventory.unitWeight * quantity) / 1000 : 0);
    const volume = item.totalVolume || 0;

    const totalTaxRate = item.taxRate || 18; 
    
    // Reverse calculate the Base Price and Tax from the Inclusive Price
    const rowTotalInclGST = unitPrice * quantity;
    const rowBaseTotal = rowTotalInclGST / (1 + totalTaxRate / 100);
    const rowTaxTotal = rowTotalInclGST - rowBaseTotal;

    totalWeight += weight;
    totalVolume += volume;
    totalBaseAmount += rowBaseTotal;
    totalTaxAmount += rowTaxTotal;

    // Look up the selected variant to snapshot its attributes and image
    const selectedVariantName = item.selectedVariant || '';
    const matchedVariant = hydratedProduct?.variants?.find(v => v.name === selectedVariantName) || hydratedProduct?.variants?.[0];
    const variantAttrs = matchedVariant?.attributes;
    // Convert Mongoose Map to plain object if needed
    const variantAttributes = variantAttrs instanceof Map ? Object.fromEntries(variantAttrs) : (variantAttrs || {});
    const variantImage = matchedVariant?.images?.[0] || hydratedProduct?.imageUrl || '';

    return {
      productId,
      selectedVariant: selectedVariantName,
      variantAttributes,
      variantImage,
      selectedVariantData: matchedVariant ? (matchedVariant.toObject ? matchedVariant.toObject() : matchedVariant) : null,
      quantity,
      unitPrice,
      basePrice: unitPrice / (1 + totalTaxRate / 100), // Store the per-unit base price (Excl GST)
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

  const subTotalInclGST = totalBaseAmount + totalTaxAmount;
  const deliveryChargeInclGST = subTotalInclGST > threshold_free ? 0 : fee_delivery;

  const grandTotal = subTotalInclGST + platformFeeTotal + deliveryChargeInclGST;

  return { 
    totalAmount: grandTotal, 
    subTotal: subTotalInclGST, // Total of items incl GST
    totalBaseAmount: totalBaseAmount,
    totalTaxAmount: totalTaxAmount,
    platformFee: platformFeeTotal,
    deliveryCharge: deliveryChargeInclGST,
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
    const order = await Order.findById(orderId).populate('items.productId');
    if (!order) return;

    // 0. Fetch Next Invoice Number
    let invoiceNumber = `0001`; 
    try {
      const nextNumRes = await axios.get('https://api.hisabkitab.co/third-party/sale-transactions/next-invoice-number', {
        headers: { 'ApiKey': API_KEY }
      });
      if (nextNumRes.data && nextNumRes.data.data) {
        invoiceNumber = nextNumRes.data.data;
      }
    } catch (numErr) {
      console.warn('[HisabKitab] Failed to fetch next invoice number, falling back.', numErr.message);
    }
    
    // Enforce the FY prefix requested (2026/2027-XXXX)
    let rawNumber = invoiceNumber.toString();
    let numericMatch = rawNumber.match(/\d+/g);
    let numericPart = numericMatch ? numericMatch[numericMatch.length - 1].padStart(4, '0') : '0001';
    
    let finalInvoiceNumber = `2026/2027-${numericPart}`;
    

    // GST Rate to ID Mapping
    const GST_RATE_TO_ID = {
      5: 7, 12: 9, 18: 10, 28: 11, 0: 12
    };

    const items = [];

    // 1. Add Product Items (Type 2 Item Sale expects 'items' array)
    for (const item of order.items) {
      // Compute true basePrice defensively backwards from the Tax-Inclusive `price` if the root DB document missed injecting it or Mongoose sets to 0
      // Round RPU first to 2 decimals, then calculate total, to ensure RPU * Qty = Total matches HisabKitab's validation
      const rpu = item.basePrice ? Number(item.basePrice.toFixed(2)) : Number((item.price / (1 + (item.taxRate / 100))).toFixed(2));
      const itemBaseTotal = Number((rpu * item.quantity).toFixed(2));
      // Determine the SKU (prioritize Variant SKU, fallback to Product root SKU)
      let productSku = null;
      let fallbackSearchName = null;
      
      if (item.productId) {
         fallbackSearchName = item.productId.productName;
         
         // Priority variant-level SKU identification using all available identifiers
         if (item.productId.variants) {
           const matchingVariant = item.productId.variants.find(v => 
              (item.variantId && String(v.variantId) === String(item.variantId)) ||
              (item.variantId && v._id && String(v._id) === String(item.variantId)) ||
              (v.name && item.selectedVariant && v.name === item.selectedVariant) || 
              (v.name && item.selectedVariant && v.name.replace(/\s/g,'').toLowerCase() === item.selectedVariant.replace(/\s/g,'').toLowerCase())
           );
           if (matchingVariant && matchingVariant.sku) productSku = matchingVariant.sku;
         }
         
         // Base product SKU as second priority if variant doesn't have one
         if (!productSku) productSku = item.productId.sku || null;
      }

      // Default fallback Item ID and Unit ID
      let resolvedItemId = parseInt(process.env.HISABKITAB_DEFAULT_ITEM_ID || '0');
      let resolvedUnitId = 29; // 29 is typically PCS in HisaabKitab
      let resolvedLedgerId = parseInt(process.env.HISABKITAB_SALES_LEDGER_ID || '1604692');
      let resolvedHsn = item.productId?.hsnCode || "8544";

      const brand = item.productId?.brand || '';
      const displayName = `${brand} ${fallbackSearchName}`.trim();
      
      // Attempt to lookup Hisaab Kitab's internal Item ID by STRICT SKU matching ONLY
      if (productSku) {
        console.log(`[HisabKitab] Searching inventory for SKU ID: "${productSku}"`);
        let foundExact = null;
        try {
          let allItems = [];
          let currentPage = 1;
          const seenIds = new Set();

          // HisabKitab pagination fix: Trying page_no alongside page as the API seems to ignore 'page'
          while (true) {
            const limit = 150;
            const skip = (currentPage - 1) * limit;
            
            // Shotgun approach: adding every common pagination parameter to ensure the API responds
            const skuSearchRes = await axios.get(`https://api.hisabkitab.co/third-party/items?per_page=${limit}&limit=${limit}&page=${currentPage}&page_no=${currentPage}&p=${currentPage}&skip=${skip}&offset=${skip}`, {
              headers: { 'ApiKey': API_KEY }
            });

            const pageData = skuSearchRes.data?.data;
            if (!pageData || !Array.isArray(pageData) || pageData.length === 0) break;
            
            // Console log the first item to verify if pagination is working
            console.log(`[HisabKitab] Page ${currentPage} First Item: "${pageData[0].item_name}" (ID: ${pageData[0].id})`);

            let newItemsInThisPage = 0;
            for (const i of pageData) {
              const idStr = String(i.id);
              if (idStr && !seenIds.has(idStr)) {
                seenIds.add(idStr);
                allItems.push(i);
                newItemsInThisPage++;
              }
            }
            
            console.log(`[HisabKitab] Page ${currentPage} received ${pageData.length} items. (${newItemsInThisPage} were new). Total Unique: ${allItems.length}`);
            
            if (newItemsInThisPage === 0) {
              console.log(`[HisabKitab] STOPPED: No new items on page ${currentPage}.`);
              break;
            }

            if (currentPage >= 60) break; 
            currentPage++;
          }
          
          // Debugging: Save the COMPLETE inventory to JSON
          try {
            const fs = require('fs');
            const path = require('path');
            const debugPath = path.join(__dirname, '../hisabkitab_inventory_debug.json');
            fs.writeFileSync(debugPath, JSON.stringify(allItems, null, 2));
            console.log(`[HisabKitab] DEBUG: Inventory file updated with ${allItems.length} items.`);
          } catch (err) {
            console.warn('[HisabKitab] Could not save inventory debug file:', err.message);
          }
          
          if (allItems.length > 0) {
            // Strict SKU matching against the complete inventory
            const exactItem = allItems.find(i => 
               (i.sku && String(i.sku).trim() === String(productSku).trim()) || 
               (i.barcode && String(i.barcode).trim() === String(productSku).trim())
            );
            
            if (exactItem) {
              console.log(`[HisabKitab] SUCCESS: Found SKU match. Name: "${exactItem.item_name}", ID: ${exactItem.id}`);
              foundExact = exactItem;
            }
          }

          if (foundExact && foundExact.id) {
            resolvedItemId = foundExact.id;
            resolvedUnitId = foundExact.unit_of_measurement || 29;
            resolvedLedgerId = foundExact.income_ledger_id || resolvedLedgerId;
            if (foundExact.hsn_sac_code) resolvedHsn = foundExact.hsn_sac_code;
          } else {
            console.warn(`[HisabKitab] WARNING: SKU "${productSku}" not found in total inventory of ${allItems.length} items. Using default ID.`);
          }
        } catch (skuErr) {
          console.error(`[HisabKitab] Error during inventory lookup:`, skuErr.message);
        }
      }

      items.push({
        item_id: resolvedItemId, 
        item_name: displayName, // Direct name override fallback
        unit_id: resolvedUnitId,
        ledger_id: resolvedLedgerId,
        hsn_sac_code: resolvedHsn, 
        quantity: item.quantity,
        rpu: rpu,
        with_tax: 0,
        discount_type: 2,
        discount_value: 0,
        total: itemBaseTotal,
        gst_id: GST_RATE_TO_ID[item.taxRate] || 10,
        is_gst_enable: 1,
        item_code: "\u200B" // Invisible character to override the SKU display
      });
    }

    // 2. Separate Cartage and Handling Charges into dedicated `additional_charges` array 
    // This explicitly tells Hisaab Kitab to put them in the bottom-right breakdown box!
    const additional_charges = [];
    let active_ac_taxable = 0;
    let active_ac_cgst = 0;
    let active_ac_sgst = 0;

    if (order.deliveryCharge > 0) {
      const deliveryBase = Number((order.deliveryCharge / 1.18).toFixed(2));
      const lineCGST = Number((deliveryBase * 0.09).toFixed(2));
      const lineSGST = lineCGST;
      const lineTax = Number((lineCGST + lineSGST).toFixed(2));

      additional_charges.push({
        ac_ledger_id: parseInt(process.env.HISABKITAB_FREIGHT_LEDGER_ID || '1604695'),
        ac_type: 1, // 1 = Addition
        ac_value: deliveryBase,
        ac_gst_rate_id: 10, // Hisaab Kitab ID for 18%
        ac_taxable_value: deliveryBase,
        ac_total_without_tax: deliveryBase,
        ac_tax_amount: lineTax,
        ac_total: Number((deliveryBase + lineTax).toFixed(2))
      });
      active_ac_taxable += deliveryBase;
      active_ac_cgst += lineCGST;
      active_ac_sgst += lineSGST;
    }

    if (order.platformFee > 0) {
      const platformBase = Number((order.platformFee / 1.18).toFixed(2));
      const lineCGST = Number((platformBase * 0.09).toFixed(2));
      const lineSGST = lineCGST;
      const lineTax = Number((lineCGST + lineSGST).toFixed(2));

      additional_charges.push({
        ac_ledger_id: parseInt(process.env.HISABKITAB_PLATFORM_FEE_LEDGER_ID || '1604696'),
        ac_type: 1,
        ac_value: platformBase,
        ac_gst_rate_id: 10, // Hisaab Kitab ID for 18%
        ac_taxable_value: platformBase,
        ac_total_without_tax: platformBase,
        ac_tax_amount: lineTax,
        ac_total: Number((platformBase + lineTax).toFixed(2))
      });
      active_ac_taxable += platformBase;
      active_ac_cgst += lineCGST;
      active_ac_sgst += lineSGST;
    }

    // Mathematical Consistency Logic for ITEM SALE
    // We MUST perfectly sum the taxable base and tax values of BOTH items and additional_charges
    
    // 1. Sum up Items specifically splitting taxes per line for extreme accounting precision
    let items_taxable = 0;
    let items_cgst = 0;
    let items_sgst = 0;
    
    items.forEach((item, index) => {
       const taxRate = order.items[index]?.taxRate || 18;
       const lineTaxable = item.total;
       const lineCGST = Number((lineTaxable * (taxRate / 200)).toFixed(2));
       const lineSGST = lineCGST;

       items_taxable += lineTaxable;
       items_cgst += lineCGST;
       items_sgst += lineSGST;
    });

    // 2. Form Root Constraints using summed components
    const total_taxable = Number((items_taxable + active_ac_taxable).toFixed(2));
    const cgst = Number((items_cgst + active_ac_cgst).toFixed(2));
    const sgst = Number((items_sgst + active_ac_sgst).toFixed(2));
    
    // In API Sales Type 2 (Item Sale), "Gross Value" stringently means:
    // The sum of strictly physical products (excluding ANY additional charges AND tax).
    const gross_value = Number(items_taxable.toFixed(2));
    
    // Grand Total is what the customer actually paid
    const grand_total = Number(order.totalAmount.toFixed(2));
    
    // Rounding is strictly Grand Total - (Total Taxable + CGST + SGST)
    const calculation_total = Number((total_taxable + cgst + sgst).toFixed(2));
    const rounding_amount = Number((grand_total - calculation_total).toFixed(2));

    const deliveryAddressStr = order.deliveryAddress?.fullAddress || 'N/A';
    const customerName = order.deliveryAddress?.name || 'Customer';

    const payload = {
      invoice_number: finalInvoiceNumber,
      date: new Date(order.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-'), // DD-MM-YYYY
      customer_ledger_id: parseInt(process.env.HISABKITAB_CASH_LEDGER_ID || '1604700'),
      
      party_name: customerName,
      customer_name: customerName, // Root override for name
      billing_name: customerName,  // Root override for billing
      party_phone_number: order.deliveryAddress?.contactPhone || '',
      address_name: customerName, 
      shipping_name: customerName,
      is_counter_sale: 1,
      party_name_same_as_billing_name: 1, // CORRECT FLAG for display override
      party_name_same_as_billing_address_name: 1, 
      party_name_same_as_address_name: 1,
      is_party_name_same_as_address_name: 1,
      
      sales_item_type: 2, // ITEM SALE (Forces "Item Name" column header)
      items: items,       // Main main table products
      additional_charges: additional_charges, // Forces bottom-right charges layout
      
      billing_address: {
        name: customerName,
        address_1: deliveryAddressStr,
        country_id: 101, // 101 = India
        state_id: 4007,    // 4007 = Haryana
        city_id: 150110,   // 150110 = Gurugram
        pin_code: order.deliveryAddress?.pincode || '110001'
      },
      shipping_address: {
        name: customerName,
        address_1: deliveryAddressStr,
        country_id: 101, // 101 = India
        state_id: 4007,    // 4007 = Haryana
        city_id: 150110,   // 150110 = Gurugram
        pin_code: order.deliveryAddress?.pincode || '110001'
      },
      
      // Invoice overrides (Bank & Terms)
      term_and_condition: "Subject to jurisdiction in Gurugram.\nOnce delivered, the responsibility of carekeeping of materials is with the receiver.\nGoods once sold will not be taken back, unless manufacturing defect is accepted by Manufacturer.\nPayment delay attracts penalty @5% per day.",
      bank_id: process.env.HISABKITAB_BANK_LEDGER_ID ? parseInt(process.env.HISABKITAB_BANK_LEDGER_ID) : undefined,
      bank_details: "Bank: IDFC FIRST Bank | IFSC: IDFB0021015 | A/C: 59910088178 | Branch: GURGAON MANESAR BRANCH | Name: ADVENTITOUS SOLUTIONS PVT LTD | UPI: adventitoussolution@idfcbank",

      region_iso: 'in',
      region_code: 91,
      main_classification_nature_type: "Intrastate Sales Taxable",
      
      // Item Sale exact constraints
      gross_value: gross_value, 
      taxable_value: total_taxable, 
      cgst,
      sgst,
      igst: 0,
      cess: 0,
      rounding_amount,
      grand_total: grand_total,
      
      is_gst_enabled: 1,
      is_gst_na: 0,
      is_rcm_applicable: 0,
      is_round_off_not_changed: 1,
      is_cgst_sgst_igst_calculated: 1,
      
      // Configuration overrides: ONLY show Item Name
      is_enabled_item_sku: 0,
      show_item_code: 0,
      is_additional_item_description: 0,
      is_item_description_on_invoice: 0,
      
      submit_button_value: 2 // Save
    };

    console.log(`[HisabKitab] Final Payload Construction:`, JSON.stringify(payload, null, 2));

    await axios.post('https://api.hisabkitab.co/third-party/sale-transactions', payload, {
      headers: {
        'ApiKey': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log(`[HisabKitab] Invoice synced successfully for Order ${order._id} (Invoice: ${invoiceNumber})`);
  } catch (err) {
    console.error(`[HisabKitab] Sync Failed for Order ${orderId}:`, err.response?.data || err.message);
  }
};

const getOrderById = async (orderId) => {
  return await Order.findById(orderId).populate('items.productId', '-variants');
};

module.exports = {
  calculateOrderTotals,
  determineVehicleClass,
  createOrder,
  getOrderById
};
