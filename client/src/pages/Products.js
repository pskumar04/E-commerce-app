import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();

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

      const response = await axios.get(`http://localhost:5000/api/products?${params}`);
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        marginBottom: '2rem'
      }}>
        <h1 style={{ marginBottom: '1rem' }}>
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
              fontWeight: '500'
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
              fontWeight: '500'
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
              fontWeight: '500'
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
              fontWeight: '500'
            }}
          >
            Children
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading products...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            No products found. Try a different category or search term.
          </div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <div key={product._id} className="product-card">
                {/* UPDATED IMAGE SOURCE - LINE 85 */}
                {/* // In the products.map section, update the image tag: */}
                <img 
                src={product.images && product.images[0] ? `http://localhost:5000${product.images[0]}` : 'https://via.placeholder.com/300x300?text=Product+Image'} 
                alt={product.name}
                className="product-image"
                onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x300?text=Image+Not+Found';
                }}
                />
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p style={{ 
                    color: '#666', 
                    fontSize: '0.9rem',
                    marginBottom: '1rem'
                  }}>
                    <strong>Sizes:</strong> {product.sizes?.join(', ') || 'Not specified'} | 
                    <strong> Colors:</strong> {product.colors?.join(', ') || 'Not specified'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <span className="product-price">${product.price}</span>
                    {product.originalPrice > product.price && (
                      <span className="original-price">${product.originalPrice}</span>
                    )}
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem',
                    flexDirection: 'column'
                  }}>
                    <Link to={`/product/${product._id}`}>
                      <button style={{
                        width: '100%',
                        background: 'transparent',
                        color: '#667eea',
                        border: '2px solid #667eea',
                        padding: '8px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}>
                        View Details
                      </button>
                    </Link>
                    <button 
                      className="add-to-cart-btn"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                    >
                      {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;