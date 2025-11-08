import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Product not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const getProductImage = (image) => {
    if (!image) return 'https://via.placeholder.com/500x500?text=No+Image';
    if (image.startsWith('http')) return image;
    return `http://localhost:5000${image}`;
  };

  const handleAddToCart = async () => {
    if (!product) return;

    const success = await addToCart(product, quantity, selectedSize, selectedColor);
    if (success) {
      toast.success('Product added to cart!');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading product...</div>;
  }

  if (!product) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>Product Not Found</h2>
        <button 
          onClick={() => navigate('/')}
          style={{
            padding: '1rem 2rem',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate(-1)}
        style={{
          padding: '0.5rem 1rem',
          background: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginBottom: '2rem'
        }}
      >
        ← Back
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
        {/* Product Images */}
        <div>
          <img 
            src={getProductImage(product.images?.[0])}
            alt={product.name}
            style={{
              width: '100%',
              borderRadius: '10px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}
          />
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            {product.images?.map((image, index) => (
              <img 
                key={index}
                src={getProductImage(image)}
                alt={`${product.name} ${index + 1}`}
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: '2px solid #e1e8ed'
                }}
              />
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <h1 style={{ margin: '0 0 1rem 0', color: '#333' }}>{product.name}</h1>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>{product.description}</p>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
              ${product.price}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span style={{ 
                fontSize: '1.2rem', 
                color: '#999', 
                textDecoration: 'line-through',
                marginLeft: '1rem'
              }}>
                ${product.originalPrice}
              </span>
            )}
          </div>

          {/* Size Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Size</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: selectedSize === size ? '#667eea' : '#f8f9fa',
                      color: selectedSize === size ? 'white' : '#333',
                      border: '1px solid #e1e8ed',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selection */}
          {product.colors && product.colors.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Color</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {product.colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: selectedColor === color ? '#667eea' : '#f8f9fa',
                      color: selectedColor === color ? 'white' : '#333',
                      border: '1px solid #e1e8ed',
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
            <h3 style={{ marginBottom: '0.5rem' }}>Quantity</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{
                  padding: '0.5rem',
                  background: '#f8f9fa',
                  border: '1px solid #e1e8ed',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                -
              </button>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                style={{
                  padding: '0.5rem',
                  background: '#f8f9fa',
                  border: '1px solid #e1e8ed',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            style={{
              width: '100%',
              padding: '1rem 2rem',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}
          >
            Add to Cart - ${(product.price * quantity).toFixed(2)}
          </button>

          {/* Product Details */}
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <h3>Product Details</h3>
            <p><strong>Category:</strong> {product.category}</p>
            <p><strong>Subcategory:</strong> {product.subcategory}</p>
            <p><strong>Stock:</strong> {product.stock} available</p>
            {product.isBestSeller && <p><strong>⭐ Best Seller</strong></p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;