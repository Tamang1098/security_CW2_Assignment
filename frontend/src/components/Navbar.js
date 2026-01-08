import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import ProfileDropdown from './ProfileDropdown';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  
  // Check if we're on admin page
  const isAdminPage = location.pathname === '/admin';

  useEffect(() => {
    // Listen for custom event to open register modal
    const handleOpenRegister = () => {
      setShowRegisterModal(true);
    };
    window.addEventListener('openRegisterModal', handleOpenRegister);
    return () => window.removeEventListener('openRegisterModal', handleOpenRegister);
  }, []);

  return (
    <nav className={`navbar ${isAdminPage ? 'navbar-admin' : 'navbar-user'}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <h2>Football Supplies Nepal</h2>
        </Link>
        
        <div className="navbar-menu">
          {isAuthenticated ? (
            user?.role === 'admin' ? (
              // Admin Navbar - Only Admin Panel and Logout
              <>
                <Link to="/admin" className="navbar-link">Admin Panel</Link>
                <button onClick={() => { logout(); navigate('/'); }} className="navbar-button">Logout</button>
              </>
            ) : (
              // User Navbar - Product Page, My Orders, Profile Icon, Logout
              <>
                <Link to="/" className="navbar-link">Product Page</Link>
                <Link to="/orders" className="navbar-link">My Orders</Link>
                <ProfileDropdown user={user} />
                <button onClick={() => { logout(); navigate('/'); }} className="navbar-button">Logout</button>
              </>
            )
          ) : (
            <>
              <a 
                href="/admin/login" 
                target="_blank" 
                rel="noopener noreferrer"
                className="navbar-link" 
                style={{ marginRight: '0.5rem' }}
              >
                Admin Login
              </a>
              <button onClick={() => setShowLoginModal(true)} className="navbar-login-btn">
                Login
              </button>
              <button onClick={() => setShowRegisterModal(true)} className="navbar-register-btn">
                Register
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
      />
      
      {/* Register Modal */}
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />
    </nav>
  );
};

export default Navbar;

