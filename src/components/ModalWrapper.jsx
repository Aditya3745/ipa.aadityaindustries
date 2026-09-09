import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { overlayStyle, modalContainerStyle } from '../styles/formStyles';

export const ModalWrapper = ({ title, onClose, children, maxWidth = '650px' }) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose && onClose()}>
      <div style={{ ...modalContainerStyle, maxWidth }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h3>
          {onClose && (
            <button
              onClick={onClose}
              type="button"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

export default ModalWrapper;
