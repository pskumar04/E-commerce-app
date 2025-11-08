const mongoose = require('mongoose');

// const mongoose = require('mongoose');

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
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true
  },
  alternateMobile: {
    type: String,
    default: '',
    trim: true
  },
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
  }
}, {
  timestamps: true
});

// Add this method to update user profile
userSchema.methods.updateProfile = function(updateData) {
  const allowedUpdates = ['name', 'alternateMobile', 'address', 'dateOfBirth', 'gender'];
  allowedUpdates.forEach(field => {
    if (updateData[field] !== undefined) {
      this[field] = updateData[field];
    }
  });
  return this.save();
};

module.exports = mongoose.model('User', userSchema);