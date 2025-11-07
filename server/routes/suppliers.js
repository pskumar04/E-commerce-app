const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get supplier dashboard statistics
router.get('/dashboard', auth, async (req, res) => {
  try {
    if (req.user.role !== 'supplier') {
      return res.status(403).json({ message: 'Only suppliers can access dashboard' });
    }

    // Get supplier's products
    const products = await Product.find({ supplier: req.user.id });
    
    // Get supplier's orders
    const productIds = products.map(p => p._id);
    const orders = await Order.find({
      'items.product': { $in: productIds }
    });

    // Calculate statistics
    const totalProducts = products.length;
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const totalRevenue = orders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    // Get low stock products (stock < 10)
    const lowStockProducts = products.filter(product => product.stock < 10);

    // Recent orders (last 5)
    const recentOrders = await Order.find({
      'items.product': { $in: productIds }
    })
      .populate('customer', 'name email')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      statistics: {
        totalProducts,
        totalOrders,
        pendingOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        lowStockCount: lowStockProducts.length
      },
      lowStockProducts: lowStockProducts.map(p => ({
        id: p._id,
        name: p.name,
        stock: p.stock
      })),
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all suppliers (for admin purposes)
router.get('/', auth, async (req, res) => {
  try {
    // In a real app, you might want to check if user is admin
    const suppliers = await User.find({ role: 'supplier' })
      .select('name email phone logisticsName address createdAt')
      .sort({ createdAt: -1 });

    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get supplier profile
router.get('/profile', auth, async (req, res) => {
  try {
    if (req.user.role !== 'supplier') {
      return res.status(403).json({ message: 'Only suppliers can access this profile' });
    }

    const supplier = await User.findById(req.user.id)
      .select('-password');

    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update supplier profile
router.put('/profile', auth, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('whatsapp').optional().isMobilePhone().withMessage('Valid WhatsApp number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.role !== 'supplier') {
      return res.status(403).json({ message: 'Only suppliers can update this profile' });
    }

    const { name, phone, whatsapp, address, logisticsName } = req.body;

    const updatedSupplier = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, whatsapp, address, logisticsName },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      supplier: updatedSupplier
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get supplier's products with advanced filtering
router.get('/products', auth, async (req, res) => {
  try {
    if (req.user.role !== 'supplier') {
      return res.status(403).json({ message: 'Only suppliers can access their products' });
    }

    const { category, lowStock, bestseller, page = 1, limit = 10 } = req.query;
    
    let filter = { supplier: req.user.id };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (lowStock === 'true') {
      filter.stock = { $lt: 10 };
    }
    
    if (bestseller === 'true') {
      filter.isBestSeller = true;
    }

    const products = await Product.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get supplier's order statistics
router.get('/orders/statistics', auth, async (req, res) => {
  try {
    if (req.user.role !== 'supplier') {
      return res.status(403).json({ message: 'Only suppliers can access order statistics' });
    }

    const productIds = await Product.find({ supplier: req.user.id }).select('_id');
    const productIdsArray = productIds.map(p => p._id);

    const orders = await Order.find({
      'items.product': { $in: productIdsArray }
    });

    const statusCounts = {
      pending: 0,
      confirmed: 0,
      packed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };

    let monthlyRevenue = Array(12).fill(0);
    let totalRevenue = 0;

    orders.forEach(order => {
      // Count by status
      statusCounts[order.status]++;

      // Calculate revenue (only for delivered orders)
      if (order.status === 'delivered') {
        const orderDate = new Date(order.createdAt);
        const month = orderDate.getMonth();
        
        // Calculate supplier's share from this order
        const supplierItems = order.items.filter(item => 
          productIdsArray.includes(item.product._id || item.product)
        );
        
        const orderRevenue = supplierItems.reduce((sum, item) => 
          sum + (item.price * item.quantity), 0
        );
        
        monthlyRevenue[month] += orderRevenue;
        totalRevenue += orderRevenue;
      }
    });

    res.json({
      statusCounts,
      monthlyRevenue: monthlyRevenue.map(amount => Math.round(amount * 100) / 100),
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders: orders.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update product stock in bulk
router.put('/products/stock', auth, [
  body('updates').isArray().withMessage('Updates must be an array'),
  body('updates.*.productId').isMongoId().withMessage('Valid product ID is required'),
  body('updates.*.stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.role !== 'supplier') {
      return res.status(403).json({ message: 'Only suppliers can update stock' });
    }

    const { updates } = req.body;

    // Verify all products belong to the supplier
    const productIds = updates.map(update => update.productId);
    const supplierProducts = await Product.find({ 
      _id: { $in: productIds },
      supplier: req.user.id 
    });

    if (supplierProducts.length !== productIds.length) {
      return res.status(403).json({ message: 'Some products do not belong to you' });
    }

    // Update stock for each product
    const updatePromises = updates.map(update =>
      Product.findByIdAndUpdate(
        update.productId,
        { stock: update.stock },
        { new: true }
      )
    );

    const updatedProducts = await Promise.all(updatePromises);

    res.json({
      message: 'Stock updated successfully',
      products: updatedProducts
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;