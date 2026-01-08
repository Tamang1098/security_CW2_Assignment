import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import ProductCard from '../components/ProductCard';
import RegisterModal from '../components/RegisterModal';
import LoginModal from '../components/LoginModal';
import './LandingPage.css';


import Banner2 from '../assets/image.png';
import Banner3 from '../assets/je.webp';


const LandingPage = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [productsPerPage, setProductsPerPage] = useState(16);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Banner slides data
  const bannerSlides = [

    {
      id: 1,
      image: Banner3,

      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      id: 2,

      image: Banner2,
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    }
  ];

  // Don't redirect admin - let them browse user pages if they want
  // Only redirect happens on fresh admin login from AdminLogin component

  // Auto-slide banner
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 2);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchFeaturedProducts();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  useEffect(() => {
    // Reset to page 1 when category or productsPerPage changes
    setCurrentPage(1);
  }, [selectedCategory, productsPerPage]);

  useEffect(() => {
    // Filter and paginate products when category, productsPerPage, or currentPage changes
    filterAndPaginateProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, productsPerPage, allProducts, currentPage]);

  useEffect(() => {
    // Listen for updates from admin (products, categories, users)
    const handleProductUpdate = () => {
      console.log('Product update detected, refreshing...');
      fetchProducts();
      fetchFeaturedProducts();
      fetchCategories(); // Refresh categories in case they changed
    };

    const handleCategoryUpdate = () => {
      console.log('Category update detected, refreshing...');
      fetchCategories();
      fetchProducts(); // Refresh products in case category changes affected them
      fetchFeaturedProducts();
    };

    // Listen for window events (same tab/window)
    window.addEventListener('productUpdated', handleProductUpdate);
    window.addEventListener('categoryUpdated', handleCategoryUpdate);
    window.addEventListener('adminDataUpdated', handleProductUpdate);

    // Listen for localStorage changes (cross-tab communication)
    const handleStorageChange = (e) => {
      if (e.key === 'productUpdated' || e.key === 'categoryUpdated' || e.key === 'adminDataUpdated') {
        handleProductUpdate();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('productUpdated', handleProductUpdate);
      window.removeEventListener('categoryUpdated', handleCategoryUpdate);
      window.removeEventListener('adminDataUpdated', handleProductUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('https://localhost:5000/api/products/categories/list');
      // Failsafe: Sort by createdAt desc on frontend
      const sortedCategories = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setCategories(sortedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Request all products by setting a high limit
      const url = 'https://localhost:5000/api/products?limit=1000';
      const res = await axios.get(url);
      // Handle both response formats: {products: [...]} or [...]
      const productsList = Array.isArray(res.data) ? res.data : (res.data.products || []);
      setAllProducts(productsList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const filterAndPaginateProducts = () => {
    let filtered = [...allProducts];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Calculate pagination
    // eslint-disable-next-line no-unused-vars
    const totalPages = Math.ceil(filtered.length / productsPerPage);
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);
    setProducts(paginated);
  };

  const getTotalPages = () => {
    let filtered = [...allProducts];
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    return Math.ceil(filtered.length / productsPerPage);
  };

  const fetchFeaturedProducts = async () => {
    try {
      const res = await axios.get('https://localhost:5000/api/products/featured/all');
      setFeaturedProducts(res.data);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    }
  };


  const handleSwitchToLogin = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  const handleSwitchToRegister = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>{t('loading')} {t('products').toLowerCase()}...</p>
      </div>
    );
  }

  return (
    <div className="landing-page">
      {/* Banner Carousel */}
      {/* <section className="banner-carousel">
        <div className="banner-container">
          {bannerSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`banner-slide ${index === currentSlide ? 'active' : ''}`}
              style={{ background: slide.color }}
            >
              <div className="banner-content">
                <h1 className="banner-title">{slide.title}</h1>
                <p className="banner-subtitle">{slide.subtitle}</p>
              </div>
            </div>
          ))}
          <div className="banner-dots">
            {bannerSlides.map((_, index) => (
              <button
                key={index}
                className={`banner-dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      </section> */}

      <section className="banner-carousel">
        <div className="banner-container">
          {bannerSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`banner-slide ${index === currentSlide ? 'active' : ''}`}
              style={{
                backgroundImage: `
            url(${slide.image})
          `
              }}
            >
              <div className="banner-content">
                <h1 className="banner-title">{slide.title}</h1>
                <p className="banner-subtitle">{slide.subtitle}</p>
              </div>
            </div>
          ))}

          <div className="banner-dots">
            {bannerSlides.map((_, index) => (
              <button
                key={index}
                className={`banner-dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      </section>


      {/* Category Filter & All Products */}
      <section className="products-section">
        <div className="container-with-sidebar">
          {/* Left Sidebar - Category Filter */}
          <div className="sidebar">
            <div className="sidebar-content">
              <h3 className="sidebar-title">{t('filterByCategory')}</h3>
              <div className="category-list">
                <button
                  className={`category-item ${selectedCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('all')}
                >
                  {t('allCategories')}
                </button>
                {categories.map((category) => (
                  <button
                    key={category._id}
                    className={`category-item ${selectedCategory === category.name ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Show Products Dropdown */}
              <div className="show-products-section">
                <label htmlFor="per-page-select" className="show-products-label">{t('showProducts')} ({t('perPage')}):</label>
                <select
                  id="per-page-select"
                  value={productsPerPage}
                  onChange={(e) => setProductsPerPage(Number(e.target.value))}
                  className="show-products-dropdown"
                >
                  <option value={16}>16</option>
                  <option value={28}>28</option>
                  <option value={36}>36</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="main-content">

            {products.length === 0 ? (
              <div className="no-products">
                <p>{t('noProducts')}{selectedCategory !== 'all' ? ` ${t('inThisCategory')}` : ''}. {t('adminCanAdd')}</p>
              </div>
            ) : (
              <div className="products-grid">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                  />
                ))}
              </div>
            )}
            {/* Pagination */}
            {getTotalPages() > 1 && (
              <div className="pagination">
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.max(1, prev - 1));
                    setTimeout(() => {
                      document.documentElement.scrollTop = 0;
                      document.body.scrollTop = 0;
                    }, 100);
                  }}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  {t('previous')}
                </button>
                <span className="pagination-info">
                  {t('page')} {currentPage} {t('of')} {getTotalPages()}
                </span>
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.min(getTotalPages(), prev + 1));
                    setTimeout(() => {
                      document.documentElement.scrollTop = 0;
                      document.body.scrollTop = 0;
                    }, 100);
                  }}
                  disabled={currentPage === getTotalPages()}
                  className="pagination-btn"
                >
                  {t('next')}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Modals */}
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={handleSwitchToRegister}
      />
    </div>
  );
};

export default LandingPage;

