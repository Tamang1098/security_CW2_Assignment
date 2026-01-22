import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ProductReview from '../components/ProductReview';
import PaymentMethodModal from '../components/PaymentMethodModal';
import QRCodeModal from '../components/QRCodeModal';
import OrderSuccessModal from '../components/OrderSuccessModal';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';
import RelatedProducts from '../components/RelatedProducts';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [orderNumber, setOrderNumber] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [pendingBuyNow, setPendingBuyNow] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    fetchProduct();

  }, [id]);


  useEffect(() => {
    const handleOpenRegister = () => {
      setShowRegisterModal(true);
      setPendingBuyNow(true);
    };
    window.addEventListener('openRegisterModal', handleOpenRegister);
    return () => window.removeEventListener('openRegisterModal', handleOpenRegister);
  }, []);


  useEffect(() => {
    if (showPaymentModal && (!isAuthenticated || !user || user.role === 'admin')) {

      setShowPaymentModal(false);
    }
  }, [showPaymentModal, isAuthenticated, user]);


  useEffect(() => {

    if (isAuthenticated && user && user.role !== 'admin' && pendingBuyNow && !showLoginModal && !showRegisterModal) {

      const timer = setTimeout(() => {
        setPendingBuyNow(false);

        if (isAuthenticated && user && user.role !== 'admin') {
          setShowPaymentModal(true);
        } else {
          setPendingBuyNow(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, pendingBuyNow, showLoginModal, showRegisterModal]);

  useEffect(() => {

    if (product) {
      setQuantity(1);
    }

  }, [product?._id]);

  useEffect(() => {

    if (product && quantity > (product?.stock || 0)) {
      setQuantity(Math.max(1, product?.stock || 0));
    }
  }, [product, quantity]);

  useEffect(() => {

    const handleProductUpdate = () => {
      console.log('Product update detected, refreshing product details...');
      fetchProduct();
    };


    window.addEventListener('productUpdated', handleProductUpdate);
    window.addEventListener('adminDataUpdated', handleProductUpdate);
    window.addEventListener('reviewUpdated', handleProductUpdate);


    const handleProductSpecificUpdate = (e) => {
      const updatedProductId = e.detail?.productId || e.newValue;
      if (updatedProductId === id) {
        handleProductUpdate();
      }
    };
    window.addEventListener('productUpdatedId', handleProductSpecificUpdate);


    const handleStorageChange = (e) => {
      if (e.key === 'productUpdated' || e.key === 'adminDataUpdated' || e.key === 'reviewUpdated') {
        handleProductUpdate();
      }

      if (e.key === 'productUpdatedId' && e.newValue === id) {
        handleProductUpdate();
      }
    };
    window.addEventListener('storage', handleStorageChange);


    let pollInterval;
    const startPolling = () => {

      pollInterval = setInterval(() => {
        if (!document.hidden) {
          fetchProduct();
        }
      }, 5000);
    };


    if (!document.hidden) {
      startPolling();
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(pollInterval);
      } else {

        handleProductUpdate();
        startPolling();
      }
    };


    const handleWindowFocus = () => {
      handleProductUpdate();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('productUpdated', handleProductUpdate);
      window.removeEventListener('adminDataUpdated', handleProductUpdate);
      window.removeEventListener('reviewUpdated', handleProductUpdate);
      window.removeEventListener('productUpdatedId', handleProductSpecificUpdate);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      clearInterval(pollInterval);
    };

  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await axios.get(`https://localhost:5000/api/products/${id}`);
      setProduct(res.data);
      setLoading(false);

      fetchRelatedProducts();
    } catch (error) {
      console.error('Error fetching product:', error);
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      const res = await axios.get(`https://localhost:5000/api/products/${id}/related`);
      setRelatedProducts(res.data);
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };

  const handleBuyNow = () => {

    if (!isAuthenticated || !user || user.role === 'admin') {

      setShowRegisterModal(true);
      setPendingBuyNow(true);
      return;
    }


    const needsSize = (product.sizes && product.sizes.length > 0) ||
      (product.category && (product.category.toLowerCase().includes('jersey') || product.category.toLowerCase().includes('boot')));

    if (needsSize && !selectedSize) {
      alert(t('pleaseSelectSize') || 'Please select a size');
      return;
    }


    setShowPaymentModal(true);
  };

  const handlePaymentMethodSelect = async (method) => {

    if (!isAuthenticated || !user || user.role === 'admin') {
      setShowPaymentModal(false);
      setShowRegisterModal(true);
      setPendingBuyNow(true);
      return;
    }

    setShowPaymentModal(false);
    setProcessing(true);

    try {

      const orderData = {
        items: [{
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: quantity,
          quantity: quantity,
          image: product.image,
          size: selectedSize
        }],
        shippingAddress: {
          fullName: user.name,
          phone: user.phone || '0000000000',
          address: user.addresses?.[0]?.address || 'Default Address',
          city: user.addresses?.[0]?.city || 'Default City',
          postalCode: user.addresses?.[0]?.postalCode || '00000'
        },
        paymentMethod: method,
        subtotal: product.price * quantity,
        shippingFee: 0,
        total: product.price * quantity
      };

      const orderRes = await axios.post('https://localhost:5000/api/orders', orderData);
      const { order, payment } = orderRes.data;


      window.dispatchEvent(new Event('newOrderCreated'));
      window.dispatchEvent(new Event('productUpdated'));
      window.dispatchEvent(new CustomEvent('productUpdatedId', { detail: { productId: product._id } }));

      localStorage.setItem('newOrderCreated', Date.now().toString());
      localStorage.setItem('productUpdated', Date.now().toString());
      localStorage.setItem('productUpdatedId', product._id);

      setTimeout(() => {
        localStorage.removeItem('newOrderCreated');
        localStorage.removeItem('productUpdated');
        localStorage.removeItem('productUpdatedId');
      }, 100);

      if (method === 'online') {

        setPaymentId(payment._id);
        setOrderId(order._id);
        setShowQRModal(true);
      } else {

        setOrderNumber(order.orderNumber);
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert(error.response?.data?.message || 'Error processing order');
    } finally {
      setProcessing(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/500';

    if (typeof imagePath !== 'string') return imagePath;

    let path = imagePath;

    if (path.startsWith('http://localhost:5000')) {
      path = path.replace('http://localhost:5000', 'https://localhost:5000');
    }


    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }


    if (path.startsWith('/uploads/')) {
      return `https://localhost:5000${path}`;
    }
    if (path.startsWith('uploads/')) {
      return `https://localhost:5000/${path}`;
    }


    if (!path.includes('://') && !path.startsWith('/')) {
      return `https://localhost:5000/uploads/${path}`;
    }

    return path;
  };

  const getProductImages = () => {
    if (!product) return [];
    const images = [];

    if (product.image) {
      images.push(product.image);
    }

    if (product.images && Array.isArray(product.images) && product.images.length > 0) {

      const additionalImages = product.images
        .filter(img => img && img.trim() !== '' && img !== product.image);
      images.push(...additionalImages);
    }

    return images.length > 0 ? images : ['https://via.placeholder.com/500'];
  };


  const getDisplaySizes = () => {
    if (product.sizes && product.sizes.length > 0) {
      return product.sizes;
    }


    const categoryLower = (product.category || '').toLowerCase();
    const nameLower = (product.name || '').toLowerCase();

    if (categoryLower.includes('jersey') || nameLower.includes('jersey') ||
      categoryLower.includes('shirt') || nameLower.includes('shirt') ||
      categoryLower.includes('short') || nameLower.includes('short')) {
      return ['S', 'M', 'L', 'XL', 'XXL'];
    }

    if (categoryLower.includes('boot') || nameLower.includes('boot') ||
      categoryLower.includes('shoe') || nameLower.includes('shoe') ||
      categoryLower.includes('cleat') || nameLower.includes('cleat')) {
      return ['38', '39', '40', '41', '42', '43', '44', '45'];
    }

    return [];
  };

  const totalPrice = product ? (product.price * quantity) : 0;
  const availableStock = product?.stock || 0;
  const remainingStock = availableStock - quantity;

  if (loading) {
    return <div className="loading-container">{t('loadingProduct')}</div>;
  }

  if (!product) {
    return <div className="error-container">{t('productNotFound')}</div>;
  }

  const displaySizes = getDisplaySizes();
  const productImages = getProductImages();

  return (
    <div className="product-detail-page">
      <div className="container-full">
        <div className="product-layout">
          <div className="product-main-section">
            <div className="product-detail-content">
              <div className="product-image-section">
                <div className="main-image-container">
                  <img
                    src={getImageUrl(productImages[selectedImageIndex])}
                    alt={product.name}
                    className="product-main-image"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/500';
                    }}
                    onMouseMove={(e) => {
                      const container = e.currentTarget.parentElement;
                      const lens = container.querySelector('.zoom-lens');
                      const result = container.querySelector('.zoom-result');

                      if (!lens || !result) return;

                      const img = e.currentTarget;
                      const rect = img.getBoundingClientRect();


                      let x = e.clientX - rect.left;
                      let y = e.clientY - rect.top;


                      const lensWidth = lens.offsetWidth / 2;
                      const lensHeight = lens.offsetHeight / 2;

                      x = Math.max(lensWidth, Math.min(x, rect.width - lensWidth));
                      y = Math.max(lensHeight, Math.min(y, rect.height - lensHeight));


                      lens.style.left = (x - lensWidth) + 'px';
                      lens.style.top = (y - lensHeight) + 'px';


                      lens.style.display = 'block';
                      result.style.display = 'block';


                      const zoomFactor = 2;


                      result.style.backgroundImage = `url('${img.src}')`;
                      result.style.backgroundSize = (img.width * zoomFactor) + 'px ' + (img.height * zoomFactor) + 'px';



                      const bgX = (x - lensWidth) * zoomFactor;
                      const bgY = (y - lensHeight) * zoomFactor;

                      result.style.backgroundPosition = `-${bgX}px -${bgY}px`;
                    }}
                    onMouseEnter={(e) => {
                      const container = e.currentTarget.parentElement;
                      const lens = container.querySelector('.zoom-lens');
                      const result = container.querySelector('.zoom-result');
                      if (lens) lens.style.display = 'block';
                      if (result) result.style.display = 'block';
                    }}
                    onMouseLeave={(e) => {
                      const container = e.currentTarget.parentElement;
                      const lens = container.querySelector('.zoom-lens');
                      const result = container.querySelector('.zoom-result');
                      if (lens) lens.style.display = 'none';
                      if (result) result.style.display = 'none';
                    }}
                  />
                  <div className="zoom-lens"></div>
                  <div className="zoom-result"></div>
                </div>
                {productImages.length > 1 && (
                  <div className="image-thumbnails">
                    {productImages.map((img, index) => (
                      <img
                        key={index}
                        src={getImageUrl(img)}
                        alt={`${product.name} ${index + 1}`}
                        className={`thumbnail ${selectedImageIndex === index ? 'active' : ''}`}
                        onClick={() => setSelectedImageIndex(index)}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/100';
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="product-info-section">
                <h1 className="product-title">{product.name}</h1>
                <div className="product-price-section">
                  <span className="product-price">Rs. {product.price}</span>
                </div>
                <div className="stock-info">
                  <span className="stock-label">{t('stock')}:</span>
                  <span className={`stock-value ${availableStock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                    {availableStock > 0 ? (
                      quantity > 0 ? `${remainingStock} ${t('remaining')} (${availableStock} total)` : `${availableStock} ${t('available')}`
                    ) : t('outOfStock')}
                  </span>
                </div>
                <div className="product-actions">
                  {displaySizes.length > 0 && (
                    <div className="size-selector">
                      <label>{t('size') || 'Size'}:</label>
                      <div className="size-options">
                        {displaySizes.map((size) => (
                          <button
                            key={size}
                            className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                            onClick={() => setSelectedSize(size)}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="quantity-selector">
                    <label>{t('quantity')}:</label>
                    <div className="quantity-controls">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="quantity-btn"
                        disabled={quantity <= 1}
                      >
                        -
                      </button>
                      <span className="quantity-value">{quantity}</span>
                      <button
                        onClick={() => {
                          if (quantity < availableStock) {
                            setQuantity(quantity + 1);
                          }
                        }}
                        className="quantity-btn"
                        disabled={quantity >= availableStock || availableStock === 0}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="total-price-section">
                    <span className="total-label">{t('total')}:</span>
                    <span className="total-price">Rs. {totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="action-buttons">
                    <button onClick={() => navigate('/')} className="back-btn-inline">
                      ← Back to Product Page
                    </button>
                    <button
                      className="buy-now-btn"
                      onClick={handleBuyNow}
                      disabled={processing || availableStock === 0 || quantity === 0}
                    >
                      {processing ? t('processing') : t('buyNow')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="product-reviews-section">
              <ProductReview product={product} onReviewAdded={fetchProduct} />
            </div>
          </div>
          <div className="product-sidebar">
            <RelatedProducts products={relatedProducts} currentProductId={product._id} />
          </div>
        </div>
      </div>

      {/* Only show payment modal if user is authenticated and not admin */}
      {isAuthenticated && user && user.role !== 'admin' && (
        <PaymentMethodModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSelectMethod={handlePaymentMethodSelect}
          totalAmount={totalPrice}
        />
      )}

      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => {
          setShowQRModal(false);
        }}
        paymentId={paymentId}
        amount={totalPrice}
        orderId={orderId}
      />
      <OrderSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        orderNumber={orderNumber}
      />

      {/* Login Modal - shown after registration or if user clicks login */}
      <LoginModal
        isOpen={showLoginModal}
        skipNavigation={true}
        onLoginSuccess={(user) => {


        }}
        onClose={() => {
          setShowLoginModal(false);

          if (!isAuthenticated) {
            setPendingBuyNow(false);
          }
        }}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
      />

      {/* Register Modal - shown when Buy Now is clicked without login */}
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => {
          setShowRegisterModal(false);

          if (!isAuthenticated) {
            setPendingBuyNow(false);
          }
        }}
        onSwitchToLogin={() => {


          setShowRegisterModal(false);


          requestAnimationFrame(() => {
            setShowLoginModal(true);
          });
        }}
      />
    </div>
  );
};

export default ProductDetail;