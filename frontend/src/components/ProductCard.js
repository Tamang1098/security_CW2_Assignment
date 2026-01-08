import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Handle image URL - convert relative paths to full URLs
  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/400x300?text=No+Image';

    let path = imagePath;
    // Force HTTPS for localhost to avoid mixed content blocks
    if (typeof path === 'string' && path.startsWith('http://localhost:5000')) {
      path = path.replace('http://localhost:5000', 'https://localhost:5000');
    }

    // If it's a full URL, return it
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // If it's a relative path, prepend backend URL
    if (path.startsWith('/uploads/')) {
      return `https://localhost:5000${path}`;
    }
    if (path.startsWith('uploads/')) {
      return `https://localhost:5000/${path}`;
    }

    // Handle just filename
    if (!path.includes('://') && !path.startsWith('/')) {
      return `https://localhost:5000/uploads/${path}`;
    }

    return path;
  };

  const handleCardClick = () => {
    navigate(`/product/${product._id}`);
  };

  return (
    <div className="product-card" onClick={handleCardClick}>
      <div className="product-image-container">
        <img
          src={getImageUrl(product.image)}
          alt={product.name}
          className="product-image"
          onError={(e) => {
            // Try alternative image paths if first attempt fails
            const currentSrc = e.target.src;
            if (!currentSrc.includes('placeholder')) {
              // If it's a localhost URL that failed, try different path formats
              if (currentSrc.includes('localhost:5000')) {
                const pathParts = currentSrc.split('/');
                const filename = pathParts[pathParts.length - 1];
                e.target.src = `https://localhost:5000/uploads/${filename}`;
              } else {
                e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
              }
            }
            e.target.style.objectFit = 'cover';
          }}
          loading="lazy"
        />
        {discount > 0 && (
          <span className="product-discount">-{discount}%</span>
        )}
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <div className="product-price-container">
          {product.originalPrice && (
            <span className="product-original-price">Rs. {product.originalPrice}</span>
          )}
          <span className="product-price">Rs. {product.price}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

