import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBestSellers();
  }, []);

  const fetchBestSellers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/products?bestseller=true&limit=8');
      setBestSellers(response.data.products);
    } catch (error) {
      console.error('Error fetching best sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Safe function to get product image
  const getProductImage = (product) => {
    if (product.images && product.images[0]) {
      // Check if the image already has the full URL
      if (product.images[0].startsWith('http')) {
        return product.images[0];
      }
      return `http://localhost:5000${product.images[0]}`;
    }
    return 'https://via.placeholder.com/300x300?text=Product+Image';
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <h1>Welcome to Happy Cart</h1>
        <p>Discover the latest fashion trends for everyone in the family</p>
        <Link to="/products">
          <button className="cta-button">Shop Now</button>
        </Link>
      </section>

      {/* Categories Section */}
      <section style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '3rem', fontSize: '2.5rem', color: '#333' }}>
          Shop by Category
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '2rem', 
          maxWidth: '1200px', 
          margin: '0 auto' 
        }}>
          <Link to="/products?category=men" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '3rem 2rem',
              borderRadius: '15px',
              color: 'white',
              textAlign: 'center',
              transition: 'transform 0.3s ease'
            }} className="category-card">
              <h3>Men's Fashion</h3>
              <p>Trendy outfits for men</p>
            </div>
          </Link>
          
          <Link to="/products?category=women" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              padding: '3rem 2rem',
              borderRadius: '15px',
              color: 'white',
              textAlign: 'center',
              transition: 'transform 0.3s ease'
            }} className="category-card">
              <h3>Women's Fashion</h3>
              <p>Elegant styles for women</p>
            </div>
          </Link>
          
          <Link to="/products?category=children" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              padding: '3rem 2rem',
              borderRadius: '15px',
              color: 'white',
              textAlign: 'center',
              transition: 'transform 0.3s ease'
            }} className="category-card">
              <h3>Kids Collection</h3>
              <p>Adorable outfits for children</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Best Sellers Section */}
      <section style={{ padding: '4rem 2rem', background: '#f8f9fa' }}>
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '3rem', 
          fontSize: '2.5rem', 
          color: '#333' 
        }}>
          Best Sellers
        </h2>
        
        {loading ? (
          <div style={{ textAlign: 'center' }}>Loading...</div>
        ) : (
          <div className="products-grid">
            {bestSellers.map(product => (
              <div key={product._id} className="product-card">
                {/* FIXED IMAGE SOURCE */}
                <img 
                  src={getProductImage(product)} 
                  alt={product.name}
                  className="product-image"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x300?text=Image+Not+Found';
                  }}
                />
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <span className="product-price">${product.price}</span>
                    {product.originalPrice > product.price && (
                      <span className="original-price">${product.originalPrice}</span>
                    )}
                  </div>
                  <Link to={`/product/${product._id}`}>
                    <button className="add-to-cart-btn">View Details</button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link to="/products?bestseller=true">
            <button className="cta-button">View All Best Sellers</button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;