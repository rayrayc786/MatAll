import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  sku: string;
  images?: string[];
  category?: string;
  subCategory?: string;
  brand?: string;
  size?: string;
  productCode?: string;
  mrp: number;
  salePrice?: number;
  deliveryTime?: string;
  unitType: 'individual' | 'weight-based' | 'pack' | 'bundle';
  unitLabel: string;
  csiMasterFormat: string;
  weightPerUnit: number;
  volumePerUnit: number;
  imageUrl?: string;
  price: number;
  subVariants?: {
    title: string;
    value: string;
  }[];
  variants?: {
    name: string;
    price: number;
    weight: number;
    volume: number;
    sku?: string;
    pricing?: {
      salePrice?: number;
      gst?: number;
      mrp?: number;
    };
    inventory?: {
      unitWeight?: number;
      stock?: number;
    };
    unitWeightGm?: number;
    logisticsCategory?: string;
  }[];
  bulkPricing?: { minQty: number, discount: number }[];
  logisticsCategory?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: string; // Name of the variant
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, variantName?: string) => void;
  removeFromCart: (productId: string, variantName?: string) => void;
  clearCart: () => void;
  totalAmount: number;
  totalWeight: number;
  totalVolume: number;
  totalGst: number;
  maxLogisticsCategory: 'light' | 'medium' | 'heavy';
  vehicleClass: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [cart]);

  const addToCart = (product: Product, quantity: number = 1, variantName?: string) => {
    if (product.deliveryTime === 'On Demand' && quantity > 0) {
      toast.error('This product is only available on demand. Please use Request on Demand.', {
        id: 'on-demand-error',
        duration: 3000
      });
      return;
    }

    if (quantity > 0) {
      toast.success(`${product.name} added to cart`, {
        id: 'cart-toast',
        position: 'bottom-center',
        duration: 2000
      });
    }
    setCart(prev => {
      const existing = prev.find(item => 
        String(item.product._id) === String(product._id) && item.selectedVariant === variantName
      );
      
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty <= 0) {
          return prev.filter(item => !(String(item.product._id) === String(product._id) && item.selectedVariant === variantName));
        }
        return prev.map(item => 
          (String(item.product._id) === String(product._id) && item.selectedVariant === variantName)
            ? { ...item, quantity: newQty } 
            : item
        );
      }
      return [...prev, { product, quantity, selectedVariant: variantName }];
    });
  };

  const removeFromCart = (productId: string, variantName?: string) => {
    setCart(prev => prev.filter(item => !(String(item.product._id) === String(productId) && item.selectedVariant === variantName)));
  };

  const clearCart = () => setCart([]);

  const { totalAmount, totalWeight, totalVolume, totalGst, maxLogisticsCategory } = useMemo(() => {
    let amount = 0;
    let weight = 0;
    let volume = 0;
    let gstSum = 0;
    let maxCat: 'light' | 'medium' | 'heavy' = 'light';

    cart.forEach(item => {
      let itemPrice = item.product.price; // We treat this as BASE price
      let itemWeight = (item.product.weightPerUnit || 0);
      let itemVolume = (item.product.volumePerUnit || 0);
      let itemGstRate = (item.product as any).gst || 18; // Default to 18% GST

      // Use variant values if selected
      if (item.selectedVariant && item.product.variants) {
        const variant: any = item.product.variants.find(v => v.name === item.selectedVariant);
        if (variant) {
          // pricing.salePrice is also treated as BASE price
          itemPrice = variant.pricing?.salePrice || variant.price || item.product.price;
          itemWeight = variant.inventory?.unitWeight || (variant.unitWeightGm ? variant.unitWeightGm / 1000 : 0) || (item.product.weightPerUnit || 0);
          itemGstRate = variant.pricing?.gst || (item.product as any).gst || 18;
        }
      }
      
      // Bulk Pricing Logic (applied on base price)
      if (item.product.bulkPricing) {
        const applicableTier = [...item.product.bulkPricing]
          .sort((a, b) => b.minQty - a.minQty)
          .find(tier => item.quantity >= tier.minQty);
        
        if (applicableTier) {
          itemPrice *= (1 - applicableTier.discount / 100);
        }
      }

      // Calculate totals
      const variant: any = item.product.variants?.find(v => v.name === item.selectedVariant);
      const logisticsCat = String(variant?.logisticsCategory || item.product.logisticsCategory || 'Light').toLowerCase();
      
      if (logisticsCat === 'heavy') maxCat = 'heavy';
      else if (logisticsCat === 'medium' && maxCat !== 'heavy') maxCat = 'medium';

      amount += itemPrice * item.quantity;
      weight += itemWeight * item.quantity;
      volume += itemVolume * item.quantity;
      gstSum += (itemPrice * item.quantity) * (itemGstRate / 100);
    });

    return { 
      totalAmount: (Math.round(amount * 100) / 100) + (Math.round(gstSum * 100) / 100), 
      totalWeight: weight, 
      totalVolume: volume, 
      totalGst: (Math.round(gstSum * 100) / 100), 
      maxLogisticsCategory: maxCat 
    };
  }, [cart]);

  const vehicleClass = useMemo(() => {
    if (totalWeight === 0) return 'None';
    if (totalWeight < 50) return 'Bike';
    if (totalWeight < 500) return 'Pickup Truck';
    if (totalWeight < 2000) return 'Flatbed Truck';
    return 'Heavy Trailer';
  }, [totalWeight]);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, totalAmount, totalWeight, totalVolume, totalGst, vehicleClass, maxLogisticsCategory }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
