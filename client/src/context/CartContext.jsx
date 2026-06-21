import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { resolveComboPrice } from '../services/deliveryService';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(
    JSON.parse(localStorage.getItem('cart')) || []
  );

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  /* Recompute effective price for an item based on its comboPrices and quantity */
  const withComboPrice = (item, quantity) => ({
    ...item,
    quantity,
    effectivePrice: resolveComboPrice(item.price, item.comboPrices, quantity),
  });

  const addToCart = async (product, quantity = 1) => {
    try {
      const { data } = await api.get(`/products/${product._id}`);
      const stock = data.stock;

      setCartItems(prev => {
        const existing  = prev.find(i => i._id === product._id);
        const currentQty = existing ? existing.quantity : 0;
        const newQty     = currentQty + quantity;

        if (newQty > stock) {
          toast.error(
            stock === 0
              ? 'This product is out of stock.'
              : currentQty >= stock
              ? `Only ${stock} in stock — you already have the max in your cart.`
              : `Only ${stock} in stock. You can add ${stock - currentQty} more.`
          );
          if (currentQty >= stock) return prev;
          const allowed = stock - currentQty;
          if (existing)
            return prev.map(i => i._id === product._id
              ? withComboPrice({ ...i, comboPrices: data.comboPrices }, stock)
              : i);
          return [...prev, withComboPrice({ ...data }, allowed)];
        }

        if (existing)
          return prev.map(i => i._id === product._id
            ? withComboPrice({ ...i, comboPrices: data.comboPrices }, newQty)
            : i);
        return [...prev, withComboPrice({ ...data }, quantity)];
      });
    } catch {
      setCartItems(prev => {
        const existing = prev.find(i => i._id === product._id);
        if (existing)
          return prev.map(i => i._id === product._id
            ? withComboPrice(i, i.quantity + quantity)
            : i);
        return [...prev, withComboPrice({ ...product }, quantity)];
      });
    }
  };

  const updateQuantity = async (id, qty) => {
    if (qty <= 0) { removeFromCart(id); return; }

    try {
      const { data } = await api.get(`/products/${id}`);
      const stock = data.stock;

      if (qty > stock) {
        toast.error(`Only ${stock} in stock.`);
        setCartItems(prev => prev.map(i => i._id === id
          ? withComboPrice({ ...i, comboPrices: data.comboPrices }, stock)
          : i));
        return;
      }

      setCartItems(prev => prev.map(i => i._id === id
        ? withComboPrice({ ...i, comboPrices: data.comboPrices }, qty)
        : i));
    } catch {
      setCartItems(prev => prev.map(i => i._id === id ? withComboPrice(i, qty) : i));
    }
  };

  const removeFromCart = (id) => setCartItems(prev => prev.filter(i => i._id !== id));
  const clearCart      = ()   => setCartItems([]);

  const totalItems = cartItems.reduce((s, i) => s + i.quantity, 0);

  /* totalPrice uses effectivePrice (combo price if applicable, else base price) */
  const totalPrice = cartItems.reduce(
    (s, i) => s + (i.effectivePrice ?? i.price) * i.quantity,
    0
  );

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart,
      updateQuantity, clearCart, totalItems, totalPrice,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);