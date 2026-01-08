import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { isAuthenticated, user, loading } = useAuth();
    const { showToast } = useToast();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div className="auth-progress-bar" style={{ width: '200px' }}>
                    <div className="auth-progress-fill"></div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to home if not authenticated (token not present/OTP not done)
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (adminOnly && user?.role?.toLowerCase() !== 'admin') {
        // If user is logged in but not admin, and tries to access admin route
        console.warn('[PROTECTED] Access denied: User is not admin', user?.role);
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
