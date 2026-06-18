import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { userInfo }              = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading]     = useState(false);

  const normalize = (items) =>
    items.map(i => ({
      _id:      i.product._id   ?? i.product,
      name:     i.product.name  ?? i.name,
      price:    i.product.price ?? i.price,
      image:    i.product.image ?? i.image,
      images:   i.product.images ?? i.images ?? [],
      brand:    i.product.brand  ?? i.brand,
      category: i.product.category ?? i.category,
      stock:    i.product.stock  ?? i.stock,
      quantity: i.quantity,
    }));

  const fetchCart = useCallback(async () => {
    if (!userInfo) { setCartItems([]); return; }
    try {
      setLoading(true);
      const { data } = await api.get('/cart');
      setCartItems(normalize(data));
    } catch {
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (product, quantity = 1) => {
    if (!userInfo) {
      toast.info('Please login to add items to cart');
      return;
    }
    try {
      const { data } = await api.post('/cart/add', { productId: product._id, quantity });
      setCartItems(normalize(data));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add to cart');
    }
  };

  const updateQuantity = async (id, qty) => {
    if (!userInfo) return;
    if (qty <= 0) { removeFromCart(id); return; }
    try {
      const { data } = await api.put('/cart/update', { productId: id, quantity: qty });
      setCartItems(normalize(data));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update quantity');
    }
  };

  const removeFromCart = async (id) => {
    if (!userInfo) return;
    try {
      const { data } = await api.delete(`/cart/remove/${id}`);
      setCartItems(normalize(data));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove item');
    }
  };

  const clearCart  = () => setCartItems([]);
  const totalItems = cartItems.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems, loading,
      addToCart, removeFromCart, updateQuantity,
      clearCart, totalItems, totalPrice, fetchCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);