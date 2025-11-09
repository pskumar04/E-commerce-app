import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/products/${id}`);
      setProduct(response.data);
      
      // Set default selections
      if (response.data.sizes.length > 0) {
        setSelectedSize(response.data.sizes[0]);
      }
      if (response.data.colors.length > 0) {
        setSelectedColor(response.data.colors[0]);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!selectedSize && product.sizes.length > 0) {
      toast.error('Please select a size');
      return;
    }
    if (!selectedColor && product.colors.length > 0) {
      toast.error('Please select a color');
      return;
    }

    addToCart(product, quantity, selectedSize, selectedColor);
    toast.success('Product added to cart!');
  };

  // Function to render star ratings
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} style={{ color: '#ffc107', fontSize: '1.2rem' }}>★</span>);
    }
    
    if (hasHalfStar) {
      stars.push(<span key="half" style={{ color: '#ffc107', fontSize: '1.2rem' }}>★</span>);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} style={{ color: '#e0e0e0', fontSize: '1.2rem' }}>★</span>);
    }
    
    return stars;
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading product...</div>;
  }

  if (!product) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Product not found</div>;
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '2rem auto', 
      padding: '0 2rem' 
    }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '3rem',
        background: 'white',
        borderRadius: '15px',
        padding: '2rem',
        boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
      }}>
        {/* Product Images */}
        <div>
          <img 
            src={product.images && product.images[0] ? `http://localhost:5000${product.images[0]}` : 'https://via.placeholder.com/500x500?text=Product+Image'} 
            alt={product.name}
            style={{
              width: '100%',
              height: '400px',
              objectFit: 'cover',
              borderRadius: '10px'
            }}
          />
        </div>

        {/* Product Info */}
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{product.name}</h1>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>{product.description}</p>
          
          {/* Product Rating */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {renderStars(product.ratings?.average || 0)}
              <span style={{ color: '#666', fontSize: '0.9rem' }}>
                ({product.ratings?.count || 0} reviews)
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>
              ${product.price}
            </span>
            {product.originalPrice > product.price && (
              <span style={{ 
                fontSize: '1.2rem', 
                color: '#999', 
                textDecoration: 'line-through' 
              }}>
                ${product.originalPrice}
              </span>
            )}
          </div>

          {/* Size Selection - MANDATORY */}
          {product.sizes.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Size: *</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    style={{
                      padding: '0.5rem 1rem',
                      border: `2px solid ${selectedSize === size ? '#667eea' : '#e1e8ed'}`,
                      background: selectedSize === size ? '#667eea' : 'white',
                      color: selectedSize === size ? 'white' : '#333',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {!selectedSize && (
                <p style={{ color: '#ff4757', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Please select a size
                </p>
              )}
            </div>
          )}

          {/* Color Selection */}
          {product.colors.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Color:</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {product.colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    style={{
                      padding: '0.5rem 1rem',
                      border: `2px solid ${selectedColor === color ? '#667eea' : '#e1e8ed'}`,
                      background: selectedColor === color ? '#667eea' : 'white',
                      color: selectedColor === color ? 'white' : '#333',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Quantity:</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{
                  padding: '0.5rem 1rem',
                  border: '2px solid #e1e8ed',
                  background: 'white',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
              >
                -
              </button>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', minWidth: '30px', textAlign: 'center' }}>{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                style={{
                  padding: '0.5rem 1rem',
                  border: '2px solid #e1e8ed',
                  background: 'white',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
              >
                +
              </button>
              <span style={{ color: '#666' }}>{product.stock} available</span>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || (product.sizes.length > 0 && !selectedSize)}
            style={{
              width: '100%',
              padding: '1rem',
              background: (product.stock === 0 || (product.sizes.length > 0 && !selectedSize)) ? '#ccc' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: (product.stock === 0 || (product.sizes.length > 0 && !selectedSize)) ? 'not-allowed' : 'pointer',
              marginBottom: '1rem'
            }}
          >
            {product.stock === 0 ? 'Out of Stock' : 
             (product.sizes.length > 0 && !selectedSize) ? 'Select Size to Add to Cart' : 'Add to Cart'}
          </button>

          <Link to="/products">
            <button
              style={{
                width: '100%',
                padding: '1rem',
                background: 'transparent',
                color: '#667eea',
                border: '2px solid #667eea',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Continue Shopping
            </button>
          </Link>
        </div>
      </div>

      {/* Supplier Information Section */}
      {product.supplier && (
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '2rem',
          marginTop: '2rem',
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>Supplier Information</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <h3 style={{ marginBottom: '1rem', color: '#667eea' }}>Supplier Details</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: '#667eea',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1.5rem'
                }}>
                  {product.supplier.name?.charAt(0).toUpperCase() || 'S'}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0' }}>{product.supplier.name}</h4>
                  <p style={{ margin: 0, color: '#666' }}>{product.supplier.logisticsName}</p>
                </div>
              </div>
              
              {/* Supplier Rating */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>Supplier Rating</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {renderStars(4.2)} {/* Static rating for demo */}
                  <span style={{ color: '#666' }}>4.2/5 (128 reviews)</span>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '1rem', color: '#667eea' }}>Contact & Address</h3>
              {product.supplier.address ? (
                <div>
                  <p style={{ margin: '0.25rem 0' }}>
                    <strong>Address:</strong> {product.supplier.address.street}, {product.supplier.address.city}
                  </p>
                  <p style={{ margin: '0.25rem 0' }}>
                    {product.supplier.address.state}, {product.supplier.address.zipCode}, {product.supplier.address.country}
                  </p>
                  {product.supplier.phone && (
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>Phone:</strong> {product.supplier.phone}
                    </p>
                  )}
                  {product.supplier.email && (
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>Email:</strong> {product.supplier.email}
                    </p>
                  )}
                </div>
              ) : (
                <p style={{ color: '#666' }}>Address information not available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;