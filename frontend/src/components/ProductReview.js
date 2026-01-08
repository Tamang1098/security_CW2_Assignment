import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './ProductReview.css';

const ProductReview = ({ product, onReviewAdded }) => {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please login to submit a review');
      return;
    }
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`https://localhost:5000/api/products/${product._id}/reviews`, {
        rating,
        comment
      });
      setRating(0);
      setComment('');
      setShowForm(false);
      if (onReviewAdded) onReviewAdded();
      // Dispatch events to refresh product detail page
      window.dispatchEvent(new Event('reviewUpdated'));
      window.dispatchEvent(new CustomEvent('productUpdatedId', { detail: { productId: product._id } }));
      // Trigger localStorage change for cross-tab communication
      localStorage.setItem('reviewUpdated', Date.now().toString());
      localStorage.removeItem('reviewUpdated');
      localStorage.setItem('productUpdatedId', product._id);
      setTimeout(() => localStorage.removeItem('productUpdatedId'), 100);
      alert('Review submitted successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!isAdmin) return;
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      await axios.delete(`https://localhost:5000/api/products/${product._id}/reviews/${reviewId}`);
      if (onReviewAdded) onReviewAdded();
      // Dispatch events to refresh product detail page
      window.dispatchEvent(new Event('reviewUpdated'));
      window.dispatchEvent(new CustomEvent('productUpdatedId', { detail: { productId: product._id } }));
      // Trigger localStorage change for cross-tab communication
      localStorage.setItem('reviewUpdated', Date.now().toString());
      localStorage.removeItem('reviewUpdated');
      localStorage.setItem('productUpdatedId', product._id);
      setTimeout(() => localStorage.removeItem('productUpdatedId'), 100);
      alert('Review deleted successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting review');
    }
  };

  // eslint-disable-next-line no-unused-vars
  const averageRating = product.reviews && product.reviews.length > 0
    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
    : product.rating || 0;

  // Don't show reviews section if there are no reviews
  if (!product.reviews || product.reviews.length === 0) {
    return null;
  }

  return (
    <div className="product-reviews">
      <div className="reviews-header">
        <h3>Reviews ({product.reviews?.length || 0})</h3>
      </div>

      {!isAuthenticated && (
        <div className="login-prompt">
          <p>Please log in to write a review</p>
        </div>
      )}

      {isAuthenticated && (
        <button
          className="add-review-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Write a Review'}
        </button>
      )}

      {showForm && isAuthenticated && (
        <form onSubmit={handleSubmit} className="review-form">
          <div className="rating-input">
            <label>Rating:</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${star <= rating ? 'filled' : ''}`}
                  onClick={() => setRating(star)}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <div className="comment-input">
            <label>Your Review:</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              rows="4"
            />
          </div>
          <button type="submit" className="submit-review-btn" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      <div className="reviews-list">
        {product.reviews.map((review, index) => (
          <div key={review._id || index} className="review-item">
            <div className="review-header">
              <span className="reviewer-name">{review.user?.name || 'Anonymous'}</span>
              <span className="review-rating">
                {'★'.repeat(review.rating)}
                {'☆'.repeat(5 - review.rating)}
              </span>
              <span className="review-date">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
              {isAdmin && (
                <button
                  className="delete-review-btn"
                  onClick={() => handleDeleteReview(review._id)}
                  title="Delete Review (Admin Only)"
                >
                  ×
                </button>
              )}
            </div>
            {review.comment && (
              <p className="review-comment">{review.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductReview;

