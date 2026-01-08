import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import LoginModal from '../LoginModal';
import RegisterModal from '../RegisterModal';
import LogoutModal from '../LogoutModal';
import ProfileDropdown from '../ProfileDropdown';
import './UserNavbar.css';

const UserNavbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // On user pages, treat admin as not logged in (hide admin state)
  // Admin can still browse but won't see admin-specific UI on user pages
  const isAdminOnUserPage = isAuthenticated && user?.role === 'admin' && !location.pathname.startsWith('/admin');
  const effectiveIsAuthenticated = isAdminOnUserPage ? false : isAuthenticated;
  const effectiveUser = isAdminOnUserPage ? null : user;

  useEffect(() => {
    // Listen for custom event to open register modal
    const handleOpenRegister = () => {
      setShowRegisterModal(true);
    };
    window.addEventListener('openRegisterModal', handleOpenRegister);
    return () => window.removeEventListener('openRegisterModal', handleOpenRegister);
  }, []);

  // Fetch notification count for authenticated users (not for admin on user pages)
  useEffect(() => {
    if (!effectiveIsAuthenticated) {
      setUnreadNotificationCount(0);
      return;
    }

    const fetchNotificationCount = async () => {
      try {
        const res = await axios.get('https://localhost:5000/api/auth/notifications');
        const unreadCount = res.data.filter(n => !n.read).length;
        setUnreadNotificationCount(unreadCount);
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };

    fetchNotificationCount();
    // Poll for notifications every 3 seconds for faster updates
    const interval = setInterval(fetchNotificationCount, 3000);

    // Listen for notification updates (window events)
    const handleNotificationUpdate = () => {
      fetchNotificationCount();
    };
    window.addEventListener('notificationUpdated', handleNotificationUpdate);

    // Listen for localStorage events (cross-tab communication)
    const handleStorageChange = (e) => {
      if (e.key === 'notificationUpdated' || e.key === 'orderStatusUpdated') {
        fetchNotificationCount();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events
    const handleCustomEvent = () => {
      fetchNotificationCount();
    };
    window.addEventListener('orderStatusUpdated', handleCustomEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationUpdated', handleNotificationUpdate);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('orderStatusUpdated', handleCustomEvent);
    };
  }, [effectiveIsAuthenticated]);

  return (
    <nav className="user-navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">
            <h2>Football Supplies Nepal</h2>
          </Link>
          {effectiveIsAuthenticated && effectiveUser && (
            <div className="navbar-welcome">
              Welcome {effectiveUser?.name}
            </div>
          )}
        </div>

        <div className="navbar-menu">
          {effectiveIsAuthenticated && effectiveUser ? (
            // Regular user Navbar - Product Page, My Orders, Profile Icon, Logout
            <>
              <Link
                to="/"
                className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                {t('productPage')}
              </Link>
              <Link
                to="/orders"
                className={`navbar-link ${location.pathname === '/orders' ? 'active' : ''}`}
                style={{ position: 'relative' }}
              >
                {t('myOrders')}
                {unreadNotificationCount > 0 && (
                  <span className="notification-badge-navbar">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                )}
              </Link>
              <ProfileDropdown user={effectiveUser} />
              <button onClick={() => setShowLogoutModal(true)} className="navbar-link navbar-logout">{t('logout')}</button>
            </>
          ) : (
            // Not authenticated - show Login/Register buttons
            <>
              <a
                href="/admin/login"
                target="_blank"
                rel="noopener noreferrer"
                className="navbar-link navbar-admin-login"
              >
                {t('adminLogin')}
              </a>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Login button clicked, opening login modal');
                  setShowLoginModal(true);
                }}
                className="navbar-link"
                type="button"
              >
                {t('login')}
              </button>
              <button onClick={() => setShowRegisterModal(true)} className="navbar-link">
                {t('register')}
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

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onComplete={() => {
          setShowLogoutModal(false);
          logout();
          navigate('/');
        }}
      />
    </nav>
  );
};

export default UserNavbar;

