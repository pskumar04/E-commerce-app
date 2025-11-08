// components/SupplierReturnRequests.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const SupplierReturnRequests = () => {
  const [returnRequests, setReturnRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionModal, setActionModal] = useState({ isOpen: false, action: '' });

  useEffect(() => {
    fetchReturnRequests();
  }, []);

  const fetchReturnRequests = async () => {
    try {
      const response = await axios.get('${config.apiUrl}/api/orders/supplier/return-requests');
      setReturnRequests(response.data);
    } catch (error) {
      console.error('Error fetching return requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, itemId, status, notes = '') => {
    try {
      await axios.put(`${config.apiUrl}/api/orders/update-item-status/${orderId}/${itemId}`, {
        status,
        adminNotes: notes
      });
      fetchReturnRequests(); // Refresh the list
      setActionModal({ isOpen: false, action: '' });
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      return_requested: '#e67e22',
      exchange_requested: '#3498db',
      return_approved: '#27ae60',
      exchange_approved: '#27ae60',
      return_rejected: '#e74c3c',
      exchange_rejected: '#e74c3c'
    };
    return colors[status] || '#95a5a6';
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading return requests...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Return & Exchange Requests</h1>

      {returnRequests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h3>No return or exchange requests</h3>
          <p>All return and exchange requests from customers will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {returnRequests.map((request, index) => (
            <div key={index} style={{
              background: 'white',
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              padding: '1.5rem',
              borderLeft: `4px solid ${getStatusColor(request.items.itemStatus)}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Order #{request.orderNumber}</h3>
                  <p style={{ margin: '0.5rem 0', color: '#666' }}>
                    Requested on: {new Date(request.items.returnRequestDate || request.items.exchangeRequestDate).toLocaleDateString()}
                  </p>
                  <div style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    background: getStatusColor(request.items.itemStatus),
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    textTransform: 'capitalize'
                  }}>
                    {request.items.itemStatus.replace('_', ' ')}
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{request.productInfo.name}</p>
                  <p style={{ margin: '0.25rem 0', color: '#666' }}>
                    Quantity: {request.items.quantity} | ${request.productInfo.price}
                  </p>
                  {request.items.size && <p style={{ margin: '0.25rem 0', color: '#666' }}>Size: {request.items.size}</p>}
                  {request.items.color && <p style={{ margin: '0.25rem 0', color: '#666' }}>Color: {request.items.color}</p>}
                </div>
              </div>

              {/* Reason and Notes */}
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ margin: '0.5rem 0' }}>
                  <strong>Reason:</strong> {request.items.returnReason || request.items.exchangeReason}
                </p>
                {(request.items.returnNotes || request.items.exchangeNotes) && (
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Customer Notes:</strong> {request.items.returnNotes || request.items.exchangeNotes}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              {['return_requested', 'exchange_requested'].includes(request.items.itemStatus) && (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setActionModal({ isOpen: true, action: 'approve' });
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Approve {request.items.itemStatus.includes('return') ? 'Return' : 'Exchange'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setActionModal({ isOpen: true, action: 'reject' });
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Reject {request.items.itemStatus.includes('return') ? 'Return' : 'Exchange'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {actionModal.isOpen && selectedRequest && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h3>
              {actionModal.action === 'approve' ? 'Approve' : 'Reject'} {' '}
              {selectedRequest.items.itemStatus.includes('return') ? 'Return' : 'Exchange'}
            </h3>
            <p>Are you sure you want to {actionModal.action} this request?</p>
            
            <div style={{ margin: '1rem 0' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Notes (Optional):
              </label>
              <textarea
                id="adminNotes"
                rows="3"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  resize: 'vertical'
                }}
                placeholder="Add any notes for the customer..."
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                onClick={() => setActionModal({ isOpen: false, action: '' })}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const notes = document.getElementById('adminNotes').value;
                  const newStatus = actionModal.action === 'approve' 
                    ? (selectedRequest.items.itemStatus.includes('return') ? 'return_approved' : 'exchange_approved')
                    : (selectedRequest.items.itemStatus.includes('return') ? 'return_rejected' : 'exchange_rejected');
                  
                  handleStatusUpdate(selectedRequest._id, selectedRequest.items._id, newStatus, notes);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: actionModal.action === 'approve' ? '#27ae60' : '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Confirm {actionModal.action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierReturnRequests;