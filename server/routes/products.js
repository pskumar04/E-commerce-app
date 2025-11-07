const express = require('express');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const uploadProductImages = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Get all products with filtering
router.get('/', async (req, res) => {
  try {
    const { category, bestseller, search, page = 1, limit = 12 } = req.query;
    
    let filter = {};
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (bestseller === 'true') {
      filter.isBestSeller = true;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter)
      .populate('supplier', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single product
// In the getProductById route, update the population:
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('supplier', 'name email phone address logisticsName');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add new product with image upload (Supplier only)
router.post('/', auth, uploadProductImages, async (req, res) => {
  try {
    console.log('Product creation request:', req.body);
    console.log('Uploaded files:', req.files);

    if (req.user.role !== 'supplier') {
      return res.status(403).json({ message: 'Only suppliers can add products' });
    }

    // Validate required fields
    const { name, description, price, originalPrice, category, subcategory, stock } = req.body;
    
    if (!name || !description || !price || !originalPrice || !category || !subcategory || !stock) {
      // Clean up uploaded files if validation fails
      if (req.files) {
        req.files.forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
      return res.status(400).json({ 
        message: 'All fields are required: name, description, price, originalPrice, category, subcategory, stock' 
      });
    }

    // Get image paths
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const product = new Product({
      ...req.body,
      price: parseFloat(price),
      originalPrice: parseFloat(originalPrice),
      stock: parseInt(stock),
      images: images,
      supplier: req.user.id
    });

    await product.save();
    console.log('Product created successfully:', product.name);
    
    res.status(201).json(product);
  } catch (error) {
    // Clean up uploaded files if error occurs
    if (req.files) {
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
    }
    console.error('Product creation error:', error);
    res.status(500).json({ 
      message: 'Error creating product', 
      error: error.message
    });
  }
});

// Update product (Supplier only)
router.put('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.supplier.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete product (Supplier only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.supplier.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    // Delete associated images
    if (product.images && product.images.length > 0) {
      product.images.forEach(imagePath => {
        const fullPath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;