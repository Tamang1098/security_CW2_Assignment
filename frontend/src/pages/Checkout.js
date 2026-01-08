import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import QRCodeModal from '../components/QRCodeModal';
import OrderSuccessModal from '../components/OrderSuccessModal';
import './Checkout.css';

const Checkout = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [orderNumber, setOrderNumber] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    fetchCart();
  }, [isAuthenticated, navigate]);

  const fetchCart = async () => {
    try {
      const res = await axios.get('https://localhost:5000/api/cart');
      setCart(res.data.cart || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await axios.post('https://localhost:5000/api/orders', {
        shippingAddress,
        paymentMethod
      });

      // Dispatch event for new order creation (for admin panel)
      // Dispatch event for new order creation (for admin panel)
      window.dispatchEvent(new Event('newOrderCreated'));
      window.dispatchEvent(new Event('productUpdated')); // Notify landing page to refresh stock

      localStorage.setItem('newOrderCreated', Date.now().toString());
      localStorage.setItem('productUpdated', Date.now().toString()); // Cross-tab refresh

      setTimeout(() => {
        localStorage.removeItem('newOrderCreated');
        localStorage.removeItem('productUpdated');
      }, 100);

      if (paymentMethod === 'online') {
        // Show QR modal for online payment
        setPaymentId(res.data.payment._id);
        setOrderId(res.data.order._id);
        setShowQRModal(true);
        setSubmitting(false);
        showToast(t('paymentVerificationProgress'), 'info');
      } else {
        // For COD, show success modal (like login modal style)
        setOrderNumber(res.data.order?.orderNumber);
        setShowSuccessModal(true);
        setSubmitting(false);
      }
    } catch (error) {
      showToast(error.response?.data?.message || t('errorPlacingOrder'), 'error');
      setSubmitting(false);
    }
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((total, item) => {
      if (item.product) {
        return total + (item.product.price * item.quantity);
      }
      return total;
    }, 0);
    const shipping = subtotal > 1000 ? 0 : 100;
    return { subtotal, shipping, total: subtotal + shipping };
  };

  if (loading) {
    return <div className="loading-container">{t('loading')}</div>;
  }

  if (cart.length === 0) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="empty-cart">
            <p>{t('emptyCart')}</p>
            <button onClick={() => navigate('/')} className="continue-shopping-btn">
              {t('continueShopping')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totals = calculateTotal();

  return (
    <div className="checkout-page">
      <div className="container">
        <h1>{t('checkout')}</h1>
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          paymentId={paymentId}
          amount={totals.total}
          orderId={orderId}
        />
        <OrderSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          orderNumber={orderNumber}
        />
        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="checkout-content">
            <div className="checkout-left">
              <div className="form-section">
                <h2>{t('shippingAddress')}</h2>
                <div className="form-group">
                  <label>{t('fullName')} *</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.fullName}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, fullName: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>{t('phoneNumber')} *</label>
                  <input
                    type="tel"
                    required
                    value={shippingAddress.phone}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, phone: e.target.value })
                    }
                    pattern="[0-9]{10}"
                    title="Please enter a valid 10-digit mobile number"
                  />
                </div>
                <div className="form-group">
                  <label>{t('address')} *</label>
                  <textarea
                    required
                    rows="3"
                    value={shippingAddress.address}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, address: e.target.value })
                    }
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('city')} *</label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.city}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, city: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('postalCode')}</label>
                    <input
                      type="text"
                      value={shippingAddress.postalCode}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h2>{t('paymentMethod')}</h2>
                <div className="payment-options">
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="payment-option-content">
                      <span className="payment-icon">💵</span>
                      <div>
                        <strong>{t('cashOnDelivery')}</strong>
                        <p>{t('payWhenReceive')}</p>
                      </div>
                    </div>
                  </label>
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="online"
                      checked={paymentMethod === 'online'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="payment-option-content">
                      <span className="payment-icon">📱</span>
                      <div>
                        <strong>{t('onlinePayment')}</strong>
                        <p>{t('payViaQR')}</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="checkout-right">
              <div className="order-summary">
                <h2>{t('orderSummary')}</h2>
                <div className="order-items">
                  {cart.map((item) => (
                    <div key={item._id} className="order-item">
                      <img
                        src={item.product?.image || 'https://via.placeholder.com/60'}
                        alt={item.product?.name}
                      />
                      <div className="order-item-info">
                        <p>{item.product?.name}</p>
                        <span>{t('qty')}: {item.quantity}</span>
                      </div>
                      <span className="order-item-price">
                        Rs. {(item.product?.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="order-totals">
                  <div className="total-row">
                    <span>{t('subtotal')}:</span>
                    <span>Rs. {totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="total-row">
                    <span>{t('shipping')}:</span>
                    <span>{totals.shipping === 0 ? t('free') : `Rs. ${totals.shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="total-row final-total">
                    <span>{t('total')}:</span>
                    <span>Rs. {totals.total.toFixed(2)}</span>
                  </div>
                </div>
                <button type="submit" className="place-order-btn" disabled={submitting}>
                  {submitting ? t('placingOrder') : t('placeOrder')}
                </button>
                <div className="secure-checkout-badge" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '0.85rem' }}>
                  <span style={{ marginRight: '0.5rem' }}>🔒</span>
                  Secure 256-bit SSL Encrypted Checkout
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;

