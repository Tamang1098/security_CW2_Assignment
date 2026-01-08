import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import './RegisterModal.css';

const RegisterModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Mobile number validation: only numbers, max 10 digits
    if (name === 'phone') {
      // Allow only numbers
      const numericValue = value.replace(/[^0-9]/g, '');

      // Limit to 10 digits
      if (numericValue.length <= 10) {
        setFormData({
          ...formData,
          [name]: numericValue
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('passwordsNotMatch'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('passwordMinLength'));
      return;
    }

    if (formData.phone.length !== 10) {
      setError('Mobile number must be exactly 10 digits');
      return;
    }

    setLoading(true);

    // Start artificial delay timer (1.5s min)
    const delayTimer = new Promise(resolve => setTimeout(resolve, 1500));

    // Perform registration
    const result = await register(formData.name, formData.email, formData.password, formData.phone);

    // Show toast immediately if successful
    if (result.success) {
      showToast('Register Successful', 'success');
    }

    // Wait for the remaining delay time
    await delayTimer;

    setLoading(false);

    if (result.success) {
      // Dispatch event for new user creation (for admin panel)
      window.dispatchEvent(new Event('newUserCreated'));
      localStorage.setItem('newUserCreated', Date.now().toString());
      setTimeout(() => localStorage.removeItem('newUserCreated'), 100);

      setFormData({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
      // Toast already shown

      // Switch to login modal - this will handle closing register modal and opening login modal
      if (onSwitchToLogin) {
        // Call onSwitchToLogin immediately - the parent component will handle timing
        onSwitchToLogin();
      } else {
        // If no onSwitchToLogin callback, just close the modal
        onClose();
      }
    } else {
      setError(result.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>{t('createAccount')}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('name')}</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder={t('enterName')}
            />
          </div>
          <div className="form-group">
            <label>{t('email')}</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder={t('enterEmail')}
            />
          </div>
          <div className="form-group">
            <label>{t('phone')}</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder={t('enterPhone')}
              pattern="[0-9]{10}"
              title="Please enter a valid 10-digit mobile number"
            />
          </div>
          <div className="form-group">
            <label>{t('password')}</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder={t('enterPassword')}
            />
          </div>
          <div className="form-group">
            <label>{t('confirmPassword')}</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder={t('enterConfirmPassword')}
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          {loading ? (
            <div className="auth-progress-container">
              <div className="auth-progress-bar">
                <div className="auth-progress-fill"></div>
              </div>
              <p className="auth-progress-text">{t('registering')}...</p>
            </div>
          ) : (
            <button type="submit" className="submit-btn">
              {t('register')}
            </button>
          )}
        </form>
        <p className="switch-auth">
          {t('alreadyHaveAccount')}{' '}
          <span onClick={onSwitchToLogin} className="switch-link">{t('login')}</span>
        </p>
      </div>
    </div>
  );
};

export default RegisterModal;

