const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');
const { adminAuth } = require('../middleware/auth');


router.post('/:paymentId/generate-qr', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate('order')
      .populate('user');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }


    if (payment.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (payment.method !== 'online') {
      return res.status(400).json({ message: 'QR code only for online payments' });
    }


    const paymentData = {
      paymentId: payment.paymentId,
      orderNumber: payment.order.orderNumber,
      amount: payment.amount,
      merchant: 'E-Commerce Store'
    };

    const qrDataString = JSON.stringify(paymentData);


    const qrCodeDataURL = await QRCode.toDataURL(qrDataString, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });


    payment.qrCode = qrCodeDataURL;
    payment.qrCodeData = qrDataString;
    await payment.save();

    res.json({
      qrCode: qrCodeDataURL,
      paymentData: paymentData,
      paymentId: payment.paymentId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get('/:paymentId', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate('order')
      .populate('user', 'name email');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }


    if (payment.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.post('/:paymentId/confirm', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate('order');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (payment.status === 'paid') {
      return res.status(400).json({ message: 'Payment already confirmed' });
    }


    payment.status = 'pending_verification';
    payment.paymentDate = new Date();
    payment.transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    await payment.save();


    const order = payment.order;
    order.paymentStatus = 'pending_verification';

    await order.save();


    await order.populate('user', 'name email');

    res.json({
      message: 'Payment confirmed successfully',
      payment,
      order,
      orderNumber: order.orderNumber
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.put('/:paymentId/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;


    const payment = await Payment.findByIdAndUpdate(
      req.params.paymentId,
      { status },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }


    await payment.populate('order');
    await payment.populate('user', 'name email');


    let orderStatusSet = false;
    if (payment.order) {
      payment.order.paymentStatus = status;

      if (status === 'paid') {

        const setToProcessing = req.body.setOrderStatus === 'processing' || req.query.setOrderStatus === 'processing';
        if (setToProcessing) {
          payment.order.orderStatus = 'processing';
          orderStatusSet = true;
        } else {
          payment.order.orderStatus = 'confirmed';
        }
      }
      await payment.order.save();
    }



    const skipNotification = req.query.skipNotification === 'true' || req.body.skipNotification === true;


    let userId = null;
    if (payment.user) {
      if (typeof payment.user === 'object' && payment.user._id) {
        userId = payment.user._id.toString();
      } else {
        userId = payment.user.toString();
      }
    }

    console.log('Payment status update:', {
      status,
      paymentMethod: payment.method,
      hasUserId: !!userId,
      userId: userId,
      hasOrder: !!payment.order,
      skipNotification,
      orderStatusSet
    });

    if (status === 'paid' && userId && !skipNotification && payment.method !== 'cod' && payment.order) {
      try {
        const Notification = require('../models/Notification');
        const order = payment.order;

        if (!order || !order.orderNumber) {
          console.error('Order or orderNumber is missing:', order);
        } else {
          const date = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
          const time = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          });


          const notificationMessage = orderStatusSet
            ? `✅ Payment Verified! We have received your payment for Order #${order.orderNumber}. We are now processing your order and getting it ready. Thank you for shopping with us! 🛍️ - ${date}, ${day}, ${time}`
            : `✅ Payment Successful! Your payment for Order #${order.orderNumber} has been verified and your order is now confirmed. - ${date}, ${day}, ${time}`;

          const notification = await Notification.create({
            type: 'payment',
            message: notificationMessage,
            user: userId,
            link: `/orders/${order._id}`,
            metadata: {
              orderId: order._id,
              paymentId: payment._id,
              paymentStatus: 'verified'
            }
          });
          console.log('✅ Notification created successfully:', {
            notificationId: notification._id,
            userId: userId,
            orderNumber: order.orderNumber,
            message: notificationMessage.substring(0, 50) + '...'
          });
        }
      } catch (notifError) {
        console.error('❌ Error creating notification:', notifError);

      }
    } else {
      console.log('⚠️ Notification skipped:', {
        statusIsPaid: status === 'paid',
        hasUserId: !!userId,
        skipNotification,
        isCod: payment.method === 'cod',
        hasOrder: !!payment.order
      });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('user', 'name email')
      .populate('order')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;