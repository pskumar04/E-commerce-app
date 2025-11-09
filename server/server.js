const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://happy-cart-phi.vercel.app',
    'https://happycart-sigma.vercel.app',
    'https://ecommerce-backend-9aps.onrender.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection - SIMPLIFIED
const connectDB = async () => {
  try {
    console.log('🔗 Attempting MongoDB connection...');
    console.log('📝 MONGODB_URI:', process.env.MONGODB_URI ? 'Exists' : 'Missing');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('💡 Please check your MONGODB_URI in environment variables');
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Temporary test route
app.post('/api/auth/test-login', (req, res) => {
  console.log('🔐 Test login called:', req.body);
  
  if (req.body.email === 'pandurusatishkumar04@gmail.com' && req.body.password === 'test123') {
    res.json({
      success: true,
      message: 'Test login successful!',
      token: 'test_jwt_token_' + Date.now(),
      user: {
        id: 'test_user_1',
        name: 'Test User',
        email: req.body.email,
        role: 'customer'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid test credentials'
    });
  }
});

// Actual routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/order-requests', require('./routes/orderRequests'));
app.use('/api/cart', require('./routes/cart'));

// Health check route
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  let dbMessage = 'Unknown';
  
  switch(dbStatus) {
    case 0: dbMessage = 'Disconnected'; break;
    case 1: dbMessage = 'Connected'; break;
    case 2: dbMessage = 'Connecting'; break;
    case 3: dbMessage = 'Disconnecting'; break;
  }
  
  res.json({ 
    message: 'Happy Cart API is running!',
    timestamp: new Date().toISOString(),
    database: {
      status: dbMessage,
      readyState: dbStatus
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('❌ UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});