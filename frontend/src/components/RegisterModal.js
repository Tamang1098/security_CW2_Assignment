import React, { useState, useEffect } from 'react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [emailValid, setEmailValid] = useState(null);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  useEffect(() => {
    if (formData.email) {
      setEmailValid(validateEmail(formData.email));
    } else {
      setEmailValid(null);
    }
  }, [formData.email]);

  const handleChange = (e) => {
    const { name, value } = e.target;


    if (name === 'phone') {

      const numericValue = value.replace(/[^0-9]/g, '');


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

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError('Password must be at least 8 characters long and meet all complexity requirements (Uppercase, Lowercase, Number, Special Character)');
      return;
    }

    if (formData.phone.length !== 10) {
      setError('Mobile number must be exactly 10 digits');
      return;
    }

    setLoading(true);


    const delayTimer = new Promise(resolve => setTimeout(resolve, 1500));


    const result = await register(formData.name, formData.email, formData.password, formData.phone);


    if (result.success) {
      showToast('Register Successful', 'success');
    }


    await delayTimer;

    setLoading(false);

    if (result.success) {

      window.dispatchEvent(new Event('newUserCreated'));
      localStorage.setItem('newUserCreated', Date.now().toString());
      setTimeout(() => localStorage.removeItem('newUserCreated'), 100);

      setFormData({ name: '', email: '', phone: '', password: '', confirmPassword: '' });



      if (onSwitchToLogin) {

        onSwitchToLogin();
      } else {

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
        <form onSubmit={handleSubmit} autoComplete="off">
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
              autoComplete="off"
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
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder={t('enterPassword')}
                onMouseEnter={() => setShowHint(true)}
                onMouseLeave={() => setShowHint(false)}
                onFocus={() => setShowHint(true)}
                onBlur={() => setShowHint(false)}
                autoComplete="new-password"
              />
              <span className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "👁️‍🗨️" : "👁️"}
              </span>
            </div>

            {showHint && (
              <div className="password-hint-tooltip">
                Hint: 1 Uppercase, 1 Special Sign, and 8+ Characters
              </div>
            )}

            {formData.password && (
              <div className="password-requirements">
                <p className={formData.password.length >= 8 ? 'met' : 'unmet'}>
                  {formData.password.length >= 8 ? '✓' : '○'} 8+ Characters
                </p>
                <p className={/[A-Z]/.test(formData.password) ? 'met' : 'unmet'}>
                  {/[A-Z]/.test(formData.password) ? '✓' : '○'} Uppercase Letter
                </p>
                <p className={/[@$!%*?&]/.test(formData.password) ? 'met' : 'unmet'}>
                  {/[@$!%*?&]/.test(formData.password) ? '✓' : '○'} Special Character (@$!%*?&)
                </p>
                <p className={/[0-9]/.test(formData.password) ? 'met' : 'unmet'}>
                  {/[0-9]/.test(formData.password) ? '✓' : '○'} Number
                </p>
              </div>
            )}
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