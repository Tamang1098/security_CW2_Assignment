import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminNotifications.css';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [reviewDetails, setReviewDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('https://localhost:5000/api/admin/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`https://localhost:5000/api/admin/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation(); // Prevent triggering the notification click
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }
    try {
      await axios.delete(`https://localhost:5000/api/admin/notifications/${id}`);
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert(error.response?.data?.message || 'Error deleting notification');
    }
  };

  const fetchReviewDetails = async (notification) => {
    if (notification.type !== 'review' || !notification.metadata?.productId) {
      return;
    }

    setLoadingDetails(true);
    try {
      const productRes = await axios.get(`https://localhost:5000/api/products/${notification.metadata.productId}`);
      const product = productRes.data;

      // Find the specific review - try to match by user ID
      const review = product.reviews?.find(r => {
        const reviewUserId = r.user?._id?.toString() || r.user?.toString();
        const notificationUserId = notification.metadata.userId?.toString();
        return reviewUserId === notificationUserId;
      });

      if (review) {
        setReviewDetails({
          product: {
            _id: product._id,
            name: product.name,
            image: product.image,
            images: product.images || []
          },
          review: {
            user: review.user?.name || notification.metadata.userName || 'Anonymous',
            comment: review.comment || '',
            rating: review.rating || 0,
            createdAt: review.createdAt
          }
        });
      } else {
        // If review not found, use metadata info
        setReviewDetails({
          product: {
            _id: product._id,
            name: product.name || notification.metadata.productName,
            image: product.image,
            images: product.images || []
          },
          review: {
            user: notification.metadata.userName || 'Anonymous',
            comment: 'Review details not available',
            rating: 0,
            createdAt: notification.createdAt
          }
        });
      }
    } catch (error) {
      console.error('Error fetching review details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    markAsRead(notification._id);

    if (notification.type === 'review') {
      await fetchReviewDetails(notification);
      setSelectedNotification(notification);
      setShowDetailModal(true);
    } else {
      // For other notification types, just mark as read
      setShowDropdown(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/300';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    if (imagePath.startsWith('/uploads/')) {
      return `https://localhost:5000${imagePath}`;
    }
    return imagePath;
  };

  return (
    <>
      <div className="admin-notifications-container">
        <button
          className="notification-icon-btn"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          🔔
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </button>

        {showDropdown && (
          <div className="notification-dropdown">
            <div className="notification-dropdown-header">
              <h3>Notifications</h3>
              <button
                className="close-dropdown-btn"
                onClick={() => setShowDropdown(false)}
              >
                ×
              </button>
            </div>
            <div className="notification-list">
              {notifications.length === 0 ? (
                <p className="no-notifications">No notifications</p>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-content">
                      <p className="notification-message">{notification.message}</p>
                      <span className="notification-time">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {notification.type === 'review' && (
                        <span className="notification-type-badge">Review</span>
                      )}
                      <button
                        onClick={(e) => deleteNotification(notification._id, e)}
                        className="delete-notification-btn"
                        style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.25rem 0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                        title="Delete notification"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Review Detail Modal */}
      {showDetailModal && reviewDetails && (
        <div className="review-detail-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="review-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setShowDetailModal(false)}
            >
              ×
            </button>
            <h2>Review Details</h2>

            {loadingDetails ? (
              <div className="loading-details">Loading...</div>
            ) : (
              <>
                <div className="review-product-info">
                  <div className="review-product-image">
                    <img
                      src={getImageUrl(reviewDetails.product.image)}
                      alt={reviewDetails.product.name}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/200';
                      }}
                    />
                  </div>
                  <div className="review-product-details">
                    <h3>{reviewDetails.product.name}</h3>
                    <p className="product-id">Product ID: {reviewDetails.product._id}</p>
                  </div>
                </div>

                <div className="review-user-info">
                  <h4>Review by:</h4>
                  <p className="reviewer-name">{reviewDetails.review.user}</p>
                </div>

                {reviewDetails.review.rating > 0 && (
                  <div className="review-rating">
                    <h4>Rating:</h4>
                    <div className="rating-stars">
                      {'★'.repeat(Math.floor(reviewDetails.review.rating))}
                      {'☆'.repeat(5 - Math.floor(reviewDetails.review.rating))}
                      <span className="rating-value">({reviewDetails.review.rating})</span>
                    </div>
                  </div>
                )}

                {reviewDetails.review.comment && (
                  <div className="review-comment-section">
                    <h4>Review Comment:</h4>
                    <p className="review-comment-text">{reviewDetails.review.comment}</p>
                  </div>
                )}

                <div className="review-date">
                  <span>Submitted: {new Date(reviewDetails.review.createdAt).toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminNotifications;
