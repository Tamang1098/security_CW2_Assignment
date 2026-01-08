import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute
import AdminNavbar from './components/admin/AdminNavbar';
import UserNavbar from './components/user/UserNavbar';
import UserWelcome from './components/UserWelcome';
import AdminLogin from './components/AdminLogin';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import AdminPanel from './pages/AdminPanel';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';

import OrderHistory from './pages/OrderHistory';
import OrderDetails from './pages/OrderDetails';
import UserDashboard from './pages/UserDashboard';
import './App.css';
import './styles/designSystem.css';

function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/" element={
                  <div className="sidebar-page">
                    <UserNavbar />
                    <LandingPage />
                    <Footer />
                  </div>
                } />
                <Route path="/product/:id" element={
                  <>
                    <UserNavbar />
                    <ProductDetail />
                    <Footer />
                  </>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminNavbar />
                    <UserWelcome />
                    <AdminPanel />
                  </ProtectedRoute>
                } />
                <Route path="/cart" element={
                  <ProtectedRoute>
                    <UserNavbar />
                    <Cart />
                    <Footer />
                  </ProtectedRoute>
                } />
                <Route path="/checkout" element={
                  <ProtectedRoute>
                    <UserNavbar />
                    <Checkout />
                    <Footer />
                  </ProtectedRoute>
                } />
                <Route path="/orders" element={
                  <ProtectedRoute>
                    <UserNavbar />
                    <OrderHistory />
                    <Footer />
                  </ProtectedRoute>
                } />
                <Route path="/orders/:id" element={
                  <ProtectedRoute>
                    <UserNavbar />
                    <OrderDetails />
                    <Footer />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <UserNavbar />
                    <UserDashboard />
                    <Footer />
                  </ProtectedRoute>
                } />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}

export default App;

