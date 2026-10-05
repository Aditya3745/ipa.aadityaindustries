import React, { useState, useMemo } from 'react';
import { Package, Printer, History, ArrowDownRight, ArrowUpRight, Factory, Phone } from 'lucide-react';
import DataCard from '../../DataCard';
import ModalWrapper from '../../ModalWrapper';
import { cardStyle } from '../../../styles/formStyles';

export const StockModule = ({
  stock = [],
  sales = [],
  purchases = [],
  manufacturing = [],
  products = [],
  suppliers = [],
  printStockTable
}) => {
  const [selectedStockItem, setSelectedStockItem] = useState(null);

  // Compute full audit movement ledger for the selected product
  const movementLedger = useMemo(() => {
    if (!selectedStockItem) return [];
    const prodId = selectedStockItem.product_id;
    const events = [];

    // 1. Sales (OUT)
    (sales || []).forEach(sale => {
      (sale.sale_items || []).forEach(item => {
        if (item.product_id === prodId) {
          events.push({
            date: sale.sale_date || sale.created_at,
            type: 'Sale Order',
            direction: 'OUT',
            refId: sale.sale_id || sale.id,
            partyName: sale.customer_name || 'Customer',
            changeQty: -Math.abs(Number(item.quantity || 0))
          });
        }
      });
    });

    // 2. Purchases (IN)
    (purchases || []).forEach(pur => {
      (pur.purchase_items || []).forEach(item => {
        if (item.product_id === prodId) {
          events.push({
            date: pur.purchase_date || pur.created_at,
            type: 'Purchase Receipt',
            direction: 'IN',
            refId: pur.purchase_id || pur.id,
            partyName: pur.supplier_name || pur.vendor_name || 'Supplier',
            changeQty: Math.abs(Number(item.quantity || 0))
          });
        }
      });
    });

    // 3. Manufacturing Orders (IN)
    (manufacturing || []).forEach(mfg => {
      if (mfg.product_id === prodId && mfg.status === 'Completed') {
        const qty = Number(mfg.quantity_produced || mfg.quantity_to_produce || 0);
        if (qty > 0) {
          events.push({
            date: mfg.actual_completion_date || mfg.start_date || mfg.created_at,
            type: 'Mfg Production',
            direction: 'IN',
            refId: mfg.manufacturing_id,
            partyName: 'Factory Production',
            changeQty: Math.abs(qty)
          });
        }
      }
    });

    // Sort ascending by date to compute cumulative running balance
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    let runningBalance = 0;
    const eventsWithBalance = events.map(e => {
      runningBalance += e.changeQty;
      return {
        ...e,
        runningBalance
      };
    });

    // Return newest first for UI display
    return eventsWithBalance.reverse();
  }, [selectedStockItem, sales, purchases, manufacturing]);

  // Total summary stats for selected product
  const auditStats = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    movementLedger.forEach(m => {
      if (m.changeQty > 0) totalIn += m.changeQty;
      else totalOut += Math.abs(m.changeQty);
    });
    return { totalIn, totalOut, totalTransactions: movementLedger.length };
  }, [movementLedger]);

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Inventory Stock & Audit Ledger</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {printStockTable && (
            <button
              onClick={printStockTable}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              title="Print Stock Table"
            >
              <Printer size={16} /> Print Stock
            </button>
          )}
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {stock.map((s, idx) => {
          const prod = s.products || (products || []).find(p => p.product_id === s.product_id) || {};
          const productName = prod.product_name || s.product_id;
          const reorderLevel = prod.reorder_level || s.min_quantity || 10;
          const isLow = Number(s.quantity || 0) <= Number(reorderLevel);

          // Resolve supplier for low stock quick call
          const supplier = (suppliers || []).find(sup => sup.supplier_id === prod.supplier_id);
          const supplierPhone = supplier?.supp_comp_no || supplier?.supp_comp_person_no;

          return (
            <DataCard
              key={s.stock_id || idx}
              index={idx}
              icon={Package}
              iconColor={isLow ? "#ef4444" : "#10b981"}
              title={productName}
              subtitle={`Stock ID: ${s.stock_id} • Min: ${reorderLevel}`}
              status={isLow ? 'Low Stock' : 'In Stock'}
              statusColor={isLow ? '#ef4444' : '#10b981'}
              action={
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                  {isLow && supplierPhone ? (
                    <a
                      href={`tel:${supplierPhone}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#22c55e', color: 'white', padding: '5px 10px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.75rem', boxShadow: '0 2px 4px rgba(34,197,94,0.3)' }}
                    >
                      <Phone size={13} /> Call Supplier
                    </a>
                  ) : (
                    <div />
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedStockItem(s); }}
                    style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '5px 10px', color: '#1e293b', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    <History size={14} color="#3b82f6" /> Audit Log
                  </button>
                </div>
              }
              details={[
                { label: 'Current Qty', value: `${s.quantity} units`, color: isLow ? '#ef4444' : '#10b981' },
                { label: 'Warehouse', value: s.location || 'Main Warehouse' },
                { label: 'Assigned Supplier', value: supplier?.supp_comp_name || 'Not Assigned' }
              ]}
            />
          );
        })}
      </div>
      {stock.length === 0 && <p style={{ padding: '1rem', color: '#64748b' }}>No stock records found.</p>}

      {/* Stock Movement Audit Ledger Modal */}
      {selectedStockItem && (
        <ModalWrapper
          title={`Stock Movement Audit Ledger — ${selectedStockItem.products?.product_name || selectedStockItem.product_id}`}
          onClose={() => setSelectedStockItem(null)}
          maxWidth="750px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* Top Summary Banner */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Current Stock</span>
                <h4 style={{ margin: '0.2rem 0 0 0', color: '#0f172a', fontSize: '1.25rem', fontWeight: 'bold' }}>
                  {selectedStockItem.quantity} units
                </h4>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 600 }}>Total Inward (+)</span>
                <h4 style={{ margin: '0.2rem 0 0 0', color: '#10b981', fontSize: '1.25rem', fontWeight: 'bold' }}>
                  +{auditStats.totalIn}
                </h4>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#ef4444', textTransform: 'uppercase', fontWeight: 600 }}>Total Outward (-)</span>
                <h4 style={{ margin: '0.2rem 0 0 0', color: '#ef4444', fontSize: '1.25rem', fontWeight: 'bold' }}>
                  -{auditStats.totalOut}
                </h4>
              </div>
            </div>

            {/* Movement Table */}
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#334155' }}>
                Stock Movement History ({auditStats.totalTransactions} Events)
              </h4>

              {movementLedger.length === 0 ? (
                <p style={{ padding: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
                  No movement transactions recorded for this product yet.
                </p>
              ) : (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', maxHeight: '300px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                        <th style={{ padding: '8px 12px' }}>Date</th>
                        <th style={{ padding: '8px 12px' }}>Event Type</th>
                        <th style={{ padding: '8px 12px' }}>Ref No</th>
                        <th style={{ padding: '8px 12px' }}>Party / Source</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Change Qty</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Running Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movementLedger.map((m, i) => (
                        <tr key={i} style={{ borderTop: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '8px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                            {(m.date || '').split('T')[0]}
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: 600 }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.725rem',
                              backgroundColor: m.direction === 'IN' ? '#f0fdf4' : '#fef2f2',
                              color: m.direction === 'IN' ? '#16a34a' : '#dc2626'
                            }}>
                              {m.direction === 'IN' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                              {m.type}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a' }}>{m.refId}</td>
                          <td style={{ padding: '8px 12px', color: '#475569' }}>{m.partyName}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: m.changeQty > 0 ? '#10b981' : '#ef4444' }}>
                            {m.changeQty > 0 ? `+${m.changeQty}` : m.changeQty}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#334155' }}>
                            {m.runningBalance}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
};

export default StockModule;

