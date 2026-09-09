export const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.65)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: '1rem'
};

export const modalContainerStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  width: '100%',
  maxWidth: '650px',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  padding: '1.75rem',
  position: 'relative'
};

export const cardStyle = {
  backgroundColor: '#ffffff',
  padding: '1.5rem',
  borderRadius: '12px',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
  border: '1px solid #f1f5f9'
};

export const inputStyle = {
  width: '100%',
  padding: '0.65rem 0.85rem',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  fontSize: '0.875rem',
  backgroundColor: '#ffffff',
  color: '#0f172a',
  outline: 'none',
  transition: 'border-color 0.15s ease'
};

export const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#475569',
  marginBottom: '0.35rem'
};

export const gridStyle2 = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '1rem'
};

export const gridStyle3 = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '1rem'
};
