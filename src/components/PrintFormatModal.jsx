import React from 'react';
import { LayoutGrid, FileText, X } from 'lucide-react';

const PrintFormatModal = ({ onClose, onSelect }) => {
  return (
    <div className="print-format-modal" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', position: 'relative' }}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
        >
          <X size={20} />
        </button>
        
        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: '#0f172a', textAlign: 'center' }}>Select Print Format</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button 
            onClick={() => onSelect('catalog')}
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
          >
            <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '0.75rem', borderRadius: '8px' }}>
              <LayoutGrid size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '1rem' }}>Catalog Format</div>
              <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>Visual layout with cards</div>
            </div>
          </button>

          <button 
            onClick={() => onSelect('detailed')}
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
          >
            <div style={{ backgroundColor: '#10b981', color: 'white', padding: '0.75rem', borderRadius: '8px' }}>
              <FileText size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '1rem' }}>Detailed Format</div>
              <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>Standard tabular PDF report</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintFormatModal;
