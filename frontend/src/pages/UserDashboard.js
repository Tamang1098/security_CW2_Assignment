import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import './UserDashboard.css';

const UserDashboard = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          axios.get('https://localhost:5000/api/products/categories/list'),
          axios.get('https://localhost:5000/api/products?limit=1000')
        ]);
        setCategories(catRes.data);
        setProducts(Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data.products || []));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await axios.put('https://localhost:5000/api/auth/update-profile', {
        name: profileData.name
      });

      setSuccess('Profile updated successfully!');
      // Refresh user data
      window.location.reload();
    } catch (error) {
      setError(error.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (profileData.newPassword !== profileData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (profileData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await axios.put('https://localhost:5000/api/auth/change-password', {
        currentPassword: profileData.currentPassword,
        newPassword: profileData.newPassword
      });

      setSuccess('Password changed successfully!');
      setProfileData({
        ...profileData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Error changing password');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="user-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>My Dashboard</h1>
          <p>Welcome back, {user?.name}!</p>
        </div>

        <div className="dashboard-content">
          <div className="dashboard-sidebar">
            <div className="user-info-card">
              <div className="user-avatar">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <h3>{user?.name}</h3>
              <p>{user?.email}</p>
              <div className="user-role-badge">
                {user?.role === 'admin' ? '👑 Admin' : '👤 User'}
              </div>
            </div>

            <div className="dashboard-menu">
              <button className="menu-item active">Profile</button>
              <button
                className="menu-item"
                onClick={() => navigate('/orders')}
              >
                My Orders
              </button>
              <button
                className="menu-item"
                onClick={() => navigate('/cart')}
              >
                Shopping Cart
              </button>
              {user?.role === 'admin' && (
                <button
                  className="menu-item admin-menu"
                  onClick={() => navigate('/admin')}
                >
                  Admin Panel
                </button>
              )}
            </div>
          </div>

          <div className="dashboard-main">
            <div className="profile-section">
              <h2>Update Profile</h2>
              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    disabled
                    className="disabled-input"
                  />
                  <small>Email cannot be changed</small>
                </div>
                {success && <div className="success-message">{success}</div>}
                {error && <div className="error-message">{error}</div>}
                <button type="submit" className="update-btn" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            </div>

            <div className="password-section">
              <h2>Change Password</h2>
              <form onSubmit={handleChangePassword} className="profile-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={profileData.currentPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={profileData.newPassword}
                    onChange={handleChange}
                    required
                    minLength="6"
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={profileData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength="6"
                  />
                </div>
                <button type="submit" className="update-btn" disabled={loading}>
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>

            {/* Category Representative Products Row */}
            <div className="category-products-section">
              <h2>Browse Categories</h2>
              <div className="category-row">
                <div className="products-scroller">
                  {categories.map(category => {
                    // Find the first product for this category
                    const product = products.find(p => p.category === category.name);

                    if (product) {
                      return (
                        <div key={category._id} className="category-representative-card">
                          <div className="category-label">{category.name}</div>
                          <ProductCard product={product} />
                        </div>
                      );
                    } else {
                      // Fallback if no product exists for category - maybe show category placeholder?
                      // User specifically asked for "product", so skip if none? 
                      // Or show a placeholder card. Let's show a placeholder linking to category filter if possible, 
                      // but for now let's just skip or show nothing to keep it clean as per "show product" request.
                      return null;
                    }
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;

