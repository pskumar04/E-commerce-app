const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
    // min: 0
  },
  supplierCost: {
    type: Number,
    default: 0,
    required: true
  },
  originalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['men', 'women', 'children']
  },
  subcategory: {
    type: String,
    required: true
  },
  images: [{
    type: String,
    default: []
  }],
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  sizes: [{
    type: String,
    default: ['S', 'M', 'L', 'XL']
  }],
  colors: [{
    type: String,
    default: ['Black', 'White', 'Blue']
  }],
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isBestSeller: {
    type: Boolean,
    default: false
  },
  ratings: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    },
    reviews: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        default: '' // Changed from required to default empty string
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);