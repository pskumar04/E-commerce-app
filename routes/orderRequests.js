const express = require('express');
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const Product = require('../models/Product');

const router = express.Router();

// Cancel entire order
router.post('/:orderId/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to the user
    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    // Check if order can be cancelled (only pending or confirmed orders)
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ 
        message: 'Order cannot be cancelled once it has been packed or shipped' 
      });
    }

    // Update order status
    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.cancelledAt = new Date();

    // Add to tracking
    order.tracking.push({
      status: 'cancelled',
      description: `Order cancelled by customer. Reason: ${reason}`,
      timestamp: new Date()
    });

    // Restore product stock
    for (let item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } }
      );
    }

    await order.save();

    res.json({ 
      message: 'Order cancelled successfully',
      order 
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Request return for items
router.post('/:orderId/return', auth, async (req, res) => {
  try {
    const { items, reason } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to the user
    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this order' });
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({ 
        message: 'Return can only be requested for delivered orders' 
      });
    }

    // Check if return is within timeframe (7 days of delivery)
    const deliveryDate = order.deliveredAt || order.updatedAt;
    const daysSinceDelivery = (new Date() - deliveryDate) / (1000 * 60 * 60 * 24);
    
    if (daysSinceDelivery > 7) {
      return res.status(400).json({ 
        message: 'Return must be requested within 7 days of delivery' 
      });
    }

    // Create return request
    const returnRequest = {
      items: items.map(item => ({
        product: item.productId,
        quantity: item.quantity,
        reason: reason,
        type: 'return',
        status: 'requested'
      }))
    };

    order.returnRequests.push(returnRequest);

    // Update item statuses
    items.forEach(requestItem => {
      const orderItem = order.items.find(item => 
        item.product.toString() === requestItem.productId
      );
      if (orderItem) {
        orderItem.itemStatus = 'return_requested';
        orderItem.returnReason = reason;
      }
    });

    // Add to tracking
    order.tracking.push({
      status: 'return_requested',
      description: `Return requested for ${items.length} item(s). Reason: ${reason}`,
      timestamp: new Date()
    });

    await order.save();

    res.json({ 
      message: 'Return request submitted successfully',
      order 
    });
  } catch (error) {
    console.error('Error requesting return:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Request exchange for items
router.post('/:orderId/exchange', auth, async (req, res) => {
  try {
    const { items, reason } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to the user
    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this order' });
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({ 
        message: 'Exchange can only be requested for delivered orders' 
      });
    }

    // Check if exchange is within timeframe (7 days of delivery)
    const deliveryDate = order.deliveredAt || order.updatedAt;
    const daysSinceDelivery = (new Date() - deliveryDate) / (1000 * 60 * 60 * 24);
    
    if (daysSinceDelivery > 7) {
      return res.status(400).json({ 
        message: 'Exchange must be requested within 7 days of delivery' 
      });
    }

    // Create exchange request
    const exchangeRequest = {
      items: items.map(item => ({
        product: item.productId,
        quantity: item.quantity,
        reason: reason,
        type: 'exchange',
        exchangeSize: item.exchangeSize,
        exchangeColor: item.exchangeColor,
        status: 'requested'
      }))
    };

    order.returnRequests.push(exchangeRequest);

    // Update item statuses
    items.forEach(requestItem => {
      const orderItem = order.items.find(item => 
        item.product.toString() === requestItem.productId
      );
      if (orderItem) {
        orderItem.itemStatus = 'exchange_requested';
        orderItem.exchangeReason = reason;
        orderItem.exchangeSize = requestItem.exchangeSize;
        orderItem.exchangeColor = requestItem.exchangeColor;
      }
    });

    // Add to tracking
    order.tracking.push({
      status: 'exchange_requested',
      description: `Exchange requested for ${items.length} item(s). Reason: ${reason}`,
      timestamp: new Date()
    });

    await order.save();

    res.json({ 
      message: 'Exchange request submitted successfully',
      order 
    });
  } catch (error) {
    console.error('Error requesting exchange:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get order requests for supplier
router.get('/supplier-requests', auth, async (req, res) => {
  try {
    if (req.user.role !== 'supplier') {
      return res.status(403).json({ message: 'Only suppliers can access these requests' });
    }

    // Get supplier's product IDs
    const supplierProducts = await Product.find({ supplier: req.user.id }).select('_id');
    const productIds = supplierProducts.map(p => p._id);

    const orders = await Order.find({
      'items.product': { $in: productIds },
      $or: [
        { 'items.itemStatus': { $in: ['return_requested', 'exchange_requested'] } },
        { 'returnRequests': { $exists: true, $ne: [] } }
      ]
    })
      .populate('customer', 'name email phone')
      .populate('items.product', 'name images price')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching order requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;