import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { Plus, Users, Printer } from 'lucide-react';
import DataCard from '../../DataCard';
import ModalWrapper from '../../ModalWrapper';
import FormActions from '../../FormActions';
import { generateId, peekNextId } from '../../../utils/sequenceManager';
import { cardStyle, inputStyle, labelStyle, gridStyle3 } from '../../../styles/formStyles';
import toast from 'react-hot-toast';

export const SupplierModule = ({ suppliers = [], setModalConfig, printSuppliersTable }) => {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Supplier Directory</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {printSuppliersTable && (
            <button
              onClick={printSuppliersTable}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              title="Print Table"
            >
              <Printer size={16} />
            </button>
          )}
          <button
            onClick={() => setModalConfig({ isOpen: true, type: 'supplier' })}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <Plus size={16} /> Add Supplier
          </button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {suppliers.map((s, idx) => (
          <DataCard
            key={s.supplier_id || idx}
            index={idx}
            icon={Users}
            iconColor="#2563eb"
            title={s.supp_comp_name}
            subtitle={s.supplier_id}
            onEdit={() => setModalConfig({ isOpen: true, type: 'supplier', editData: s })}
            status={s.supplier_balance > 0 ? 'Dues Pending' : 'Clear'}
            statusColor={s.supplier_balance > 0 ? '#ef4444' : '#10b981'}
            details={[
              { label: 'Phone', value: s.supp_comp_no || '—' },
              { label: 'GST No', value: s.supp_gst_no || '—' },
              { label: 'Balance', value: `₹${Number(s.supplier_balance || 0).toFixed(2)}`, color: s.supplier_balance > 0 ? '#ef4444' : '#10b981' }
            ]}
          />
        ))}
      </div>
      {suppliers.length === 0 && <p style={{ padding: '1rem', color: '#64748b' }}>No suppliers found.</p>}
    </div>
  );
};

export const SupplierModal = ({ onClose, editData, onSuccess }) => {
  const [formData, setFormData] = useState(editData || { 
    supp_comp_name: '', 
    supp_comp_no: '', 
    supp_email: '', 
    supp_address: '',
    supp_gst_no: '',
    supp_comp_person: '',
    supp_comp_person_no: '',
    supplier_balance: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supplierIdPreview, setSupplierIdPreview] = useState('AIND/SUP/...');

  useEffect(() => {
    if (editData) {
      setSupplierIdPreview(editData.supplier_id);
    } else {
      peekNextId('SUP_ID', 'AIND/SUP/').then(setSupplierIdPreview);
    }
  }, [editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editData) {
        const { error } = await supabase.from('suppliers').update(formData).eq('supplier_id', editData.supplier_id);
        if (error) throw error;
        toast.success("Supplier updated successfully!");
      } else {
        const supplierId = await generateId('SUP_ID', 'AIND/SUP/');
        const { error } = await supabase.from('suppliers').insert([{ 
          supplier_id: supplierId, 
          ...formData
        }]);
        if (error) throw error;
        toast.success("Supplier added successfully!");
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) { 
      console.error(err); 
      toast.error(`Failed to ${editData ? 'update' : 'add'} supplier: ` + (err.message || '')); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <ModalWrapper title={editData ? 'Edit Supplier' : 'Add Supplier'} onClose={onClose} maxWidth="800px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Row 1 */}
        <div style={gridStyle3}>
          <div>
            <label style={labelStyle}>Supplier ID (Auto):</label>
            <input type="text" style={{ ...inputStyle, backgroundColor: '#f8fafc', color: '#64748b' }} value={supplierIdPreview} disabled />
          </div>
          <div>
            <label style={labelStyle}>Supplier Name *:</label>
            <input
              type="text"
              style={inputStyle}
              required
              value={formData.supp_comp_name}
              onChange={e => setFormData({ ...formData, supp_comp_name: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Company Phone *:</label>
            <input
              type="text"
              style={inputStyle}
              required
              value={formData.supp_comp_no}
              onChange={e => setFormData({ ...formData, supp_comp_no: e.target.value })}
            />
          </div>
        </div>

        {/* Row 2 */}
        <div style={gridStyle3}>
          <div>
            <label style={labelStyle}>Email ID:</label>
            <input
              type="email"
              style={inputStyle}
              value={formData.supp_email || ''}
              onChange={e => setFormData({ ...formData, supp_email: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Address:</label>
            <input
              type="text"
              style={inputStyle}
              value={formData.supp_address || ''}
              onChange={e => setFormData({ ...formData, supp_address: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>GST No:</label>
            <input
              type="text"
              style={inputStyle}
              value={formData.supp_gst_no || ''}
              onChange={e => setFormData({ ...formData, supp_gst_no: e.target.value })}
            />
          </div>
        </div>

        {/* Row 3 */}
        <div style={gridStyle3}>
          <div>
            <label style={labelStyle}>Contact Person:</label>
            <input
              type="text"
              style={inputStyle}
              value={formData.supp_comp_person || ''}
              onChange={e => setFormData({ ...formData, supp_comp_person: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Contact Person Phone:</label>
            <input
              type="text"
              style={inputStyle}
              value={formData.supp_comp_person_no || ''}
              onChange={e => setFormData({ ...formData, supp_comp_person_no: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Opening / Current Balance (₹):</label>
            <input
              type="number"
              step="0.01"
              style={inputStyle}
              value={formData.supplier_balance || 0}
              onChange={e => setFormData({ ...formData, supplier_balance: Number(e.target.value) })}
            />
          </div>
        </div>

        <FormActions
          onClose={onClose}
          isSubmitting={isSubmitting}
          label={editData ? 'Update Supplier' : 'Save Supplier'}
        />
      </form>
    </ModalWrapper>
  );
};

export default SupplierModule;
