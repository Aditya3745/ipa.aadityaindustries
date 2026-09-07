import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import ProductDetailModal from '../components/ProductDetailModal';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState({ name: '', email: '', phone: '', message: '' });
  const [formStatus, setFormStatus] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_visible', true)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        setFeaturedProducts(data || []);
      } catch (error) {
        console.error("Error fetching featured products: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('submitting');
    try {
      const { error } = await supabase.from('inquiries').insert([formState]);
      if (error) throw error;
      setFormStatus('success');
      setFormState({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setFormStatus(null), 5000);
    } catch (error) {
      console.error("Error submitting inquiry: ", error);
      setFormStatus('error');
    }
  };

  return (
    <main>
      <Hero />
      <section id="collection" style={{ padding: '5rem 0', backgroundColor: '#f9fafb' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Signature Collection</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '1.125rem' }}>
              Explore our range of meticulously crafted chairs, where uncompromising quality meets innovative design.
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading Collection...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
              {featuredProducts.map((product, index) => (
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
                  onClick={() => setSelectedProduct(product)}
                  productData={product}
                />
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            <Link
              to="/products"
              style={{
                display: 'inline-block',
                backgroundColor: 'var(--primary)',
                color: 'white',
                padding: '0.75rem 2rem',
                borderRadius: '4px',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'background-color 0.2s ease'
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--primary)'}
            >
              See All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" style={{ padding: '5rem 0', backgroundColor: 'white' }}>
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Request a Quote</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Interested in a specific product or placing a bulk order? Send us a message and our team will get back to you immediately.</p>
          </div>

          <div style={{ backgroundColor: '#f9fafb', padding: '3rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            {formStatus === 'success' ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#10b981' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Message Sent!</h3>
                <p>Thank you for reaching out. We will contact you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Full Name *</label>
                    <input type="text" required value={formState.name} onChange={e => setFormState({ ...formState, name: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Phone Number *</label>
                    <input type="tel" required value={formState.phone} onChange={e => setFormState({ ...formState, phone: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email Address *</label>
                  <input type="email" required value={formState.email} onChange={e => setFormState({ ...formState, email: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>How can we help you? *</label>
                  <textarea required rows="4" value={formState.message} onChange={e => setFormState({ ...formState, message: e.target.value })} placeholder="I am interested in..." style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}></textarea>
                </div>
                {formStatus === 'error' && <p style={{ color: '#ef4444', margin: 0 }}>Error sending message. Please try again.</p>}
                <button type="submit" disabled={formStatus === 'submitting'} style={{ padding: '1rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '1rem', cursor: formStatus === 'submitting' ? 'not-allowed' : 'pointer' }}>
                  {formStatus === 'submitting' ? 'Sending...' : 'Send Inquiry'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}
    </main>
  );
};

export default Home;
