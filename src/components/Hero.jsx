import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronRight, Armchair } from 'lucide-react';
import { supabase } from '../supabase';
import styles from './Hero.module.css';

const Hero = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, title, category, badge, images, stock_count, model_3d_url')
          .eq('is_visible', true)
          .order('display_order', { ascending: true })
          .limit(6);

        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error('Hero: error fetching products', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Auto-cycle every 2 seconds
  useEffect(() => {
    if (products.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % products.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [products]);

  const activeProduct = products[activeIndex] || null;

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 24, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 120, damping: 18 } },
  };

  return (
    <section className={styles.heroSection}>
      <div className={styles.innerGrid}>
        {/* ── LEFT: Text Side ── */}
        <motion.div
          className={styles.textSide}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className={styles.badge}>
            <span className={styles.badgePulse} />
            Office Furniture & Fabrication, Patna
          </motion.div>

          <motion.h1 variants={itemVariants} className={styles.title}>
            Built for Work,
            <span className={styles.titleHighlight}>Made to Last</span>
          </motion.h1>

          <motion.p variants={itemVariants} className={styles.subtitle}>
            From premium ergonomic chairs to sturdy office tables, benches, and custom fabrication work — Aaditya Industries manufactures quality furniture right here in Patna, Bihar.
          </motion.p>

          <motion.div variants={itemVariants} className={styles.divider} />

          <motion.div variants={itemVariants} className={styles.buttonGroup}>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link to="/products" className={styles.primaryButton}>
                Browse Collection <ArrowRight size={17} />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <a href="#contact" className={styles.secondaryButton}>
                Get a Free Quote
              </a>
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants} className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>🪑</span>
              <span className={styles.statNum}>500+</span>
              <span className={styles.statLabel}>Chairs Sold</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>🔩</span>
              <span className={styles.statNum}>4+</span>
              <span className={styles.statLabel}>Product Lines</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>✅</span>
              <span className={styles.statNum}>100%</span>
              <span className={styles.statLabel}>Quality Check</span>
            </div>
          </motion.div>
        </motion.div>

        {/* ── RIGHT: Product Showcase (Single Cycling Card) ── */}
        <div className={styles.showcaseSide}>
          {loading ? (
            <div className={styles.skeletonCard} />
          ) : activeProduct ? (
            <Link to="/products" className={styles.showcaseCard}>
              {/* Cycling Image */}
              <div className={styles.showcaseImageWrapper}>
                <AnimatePresence mode="wait">
                  <motion.img
                    key={`${activeProduct.id}-${activeIndex}`}
                    src={activeProduct.images?.[0] || ''}
                    alt={activeProduct.title}
                    className={styles.showcaseImage}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </AnimatePresence>

                {/* Fallback if no image */}
                {(!activeProduct.images || activeProduct.images.length === 0) && (
                  <div className={styles.showcaseFallback}>
                    <Armchair size={64} color="#475569" />
                  </div>
                )}

                {activeProduct.badge && (
                  <motion.span
                    key={`badge-${activeIndex}`}
                    className={styles.showcaseBadge}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    {activeProduct.badge}
                  </motion.span>
                )}

                {/* Stock Badge */}
                {activeProduct.stock_count !== undefined && activeProduct.stock_count !== null && (
                  <motion.div
                    key={`stock-${activeIndex}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{
                      position: 'absolute',
                      bottom: '16px',
                      left: '16px',
                      background: activeProduct.stock_count > 10 ? '#10b981' : activeProduct.stock_count > 0 ? '#f59e0b' : '#64748b',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      zIndex: 10,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {activeProduct.stock_count > 10 ? 'In Stock' : activeProduct.stock_count > 0 ? 'Low Stock' : 'Made to Order'}
                  </motion.div>
                )}
              </div>

              {/* Product Info below image */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`info-${activeIndex}`}
                  className={styles.showcaseInfo}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                >
                  <span className={styles.showcaseName}>{activeProduct.title}</span>
                  {activeProduct.category && (
                    <span className={styles.showcaseCategory}>{activeProduct.category}</span>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Dot indicators */}
              <div className={styles.dots}>
                {products.map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ''}`}
                    onClick={(e) => { e.preventDefault(); setActiveIndex(i); }}
                    aria-label={`Show product ${i + 1}`}
                  />
                ))}
              </div>
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default Hero;
