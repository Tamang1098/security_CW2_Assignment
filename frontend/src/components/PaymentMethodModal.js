import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './PaymentMethodModal.css';

const PaymentMethodModal = ({ isOpen, onClose, onSelectMethod, totalAmount }) => {
  const { t } = useLanguage();
  const [selectedMethod, setSelectedMethod] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedMethod) {
      onSelectMethod(selectedMethod);
    }
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="payment-modal-close" onClick={onClose}>×</button>
        <h2>{t('selectPaymentMethod')}</h2>
        <div className="payment-methods">
          <div
            className={`payment-method-option ${selectedMethod === 'cod' ? 'selected' : ''}`}
            onClick={() => setSelectedMethod('cod')}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="cod"
              checked={selectedMethod === 'cod'}
              onChange={() => setSelectedMethod('cod')}
            />
            <label>{t('cashOnDeliveryCOD')}</label>
          </div>
          <div
            className={`payment-method-option ${selectedMethod === 'online' ? 'selected' : ''}`}
            onClick={() => setSelectedMethod('online')}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="online"
              checked={selectedMethod === 'online'}
              onChange={() => setSelectedMethod('online')}
            />
            <label>{t('onlinePayment')}</label>
          </div>
        </div>
        <div className="payment-modal-actions">
          <button onClick={onClose} className="cancel-payment-btn">{t('cancel')}</button>
          <button
            onClick={handleConfirm}
            className="confirm-payment-btn"
            disabled={!selectedMethod}
          >
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodModal;

