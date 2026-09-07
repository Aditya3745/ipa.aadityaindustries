import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Box, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { shareProduct } from '../utils/shareUtils';

const ProductDetailModal = ({ product, onClose }) => {
  const [viewMode, setViewMode] = useState('image');
  const [isSharing, setIsSharing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!product) return null;

  const handleShare = async () => {
    setIsSharing(true);
    await shareProduct(product);
    setIsSharing(false);
  };

  const displayTitle = product.title || product.product_name || 'Product';
  const displayImages = product.images || (product.image_url ? [product.image_url] : []);
  
  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  const modalContent = (
    <AnimatePresence>
      <motion.div
        key="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
        onClick={onClose}
      >
        <motion.div
          key="modal-content"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10 }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>{displayTitle}</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={handleShare}
                disabled={isSharing}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: '#f1f5f9', color: 'var(--primary)' }}
                title="Share"
              >
                <Share2 size={20} />
              </button>
              <button 
                onClick={onClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: '#f1f5f9' }}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Image Area */}
          <div style={{ position: 'relative', width: '100%', height: '300px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {product.model_3d_url && (
              <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 11 }}>
                <button
                  onClick={() => setViewMode(prev => prev === 'image' ? '3d' : 'image')}
                  style={{
                    background: 'rgba(255,255,255,0.9)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  title={viewMode === 'image' ? 'View 3D Model' : 'View Image'}
                >
                  {viewMode === 'image' ? <Box size={20} color="var(--primary)" /> : <ImageIcon size={20} color="var(--primary)" />}
                </button>
              </div>
            )}

            {viewMode === '3d' && product.model_3d_url ? (
              <model-viewer
                src={product.model_3d_url}
                auto-rotate
                camera-controls
                style={{ width: '100%', height: '100%' }}
              ></model-viewer>
            ) : (
              <>
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={currentImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    src={displayImages && displayImages.length > 0 ? displayImages[currentImageIndex] : 'https://placehold.co/600x400?text=No+Image'} 
                    alt={`${displayTitle} - ${currentImageIndex + 1}`} 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </AnimatePresence>

                {displayImages.length > 1 && (
                  <>
                    <button 
                      onClick={prevImage}
                      style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button 
                      onClick={nextImage}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                    >
                      <ChevronRight size={24} />
                    </button>
                    <div style={{ position: 'absolute', bottom: '10px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '6px' }}>
                      {displayImages.map((_, idx) => (
                        <div 
                          key={idx}
                          style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: idx === currentImageIndex ? 'var(--primary)' : 'rgba(0,0,0,0.2)', transition: 'background-color 0.2s' }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Details Area */}
          <div style={{ padding: '1.5rem' }}>
            {product.category && (
              <span style={{ display: 'inline-block', padding: '4px 12px', backgroundColor: '#e2e8f0', borderRadius: '16px', fontSize: '0.875rem', fontWeight: '500', marginBottom: '1rem' }}>
                {product.category}
              </span>
            )}
            
            <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {product.description}
            </p>

            <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 'bold' }}>Specifications</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                {product.materials && (
                  <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    <span style={{ width: '120px', fontWeight: '600', color: '#64748b' }}>Materials:</span>
                    <span style={{ flex: 1, color: '#0f172a' }}>{product.materials}</span>
                  </div>
                )}
                {product.dimensions && (
                  <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    <span style={{ width: '120px', fontWeight: '600', color: '#64748b' }}>Dimensions:</span>
                    <span style={{ flex: 1, color: '#0f172a' }}>{product.dimensions}</span>
                  </div>
                )}
                {product.weight_capacity && (
                  <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    <span style={{ width: '120px', fontWeight: '600', color: '#64748b' }}>Capacity:</span>
                    <span style={{ flex: 1, color: '#0f172a' }}>{product.weight_capacity}</span>
                  </div>
                )}
                {product.colors && (
                  <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    <span style={{ width: '120px', fontWeight: '600', color: '#64748b' }}>Colors:</span>
                    <span style={{ flex: 1, color: '#0f172a' }}>{product.colors}</span>
                  </div>
                )}
                {product.stock_count !== undefined && product.stock_count !== null && (
                  <div style={{ display: 'flex', paddingTop: '0.25rem' }}>
                    <span style={{ width: '120px', fontWeight: '600', color: '#64748b' }}>Availability:</span>
                    <span style={{ flex: 1, color: product.stock_count > 10 ? '#10b981' : product.stock_count > 0 ? '#f59e0b' : '#64748b', fontWeight: 'bold' }}>
                      {product.stock_count > 10 ? 'In Stock' : product.stock_count > 0 ? 'Low Stock' : 'Made to Order'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <a 
              href="#contact" 
              onClick={onClose}
              style={{ display: 'block', width: '100%', padding: '1rem', backgroundColor: 'var(--primary)', color: 'white', textAlign: 'center', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', marginTop: '1.5rem' }}
            >
              Inquire About This Product
            </a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default ProductDetailModal;
