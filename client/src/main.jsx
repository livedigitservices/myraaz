import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider }     from './context/AuthContext';
import { CartProvider }     from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastContainer }   from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <CartProvider>
      <WishlistProvider>
        <App />
        <ToastContainer
          position="top-right"
          autoClose={2500}
          toastClassName="!rounded-xl !font-sans !text-sm"
        />
      </WishlistProvider>
    </CartProvider>
  </AuthProvider>
);