import React from 'react';
import ProductCard from './ProductCard';
import './RelatedProducts.css';

const RelatedProducts = ({ products, currentProductId }) => {
    if (!products || products.length === 0) {
        return null;
    }

    // Filter out the current product if it somehow got included
    const filteredProducts = products.filter(p => p._id !== currentProductId);

    if (filteredProducts.length === 0) {
        return null;
    }

    return (
        <div className="related-products-section">
            <h2 className="related-products-title">Related Products</h2>
            <div className="related-products-grid">
                {filteredProducts.slice(0, 4).map((product) => (
                    <ProductCard
                        key={product._id}
                        product={product}
                    />
                ))}
            </div>
        </div>
    );
};

export default RelatedProducts;
