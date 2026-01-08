const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const Order = require('../models/Order');
const { adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Add product (Admin only)
router.post('/products', adminAuth, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 5 }
]), async (req, res) => {
  try {
    const {
      name,
      price,
      category,
      stock,
      featured
    } = req.body;

    // Validate required fields
    if (!name || !price || !category) {
      return res.status(400).json({ message: 'Name, price, and category are required' });
    }

    // Get main image URL - either from uploaded file or from body
    let imageUrl = 'https://via.placeholder.com/300';
    if (req.files && req.files['image'] && req.files['image'][0]) {
      // Use uploaded file - return relative path
      imageUrl = `/uploads/${req.files['image'][0].filename}`;
    } else if (req.body.image) {
      // Use provided URL
      imageUrl = req.body.image;
    }

    const additionalImages = [];
    if (req.files && req.files['images']) {
      req.files['images'].forEach(file => {
        additionalImages.push(`/uploads/${file.filename}`);
      });
    }
    // Also check for image URLs in body (comma-separated or array)
    if (req.body.images) {
      const imageUrls = Array.isArray(req.body.images)
        ? req.body.images
        : req.body.images.split(',').map(url => url.trim()).filter(url => url);
      additionalImages.push(...imageUrls);
    }

    const product = new Product({
      name,
      description: req.body.description || '', // Optional description
      price: parseFloat(price),
      image: imageUrl,
      images: additionalImages,
      category,
      stock: parseInt(stock) || 0,
      sizes: req.body.sizes ? (Array.isArray(req.body.sizes) ? req.body.sizes : req.body.sizes.split(',').map(s => s.trim()).filter(s => s)) : [],
      featured: featured === 'true' || featured === true
    });

    const savedProduct = await product.save();
    console.log('Product created successfully in MongoDB:', savedProduct._id);
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error creating product in MongoDB:', error);
    console.error('Error creating product in MongoDB:', error);
    // Log validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      console.error('Validation Errors:', validationErrors);
      return res.status(400).json({ message: `Validation Error: ${validationErrors.join(', ')}` });
    }
    res.status(500).json({ message: error.message || 'Error creating product' });
  }
});

// Update product (Admin only)
router.put('/products/:id', adminAuth, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 5 }
]), async (req, res) => {
  try {
    const {
      name,
      price,
      category,
      stock,
      featured
    } = req.body;

    const updateData = {
      name,
      description: req.body.description || '', // Optional description
      price: parseFloat(price),
      category,
      stock: parseInt(stock) || 0,
      sizes: req.body.sizes ? (Array.isArray(req.body.sizes) ? req.body.sizes : req.body.sizes.split(',').map(s => s.trim()).filter(s => s)) : [],
      featured: featured === 'true' || featured === true
    };

    // Update main image if new file uploaded
    if (req.files && req.files['image'] && req.files['image'][0]) {
      updateData.image = `/uploads/${req.files['image'][0].filename}`;
    } else if (req.body.image) {
      updateData.image = req.body.image;
    }

    // Update additional images - merge existing URLs with new files
    const newImageFiles = req.files && req.files['images'] ? req.files['images'] : [];
    // Handle existingImages from FormData (could be array or single value)
    let existingImageUrls = [];
    if (req.body.existingImages) {
      if (Array.isArray(req.body.existingImages)) {
        existingImageUrls = req.body.existingImages;
      } else if (typeof req.body.existingImages === 'string') {
        // If it's a string, try to parse as JSON array or treat as single value
        try {
          existingImageUrls = JSON.parse(req.body.existingImages);
        } catch {
          existingImageUrls = [req.body.existingImages];
        }
      }
    }

    if (newImageFiles.length > 0 || existingImageUrls.length > 0) {
      // Map new file uploads to URLs
      const newImageUrls = newImageFiles.map(file =>
        `/uploads/${file.filename}`
      );

      // Combine existing URLs with new ones, avoiding duplicates
      const allImages = [...existingImageUrls, ...newImageUrls];
      // Remove duplicates based on URL
      updateData.images = Array.from(new Set(allImages));
    } else if (req.body.images !== undefined) {
      // If images are explicitly provided in body (but no existingImages), use them
      if (req.body.images === '' || req.body.images === null) {
        // Empty string or null means clear all additional images
        updateData.images = [];
      } else {
        const imageUrls = Array.isArray(req.body.images)
          ? req.body.images
          : req.body.images.split(',').map(url => url.trim()).filter(url => url);
        updateData.images = imageUrls;
      }
    }
    // If neither files nor body.images/existingImages is provided, keep existing images (don't update this field)

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('Product updated successfully in MongoDB:', product._id);
    console.log('Updated product data:', JSON.stringify(product, null, 2));
    res.json(product);
  } catch (error) {
    console.error('Error updating product in MongoDB:', error);
    res.status(500).json({ message: error.message || 'Error updating product' });
  }
});

// Delete product (Admin only)
router.delete('/products/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    console.log('Product deleted successfully from MongoDB:', req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product from MongoDB:', error);
    res.status(500).json({ message: error.message || 'Error deleting product' });
  }
});

// Get all products (Admin - includes inactive)
router.get('/products', adminAuth, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Category Management Routes

// Add category (Admin only)
router.post('/categories', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name } = req.body;
    let image = '';

    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    const category = new Category({
      name,
      image
    });

    const savedCategory = await category.save();
    console.log('Category created successfully in MongoDB:', savedCategory._id);
    res.status(201).json(savedCategory);
  } catch (error) {
    console.error('Error creating category in MongoDB:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    res.status(500).json({ message: error.message || 'Error creating category' });
  }
});

// Get all categories (Admin)
router.get('/categories', adminAuth, async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update category (Admin only)
router.put('/categories/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name } = req.body;
    const updateData = { name };

    // Update image if new file uploaded
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    console.log('Category updated successfully in MongoDB:', category._id);
    res.json(category);
  } catch (error) {
    console.error('Error updating category in MongoDB:', error);
    res.status(500).json({ message: error.message || 'Error updating category' });
  }
});

// Delete category (Admin only)
router.delete('/categories/:id', adminAuth, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    console.log('Category deleted successfully from MongoDB:', req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category from MongoDB:', error);
    res.status(500).json({ message: error.message || 'Error deleting category' });
  }
});

// Get all users (Admin only)
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user (Admin only)
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (req.user.id === userId) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all orders (Admin only)
router.get('/orders', adminAuth, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Notifications
const Notification = require('../models/Notification');

// Get notifications (Admin only - notifications without user field)
router.get('/notifications', adminAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: null })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', adminAuth, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete notification
router.delete('/notifications/:id', adminAuth, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    console.log('Notification deleted successfully from MongoDB:', req.params.id);
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

