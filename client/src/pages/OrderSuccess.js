import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OrderSuccess = () => {
  const location = useLocation();
  const { user } = useAuth();
  const order = location.state?.order;

  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '4rem 2rem',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <div style={{
        background: 'white',
        padding: '3rem 2rem',
        borderRadius: '15px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: '#27ae60',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 2rem',
          fontSize: '2rem',
          color: 'white'
        }}>
          ✓
        </div>
        
        <h1 style={{ marginBottom: '1rem', color: '#27ae60' }}>
          Payment Successful!
        </h1>
        
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#666' }}>
          Thank you for your order. Your payment has been processed successfully.
        </p>

        {order && (
          <div style={{
            background: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '10px',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Order Details</h3>
            <p><strong>Order Number:</strong> {order.orderNumber}</p>
            <p><strong>Total Amount:</strong> ${order.totalAmount}</p>
            <p><strong>Expected Delivery:</strong> {order.expectedDelivery ? 
              new Date(order.expectedDelivery).toLocaleDateString() : '7-10 business days'}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/my-orders">
            <button className="cta-button">
              View My Orders
            </button>
          </Link>
          
          <Link to="/products">
            <button style={{
              padding: '12px 30px',
              background: 'transparent',
              color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: '25px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'none'
            }}>
              Continue Shopping
            </button>
          </Link>
        </div>

        <p style={{ marginTop: '2rem', color: '#666', fontSize: '0.9rem' }}>
          Your order has been sent to the supplier. You'll receive updates on your order status.
        </p>
      </div>
    </div>
  );
};

export default OrderSuccess;