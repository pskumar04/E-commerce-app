const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

const router = express.Router();

// Create new order
// Create new order
// Create order route
// Create order route
router.post('/', auth, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    
    console.log('Creating order with data:', {
      itemsCount: items?.length,
      shippingAddress: !!shippingAddress,
      paymentMethod
    });

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain items' });
    }

    if (!shippingAddress) {
      return res.status(400).json({ message: 'Shipping address is required' });
    }

    let totalAmount = 0;
    const orderItems = [];

    // Process each item and verify products
    for (let item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(400).json({ message: `Product ${item.product} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: item.product,
        quantity: item.quantity,
        price: product.price,
        size: item.size || null,
        color: item.color || null
      });
    }

    // Add tax and shipping
    const tax = totalAmount * 0.18;
    const shipping = 0; // Free shipping
    const finalTotal = totalAmount + tax + shipping;

    // Create order
    const order = new Order({
      customer: req.user.id,
      items: orderItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'card',
      totalAmount: finalTotal,
      orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      tracking: [
        {
          status: 'pending',
          description: 'Order has been placed and is awaiting confirmation',
          timestamp: new Date()
        }
      ]
    });

    await order.save();
    
    // Update product stock
    for (let item of items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Clear user's cart if it exists
    try {
      await Cart.findOneAndUpdate(
        { user: req.user.id },
        { items: [] }
      );
    } catch (cartError) {
      console.log('Cart clearing optional - user might not have cart:', cartError.message);
    }

    console.log('Order created successfully:', order._id);
    
    // Populate the order with product details before sending response
    const populatedOrder = await Order.findById(order._id)
      .populate('items.product')
      .populate('customer', 'name email');

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      message: 'Server error creating order',
      error: error.message 
    });
  }
});

// Get supplier orders
router.get('/supplier-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customer', 'name email mobile')
      .populate('items.product');
    
    // Filter orders that contain products from this supplier
    const supplierOrders = orders.filter(order => 
      order.items.some(item => 
        item.product && item.product.supplier && 
        item.product.supplier.toString() === req.user.id
      )
    );

    res.json(supplierOrders);
  } catch (error) {
    console.error('Error fetching supplier orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get supplier earnings summary
router.get('/supplier/earnings-summary', auth, async (req, res) => {
  try {
    // Simple implementation - you can enhance this later
    const orders = await Order.find().populate('items.product');
    
    const supplierOrders = orders.filter(order => 
      order.items.some(item => 
        item.product && item.product.supplier && 
        item.product.supplier.toString() === req.user.id
      )
    );

    let totalEarnings = 0;
    let availableEarnings = 0;
    let pendingEarnings = 0;

    supplierOrders.forEach(order => {
      const orderEarnings = order.items
        .filter(item => 
          item.product && item.product.supplier && 
          item.product.supplier.toString() === req.user.id
        )
        .reduce((sum, item) => {
          const earnings = (item.product.price - (item.product.supplierCost || 0)) * item.quantity;
          return sum + earnings;
        }, 0);

      totalEarnings += orderEarnings;

      if (order.status === 'delivered') {
        availableEarnings += orderEarnings;
      } else {
        pendingEarnings += orderEarnings;
      }
    });

    res.json({
      totalEarnings,
      availableEarnings,
      pendingEarnings,
      totalOrders: supplierOrders.length
    });
  } catch (error) {
    console.error('Error fetching earnings summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get supplier earnings summary
router.get('/supplier/earnings', auth, async (req, res) => {
  try {
    // Get all orders that contain products from this supplier
    const earningsData = await Order.aggregate([
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $match: {
          'productInfo.supplier': req.user.id
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$items.supplierEarnings' },
          totalOrders: { $sum: 1 },
          pendingEarnings: {
            $sum: {
              $cond: [
                { $in: ['$status', ['pending', 'confirmed', 'packed', 'shipped']] },
                '$items.supplierEarnings',
                0
              ]
            }
          },
          availableEarnings: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'delivered'] },
                '$items.supplierEarnings',
                0
              ]
            }
          }
        }
      }
    ]);

    // Get monthly earnings
    const monthlyEarnings = await Order.aggregate([
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $match: {
          'productInfo.supplier': req.user.id,
          'status': 'delivered'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          earnings: { $sum: '$items.supplierEarnings' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 }
    ]);

    const result = {
      summary: earningsData[0] || {
        totalEarnings: 0,
        totalOrders: 0,
        pendingEarnings: 0,
        availableEarnings: 0
      },
      monthlyEarnings
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching supplier earnings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// In your orders routes (routes/orders.js)
router.get('/supplier/earnings-summary', auth, async (req, res) => {
  try {
    const supplierId = req.user.id;
    
    // Get all orders with this supplier's products
    const orders = await Order.find()
      .populate('items.product')
      .exec();

    // Filter orders that contain this supplier's products
    const supplierOrders = orders.filter(order => 
      order.items.some(item => 
        item.product && item.product.supplier && 
        item.product.supplier.toString() === supplierId
      )
    );

    let totalEarnings = 0;
    let availableEarnings = 0;
    let pendingEarnings = 0;
    let totalOrders = supplierOrders.length;

    supplierOrders.forEach(order => {
      const orderEarnings = order.items
        .filter(item => 
          item.product && item.product.supplier && 
          item.product.supplier.toString() === supplierId
        )
        .reduce((sum, item) => sum + (item.supplierEarnings || 0), 0);

      totalEarnings += orderEarnings;

      if (order.status === 'delivered') {
        availableEarnings += orderEarnings;
      } else {
        pendingEarnings += orderEarnings;
      }
    });

    res.json({
      totalEarnings,
      availableEarnings,
      pendingEarnings,
      totalOrders
    });
  } catch (error) {
    console.error('Error fetching earnings summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get return/exchange requests for supplier
router.get('/supplier/return-requests', auth, async (req, res) => {
  try {
    // Find all orders where supplier's products have return/exchange requests
    const returnRequests = await Order.aggregate([
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $match: {
          'productInfo.supplier': req.user.id,
          'items.itemStatus': {
            $in: ['return_requested', 'exchange_requested']
          }
        }
      },
      {
        $project: {
          orderNumber: 1,
          createdAt: 1,
          customer: 1,
          'items._id': 1,
          'items.quantity': 1,
          'items.size': 1,
          'items.color': 1,
          'items.itemStatus': 1,
          'items.returnReason': 1,
          'items.exchangeReason': 1,
          'items.returnNotes': 1,
          'items.exchangeNotes': 1,
          'items.returnRequestDate': 1,
          'items.exchangeRequestDate': 1,
          'productInfo.name': 1,
          'productInfo.images': 1,
          'productInfo.price': 1
        }
      }
    ]);

    res.json(returnRequests);
  } catch (error) {
    console.error('Error fetching return requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get customer orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user.id })
      .populate('items.product')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${orders.length} orders for user ${req.user.id}`);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get supplier orders
router.get('/supplier-orders', auth, async (req, res) => {
  try {
    if (req.user.role !== 'supplier') {
      return res.status(403).json({ message: 'Only suppliers can access these orders' });
    }

    // Get supplier's product IDs
    const supplierProducts = await Product.find({ supplier: req.user.id }).select('_id');
    const productIds = supplierProducts.map(p => p._id);

    const orders = await Order.find({
      'items.product': { $in: productIds }
    })
      .populate('customer', 'name email phone')
      .populate('items.product', 'name images price supplier')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



// In your orders routes (backend)

// Update item status (for returns/exchanges)
router.put('/:orderId/items/:itemId', auth, async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const updateData = req.body;

    const order = await Order.findOneAndUpdate(
      { _id: orderId, 'items._id': itemId },
      { $set: updateData },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order or item not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel order
router.put('/:orderId/status', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, cancelReason } = req.body;

    const order = await Order.findByIdAndUpdate(
      orderId,
      { 
        status,
        cancelReason,
        cancelledAt: status === 'cancelled' ? new Date() : undefined
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status
// Update order status with validation
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Validate status progression
    const statusFlow = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];
    const currentIndex = statusFlow.indexOf(order.status);
    const newIndex = statusFlow.indexOf(status);

    // Cannot go backwards
    if (newIndex < currentIndex) {
      return res.status(400).json({ 
        message: `Cannot change status from ${order.status} to ${status}. Order progression must be sequential.` 
      });
    }

    // Must move step by step (unless it's the supplier's own order)
    if (newIndex > currentIndex + 1 && req.user.role === 'supplier') {
      const nextStatus = statusFlow[currentIndex + 1];
      return res.status(400).json({ 
        message: `Please mark the order as ${nextStatus} first before moving to ${status}.` 
      });
    }

    // Cannot change delivered orders
    if (order.status === 'delivered') {
      return res.status(400).json({ 
        message: 'This order has been delivered and cannot be modified.' 
      });
    }

    // Add to tracking
    order.tracking.push({
      status,
      description: getStatusDescription(status),
      timestamp: new Date()
    });

    order.status = status;
    
    // If order is delivered, update delivery timestamp
    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }

    await order.save();
    await order.populate('customer', 'name email phone');
    await order.populate('items.product', 'name images price');

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update return/exchange status
router.put('/update-item-status/:orderId/:itemId', auth, async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { status, adminNotes } = req.body;

    const order = await Order.findOne({ _id: orderId, 'items._id': itemId });
    
    if (!order) {
      return res.status(404).json({ message: 'Order item not found' });
    }

    // Update the specific item status
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId, 'items._id': itemId },
      {
        $set: {
          'items.$.itemStatus': status,
          'items.$.adminNotes': adminNotes,
          'items.$.statusUpdateDate': new Date()
        }
      },
      { new: true }
    );

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating item status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to get status description
function getStatusDescription(status) {
  const descriptions = {
    pending: 'Order has been placed',
    confirmed: 'Order has been confirmed',
    packed: 'Items have been packed',
    shipped: 'Order has been shipped',
    delivered: 'Order has been delivered'
  };
  return descriptions[status] || 'Status updated';
}

module.exports = router;