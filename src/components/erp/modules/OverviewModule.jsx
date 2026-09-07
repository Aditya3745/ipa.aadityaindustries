import React from 'react';
import { Users, Package, ShoppingCart, ShoppingBag, ArrowRight } from 'lucide-react';

export const OverviewModule = ({ data, setCurrentView }) => {
  const { customers, products, sales, purchases, transactions } = data;

  const totalRevenue = sales.reduce((sum, sale) => sum + (Number(sale.grand_total) || 0), 0);
  
  const StatCard = ({ title, value, icon: Icon, color, onClick }) => (
    <div 
      style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.2s', borderLeft: `4px solid ${color}` }}
      onClick={onClick}
      onMouseOver={(e) => onClick && (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseOut={(e) => onClick && (e.currentTarget.style.transform = 'translateY(0)')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', margin: 0 }}>{title}</p>
          <h3 style={{ color: '#1e293b', fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>{value}</h3>
        </div>
        <div style={{ backgroundColor: `${color}15`, padding: '0.75rem', borderRadius: '8px' }}>
          <Icon size={24} color={color} />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#1e293b', margin: 0 }}>Dashboard Overview</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard 
          title="Total Revenue" 
          value={`₹${totalRevenue.toLocaleString()}`} 
          icon={ShoppingCart} 
          color="#3b82f6" 
          onClick={() => setCurrentView('sell')}
        />
        <StatCard 
          title="Total Sales Orders" 
          value={sales.length} 
          icon={ShoppingBag} 
          color="#10b981"
          onClick={() => setCurrentView('sell')}
        />
        <StatCard 
          title="Total Customers" 
          value={customers.length} 
          icon={Users} 
          color="#8b5cf6"
          onClick={() => setCurrentView('customer')}
        />
        <StatCard 
          title="Total Products" 
          value={products.length} 
          icon={Package} 
          color="#f59e0b"
          onClick={() => setCurrentView('product')}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem' }}>Recent Transactions</h3>
            <button 
              onClick={() => setCurrentView('accounts')}
              style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}
            >
              View All <ArrowRight size={16} />
            </button>
          </div>
          <div style={{ padding: '0 1.5rem' }}>
            {transactions.slice(0, 5).map((txn, idx) => (
              <div key={txn.transaction_id || idx} style={{ padding: '1rem 0', borderBottom: idx !== 4 ? '1px solid #e2e8f0' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: '0 0 0.25rem 0', fontWeight: '500', color: '#1e293b' }}>
                    {txn.transaction_type.charAt(0).toUpperCase() + txn.transaction_type.slice(1)}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                    {new Date(txn.transaction_date).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 0.25rem 0', fontWeight: '600', color: txn.transaction_type === 'income' ? '#10b981' : '#ef4444' }}>
                    {txn.transaction_type === 'income' ? '+' : '-'}₹{Number(txn.amount || 0).toLocaleString()}
                  </p>
                  <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: '12px', backgroundColor: '#f1f5f9', color: '#64748b' }}>
                    {txn.payment_method || 'Unknown'}
                  </span>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                No recent transactions found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
