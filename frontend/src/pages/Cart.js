import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import './Cart.css';

const Cart = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    fetchCart();

    // Listen for cart updates
    window.addEventListener('cartUpdated', fetchCart);
    return () => window.removeEventListener('cartUpdated', fetchCart);
  }, [isAuthenticated, navigate]);

  const fetchCart = async () => {
    try {
      const res = await axios.get('https://localhost:5000/api/cart');
      setCart(res.data.cart || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    try {
      await axios.put(`https://localhost:5000/api/cart/update/${itemId}`, {
        quantity: newQuantity
      });
      fetchCart();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      alert(error.response?.data?.message || t('errorUpdatingCart'));
    }
  };

  const removeItem = async (itemId) => {
    try {
      await axios.delete(`https://localhost:5000/api/cart/remove/${itemId}`);
      fetchCart();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      alert(error.response?.data?.message || t('errorRemovingItem'));
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      if (item.product) {
        return total + (item.product.price * item.quantity);
      }
      return total;
    }, 0);
  };

  if (loading) {
    return <div className="loading-container">{t('loadingCart')}</div>;
  }

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <h1>{t('yourCart')}</h1>
          <div className="empty-cart">
            <p>{t('emptyCart')}</p>
            <button onClick={() => navigate('/')} className="continue-shopping-btn">
              {t('continueShopping')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1>{t('yourCart')} ({cart.length} {t('items')})</h1>
        <div className="cart-content">
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item._id} className="cart-item">
                <img
                  src={item.product?.image || 'https://via.placeholder.com/150'}
                  alt={item.product?.name}
                  className="cart-item-image"
                />
                <div className="cart-item-details">
                  <h3>{item.product?.name}</h3>
                  {item.size && <p className="cart-item-size" style={{ color: '#666', fontSize: '0.9rem', margin: '0.25rem 0' }}>Size: {item.size}</p>}
                  <p className="cart-item-price">Rs. {item.product?.price}</p>
                  <div className="cart-item-actions">
                    <div className="quantity-controls">
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        disabled={item.quantity >= (item.product?.stock || 0)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item._id)}
                      className="remove-btn"
                    >
                      {t('remove')}
                    </button>
                  </div>
                </div>
                <div className="cart-item-total">
                  Rs. {(item.product?.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <h2>{t('orderSummary')}</h2>
            <div className="summary-row">
              <span>{t('subtotal')}:</span>
              <span>Rs. {calculateTotal().toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>{t('shipping')}:</span>
              <span>{calculateTotal() > 1000 ? t('free') : 'Rs. 100.00'}</span>
            </div>
            <div className="summary-row total">
              <span>{t('total')}:</span>
              <span>Rs. {(calculateTotal() + (calculateTotal() > 1000 ? 0 : 100)).toFixed(2)}</span>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="checkout-btn"
            >
              {t('proceedToCheckout')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;

