const Order = require('../models/Order');
const Product = require('../models/Product');

exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, totalAmount } = req.body;

    // Verify stock availability and update stock
    for (let item of items) {
      const product = await Product.findById(item.product);
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product?.name || 'product'}` 
        });
      }
      
      // Update stock
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } }
      );
    }

    const order = new Order({
      customer: req.user.id,
      items,
      shippingAddress,
      totalAmount,
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });

    await order.save();
    await order.populate('items.product', 'name images price');
    await order.populate('customer', 'name email phone');

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getCustomerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user.id })
      .populate('items.product', 'name images price')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('items.product', 'name images price supplier')
      .populate('assignedSupplier', 'name email phone');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is authorized to view this order
    if (req.user.role === 'customer' && order.customer._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getSupplierOrders = async (req, res) => {
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
      .populate('customer', 'name email phone address')
      .populate('items.product', 'name images price supplier')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.assignOrderToSupplier = async (req, res) => {
  try {
    const { supplierId } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.assignedSupplier = supplierId;
    await order.save();

    res.json({ message: 'Order assigned to supplier successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function
function getStatusDescription(status) {
  const descriptions = {
    pending: 'Order has been placed and is awaiting confirmation',
    confirmed: 'Order has been confirmed and is being processed',
    packed: 'All items have been packed and ready for shipment',
    shipped: 'Order has been shipped and is in transit',
    delivered: 'Order has been successfully delivered to customer',
    cancelled: 'Order has been cancelled'
  };
  return descriptions[status] || 'Order status updated';
}