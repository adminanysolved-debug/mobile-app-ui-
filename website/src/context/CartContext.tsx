import React, { createContext, useContext, useState } from 'react';

export interface DreamItem {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  image: string;
}

interface CartContextType {
  cart: DreamItem[];
  addToCart: (item: DreamItem) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<DreamItem[]>([]);

  const addToCart = (item: DreamItem) => {
    if (!cart.find(i => i.id === item.id)) {
      setCart([...cart, item]);
    }
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
