import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { Plus, Factory, CheckCircle2 } from 'lucide-react';
import DataCard from '../../DataCard';
import ModalWrapper from '../../ModalWrapper';
import FormActions from '../../FormActions';
import { generateId, peekNextId } from '../../../utils/sequenceManager';
import { cardStyle, inputStyle, labelStyle, gridStyle3 } from '../../../styles/formStyles';
import toast from 'react-hot-toast';

export const ManufacturingModule = ({ manufacturing = [], setModalConfig, onRefresh }) => {
  const [completingId, setCompletingId] = useState(null);

  const handleMarkComplete = async (m) => {
    const defaultQty = m.quantity_to_produce || 1;
    const qtyStr = window.prompt(`Confirm produced quantity for order ${m.manufacturing_id}:`, defaultQty);
    if (!qtyStr) return;
    const qty = Number(qtyStr);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid quantity.");
      return;
    }

    setCompletingId(m.manufacturing_id);
    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. Update Manufacturing Order
      const { error: mfgErr } = await supabase
        .from('manufacturing_orders')
        .update({
          status: 'Completed',
          quantity_produced: qty,
          actual_completion_date: today
        })
        .eq('manufacturing_id', m.manufacturing_id);

      if (mfgErr) throw mfgErr;

      // 2. Increase stock of the produced product
      if (m.product_id) {
        const { data: stockRow } = await supabase
          .from('stock')
          .select('*')
          .eq('product_id', m.product_id)
          .maybeSingle();

        if (stockRow) {
          const newStockQty = (Number(stockRow.quantity) || 0) + qty;
          await supabase
            .from('stock')
            .update({ quantity: newStockQty })
            .eq('stock_id', stockRow.stock_id);
        } else {
          const newStockId = await generateId('STOCK_ID', 'AIND/STK/');
          await supabase
            .from('stock')
            .insert([{
              stock_id: newStockId,
              product_id: m.product_id,
              quantity: qty,
              location: 'Main Warehouse',
              min_quantity: 0
            }]);
        }
      }

      toast.success(`Order ${m.manufacturing_id} marked as Completed! Stock updated (+${qty}).`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Mark complete failed:", err);
      toast.error("Failed to complete order: " + (err.message || ''));
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Manufacturing Orders</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setModalConfig({ isOpen: true, type: 'manufacturing' })}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <Plus size={16} /> New Order
          </button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {manufacturing.map((m, idx) => (
          <DataCard
            key={m.manufacturing_id || idx}
            index={idx}
            icon={Factory}
            iconColor="#8b5cf6"
            title={m.products?.product_name || m.product_id}
            subtitle={m.manufacturing_id}
            status={m.status}
            statusColor={m.status === 'Completed' ? '#10b981' : (m.status === 'In Progress' ? '#3b82f6' : '#f59e0b')}
            action={
              m.status !== 'Completed' && (
                <button
                  onClick={() => handleMarkComplete(m)}
                  disabled={completingId === m.manufacturing_id}
                  style={{
                    background: '#10b981',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    color: 'white',
                    cursor: completingId === m.manufacturing_id ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.7rem',
                    fontWeight: 600
                  }}
                >
                  <CheckCircle2 size={12} /> {completingId === m.manufacturing_id ? 'Completing...' : 'Mark Complete'}
                </button>
              )
            }
            details={[
              { label: 'Target Qty', value: m.quantity_to_produce || 0 },
              { label: 'Produced', value: m.quantity_produced ?? 0 },
              { label: 'Start Date', value: m.start_date ? m.start_date.split('T')[0] : '—' }
            ]}
          />
        ))}
      </div>
      {manufacturing.length === 0 && <p style={{ padding: '1rem', color: '#64748b' }}>No manufacturing orders found.</p>}
    </div>
  );
};

export const ManufacturingModal = ({ onClose, products = [], employees = [], onSuccess }) => {
  const [formData, setFormData] = useState({
    product_id: '',
    quantity_to_produce: 1,
    supervisor_id: '',
    expected_completion_date: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mfgIdPreview, setMfgIdPreview] = useState('AIND/MO/...');

  useEffect(() => {
    peekNextId('MFG', 'AIND/MO/').then(setMfgIdPreview);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.product_id) {
      toast.error("Please select a product to manufacture.");
      return;
    }
    setIsSubmitting(true);

    try {
      const mfgId = await generateId('MFG', 'AIND/MO/');
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
      
      toast.success("Manufacturing Order created successfully!"); 
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) { 
      console.error(err); 
      toast.error("Failed to add order: " + (err.message || '')); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <ModalWrapper title="New Manufacturing Order" onClose={onClose} maxWidth="800px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={gridStyle3}>
          <div>
            <label style={labelStyle}>Order ID (Auto):</label>
            <input type="text" style={{ ...inputStyle, backgroundColor: '#f8fafc', color: '#64748b' }} value={mfgIdPreview} disabled />
          </div>
          <div>
            <label style={labelStyle}>Product to Manufacture *</label>
            <select
              style={inputStyle}
              required
              value={formData.product_id}
              onChange={e => setFormData({ ...formData, product_id: e.target.value })}
            >
              <option value="" disabled>Select Product</option>
              {products.map(p => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_name || p.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Target Qty *</label>
            <input
              type="number"
              style={inputStyle}
              required
              min="1"
              value={formData.quantity_to_produce}
              onChange={e => setFormData({ ...formData, quantity_to_produce: Number(e.target.value) })}
            />
          </div>
        </div>

        <div style={gridStyle3}>
          <div>
            <label style={labelStyle}>Supervisor</label>
            <select
              style={inputStyle}
              value={formData.supervisor_id}
              onChange={e => setFormData({ ...formData, supervisor_id: e.target.value })}
            >
              <option value="">None</option>
              {employees.map(emp => (
                <option key={emp.employee_id} value={emp.employee_id}>
                  {emp.employees_name || emp.employee_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Expected Completion</label>
            <input
              type="date"
              style={inputStyle}
              value={formData.expected_completion_date}
              onChange={e => setFormData({ ...formData, expected_completion_date: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Notes</label>
            <input
              type="text"
              style={inputStyle}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Production notes..."
            />
          </div>
        </div>

        <FormActions onClose={onClose} isSubmitting={isSubmitting} label="Create Order" />
      </form>
    </ModalWrapper>
  );
};

export default ManufacturingModule;
