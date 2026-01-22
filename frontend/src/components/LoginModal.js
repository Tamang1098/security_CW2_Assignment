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

    const delayTimer = new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(true);

    let result;
    if (!showOtpInput) {

      result = await login(formData.email, formData.password);

      if (result.otpRequired) {
        await delayTimer;
        setLoading(false);
        setShowOtpInput(true);
        showToast(result.message, 'info');
        return;
      }
    } else {

      result = await verifyOtp(formData.email, otp);
    }


    if (result.success) {
      showToast('Login Successful', 'success');
    }


    await delayTimer;

    setLoading(false);

    if (result.success) {
      setFormData({ email: '', password: '' });
      setOtp('');
      setShowOtpInput(false);

      onClose();


      if (onLoginSuccess) {
        onLoginSuccess(result.user);
        return;
      }


      if (!skipNavigation) {


        const loggedInUser = result.user;
        if (loggedInUser?.role === 'admin') {
          navigate('/admin');
        } else {

          navigate('/');
        }
      }
    } else {
      setError(result.message);
    }
  };


  const handleClose = () => {
    setFormData({ email: '', password: '' });
    setOtp('');
    setShowOtpInput(false);
    setError('');
    onClose();
  };



  if (!isOpen) return null;



  const isAdminOnUserPage = isAuthenticated && user?.role === 'admin' && !location.pathname.startsWith('/admin');
  const shouldShowLogin = !isAuthenticated || isAdminOnUserPage;


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
        <form onSubmit={handleSubmit} autoComplete="off">
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
                  autoComplete="off"
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
                  autoComplete="new-password"
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