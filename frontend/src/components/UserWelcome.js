import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import './UserWelcome.css';

const UserWelcome = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Don't show welcome banner if not authenticated
  if (!isAuthenticated) return null;

  // Hide welcome banner for admin users on user-facing pages
  // Only show it on admin panel or for regular users
  if (user?.role === 'admin' && location.pathname !== '/admin') return null;

  return (
    <div className="user-welcome-text-only">
      <div className="container">
        <div className="welcome-text">
          <h2>Welcome back, {user?.name}! 👋</h2>
          <p>Continue shopping and discover great deals</p>
        </div>
      </div>
    </div>
  );
};

export default UserWelcome;

