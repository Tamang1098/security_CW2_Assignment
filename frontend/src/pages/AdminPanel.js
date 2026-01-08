import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AdminNotifications from '../components/AdminNotifications';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    image: '',
    category: '',
    stock: '',
    featured: false
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [additionalImageFiles, setAdditionalImageFiles] = useState([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState([]);
  const [existingImageUrls, setExistingImageUrls] = useState([]);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    image: '',
  });
  const [categoryImageFile, setCategoryImageFile] = useState(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState('');

  // Handle image URL - convert relative paths to full URLs
  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/400x300?text=No+Image';

    if (typeof imagePath !== 'string') return imagePath;

    let path = imagePath;
    // Force HTTPS for localhost to avoid mixed content blocks
    if (path.startsWith('http://localhost:5000')) {
      path = path.replace('http://localhost:5000', 'https://localhost:5000');
    }

    // If it's a full URL, return it
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // If it's a relative path, prepend backend URL
    if (path.startsWith('/uploads/')) {
      return `https://localhost:5000${path}`;
    }
    if (path.startsWith('uploads/')) {
      return `https://localhost:5000/${path}`;
    }

    // Handle just filename
    if (!path.includes('://') && !path.startsWith('/')) {
      return `https://localhost:5000/uploads/${path}`;
    }
    return path;
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchProducts();
      fetchCategories();
      fetchOrders(); // Fetch orders immediately for dashboard stats
      if (activeTab === 'users') {
        fetchUsers();
      }
    }
  }, [user, activeTab]);

  // Listen for new orders and new users, plus poll MongoDB for changes
  useEffect(() => {
    if (user?.role === 'admin') {
      const handleNewOrder = () => {
        // Only refresh orders if we're on the orders tab
        if (activeTab === 'orders') {
          fetchOrders();
        }
      };

      const handleNewUser = () => {
        // Only refresh users if we're on the users tab
        if (activeTab === 'users') {
          fetchUsers();
        }
      };

      // Listen for window events (same tab/window)
      window.addEventListener('newOrderCreated', handleNewOrder);
      window.addEventListener('newUserCreated', handleNewUser);

      // Listen for localStorage changes (cross-tab communication)
      const handleStorageChange = (e) => {
        if (e.key === 'newOrderCreated') {
          handleNewOrder();
        } else if (e.key === 'newUserCreated') {
          handleNewUser();
        }
      };
      window.addEventListener('storage', handleStorageChange);

      // Poll MongoDB for changes when tab is visible (every 5 seconds)
      let pollInterval;
      const startPolling = () => {
        // Clear any existing interval
        clearInterval(pollInterval);

        if (!document.hidden) {
          // Immediately fetch data when starting to poll
          if (activeTab === 'orders') {
            fetchOrders();
          } else if (activeTab === 'users') {
            fetchUsers();
          }

          // Then poll every 5 seconds
          pollInterval = setInterval(() => {
            if (!document.hidden) {
              // Poll based on active tab
              if (activeTab === 'orders') {
                fetchOrders();
              } else if (activeTab === 'users') {
                fetchUsers();
              }
            }
          }, 5000); // Poll every 5 seconds
        }
      };

      // Start polling if page is visible
      if (!document.hidden) {
        startPolling();
      }

      // Handle visibility change
      const handleVisibilityChange = () => {
        if (document.hidden) {
          clearInterval(pollInterval);
        } else {
          clearInterval(pollInterval);
          startPolling();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        window.removeEventListener('newOrderCreated', handleNewOrder);
        window.removeEventListener('newUserCreated', handleNewUser);
        window.removeEventListener('storage', handleStorageChange);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        clearInterval(pollInterval);
      };
    }
  }, [user, activeTab]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('https://localhost:5000/api/admin/products');
      setProducts(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('https://localhost:5000/api/admin/categories');
      // Failsafe: Sort by createdAt desc on frontend
      const sortedCategories = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setCategories(sortedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('https://localhost:5000/api/admin/users');
      setUsers(res.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleDeleteUser = async (id, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      try {
        await axios.delete(`https://localhost:5000/api/admin/users/${id}`);
        fetchUsers();
        alert('User deleted successfully!');
        // Dispatch event for user changes
        window.dispatchEvent(new Event('adminDataUpdated'));
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting user');
      }
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Calculate current total using current state values
      const currentTotal = existingImageUrls.length + additionalImageFiles.length + files.length;
      const maxAllowed = 5;

      if (currentTotal > maxAllowed) {
        const allowedNew = maxAllowed - (existingImageUrls.length + additionalImageFiles.length);
        if (allowedNew <= 0) {
          alert(`Maximum limit of ${maxAllowed} images reached. Please remove some existing images first.`);
          e.target.value = ''; // Clear input
          return;
        }
        alert(`You can only have up to ${maxAllowed} total images. Only the first ${allowedNew} new image(s) will be added.`);
        const limitedFiles = files.slice(0, allowedNew);
        addImagesToState(limitedFiles);
      } else {
        // Valid selection - append new files to existing
        addImagesToState(files);
      }
    }
    e.target.value = ''; // Clear input to allow selecting same files again
  };

  const addImagesToState = async (files) => {
    if (!files || files.length === 0) return;

    console.log('Adding files to state:', files.length);

    // Filter out duplicates before adding - use functional update to get latest state
    setAdditionalImageFiles((prev) => {
      const newFiles = [...prev];
      files.forEach((newFile) => {
        // Check for duplicates by file name and size
        const isDuplicate = newFiles.some(
          existingFile => existingFile.name === newFile.name && existingFile.size === newFile.size
        );
        if (!isDuplicate) {
          newFiles.push(newFile);
        } else {
          console.log('Duplicate file skipped:', newFile.name);
        }
      });
      console.log('Total files after add:', newFiles.length);
      return newFiles;
    });

    // Create previews for all new files using Promise.all to ensure all load before updating
    const previewPromises = Array.from(files).map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          console.log('Preview loaded for:', file.name);
          resolve(reader.result);
        };
        reader.onerror = () => {
          console.error('Error reading file:', file.name);
          resolve(null); // Resolve with null instead of reject to continue processing
        };
        reader.readAsDataURL(file);
      });
    });

    // Wait for all previews to load
    try {
      const newPreviews = await Promise.all(previewPromises);
      // Filter out null values (failed reads) and update state
      const validPreviews = newPreviews.filter(preview => preview !== null);

      console.log('Valid previews loaded:', validPreviews.length);

      if (validPreviews.length > 0) {
        setAdditionalImagePreviews((prev) => {
          // Combine existing previews with new ones, avoiding duplicates
          const combined = [...prev];
          validPreviews.forEach((newPreview) => {
            // Check if preview already exists (avoid exact duplicates)
            if (!combined.includes(newPreview)) {
              combined.push(newPreview);
            }
          });
          console.log('Total previews after add:', combined.length);
          return combined;
        });
      }
    } catch (error) {
      console.error('Error loading image previews:', error);
    }
  };

  const removeAdditionalImage = (index) => {
    // Check if removing an existing image or a new file
    const existingCount = existingImageUrls.length;
    if (index < existingCount) {
      // Removing an existing image URL
      const newExisting = existingImageUrls.filter((_, i) => i !== index);
      const newPreviews = additionalImagePreviews.filter((_, i) => i !== index);
      setExistingImageUrls(newExisting);
      setAdditionalImagePreviews(newPreviews);
    } else {
      // Removing a newly uploaded file
      // We need to remove from both files and previews arrays
      const fileIndex = index - existingCount;

      // Remove from files array
      setAdditionalImageFiles((prev) => {
        const newFiles = prev.filter((_, i) => i !== fileIndex);
        return newFiles;
      });

      // Remove from previews array (at the same index position)
      setAdditionalImagePreviews((prev) => {
        const newPreviews = prev.filter((_, i) => i !== index);
        return newPreviews;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', ''); // Empty description
      submitData.append('price', formData.price);
      submitData.append('category', formData.category);
      submitData.append('stock', formData.stock);
      submitData.append('sizes', ''); // Send empty sizes, let frontend handle default sizes based on category
      submitData.append('featured', formData.featured);

      // Add main image file if selected, otherwise use URL
      if (imageFile) {
        submitData.append('image', imageFile);
      } else if (formData.image) {
        submitData.append('image', formData.image);
      }

      // Add additional images - include both new files and existing URLs when editing
      if (editingProduct && existingImageUrls.length > 0) {
        // When editing, preserve existing images - send as JSON string
        submitData.append('existingImages', JSON.stringify(existingImageUrls));
      }
      // Add new image files
      if (additionalImageFiles.length > 0) {
        additionalImageFiles.forEach((file) => {
          submitData.append('images', file);
        });
      }

      if (editingProduct) {
        await axios.put(
          `https://localhost:5000/api/admin/products/${editingProduct._id}`,
          submitData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      } else {
        await axios.post('https://localhost:5000/api/admin/products', submitData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      fetchProducts();
      const productId = editingProduct ? editingProduct._id : null;
      resetForm();
      alert(editingProduct ? 'Product updated!' : 'Product added!');
      // Dispatch events to refresh products on landing page (same tab)
      window.dispatchEvent(new Event('productUpdated'));
      window.dispatchEvent(new Event('adminDataUpdated'));
      // Trigger localStorage change for cross-tab communication
      localStorage.setItem('productUpdated', Date.now().toString());
      localStorage.removeItem('productUpdated');
      // If editing, also trigger product-specific update for product detail page
      if (productId) {
        window.dispatchEvent(new CustomEvent('productUpdatedId', { detail: { productId } }));
        localStorage.setItem('productUpdatedId', productId);
        setTimeout(() => localStorage.removeItem('productUpdatedId'), 100);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice || '',
      image: product.image,
      category: product.category,
      stock: product.stock,
      featured: product.featured
    });
    setImageFile(null);
    setImagePreview(product.image ? getImageUrl(product.image) : '');
    // Load existing additional images
    if (product.images && product.images.length > 0) {
      const imageUrls = product.images.map(img =>
        img.startsWith('http') ? img : (img.startsWith('/') ? `https://localhost:5000${img}` : img)
      );
      setAdditionalImagePreviews(imageUrls);
      setExistingImageUrls(imageUrls); // Track existing URLs separately
    } else {
      setAdditionalImagePreviews([]);
      setExistingImageUrls([]);
    }
    setAdditionalImageFiles([]);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`https://localhost:5000/api/admin/products/${id}`);
        fetchProducts();
        alert('Product deleted!');
        // Dispatch events to refresh products on landing page (same tab)
        window.dispatchEvent(new Event('productUpdated'));
        window.dispatchEvent(new Event('adminDataUpdated'));
        // Trigger localStorage change for cross-tab communication
        localStorage.setItem('productUpdated', Date.now().toString());
        localStorage.removeItem('productUpdated');
      } catch (error) {
        alert('Error deleting product');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      image: '',
      category: '',
      stock: '',
      featured: false
    });
    setImageFile(null);
    setImagePreview('');
    setAdditionalImageFiles([]);
    setAdditionalImagePreviews([]);
    setExistingImageUrls([]);
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleCategoryChange = (e) => {
    setCategoryFormData({
      ...categoryFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleCategoryImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCategoryImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCategoryImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      submitData.append('name', categoryFormData.name);
      if (categoryImageFile) {
        submitData.append('image', categoryImageFile);
      }

      if (editingCategory) {
        await axios.put(
          `https://localhost:5000/api/admin/categories/${editingCategory._id}`,
          submitData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      } else {
        await axios.post('https://localhost:5000/api/admin/categories', submitData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      fetchCategories();
      resetCategoryForm();
      alert(editingCategory ? 'Category updated!' : 'Category added!');
      // Dispatch events to refresh categories on landing page (same tab)
      window.dispatchEvent(new Event('categoryUpdated'));
      window.dispatchEvent(new Event('adminDataUpdated'));
      // Trigger localStorage change for cross-tab communication
      localStorage.setItem('categoryUpdated', Date.now().toString());
      localStorage.removeItem('categoryUpdated');
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving category');
    }
  };

  const handleCategoryEdit = (category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      image: category.image
    });
    setCategoryImageFile(null);
    setCategoryImagePreview(category.image ? getImageUrl(category.image) : '');
    setShowCategoryForm(true);
  };

  const handleCategoryDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await axios.delete(`https://localhost:5000/api/admin/categories/${id}`);
        fetchCategories();
        alert('Category deleted!');
        // Dispatch events to refresh categories on landing page (same tab)
        window.dispatchEvent(new Event('categoryUpdated'));
        window.dispatchEvent(new Event('adminDataUpdated'));
        // Trigger localStorage change for cross-tab communication
        localStorage.setItem('categoryUpdated', Date.now().toString());
        localStorage.removeItem('categoryUpdated');
      } catch (error) {
        alert('Error deleting category');
      }
    }
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      image: ''
    });
    setCategoryImageFile(null);
    setCategoryImagePreview('');
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await axios.get('https://localhost:5000/api/admin/orders');
      setOrders(res.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`https://localhost:5000/api/orders/${orderId}/status`, {
        orderStatus: newStatus
      });
      fetchOrders();
      alert('Order status updated!');

      // Dispatch event to update user notifications (for navbar badge)
      window.dispatchEvent(new Event('orderStatusUpdated'));
      localStorage.setItem('orderStatusUpdated', Date.now().toString());
      setTimeout(() => localStorage.removeItem('orderStatusUpdated'), 100);
    } catch (error) {
      alert('Error updating order status');
    }
  };

  const handlePaymentDone = async (orderId, paymentId) => {
    if (!paymentId) {
      alert('Payment ID not found. Cannot process payment.');
      return;
    }

    if (!window.confirm('Mark this payment as "Received" and set order status to "Processing"? A notification will be sent to the user.')) {
      return;
    }

    try {
      // Update payment status to paid and set order status to processing (backend handles both)
      // We removed skipNotification=true so the user gets the update!
      await axios.put(`https://localhost:5000/api/payments/${paymentId}/status`, {
        status: 'paid',
        setOrderStatus: 'processing'
      });

      // Refresh orders to show updated status
      await fetchOrders();

      alert('Payment Status Updated to "Received". Order is now Processing.');

      // Dispatch events to refresh views
      window.dispatchEvent(new Event('paymentVerified'));
      window.dispatchEvent(new Event('orderStatusUpdated'));
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert(error.response?.data?.message || 'Error updating payment status.');
    }
  };

  const handleCODPaymentStatus = async (orderId, paymentId, newStatus) => {
    try {
      await axios.put(`https://localhost:5000/api/payments/${paymentId}/status?skipNotification=true`, {
        status: newStatus === 'received' ? 'paid' : 'pending'
      });
      fetchOrders();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating COD payment status');
    }
  };

  const handleDeleteOrder = async (orderId, orderNumber) => {
    if (!window.confirm(`Are you sure you want to delete order ${orderNumber}? This action cannot be undone.`)) {
      return;
    }
    try {
      await axios.delete(`https://localhost:5000/api/orders/${orderId}`);
      fetchOrders();
      alert('Order deleted successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting order');
    }
  };

  const [productSearch, setProductSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffa500',
      confirmed: '#667eea',
      processing: '#667eea',
      shipped: '#2196F3',
      delivered: '#4CAF50',
      cancelled: '#ff4444'
    };
    return colors[status] || '#666';
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredOrders = orders.filter(o => {
    const matchesStatus = orderStatusFilter === 'all' || o.orderStatus === orderStatusFilter;
    // Optional: Add search by order ID if needed later
    return matchesStatus;
  });

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (user?.role !== 'admin') {
    return (
      <div className="admin-panel">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You need admin privileges to access this page.</p>
          <a href="/admin/login" style={{
            display: 'inline-block',
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '600'
          }}>
            Go to Admin Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="container">
        <div className="admin-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="admin-welcome">Welcome, {user?.name}! Manage your store here.</p>
          </div>
          <AdminNotifications />
          <div className="admin-actions">
            <button
              onClick={() => setActiveTab('products')}
              className={activeTab === 'products' ? 'tab-btn active' : 'tab-btn'}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={activeTab === 'categories' ? 'tab-btn active' : 'tab-btn'}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={activeTab === 'orders' ? 'tab-btn active' : 'tab-btn'}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={activeTab === 'users' ? 'tab-btn active' : 'tab-btn'}
            >
              Users
            </button>
          </div>
        </div>

        {/* Dashboard Summary */}
        <div className="dashboard-summary">
          <div className="summary-card">
            <h3>Total Products</h3>
            <p className="summary-number">{products.length}</p>
          </div>
          <div className="summary-card">
            <h3>Total Orders</h3>
            <p className="summary-number">{orders.length}</p>
          </div>
          <div className="summary-card revenue-card">
            <h3>Total Revenue</h3>
            <p className="summary-number">
              Rs. {orders
                .filter(o => o.orderStatus !== 'cancelled')
                .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0)
                .toLocaleString()}
            </p>
          </div>
          <div className="summary-card warning-card">
            <h3>Pending Orders</h3>
            <p className="summary-number">
              {orders.filter(o => o.orderStatus === 'pending' || o.orderStatus === 'processing').length}
            </p>
          </div>
        </div>

        {/* Low Stock Alert Section */}
        {products.some(p => p.stock < 5) && (
          <div className="low-stock-section">
            <h3 className="low-stock-title">⚠️ Low Stock Alerts</h3>
            <div className="low-stock-grid">
              {products
                .filter(p => p.stock < 5)
                .map(product => (
                  <div key={product._id} className="low-stock-item">
                    <img src={getImageUrl(product.image)} alt={product.name} />
                    <div className="low-stock-info">
                      <h4>{product.name}</h4>
                      <p>Stock: <span className="stock-count low">{product.stock}</span></p>
                    </div>
                    <button
                      onClick={() => {
                        handleEdit(product);
                        setActiveTab('products');
                        setShowForm(true);
                      }}
                      className="restock-btn"
                    >
                      Restock
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <>
            {categories.length === 0 && (
              <div className="workflow-notice">
                <h3>📋 Workflow Instructions</h3>
                <p><strong>Step 1:</strong> First, go to <strong>Categories</strong> tab and create categories (e.g., Electronics, Clothing, etc.)</p>
                <p><strong>Step 2:</strong> Then come back here to add products and select the category.</p>
                <button onClick={() => setActiveTab('categories')} className="goto-categories-btn">
                  Go to Categories →
                </button>
              </div>
            )}
            <div className="section-header">
              <h2>Product Management</h2>
              <button onClick={() => setShowForm(!showForm)} className="add-product-btn" disabled={categories.length === 0}>
                {showForm ? 'Cancel' : '+ Add Product'}
              </button>
            </div>
            {categories.length === 0 && showForm && (
              <div className="warning-message">
                ⚠️ Please create at least one category first before adding products!
              </div>
            )}

            {showForm && (
              <div className="product-form-container">
                <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <form onSubmit={handleSubmit} className="product-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Product Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Category *</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="category-select"
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>


                  <div className="form-row">
                    <div className="form-group">
                      <label>Price (Rs.) *</label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="form-group">
                      <label>Stock *</label>
                      <input
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                        required
                        min="0"
                      />
                    </div>
                  </div>



                  <div className="form-group">
                    <label>Main Product Image *</label>
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="file-input"
                    />
                    {imagePreview && (
                      <div className="image-preview">
                        <img src={imagePreview} alt="Main Preview" />
                      </div>
                    )}
                    {!imageFile && (
                      <div className="image-url-fallback" style={{ marginTop: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', marginBottom: '0.25rem', display: 'block' }}>Or enter image URL:</label>
                        <input
                          type="url"
                          name="image"
                          value={formData.image}
                          onChange={handleChange}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Additional Product Images (Optional - 1 to 5 images)</label>
                    <input
                      type="file"
                      name="additionalImages"
                      accept="image/*"
                      multiple
                      onChange={handleAdditionalImagesChange}
                      className="file-input"
                    />
                    <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                      Select 1 to 5 additional images ({existingImageUrls.length + additionalImageFiles.length}/5 selected)
                    </p>
                    {(existingImageUrls.length + additionalImageFiles.length) > 0 && (existingImageUrls.length + additionalImageFiles.length) < 5 && (
                      <p style={{ fontSize: '0.85rem', color: '#2196F3', marginTop: '0.25rem' }}>
                        You can select more images (up to {5 - (existingImageUrls.length + additionalImageFiles.length)} more)
                      </p>
                    )}
                    {(existingImageUrls.length + additionalImageFiles.length) >= 5 && (
                      <p style={{ fontSize: '0.85rem', color: '#ff7043', marginTop: '0.25rem', fontWeight: 'bold' }}>
                        ✓ Maximum limit reached (5 images). Remove images to add new ones.
                      </p>
                    )}
                    {(existingImageUrls.length > 0 || additionalImageFiles.length > 0) && (
                      <div className="additional-images-preview">
                        <h4>Selected Images ({existingImageUrls.length + additionalImageFiles.length}):</h4>
                        <div className="additional-images-grid">
                          {additionalImagePreviews.map((preview, index) => (
                            <div key={`preview-${index}-${preview.substring(0, 20)}`}>
                              <img
                                src={preview}
                                alt={`Additional ${index + 1}`}
                                onError={(e) => {
                                  console.error('Error loading image preview:', index);
                                  e.target.src = 'https://via.placeholder.com/100';
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => removeAdditionalImage(index)}
                                title="Remove image"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleChange}
                      />
                      Featured Product
                    </label>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="submit-btn">
                      {editingProduct ? 'Update Product' : 'Add Product'}
                    </button>
                    {editingProduct && (
                      <button type="button" onClick={resetForm} className="cancel-btn">
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            <div className="products-list">
              <div className="products-header">
                <h2>All Products ({filteredProducts.length})</h2>
                <div className="filter-group">
                  <div className="category-filter">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="category-filter-select"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="search-box">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="search-input"
                    />
                  </div>
                </div>
              </div>
              {loading ? (
                <div className="loading">Loading products...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="no-products">
                  {selectedCategory === 'all'
                    ? 'No products added yet.'
                    : `No products found in "${selectedCategory}" category.`}
                </div>
              ) : (
                <div className="products-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Featured</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product._id}>
                          <td>
                            <img
                              src={getImageUrl(product.image)}
                              alt={product.name}
                              className="product-thumb"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/50';
                              }}
                            />
                          </td>
                          <td>{product.name}</td>
                          <td>{product.category}</td>
                          <td>Rs. {product.price}</td>
                          <td>{product.stock}</td>
                          <td>{product.featured ? '✓' : '-'}</td>
                          <td>
                            <button
                              onClick={() => handleEdit(product)}
                              className="edit-btn"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(product._id)}
                              className="delete-btn"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'categories' && (
          <>
            <div className="section-header">
              <h2>Category Management</h2>
              <button
                onClick={() => setShowCategoryForm(!showCategoryForm)}
                className="add-product-btn"
              >
                {showCategoryForm ? 'Cancel' : '+ Add Category'}
              </button>
            </div>

            {showCategoryForm && (
              <div className="product-form-container">
                <h2>{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
                <form onSubmit={handleCategorySubmit} className="product-form">
                  <div className="form-group">
                    <label>Category Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={categoryFormData.name}
                      onChange={handleCategoryChange}
                      required
                      placeholder="e.g., Electronics"
                    />
                  </div>

                  <div className="form-group">
                    <label>Category Image</label>
                    <div className="image-upload-container">
                      <label className="file-upload-btn">
                        Choose Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCategoryImageChange}
                          hidden
                        />
                      </label>
                      {categoryImagePreview && (
                        <div className="image-preview">
                          <img src={categoryImagePreview} alt="Preview" />
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => {
                              setCategoryImageFile(null);
                              setCategoryImagePreview('');
                            }}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="submit-btn" disabled={loading}>
                      {loading ? 'Saving...' : (editingCategory ? 'Update Category' : 'Add Category')}
                    </button>
                    <button type="button" onClick={resetCategoryForm} className="cancel-btn">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="products-list">
              <h2>All Categories ({categories.length})</h2>
              {categories.length === 0 ? (
                <div className="no-products">No categories added yet.</div>
              ) : (
                <div className="products-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category) => (
                        <tr key={category._id}>
                          <td>{category.name}</td>
                          <td>{category.status}</td>
                          <td>
                            <button
                              onClick={() => handleCategoryEdit(category)}
                              className="edit-btn"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleCategoryDelete(category._id)}
                              className="delete-btn"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'orders' && (
          <>
            <div className="section-header">
              <h2>Order Management</h2>
              <button onClick={fetchOrders} className="add-product-btn">
                Refresh
              </button>
            </div>
            <div className="products-list">
              <h2>All Orders ({orders.length})</h2>
              {/* Orders Header & Filter */}
              <div className="section-header">
                <h2>Order Management ({filteredOrders.length})</h2>
                <div className="filter-group">
                  <div className="category-filter">
                    <span className="filter-label">Status:</span>
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="category-filter-select"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {ordersLoading ? (
                <div className="loading">Loading orders...</div>
              ) : filteredOrders.length === 0 ? (
                <div className="no-products">
                  {orderStatusFilter === 'all'
                    ? 'No orders found.'
                    : `No orders with status "${orderStatusFilter}".`}
                </div>
              ) : (
                <div className="orders-table-container">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Payment</th>
                        <th>COD Payment</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr key={order._id}>
                          <td>{order.orderNumber}</td>
                          <td>
                            {order.user?.name || 'N/A'}
                            <br />
                            <small>{order.user?.email}</small>
                            <br />
                            <small style={{ color: '#2196F3', fontWeight: 600 }}>
                              📱 {order.user?.phone || order.shippingAddress?.phone || 'N/A'}
                            </small>
                          </td>
                          <td>{order.items.length} items</td>
                          <td>Rs. {order.total.toFixed(2)}</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <span style={{
                                fontWeight: 700,
                                color: order.paymentStatus === 'paid' ? '#4CAF50' :
                                  order.paymentStatus === 'pending_verification' ? '#2196F3' : '#ff7043',
                                fontSize: '0.85rem'
                              }}>
                                {order.paymentStatus === 'paid' ? '✓ Payment Received' :
                                  order.paymentStatus === 'pending_verification' ? '⏳ Verification Required' : 'Pending'}
                              </span>

                              {/* Show Payment Done button if not paid yet. Highlight it if verification is pending. */}
                              {order.paymentStatus !== 'paid' && (
                                <button
                                  onClick={() => handlePaymentDone(order._id, order.payment?._id || order.payment)}
                                  className={`payment-done-btn ${order.paymentStatus === 'pending_verification' ? 'needs-click' : ''}`}
                                  style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    backgroundColor: order.paymentStatus === 'pending_verification' ? '#2196F3' : '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    marginTop: '0.25rem',
                                    transition: 'all 0.3s',
                                    boxShadow: order.paymentStatus === 'pending_verification' ? '0 0 8px rgba(33, 150, 243, 0.5)' : 'none',
                                    border: order.paymentStatus === 'pending_verification' ? '2px solid #0d47a1' : 'none'
                                  }}
                                  onMouseEnter={(e) => e.target.style.backgroundColor = order.paymentStatus === 'pending_verification' ? '#1976D2' : '#45a049'}
                                  onMouseLeave={(e) => e.target.style.backgroundColor = order.paymentStatus === 'pending_verification' ? '#2196F3' : '#4CAF50'}
                                >
                                  {order.paymentStatus === 'pending_verification' ? 'Verify Payment' : 'Payment Done'}
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            {/* COD Column - now empty or just showing method for reference */}
                            <span style={{ fontSize: '0.85rem', color: '#666' }}>
                              {order.paymentMethod === 'cod' ? 'COD' : 'Online'}
                            </span>
                          </td>
                          <td>
                            <span
                              className="status-badge-small"
                              style={{ backgroundColor: getStatusColor(order.orderStatus || 'pending') }}
                            >
                              {order.orderStatus || 'pending'}
                            </span>
                          </td>
                          <td>{new Date(order.createdAt || Date.now()).toLocaleDateString()}</td>
                          <td>
                            <select
                              value={order.orderStatus}
                              onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                              className="status-select"
                              style={{ width: '100%', marginBottom: '0.5rem' }}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            <button
                              onClick={() => handleDeleteOrder(order._id, order.orderNumber)}
                              className="delete-order-btn"
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                transition: 'all 0.3s'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                            >
                              🗑️ Delete Order
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <>
            <div className="section-header">
              <h2>User Management ({filteredUsers.length})</h2>
              <div className="filter-group">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>
              <button onClick={fetchUsers} className="add-product-btn">
                Refresh controls
              </button>
            </div>
            <div className="products-list">
              {filteredUsers.length === 0 ? (
                <div className="no-products">No users found.</div>
              ) : (
                <div className="products-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Registered</th>
                        <th>Cart Items</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((userItem) => (
                        <tr key={userItem._id}>
                          <td>{userItem.name}</td>
                          <td>{userItem.email}</td>
                          <td>
                            <span className={`role-badge ${userItem.role === 'admin' ? 'admin' : 'user'}`}>
                              {userItem.role === 'admin' ? '👑 Admin' : '👤 User'}
                            </span>
                          </td>
                          <td>{new Date(userItem.createdAt).toLocaleDateString()}</td>
                          <td>{userItem.cart?.length || 0}</td>
                          <td>
                            <button
                              onClick={() => handleDeleteUser(userItem._id, userItem.name)}
                              className="delete-btn"
                              disabled={userItem._id === user?._id}
                              title={userItem._id === user?._id ? 'Cannot delete your own account' : 'Delete user'}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div >
  );
};

export default AdminPanel;

