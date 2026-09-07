import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { Plus, Factory } from 'lucide-react';
import DataCard from '../../DataCard';

const cardStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' };

export const ManufacturingModule = ({ manufacturing, setModalConfig }) => {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Manufacturing Orders</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setModalConfig({ isOpen: true, type: 'manufacturing' })} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}><Plus size={16} /> New Order</button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {manufacturing.map((m, idx) => (
          <DataCard
            key={m.manufacturing_id}
            index={idx}
            icon={Factory}
            iconColor="#8b5cf6"
            title={m.products?.product_name || m.product_id}
            subtitle={m.manufacturing_id}
            status={m.status}
            statusColor={m.status === 'Completed' ? '#10b981' : (m.status === 'In Progress' ? '#3b82f6' : '#f59e0b')}
            details={[
              { label: 'Target Qty', value: m.quantity_to_produce },
              { label: 'Produced', value: m.quantity_produced },
              { label: 'Start Date', value: m.start_date?.split('T')[0] }
            ]}
          />
        ))}
      </div>
      {manufacturing.length === 0 && <p style={{ padding: '1rem', color: '#64748b' }}>No manufacturing orders found.</p>}
    </div>
  );
};

export const ManufacturingModal = ({ onClose, products, employees }) => {
  const [formData, setFormData] = useState({ product_id: '', quantity_to_produce: 1, supervisor_id: '', expected_completion_date: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mfgIdPreview, setMfgIdPreview] = useState('AIND/MO/...');

  useEffect(() => {
    const fetchSeq = async () => {
      const { data } = await supabase.from('sequence_manager').select('*').eq('seq_name', 'MFG').single();
      if (data) setMfgIdPreview(`${data.prefix || 'AIND/MO/'}${String((data.current_val || 0) + 1).padStart(3, '0')}`);
    };
    fetchSeq();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.product_id) return alert("Select a product to manufacture.");
    setIsSubmitting(true);

    const { data: seqData } = await supabase.from('sequence_manager').select('*').eq('seq_name', 'MFG').single();
    let newSeqVal = 1; let prefix = 'AIND/MO/';
    if (seqData) { newSeqVal = (seqData.current_val || 0) + 1; prefix = seqData.prefix || prefix; }
    const mfgId = `${prefix}${String(newSeqVal).padStart(3, '0')}`;
    
    try {
      const { error } = await supabase.from('manufacturing_orders').insert([{ 
         manufacturing_id: mfgId, 
         product_id: formData.product_id,
         quantity_to_produce: formData.quantity_to_produce,
         supervisor_id: formData.supervisor_id || null,
         expected_completion_date: formData.expected_completion_date || null,
         notes: formData.notes,
         status: 'Pending'
      }]);
      if (error) throw error;
      
      await supabase.from('sequence_manager').update({ current_val: newSeqVal }).eq('seq_name', 'MFG');
      alert("Manufacturing Order added successfully!"); 
      onClose();
    } catch (err) { 
       console.error(err); 
       alert("Failed to add order."); 
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
        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>New Manufacturing Order</h2>
        <form onSubmit={handleSubmit}>
          
          <div style={gridStyle3}>
            <div>
              <label style={labelStyle}>Order ID:</label>
              <input type="text" style={{...inputStyle, backgroundColor: '#f1f5f9', color: '#64748b'}} value={mfgIdPreview} disabled />
            </div>
            <div>
              <label style={labelStyle}>Product to Manufacture *</label>
              <select style={inputStyle} required value={formData.product_id} onChange={e => setFormData({...formData, product_id: e.target.value})}>
                 <option value="" disabled>Select Product</option>
                 {products.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name || p.title}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Target Qty *</label>
              <input type="number" style={inputStyle} required min="1" value={formData.quantity_to_produce} onChange={e => setFormData({...formData, quantity_to_produce: Number(e.target.value)})} />
            </div>
          </div>

          <div style={gridStyle3}>
            <div>
              <label style={labelStyle}>Supervisor</label>
              <select style={inputStyle} value={formData.supervisor_id} onChange={e => setFormData({...formData, supervisor_id: e.target.value})}>
                 <option value="">None</option>
                 {employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.employees_name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Expected Completion</label>
              <input type="date" style={inputStyle} value={formData.expected_completion_date} onChange={e => setFormData({...formData, expected_completion_date: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Notes</label>
              <input type="text" style={inputStyle} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.75rem 2rem', background: 'white', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
            <button type="submit" disabled={isSubmitting} style={{ padding: '0.75rem 2rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>{isSubmitting ? 'Saving...' : 'Create Order'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
