import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const category = searchParams.get('category') || 'all';
  const bestseller = searchParams.get('bestseller');
  const search = searchParams.get('search');

  useEffect(() => {
    fetchProducts();
  }, [category, bestseller, search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (category !== 'all') params.append('category', category);
      if (bestseller) params.append('bestseller', bestseller);
      if (search) params.append('search', search);

      const response = await axios.get(`${config.apiUrl}/api/products?${params}`);
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Safe product data access
  const getSafeProduct = (product) => {
    return product || {};
  };

  const getProductImage = (product) => {
    const safeProduct = getSafeProduct(product);
    if (!safeProduct.images || safeProduct.images.length === 0) {
      return 'https://via.placeholder.com/300x300?text=No+Image';
    }
    
    const imageUrl = safeProduct.images[0];
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    } else {
      return `http://localhost:5000${imageUrl}`;
    }
  };

  const handleAddToCart = async (product) => {
    const safeProduct = getSafeProduct(product);
    if (!safeProduct._id) {
      toast.error('Product information is incomplete');
      return;
    }
    
    const success = await addToCart(safeProduct, 1);
    if (success) {
      toast.success(`${safeProduct.name || 'Product'} added to cart!`);
    }
  };

  const handleViewProduct = (product) => {
    const safeProduct = getSafeProduct(product);
    if (!safeProduct._id) {
      toast.error('Product not found');
      return;
    }
    navigate(`/product/${safeProduct._id}`);
  };

  return (
    <div style={{ padding: '2rem', minHeight: '80vh' }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        marginBottom: '2rem'
      }}>
        <h1 style={{ marginBottom: '1rem', color: '#333' }}>
          {bestseller ? 'Best Sellers' : 
           category !== 'all' ? `${category.charAt(0).toUpperCase() + category.slice(1)}'s Collection` : 
           'All Products'}
        </h1>
        
        {/* Category Filters */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          <Link 
            to="/products" 
            style={{ 
              padding: '0.5rem 1rem',
              background: category === 'all' ? '#667eea' : '#e1e8ed',
              color: category === 'all' ? 'white' : '#333',
              textDecoration: 'none',
              borderRadius: '20px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
          >
            All
          </Link>
          <Link 
            to="/products?category=men" 
            style={{ 
              padding: '0.5rem 1rem',
              background: category === 'men' ? '#667eea' : '#e1e8ed',
              color: category === 'men' ? 'white' : '#333',
              textDecoration: 'none',
              borderRadius: '20px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
          >
            Men
          </Link>
          <Link 
            to="/products?category=women" 
            style={{ 
              padding: '0.5rem 1rem',
              background: category === 'women' ? '#667eea' : '#e1e8ed',
              color: category === 'women' ? 'white' : '#333',
              textDecoration: 'none',
              borderRadius: '20px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
          >
            Women
          </Link>
          <Link 
            to="/products?category=children" 
            style={{ 
              padding: '0.5rem 1rem',
              background: category === 'children' ? '#667eea' : '#e1e8ed',
              color: category === 'children' ? 'white' : '#333',
              textDecoration: 'none',
              borderRadius: '20px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
          >
            Children
          </Link>
        </div>

        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem 2rem',
            color: '#666',
            fontSize: '1.1rem'
          }}>
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem 2rem',
            color: '#666'
          }}>
            <h3>No products found</h3>
            <p>Try a different category or search term.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '2rem',
            padding: '1rem 0'
          }}>
            {products.map(product => {
              const safeProduct = getSafeProduct(product);
              const isOutOfStock = safeProduct.stock === 0;
              
              return (
                <div 
                  key={safeProduct._id || Math.random()} 
                  style={{
                    background: 'white',
                    borderRadius: '15px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    border: isOutOfStock ? '2px solid #ff6b6b' : '2px solid transparent',
                    position: 'relative',
                    opacity: isOutOfStock ? 0.7 : 1
                  }}
                  onMouseOver={(e) => {
                    if (!isOutOfStock) {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.15)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isOutOfStock) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
                    }
                  }}
                >
                  {/* Out of Stock Badge */}
                  {isOutOfStock && (
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: '#ff6b6b',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      zIndex: 2
                    }}>
                      Out of Stock
                    </div>
                  )}

                  {/* Best Seller Badge */}
                  {safeProduct.isBestSeller && (
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      left: '1rem',
                      background: 'linear-gradient(135deg, #ff6b00, #ff8e00)',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      zIndex: 2
                    }}>
                      ★ Best Seller
                    </div>
                  )}

                  {/* Product Image */}
                  <div 
                    style={{ 
                      position: 'relative',
                      marginBottom: '1rem',
                      borderRadius: '12px',
                      overflow: 'hidden'
                    }}
                    onClick={() => handleViewProduct(safeProduct)}
                  >
                    <img 
                      src={getProductImage(safeProduct)}
                      alt={safeProduct.name || 'Product'}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        transition: 'transform 0.3s ease'
                      }}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                      }}
                    />
                  </div>
                  
                  {/* Product Info */}
                  <div>
                    <h3 style={{ 
                      margin: '0 0 0.5rem 0', 
                      color: '#333',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      lineHeight: '1.4'
                    }}>
                      {safeProduct.name || 'Product Name Not Available'}
                    </h3>
                    
                    <p style={{ 
                      color: '#666', 
                      margin: '0 0 1rem 0',
                      fontSize: '0.9rem',
                      minHeight: '40px',
                      lineHeight: '1.5'
                    }}>
                      {safeProduct.description 
                        ? (safeProduct.description.length > 80 
                            ? safeProduct.description.substring(0, 80) + '...' 
                            : safeProduct.description)
                        : 'No description available'
                      }
                    </p>
                    
                    {/* Size and Color Info */}
                    {(safeProduct.sizes?.length > 0 || safeProduct.colors?.length > 0) && (
                      <div style={{ 
                        marginBottom: '1rem',
                        fontSize: '0.8rem',
                        color: '#666'
                      }}>
                        {safeProduct.sizes?.length > 0 && (
                          <div style={{ marginBottom: '0.25rem' }}>
                            <strong>Sizes:</strong> {safeProduct.sizes.join(', ')}
                          </div>
                        )}
                        {safeProduct.colors?.length > 0 && (
                          <div>
                            <strong>Colors:</strong> {safeProduct.colors.join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Price */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      marginBottom: '1.5rem'
                    }}>
                      <span style={{ 
                        fontSize: '1.3rem', 
                        fontWeight: 'bold', 
                        color: '#333' 
                      }}>
                        ${safeProduct.price || '0.00'}
                      </span>
                      {safeProduct.originalPrice && safeProduct.originalPrice > safeProduct.price && (
                        <span style={{ 
                          fontSize: '0.9rem', 
                          color: '#999', 
                          textDecoration: 'line-through'
                        }}>
                          ${safeProduct.originalPrice}
                        </span>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '0.75rem',
                      flexDirection: 'column'
                    }}>
                      <button
                        onClick={() => handleViewProduct(safeProduct)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: 'transparent',
                          color: '#667eea',
                          border: '2px solid #667eea',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.background = '#667eea';
                          e.target.style.color = 'white';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.style.color = '#667eea';
                        }}
                      >
                        View Details
                      </button>
                      
                      <button 
                        onClick={() => handleAddToCart(safeProduct)}
                        disabled={isOutOfStock}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: isOutOfStock ? '#95a5a6' : '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                          if (!isOutOfStock) {
                            e.target.style.background = '#218838';
                            e.target.style.transform = 'translateY(-2px)';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!isOutOfStock) {
                            e.target.style.background = '#28a745';
                            e.target.style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;