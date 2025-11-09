const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  // ✅ CHANGED: Use 'phone' instead of 'mobile' to match frontend
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  whatsapp: {
    type: String,
    default: '',
    trim: true
  },
  // ✅ CHANGED: Make address an object to match frontend
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    country: { type: String, default: 'India' }
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say', ''],
    default: ''
  },
  role: {
    type: String,
    enum: ['customer', 'supplier', 'admin'],
    default: 'customer'
  },
  // Supplier specific field
  logisticsName: {
    type: String,
    default: ''
  },
  // Add supplier ratings field
  supplierRatings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
    reviews: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: { type: Number, required: true, min: 1, max: 5 },
      comment: { type: String, default: '' },
      createdAt: { type: Date, default: Date.now }
    }]
  }
}, {
  timestamps: true
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Password comparison method
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Update profile method
userSchema.methods.updateProfile = function(updateData) {
  const allowedUpdates = ['name', 'whatsapp', 'address', 'dateOfBirth', 'gender'];
  allowedUpdates.forEach(field => {
    if (updateData[field] !== undefined) {
      this[field] = updateData[field];
    }
  });
  return this.save();
};

module.exports = mongoose.model('User', userSchema);