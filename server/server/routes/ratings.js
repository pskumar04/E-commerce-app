const express = require('express');
const auth = require('../middleware/auth');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

const router = express.Router();

// Rate a product after delivery
router.post('/product/:productId', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { productId } = req.params;

    console.log('Rating product request:', { productId, rating, comment, user: req.user.id });

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        message: 'Rating must be between 1 and 5' 
      });
    }

    // Check if user has purchased this product
    const hasPurchased = await Order.findOne({
      customer: req.user.id,
      status: 'delivered',
      'items.product': productId
    });

    console.log('Purchase check result:', hasPurchased ? 'Purchased' : 'Not purchased');

    if (!hasPurchased) {
      return res.status(400).json({ 
        message: 'You can only rate products you have purchased and received.' 
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        message: 'Product not found' 
      });
    }

    // Check if already rated
    const existingReview = product.ratings.reviews.find(
      review => review.user.toString() === req.user.id
    );

    if (existingReview) {
      return res.status(400).json({ 
        message: 'You have already rated this product.' 
      });
    }

    // Add review
    product.ratings.reviews.push({
      user: req.user.id,
      rating: parseInt(rating),
      comment: comment || ''
    });

    // Update average rating
    const totalRatings = product.ratings.reviews.length;
    const sumRatings = product.ratings.reviews.reduce((sum, review) => sum + review.rating, 0);
    
    product.ratings.average = parseFloat((sumRatings / totalRatings).toFixed(1));
    product.ratings.count = totalRatings;

    await product.save();

    console.log('Product rating saved successfully');

    res.json({ 
      message: 'Product rating submitted successfully',
      averageRating: product.ratings.average,
      totalReviews: product.ratings.count
    });
  } catch (error) {
    console.error('Error rating product:', error);
    res.status(500).json({ 
      message: 'Server error while rating product', 
      error: error.message 
    });
  }
});

// Rate a supplier
router.post('/supplier/:supplierId', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { supplierId } = req.params;

    console.log('Rating supplier request:', { supplierId, rating, comment, user: req.user.id });

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        message: 'Rating must be between 1 and 5' 
      });
    }

    // Check if supplier exists
    const supplier = await User.findById(supplierId);
    if (!supplier || supplier.role !== 'supplier') {
      return res.status(404).json({ 
        message: 'Supplier not found' 
      });
    }

    // Check if user has purchased from this supplier
    const supplierProducts = await Product.find({ supplier: supplierId }).select('_id');
    const productIds = supplierProducts.map(p => p._id);

    const hasPurchased = await Order.findOne({
      customer: req.user.id,
      status: 'delivered',
      'items.product': { $in: productIds }
    });

    console.log('Supplier purchase check:', hasPurchased ? 'Purchased' : 'Not purchased');

    if (!hasPurchased) {
      return res.status(400).json({ 
        message: 'You can only rate suppliers you have purchased from.' 
      });
    }

    // Check if already rated
    const existingReview = supplier.supplierRatings.reviews.find(
      review => review.user.toString() === req.user.id
    );

    if (existingReview) {
      return res.status(400).json({ 
        message: 'You have already rated this supplier.' 
      });
    }

    // Add review
    supplier.supplierRatings.reviews.push({
      user: req.user.id,
      rating: parseInt(rating),
      comment: comment || ''
    });

    // Update average rating
    const totalRatings = supplier.supplierRatings.reviews.length;
    const sumRatings = supplier.supplierRatings.reviews.reduce((sum, review) => sum + review.rating, 0);
    
    supplier.supplierRatings.average = parseFloat((sumRatings / totalRatings).toFixed(1));
    supplier.supplierRatings.count = totalRatings;

    await supplier.save();

    console.log('Supplier rating saved successfully');

    res.json({ 
      message: 'Supplier rating submitted successfully',
      averageRating: supplier.supplierRatings.average,
      totalReviews: supplier.supplierRatings.count
    });
  } catch (error) {
    console.error('Error rating supplier:', error);
    res.status(500).json({ 
      message: 'Server error while rating supplier', 
      error: error.message 
    });
  }
});

module.exports = router;