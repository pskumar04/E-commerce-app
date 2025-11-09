import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext'; // Add this import

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
  const { user } = useAuth(); // Get user from AuthContext

  // Load cart from backend when user changes
  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      // Clear cart when user logs out
      setCart([]);
      setCartLoading(false);
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !user) {
        console.log('No token or user found, setting empty cart');
        setCart([]);
        setCartLoading(false);
        return;
      }

      console.log('Fetching cart for user:', user._id);
      const response = await axios.get(`${config.apiUrl}/api/cart`, {
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
      } else if (response.data.cart && response.data.cart.items) {
        // Another format: { cart: { items: [...] } }
        cartItems = response.data.cart.items;
      } else {
        console.warn('Unexpected cart response format:', response.data);
      }
      
      console.log('Setting cart items:', cartItems);
      setCart(cartItems);
    } catch (error) {
      console.error('Error fetching cart:', error);
      
      if (error.response?.status === 401) {
        console.log('Unauthorized - clearing user data');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else if (error.response?.status === 404) {
        console.log('Cart not found - this is normal for new users');
        setCart([]);
      } else {
        console.log('Other cart error, setting empty cart');
        setCart([]);
      }
    } finally {
      setCartLoading(false);
    }
  };

  const addToCart = async (product, quantity = 1, size = null, color = null) => {
    try {
      const token = localStorage.getItem('token');
      
      // Check both token and user from AuthContext
      if (!token || !user) {
        toast.error('Please login to add items to cart');
        return { success: false, message: 'Please login to add items to cart' };
      }

      console.log('Adding to cart for user:', user._id, { productId: product._id, quantity, size, color });

      const response = await axios.post(`${config.apiUrl}/api/cart/add`, {
        productId: product._id,
        quantity,
        size,
        color
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Cart response:', response.data);

      // Check if the request was successful
      if (response.status >= 200 && response.status < 300) {
        // Handle different response formats
        let updatedCart = [];
        if (response.data && response.data.items) {
          updatedCart = response.data.items;
        } else if (Array.isArray(response.data)) {
          updatedCart = response.data;
        } else if (response.data.cart) {
          updatedCart = response.data.cart.items || [];
        } else if (response.data.success) {
          // If backend returns success but no cart data, fetch fresh cart
          await fetchCart();
          toast.success('Product added to cart!');
          return { 
            success: true, 
            message: 'Product added to cart!'
          };
        }

        setCart(updatedCart);
        
        // Show success message only once
        toast.success('Product added to cart!');
        
        return { 
          success: true, 
          message: 'Product added to cart!',
          cart: updatedCart 
        };
      } else {
        // Handle non-2xx responses
        const errorMessage = response.data?.message || 'Failed to add product to cart';
        toast.error(errorMessage);
        return { 
          success: false, 
          message: errorMessage 
        };
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      
      // Improved error handling
      let errorMessage = 'Failed to add product to cart';
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Error: ${error.response.status}`;
        
        // Handle specific error cases
        if (error.response.status === 401) {
          errorMessage = 'Please login again to add items to cart';
          // Clear invalid token and user data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.reload(); // Refresh to update auth state
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Invalid request';
        } else if (error.response.status === 404) {
          errorMessage = 'Product not found';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Something else happened
        errorMessage = error.message;
      }

      // Show error message only once
      toast.error(errorMessage);
      
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !user) {
        toast.error('Please login to modify cart');
        return;
      }

      const response = await axios.delete(`${config.apiUrl}/api/cart/remove/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let updatedCart = [];
      if (response.data && response.data.items) {
        updatedCart = response.data.items;
      } else if (Array.isArray(response.data)) {
        updatedCart = response.data;
      } else if (response.data.success) {
        // If success but no cart data, fetch fresh cart
        await fetchCart();
        toast.success('Product removed from cart');
        return;
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
      if (!token || !user) {
        toast.error('Please login to update cart');
        return;
      }

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
      } else if (response.data.success) {
        // If success but no cart data, fetch fresh cart
        await fetchCart();
        return;
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
      if (!token || !user) {
        toast.error('Please login to clear cart');
        return;
      }

      await axios.delete(`${config.apiUrl}/api/cart/clear`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart([]);
      toast.success('Cart cleared successfully');
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
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