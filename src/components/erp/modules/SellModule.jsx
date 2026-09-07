import React from 'react';
import { Plus, Printer, TrendingUp } from 'lucide-react';
import DataCard from '../../DataCard';

const cardStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' };

export const SellModule = ({ sales, setCurrentView, printSalesTable, printSingleSale, setEditTransactionData }) => {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Sales & Orders</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setCurrentView('create_sale')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}><Plus size={16} /> New Sale</button>
          <button onClick={printSalesTable} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}><Printer size={16} /></button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {sales.map((s, idx) => (
          <DataCard
            key={s.sale_id}
            index={idx}
            icon={TrendingUp}
            iconColor="#ec4899"
            title={s.customer_name}
            subtitle={`Inv: ${s.sale_id} | ${s.sale_date?.split('T')[0]}`}
            status={s.payment_status}
            statusColor={s.payment_status === 'Paid' ? '#10b981' : '#f59e0b'}
            onEdit={() => { setEditTransactionData(s); setCurrentView('create_sale'); }}
            action={
              <button 
                onClick={() => printSingleSale(s)} 
                style={{ 
                  background: 'none', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '6px', 
                  padding: '4px 8px', 
                  color: '#64748b', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.25rem',
                  fontSize: '0.7rem'
                }}>
                 <Printer size={12}/> Print Bill
              </button>
            }
            details={[
              { label: 'Total', value: `Rs ${Number(s.grand_total || 0).toFixed(2)}`, color: '#ec4899' }
            ]}
          />
        ))}
      </div>
      {sales.length === 0 && <p style={{ padding: '1rem', color: '#64748b' }}>No sales found.</p>}
    </div>
  );
};
