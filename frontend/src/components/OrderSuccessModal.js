import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OrderSuccessModal.css';

const OrderSuccessModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // Progress bar animation
      const duration = 1000; // 1 second
      const interval = 20; // Update every 20ms
      const increment = (100 / (duration / interval));

      const progressTimer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressTimer);
            return 100;
          }
          return prev + increment;
        });
      }, interval);

      // Auto navigate to orders after 2 seconds
      const redirectTimer = setTimeout(() => {
        navigate('/orders');
        onClose();
      }, duration);

      return () => {
        clearInterval(progressTimer);
        clearTimeout(redirectTimer);
        setProgress(0);
      };
    }
  }, [isOpen, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="order-success-modal-overlay">
      <div className="order-success-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="order-success-modal-close" onClick={onClose}>×</button>
        <div className="order-success-icon">✓</div>
        <h2>Payment Submitted</h2>
        <p style={{ margin: '10px 0', color: '#666' }}>Your payment is being verified by our admin. You will be notified once it's confirmed.</p>
        <div className="order-progress-bar">
          <div className="order-progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="redirecting-text">Redirecting to My Orders...</p>
      </div>
    </div>
  );
};

export default OrderSuccessModal;
