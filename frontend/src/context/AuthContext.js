import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      console.log('[AUTH] Rehydrating session... Token found:', !!storedToken);

      if (storedToken) {
        setToken(storedToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

        try {
          console.log('[AUTH] Fetching current user...');
          const res = await axios.get('https://localhost:5000/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          const fetchedUser = res.data.user;

          if (fetchedUser && fetchedUser.id) {
            console.log('[AUTH] Session restored:', fetchedUser.name, '(', fetchedUser.role, ')');
            setUser(fetchedUser);
          } else {
            console.warn('[AUTH] Invalid user data received during rehydration');
            // Invalid data from server
            logout();
          }
        } catch (error) {
          console.error('[AUTH] Rehydration error:', error.message);
          // Only logout if it's an authentication error (401/403)
          if (error.response?.status === 401 || error.response?.status === 403) {
            console.warn('[AUTH] Token invalid or expired. Logging out.');
            logout();
          }
        }
      } else {
        console.log('[AUTH] No session token found.');
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // When token changes (after login/register)
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const fetchUser = async () => {
    if (!token) return;
    try {
      const res = await axios.get('https://localhost:5000/api/auth/me');
      const fetchedUser = res.data.user;
      if (fetchedUser && fetchedUser.id) {
        setUser(fetchedUser);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        logout();
      }
    }
  };

  const login = async (email, password) => {
    try {
      // Validate email format
      if (!email || !email.includes('@')) {
        return {
          success: false,
          message: 'Please enter a valid email address'
        };
      }

      // Validate password
      if (!password || password.length === 0) {
        return {
          success: false,
          message: 'Please enter your password'
        };
      }

      // Clear old user state and token before login
      setUser(null);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];

      const res = await axios.post('https://localhost:5000/api/auth/login', {
        email,
        password
      });

      // Handle MFA Step
      if (res.data.otpRequired) {
        return {
          success: false,
          otpRequired: true,
          message: res.data.message,
          email: res.data.email
        };
      }

      const { token: newToken, user: userData } = res.data;
      console.log('Login successful - user data:', userData);
      console.log('User name:', userData?.name, 'User email:', userData?.email, 'User role:', userData?.role);

      // Set new token and user data
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      // Trigger cart update
      window.dispatchEvent(new Event('cartUpdated'));
      return { success: true, user: userData };
    } catch (error) {
      // Get error message from backend
      const errorMessage = error.response?.data?.message || '';

      // Use backend message directly if it's specific (Email is wrong / Password is wrong)
      if (errorMessage === 'Email is wrong' || errorMessage === 'Password is wrong') {
        return {
          success: false,
          message: errorMessage
        };
      }

      // Handle other errors
      let userFriendlyMessage = '';
      if (error.response?.status === 500) {
        userFriendlyMessage = 'Server error. Please try again later.';
      } else if (error.response?.status === 404) {
        userFriendlyMessage = 'User not found. Please register first.';
      } else if (errorMessage) {
        userFriendlyMessage = errorMessage;
      } else {
        userFriendlyMessage = 'Login failed. Please try again.';
      }

      return {
        success: false,
        message: userFriendlyMessage
      };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const res = await axios.post('https://localhost:5000/api/auth/verify-otp', {
        email,
        otp
      });

      const { token: newToken, user: userData } = res.data;
      console.log('OTP Verified - user data:', userData);

      // Set new token and user data
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      // Trigger cart update
      window.dispatchEvent(new Event('cartUpdated'));

      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'OTP Verification failed'
      };
    }
  };

  const register = async (name, email, password, phone) => {
    try {
      await axios.post('https://localhost:5000/api/auth/register', {
        name,
        email,
        password,
        phone
      });
      // Don't auto-login after registration - user needs to login manually
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };


  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const refreshUser = async () => {
    try {
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        setUser(null);
        setToken(null);
        return;
      }
      axios.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
      const res = await axios.get('https://localhost:5000/api/auth/me');
      const fetchedUser = res.data.user;
      console.log('User refreshed:', fetchedUser);
      setUser(fetchedUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
      // Clear invalid token
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const value = {
    user,
    loading,
    login,
    verifyOtp,
    register,
    logout,
    isAuthenticated: !!user,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

