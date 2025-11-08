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

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="logo">
          <span className="logo-icon">🛒</span>
          Happy Cart
        </Link>
        
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/products?bestseller=true">Best Sellers</Link></li>
          <li><Link to="/products">Explore</Link></li>
          
          {user ? (
            <>
              {/* <li>Hello, {user.name}</li> */}
              <Link 
                to="/profile" 
                style={{
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: '600',
                  padding: '0.5rem 1rem',
                  borderRadius: '5px',
                  transition: 'background 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                onMouseOut={(e) => e.target.style.background = 'transparent'}
              >
                Hello {user?.name}
              </Link>
              {user.role === 'supplier' && (
                <li><Link to="/supplier-dashboard">Dashboard</Link></li>
              )}
              {user.role === 'customer' && (
                <li><Link to="/my-orders">My Orders</Link></li>
              )}
              <li>
                <Link to="/cart" className="cart-icon">
                  🛒
                  {getCartItemsCount() > 0 && (
                    <span className="cart-count">{getCartItemsCount()}</span>
                  )}
                </Link>
              </li>
              <li>
                <button 
                  onClick={handleLogout}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login">Sign In</Link></li>
              <li><Link to="/register">Sign Up</Link></li>
              <li>
                <Link to="/cart" className="cart-icon">
                  🛒
                  {getCartItemsCount() > 0 && (
                    <span className="cart-count">{getCartItemsCount()}</span>
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