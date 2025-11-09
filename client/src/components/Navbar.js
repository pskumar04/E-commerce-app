import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { getCartItemsCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getUserName = () => {
    if (!user) return 'Guest';
    
    // Handle different user data structures
    if (user.name && user.name !== 'Test User') return user.name;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.email) return user.email.split('@')[0];
    
    // Fallback to stored name from localStorage
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.name && parsedUser.name !== 'Test User') {
          return parsedUser.name;
        }
      }
    } catch (error) {
      console.error('Error reading stored user:', error);
    }
    
    return 'User';
  };

  const getUserDisplayName = () => {
    const name = getUserName();
    // If it's still "Test User" or similar, try to get from email
    if (name === 'Test User' || name === 'User' || !name.trim()) {
      if (user?.email) {
        return user.email.split('@')[0];
      }
      return 'User';
    }
    return name;
  };

  return (
    <nav style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '1rem 0',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link to="/" style={{
          color: 'white',
          textDecoration: 'none',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>🛒</span>
          Happy Cart
        </Link>
        
        <ul style={{
          display: 'flex',
          listStyle: 'none',
          margin: 0,
          padding: 0,
          alignItems: 'center',
          gap: '2rem'
        }}>
          <li>
            <Link to="/" style={{
              color: 'white',
              textDecoration: 'none',
              fontWeight: '500',
              transition: 'opacity 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.opacity = '0.8'}
            onMouseOut={(e) => e.target.style.opacity = '1'}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/products?bestseller=true" style={{
              color: 'white',
              textDecoration: 'none',
              fontWeight: '500',
              transition: 'opacity 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.opacity = '0.8'}
            onMouseOut={(e) => e.target.style.opacity = '1'}>
              Best Sellers
            </Link>
          </li>
          <li>
            <Link to="/products" style={{
              color: 'white',
              textDecoration: 'none',
              fontWeight: '500',
              transition: 'opacity 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.opacity = '0.8'}
            onMouseOut={(e) => e.target.style.opacity = '1'}>
              Explore
            </Link>
          </li>
          
          {user ? (
            <>
              <li>
                <Link 
                  to="/profile" 
                  style={{
                    color: 'white',
                    textDecoration: 'none',
                    fontWeight: '600',
                    padding: '0.5rem 1rem',
                    borderRadius: '5px',
                    transition: 'background 0.3s ease',
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.1)'
                  }}
                  onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                  onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                >
                  Hello {getUserDisplayName()}
                </Link>
              </li>
              
              {user.role === 'supplier' && (
                <li>
                  <Link to="/supplier-dashboard" style={{
                    color: 'white',
                    textDecoration: 'none',
                    fontWeight: '500',
                    transition: 'opacity 0.3s ease'
                  }}
                  onMouseOver={(e) => e.target.style.opacity = '0.8'}
                  onMouseOut={(e) => e.target.style.opacity = '1'}>
                    Supplier Dashboard
                  </Link>
                </li>
              )}
              
              {user.role === 'customer' && (
                <li>
                  <Link to="/my-orders" style={{
                    color: 'white',
                    textDecoration: 'none',
                    fontWeight: '500',
                    transition: 'opacity 0.3s ease'
                  }}
                  onMouseOver={(e) => e.target.style.opacity = '0.8'}
                  onMouseOut={(e) => e.target.style.opacity = '1'}>
                    My Orders
                  </Link>
                </li>
              )}
              
              <li>
                <Link to="/cart" style={{
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: '500',
                  position: 'relative',
                  padding: '0.5rem',
                  transition: 'opacity 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.opacity = '0.8'}
                onMouseOut={(e) => e.target.style.opacity = '1'}>
                  🛒
                  {getCartItemsCount() > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-5px',
                      background: '#ff4757',
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      {getCartItemsCount()}
                    </span>
                  )}
                </Link>
              </li>
              
              <li>
                <button 
                  onClick={handleLogout}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '0.5rem 1rem',
                    borderRadius: '5px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.2)';
                    e.target.style.borderColor = 'rgba(255,255,255,0.5)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.1)';
                    e.target.style.borderColor = 'rgba(255,255,255,0.3)';
                  }}
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" style={{
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: '500',
                  transition: 'opacity 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.opacity = '0.8'}
                onMouseOut={(e) => e.target.style.opacity = '1'}>
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" style={{
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: '500',
                  transition: 'opacity 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.opacity = '0.8'}
                onMouseOut={(e) => e.target.style.opacity = '1'}>
                  Sign Up
                </Link>
              </li>
              <li>
                <Link to="/cart" style={{
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: '500',
                  position: 'relative',
                  padding: '0.5rem',
                  transition: 'opacity 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.opacity = '0.8'}
                onMouseOut={(e) => e.target.style.opacity = '1'}>
                  🛒
                  {getCartItemsCount() > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-5px',
                      background: '#ff4757',
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      {getCartItemsCount()}
                    </span>
                  )}
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;