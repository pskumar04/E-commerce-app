const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
};

exports.registerCustomer = async (req, res) => {
  try {
    console.log('=== REGISTER CUSTOMER START ===');
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { name, email, phone, whatsapp, address, password } = req.body;

    console.log('📱 Phone from request:', phone);
    console.log('📱 Type of phone:', typeof phone);

    // ✅ Check if phone exists and is valid
    if (!phone || phone.trim() === '') {
      console.log('❌ PHONE IS EMPTY OR UNDEFINED');
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email or phone already exists' 
      });
    }

    // ✅ Create user object with explicit field assignment
    const userData = {
      name: name,
      email: email,
      phone: String(phone).trim(), // Convert to string and trim
      whatsapp: whatsapp || String(phone).trim(),
      password: password,
      role: 'customer'
    };

    // Add address
    if (address && typeof address === 'object') {
      userData.address = address;
    } else {
      userData.address = {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'India'
      };
    }

    console.log('📝 User data being saved:', userData);
    console.log('📝 Phone in userData:', userData.phone);
    console.log('📝 Type of phone in userData:', typeof userData.phone);

    // ✅ Create user instance
    const user = new User(userData);

    // ✅ Manual validation with detailed logging
    console.log('🔍 Validating user before save...');
    try {
      await user.validate();
      console.log('✅ User validation passed');
    } catch (validationError) {
      console.log('❌ User validation failed:');
      console.log('   Validation errors:', validationError.errors);
      console.log('   User object at time of validation:', {
        name: user.name,
        email: user.email,
        phone: user.phone,
        hasPhone: !!user.phone
      });
      
      const errorMessages = Object.values(validationError.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      });
    }

    // ✅ Save user
    console.log('💾 Saving user to database...');
    await user.save();
    console.log('✅ User saved successfully');

    const token = generateToken(user._id);
    
    res.json({
      success: true,
      message: 'Customer registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address
      }
    });

  } catch (error) {
    console.error('💥 Registration error:', error);
    
    if (error.name === 'ValidationError') {
      console.log('🔍 Detailed validation errors:');
      Object.keys(error.errors).forEach(key => {
        console.log(`   ${key}:`, error.errors[key]);
      });
      
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration',
      error: error.message 
    });
  }
};

// Keep your other functions as they are
exports.registerSupplier = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, whatsapp, address, logisticsName, password } = req.body;

    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or phone already exists' 
      });
    }

    const user = new User({
      name,
      email,
      phone,
      whatsapp: whatsapp || phone,
      address,
      password,
      role: 'supplier',
      logisticsName
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Supplier registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        logisticsName: user.logisticsName
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.correctPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        logisticsName: user.logisticsName
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, whatsapp, address } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, whatsapp, address },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};