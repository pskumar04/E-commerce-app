import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext'; // Import useCart
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import { toast } from 'react-toastify';

const Checkout = () => {
  const { user } = useAuth();
  const { cart, clearCart, refreshCart } = useCart(); // Use cart from context
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '4242 4242 4242 4242',
    expiryDate: '12/25',
    cvv: '123',
    cardholderName: user?.name || ''
  });
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India'
  });

  useEffect(() => {
    // Refresh cart to ensure we have latest data
    refreshCart();
    
    if (user?.address) {
      setShippingAddress(user.address);
    }
  }, [user, refreshCart]);

  // Remove the fetchCart function since we're using context

  const calculateTotals = () => {
    const subtotal = cart.reduce((total, item) => total + (item.product?.price || 0) * item.quantity, 0);
    const shipping = 0; // Free shipping
    const tax = subtotal * 0.18; // 18% tax
    const total = subtotal + shipping + tax;

    return { subtotal, shipping, tax, total };
  };

  const handleInputChange = (e, section) => {
    const { name, value } = e.target;
    if (section === 'payment') {
      setPaymentInfo(prev => ({ ...prev, [name]: value }));
    } else {
      setShippingAddress(prev => ({ ...prev, [name]: value }));
    }
  };

// In Checkout.js, update the handlePayment function:
// In your Checkout.js, update the handlePayment function:
const handlePayment = async () => {
  if (!paymentInfo.cardholderName.trim()) {
    toast.error('Please enter cardholder name');
    return;
  }

  if (cart.length === 0) {
    toast.error('Your cart is empty');
    return;
  }

  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    const { total } = calculateTotals();

    // Prepare order data
    const orderData = {
      items: cart.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        size: item.size || null,
        color: item.color || null
      })),
      shippingAddress,
      paymentMethod: 'card'
    };

    console.log('Sending order data:', orderData);

    const response = await axios.post('${config.apiUrl}/api/orders', orderData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Order created successfully:', response.data);

    // Clear cart after successful order
    await clearCart();
    
    toast.success('Order placed successfully!');
    
    // Navigate to orders page with success parameter
    navigate('/customer-orders', { 
      state: { 
        orderSuccess: true,
        orderNumber: response.data.orderNumber 
      } 
    });
    
  } catch (error) {
    console.error('Payment error:', error);
    console.error('Error response:', error.response?.data);
    
    if (error.response?.status === 401) {
      toast.error('Please login to complete payment');
      navigate('/login');
    } else if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error('Payment failed. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};

  const { subtotal, shipping, tax, total } = calculateTotals();

  if (cart.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Your cart is empty</h2>
        <p>Add some products to checkout</p>
        <button 
          onClick={() => navigate('/')}
          style={{
            padding: '1rem 2rem',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '1200px', 
      margin: '0 auto',
      minHeight: '80vh'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#333' }}>
        Happy Cart
      </h1>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '2rem',
        alignItems: 'start'
      }}>
        {/* Left Column - Payment & Shipping */}
        <div>
          {/* Payment Information */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>Payment Information</h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#555'
              }}>
                Card Number
              </label>
              <input
                type="text"
                name="cardNumber"
                value={paymentInfo.cardNumber}
                onChange={(e) => handleInputChange(e, 'payment')}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e1e8ed',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
                disabled
              />
              <small style={{ color: '#666', fontSize: '0.8rem' }}>
                Demo card: 4242 4242 4242 4242
              </small>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '600',
                  color: '#555'
                }}>
                  Expiry Date
                </label>
                <input
                  type="text"
                  name="expiryDate"
                  value={paymentInfo.expiryDate}
                  onChange={(e) => handleInputChange(e, 'payment')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                  disabled
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '600',
                  color: '#555'
                }}>
                  CVV
                </label>
                <input
                  type="text"
                  name="cvv"
                  value={paymentInfo.cvv}
                  onChange={(e) => handleInputChange(e, 'payment')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                  disabled
                />
              </div>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#555'
              }}>
                Cardholder Name
              </label>
              <input
                type="text"
                name="cardholderName"
                value={paymentInfo.cardholderName}
                onChange={(e) => handleInputChange(e, 'payment')}
                placeholder="Enter cardholder name"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e1e8ed',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ 
              marginTop: '2rem', 
              padding: '1.5rem',
              background: '#f8f9fa',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <button
                onClick={handlePayment}
                disabled={loading}
                style={{
                  padding: '1rem 3rem',
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1.1rem',
                  transition: 'all 0.3s ease',
                  width: '100%'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                {loading ? 'Processing...' : `Pay $${total.toFixed(2)}`}
              </button>
              
              <p style={{ 
                margin: '1rem 0 0 0', 
                color: '#666', 
                fontSize: '0.9rem',
                fontStyle: 'italic'
              }}>
                This is a demo payment. No real payment will be processed.
              </p>
            </div>
          </div>

          {/* Shipping Address */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>Shipping Address</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#555'
              }}>
                Street Address
              </label>
              <input
                type="text"
                name="street"
                value={shippingAddress.street}
                onChange={(e) => handleInputChange(e, 'shipping')}
                placeholder="House no., Street, Area"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e1e8ed',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '600',
                  color: '#555'
                }}>
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={shippingAddress.city}
                  onChange={(e) => handleInputChange(e, 'shipping')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '600',
                  color: '#555'
                }}>
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={shippingAddress.state}
                  onChange={(e) => handleInputChange(e, 'shipping')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '600',
                  color: '#555'
                }}>
                  ZIP Code
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={shippingAddress.zipCode}
                  onChange={(e) => handleInputChange(e, 'shipping')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '600',
                  color: '#555'
                }}>
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={shippingAddress.country}
                  onChange={(e) => handleInputChange(e, 'shipping')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: '2rem'
          }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>Order Summary</h2>
            
            {/* Order Items */}
            <div style={{ marginBottom: '1.5rem' }}>
              {cart.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 0',
                  borderBottom: '1px solid #e1e8ed'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#333' }}>
                      {item.product?.name}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>
                      Qty: {item.quantity} × ${item.product?.price}
                    </div>
                    {item.size && (
                      <div style={{ color: '#666', fontSize: '0.8rem' }}>
                        Size: {item.size}
                      </div>
                    )}
                    {item.color && (
                      <div style={{ color: '#666', fontSize: '0.8rem' }}>
                        Color: {item.color}
                      </div>
                    )}
                  </div>
                  <div style={{ fontWeight: '600' }}>
                    ${(item.quantity * item.product?.price).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div style={{ borderTop: '2px solid #e1e8ed', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Shipping:</span>
                <span>${shipping.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Tax:</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '2px solid #333',
                fontWeight: 'bold',
                fontSize: '1.1rem'
              }}>
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Shipping Address Preview */}
            <div style={{ 
              marginTop: '2rem', 
              padding: '1.5rem',
              background: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <h4 style={{ marginBottom: '1rem', color: '#333' }}>Shipping To:</h4>
              <div style={{ color: '#666' }}>
                <div><strong>{user?.name}</strong></div>
                {shippingAddress.street && <div>{shippingAddress.street}</div>}
                {(shippingAddress.city || shippingAddress.state) && (
                  <div>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}</div>
                )}
                {shippingAddress.country && <div>{shippingAddress.country}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;