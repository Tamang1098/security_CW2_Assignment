import React, { useRef, useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import OrderSuccessModal from './OrderSuccessModal';
import './QRCodeModal.css';

// Import QR code image from assets folder
import qrCodeImageSrc from '../assets/paymentQR.jpg';

const QRCodeModal = ({ isOpen, onClose, paymentId, amount, orderId }) => {
  const { showToast } = useToast();
  const { t } = useLanguage();

  // Track if payment was successfully confirmed - use ref to persist across renders
  const paymentConfirmedRef = useRef(false);
  // Track navigation timeout to cancel it if modal closes
  const navigationTimeoutRef = useRef(null);
  // Track if modal is being closed (not via payment done) - set this IMMEDIATELY when X is clicked
  const isClosingRef = useRef(false);
  // Track if success modal should show
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null);

  const handlePaymentDone = async () => {
    // Check if modal is already closing - if so, don't do anything
    if (isClosingRef.current) {
      return;
    }

    // Reset the flag and clear any existing timeout
    paymentConfirmedRef.current = false;
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }

    try {
      // Mark payment as done
      const res = await axios.post(`https://localhost:5000/api/payments/${paymentId}/confirm`);

      // Check again if modal is closing - if user clicked X during API call, don't navigate
      if (isClosingRef.current) {
        return;
      }

      // Mark payment as confirmed - ONLY if API call succeeds
      paymentConfirmedRef.current = true;

      // Get order number from response if available
      if (res?.data?.orderNumber || res?.data?.order?.orderNumber) {
        setOrderNumber(res.data.orderNumber || res.data.order.orderNumber);
      }

      // Close QR modal first
      if (onClose) {
        onClose();
      }

      // Show success popup modal (like login modal style)
      if (!isClosingRef.current) {
        setShowSuccessModal(true);
      }
    } catch (error) {
      // If there's an error, show error message and DON'T navigate
      console.error('Error confirming payment:', error);
      showToast(error.response?.data?.message || t('errorConfirmingPayment'), 'error');
      // Don't navigate on error - let user try again or go back
      paymentConfirmedRef.current = false;
    }
  };

  const handleClose = (e) => {
    // Prevent all default behaviors and stop all event propagation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation && typeof e.stopImmediatePropagation === 'function') {
        e.stopImmediatePropagation();
      }
    }

    console.log('X button clicked - cancelling order and closing modal WITHOUT navigation');

    // CRITICAL: Mark that we're closing IMMEDIATELY - this prevents any navigation
    isClosingRef.current = true;

    // CRITICAL: Cancel any pending navigation FIRST - do this immediately
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }

    // Reset payment confirmation flag - prevent any navigation
    paymentConfirmedRef.current = false;

    // Delete the order if it was created (user cancelled payment)
    // Do this in background - don't wait for it to complete
    if (orderId) {
      console.log('Deleting order:', orderId);
      // Delete order in background - don't wait for it
      axios.delete(`https://localhost:5000/api/orders/${orderId}`)
        .then(() => {
          console.log('Order cancelled successfully - order deleted from database');
        })
        .catch((error) => {
          console.error('Error cancelling order:', error);
          // Don't show error to user - just log it
        });
    } else {
      console.log('No orderId provided - skipping order deletion');
    }

    // Close modal - this should NOT trigger any navigation
    // The onClose callback should only set modal state to false
    if (onClose) {
      onClose();
    }

    // CRITICAL: Do NOT navigate anywhere - user stays on checkout/product page
    // ABSOLUTELY NO navigate() call here - we explicitly avoid it
    // Return immediately - no navigation will happen
    // The order is deleted, modal is closed, user stays on current page
    return;
  };

  // Cleanup timeout when component unmounts or modal closes
  useEffect(() => {
    if (!isOpen) {
      // Modal is closing - cancel any pending navigation IMMEDIATELY
      isClosingRef.current = true;

      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
      paymentConfirmedRef.current = false;
    } else {
      // Modal is opening - reset closing flag
      isClosingRef.current = false;
    }

    return () => {
      // Cleanup on unmount
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
      isClosingRef.current = true;
      paymentConfirmedRef.current = false;
    };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div className="qr-modal-overlay">
          <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="qr-modal-close"
              onClick={handleClose}
              type="button"
            >×</button>
            <h2>{t('onlinePayment')}</h2>
            <div className="qr-amount-section">
              <p className="qr-amount-label">{t('totalAmount')}:</p>
              <p className="qr-amount-value">NRs. {amount.toFixed(2)}</p>
            </div>
            <div className="qr-instruction">
              <p>{t('scanQRCode')}</p>
            </div>
            <div className="qr-remarks">
              <p className="qr-remarks-text">{t('remarks')}</p>
            </div>
            <div className="qr-code-container">
              <img
                src={qrCodeImageSrc}
                alt="QR Code"
                className="qr-code-image"
                onError={(e) => {
                  // Fallback if image not found
                  console.error('QR code image failed to load:', e);
                  e.target.src = '/qr-code.png';
                }}
              />
            </div>
            <div className="qr-modal-buttons">
              <button onClick={handlePaymentDone} className="qr-payment-done-btn">
                {t('paymentDone')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal - shows after payment is done, rendered outside QR modal */}
      <OrderSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
        }}
        orderNumber={orderNumber}
      />
    </>
  );
};

export default QRCodeModal;

