const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    price: Number,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    image: String,
    size: {
      type: String,
      trim: true
    }
  }],
  shippingAddress: {
    fullName: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    postalCode: String
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'online'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'pending_verification', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  shippingFee: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  }
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function (next) {
  if (!this.isNew || this.orderNumber) {
    return next();
  }

  try {
    let orderNumber;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      orderNumber = `ORD-${timestamp}-${random}`;

      const existing = await mongoose.model('Order').findOne({ orderNumber });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    this.orderNumber = orderNumber || `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    next();
  } catch (error) {
    // Fallback order number if there's an error
    this.orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    next();
  }
});

module.exports = mongoose.model('Order', orderSchema);

