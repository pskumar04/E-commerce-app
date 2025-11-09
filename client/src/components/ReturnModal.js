import React, { useState } from 'react';
import axios from 'axios';
import config from '../config';
import { toast } from 'react-toastify';

const ReturnModal = ({ isOpen, onClose, order, type, onRequestSubmitted }) => {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please select a reason');
      return;
    }

    setLoading(true);
    try {
      // For now, we'll update the first item. You might want to let users select specific items
      const itemId = order.items[0]._id;
      
      const updateData = {
        itemStatus: type === 'return' ? 'return_requested' : 'exchange_requested',
        [`${type}Reason`]: reason,
        [`${type}Notes`]: notes,
        [`${type}RequestDate`]: new Date()
      };

      await axios.put(`${config.apiUrl}/api/orders/${order._id}/items/${itemId}`, updateData);
      
      toast.success(`${type === 'return' ? 'Return' : 'Exchange'} request submitted successfully!`);
      onRequestSubmitted();
      onClose();
      
      // Reset form
      setReason('');
      setNotes('');
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
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
        <h2>Request {type === 'return' ? 'Return' : 'Exchange'}</h2>
        <p>Order #{order.orderNumber}</p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Reason for {type === 'return' ? 'return' : 'exchange'} *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '1rem'
              }}
              required
            >
              <option value="">Select a reason</option>
              <option value="Wrong size">Wrong size</option>
              <option value="Wrong color">Wrong color</option>
              <option value="Product damaged">Product damaged</option>
              <option value="Not as described">Not as described</option>
              <option value="Changed my mind">Changed my mind</option>
              <option value="Better price available">Better price available</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="4"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '5px',
                resize: 'vertical',
                fontSize: '1rem'
              }}
              placeholder="Please provide any additional details about your request..."
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '0.75rem 1.5rem',
                background: type === 'return' ? '#e74c3c' : '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
              disabled={loading}
            >
              {loading ? 'Submitting...' : `Submit ${type === 'return' ? 'Return' : 'Exchange'} Request`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnModal;