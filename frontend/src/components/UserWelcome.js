import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import './UserWelcome.css';

const UserWelcome = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();


  if (!isAuthenticated) return null;



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