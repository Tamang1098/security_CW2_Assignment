import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import './LoginModal.css';

const LoginModal = ({ isOpen, onClose, onSwitchToRegister, skipNavigation = false, onLoginSuccess }) => {
  const { login, verifyOtp, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Start artificial delay timer (1.5s min)
    const delayTimer = new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(true);

    let result;
    if (!showOtpInput) {
      // Step 1: Login
      result = await login(formData.email, formData.password);

      if (result.otpRequired) {
        await delayTimer;
        setLoading(false);
        setShowOtpInput(true);
        showToast(result.message, 'info');
        return;
      }
    } else {
      // Step 2: OTP
      result = await verifyOtp(formData.email, otp);
    }

    // Show toast immediately if successful
    if (result.success) {
      showToast('Login Successful', 'success');
    }

    // Wait for the remaining delay time
    await delayTimer;

    setLoading(false);

    if (result.success) {
      setFormData({ email: '', password: '' });
      setOtp('');
      setShowOtpInput(false);
      // Toast already shown
      onClose();

      // Call custom onLoginSuccess callback if provided
      if (onLoginSuccess) {
        onLoginSuccess(result.user);
        return; // Don't navigate if custom callback is provided
      }

      // Only navigate if skipNavigation is false
      if (!skipNavigation) {
        // Only navigate after successful login - regular users go to product page, admin goes to admin panel
        // Make sure we're checking the actual logged-in user, not any cached state
        const loggedInUser = result.user;
        if (loggedInUser?.role === 'admin') {
          navigate('/admin');
        } else {
          // Regular user - go to home/product page as requested
          navigate('/');
        }
      }
    } else {
      setError(result.message);
    }
  };

  // Handle close - just close the modal, don't navigate anywhere
  const handleClose = () => {
    setFormData({ email: '', password: '' });
    setOtp('');
    setShowOtpInput(false);
    setError('');
    onClose();
  };


  // Don't show login modal if not requested to open
  if (!isOpen) return null;

  // On user pages, treat admin as not logged in (allow login)
  // On admin pages, if admin is logged in, don't show login form
  const isAdminOnUserPage = isAuthenticated && user?.role === 'admin' && !location.pathname.startsWith('/admin');
  const shouldShowLogin = !isAuthenticated || isAdminOnUserPage;

  // If user is already authenticated (and not admin on user page), don't show login modal
  if (!shouldShowLogin) {
    console.log('LoginModal: User already authenticated, not showing login form');
    return null;
  }

  console.log('LoginModal: Rendering login form, isOpen:', isOpen, 'isAuthenticated:', isAuthenticated, 'isAdminOnUserPage:', isAdminOnUserPage);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={handleClose}>×</button>
        <h2>{t('login')}</h2>
        <form onSubmit={handleSubmit}>
          {!showOtpInput ? (
            <>
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
            </>
          ) : (
            <div className="form-group">
              <label>Enter OTP</label>
              <input
                type="text"
                name="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                placeholder="Enter 6-digit OTP"
                maxLength="6"
                autoFocus
                style={{ letterSpacing: '2px', fontSize: '1.2rem', textAlign: 'center' }}
              />
              <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                
              </small>
            </div>
          )}

          {error && (
            <div className="error-message" style={{
              marginTop: '0.5rem',
              marginBottom: '1rem',
              padding: '1rem',
              fontSize: '0.95rem',
              lineHeight: '1.5'
            }}>
              ⚠️ {error}
            </div>
          )}
          {loading ? (
            <div className="auth-progress-container">
              <div className="auth-progress-bar">
                <div className="auth-progress-fill"></div>
              </div>
              <p className="auth-progress-text">{showOtpInput ? 'Verifying OTP...' : t('loggingIn')}...</p>
            </div>
          ) : (
            <button type="submit" className="submit-btn">
              {showOtpInput ? 'Verify OTP' : t('login')}
            </button>
          )}
        </form>

        <p className="switch-auth">
          {t('dontHaveAccount')}{' '}
          <span onClick={onSwitchToRegister} className="switch-link">{t('register')}</span>
        </p>
      </div>
    </div>
  );
};

export default LoginModal;

