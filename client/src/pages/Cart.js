import React from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Cart = () => {
  const { cart, removeFromCart, updateCartQuantity, getCartTotal, cartLoading, clearCart } = useCart();
  const navigate = useNavigate();

  // Safe cart access
  const safeCart = Array.isArray(cart) ? cart : [];
  
  // Function to get product image URL
  const getProductImage = (product) => {
    if (!product) return 'https://via.placeholder.com/100x100?text=No+Image';
    if (product.images && product.images[0]) {
      // Handle both full URLs and relative paths
      if (product.images[0].startsWith('http')) {
        return product.images[0];
      } else {
        return `http://localhost:5000${product.images[0]}`;
      }
    }
    return 'https://via.placeholder.com/100x100?text=No+Image';
  };

  // Safe product access function
  const getSafeProduct = (item) => {
    return item?.product || {};
  };

  const handleProceedToCheckout = () => {
    if (safeCart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    navigate('/checkout');
  };

  const handleContinueShopping = () => {
    navigate('/products');
  };

  const handleRemoveItem = async (item) => {
    const safeProduct = getSafeProduct(item);
    if (safeProduct._id) {
      await removeFromCart(safeProduct._id);
    } else {
      toast.error('Cannot remove item - product information missing');
    }
  };

  const handleUpdateQuantity = async (item, newQuantity) => {
    const safeProduct = getSafeProduct(item);
    if (safeProduct._id) {
      if (newQuantity < 1) {
        await removeFromCart(safeProduct._id);
      } else {
        await updateCartQuantity(safeProduct._id, newQuantity);
      }
    }
  };

  if (cartLoading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '4rem 2rem',
        color: '#666',
        fontSize: '1.1rem'
      }}>
        Loading cart...
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '1000px', 
      margin: '0 auto',
      minHeight: '80vh'
    }}>
      <h1 style={{ 
        marginBottom: '2rem', 
        color: '#333',
        textAlign: 'center'
      }}>
        Shopping Cart
      </h1>
      
      {safeCart.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '4rem 2rem',
          background: 'white',
          borderRadius: '15px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#666', marginBottom: '1rem' }}>Your cart is empty</h3>
          <p style={{ color: '#999', marginBottom: '2rem' }}>Add some products to your cart</p>
          <button 
            onClick={handleContinueShopping}
            style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div>
          {/* Cart Items */}
          <div style={{ 
            background: 'white',
            borderRadius: '15px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            marginBottom: '2rem'
          }}>
            {safeCart.map((item, index) => {
              const safeProduct = getSafeProduct(item);
              const itemTotal = (safeProduct.price || 0) * item.quantity;
              
              return (
                <div 
                  key={item._id || index} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1.5rem',
                    borderBottom: index < safeCart.length - 1 ? '1px solid #e1e8ed' : 'none',
                    transition: 'background 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#f8f9fa';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  {/* Product Image */}
                  <img 
                    src={getProductImage(safeProduct)}
                    alt={safeProduct.name || 'Product'}
                    style={{
                      width: '100px',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: '10px',
                      marginRight: '1.5rem',
                      flexShrink: 0
                    }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/100x100?text=No+Image';
                    }}
                  />
                  
                  {/* Product Details */}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ 
                      margin: '0 0 0.5rem 0', 
                      color: '#333',
                      fontSize: '1.1rem'
                    }}>
                      {safeProduct.name || 'Product'}
                    </h4>
                    
                    <p style={{ 
                      margin: '0.25rem 0', 
                      color: '#666',
                      fontSize: '0.9rem'
                    }}>
                      ${safeProduct.price || '0.00'} × {item.quantity}
                    </p>
                    
                    {item.size && (
                      <p style={{ 
                        margin: '0.25rem 0', 
                        color: '#666', 
                        fontSize: '0.9rem' 
                      }}>
                        Size: {item.size}
                      </p>
                    )}
                    
                    {item.color && (
                      <p style={{ 
                        margin: '0.25rem 0', 
                        color: '#666', 
                        fontSize: '0.9rem' 
                      }}>
                        Color: {item.color}
                      </p>
                    )}
                    
                    <p style={{ 
                      margin: '0.5rem 0 0 0', 
                      fontWeight: 'bold', 
                      color: '#333',
                      fontSize: '1.1rem'
                    }}>
                      Total: ${itemTotal.toFixed(2)}
                    </p>
                  </div>
                  
                  {/* Quantity Controls and Remove Button */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.75rem',
                    alignItems: 'center'
                  }}>
                    {/* Quantity Controls */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem',
                      background: '#f8f9fa',
                      padding: '0.5rem',
                      borderRadius: '8px'
                    }}>
                      <button 
                        onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                        style={{
                          padding: '0.5rem',
                          background: '#667eea',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          minWidth: '35px'
                        }}
                      >
                        -
                      </button>
                      
                      <span style={{ 
                        fontSize: '1rem', 
                        fontWeight: 'bold',
                        minWidth: '30px',
                        textAlign: 'center'
                      }}>
                        {item.quantity}
                      </span>
                      
                      <button 
                        onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                        style={{
                          padding: '0.5rem',
                          background: '#667eea',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          minWidth: '35px'
                        }}
                      >
                        +
                      </button>
                    </div>
                    
                    {/* Remove Button */}
                    <button 
                      onClick={() => handleRemoveItem(item)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#c0392b'}
                      onMouseOut={(e) => e.target.style.background = '#e74c3c'}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Cart Summary */}
          <div style={{ 
            background: 'white',
            padding: '2rem',
            borderRadius: '15px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #e1e8ed'
            }}>
              <h3 style={{ margin: 0, color: '#333' }}>Total:</h3>
              <h3 style={{ margin: 0, color: '#333' }}>
                ${getCartTotal().toFixed(2)}
              </h3>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '1rem',
              justifyContent: 'space-between',
              flexWrap: 'wrap'
            }}>
              <button 
                onClick={handleContinueShopping}
                style={{
                  padding: '1rem 2rem',
                  background: 'transparent',
                  color: '#667eea',
                  border: '2px solid #667eea',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  flex: 1
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#667eea';
                  e.target.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#667eea';
                }}
              >
                Continue Shopping
              </button>
              
              <button 
                onClick={handleProceedToCheckout}
                style={{
                  padding: '1rem 2rem',
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  flex: 1
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                Proceed to Checkout
              </button>
            </div>
            
            {/* Clear Cart Button */}
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button 
                onClick={clearCart}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  color: '#e74c3c',
                  border: '1px solid #e74c3c',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#e74c3c';
                  e.target.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#e74c3c';
                }}
              >
                Clear Entire Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;