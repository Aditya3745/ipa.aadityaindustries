import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import ProductCard from '../components/ProductCard';
import ProductDetailModal from '../components/ProductDetailModal';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_visible', true)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error("Error fetching products: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = ['All', 'Executive', 'Ergonomic', 'Mesh', 'Conference', 'Lounge'];
  
  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <main style={{ padding: '2rem 0', backgroundColor: '#f9fafb', minHeight: '80vh' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>All Products</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '1rem' }}>
            Browse our complete catalog of premium office seating, designed for comfort, durability, and style.
          </p>
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '4rem' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '0.5rem 1.5rem',
                borderRadius: '50px',
                border: activeCategory === cat ? 'none' : '1px solid #cbd5e1',
                backgroundColor: activeCategory === cat ? 'var(--primary)' : 'white',
                color: activeCategory === cat ? 'white' : 'var(--text-primary)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading Catalog...</div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>No products found in this category.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                index={index}
                title={product.title}
                description={product.description}
                images={product.images || []}
                category={product.category}
                badge={product.badge}
                materials={product.materials}
                dimensions={product.dimensions}
                weight_capacity={product.weight_capacity}
                colors={product.colors}
                stock_count={product.stock_count}
                model_3d_url={product.model_3d_url}
                onClick={() => setSelectedProduct(product)}
                productData={product}
              />
            ))}
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}
    </main>
  );
};

export default Products;
