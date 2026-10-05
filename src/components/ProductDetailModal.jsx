import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Box, Image as ImageIcon, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { shareProduct } from '../utils/shareUtils';

const ProductDetailModal = ({ product, suppliers = [], onClose }) => {
  const [viewMode, setViewMode] = useState('image');
  const [isSharing, setIsSharing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showSupplierDetails, setShowSupplierDetails] = useState(false);

  if (!product) return null;

  const handleShare = async () => {
    setIsSharing(true);
    await shareProduct(product);
    setIsSharing(false);
  };

  const displayTitle = product.title || product.product_name || 'Product';
  const displayImages = product.images || (product.image_url ? [product.image_url] : []);

  // Resolve assigned supplier
  const supplierObj = product.suppliers || (suppliers || []).find(s => s.supplier_id === product.supplier_id);
  const supplierName = supplierObj?.supp_comp_name || product.supplier_name || (product.supplier_id ? `ID: ${product.supplier_id}` : 'Not Assigned');
  const supplierPhone = supplierObj?.supp_comp_no || supplierObj?.supp_comp_person_no;
  
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
            maxWidth: '620px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a' }}>{displayTitle}</h2>
              {product.product_id && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {product.product_id}</span>}
            </div>
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
          <div style={{ position: 'relative', width: '100%', height: '280px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

          {/* Details & Specifications Area */}
          <div style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {product.category && (
                <span style={{ padding: '3px 10px', backgroundColor: '#e2e8f0', color: '#475569', borderRadius: '16px', fontSize: '0.8rem', fontWeight: '600' }}>
                  {product.category}
                </span>
              )}
              {product.product_type && (
                <span style={{ padding: '3px 10px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '16px', fontSize: '0.8rem', fontWeight: '600' }}>
                  {product.product_type}
                </span>
              )}
            </div>
            
            {product.description && (
              <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                {product.description}
              </p>
            )}

            {/* Specifications Card */}
            <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 'bold', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem' }}>
                Product Specifications
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.65rem', fontSize: '0.875rem' }}>
                {/* Supplier Name with Protected Eye Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.5rem' }}>
                  <span style={{ width: '140px', fontWeight: '600', color: '#64748b' }}>Assigned Supplier:</span>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: showSupplierDetails ? '#0f172a' : '#94a3b8', fontWeight: showSupplierDetails ? 'bold' : '500' }}>
                      {showSupplierDetails ? `${supplierName} ${supplierPhone ? `(${supplierPhone})` : ''}` : '•••••••• (Protected)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSupplierDetails(!showSupplierDetails)}
                      style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#475569' }}
                      title={showSupplierDetails ? "Hide Supplier Info" : "Reveal Supplier Info"}
                    >
                      {showSupplierDetails ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {product.selling_rate !== undefined && product.selling_rate !== null && (
                  <div style={{ display: 'flex', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.5rem' }}>
                    <span style={{ width: '140px', fontWeight: '600', color: '#64748b' }}>Selling Price:</span>
                    <span style={{ flex: 1, color: '#10b981', fontWeight: 'bold', fontSize: '1rem' }}>
                      ₹{Number(product.selling_rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })} / {product.unit || 'Piece'}
                    </span>
                  </div>
                )}

                {product.hsn_code && (
                  <div style={{ display: 'flex', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.5rem' }}>
                    <span style={{ width: '140px', fontWeight: '600', color: '#64748b' }}>HSN Code:</span>
                    <span style={{ flex: 1, color: '#334155' }}>{product.hsn_code}</span>
                  </div>
                )}

                {product.materials && (
                  <div style={{ display: 'flex', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.5rem' }}>
                    <span style={{ width: '140px', fontWeight: '600', color: '#64748b' }}>Materials:</span>
                    <span style={{ flex: 1, color: '#334155' }}>{product.materials}</span>
                  </div>
                )}

                {product.dimensions && (
                  <div style={{ display: 'flex', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.5rem' }}>
                    <span style={{ width: '140px', fontWeight: '600', color: '#64748b' }}>Dimensions:</span>
                    <span style={{ flex: 1, color: '#334155' }}>{product.dimensions}</span>
                  </div>
                )}

                {product.weight_capacity && (
                  <div style={{ display: 'flex', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.5rem' }}>
                    <span style={{ width: '140px', fontWeight: '600', color: '#64748b' }}>Weight Capacity:</span>
                    <span style={{ flex: 1, color: '#334155' }}>{product.weight_capacity}</span>
                  </div>
                )}

                {product.colors && (
                  <div style={{ display: 'flex', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.5rem' }}>
                    <span style={{ width: '140px', fontWeight: '600', color: '#64748b' }}>Available Colors:</span>
                    <span style={{ flex: 1, color: '#334155' }}>{product.colors}</span>
                  </div>
                )}

                {product.reorder_level !== undefined && product.reorder_level !== null && (
                  <div style={{ display: 'flex', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.5rem' }}>
                    <span style={{ width: '140px', fontWeight: '600', color: '#64748b' }}>Min Reorder Level:</span>
                    <span style={{ flex: 1, color: '#334155' }}>{product.reorder_level} units</span>
                  </div>
                )}

                {product.stock_count !== undefined && product.stock_count !== null && (
                  <div style={{ display: 'flex', paddingTop: '0.2rem' }}>
                    <span style={{ width: '140px', fontWeight: '600', color: '#64748b' }}>Stock Status:</span>
                    <span style={{ flex: 1, color: product.stock_count > 10 ? '#10b981' : product.stock_count > 0 ? '#f59e0b' : '#ef4444', fontWeight: 'bold' }}>
                      {product.stock_count} units {product.stock_count > 10 ? '(In Stock)' : product.stock_count > 0 ? '(Low Stock)' : '(Out of Stock)'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default ProductDetailModal;
