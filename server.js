// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const path = require('path');

// dotenv.config();

// const app = express();

// // CORS Configuration
// const corsOptions = {
//   origin: [
//     'http://localhost:3000',
//     'https://happy-cart-phi.vercel.app',
//     'https://happycart-sigma.vercel.app',
//     'https://ecommerce-backend-9aps.onrender.com'
//   ],
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   credentials: true,
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
// };

// app.use(cors(corsOptions));
// app.use(express.json());

// // Serve uploaded images statically
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // MongoDB Connection with detailed logging
// const connectDB = async () => {
//   try {
//     console.log('🔗 Attempting MongoDB connection...');
//     console.log('📝 MONGODB_URI exists:', !!process.env.MONGODB_URI);
    
//     if (!process.env.MONGODB_URI) {
//       throw new Error('MONGODB_URI environment variable is missing');
//     }
    
//     // Log first few characters of URI (for security, don't log full URI)
//     const uriPreview = process.env.MONGODB_URI.substring(0, 50) + '...';
//     console.log('📋 URI Preview:', uriPreview);
    
//     const conn = await mongoose.connect(process.env.MONGODB_URI, {
//       serverSelectionTimeoutMS: 30000, // 30 seconds timeout
//       socketTimeoutMS: 45000, // 45 seconds socket timeout
//     });
    
//     console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
//     console.log(`📊 Database: ${conn.connection.name}`);
    
//     return conn;
//   } catch (error) {
//     console.error('❌ MongoDB connection error:', error.message);
//     console.error('💡 Error details:', error);
//     console.error('🔧 Please check:');
//     console.error('   1. MONGODB_URI environment variable');
//     console.error('   2. MongoDB Atlas network access (0.0.0.0/0)');
//     console.error('   3. Database user credentials');
//     process.exit(1);
//   }
// };

// // Connect to database
// connectDB();

// // Routes
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/products', require('./routes/products'));
// app.use('/api/orders', require('./routes/orders'));
// app.use('/api/suppliers', require('./routes/suppliers'));
// app.use('/api/ratings', require('./routes/ratings'));
// app.use('/api/order-requests', require('./routes/orderRequests'));
// app.use('/api/cart', require('./routes/cart'));

// // Health check route
// app.get('/api/health', async (req, res) => {
//   const dbStatus = mongoose.connection.readyState;
//   let dbMessage = 'Unknown';
  
//   switch(dbStatus) {
//     case 0: dbMessage = 'Disconnected'; break;
//     case 1: dbMessage = 'Connected'; break;
//     case 2: dbMessage = 'Connecting'; break;
//     case 3: dbMessage = 'Disconnecting'; break;
//   }
  
//   // Test database connection
//   let dbTest = 'Not tested';
//   if (dbStatus === 1) {
//     try {
//       await mongoose.connection.db.admin().ping();
//       dbTest = 'Working';
//     } catch (error) {
//       dbTest = 'Failed: ' + error.message;
//     }
//   }
  
//   res.json({ 
//     message: 'Happy Cart API is running!',
//     timestamp: new Date().toISOString(),
//     database: {
//       status: dbMessage,
//       readyState: dbStatus,
//       test: dbTest
//     },
//     environment: process.env.NODE_ENV || 'development'
//   });
// });

// // Simple test route without database
// app.post('/api/auth/simple-login', (req, res) => {
//   console.log('🔐 Simple login called:', req.body);
  
//   const { email, password } = req.body;
  
//   if (email && password) {
//     res.json({
//       success: true,
//       message: 'Simple login API is working!',
//       user: {
//         id: 'simple_test_user',
//         name: 'Test User',
//         email: email,
//         role: 'customer'
//       },
//       token: 'simple_test_token_' + Date.now()
//     });
//   } else {
//     res.status(400).json({
//       success: false,
//       message: 'Email and password required'
//     });
//   }
// });

// const PORT = process.env.PORT || 10000;

// app.listen(PORT, () => {
//   console.log(`🚀 Server is running on port ${PORT}`);
//   console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
//   console.log(`🔗 Health check: https://ecommerce-backend-9aps.onrender.com/api/health`);
// });

// // Handle unhandled promise rejections
// process.on('unhandledRejection', (err) => {
//   console.log('❌ UNHANDLED REJECTION! Shutting down...');
//   console.log(err.name, err.message);
//   process.exit(1);
// });


const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Basic CORS
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'API is running!',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Simple test login (no database)
app.post('/api/auth/login', (req, res) => {
  console.log('Login attempt:', req.body);
  
  const { email, password } = req.body;
  
  // Simple hardcoded test
  if (email === 'pandurusatishkumar04@gmail.com' && password === '7013888595') {
    res.json({
      success: true,
      message: 'Login successful!',
      token: 'test_jwt_token_' + Date.now(),
      user: {
        id: 'user_1',
        name: 'SATISH KUMAR PANDURU',
        email: email,
        role: 'customer'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Simple test register (no database)
app.post('/api/auth/register', (req, res) => {
  console.log('Register attempt:', req.body);
  
  const { name, email, phone, password } = req.body;
  
  if (name && email && phone && password) {
    res.json({
      success: true,
      message: 'Registration successful!',
      token: 'test_jwt_token_' + Date.now(),
      user: {
        id: 'user_' + Date.now(),
        name: name,
        email: email,
        phone: phone,
        role: 'customer'
      }
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }
});

// Handle all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

// Simple error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});