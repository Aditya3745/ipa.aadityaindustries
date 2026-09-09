import React from 'react';

export const FormActions = ({
  onClose,
  isSubmitting = false,
  label = 'Save',
  disabled = false,
  submitType = 'submit'
}) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          style={{
            padding: '0.6rem 1.2rem',
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            color: '#475569',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: isSubmitting ? 'not-allowed' : 'pointer'
          }}
        >
          Cancel
        </button>
      )}
      <button
        type={submitType}
        disabled={isSubmitting || disabled}
        style={{
          padding: '0.6rem 1.4rem',
          background: isSubmitting || disabled ? '#94a3b8' : 'var(--primary, #3b82f6)',
          border: 'none',
          borderRadius: '8px',
          color: 'white',
          fontWeight: 600,
          fontSize: '0.875rem',
          cursor: isSubmitting || disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: isSubmitting || disabled ? 'none' : '0 2px 6px rgba(59, 130, 246, 0.3)'
        }}
      >
        {isSubmitting ? (
          <>
            <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Saving...
          </>
        ) : (
          label
        )}
      </button>
    </div>
  );
};

export default FormActions;
