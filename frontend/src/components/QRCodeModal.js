import React, { useRef, useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import OrderSuccessModal from './OrderSuccessModal';
import './QRCodeModal.css';


import qrCodeImageSrc from '../assets/paymentQR.jpg';

const QRCodeModal = ({ isOpen, onClose, paymentId, amount, orderId }) => {
  const { showToast } = useToast();
  const { t } = useLanguage();


  const paymentConfirmedRef = useRef(false);

  const navigationTimeoutRef = useRef(null);

  const isClosingRef = useRef(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null);

  const handlePaymentDone = async () => {

    if (isClosingRef.current) {
      return;
    }


    paymentConfirmedRef.current = false;
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }

    try {

      const res = await axios.post(`https://localhost:5000/api/payments/${paymentId}/confirm`);


      if (isClosingRef.current) {
        return;
      }


      paymentConfirmedRef.current = true;


      if (res?.data?.orderNumber || res?.data?.order?.orderNumber) {
        setOrderNumber(res.data.orderNumber || res.data.order.orderNumber);
      }


      if (onClose) {
        onClose();
      }


      if (!isClosingRef.current) {
        setShowSuccessModal(true);
      }
    } catch (error) {

      console.error('Error confirming payment:', error);
      showToast(error.response?.data?.message || t('errorConfirmingPayment'), 'error');

      paymentConfirmedRef.current = false;
    }
  };

  const handleClose = (e) => {

    if (e) {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation && typeof e.stopImmediatePropagation === 'function') {
        e.stopImmediatePropagation();
      }
    }

    console.log('X button clicked - cancelling order and closing modal WITHOUT navigation');


    isClosingRef.current = true;


    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }


    paymentConfirmedRef.current = false;



    if (orderId) {
      console.log('Deleting order:', orderId);

      axios.delete(`https://localhost:5000/api/orders/${orderId}`)
        .then(() => {
          console.log('Order cancelled successfully - order deleted from database');
        })
        .catch((error) => {
          console.error('Error cancelling order:', error);

        });
    } else {
      console.log('No orderId provided - skipping order deletion');
    }



    if (onClose) {
      onClose();
    }





    return;
  };


  useEffect(() => {
    if (!isOpen) {

      isClosingRef.current = true;

      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
      paymentConfirmedRef.current = false;
    } else {

      isClosingRef.current = false;
    }

    return () => {

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