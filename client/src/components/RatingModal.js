import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const RatingModal = ({ isOpen, onClose, type, targetId, targetName, onRatingSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setLoading(true);

    try {
      const endpoint = type === 'product' 
        ? `http://localhost:5000/api/ratings/product/${targetId}`
        : `http://localhost:5000/api/ratings/supplier/${targetId}`;
      
      console.log('Submitting rating to:', endpoint);
      
      const response = await axios.post(endpoint, {
        rating,
        comment: comment || ''
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Rating response:', response.data);
      
      toast.success(response.data.message || 'Rating submitted successfully!');
      onRatingSubmitted();
      onClose();
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Rating error:', error);
      console.error('Error response:', error.response);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Error submitting rating. Please try again.';
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
        borderRadius: '15px',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>
            Rate {type === 'product' ? 'Product' : 'Supplier'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>
        
        <p style={{ marginBottom: '1.5rem', color: '#666' }}>
          How was your experience with <strong>{targetName}</strong>?
        </p>

        <form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Your Rating:</label>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '2.5rem',
                    cursor: 'pointer',
                    color: star <= (hoverRating || rating) ? '#ffc107' : '#e0e0e0',
                    transition: 'color 0.2s',
                    padding: '0.25rem'
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '0.5rem', color: '#666' }}>
              {rating === 0 ? 'Select a rating' : `${rating} star${rating > 1 ? 's' : ''}`}
            </div>
          </div>

          {/* Comment */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Comment (optional):
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="4"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e1e8ed',
                borderRadius: '8px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              placeholder="Share your experience with this product..."
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                color: '#667eea',
                border: '2px solid #667eea',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || rating === 0}
              style={{
                padding: '0.75rem 1.5rem',
                background: rating === 0 ? '#ccc' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: (loading || rating === 0) ? 'not-allowed' : 'pointer',
                opacity: (loading || rating === 0) ? 0.6 : 1
              }}
            >
              {loading ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;