import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '4242 4242 4242 4242',
    expiryDate: '12/25',
    cvv: '123',
    name: user?.name || ''
  });

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to proceed with checkout');
      navigate('/login');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);

    try {
      // Prepare order data
      const orderData = {
        items: cartItems.map(item => ({
          product: item.id,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          price: item.price
        })),
        shippingAddress: user.address || {
          street: '123 Shipping Address',
          city: 'City',
          state: 'State',
          zipCode: '12345',
          country: 'Country'
        },
        totalAmount: getCartTotal()
      };

      console.log('Placing order:', orderData);

      // Create order in backend
      const response = await axios.post('http://localhost:5000/api/orders', orderData);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Payment successful! Your order has been placed.');
      clearCart();
      navigate('/order-success', { state: { order: response.data } });
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2>Your cart is empty</h2>
        <p>Add some products to your cart before checking out.</p>
        <button 
          onClick={() => navigate('/products')}
          className="cta-button"
          style={{ marginTop: '1rem' }}
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>Checkout</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
        {/* Payment Form */}
        <div>
          <div style={{ 
            background: 'white', 
            padding: '2rem', 
            borderRadius: '15px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>Payment Information</h2>
            
            {/* Mock Stripe-like Payment Form */}
            <form onSubmit={handlePayment}>
              <div className="form-group">
                <label>Card Number</label>
                <input
                  type="text"
                  value={paymentInfo.cardNumber}
                  onChange={(e) => setPaymentInfo({...paymentInfo, cardNumber: e.target.value})}
                  placeholder="4242 4242 4242 4242"
                  style={{
                    background: '#f8f9fa',
                    border: '1px solid #e1e8ed',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                  disabled
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="text"
                    value={paymentInfo.expiryDate}
                    onChange={(e) => setPaymentInfo({...paymentInfo, expiryDate: e.target.value})}
                    placeholder="MM/YY"
                    style={{
                      background: '#f8f9fa',
                      border: '1px solid #e1e8ed',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                    disabled
                  />
                </div>
                
                <div className="form-group">
                  <label>CVV</label>
                  <input
                    type="text"
                    value={paymentInfo.cvv}
                    onChange={(e) => setPaymentInfo({...paymentInfo, cvv: e.target.value})}
                    placeholder="123"
                    style={{
                      background: '#f8f9fa',
                      border: '1px solid #e1e8ed',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                    disabled
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Cardholder Name</label>
                <input
                  type="text"
                  value={paymentInfo.name}
                  onChange={(e) => setPaymentInfo({...paymentInfo, name: e.target.value})}
                  placeholder="Enter cardholder name"
                  style={{
                    background: '#f8f9fa',
                    border: '1px solid #e1e8ed',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                  disabled
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: loading ? '#ccc' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '1rem'
                }}
              >
                {loading ? 'Processing Payment...' : `Pay $${getCartTotal().toFixed(2)}`}
              </button>
              
              <p style={{ 
                textAlign: 'center', 
                marginTop: '1rem', 
                color: '#666',
                fontSize: '0.9rem'
              }}>
                💳 This is a demo payment. No real payment will be processed.
              </p>
            </form>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div style={{ 
            background: 'white', 
            padding: '2rem', 
            borderRadius: '15px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>Order Summary</h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              {cartItems.map(item => (
                <div key={`${item.id}-${item.size}-${item.color}`} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1rem 0',
                  borderBottom: '1px solid #e1e8ed'
                }}>
                  <img 
                    src={item.image} 
                    alt={item.name}
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      marginRight: '1rem'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>{item.name}</h4>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                      Qty: {item.quantity} × ${item.price}
                      {item.size && ` | Size: ${item.size}`}
                      {item.color && ` | Color: ${item.color}`}
                    </p>
                  </div>
                  <div style={{ fontWeight: 'bold' }}>
                    ${(item.quantity * item.price).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ 
              borderTop: '2px solid #667eea',
              paddingTop: '1rem'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span>Subtotal:</span>
                <span>${getCartTotal().toFixed(2)}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span>Shipping:</span>
                <span>$0.00</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span>Tax:</span>
                <span>$0.00</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                borderTop: '1px solid #e1e8ed',
                paddingTop: '0.5rem'
              }}>
                <span>Total:</span>
                <span>${getCartTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div style={{ 
            background: 'white', 
            padding: '1.5rem', 
            borderRadius: '15px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
            marginTop: '1.5rem'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#333' }}>Shipping Address</h3>
            {user?.address ? (
              <div>
                <p><strong>{user.name}</strong></p>
                <p>{user.address.street}</p>
                <p>{user.address.city}, {user.address.state} {user.address.zipCode}</p>
                <p>{user.address.country}</p>
              </div>
            ) : (
              <p style={{ color: '#666' }}>
                No shipping address saved. Using default address.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;