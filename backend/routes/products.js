const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');

// Get all products (for users)
router.get('/', async (req, res) => {
  try {
    const { category, featured, search, page = 1, limit = 20 } = req.query;
    const query = { status: 'active' };

    if (category) query.category = category;
    if (featured === 'true') query.featured = true;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('reviews.user', 'name');
    if (!product || product.status !== 'active') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get related products
router.get('/:id/related', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find products in the same category, excluding the current product
    let relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      status: 'active'
    })
      .limit(4)
      .sort({ createdAt: -1 });

    // If we don't have enough related products, fill with random products
    if (relatedProducts.length < 4) {
      const additionalProducts = await Product.find({
        _id: { $ne: product._id, $nin: relatedProducts.map(p => p._id) },
        status: 'active'
      })
        .limit(4 - relatedProducts.length)
        .sort({ createdAt: -1 });

      relatedProducts = [...relatedProducts, ...additionalProducts];
    }

    res.json(relatedProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get featured products
router.get('/featured/all', async (req, res) => {
  try {
    const products = await Product.find({ featured: true, status: 'active' })
      .limit(10)
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Category.find({ status: 'active' }).sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add review to product
router.post('/:id/reviews', require('../middleware/auth').auth, async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if user already reviewed
    const existingReview = product.reviews.find(
      r => r.user.toString() === req.user.id.toString()
    );
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    product.reviews.push({
      user: req.user.id,
      rating,
      comment: comment || ''
    });

    // Update average rating
    const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.rating = totalRating / product.reviews.length;

    await product.save();
    await product.populate('reviews.user', 'name');

    // Create notification for admin
    await Notification.create({
      type: 'review',
      message: `New review on "${product.name}" by ${req.user.name}`,
      link: `/admin`,
      metadata: {
        productId: product._id,
        userId: req.user.id,
        userName: req.user.name,
        productName: product.name
      }
    });

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete review (Admin only)
router.delete('/:productId/reviews/:reviewId', require('../middleware/auth').adminAuth, async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Remove the review
    product.reviews = product.reviews.filter(
      review => review._id.toString() !== reviewId
    );

    // Recalculate average rating
    if (product.reviews.length > 0) {
      const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
      product.rating = totalRating / product.reviews.length;
    } else {
      product.rating = 0;
    }

    await product.save();
    await product.populate('reviews.user', 'name');

    console.log('Review deleted successfully from MongoDB:', reviewId);
    res.json(product);
  } catch (error) {
    console.error('Error deleting review from MongoDB:', error);
    res.status(500).json({ message: error.message || 'Error deleting review' });
  }
});

module.exports = router;

