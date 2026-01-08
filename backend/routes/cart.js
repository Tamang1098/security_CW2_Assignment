const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

// Get cart
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('cart.product');
    res.json({ cart: user.cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add to cart
router.post('/add', auth, async (req, res) => {
  try {
    const { productId, quantity = 1, size } = req.body;
    const user = await User.findById(req.user.id);

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const existingItem = user.cart.find(
      item => item.product.toString() === productId && (item.size === size || (!item.size && !size))
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.push({ product: productId, quantity, size });
    }

    await user.save();
    await user.populate('cart.product');
    res.json({ cart: user.cart, message: 'Product added to cart' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update cart item quantity
router.put('/update/:itemId', auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    const user = await User.findById(req.user.id);

    const item = user.cart.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    if (quantity <= 0) {
      user.cart.pull(req.params.itemId);
    } else {
      item.quantity = quantity;
    }

    await user.save();
    await user.populate('cart.product');
    res.json({ cart: user.cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove from cart
router.delete('/remove/:itemId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.cart.pull(req.params.itemId);
    await user.save();
    await user.populate('cart.product');
    res.json({ cart: user.cart, message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Clear cart
router.delete('/clear', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.cart = [];
    await user.save();
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

