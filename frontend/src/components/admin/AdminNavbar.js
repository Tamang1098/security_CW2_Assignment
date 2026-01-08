import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminNavbar.css';

const AdminNavbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="admin-navbar">
      <div className="navbar-container">
        <div className="navbar-logo" onClick={() => navigate('/admin')} style={{ cursor: 'pointer' }}>
          <h2>E-Commerce</h2>
        </div>
        
        <div className="navbar-menu">
          <div className="navbar-link" onClick={() => navigate('/admin')} style={{ cursor: 'pointer' }}>
            Admin Panel
          </div>
          <button onClick={() => { logout(); navigate('/'); }} className="navbar-button">Logout</button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;

