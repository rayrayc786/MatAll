import React, { createContext, useContext, useState, useMemo } from 'react';
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
  }[];
  bulkPricing?: { minQty: number, discount: number }[];
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
  vehicleClass: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: Product, quantity: number = 1, variantName?: string) => {
    if (quantity > 0) {
      toast.success(`${product.name} added to cart`, {
        position: 'bottom-center',
        duration: 2000
      });
    }
    setCart(prev => {
      const existing = prev.find(item => 
        item.product._id === product._id && item.selectedVariant === variantName
      );
      
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty <= 0) {
          return prev.filter(item => !(item.product._id === product._id && item.selectedVariant === variantName));
        }
        return prev.map(item => 
          (item.product._id === product._id && item.selectedVariant === variantName)
            ? { ...item, quantity: newQty } 
            : item
        );
      }
      return [...prev, { product, quantity, selectedVariant: variantName }];
    });
  };

  const removeFromCart = (productId: string, variantName?: string) => {
    setCart(prev => prev.filter(item => !(item.product._id === productId && item.selectedVariant === variantName)));
  };

  const clearCart = () => setCart([]);

  const { totalAmount, totalWeight, totalVolume, totalGst } = useMemo(() => {
    let amount = 0;
    let weight = 0;
    let volume = 0;
    let gstSum = 0;

    cart.forEach(item => {
      let itemPrice = item.product.price;
      let itemWeight = (item.product.weightPerUnit || 0);
      let itemVolume = (item.product.volumePerUnit || 0);
      let itemGstRate = (item.product as any).gst || 0;

      // Use variant values if selected
      if (item.selectedVariant && item.product.variants) {
        const variant: any = item.product.variants.find(v => v.name === item.selectedVariant);
        if (variant) {
          itemPrice = variant.pricing?.salePrice || variant.price || item.product.price;
          itemWeight = variant.inventory?.unitWeight || (variant.unitWeightGm ? variant.unitWeightGm / 1000 : 0) || (item.product.weightPerUnit || 0);
          itemGstRate = variant.pricing?.gst || (item.product as any).gst || 0;
        }
      }
      
      // Bulk Pricing Logic (applied per variant total)
      if (item.product.bulkPricing) {
        const applicableTier = [...item.product.bulkPricing]
          .sort((a, b) => b.minQty - a.minQty)
          .find(tier => item.quantity >= tier.minQty);
        
        if (applicableTier) {
          itemPrice *= (1 - applicableTier.discount / 100);
        }
      }

      // Calculate totals (itemPrice is already Inclusive of GST)
      const totalItemAmount = itemPrice * item.quantity;
      const gstAmount = totalItemAmount - (totalItemAmount / (1 + itemGstRate / 100));

      amount += totalItemAmount;
      gstSum += gstAmount;
      weight += itemWeight * item.quantity;
      volume += itemVolume * item.quantity;
    });

    return { totalAmount: amount, totalWeight: weight, totalVolume: volume, totalGst: gstSum };
  }, [cart]);

  const vehicleClass = useMemo(() => {
    if (totalWeight === 0) return 'None';
    if (totalWeight < 50) return 'Bike';
    if (totalWeight < 500) return 'Pickup Truck';
    if (totalWeight < 2000) return 'Flatbed Truck';
    return 'Heavy Trailer';
  }, [totalWeight]);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, totalAmount, totalWeight, totalVolume, totalGst, vehicleClass }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
