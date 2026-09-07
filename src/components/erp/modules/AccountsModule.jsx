import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { Plus, ReceiptIndianRupee } from 'lucide-react';
import DataCard from '../../DataCard';

const cardStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' };

export const AccountsModule = ({ transactions, setModalConfig }) => {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Accounts & Transactions</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setModalConfig({ isOpen: true, type: 'transaction' })} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}><Plus size={16} /> Add Record</button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {transactions.map((t, idx) => (
          <DataCard
            key={t.transaction_id}
            index={idx}
            icon={ReceiptIndianRupee}
            iconColor={t.transaction_type === 'Income' ? '#10b981' : '#ef4444'}
            title={t.description || t.reference_id || 'Transaction'}
            subtitle={`${t.transaction_id} | ${t.transaction_date?.split('T')[0]}`}
            status={t.transaction_type}
            statusColor={t.transaction_type === 'Income' ? '#10b981' : '#ef4444'}
            details={[
              { label: 'Amount', value: `Rs ${Number(t.amount || 0).toFixed(2)}`, color: t.transaction_type === 'Income' ? '#10b981' : '#ef4444' },
              { label: 'Status', value: t.status || 'Completed' }
            ]}
          />
        ))}
      </div>
      {transactions.length === 0 && <p style={{ padding: '1rem', color: '#64748b' }}>No transactions found.</p>}
    </div>
  );
};

export const TransactionModal = ({ onClose }) => {
  const [formData, setFormData] = useState({ transaction_type: 'Income', amount: 0, description: '', account_type: 'Cash' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txnIdPreview, setTxnIdPreview] = useState('AIND/TRNS/...');

  useEffect(() => {
    const fetchSeq = async () => {
      const { data } = await supabase.from('sequence_manager').select('*').eq('seq_name', 'TRANS_ID').single();
      if (data) setTxnIdPreview(`${data.prefix || 'AIND/TRNS/'}${String((data.current_val || 0) + 1).padStart(3, '0')}`);
    };
    fetchSeq();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.amount <= 0) return alert("Amount must be greater than 0");
    setIsSubmitting(true);

    const { data: seqData } = await supabase.from('sequence_manager').select('*').eq('seq_name', 'TRANS_ID').single();
    let newSeqVal = 1; let prefix = 'AIND/TRNS/';
    if (seqData) { newSeqVal = (seqData.current_val || 0) + 1; prefix = seqData.prefix || prefix; }
    const txnId = `${prefix}${String(newSeqVal).padStart(3, '0')}`;
    
    try {
      const { error } = await supabase.from('transactions').insert([{ 
         transaction_id: txnId, 
         transaction_type: formData.transaction_type,
         amount: formData.amount,
         description: formData.description,
         status: 'Completed'
      }]);
      if (error) throw error;
      
      await supabase.from('sequence_manager').update({ current_val: newSeqVal }).eq('seq_name', 'TRANS_ID');
      alert("Transaction added successfully!"); 
      onClose();
    } catch (err) { 
       console.error(err); 
       alert("Failed to record transaction."); 
    } finally { 
       setIsSubmitting(false); 
    }
  };

  const inputStyle = { width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem' };
  const labelStyle = { display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.75rem', color: '#475569' };
  const gridStyle3 = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>New Transaction</h2>
        <form onSubmit={handleSubmit}>
          
          <div style={gridStyle3}>
            <div>
              <label style={labelStyle}>Txn ID:</label>
              <input type="text" style={{...inputStyle, backgroundColor: '#f1f5f9', color: '#64748b'}} value={txnIdPreview} disabled />
            </div>
            <div>
              <label style={labelStyle}>Type:</label>
              <select style={inputStyle} value={formData.transaction_type} onChange={e => setFormData({...formData, transaction_type: e.target.value})}>
                 <option value="Income">Income</option>
                 <option value="Expense">Expense</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Amount *</label>
              <input type="number" step="0.01" style={inputStyle} required value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
            </div>
          </div>

          <div style={gridStyle3}>
            <div>
              <label style={labelStyle}>Payment Account:</label>
              <select style={inputStyle} value={formData.account_type} onChange={e => setFormData({...formData, account_type: e.target.value})}>
                 <option value="Cash">Cash</option>
                 <option value="Bank">Bank Account</option>
                 <option value="UPI">UPI</option>
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Description / Notes:</label>
              <input type="text" style={inputStyle} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.75rem 2rem', background: 'white', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
            <button type="submit" disabled={isSubmitting} style={{ padding: '0.75rem 2rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>{isSubmitting ? 'Saving...' : 'Record Transaction'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
