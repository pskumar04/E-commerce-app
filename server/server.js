const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cartRoutes = require('./routes/cart');

dotenv.config();

const app = express();

// ✅ FIXED CORS CONFIGURATION (ONLY ONCE)
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://happy-cart-phi.vercel.app',  // Add your current Vercel domain
    'https://happycart-sigma.vercel.app',
    'https://ecommerce-backend-9aps.onrender.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// ✅ USE CORS ONLY ONCE
app.use(cors(corsOptions));
app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ TEMPORARY TEST ROUTES - PUT THESE BEFORE OTHER ROUTES
app.post('/api/auth/login', (req, res) => {
  console.log('✅ Login API called with:', req.body);
  
  res.json({
    success: true,
    message: 'Login successful!',
    token: 'test_jwt_token_12345',
    user: {
      id: '1',
      name: 'Test User',
      email: req.body.email,
      role: 'customer'
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  console.log('✅ Register API called with:', req.body);
  
  res.json({
    success: true,
    message: 'Registration successful!',
    token: 'test_jwt_token_12345',
    user: {
      id: '2',
      name: req.body.name,
      email: req.body.email,
      role: req.body.role || 'customer'
    }
  });
});

// ✅ COMMENT OUT THE AUTH ROUTES TEMPORARILY
// app.use('/api/auth', require('./routes/auth'));

// Other routes
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/order-requests', require('./routes/orderRequests'));
app.use('/api/cart', cartRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Happy Cart API is running!',
    timestamp: new Date().toISOString()
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/happycart', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});