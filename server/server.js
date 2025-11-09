const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const UserSimple = require('./models/UserSimple'); // Add this import

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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ ADD THIS DEBUG ROUTE - SIMPLE TEST
app.post('/api/debug-test', (req, res) => {
  console.log('🔍 DEBUG: Request received');
  console.log('🔍 DEBUG: Request body:', req.body);
  console.log('🔍 DEBUG: Phone field:', req.body?.phone);
  console.log('🔍 DEBUG: All fields:', Object.keys(req.body || {}));
  
  res.json({
    success: true,
    message: 'Debug route working!',
    receivedData: req.body,
    phoneValue: req.body?.phone,
    allFields: Object.keys(req.body || {})
  });
});

app.post('/api/auth/simple-register', async (req, res) => {
  try {
    console.log('=== SIMPLE REGISTER TEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Phone field:', req.body.phone);
    
    const { name, email, phone, password } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone is required in simple test'
      });
    }
    
    // Create user with simple model
    const user = new UserSimple({
      name,
      email, 
      phone,
      password
    });
    
    console.log('UserSimple object:', {
      name: user.name,
      email: user.email,
      phone: user.phone,
      hasPhone: !!user.phone
    });
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Simple registration successful!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
    
  } catch (error) {
    console.error('Simple register error:', error);
    res.status(500).json({
      success: false,
      message: 'Simple registration failed',
      error: error.message
    });
  }
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Your existing routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/order-requests', require('./routes/orderRequests'));
app.use('/api/cart', require('./routes/cart'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Happy Cart API is running!',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});