import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Box, Image, Edit2, Share2 } from 'lucide-react';
import '@google/model-viewer';
import styles from './ProductCard.module.css';
import { shareProduct } from '../utils/shareUtils';

const ProductCard = ({ title, description, images, category, badge, materials, dimensions, weight_capacity, colors, index, stock_count, model_3d_url, onEdit, onClick, productData }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showSpecs, setShowSpecs] = useState(false);
  const [viewMode, setViewMode] = useState('image');
  const [isSharing, setIsSharing] = useState(false);

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % (images?.length || 1));
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? (images?.length || 1) - 1 : prev - 1));
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    if (productData) {
      setIsSharing(true);
      await shareProduct(productData);
      setIsSharing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={styles.card}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div 
        className={styles.imageContainer} 
        style={{ position: 'relative' }}
      >
        {badge && (
          <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--primary)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {badge}
          </div>
        )}
        {category && (
          <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(255,255,255,0.9)', color: 'var(--text-primary)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', zIndex: 10 }}>
            {category}
          </div>
        )}
        {stock_count !== undefined && stock_count !== null && (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            background: stock_count > 10 ? '#10b981' : stock_count > 0 ? '#f59e0b' : '#64748b',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: '600',
            zIndex: 10
          }}>
            {stock_count > 10 ? 'In Stock' : stock_count > 0 ? 'Low Stock' : 'Made to Order'}
          </div>
        )}
        {model_3d_url && (
          <div style={{ position: 'absolute', top: '10px', right: badge ? '80px' : '10px', zIndex: 11 }}>
            <button
              onClick={(e) => { e.stopPropagation(); setViewMode(prev => prev === 'image' ? '3d' : 'image'); }}
              style={{
                background: 'rgba(255,255,255,0.9)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              title={viewMode === 'image' ? 'View 3D Model' : 'View Image'}
            >
              {viewMode === 'image' ? <Box size={16} color="var(--primary)" /> : <Image size={16} color="var(--primary)" />}
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {viewMode === '3d' && model_3d_url ? (
            <motion.div
              key="3d-viewer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ width: '100%', height: '100%', backgroundColor: '#f1f5f9' }}
              onClick={(e) => e.stopPropagation()}
            >
              <model-viewer
                src={model_3d_url}
                auto-rotate
                camera-controls
                style={{ width: '100%', height: '100%' }}
              ></model-viewer>
            </motion.div>
          ) : (
            <motion.img
              key={currentImageIndex}
              src={images && images.length > 0 ? images[currentImageIndex] : 'https://placehold.co/400x300?text=No+Image'}
              alt={`${title} view ${currentImageIndex + 1}`}
              loading="lazy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={styles.productImage}
            />
          )}
        </AnimatePresence>

        {viewMode === 'image' && images && images.length > 1 && (
          <div className={styles.controls}>
            <button onClick={prevImage} className={styles.controlButton}>
              <ChevronLeft size={16} />
            </button>
            <div className={styles.dots}>
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`${styles.dot} ${idx === currentImageIndex ? styles.dotActive : styles.dotInactive}`}
                />
              ))}
            </div>
            <button onClick={nextImage} className={styles.controlButton}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <div className={styles.details}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 className={styles.title} style={{ marginBottom: '0.5rem', flex: 1, paddingRight: '0.5rem' }}>{title}</h3>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              onClick={handleShare}
              disabled={isSharing}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
              title="Share"
            >
              <Share2 size={16} />
            </button>
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                title="Edit"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>
        </div>

        {!showSpecs ? (
          <>
            <p className={styles.description}>{description}</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              {(materials || dimensions || weight_capacity || colors) && (
                <button onClick={(e) => { e.stopPropagation(); setShowSpecs(true); }} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '0.75rem 1.5rem', borderRadius: '4px', fontWeight: '600', cursor: 'pointer', flex: 1 }}>Specs</button>
              )}
            </div>
          </>
        ) : (
          <div style={{ fontSize: '0.875rem', marginBottom: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '4px' }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Specifications</h4>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-secondary)' }}>
              {materials && <li><strong>Materials:</strong> {materials}</li>}
              {dimensions && <li><strong>Dimensions:</strong> {dimensions}</li>}
              {weight_capacity && <li><strong>Capacity:</strong> {weight_capacity}</li>}
              {colors && <li><strong>Colors:</strong> {colors}</li>}
            </ul>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button onClick={(e) => { e.stopPropagation(); setShowSpecs(false); }} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '0.75rem 1.5rem', borderRadius: '4px', fontWeight: '600', cursor: 'pointer', flex: 1 }}>Description</button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;
