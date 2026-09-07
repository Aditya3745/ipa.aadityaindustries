import React from 'react';
import { Plus, ShoppingCart } from 'lucide-react';
import DataCard from '../../DataCard';

const cardStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' };

export const PurchaseModule = ({ purchases, setCurrentView, printPurchasesTable, setEditTransactionData }) => {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Purchases & Orders</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setCurrentView('create_purchase')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}><Plus size={16} /> New Purchase</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {purchases.map((p, idx) => (
          <DataCard
            key={p.purchase_id}
            index={idx}
            icon={ShoppingCart}
            iconColor="#0ea5e9"
            title={`PO: ${p.purchase_id}`}
            subtitle={p.purchase_date?.split('T')[0]}
            status={p.payment_status}
            statusColor={p.payment_status === 'Paid' ? '#10b981' : '#f59e0b'}
            onEdit={() => { setEditTransactionData(p); setCurrentView('create_purchase'); }}
            details={[
              { label: 'Supplier ID', value: p.supplier_id },
              { label: 'Total', value: `Rs ${Number(p.grand_total || 0).toFixed(2)}` }
            ]}
          />
        ))}
      </div>
      {purchases.length === 0 && <p style={{ padding: '1rem', color: '#64748b' }}>No purchases found.</p>}
    </div>
  );
};

