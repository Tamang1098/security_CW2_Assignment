import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import './OrderDetails.css';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [qrCode, setQrCode] = useState(location.state?.qrCode);
  const [loading, setLoading] = useState(true);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    fetchOrderDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthenticated, navigate]);

  const fetchOrderDetails = async () => {
    try {
      const res = await axios.get(`https://localhost:5000/api/orders/${id}`);
      setOrder(res.data);
      if (res.data.payment) {
        setPayment(res.data.payment);
        if (res.data.payment.method === 'online' && !qrCode && res.data.payment.status === 'pending') {
          generateQRCode(res.data.payment._id);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching order:', error);
      setLoading(false);
    }
  };

  const generateQRCode = async (paymentId) => {
    try {
      const res = await axios.post(
        `https://localhost:5000/api/payments/${paymentId}/generate-qr`
      );
      setQrCode(res.data.qrCode);
      setPayment(prev => ({ ...prev, qrCode: res.data.qrCode }));
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const confirmPayment = async () => {
    if (!window.confirm(t('haveYouCompletedPayment'))) {
      return;
    }
    setConfirmingPayment(true);
    try {
      await axios.post(`https://localhost:5000/api/payments/${payment._id}/confirm`);
      alert(t('paymentConfirmedAlert'));
      fetchOrderDetails();
    } catch (error) {
      alert(error.response?.data?.message || t('errorConfirmingPayment'));
    } finally {
      setConfirmingPayment(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffa500',
      confirmed: '#667eea',
      processing: '#667eea',
      shipped: '#2196F3',
      delivered: '#4CAF50',
      cancelled: '#ff4444',
      paid: '#4CAF50',
      pending_verification: '#2196F3',
      failed: '#ff4444'
    };
    return colors[status] || '#666';
  };

  if (loading) {
    return <div className="loading-container">{t('loadingOrderDetails')}</div>;
  }

  if (!order) {
    return (
      <div className="order-details-page">
        <div className="container">
          <p>{t('orderNotFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-details-page">
      <div className="container">
        <button onClick={() => navigate('/orders')} className="back-btn">
          ← {t('backToOrders')}
        </button>
        <h1>{t('orderDetails')}</h1>
        <div className="order-details-content">
          <div className="order-info-section">
            <div className="info-card">
              <h2>{t('orderInformation')}</h2>
              <div className="info-row">
                <span>{t('orderNumber')}:</span>
                <strong>{order.orderNumber}</strong>
              </div>
              <div className="info-row">
                <span>{t('orderDate')}:</span>
                <span>{new Date(order.createdAt).toLocaleString()}</span>
              </div>
              <div className="info-row">
                <span>{t('orderStatus')}:</span>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(order.orderStatus) }}
                >
                  {order.orderStatus.toUpperCase()}
                </span>
              </div>
              <div className="info-row">
                <span>{t('paymentStatus')}:</span>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(order.paymentStatus) }}
                >
                  {order.paymentStatus.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="info-card">
              <h2>{t('shippingAddress')}</h2>
              <p><strong>{order.shippingAddress.fullName}</strong></p>
              <p>{order.shippingAddress.address}</p>
              <p>
                {order.shippingAddress.city}
                {order.shippingAddress.postalCode && `, ${order.shippingAddress.postalCode}`}
              </p>
              <p>{t('phone')}: {order.shippingAddress.phone}</p>
            </div>

            <div className="info-card">
              <h2>{t('orderItems')}</h2>
              <div className="order-items-list">
                {order.items.map((item, idx) => (
                  <div key={idx} className="order-item-detail">
                    <img
                      src={item.image || item.product?.image}
                      alt={item.name || item.product?.name}
                    />
                    <div className="item-details">
                      <h4>{item.name || item.product?.name}</h4>
                      {item.size && <p style={{ fontSize: '0.9rem', color: '#666', margin: '0.2rem 0' }}>{t('size') || 'Size'}: {item.size}</p>}
                      <p>{t('quantity')}: {item.quantity}</p>
                      <p className="item-price">Rs. {item.price} {t('each')}</p>
                    </div>
                    <div className="item-total">
                      Rs. {(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="order-summary-section">
            <div className="summary-card">
              <h2>{t('orderSummary')}</h2>
              <div className="summary-row">
                <span>{t('subtotal')}:</span>
                <span>Rs. {order.subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>{t('shipping')}:</span>
                <span>{order.shippingFee === 0 ? t('free') : `Rs. ${order.shippingFee.toFixed(2)}`}</span>
              </div>
              <div className="summary-row total">
                <span>{t('total')}:</span>
                <span>Rs. {order.total.toFixed(2)}</span>
              </div>
            </div>

            {payment && payment.method === 'online' && payment.status === 'pending' && (
              <div className="payment-card">
                <h2>{t('paymentViaQR')}</h2>
                {qrCode ? (
                  <>
                    <div className="qr-code-container">
                      <img src={qrCode} alt="QR Code" className="qr-code" />
                    </div>
                    <p className="payment-instructions">
                      {t('scanQRCodePayment')}
                    </p>
                    <button
                      onClick={confirmPayment}
                      className="confirm-payment-btn"
                      disabled={confirmingPayment}
                    >
                      {confirmingPayment ? t('confirming') : t('iHavePaid')}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => generateQRCode(payment._id)}
                    className="generate-qr-btn"
                  >
                    {t('generateQRCode')}
                  </button>
                )}
              </div>
            )}

            {payment && payment.method === 'cod' && (
              <div className="payment-card">
                <h2>{t('cashOnDelivery')}</h2>
                <p>{t('youWillPayWhenReceive')}</p>
                <p className="cod-amount">{t('amount')}: Rs. {order.total.toFixed(2)}</p>
              </div>
            )}

            {payment && payment.status === 'paid' && (
              <div className="payment-card success">
                <h2>✓ {t('paymentConfirmed')}</h2>
                <p>{t('paymentConfirmedMessage')}</p>
              </div>
            )}

            {payment && payment.status === 'pending_verification' && (
              <div className="payment-card processing">
                <h2>⏳ Verification Required</h2>
                <p>Your payment has been submitted and is currently being verified by our admin. Please check back soon.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;

