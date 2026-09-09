import React, { useState, useMemo } from 'react';
import { IndianRupee, Calendar, CreditCard, CheckCircle2, AlertCircle, Sparkles, Filter } from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import FormActions from './FormActions';
import { inputStyle, labelStyle } from '../styles/formStyles';
import { recordInvoicePayment } from '../utils/paymentService';
import toast from 'react-hot-toast';

export const SettleDuesModal = ({
  isOpen,
  onClose,
  contact,
  sales = [],
  purchases = [],
  onSuccess
}) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [priorityBillId, setPriorityBillId] = useState('LIFO');
  const [payOnlySelected, setPayOnlySelected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isSupplier = contact?.type === 'Supplier';

  // Find all open invoices with pending dues for this contact (newest first for LIFO)
  const pendingInvoices = useMemo(() => {
    if (!contact) return [];
    if (isSupplier) {
      return purchases
        .filter(p => p.supplier_id === contact.rawId || p.supplier_name === contact.name)
        .map(p => {
          const grandTotal = Number(p.grand_total || 0);
          const paid = Number(p.amount_paid ?? p.advance_amount ?? 0);
          const due = Math.max(0, grandTotal - paid);
          return {
            id: p.purchase_id,
            date: p.purchase_date || p.created_at,
            grandTotal,
            paid,
            due,
            raw: p
          };
        })
        .filter(inv => inv.due > 0.01)
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // LIFO (newest first)
    } else {
      return sales
        .filter(s => s.customer_id === contact.rawId || s.customer_name === contact.name)
        .map(s => {
          const grandTotal = Number(s.grand_total || 0);
          const paid = Number(s.amount_paid ?? s.advance_amount ?? 0);
          const due = Math.max(0, grandTotal - paid);
          return {
            id: s.sale_id || s.id,
            date: s.sale_date || s.created_at,
            grandTotal,
            paid,
            due,
            raw: s
          };
        })
        .filter(inv => inv.due > 0.01)
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // LIFO (newest first)
    }
  }, [contact, isSupplier, sales, purchases]);

  const totalOutstanding = useMemo(() => {
    return pendingInvoices.reduce((acc, curr) => acc + curr.due, 0);
  }, [pendingInvoices]);

  const selectedBill = useMemo(() => {
    return pendingInvoices.find(inv => inv.id === priorityBillId) || null;
  }, [pendingInvoices, priorityBillId]);

  // Order invoices: priority bill first (if selected), followed by others in LIFO order
  const orderedInvoices = useMemo(() => {
    if (!pendingInvoices.length) return [];
    if (priorityBillId === 'LIFO') {
      return pendingInvoices;
    }
    const target = pendingInvoices.find(inv => inv.id === priorityBillId);
    if (!target) return pendingInvoices;
    if (payOnlySelected) {
      return [target];
    }
    const others = pendingInvoices.filter(inv => inv.id !== priorityBillId);
    return [target, ...others];
  }, [pendingInvoices, priorityBillId, payOnlySelected]);

  // Settlement distribution preview
  const distribution = useMemo(() => {
    const totalPay = Number(amount) || 0;
    let remaining = totalPay;
    return orderedInvoices.map(inv => {
      const allocated = Math.min(inv.due, remaining);
      remaining = Math.max(0, remaining - allocated);
      const remainingDue = Math.max(0, inv.due - allocated);
      return {
        ...inv,
        allocated,
        remainingDue,
        isFullyPaid: remainingDue <= 0.01 && allocated > 0,
        isPriority: inv.id === priorityBillId
      };
    });
  }, [orderedInvoices, amount, priorityBillId]);

  if (!isOpen || !contact) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payTotal = Number(amount);
    if (!payTotal || isNaN(payTotal) || payTotal <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }

    const itemsToPay = distribution.filter(d => d.allocated > 0);
    if (itemsToPay.length === 0) {
      setError('No invoices available to apply payment to.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Settle each invoice individually so transactions table has 100% accurate reference_id & dues
      for (const item of itemsToPay) {
        const res = await recordInvoicePayment({
          invoiceType: isSupplier ? 'purchase' : 'sale',
          invoiceId: item.id,
          amount: item.allocated,
          paymentMethod,
          paymentDate,
          partyId: contact.rawId,
          partyName: contact.name,
          currentGrandTotal: item.grandTotal,
          currentAmountPaid: item.paid
        });

        if (!res.success) {
          throw new Error(`Failed to record payment on ${item.id}: ${res.error?.message || 'Unknown error'}`);
        }
      }

      toast.success(`Successfully recorded ₹${payTotal.toLocaleString('en-IN')} across ${itemsToPay.length} bill(s)!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Multi-bill settlement failed:', err);
      setError(err.message || 'Payment settlement failed.');
      toast.error('Payment settlement failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper title={`Settle Dues — ${contact.name}`} onClose={onClose} maxWidth="620px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
        {/* Contact Overview */}
        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Party Type:</span>
            <span style={{ fontWeight: 600, color: isSupplier ? '#3b82f6' : '#10b981' }}>{contact.type}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Pending Across Invoices:</span>
            <span style={{ fontWeight: 700, fontSize: '1.15rem', color: '#ef4444' }}>
              ₹{Number(totalOutstanding).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.65rem 0.85rem', color: '#b91c1c', fontSize: '0.825rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Priority / Settlement Mode Selector */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: 0 }}>
              <Filter size={14} color="#3b82f6" /> Settlement Priority / Target Bill
            </label>
            {priorityBillId !== 'LIFO' && (
              <button
                type="button"
                onClick={() => { setPriorityBillId('LIFO'); setPayOnlySelected(false); }}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Reset to Auto (LIFO)
              </button>
            )}
          </div>
          <select
            value={priorityBillId}
            onChange={(e) => setPriorityBillId(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer', backgroundColor: priorityBillId !== 'LIFO' ? '#f0f9ff' : 'white', borderColor: priorityBillId !== 'LIFO' ? '#93c5fd' : '#cbd5e1' }}
          >
            <option value="LIFO">Auto-Settle (LIFO — Newest Bills First)</option>
            {pendingInvoices.length > 0 && (
              <optgroup label="Select Specific Bill For Priority">
                {pendingInvoices.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.id} ({inv.date ? inv.date.split('T')[0] : '—'}) — Due: ₹{inv.due.toFixed(2)}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          {/* Banner when a specific bill is chosen */}
          {selectedBill && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', fontSize: '0.8rem' }}>
              <span style={{ color: '#1e40af' }}>
                Priority: <strong>{selectedBill.id}</strong> (Due: ₹{selectedBill.due.toFixed(2)})
              </span>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#1e3a8a', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={payOnlySelected}
                    onChange={(e) => setPayOnlySelected(e.target.checked)}
                  />
                  Only this bill
                </label>
                <button
                  type="button"
                  onClick={() => setAmount(String(selectedBill.due))}
                  style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', padding: '3px 9px', fontSize: '0.725rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Pay Bill Due (₹{selectedBill.due.toFixed(2)})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Amount Input */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '4px' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Total Payment Received/Paid (₹) *</label>
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              {selectedBill && (
                <button
                  type="button"
                  onClick={() => setAmount(String(selectedBill.due))}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Fill {selectedBill.id} Due (₹{selectedBill.due.toFixed(2)})
                </button>
              )}
              {totalOutstanding > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(totalOutstanding))}
                  style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Clear All Dues (₹{totalOutstanding.toFixed(2)})
                </button>
              )}
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <IndianRupee size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(''); }}
              style={{ ...inputStyle, paddingLeft: '2.25rem', fontSize: '1rem', fontWeight: 600 }}
              placeholder="0.00"
              autoFocus
              required
            />
          </div>
        </div>

        {/* Method & Date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Payment Method *</label>
            <div style={{ position: 'relative' }}>
              <CreditCard size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{ ...inputStyle, paddingLeft: '2.25rem', cursor: 'pointer' }}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="Bank">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>
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
        </div>

        {/* Breakdown Preview Table */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>
              Bill Settlement Breakdown ({priorityBillId === 'LIFO' ? 'LIFO Auto-Distribution' : `Priority: ${priorityBillId}`})
            </label>
            <span style={{ fontSize: '0.725rem', color: '#64748b' }}>Click row to prioritize bill</span>
          </div>

          {pendingInvoices.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.5rem 0' }}>No pending invoices found for this contact.</p>
          ) : (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', maxHeight: '220px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                    <th style={{ padding: '8px 12px' }}>Invoice ID</th>
                    <th style={{ padding: '8px 12px' }}>Date</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total Due</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Settling Now</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {distribution.map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => setPriorityBillId(d.id)}
                      title="Click to set as priority bill"
                      style={{
                        borderTop: '1px solid #e2e8f0',
                        backgroundColor: d.isPriority ? '#eff6ff' : (d.allocated > 0 ? '#f0fdf4' : 'white'),
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{d.id}</span>
                          {d.isPriority && (
                            <span style={{ backgroundColor: '#3b82f6', color: 'white', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                              Priority #1
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '8px 12px', color: '#64748b' }}>{d.date ? d.date.split('T')[0] : '—'}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#ef4444' }}>₹{d.due.toFixed(2)}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: d.allocated > 0 ? '#10b981' : '#94a3b8' }}>
                        ₹{d.allocated.toFixed(2)}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        {d.isFullyPaid ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#16a34a', fontWeight: 600 }}>
                            <CheckCircle2 size={13} /> Paid
                          </span>
                        ) : d.allocated > 0 ? (
                          <span style={{ color: '#d97706', fontWeight: 600 }}>Partial</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <FormActions
          onClose={onClose}
          isSubmitting={isSubmitting}
          label="Settle Selected Bills"
          disabled={!amount || Number(amount) <= 0 || pendingInvoices.length === 0}
        />
      </form>
    </ModalWrapper>
  );
};

export default SettleDuesModal;
