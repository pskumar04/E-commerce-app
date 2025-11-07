import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '4rem 2rem',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Your cart is empty</h2>
        <p style={{ marginBottom: '2rem', color: '#666' }}>
          Discover our amazing products and add them to your cart!
        </p>
        <Link to="/products">
          <button className="cta-button">Start Shopping</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h2 style={{ marginBottom: '2rem' }}>Shopping Cart</h2>
      
      {cartItems.map(item => (
        <div key={`${item.id}-${item.size}-${item.color}`} className="cart-item">
          <img 
            src={item.image} 
            alt={item.name}
            className="cart-item-image"
          />
          <div className="cart-item-details">
            <h3>{item.name}</h3>
            <p style={{ color: '#666', marginBottom: '0.5rem' }}>
              {item.size && `Size: ${item.size} | `}
              {item.color && `Color: ${item.color} | `}
              ${item.price}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1, item.size, item.color)}
                style={{
                  padding: '0.25rem 0.5rem',
                  border: '1px solid #e1e8ed',
                  background: 'white',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                -
              </button>
              <span>{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1, item.size, item.color)}
                style={{
                  padding: '0.25rem 0.5rem',
                  border: '1px solid #e1e8ed',
                  background: 'white',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                +
              </button>
              <button
                onClick={() => removeFromCart(item.id, item.size, item.color)}
                style={{
                  marginLeft: '1rem',
                  padding: '0.25rem 0.75rem',
                  border: '1px solid #ff4757',
                  background: 'white',
                  color: '#ff4757',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            </div>
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
            ${(item.price * item.quantity).toFixed(2)}
          </div>
        </div>
      ))}
      
      <div className="cart-summary">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h3>Total: ${getCartTotal().toFixed(2)}</h3>
          <button
            onClick={clearCart}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #ff4757',
              background: 'white',
              color: '#ff4757',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Clear Cart
          </button>
        </div>
        
        <button
          onClick={handleCheckout}
          className="submit-btn"
          style={{ fontSize: '1.2rem', padding: '1rem' }}
        >
          Proceed to Checkout
        </button>
        
        {!user && (
          <p style={{ 
            textAlign: 'center', 
            marginTop: '1rem', 
            color: '#666' 
          }}>
            Please <Link to="/login">login</Link> to complete your purchase
          </p>
        )}
      </div>
    </div>
  );
};

export default Cart;