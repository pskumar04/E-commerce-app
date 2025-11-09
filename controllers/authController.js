const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
};

// Unified response structure
const sendAuthResponse = (res, message, user, token) => {
  res.json({
    success: true, // ✅ ADD: success field
    message,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone, // ✅ CHANGED: from mobile to phone
      role: user.role,
      address: user.address,
      logisticsName: user.logisticsName || null
    }
  });
};

exports.registerCustomer = async (req, res) => {
  try {
    console.log('🔐 Register customer attempt:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { name, email, phone, whatsapp, address, password } = req.body;

    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email or phone already exists' 
      });
    }

    // ✅ Convert address object to string if needed, or keep as object
    const userAddress = typeof address === 'object' 
      ? `${address.street}, ${address.city}, ${address.state} - ${address.zipCode}, ${address.country}`
      : address;

    const user = new User({
      name,
      email,
      phone, // ✅ Now matches User model
      whatsapp: whatsapp || phone,
      address: userAddress, // ✅ Handle both object and string
      password,
      role: 'customer'
    });

    await user.save();
    console.log('✅ Customer registered successfully:', user.email);

    const token = generateToken(user._id);
    sendAuthResponse(res, 'Customer registered successfully', user, token);

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration',
      error: error.message 
    });
  }
};

exports.registerSupplier = async (req, res) => {
  try {
    console.log('🔐 Register supplier attempt:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { name, email, phone, whatsapp, address, logisticsName, password } = req.body;

    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email or phone already exists' 
      });
    }

    // ✅ Convert address object to string if needed
    const userAddress = typeof address === 'object' 
      ? `${address.street}, ${address.city}, ${address.state} - ${address.zipCode}, ${address.country}`
      : address;

    const user = new User({
      name,
      email,
      phone, // ✅ Now matches User model
      whatsapp: whatsapp || phone,
      address: userAddress, // ✅ Handle both object and string
      password,
      role: 'supplier',
      logisticsName
    });

    await user.save();
    console.log('✅ Supplier registered successfully:', user.email);

    const token = generateToken(user._id);
    sendAuthResponse(res, 'Supplier registered successfully', user, token);

  } catch (error) {
    console.error('❌ Supplier registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during supplier registration',
      error: error.message 
    });
  }
};

exports.login = async (req, res) => {
  try {
    console.log('🔐 Login attempt received:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, // ✅ ADD: success field
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    console.log('👤 User found:', user ? user.email : 'No user found');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, // ✅ ADD: success field
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isPasswordValid = await user.correctPassword(password, user.password);
    console.log('🔑 Password validation:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, // ✅ ADD: success field
        message: 'Invalid email or password' 
      });
    }

    // Generate token
    const token = generateToken(user._id);
    console.log('✅ Login successful for:', user.email);

    sendAuthResponse(res, 'Login successful', user, token);

  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({ 
      success: false, // ✅ ADD: success field
      message: 'Server error during login',
      error: error.message 
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false, // ✅ ADD: success field
        message: 'User not found'
      });
    }
    res.json({
      success: true, // ✅ ADD: success field
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, // ✅ ADD: success field
      message: 'Server error',
      error: error.message 
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, whatsapp, address } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name, phone, whatsapp, address },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false, // ✅ ADD: success field
        message: 'User not found'
      });
    }

    res.json({
      success: true, // ✅ ADD: success field
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, // ✅ ADD: success field
      message: 'Server error',
      error: error.message 
    });
  }
};