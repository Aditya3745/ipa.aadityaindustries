import React, { useState } from 'react';
import { supabase } from '../../../supabase';
import { Plus, Users, Printer } from 'lucide-react';
import DataCard from '../../DataCard';

const cardStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' };

export const SupplierModule = ({ suppliers, setModalConfig, printSuppliersTable }) => {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Supplier Directory</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={printSuppliersTable} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}><Printer size={16} /></button>
          <button onClick={() => setModalConfig({ isOpen: true, type: 'supplier' })} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}><Plus size={16} /> Add</button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {suppliers.map((s, idx) => (
          <DataCard
            key={s.supplier_id}
            index={idx}
            icon={Users}
            iconColor="#2563eb"
            title={s.supp_comp_name}
            subtitle={s.supplier_id}
            onEdit={() => setModalConfig({ isOpen: true, type: 'supplier', editData: s })}
            status={s.supplier_balance > 0 ? 'Dues Pending' : 'Clear'}
            statusColor={s.supplier_balance > 0 ? '#ef4444' : '#10b981'}
            details={[
              { label: 'Phone', value: s.supp_comp_no },
              { label: 'GST No', value: s.supp_gst_no },
              { label: 'Balance', value: `Rs ${Number(s.supplier_balance || 0).toFixed(2)}`, color: s.supplier_balance > 0 ? '#ef4444' : '#10b981' }
            ]}
          />
        ))}
      </div>
      {suppliers.length === 0 && <p style={{ padding: '1rem', color: '#64748b' }}>No suppliers found.</p>}
    </div>
  );
};

export const SupplierModal = ({ onClose, editData }) => {
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

  React.useEffect(() => {
    if (editData) {
      setSupplierIdPreview(editData.supplier_id);
    } else {
      const fetchSeq = async () => {
        const { data } = await supabase.from('sequence_manager').select('*').eq('seq_name', 'SUP_ID').single();
        if (data) {
          setSupplierIdPreview(`${data.prefix || 'AIND/SUP/'}${String((data.current_val || 0) + 1).padStart(3, '0')}`);
        }
      };
      fetchSeq();
    }
  }, [editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editData) {
        const { error } = await supabase.from('suppliers').update(formData).eq('supplier_id', editData.supplier_id);
        if (error) throw error;
        alert("Supplier updated successfully!");
      } else {
        const { data: seqData } = await supabase.from('sequence_manager').select('*').eq('seq_name', 'SUP_ID').single();
        let newSeqVal = 1; let prefix = 'AIND/SUP/';
        if (seqData) { newSeqVal = (seqData.current_val || 0) + 1; prefix = seqData.prefix || prefix; }
        const supplierId = `${prefix}${String(newSeqVal).padStart(3, '0')}`;
        
        const { error } = await supabase.from('suppliers').insert([{ 
          supplier_id: supplierId, 
          ...formData
        }]);
        if (error) throw error;
        await supabase.from('sequence_manager').update({ current_val: newSeqVal }).eq('seq_name', 'SUP_ID');
        alert("Supplier added successfully!");
      }
      onClose();
    } catch (err) { 
       console.error(err); 
       alert(`Failed to ${editData ? 'update' : 'add'} supplier: ` + (err.message || JSON.stringify(err))); 
    } finally { setIsSubmitting(false); }
  };

  const inputStyle = { width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem' };
  const labelStyle = { display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.75rem', color: '#475569' };
  const gridStyle3 = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>{editData ? 'Edit Supplier' : 'Add Supplier'}</h2>
        <form onSubmit={handleSubmit}>
          
          {/* Row 1 */}
          <div style={gridStyle3}>
            <div>
              <label style={labelStyle}>Supplier ID:</label>
              <input type="text" style={{...inputStyle, backgroundColor: '#f1f5f9', color: '#64748b'}} value={supplierIdPreview} disabled />
            </div>
            <div>
              <label style={labelStyle}>Supplier Name:</label>
              <input type="text" style={inputStyle} required value={formData.supp_comp_name} onChange={e => setFormData({...formData, supp_comp_name: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Company No:</label>
              <input type="text" style={inputStyle} required value={formData.supp_comp_no} onChange={e => setFormData({...formData, supp_comp_no: e.target.value})} />
            </div>
          </div>

          {/* Row 2 */}
          <div style={gridStyle3}>
            <div>
              <label style={labelStyle}>Email ID:</label>
              <input type="email" style={inputStyle} value={formData.supp_email} onChange={e => setFormData({...formData, supp_email: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Address:</label>
              <input type="text" style={inputStyle} value={formData.supp_address} onChange={e => setFormData({...formData, supp_address: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>GST No:</label>
              <input type="text" style={inputStyle} value={formData.supp_gst_no} onChange={e => setFormData({...formData, supp_gst_no: e.target.value})} />
            </div>
          </div>

          {/* Row 3 */}
          <div style={gridStyle3}>
            <div>
              <label style={labelStyle}>Contact Person:</label>
              <input type="text" style={inputStyle} value={formData.supp_comp_person} onChange={e => setFormData({...formData, supp_comp_person: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Contact Person No:</label>
              <input type="text" style={inputStyle} value={formData.supp_comp_person_no} onChange={e => setFormData({...formData, supp_comp_person_no: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Supplier Balance:</label>
              <input type="number" step="0.01" style={inputStyle} value={formData.supplier_balance} onChange={e => setFormData({...formData, supplier_balance: Number(e.target.value)})} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.75rem 2rem', background: 'white', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
            <button type="submit" disabled={isSubmitting} style={{ padding: '0.75rem 2rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>{isSubmitting ? 'Saving...' : (editData ? 'Update Supplier' : 'Save Supplier')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
