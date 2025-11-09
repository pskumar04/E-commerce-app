// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    console.log('🔐 Auth middleware checking token...');
    
    // Get token from header
    const authHeader = req.header('Authorization');
    console.log('Auth header:', authHeader);
    
    if (!authHeader) {
      console.log('❌ No authorization header');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Check if it's a Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      console.log('❌ Invalid token format - not Bearer token');
      return res.status(401).json({ message: 'Invalid token format' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token length:', token.length);
    
    if (!token || token === 'null' || token === 'undefined' || token.length < 10) {
      console.log('❌ Token is empty or invalid');
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('✅ Token decoded successfully, user ID:', decoded.id);
    
    // Find user
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      console.log('❌ User not found for token');
      return res.status(401).json({ message: 'Token is not valid - user not found' });
    }

    console.log('✅ User found:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.error('🔐 Auth middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      if (error.message === 'jwt malformed') {
        console.log('❌ JWT malformed - token structure is invalid');
        return res.status(401).json({ message: 'Invalid token format. Please login again.' });
      } else if (error.message === 'invalid signature') {
        console.log('❌ JWT invalid signature - secret mismatch');
        return res.status(401).json({ message: 'Token validation failed. Please login again.' });
      }
    } else if (error.name === 'TokenExpiredError') {
      console.log('❌ JWT expired');
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    
    res.status(401).json({ 
      message: 'Token is not valid',
      error: error.message 
    });
  }
};

module.exports = auth;