import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { Plus, Printer, Users } from 'lucide-react';
import DataCard from '../../DataCard';
import ModalWrapper from '../../ModalWrapper';
import FormActions from '../../FormActions';
import { generateId, peekNextId } from '../../../utils/sequenceManager';
import { cardStyle, inputStyle, labelStyle, gridStyle3 } from '../../../styles/formStyles';
import toast from 'react-hot-toast';

export const CustomerModule = ({ customers = [], setModalConfig, printCustomersTable }) => {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Customer Directory</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {printCustomersTable && (
            <button
              onClick={printCustomersTable}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              title="Print Table"
            >
              <Printer size={16} />
            </button>
          )}
          <button
            onClick={() => setModalConfig({ isOpen: true, type: 'customer' })}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <Plus size={16} /> Add Customer
          </button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {customers.map((c, idx) => (
          <DataCard
            key={c.customer_id || idx}
            index={idx}
            icon={Users}
            iconColor="#10b981"
            title={c.cust_comp_name}
            subtitle={c.customer_id}
            onEdit={() => setModalConfig({ isOpen: true, type: 'customer', editData: c })}
            status={c.customer_balance > 0 ? 'Dues Pending' : 'Clear'}
            statusColor={c.customer_balance > 0 ? '#ef4444' : '#10b981'}
            details={[
              { label: 'Phone', value: c.cust_comp_person_no || c.cust_comp_no || '—' },
              { label: 'Email', value: c.cust_email || '—' },
              { label: 'Balance Due', value: `₹${Number(c.customer_balance || 0).toFixed(2)}`, color: c.customer_balance > 0 ? '#ef4444' : '#10b981' }
            ]}
          />
        ))}
      </div>
      {customers.length === 0 && <p style={{ padding: '1rem', color: '#64748b' }}>No customers found.</p>}
    </div>
  );
};

export const CustomerModal = ({ onClose, editData, onSuccess }) => {
  const [formData, setFormData] = useState(editData || { 
    cust_comp_name: '', 
    cust_comp_no: '',
    cust_comp_person_no: '', 
    cust_email: '', 
    cust_address: '', 
    cust_gst_no: '',
    cust_comp_person: '',
    customer_balance: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerIdPreview, setCustomerIdPreview] = useState('AIND/CUST/...');

  useEffect(() => {
    if (editData) {
      setCustomerIdPreview(editData.customer_id);
    } else {
      peekNextId('CUST_ID', 'AIND/CUST/').then(setCustomerIdPreview);
    }
  }, [editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editData) {
        const { error } = await supabase.from('customers').update(formData).eq('customer_id', editData.customer_id);
        if (error) throw error;
        toast.success("Customer updated successfully!");
      } else {
        const customerId = await generateId('CUST_ID', 'AIND/CUST/');
        const { error } = await supabase.from('customers').insert([{ 
          customer_id: customerId, 
          ...formData
        }]);
        if (error) throw error;
        toast.success("Customer added successfully!");
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) { 
      console.error(err); 
      toast.error(`Failed to ${editData ? 'update' : 'add'} customer: ` + (err.message || '')); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <ModalWrapper title={editData ? 'Edit Customer' : 'Add Customer'} onClose={onClose} maxWidth="800px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Row 1 */}
        <div style={gridStyle3}>
          <div>
            <label style={labelStyle}>Customer ID (Auto):</label>
            <input type="text" style={{ ...inputStyle, backgroundColor: '#f8fafc', color: '#64748b' }} value={customerIdPreview} disabled />
          </div>
          <div>
            <label style={labelStyle}>Company / Customer Name *:</label>
            <input
              type="text"
              style={inputStyle}
              required
              value={formData.cust_comp_name}
              onChange={e => setFormData({ ...formData, cust_comp_name: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Company Phone *:</label>
            <input
              type="text"
              style={inputStyle}
              required
              value={formData.cust_comp_no}
              onChange={e => setFormData({ ...formData, cust_comp_no: e.target.value })}
            />
          </div>
        </div>

        {/* Row 2 */}
        <div style={gridStyle3}>
          <div>
            <label style={labelStyle}>Contact Person:</label>
            <input
              type="text"
              style={inputStyle}
              value={formData.cust_comp_person || ''}
              onChange={e => setFormData({ ...formData, cust_comp_person: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Person Phone *:</label>
            <input
              type="text"
              style={inputStyle}
              required
              value={formData.cust_comp_person_no || ''}
              onChange={e => setFormData({ ...formData, cust_comp_person_no: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Email ID:</label>
            <input
              type="email"
              style={inputStyle}
              value={formData.cust_email || ''}
              onChange={e => setFormData({ ...formData, cust_email: e.target.value })}
            />
          </div>
        </div>

        {/* Row 3 */}
        <div style={gridStyle3}>
          <div>
            <label style={labelStyle}>Address:</label>
            <input
              type="text"
              style={inputStyle}
              value={formData.cust_address || ''}
              onChange={e => setFormData({ ...formData, cust_address: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>GST No:</label>
            <input
              type="text"
              style={inputStyle}
              value={formData.cust_gst_no || ''}
              onChange={e => setFormData({ ...formData, cust_gst_no: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Opening / Current Balance (₹):</label>
            <input
              type="number"
              step="0.01"
              style={inputStyle}
              value={formData.customer_balance || 0}
              onChange={e => setFormData({ ...formData, customer_balance: Number(e.target.value) })}
            />
          </div>
        </div>

        <FormActions
          onClose={onClose}
          isSubmitting={isSubmitting}
          label={editData ? 'Update Customer' : 'Save Customer'}
        />
      </form>
    </ModalWrapper>
  );
};

export default CustomerModule;
