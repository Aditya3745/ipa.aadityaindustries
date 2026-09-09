import React, { useState, useEffect } from 'react';
import { IndianRupee, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import FormActions from './FormActions';
import { inputStyle, labelStyle } from '../styles/formStyles';

export const PaymentDialog = ({
  isOpen,
  onClose,
  title = 'Record Payment',
  invoiceId,
  partyName = '',
  dueAmount = 0,
  onConfirm,
  isLoading = false
}) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount(dueAmount > 0 ? String(dueAmount) : '');
      setPaymentMethod('Cash');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setError('');
    }
  }, [isOpen, dueAmount]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = Number(amount);
    if (!num || isNaN(num) || num <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    if (dueAmount > 0 && num > dueAmount) {
      setError(`Amount cannot exceed the remaining due of Rs ${dueAmount}`);
      return;
    }
    setError('');
    await onConfirm({
      amount: num,
      paymentMethod,
      paymentDate
    });
  };

  return (
    <ModalWrapper title={title} onClose={onClose} maxWidth="480px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Info banner */}
        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem 1rem' }}>
          {invoiceId && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
              <span style={{ color: '#64748b' }}>Reference ID:</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{invoiceId}</span>
            </div>
          )}
          {partyName && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
              <span style={{ color: '#64748b' }}>Party:</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{partyName}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span style={{ color: '#64748b' }}>Remaining Due:</span>
            <span style={{ fontWeight: 700, color: '#ef4444' }}>Rs {Number(dueAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.65rem 0.85rem', color: '#b91c1c', fontSize: '0.825rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Amount Input */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <label style={labelStyle}>Payment Amount (₹) *</label>
            {dueAmount > 0 && (
              <button
                type="button"
                onClick={() => setAmount(String(dueAmount))}
                style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Full Due
              </button>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <IndianRupee size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={dueAmount > 0 ? dueAmount : undefined}
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(''); }}
              style={{ ...inputStyle, paddingLeft: '2.25rem', fontSize: '1rem', fontWeight: 600 }}
              placeholder="0.00"
              autoFocus
              required
            />
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label style={labelStyle}>Payment Mode *</label>
          <div style={{ position: 'relative' }}>
            <CreditCard size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '2.25rem', cursor: 'pointer' }}
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI / QR Code</option>
              <option value="Bank">Bank Transfer (NEFT/RTGS/IMPS)</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
        </div>

        {/* Payment Date */}
        <div>
          <label style={labelStyle}>Payment Date *</label>
          <div style={{ position: 'relative' }}>
            <Calendar size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '2.25rem' }}
              required
            />
          </div>
        </div>

        <FormActions
          onClose={onClose}
          isSubmitting={isLoading}
          label="Confirm & Record Payment"
          disabled={!amount || Number(amount) <= 0}
        />
      </form>
    </ModalWrapper>
  );
};

export default PaymentDialog;
