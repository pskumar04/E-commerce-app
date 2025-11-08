import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import config from '../config';
import RatingModal from '../components/RatingModal';
import ReturnModal from '../components/ReturnModal';
import CancelModal from '../components/CancelModal';

const CustomerOrders = () => {
  const { user } = useAuth();
  // const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [ratingModal, setRatingModal] = useState({
    isOpen: false,
    type: '', // 'product' or 'supplier'
    targetId: '',
    targetName: ''
  });

  const [returnModal, setReturnModal] = useState({
    isOpen: false,
    type: 'return', // 'return' or 'exchange'
    order: null
  });

  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    order: null
  });

  useEffect(() => {
    if (user) {
      fetchOrders();
    }

    // Check for order success from navigation state
    if (location.state?.orderSuccess) {
      setShowSuccess(true);
      setOrderNumber(location.state.orderNumber);
      // Clear the navigation state
      window.history.replaceState({}, document.title);
    }
  }, [user, location]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('${config.apiUrl}/api/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Orders fetched:', response.data);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Add these functions
  const handleReturnRequest = (order, type = 'return') => {
    setReturnModal({
      isOpen: true,
      type,
      order
    });
  };
  
  const handleCancelRequest = (order) => {
    setCancelModal({
      isOpen: true,
      order
    });
  };

  const handleRequestSubmitted = () => {
    fetchOrders(); // Refresh orders
  };

  const handleRateProduct = (product, productName) => {
    setRatingModal({
      isOpen: true,
      type: 'product',
      targetId: product._id,
      targetName: productName
    });
  };

  const handleRateSupplier = (supplier, supplierName) => {
    setRatingModal({
      isOpen: true,
      type: 'supplier',
      targetId: supplier._id,
      targetName: supplierName
    });
  };

  const handleRatingSubmitted = () => {
    fetchOrders(); // Refresh orders to show updated ratings
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f39c12',
      confirmed: '#3498db',
      packed: '#9b59b6',
      shipped: '#e67e22',
      delivered: '#27ae60',
      cancelled: '#e74c3c'
    };
    return colors[status] || '#95a5a6';
  };

  // Safe function to get product image
  const getProductImage = (product) => {
    if (!product) return 'https://via.placeholder.com/60x60?text=No+Image';
    if (product.images && product.images[0]) {
      return `http://localhost:5000${product.images[0]}`;
    }
    return 'https://via.placeholder.com/60x60?text=No+Image';
  };

  // Safe function to get product name
  const getProductName = (product) => {
    return product?.name || 'Product not available';
  };

  // Safe function to get product price
  const getProductPrice = (product, itemPrice) => {
    return product?.price || itemPrice || 0;
  };

  // Format sizes and colors arrays properly
  const formatSizesColors = (item) => {
    let details = [];
    
    if (item.size) {
      if (Array.isArray(item.size)) {
        details.push(`Size: ${item.size.join(', ')}`);
      } else {
        details.push(`Size: ${item.size}`);
      }
    }
    
    if (item.color) {
      if (Array.isArray(item.color)) {
        details.push(`Color: ${item.color.join(', ')}`);
      } else {
        details.push(`Color: ${item.color}`);
      }
    }
    
    return details.join(' | ');
  };

  // Get tracking status with proper fallbacks
  const getTrackingStatus = (order) => {
    // If order has tracking array, use it
    if (order.tracking && order.tracking.length > 0) {
      return order.tracking;
    }
    
    // Otherwise create basic tracking from order status
    const statusFlow = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];
    const currentStatusIndex = statusFlow.indexOf(order.status);
    
    return statusFlow.slice(0, currentStatusIndex + 1).map((status, index) => ({
      status,
      description: getDefaultDescription(status),
      timestamp: new Date(order.createdAt).getTime() + (index * 60000) // Stagger timestamps
    }));
  };

  const getDefaultDescription = (status) => {
    const descriptions = {
      pending: 'Order has been placed and is awaiting confirmation',
      confirmed: 'Order has been confirmed',
      packed: 'Items have been packed',
      shipped: 'Order has been shipped',
      delivered: 'Order has been delivered'
    };
    return descriptions[status] || `Order is ${status}`;
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading orders...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#333' }}>Happy Cart</h1>

      {/* Order Success Message */}
      {showSuccess && (
        <div style={{
          background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
          border: '1px solid #c3e6cb',
          color: '#155724',
          padding: '1.5rem',
          borderRadius: '10px',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>🎉 Order Placed Successfully!</h3>
          <p style={{ margin: '0', fontSize: '1.1rem' }}>
            Your order <strong>#{orderNumber}</strong> has been placed successfully.
            You can track your order status below.
          </p>
        </div>
      )}

      {/* Rating Modal */}
      <RatingModal
        isOpen={ratingModal.isOpen}
        onClose={() => setRatingModal({ ...ratingModal, isOpen: false })}
        type={ratingModal.type}
        targetId={ratingModal.targetId}
        targetName={ratingModal.targetName}
        onRatingSubmitted={handleRatingSubmitted}
      />

      {/* Return Modal */}
      <ReturnModal
        isOpen={returnModal.isOpen}
        onClose={() => setReturnModal({ ...returnModal, isOpen: false })}
        order={returnModal.order}
        type={returnModal.type}
        onRequestSubmitted={handleRequestSubmitted}
      />

      {/* Cancel Modal */}
      <CancelModal
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ ...cancelModal, isOpen: false })}
        order={cancelModal.order}
        onCancelSubmitted={handleRequestSubmitted}
      />

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h3>No orders yet</h3>
          <p>Start shopping to see your orders here!</p>
          <button 
            onClick={() => window.location.href = '/products'}
            style={{
              padding: '1rem 2rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '1rem',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            Start Shopping
          </button>
        </div>
      ) : (
        orders.map(order => {
          const trackingData = getTrackingStatus(order);
          
          return (
            <div key={order._id} style={{
              background: 'white',
              marginBottom: '2rem',
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              {/* Order Header */}
              <div style={{
                background: getStatusColor(order.status),
                color: 'white',
                padding: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Order #{order.orderNumber}</h3>
                  <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: '1rem' }}>
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    padding: '0.75rem 1.5rem', 
                    borderRadius: '25px',
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </div>
                  <p style={{ margin: '0.75rem 0 0 0', fontSize: '1.1rem', fontWeight: 'bold' }}>
                    Total: ${order.totalAmount}
                  </p>
                </div>
              </div>

              <div style={{ padding: '1.5rem' }}>
                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  {/* Cancel Order Button - for pending/confirmed orders */}
                  {['pending', 'confirmed'].includes(order.status) && (
                    <button
                      onClick={() => handleCancelRequest(order)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#c0392b'}
                      onMouseOut={(e) => e.target.style.background = '#e74c3c'}
                    >
                      Cancel Order
                    </button>
                  )}

                  {/* Return/Exchange Buttons - for delivered orders */}
                  {order.status === 'delivered' && (
                    <>
                      <button
                        onClick={() => handleReturnRequest(order, 'return')}
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#c0392b'}
                        onMouseOut={(e) => e.target.style.background = '#e74c3c'}
                      >
                        Request Return
                      </button>
                      <button
                        onClick={() => handleReturnRequest(order, 'exchange')}
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#2980b9'}
                        onMouseOut={(e) => e.target.style.background = '#3498db'}
                      >
                        Request Exchange
                      </button>
                    </>
                  )}
                </div>

                {/* Items Section */}
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ marginBottom: '1rem', fontSize: '1.2rem', color: '#333' }}>Items:</h4>
                  {order.items.map((item, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      padding: '1rem',
                      border: '1px solid #e1e8ed',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      background: '#fafafa'
                    }}>
                      <img 
                        src={getProductImage(item.product)} 
                        alt={getProductName(item.product)}
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          marginRight: '1rem'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#333' }}>
                          {getProductName(item.product)}
                        </h5>
                        <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.95rem' }}>
                          Quantity: {item.quantity} | ${getProductPrice(item.product, item.price)} each
                        </p>
                        {formatSizesColors(item) && (
                          <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.95rem' }}>
                            {formatSizesColors(item)}
                          </p>
                        )}
                        
                        {/* Item Status for Returns/Exchanges */}
                        {item.itemStatus && item.itemStatus !== 'ordered' && item.itemStatus !== 'delivered' && (
                          <div style={{ 
                            display: 'inline-block',
                            padding: '0.4rem 0.8rem',
                            background: '#fff3cd',
                            border: '1px solid #ffeaa7',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            marginTop: '0.5rem',
                            textTransform: 'capitalize',
                            fontWeight: '600',
                            color: '#856404'
                          }}>
                            {item.itemStatus.replace('_', ' ')}
                          </div>
                        )}
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#333' }}>
                        ${(item.quantity * getProductPrice(item.product, item.price)).toFixed(2)}
                      </div>

                      {/* Rating Button for Delivered Orders */}
                      {order.status === 'delivered' && item.product && (
                        <div style={{ marginLeft: '1rem' }}>
                          <button
                            onClick={() => handleRateProduct(item.product, item.product.name)}
                            style={{
                              padding: '0.6rem 1.2rem',
                              background: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#218838'}
                            onMouseOut={(e) => e.target.style.background = '#28a745'}
                          >
                            Rate Product
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Order Tracking */}
                <div style={{ marginTop: '2rem' }}>
                  <h4 style={{ marginBottom: '1rem', fontSize: '1.2rem', color: '#333' }}>Order Tracking:</h4>
                  
                  {/* Tracking Timeline */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    position: 'relative',
                    margin: '2rem 0'
                  }}>
                    {['pending', 'confirmed', 'packed', 'shipped', 'delivered'].map((status, index) => {
                      const isCompleted = trackingData.some(t => t.status === status);
                      return (
                        <div key={status} style={{ textAlign: 'center', zIndex: 2, flex: 1 }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: isCompleted ? getStatusColor(status) : '#bdc3c7',
                            margin: '0 auto 0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            border: `3px solid ${isCompleted ? getStatusColor(status) : '#e1e8ed'}`,
                            boxShadow: isCompleted ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
                          }}>
                            {index + 1}
                          </div>
                          <div style={{
                            fontSize: '0.9rem',
                            fontWeight: isCompleted ? 'bold' : 'normal',
                            color: isCompleted ? '#333' : '#666'
                          }}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </div>
                        </div>
                      );
                    })}
                    <div style={{
                      position: 'absolute',
                      top: '20px',
                      left: '20px',
                      right: '20px',
                      height: '3px',
                      background: '#e1e8ed',
                      zIndex: 1
                    }}></div>
                  </div>

                  {/* Tracking Details */}
                  <div style={{ marginTop: '2rem' }}>
                    {trackingData.map((track, index) => (
                      <div key={index} style={{
                        padding: '1rem',
                        borderLeft: `4px solid ${getStatusColor(track.status)}`,
                        paddingLeft: '1.5rem',
                        marginBottom: '1rem',
                        background: '#f8f9fa',
                        borderRadius: '0 8px 8px 0'
                      }}>
                        <div style={{ 
                          fontWeight: 'bold', 
                          fontSize: '1.1rem',
                          color: getStatusColor(track.status),
                          marginBottom: '0.5rem'
                        }}>
                          {track.status.charAt(0).toUpperCase() + track.status.slice(1)}
                        </div>
                        <div style={{ color: '#666', fontSize: '1rem', marginBottom: '0.25rem' }}>
                          {track.description}
                        </div>
                        <div style={{ color: '#999', fontSize: '0.9rem' }}>
                          {new Date(track.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expected Delivery */}
                {order.expectedDelivery && (
                  <div style={{
                    background: 'linear-gradient(135deg, #e8f4fd 0%, #d1ecf1 100%)',
                    padding: '1.5rem',
                    borderRadius: '10px',
                    marginTop: '2rem',
                    border: '1px solid #bee5eb'
                  }}>
                    <strong style={{ fontSize: '1.1rem', color: '#0c5460' }}>Expected Delivery:</strong>{' '}
                    <span style={{ fontSize: '1.1rem', color: '#0c5460', fontWeight: '600' }}>
                      {new Date(order.expectedDelivery).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                )}

                {/* Rate Supplier Button for Delivered Orders */}
                {order.status === 'delivered' && order.items[0]?.product?.supplier && (
                  <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <button
                      onClick={() => handleRateSupplier(
                        order.items[0].product.supplier, 
                        order.items[0].product.supplier.name
                      )}
                      style={{
                        padding: '1rem 2rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                      }}
                      onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                      Rate Supplier
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default CustomerOrders;