import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import './OrderHistory.css';

const OrderHistory = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    fetchOrders();
    fetchNotifications(false); // Don't show toast on initial load
    // Poll for notifications and orders every 3 seconds for faster updates
    const interval = setInterval(() => {
      fetchNotifications(true); // Show toast for new notifications
      fetchOrders();
    }, 3000);

    // Listen for order status updates from admin - immediate update
    const handleOrderStatusUpdate = () => {
      console.log('Order status update event received - fetching orders and notifications');
      fetchOrders();
      fetchNotifications(true); // Show toast for new notifications
    };
    window.addEventListener('orderStatusUpdated', handleOrderStatusUpdate);

    // Listen for localStorage events (cross-tab communication) - immediate update
    const handleStorageChange = (e) => {
      if (e.key === 'orderStatusUpdated' || e.key === 'paymentVerified' || e.key === 'notificationUpdated') {
        console.log('Storage change detected:', e.key, '- fetching orders and notifications');
        fetchOrders();
        fetchNotifications(true); // Show toast for new notifications
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Listen for notification updates - immediate update
    const handleNotificationUpdate = () => {
      console.log('Notification update event received - fetching notifications');
      fetchNotifications(true); // Show toast for new notifications
    };
    window.addEventListener('notificationUpdated', handleNotificationUpdate);

    // Listen for payment verification - immediate update
    const handlePaymentVerified = () => {
      console.log('Payment verified event received - fetching orders and notifications');
      fetchOrders();
      fetchNotifications(true); // Show toast for payment success
    };
    window.addEventListener('paymentVerified', handlePaymentVerified);

    return () => {
      clearInterval(interval);
      window.removeEventListener('orderStatusUpdated', handleOrderStatusUpdate);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('notificationUpdated', handleNotificationUpdate);
      window.removeEventListener('paymentVerified', handlePaymentVerified);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, navigate]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('https://localhost:5000/api/orders/my-orders');
      setOrders(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };

  const notificationsRef = React.useRef(notifications);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const fetchNotifications = async (showPaymentToast = true) => {
    try {
      const res = await axios.get('https://localhost:5000/api/auth/notifications');
      const newNotifications = res.data;

      // Check for new payment/order notifications
      if (showPaymentToast) {
        const currentNotifications = notificationsRef.current;
        const previousNotificationIds = currentNotifications.length > 0 ? currentNotifications.map(n => n._id) : [];
        const newPaymentNotifications = newNotifications.filter(n =>
          !previousNotificationIds.includes(n._id) &&
          (n.type === 'payment' || (n.type === 'order' && n.message.includes('processing'))) &&
          (n.message.includes('Payment') || n.message.includes('processing') || n.message.includes('received'))
        );

        // Show toast for new payment/processing notifications
        if (newPaymentNotifications.length > 0) {
          const firstNotification = newPaymentNotifications[0];
          if (firstNotification.message.includes('processing') || firstNotification.message.includes('received')) {
            showToast('Payment received! Your order is being processed.', 'success', 1000);
          } else {
            showToast(t('paymentSuccessful'), 'success', 1000);
          }
        }
      }

      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId, notificationLink) => {
    try {
      await axios.put(`https://localhost:5000/api/auth/notifications/${notificationId}/read`);
      // Immediately update notifications to hide the clicked one
      setNotifications(prev => prev.map(n =>
        n._id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
      // Fetch fresh notifications and orders to update status
      fetchNotifications();
      fetchOrders();
      // Dispatch event to update navbar badge
      window.dispatchEvent(new Event('notificationUpdated'));
      localStorage.setItem('notificationUpdated', Date.now().toString());
      setTimeout(() => localStorage.removeItem('notificationUpdated'), 100);
      // Don't navigate - just hide the notification and show updated order status below
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`https://localhost:5000/api/auth/notifications/${notificationId}`);
      // Immediately remove notification from state
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
      // Fetch fresh notifications
      fetchNotifications();
      // Dispatch event to update navbar badge
      window.dispatchEvent(new Event('notificationUpdated'));
      localStorage.setItem('notificationUpdated', Date.now().toString());
      setTimeout(() => localStorage.removeItem('notificationUpdated'), 100);
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert(error.response?.data?.message || 'Error deleting notification');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffa500',
      confirmed: '#667eea',
      processing: '#667eea',
      shipped: '#2196F3',
      delivered: '#4CAF50',
      pending_verification: '#2196F3',
      cancelled: '#ff4444'
    };
    return colors[status] || '#666';
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/60';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath.replace('http://', 'https://');
    }
    if (imagePath.startsWith('/uploads/')) {
      return `https://localhost:5000${imagePath}`;
    }
    // Handle case where imagePath might be just the filename without /uploads/
    if (!imagePath.includes('://') && !imagePath.startsWith('/')) {
      return `https://localhost:5000/uploads/${imagePath}`;
    }
    return imagePath;
  };

  if (loading) {
    return <div className="loading-container">{t('loading')} {t('myOrders').toLowerCase()}...</div>;
  }

  // Filter unread notifications (show in red at top)
  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <div className="order-history-page">
      <div className="container">
        <h1>My Orders</h1>

        {/* Notifications Section - Red at top */}
        {unreadNotifications.length > 0 && (
          <div className="notifications-section">
            <h2 style={{ color: '#dc3545', marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 700 }}>
              🔔 New Notifications ({unreadCount})
            </h2>
            <div className="notifications-list">
              {unreadNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className="notification-item-unread"
                  onClick={() => markAsRead(notification._id, notification.link)}
                  style={{
                    backgroundColor: '#fff5f5',
                    border: '2px solid #dc3545',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffe0e0';
                    e.currentTarget.style.transform = 'translateX(5px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff5f5';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        color: '#dc3545',
                        fontWeight: 700,
                        margin: '0 0 0.5rem 0',
                        fontSize: '1rem'
                      }}>
                        {notification.message}
                      </p>
                      <small style={{ color: '#666', fontSize: '0.85rem' }}>
                        {new Date(notification.createdAt).toLocaleString()}
                      </small>
                    </div>
                    <button
                      onClick={(e) => deleteNotification(notification._id, e)}
                      style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.25rem 0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        marginLeft: '0.5rem'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="no-orders">
            <p>{t('noOrdersYet')}</p>
            <button onClick={() => navigate('/')} className="shop-now-btn">
              {t('shopNow')}
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div>
                    <h3>{t('orderNumber')} #{order.orderNumber}</h3>
                    <div className="order-date-time">
                      <p className="order-date">
                        📅 {new Date(order.createdAt).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="order-time">
                        🕐 {new Date(order.createdAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="order-status-badge" style={{ backgroundColor: getStatusColor(order.orderStatus) }}>
                    {order.orderStatus.toUpperCase()}
                  </div>
                </div>
                <div className="order-items-details">
                  <h4 className="order-items-title">{t('orderedItems')}:</h4>
                  <div className="order-items-list">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="order-item-detail">
                        <img
                          src={getImageUrl(item.image || item.product?.image)}
                          alt={item.name || item.product?.name}
                          className="order-item-image"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/60'; }}
                        />
                        <div className="order-item-info">
                          <p className="order-item-name">{item.name || item.product?.name}</p>
                          {item.size && <p className="order-item-size" style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 0.25rem 0' }}>Size: {item.size}</p>}
                          <p className="order-item-quantity">{t('quantity')}: {item.quantity}</p>
                          <p className="order-item-price">Rs. {((item.price || item.product?.price || 0) * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="order-footer">
                  <div className="order-total">
                    <strong>{t('totalPrice')}: Rs. {order.total.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;

