import { Package, Printer } from 'lucide-react';
import DataCard from '../../DataCard';

const cardStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' };

export const StockModule = ({ stock, printStockTable }) => {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Inventory Stock</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={printStockTable} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}><Printer size={16} /></button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {stock.map((s, idx) => {
          const productName = s.products?.product_name || s.product_id;
          const isLow = s.quantity <= (s.products?.reorder_level || s.min_quantity || 10);
          return (
            <DataCard
              key={s.stock_id}
              index={idx}
              icon={Package}
              iconColor={isLow ? "#ef4444" : "#10b981"}
              title={productName}
              subtitle={s.stock_id}
              status={isLow ? 'Low Stock' : 'In Stock'}
              statusColor={isLow ? '#ef4444' : '#10b981'}
              details={[
                { label: 'Quantity', value: s.quantity, color: isLow ? '#ef4444' : '#1e293b' },
                { label: 'Location', value: s.location || 'Warehouse' }
              ]}
            />
          );
        })}
      </div>
      {stock.length === 0 && <p style={{ padding: '1rem', color: '#64748b' }}>No stock records found.</p>}
    </div>
  );
};
