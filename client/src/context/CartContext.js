import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);

  // Load cart from backend on app start
  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, setting empty cart');
        setCart([]);
        setCartLoading(false);
        return;
      }

      console.log('Fetching cart with token...');
      const response = await axios.get('${config.apiUrl}/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Cart API response:', response.data);
      
      // Handle different response formats
      let cartItems = [];
      
      if (response.data && response.data.items) {
        // Standard format: { items: [...] }
        cartItems = response.data.items;
      } else if (Array.isArray(response.data)) {
        // Alternative format: direct array
        cartItems = response.data;
      } else {
        console.warn('Unexpected cart response format:', response.data);
      }
      
      console.log('Setting cart items:', cartItems);
      setCart(cartItems);
    } catch (error) {
      console.error('Error fetching cart:', error);
      
      if (error.response?.status === 401) {
        console.log('Unauthorized - user not logged in');
      } else if (error.response?.status === 404) {
        console.log('Cart not found - creating new cart');
      }
      
      setCart([]);
    } finally {
      setCartLoading(false);
    }
  };

  const addToCart = async (product, quantity = 1, size = null, color = null) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to add items to cart');
        return false;
      }

      const response = await axios.post('${config.apiUrl}/api/cart/add', {
        productId: product._id,
        quantity,
        size,
        color
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Handle different response formats
      let updatedCart = [];
      if (response.data && response.data.items) {
        updatedCart = response.data.items;
      } else if (Array.isArray(response.data)) {
        updatedCart = response.data;
      }

      setCart(updatedCart);
      toast.success('Product added to cart!');
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add product to cart');
      return false;
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${config.apiUrl}/api/cart/remove/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let updatedCart = [];
      if (response.data && response.data.items) {
        updatedCart = response.data.items;
      } else if (Array.isArray(response.data)) {
        updatedCart = response.data;
      }

      setCart(updatedCart);
      toast.success('Product removed from cart');
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove product from cart');
    }
  };

  const updateCartQuantity = async (productId, quantity) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${config.apiUrl}/api/cart/update/${productId}`, {
        quantity
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let updatedCart = [];
      if (response.data && response.data.items) {
        updatedCart = response.data.items;
      } else if (Array.isArray(response.data)) {
        updatedCart = response.data;
      }

      setCart(updatedCart);
    } catch (error) {
      console.error('Error updating cart:', error);
      toast.error('Failed to update cart');
    }
  };

  const clearCart = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete('${config.apiUrl}/api/cart/clear', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const getCartTotal = () => {
    return Array.isArray(cart) ? cart.reduce((total, item) => total + (item.product?.price || 0) * item.quantity, 0) : 0;
  };

  const getCartItemsCount = () => {
    return Array.isArray(cart) ? cart.reduce((total, item) => total + item.quantity, 0) : 0;
  };

  const value = {
    cart: Array.isArray(cart) ? cart : [],
    cartLoading,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    refreshCart: fetchCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;