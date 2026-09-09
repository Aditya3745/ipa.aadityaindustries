import React, { useState, useEffect } from 'react';
import { Plus, ReceiptIndianRupee } from 'lucide-react';
import DataCard from '../../DataCard';
import ModalWrapper from '../../ModalWrapper';
import FormActions from '../../FormActions';
import { peekNextId } from '../../../utils/sequenceManager';
import { logTransaction } from '../../../utils/transactionLogger';
import { cardStyle, inputStyle, labelStyle, gridStyle3 } from '../../../styles/formStyles';
import toast from 'react-hot-toast';

export const AccountsModule = ({ transactions = [], setModalConfig, onRefresh }) => {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Accounts & Transactions</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setModalConfig({ isOpen: true, type: 'transaction' })}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <Plus size={16} /> Add Record
          </button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {transactions.map((t, idx) => (
          <DataCard
            key={t.transaction_id || idx}
            index={idx}
            icon={ReceiptIndianRupee}
            iconColor={t.transaction_type === 'Income' ? '#10b981' : '#ef4444'}
            title={t.description || t.reference_id || 'Transaction'}
            subtitle={`${t.transaction_id} | ${(t.payment_date || t.transaction_date || t.created_at || '').split('T')[0]}`}
            status={t.transaction_type}
            statusColor={t.transaction_type === 'Income' ? '#10b981' : '#ef4444'}
            details={[
              { label: 'Amount', value: `₹${Number(t.amount || 0).toFixed(2)}`, color: t.transaction_type === 'Income' ? '#10b981' : '#ef4444' },
              { label: 'Account / Mode', value: t.account_type || t.payment_method || 'Cash' },
              { label: 'Ref', value: t.reference_id ? `${t.reference_table || ''} (${t.reference_id})` : 'General' }
            ]}
          />
        ))}
      </div>
      {transactions.length === 0 && <p style={{ padding: '1rem', color: '#64748b' }}>No transactions found.</p>}
    </div>
  );
};

export const TransactionModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    transaction_type: 'Income',
    amount: '',
    description: '',
    account_type: 'Cash',
    payment_date: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txnIdPreview, setTxnIdPreview] = useState('AIND/TRNS/...');

  useEffect(() => {
    peekNextId('TRANS_ID', 'AIND/TRNS/').then(setTxnIdPreview);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(formData.amount);
    if (!amount || amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    setIsSubmitting(true);

    try {
      const success = await logTransaction(
        formData.transaction_type,
        amount,
        formData.description || 'Manual entry',
        formData.account_type,
        null,
        null,
        formData.payment_date
      );

      if (!success) throw new Error("Failed to write transaction row");

      toast.success("Transaction recorded successfully!"); 
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) { 
      console.error(err); 
      toast.error("Failed to record transaction: " + (err.message || '')); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <ModalWrapper title="New Transaction" onClose={onClose} maxWidth="750px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={gridStyle3}>
          <div>
            <label style={labelStyle}>Txn ID (Auto):</label>
            <input type="text" style={{ ...inputStyle, backgroundColor: '#f8fafc', color: '#64748b' }} value={txnIdPreview} disabled />
          </div>
          <div>
            <label style={labelStyle}>Transaction Type *</label>
            <select
              style={inputStyle}
              value={formData.transaction_type}
              onChange={e => setFormData({ ...formData, transaction_type: e.target.value })}
            >
              <option value="Income">Income (Received)</option>
              <option value="Expense">Expense (Paid Out)</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              style={inputStyle}
              required
              min="0.01"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
            />
          </div>
        </div>

        <div style={gridStyle3}>
          <div>
            <label style={labelStyle}>Payment Mode / Account</label>
            <select
              style={inputStyle}
              value={formData.account_type}
              onChange={e => setFormData({ ...formData, account_type: e.target.value })}
            >
              <option value="Cash">Cash</option>
              <option value="Bank">Bank Account</option>
              <option value="UPI">UPI / Online</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Date</label>
            <input
              type="date"
              style={inputStyle}
              value={formData.payment_date}
              onChange={e => setFormData({ ...formData, payment_date: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Description / Notes</label>
            <input
              type="text"
              style={inputStyle}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Purpose of transaction"
            />
          </div>
        </div>

        <FormActions onClose={onClose} isSubmitting={isSubmitting} label="Record Transaction" />
      </form>
    </ModalWrapper>
  );
};

export default AccountsModule;
