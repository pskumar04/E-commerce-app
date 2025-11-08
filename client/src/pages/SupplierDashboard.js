import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import config from '../config';
import { toast } from 'react-toastify';
import { Navigate } from 'react-router-dom';

const SupplierDashboard = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    packed: 0,
    shipped: 0,
    delivered: 0
  });

  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    availableEarnings: 0,
    pendingEarnings: 0,
    totalOrders: 0
  });

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: 'men',
    subcategory: 'shirts',
    stock: '',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'White', 'Blue'],
    images: [],
    isBestSeller: false,
    supplierCost: ''
  });

  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Get authentication token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  useEffect(() => {
    if (user && user.role === 'supplier') {
      fetchProducts();
      fetchOrders();
      fetchEarningsSummary();
    }
  }, [user]);

    const getStatusColor = (status) => {
    const colors = {
      pending: '#f39c12',
      confirmed: '#3498db',
      packed: '#9b59b6',
      shipped: '#e67e22',
      delivered: '#27ae60',
      cancelled: '#e74c3c'
    };
    return colors[status] || '#95a5a6';
  };

  // Add this function to calculate statistics
  const calculateOrderStats = (orders) => {
    const stats = {
      total: orders.length,
      pending: 0,
      confirmed: 0,
      packed: 0,
      shipped: 0,
      delivered: 0
    };

    orders.forEach(order => {
      if (stats.hasOwnProperty(order.status)) {
        stats[order.status]++;
      }
    });

    return stats;
  };

  const fetchProducts = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${config.apiUrl}/api/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('All products:', response.data.products);
      console.log('Current user ID:', user.id);
      
      // Filter products by supplier - handle different ID formats
      const supplierProducts = response.data.products.filter(product => {
        if (!product.supplier) return false;
        
        // Handle both string and object ID comparison
        const supplierId = typeof product.supplier === 'object' 
          ? product.supplier._id 
          : product.supplier;
        
        const userId = user.id || user._id;
        
        return supplierId.toString() === userId.toString();
      });
      
      console.log('Supplier products:', supplierProducts);
      setProducts(supplierProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Update the fetchOrders function
  const fetchOrders = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${config.apiUrl}/api/orders/supplier-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
      setOrderStats(calculateOrderStats(response.data));
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    }
  };

  // Add this function to fetch earnings
  const fetchEarningsSummary = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${config.apiUrl}/api/orders/supplier/earnings-summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fix: Ensure we have valid data
      if (response.data) {
        setEarnings({
          totalEarnings: response.data.totalEarnings || 0,
          availableEarnings: response.data.availableEarnings || 0,
          pendingEarnings: response.data.pendingEarnings || 0,
          totalOrders: response.data.totalOrders || 0
        });
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
      // Set default values on error
      setEarnings({
        totalEarnings: 0,
        availableEarnings: 0,
        pendingEarnings: 0,
        totalOrders: 0
      });
    }
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file types and size
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length + selectedImages.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setSelectedImages(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove selected image
  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!productForm.name || !productForm.description || !productForm.price || !productForm.originalPrice || !productForm.stock) {
        toast.error('Please fill all required fields');
        return;
      }

      if (selectedImages.length === 0 && !editingProduct) {
        toast.error('Please select at least one product image');
        return;
      }

      setUploadingImages(true);
      const token = getAuthToken();

      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('description', productForm.description);
      formData.append('price', productForm.price);
      formData.append('originalPrice', productForm.originalPrice);
      formData.append('category', productForm.category);
      formData.append('subcategory', productForm.subcategory);
      formData.append('stock', productForm.stock);
      formData.append('isBestSeller', productForm.isBestSeller);
      formData.append('supplierCost', productForm.supplierCost || (productForm.price * 0.6).toString()); // Default 40% profit
      
      // Append sizes and colors as JSON strings
      formData.append('sizes', JSON.stringify(productForm.sizes));
      formData.append('colors', JSON.stringify(productForm.colors));

      // Append images
      selectedImages.forEach(image => {
        formData.append('images', image);
      });

      console.log('Submitting product with images...');

      if (editingProduct) {
        await axios.put(`${config.apiUrl}/api/products/${editingProduct._id}`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('Product updated successfully');
      } else {
        await axios.post(`${config.apiUrl}/api/products`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('Product added successfully');
      }
      
      // Reset form
      setShowProductForm(false);
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        category: 'men',
        subcategory: 'shirts',
        stock: '',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Black', 'White', 'Blue'],
        images: [],
        isBestSeller: false,
        supplierCost: ''
      });
      setSelectedImages([]);
      setImagePreviews([]);
      
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.message || 'Error saving product. Please check the console for details.');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      originalPrice: product.originalPrice.toString(),
      category: product.category,
      subcategory: product.subcategory || 'shirts',
      stock: product.stock.toString(),
      sizes: product.sizes || ['S', 'M', 'L', 'XL'],
      colors: product.colors || ['Black', 'White', 'Blue'],
      images: product.images || [],
      isBestSeller: product.isBestSeller || false,
      supplierCost: product.supplierCost ? product.supplierCost.toString() : ''
    });
    setImagePreviews(product.images || []);
    setSelectedImages([]);
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const token = getAuthToken();
        await axios.delete(`${config.apiUrl}/api/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Error deleting product');
      }
    }
  };

  // Add this function in the SupplierDashboard component
  const validateOrderStatusChange = (currentStatus, newStatus) => {
    const statusFlow = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    const newIndex = statusFlow.indexOf(newStatus);

    // Cannot go backwards
    if (newIndex < currentIndex) {
      toast.error(`Cannot change status from ${currentStatus} to ${newStatus}. Order progression must be sequential.`);
      return false;
    }

    // Must move step by step
    if (newIndex > currentIndex + 1) {
      const nextStatus = statusFlow[currentIndex + 1];
      toast.error(`Please mark the order as ${nextStatus} first before moving to ${newStatus}.`);
      return false;
    }

    // Cannot change delivered orders
    if (currentStatus === 'delivered') {
      toast.error('This order has been delivered and cannot be modified.');
      return false;
    }

    return true;
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = getAuthToken();
      const order = orders.find(o => o._id === orderId);
      
      if (!order) {
        toast.error('Order not found');
        return;
      }

      // Validate status change
      if (!validateOrderStatusChange(order.status, newStatus)) {
        return;
      }

      await axios.put(`${config.apiUrl}/api/orders/${orderId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Error updating order status');
    }
  };

  // Function to get product image URL
  const getProductImage = (product) => {
    if (!product) return 'https://via.placeholder.com/150x150?text=No+Image';
    if (product.images && product.images[0]) {
      if (product.images[0].startsWith('http')) {
        return product.images[0];
      } else {
        return `http://localhost:5000${product.images[0]}`;
      }
    }
    return 'https://via.placeholder.com/150x150?text=No+Image';
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'supplier') {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>Access Denied</h2>
        <p>Only suppliers can access this dashboard.</p>
        <p>Your current role: {user.role}</p>
      </div>
    );
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Supplier Dashboard</h1>
      <p>Welcome, {user?.name}</p>

      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => setShowProductForm(!showProductForm)}
          style={{
            padding: '1rem 2rem',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '600'
          }}
        >
          {showProductForm ? 'Cancel' : 'Add New Product'}
        </button>
      </div>

      {showProductForm && (
        <div style={{ 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '10px',
          marginBottom: '2rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
          <form onSubmit={handleProductSubmit}>
            {/* Product Images Upload Section */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Product Images *</label>
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ marginBottom: '1rem' }}
                  disabled={uploadingImages}
                />
                <p style={{ fontSize: '0.9rem', color: '#666', margin: '0' }}>
                  Select up to 5 images (JPEG, PNG, GIF). Max 5MB per image.
                </p>
              </div>

              {/* Image Previews */}
              {(imagePreviews.length > 0 || selectedImages.length > 0) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  {imagePreviews.map((preview, index) => (
                    <div key={index} style={{ position: 'relative', width: '100px', height: '100px' }}>
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '2px solid #e1e8ed'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: '#ff4757',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Product Name *</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  required
                  placeholder="Enter product name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Category *</label>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="children">Children</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Subcategory *</label>
                <select
                  value={productForm.subcategory}
                  onChange={(e) => setProductForm({...productForm, subcategory: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="shirts">Shirts</option>
                  <option value="pants">Pants</option>
                  <option value="dresses">Dresses</option>
                  <option value="shoes">Shoes</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Best Seller</label>
                <div style={{ marginTop: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={productForm.isBestSeller}
                    onChange={(e) => setProductForm({...productForm, isBestSeller: e.target.checked})}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Mark as Best Seller
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Description *</label>
              <textarea
                value={productForm.description}
                onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                required
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: '2px solid #e1e8ed', 
                  borderRadius: '8px',
                  fontSize: '1rem',
                  minHeight: '100px'
                }}
                placeholder="Enter product description"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.price}
                  onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                  required
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Original Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.originalPrice}
                  onChange={(e) => setProductForm({...productForm, originalPrice: e.target.value})}
                  required
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Stock *</label>
                <input
                  type="number"
                  min="0"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                  required
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>

            {/* Add Supplier Cost Field */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Your Cost ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={productForm.supplierCost}
                onChange={(e) => setProductForm({...productForm, supplierCost: e.target.value})}
                required
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e1e8ed',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
              <small style={{ color: '#666', fontSize: '0.8rem' }}>Your actual cost for this product</small>
            </div>

            <button 
              type="submit" 
              style={{ 
                padding: '1rem 2rem',
                background: uploadingImages ? '#95a5a6' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: uploadingImages ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
              disabled={uploadingImages}
            >
              {uploadingImages ? 'Uploading Images...' : (editingProduct ? 'Update Product' : 'Add Product')}
            </button>
          </form>
        </div>
      )}

      {/* Earnings Summary Section */}
      <div style={{ 
        background: 'white', 
        padding: '1.5rem', 
        borderRadius: '10px',
        marginBottom: '2rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h3>Your Earnings Summary</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          marginTop: '1rem'
        }}>
          <div style={{ 
            textAlign: 'center', 
            padding: '1.5rem', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>${(earnings.totalEarnings || 0).toFixed(2)}</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Earnings</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>
              From {earnings.totalOrders || 0} orders
            </div>
          </div>

          <div style={{ 
            textAlign: 'center', 
            padding: '1.5rem', 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>${(earnings.availableEarnings || 0).toFixed(2)}</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Available Now</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>
              From delivered orders
            </div>
          </div>

          <div style={{ 
            textAlign: 'center', 
            padding: '1.5rem', 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>${(earnings.pendingEarnings || 0).toFixed(2)}</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Pending Clearance</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>
              From active orders
            </div>
          </div>
        </div>
      </div>

      {/* Order Statistics Section */}
      <div style={{ 
        background: 'white', 
        padding: '1.5rem', 
        borderRadius: '10px',
        marginBottom: '2rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h3>Order Statistics</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '1rem',
          marginTop: '1rem'
        }}>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>{orderStats.total}</div>
            <div style={{ color: '#666' }}>Total Orders</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#fff3cd', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#856404' }}>{orderStats.pending}</div>
            <div style={{ color: '#666' }}>Pending</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#d1ecf1', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0c5460' }}>{orderStats.confirmed}</div>
            <div style={{ color: '#666' }}>Confirmed</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#d4edda', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#155724' }}>{orderStats.packed}</div>
            <div style={{ color: '#666' }}>Packed</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#cce7ff', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#004085' }}>{orderStats.shipped}</div>
            <div style={{ color: '#666' }}>Shipped</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#d1f7d1', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#155724' }}>{orderStats.delivered}</div>
            <div style={{ color: '#666' }}>Delivered</div>
          </div>
        </div>
      </div>

      {/* Products and Orders Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Products Section */}
        <div>
          <h2>Your Products ({products.length})</h2>
          {products.length === 0 ? (
            <p>No products yet. Add your first product!</p>
          ) : (
            products.map(product => (
              <div key={product._id} style={{
                background: 'white',
                padding: '1rem',
                marginBottom: '1rem',
                borderRadius: '8px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}>
                <img 
                  src={getProductImage(product)}
                  alt={product.name}
                  style={{
                    width: '100%',
                    height: '150px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '0.5rem'
                  }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/150x150?text=No+Image';
                  }}
                />
                <h4>{product.name}</h4>
                <p>Category: {product.category} | Price: ${product.price} | Stock: {product.stock}</p>
                {product.isBestSeller && <span style={{ color: '#ff6b00', fontWeight: 'bold' }}>★ Best Seller</span>}
                <div style={{ marginTop: '0.5rem' }}>
                  <button
                    onClick={() => handleEditProduct(product)}
                    style={{
                      marginRight: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product._id)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#ff4757',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Orders Section */}
        <div>
          <h2>Orders ({orders.length})</h2>
          {orders.length === 0 ? (
            <p>No orders yet.</p>
          ) : (
            orders.map(order => {
              const orderEarnings = order.items.reduce((total, item) => {
                if (item.product && item.product.supplierCost) {
                  return total + ((item.product.price - item.product.supplierCost) * item.quantity);
                }
                return total;
              }, 0);

              const isDelivered = order.status === 'delivered';
              
              return (
                <div key={order._id} style={{
                  background: 'white',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  borderRadius: '12px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                  border: isDelivered ? '2px solid #27ae60' : '2px solid transparent'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                        Order #{order.orderNumber}
                      </h4>
                      <p style={{ margin: '0.25rem 0', color: '#666' }}>
                        <strong>Customer:</strong> {order.customer?.name || 'N/A'}
                      </p>
                      <p style={{ margin: '0.25rem 0', color: '#666' }}>
                        <strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <p style={{ margin: '0.25rem 0', color: '#666' }}>
                        <strong>Total Order Value:</strong> ${order.totalAmount}
                      </p>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        padding: '0.5rem 1rem',
                        background: isDelivered ? '#27ae60' : getStatusColor(order.status),
                        color: 'white',
                        borderRadius: '20px',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        marginBottom: '0.5rem'
                      }}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </div>
                      <p style={{ 
                        margin: '0', 
                        color: '#27ae60', 
                        fontWeight: 'bold',
                        fontSize: '1.1rem'
                      }}>
                        Your Earnings: ${orderEarnings.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div style={{ 
                    background: '#f8f9fa',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                  }}>
                    <h5 style={{ margin: '0 0 0.75rem 0', color: '#333' }}>Items:</h5>
                    {order.items.map((item, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.5rem 0',
                        borderBottom: index < order.items.length - 1 ? '1px solid #e1e8ed' : 'none'
                      }}>
                        <div>
                          <span style={{ fontWeight: '600' }}>{item.product?.name}</span>
                          <span style={{ color: '#666', marginLeft: '1rem' }}>
                            Qty: {item.quantity} × ${item.product?.price}
                          </span>
                          {item.size && (
                            <span style={{ color: '#666', marginLeft: '1rem' }}>
                              Size: {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span style={{ color: '#666', marginLeft: '1rem' }}>
                              Color: {item.color}
                            </span>
                          )}
                        </div>
                        <div style={{ fontWeight: '600' }}>
                          ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Status Update - Only show for non-delivered orders */}
                  {!isDelivered && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontWeight: '600', color: '#333' }}>Update Status:</span>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                        style={{
                          padding: '0.5rem 1rem',
                          border: '2px solid #e1e8ed',
                          borderRadius: '6px',
                          background: 'white',
                          color: '#333',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="packed">Packed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>
                  )}

                  {/* Show completion message for delivered orders */}
                  {isDelivered && (
                    <div style={{
                      background: '#d4edda',
                      color: '#155724',
                      padding: '0.75rem 1rem',
                      borderRadius: '6px',
                      border: '1px solid #c3e6cb',
                      textAlign: 'center'
                    }}>
                      <strong>✅ Order Completed</strong> - This order has been successfully delivered to the customer.
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierDashboard;