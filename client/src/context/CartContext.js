import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('happyCart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('happyCart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1, size = '', color = '') => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(
        item => item.id === product._id && item.size === size && item.color === color
      );

      if (existingItem) {
        return prevItems.map(item =>
          item.id === product._id && item.size === size && item.color === color
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [
          ...prevItems,
          {
            id: product._id,
            name: product.name,
            price: product.price,
            image: product.images && product.images[0] ? `http://localhost:5000${product.images[0]}` : 'https://via.placeholder.com/300x300?text=Product+Image',
            quantity,
            size,
            color,
            stock: product.stock
          }
        ];
      }
    });
  };

  const removeFromCart = (itemId, size = '', color = '') => {
    setCartItems(prevItems =>
      prevItems.filter(item => 
        !(item.id === itemId && item.size === size && item.color === color)
      )
    );
  };

  const updateQuantity = (itemId, quantity, size = '', color = '') => {
    if (quantity <= 0) {
      removeFromCart(itemId, size, color);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId && item.size === size && item.color === color
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};