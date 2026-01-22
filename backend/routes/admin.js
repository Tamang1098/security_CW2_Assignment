const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const Order = require('../models/Order');
const { adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');


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


    if (!name || !price || !category) {
      return res.status(400).json({ message: 'Name, price, and category are required' });
    }


    let imageUrl = 'https://via.placeholder.com/300';
    if (req.files && req.files['image'] && req.files['image'][0]) {

      imageUrl = `/uploads/${req.files['image'][0].filename}`;
    } else if (req.body.image) {

      imageUrl = req.body.image;
    }

    const additionalImages = [];
    if (req.files && req.files['images']) {
      req.files['images'].forEach(file => {
        additionalImages.push(`/uploads/${file.filename}`);
      });
    }

    if (req.body.images) {
      const imageUrls = Array.isArray(req.body.images)
        ? req.body.images
        : req.body.images.split(',').map(url => url.trim()).filter(url => url);
      additionalImages.push(...imageUrls);
    }

    const product = new Product({
      name,
      description: req.body.description || '',
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

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      console.error('Validation Errors:', validationErrors);
      return res.status(400).json({ message: `Validation Error: ${validationErrors.join(', ')}` });
    }
    res.status(500).json({ message: error.message || 'Error creating product' });
  }
});


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
      description: req.body.description || '',
      price: parseFloat(price),
      category,
      stock: parseInt(stock) || 0,
      sizes: req.body.sizes ? (Array.isArray(req.body.sizes) ? req.body.sizes : req.body.sizes.split(',').map(s => s.trim()).filter(s => s)) : [],
      featured: featured === 'true' || featured === true
    };


    if (req.files && req.files['image'] && req.files['image'][0]) {
      updateData.image = `/uploads/${req.files['image'][0].filename}`;
    } else if (req.body.image) {
      updateData.image = req.body.image;
    }


    const newImageFiles = req.files && req.files['images'] ? req.files['images'] : [];

    let existingImageUrls = [];
    if (req.body.existingImages) {
      if (Array.isArray(req.body.existingImages)) {
        existingImageUrls = req.body.existingImages;
      } else if (typeof req.body.existingImages === 'string') {

        try {
          existingImageUrls = JSON.parse(req.body.existingImages);
        } catch {
          existingImageUrls = [req.body.existingImages];
        }
      }
    }

    if (newImageFiles.length > 0 || existingImageUrls.length > 0) {

      const newImageUrls = newImageFiles.map(file =>
        `/uploads/${file.filename}`
      );


      const allImages = [...existingImageUrls, ...newImageUrls];

      updateData.images = Array.from(new Set(allImages));
    } else if (req.body.images !== undefined) {

      if (req.body.images === '' || req.body.images === null) {

        updateData.images = [];
      } else {
        const imageUrls = Array.isArray(req.body.images)
          ? req.body.images
          : req.body.images.split(',').map(url => url.trim()).filter(url => url);
        updateData.images = imageUrls;
      }
    }


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


router.get('/products', adminAuth, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});




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


router.get('/categories', adminAuth, async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.put('/categories/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name } = req.body;
    const updateData = { name };


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


router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;


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


const Notification = require('../models/Notification');


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