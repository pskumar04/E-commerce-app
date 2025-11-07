import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import RatingModal from '../components/RatingModal';
import ReturnModal from '../components/ReturnModal';
import CancelModal from '../components/CancelModal';

const CustomerOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingModal, setRatingModal] = useState({
    isOpen: false,
    type: '', // 'product' or 'supplier'
    targetId: '',
    targetName: ''
  });

  // Add these state variables
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
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/orders/my-orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
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

  // Add these functions
    // In your return/exchange handler in CustomerOrders.js
    const handleReturnRequest = (order, type = 'return') => {
        console.log('Return button clicked:', { order, type });
        console.log('Order status:', order.status);
        console.log('Order items:', order.items);
        
        setReturnModal({
            isOpen: true,
            type,
            order
        });
    };
    
    const handleCancelRequest = (order) => {
        console.log('Cancel button clicked:', order);
        console.log('Order status:', order.status);
        
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


  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading orders...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>My Orders</h1>

      {/* Rating Modal */}
      <RatingModal
        isOpen={ratingModal.isOpen}
        onClose={() => setRatingModal({ ...ratingModal, isOpen: false })}
        type={ratingModal.type}
        targetId={ratingModal.targetId}
        targetName={ratingModal.targetName}
        onRatingSubmitted={handleRatingSubmitted}
      />

      {/* ADD THESE MODALS */}
      <ReturnModal
        isOpen={returnModal.isOpen}
        onClose={() => setReturnModal({ ...returnModal, isOpen: false })}
        order={returnModal.order}
        type={returnModal.type}
        onRequestSubmitted={handleRequestSubmitted}
      />

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
        </div>
      ) : (
        orders.map(order => (
          <div key={order._id} style={{
            background: 'white',
            marginBottom: '2rem',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              background: getStatusColor(order.status),
              color: 'white',
              padding: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0 }}>Order #{order.orderNumber}</h3>
                <p style={{ margin: 0, opacity: 0.9 }}>
                  Placed on {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  padding: '0.5rem 1rem', 
                  borderRadius: '20px',
                  fontWeight: 'bold'
                }}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </div>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                  Total: ${order.totalAmount}
                </p>
              </div>
            </div>


            <div style={{ padding: '1.5rem' }}>

                {/* ADD ACTION BUTTONS HERE */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {/* Cancel Order Button - for pending/confirmed orders */}
                {['pending', 'confirmed'].includes(order.status) && (
                  <button
                    onClick={() => handleCancelRequest(order)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}
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
                        padding: '0.5rem 1rem',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}
                    >
                      Request Return
                    </button>
                    <button
                      onClick={() => handleReturnRequest(order, 'exchange')}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}
                    >
                      Request Exchange
                    </button>
                  </>
                )}

                {/* Rate Supplier Button - for delivered orders */}
                {order.status === 'delivered' && order.items[0]?.product?.supplier && (
                  <button
                    onClick={() => handleRateSupplier(
                      order.items[0].product.supplier, 
                      order.items[0].product.supplier.name
                    )}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}
                  >
                    Rate Supplier
                  </button>
                )}
              </div>

              <h4>Items:</h4>
              {order.items.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1rem 0',
                  borderBottom: index < order.items.length - 1 ? '1px solid #e1e8ed' : 'none'
                }}>
                  <img 
                    src={getProductImage(item.product)} 
                    alt={getProductName(item.product)}
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      marginRight: '1rem'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <h5 style={{ margin: 0 }}>{getProductName(item.product)}</h5>
                    <p style={{ margin: 0, color: '#666' }}>
                      Quantity: {item.quantity} | ${getProductPrice(item.product, item.price)} each
                      {item.size && ` | Size: ${item.size}`}
                      {item.color && ` | Color: ${item.color}`}
                    </p>

                    {/* Item Status for Returns/Exchanges */}
                    {item.itemStatus && item.itemStatus !== 'ordered' && item.itemStatus !== 'delivered' && (
                      <div style={{ 
                        display: 'inline-block',
                        padding: '0.25rem 0.5rem',
                        background: '#f8f9fa',
                        border: '1px solid #e1e8ed',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        marginTop: '0.25rem',
                        textTransform: 'capitalize'
                      }}>
                        {item.itemStatus.replace('_', ' ')}
                      </div>
                    )}
                    
                  </div>
                  <div style={{ fontWeight: 'bold' }}>
                    ${(item.quantity * getProductPrice(item.product, item.price)).toFixed(2)}
                  </div>


                    {/* Rating Button for Delivered Orders */}
                  {order.status === 'delivered' && item.product && (
                    <div style={{ marginLeft: '1rem' }}>
                      <button
                        onClick={() => handleRateProduct(item.product, item.product.name)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Rate Product
                      </button>
                    </div>
                  )}

                </div>
              ))}


              {/* Rate Supplier Button for Delivered Orders */}
              {order.status === 'delivered' && order.items[0]?.product?.supplier && (
                <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                  <button
                    onClick={() => handleRateSupplier(
                      order.items[0].product.supplier, 
                      order.items[0].product.supplier.name
                    )}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Rate Supplier
                  </button>
                </div>
              )}


              {/* Tracking Timeline */}
              <div style={{ marginTop: '2rem' }}>
                <h4>Order Tracking:</h4>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  position: 'relative',
                  marginTop: '1rem'
                }}>
                  {['pending', 'confirmed', 'packed', 'shipped', 'delivered'].map((status, index) => (
                    <div key={status} style={{ textAlign: 'center', zIndex: 2 }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: order.tracking && order.tracking.some(t => t.status === status) 
                          ? getStatusColor(status) 
                          : '#bdc3c7',
                        margin: '0 auto 0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.8rem'
                      }}>
                        {index + 1}
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        fontWeight: order.tracking && order.tracking.some(t => t.status === status) ? 'bold' : 'normal'
                      }}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </div>
                    </div>
                  ))}
                  <div style={{
                    position: 'absolute',
                    top: '15px',
                    left: '15px',
                    right: '15px',
                    height: '2px',
                    background: '#e1e8ed',
                    zIndex: 1
                  }}></div>
                </div>

                {/* Tracking Details */}
                <div style={{ marginTop: '2rem' }}>
                  {order.tracking && order.tracking.map((track, index) => (
                    <div key={index} style={{
                      padding: '0.5rem 0',
                      borderLeft: `3px solid ${getStatusColor(track.status)}`,
                      paddingLeft: '1rem',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ fontWeight: 'bold' }}>
                        {track.status.charAt(0).toUpperCase() + track.status.slice(1)}
                      </div>
                      <div style={{ color: '#666', fontSize: '0.9rem' }}>
                        {track.description}
                      </div>
                      <div style={{ color: '#999', fontSize: '0.8rem' }}>
                        {new Date(track.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {order.expectedDelivery && (
                <div style={{
                  background: '#e8f4fd',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginTop: '1rem'
                }}>
                  <strong>Expected Delivery:</strong>{' '}
                  {new Date(order.expectedDelivery).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default CustomerOrders;