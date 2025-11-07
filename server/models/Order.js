const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return 'HC' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    }
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: Number,
    price: Number,
    size: String,
    color: String,
    supplierEarnings: {
      type: Number,
      default: 0
    },
    itemStatus: {
      type: String,
      enum: ['ordered', 'shipped', 'delivered', 'return_requested', 'exchange_requested', 'return_approved', 'exchange_approved', 'return_rejected', 'exchange_rejected', 'returned', 'exchanged'],
      default: 'ordered'
    },
    returnReason: String,
    exchangeReason: String,
    returnNotes: String,
    exchangeNotes: String,
    returnRequestDate: Date,
    exchangeRequestDate: Date
  }],

  // totalSupplierEarnings: {
  //   type: Number,
  //   default: 0
  // },

  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned', 'partially_returned'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'],
    default: 'completed'
  },
  expectedDelivery: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  assignedSupplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tracking: [{
    status: String,
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Return/Exchange requests
  returnRequests: [{
    items: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      quantity: Number,
      reason: String,
      type: {
        type: String,
        enum: ['return', 'exchange']
      },
      exchangeSize: String,
      exchangeColor: String,
      status: {
        type: String,
        enum: ['requested', 'approved', 'rejected', 'completed'],
        default: 'requested'
      },
      requestedAt: {
        type: Date,
        default: Date.now
      },
      resolvedAt: Date,
      adminNotes: String
    }]
  }]
}, {
  timestamps: true
});

// Ensure orderNumber is always set
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    this.orderNumber = 'HC' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  if (!this.expectedDelivery) {
    this.expectedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);