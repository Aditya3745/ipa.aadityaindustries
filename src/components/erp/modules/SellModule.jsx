import React, { useState } from 'react';
import { Plus, Printer, TrendingUp, IndianRupee, CheckCircle2 } from 'lucide-react';
import DataCard from '../../DataCard';
import PaymentDialog from '../../PaymentDialog';
import { recordInvoicePayment } from '../../../utils/paymentService';
import { cardStyle } from '../../../styles/formStyles';
import toast from 'react-hot-toast';

export const SellModule = ({
  sales = [],
  setCurrentView,
  printSalesTable,
  printSingleSale,
  setEditTransactionData,
  onRefresh
}) => {
  const [payingSale, setPayingSale] = useState(null);
  const [isProcessingPay, setIsProcessingPay] = useState(false);

  const handleOpenPayDue = (s) => {
    const grandTotal = Number(s.grand_total || 0);
    const paid = Number(s.amount_paid ?? s.advance_amount ?? 0);
    const due = Math.max(0, grandTotal - paid);

    if (due <= 0.01) {
      toast.success('No pending dues on this sale invoice.');
      return;
    }

    setPayingSale({
      ...s,
      calculatedDue: due,
      currentPaid: paid,
      grandTotal
    });
  };

  const handleConfirmPayment = async ({ amount, paymentMethod, paymentDate }) => {
    if (!payingSale) return;
    setIsProcessingPay(true);
    try {
      const res = await recordInvoicePayment({
        invoiceType: 'sale',
        invoiceId: payingSale.sale_id || payingSale.id,
        amount,
        paymentMethod,
        paymentDate,
        partyId: payingSale.customer_id,
        partyName: payingSale.customer_name,
        currentGrandTotal: payingSale.grandTotal,
        currentAmountPaid: payingSale.currentPaid
      });

      if (!res.success) throw new Error(res.error?.message || 'Failed to record payment');

      toast.success(`Payment of ₹${amount.toLocaleString('en-IN')} recorded for Invoice ${payingSale.sale_id}!`);
      setPayingSale(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Pay due error:', err);
      toast.error('Payment failed: ' + (err.message || ''));
    } finally {
      setIsProcessingPay(false);
    }
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Sales & Orders</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setCurrentView('create_sale')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <Plus size={16} /> New Sale
          </button>
          {printSalesTable && (
            <button
              onClick={printSalesTable}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              title="Print Sales Table"
            >
              <Printer size={16} />
            </button>
          )}
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {sales.map((s, idx) => {
          const grandTotal = Number(s.grand_total || 0);
          const paid = Number(s.amount_paid ?? s.advance_amount ?? 0);
          const due = Math.max(0, grandTotal - paid);
          const isFullyPaid = due <= 0.01;

          return (
            <DataCard
              key={s.sale_id || idx}
              index={idx}
              icon={TrendingUp}
              iconColor="#ec4899"
              title={s.customer_name || 'Customer'}
              subtitle={`Inv: ${s.sale_id} • ${(s.sale_date || s.created_at || '').split('T')[0]}`}
              status={isFullyPaid ? 'Payment Done' : (paid > 0 ? 'Partial' : 'Pending')}
              statusColor={isFullyPaid ? '#10b981' : (paid > 0 ? '#3b82f6' : '#f59e0b')}
              onEdit={() => { setEditTransactionData(s); setCurrentView('create_sale'); }}
              action={
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); printSingleSale(s); }} 
                    style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', color: '#334155', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.775rem', fontWeight: 600 }}
                  >
                    <Printer size={14} /> Print Bill
                  </button>
                  {!isFullyPaid && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenPayDue(s); }} 
                      style={{ background: '#2563eb', border: 'none', borderRadius: '6px', padding: '6px 12px', color: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.775rem', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(37,99,235,0.2)' }}
                    >
                      <IndianRupee size={14} /> Pay Due
                    </button>
                  )}
                </div>
              }
              details={[
                { label: 'Total', value: `₹${grandTotal.toFixed(2)}` },
                { label: 'Paid', value: `₹${paid.toFixed(2)}`, color: '#10b981' },
                { label: 'Due', value: `₹${due.toFixed(2)}`, color: due > 0 ? '#ef4444' : '#10b981' },
                { label: 'Delivery', value: s.order_status || 'Delivered', color: s.order_status === 'Delivered' ? '#10b981' : '#f59e0b' }
              ]}
            />
          );
        })}
      </div>
      {sales.length === 0 && <p style={{ padding: '1rem', color: '#64748b' }}>No sales found.</p>}

      {payingSale && (
        <PaymentDialog
          isOpen={!!payingSale}
          onClose={() => setPayingSale(null)}
          title={`Record Payment — Invoice ${payingSale.sale_id}`}
          invoiceId={payingSale.sale_id}
          partyName={payingSale.customer_name}
          dueAmount={payingSale.calculatedDue}
          onConfirm={handleConfirmPayment}
          isLoading={isProcessingPay}
        />
      )}
    </div>
  );
};

export default SellModule;
