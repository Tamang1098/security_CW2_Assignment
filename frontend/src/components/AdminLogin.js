import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminLogin.css';

const AdminLogin = () => {
  const { login, verifyOtp } = useAuth();
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
    setError('');
    setLoading(true);

    let result;
    if (!showOtpInput) {
      // Step 1: Login
      result = await login(formData.email, formData.password);

      if (result.otpRequired) {
        setLoading(false);
        setShowOtpInput(true);
        return;
      }
    } else {
      // Step 2: Verify OTP
      result = await verifyOtp(formData.email, otp);
    }

    setLoading(false);

    if (result.success) {
      if (result.user?.role === 'admin') {
        window.location.href = '/admin';
      } else {
        setError('Access denied. Admin credentials required.');
      }
    } else {
      setError(result.message || 'Login failed');
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-box">
          <div className="admin-login-header">
            <h1>Admin Login</h1>
            <p>Access the admin dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="admin-login-form">
            {!showOtpInput ? (
              <>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter admin email"
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter admin password"
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
                <small style={{ display: 'block', marginTop: '10px', color: '#dc3545', textAlign: 'center', fontWeight: 'bold' }}>
                  OTP sent to your registered mobile number
                </small>
                <p style={{ fontSize: '0.8rem', color: '#666', textAlign: 'center', marginTop: '5px' }}>
                  (Check server console for simulated OTP)
                </p>
              </div>
            )}
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="admin-login-btn" disabled={loading}>
              {loading ? (showOtpInput ? 'Verifying...' : 'Logging in...') : (showOtpInput ? 'Verify OTP' : 'Login as Admin')}
            </button>
          </form>

          <div className="back-to-site">
            <a href="/">← Back to Site</a>
            <span style={{ margin: '0 0.5rem', color: '#999' }}>|</span>
            <a href="/admin/login">Admin Login</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

