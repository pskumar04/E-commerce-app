import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Happy Cart</h3>
          <p>Your one-stop destination for fashionable clothing for men, women, and children.</p>
        </div>
        
        <div className="footer-section">
          <h3>Quick Links</h3>
          <a href="/">Home</a>
          <a href="/products?bestseller=true">Best Sellers</a>
          <a href="/products">Explore</a>
          <a href="/about">About Us</a>
        </div>
        
        <div className="footer-section">
          <h3>Customer Service</h3>
          <a href="/contact">Contact Us</a>
          <a href="/shipping">Shipping Info</a>
          <a href="/returns">Returns</a>
          <a href="/faq">FAQ</a>
        </div>
        
        <div className="footer-section">
          <h3>Contact Info</h3>
          <p>📧 support@happycart.com</p>
          <p>📞 +1 (555) 123-4567</p>
          <p>📍 123 Fashion Street, Style City</p>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2024 Happy Cart. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;