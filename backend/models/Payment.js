const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    unique: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  method: {
    type: String,
    enum: ['cod', 'online'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'pending_verification', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  // For online payments
  qrCode: String,
  qrCodeData: String,
  transactionId: String,
  // For COD
  paymentDate: Date,
  notes: String
}, {
  timestamps: true
});

// Generate payment ID before saving
paymentSchema.pre('save', async function (next) {
  if (!this.isNew || this.paymentId) {
    return next();
  }

  try {
    let paymentId;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      paymentId = `PAY-${timestamp}-${random}`;

      const existing = await mongoose.model('Payment').findOne({ paymentId });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    this.paymentId = paymentId || `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    next();
  } catch (error) {
    // Fallback payment ID if there's an error
    this.paymentId = `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    next();
  }
});

module.exports = mongoose.model('Payment', paymentSchema);

