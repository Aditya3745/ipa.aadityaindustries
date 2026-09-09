import React, { useState } from 'react';
import { Plus, Printer, ShoppingCart, IndianRupee, CheckCircle2 } from 'lucide-react';
import DataCard from '../../DataCard';
import PaymentDialog from '../../PaymentDialog';
import { recordInvoicePayment } from '../../../utils/paymentService';
import { cardStyle } from '../../../styles/formStyles';
import toast from 'react-hot-toast';

export const PurchaseModule = ({
  purchases = [],
  setCurrentView,
  printPurchasesTable,
  setEditTransactionData,
  onRefresh
}) => {
  const [payingPurchase, setPayingPurchase] = useState(null);
  const [isProcessingPay, setIsProcessingPay] = useState(false);

  const handleOpenPayDue = (p) => {
    const grandTotal = Number(p.grand_total || 0);
    const paid = Number(p.amount_paid ?? p.advance_amount ?? 0);
    const due = Math.max(0, grandTotal - paid);

    if (due <= 0.01) {
      toast.success('No pending dues on this purchase order.');
      return;
    }

    setPayingPurchase({
      ...p,
      calculatedDue: due,
      currentPaid: paid,
      grandTotal
    });
  };

  const handleConfirmPayment = async ({ amount, paymentMethod, paymentDate }) => {
    if (!payingPurchase) return;
    setIsProcessingPay(true);
    try {
      const res = await recordInvoicePayment({
        invoiceType: 'purchase',
        invoiceId: payingPurchase.purchase_id || payingPurchase.id,
        amount,
        paymentMethod,
        paymentDate,
        partyId: payingPurchase.supplier_id,
        partyName: payingPurchase.supplier_name || payingPurchase.vendor_name,
        currentGrandTotal: payingPurchase.grandTotal,
        currentAmountPaid: payingPurchase.currentPaid
      });

      if (!res.success) throw new Error(res.error?.message || 'Failed to record payment');

      toast.success(`Payment of ₹${amount.toLocaleString('en-IN')} recorded for PO ${payingPurchase.purchase_id}!`);
      setPayingPurchase(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Purchase pay due error:', err);
      toast.error('Payment failed: ' + (err.message || ''));
    } finally {
      setIsProcessingPay(false);
    }
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Purchases & Orders</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {printPurchasesTable && (
            <button
              onClick={printPurchasesTable}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              title="Print Purchases"
            >
              <Printer size={16} />
            </button>
          )}
          <button
            onClick={() => setCurrentView('create_purchase')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <Plus size={16} /> New Purchase
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {purchases.map((p, idx) => {
          const grandTotal = Number(p.grand_total || 0);
          const paid = Number(p.amount_paid ?? p.advance_amount ?? 0);
          const due = Math.max(0, grandTotal - paid);
          const isFullyPaid = due <= 0.01;

          return (
            <DataCard
              key={p.purchase_id || idx}
              index={idx}
              icon={ShoppingCart}
              iconColor="#0ea5e9"
              title={`PO: ${p.purchase_id}`}
              subtitle={`${p.supplier_name || p.vendor_name || 'Supplier'} | ${(p.purchase_date || p.created_at || '').split('T')[0]}`}
              status={isFullyPaid ? 'Payment Done' : (paid > 0 ? 'Partial' : 'Pending')}
              statusColor={isFullyPaid ? '#10b981' : (paid > 0 ? '#3b82f6' : '#f59e0b')}
              onEdit={() => { setEditTransactionData(p); setCurrentView('create_purchase'); }}
              action={
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {!isFullyPaid ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenPayDue(p); }} 
                      style={{ background: '#3b82f6', border: 'none', borderRadius: '6px', padding: '4px 8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', fontWeight: 'bold' }}
                    >
                      <IndianRupee size={12} /> Pay Due
                    </button>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#16a34a', fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', backgroundColor: '#f0fdf4', borderRadius: '6px' }}>
                      <CheckCircle2 size={13} /> Payment Done
                    </span>
                  )}
                </div>
              }
              details={[
                { label: 'Total', value: `₹${grandTotal.toFixed(2)}` },
                { label: 'Paid', value: `₹${paid.toFixed(2)}`, color: '#10b981' },
                {
                  label: isFullyPaid ? 'Status' : 'Due',
                  value: isFullyPaid ? 'Payment Done' : `₹${due.toFixed(2)}`,
                  color: isFullyPaid ? '#10b981' : '#ef4444'
                },
                { label: 'Delivery', value: p.order_status || 'Pending', color: p.order_status === 'Delivered' ? '#10b981' : '#f59e0b' }
              ]}
            />
          );
        })}
      </div>
      {purchases.length === 0 && <p style={{ padding: '1rem', color: '#64748b' }}>No purchases found.</p>}

      {payingPurchase && (
        <PaymentDialog
          isOpen={!!payingPurchase}
          onClose={() => setPayingPurchase(null)}
          title={`Record Payment — Purchase ${payingPurchase.purchase_id}`}
          invoiceId={payingPurchase.purchase_id}
          partyName={payingPurchase.supplier_name || payingPurchase.vendor_name}
          dueAmount={payingPurchase.calculatedDue}
          onConfirm={handleConfirmPayment}
          isLoading={isProcessingPay}
        />
      )}
    </div>
  );
};

export default PurchaseModule;
