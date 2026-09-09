import React, { useState, useMemo } from 'react';
import { PhoneCall, Search, User, Briefcase, ArrowLeft, FileText, Activity, CreditCard } from 'lucide-react';
import SettleDuesModal from '../../SettleDuesModal';
import { cardStyle, inputStyle } from '../../../styles/formStyles';

export const ContactModule = ({
  suppliers = [],
  customers = [],
  sales = [],
  purchases = [],
  transactions = [],
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); 
  const [selectedContact, setSelectedContact] = useState(null);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);

  // Combine and format contacts
  const contacts = useMemo(() => {
    const formattedSuppliers = suppliers.map(s => ({
      id: `sup_${s.supplier_id || s.id}`,
      rawId: s.supplier_id || s.id,
      name: s.supp_comp_name || s.vendor_name || s.name || 'Unknown Supplier',
      contactPerson: s.supp_comp_person || s.contact_person || '',
      type: 'Supplier',
      mobile: s.supp_comp_no || s.supp_comp_person_no || s.phone || s.mobile || '',
      balance: Number(s.supplier_balance || s.balance || s.opening_balance || 0),
      icon: <Briefcase size={20} color="#3b82f6" />
    }));

    const formattedCustomers = customers.map(c => ({
      id: `cust_${c.customer_id || c.id}`,
      rawId: c.customer_id || c.id,
      name: c.cust_comp_name || c.customer_name || c.name || 'Unknown Customer',
      contactPerson: c.cust_comp_person || c.contact_person || '',
      type: 'Customer',
      mobile: c.cust_comp_no || c.cust_comp_person_no || c.customer_phone || c.phone || '',
      balance: Number(c.customer_balance || c.balance || c.outstanding_balance || 0),
      icon: <User size={20} color="#10b981" />
    }));

    return [...formattedSuppliers, ...formattedCustomers].sort((a, b) => a.name.localeCompare(b.name));
  }, [suppliers, customers]);

  // Filter contacts
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) || (contact.mobile && contact.mobile.includes(searchTerm));
    const matchesType = filterType === 'all' || contact.type.toLowerCase() === filterType;
    return matchesSearch && matchesType;
  });

  if (selectedContact) {
    const isSupplier = selectedContact.type === 'Supplier';
    let totalBilled = 0;
    let history = [];

    if (isSupplier) {
      const contactPurchases = purchases.filter(p => p.supplier_id === selectedContact.rawId || p.supplier_name === selectedContact.name);
      totalBilled = contactPurchases.reduce((sum, p) => sum + (Number(p.grand_total) || 0), 0);
      history = [
        ...contactPurchases.map(p => ({
          date: p.purchase_date || p.created_at,
          title: `Purchase Order: ${p.purchase_id}`,
          amount: p.grand_total,
          type: 'invoice'
        })),
        ...transactions.filter(t => 
          (t.reference_table === 'purchases' && contactPurchases.some(cp => cp.purchase_id === t.reference_id)) ||
          contactPurchases.some(cp => t.description?.includes(cp.purchase_id)) ||
          (selectedContact.name && t.description?.toLowerCase().includes(selectedContact.name.toLowerCase())) ||
          t.reference_id === selectedContact.rawId
        ).map(t => ({
          date: t.payment_date || t.transaction_date || t.created_at,
          title: t.description || 'Payment to Supplier',
          amount: t.amount,
          type: 'payment',
          method: t.account_type || t.payment_method
        }))
      ];
    } else {
      const contactSales = sales.filter(s => s.customer_id === selectedContact.rawId || s.customer_name === selectedContact.name);
      totalBilled = contactSales.reduce((sum, s) => sum + (Number(s.grand_total) || 0), 0);
      history = [
        ...contactSales.map(s => ({
          date: s.sale_date || s.created_at,
          title: `Sale Invoice: ${s.sale_id || s.id}`,
          amount: s.grand_total,
          type: 'invoice'
        })),
        ...transactions.filter(t => 
          (t.reference_table === 'sales' && contactSales.some(cs => (cs.sale_id || cs.id) === t.reference_id)) ||
          contactSales.some(cs => t.description?.includes(cs.sale_id || cs.id)) ||
          (selectedContact.name && t.description?.toLowerCase().includes(selectedContact.name.toLowerCase())) ||
          t.reference_id === selectedContact.rawId
        ).map(t => ({
          date: t.payment_date || t.transaction_date || t.created_at,
          title: t.description || 'Payment Received',
          amount: t.amount,
          type: 'payment',
          method: t.account_type || t.payment_method
        }))
      ];
    }

    history.sort((a, b) => new Date(b.date) - new Date(a.date));
    const currentDues = selectedContact.balance || 0;
    const totalReceived = Math.max(0, totalBilled - currentDues);

    return (
      <div style={cardStyle}>
        <button
          onClick={() => setSelectedContact(null)}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', padding: 0, fontWeight: 600 }}
        >
          <ArrowLeft size={20} /> Back to Directory
        </button>
        
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '12px' }}>
              {selectedContact.icon}
            </div>
            <div>
              <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', color: '#0f172a' }}>{selectedContact.name}</h2>
              {selectedContact.contactPerson && (
                <p style={{ margin: '0 0 0.25rem 0', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={14} /> {selectedContact.contactPerson}
                </p>
              )}
              <p style={{ margin: 0, color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <PhoneCall size={14} /> {selectedContact.mobile || 'No Phone'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsSettleModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)' }}
          >
            <CreditCard size={18} /> {isSupplier ? 'Settle Supplier Dues' : 'Settle Customer Dues'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.875rem' }}>Total {isSupplier ? 'Purchased' : 'Billed'}</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>₹{totalBilled.toLocaleString()}</h3>
          </div>
          <div style={{ backgroundColor: '#f0fdf4', padding: '1.25rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <p style={{ margin: '0 0 0.5rem 0', color: '#166534', fontSize: '0.875rem' }}>Total {isSupplier ? 'Paid' : 'Received'}</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#15803d' }}>₹{totalReceived.toLocaleString()}</h3>
          </div>
          <div style={{ backgroundColor: '#fef2f2', padding: '1.25rem', borderRadius: '8px', border: '1px solid #fecaca' }}>
            <p style={{ margin: '0 0 0.5rem 0', color: '#991b1b', fontSize: '0.875rem' }}>Remaining {isSupplier ? 'to Pay' : 'Dues'}</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#b91c1c' }}>₹{currentDues.toLocaleString()}</h3>
          </div>
        </div>

        <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={20} /> Transaction History
        </h3>
        
        {history.length > 0 ? (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {history.map((h, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: h.type === 'invoice' ? '#eff6ff' : '#ecfdf5', borderRadius: '8px' }}>
                    {h.type === 'invoice' ? <FileText size={20} color="#3b82f6" /> : <Activity size={20} color="#10b981" />}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontWeight: '600', color: '#0f172a' }}>{h.title}</p>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>{new Date(h.date).toLocaleDateString()} {h.method ? `via ${h.method}` : ''}</p>
                  </div>
                </div>
                <div style={{ fontWeight: '700', color: h.type === 'invoice' ? '#0f172a' : (isSupplier ? '#ef4444' : '#10b981') }}>
                  {h.type === 'payment' ? (isSupplier ? '-' : '+') : ''}₹{Number(h.amount || 0).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No transaction history found for this contact.</p>
        )}

        {/* Multi-invoice settlement modal */}
        {isSettleModalOpen && (
          <SettleDuesModal
            isOpen={isSettleModalOpen}
            onClose={() => setIsSettleModalOpen(false)}
            contact={selectedContact}
            sales={sales}
            purchases={purchases}
            onSuccess={() => {
              if (onRefresh) onRefresh();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: '1.25rem', margin: '0 0 1.5rem 0' }}>Contacts Directory</h2>
      
      {/* Search and Filter */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search by name or number..." 
            style={{ ...inputStyle, paddingLeft: '2.25rem' }} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          style={{ padding: '0.65rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', backgroundColor: 'white' }}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Contacts</option>
          <option value="supplier">Suppliers</option>
          <option value="customer">Customers</option>
        </select>
      </div>

      {/* Contacts List */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {filteredContacts.length > 0 ? (
          filteredContacts.map(contact => (
            <div
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc', cursor: 'pointer', transition: 'background-color 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  {contact.icon}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', color: '#0f172a' }}>{contact.name}</h3>
                  {contact.contactPerson && (
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <User size={12} /> {contact.contactPerson}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.75rem' }}>
                    <span style={{ 
                      padding: '2px 6px', 
                      borderRadius: '4px', 
                      backgroundColor: contact.type === 'Supplier' ? '#dbeafe' : '#d1fae5', 
                      color: contact.type === 'Supplier' ? '#1d4ed8' : '#047857',
                      fontWeight: '600'
                    }}>
                      {contact.type}
                    </span>
                    <span style={{ color: '#64748b' }}>{contact.mobile || 'No number'}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                      <span style={{ 
                        color: contact.balance === 0 ? '#64748b' : 
                              (contact.type === 'Customer' ? (contact.balance > 0 ? '#ef4444' : '#10b981') : (contact.balance > 0 ? '#ef4444' : '#10b981')), 
                        fontWeight: 'bold' 
                      }}>
                        Bal: ₹{Math.abs(contact.balance || 0).toLocaleString()} 
                        {contact.balance === 0 ? '' : (
                          contact.type === 'Customer' ? 
                            (contact.balance > 0 ? ' (Dr)' : ' (Cr)') : 
                            (contact.balance > 0 ? ' (Cr)' : ' (Dr)')
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {contact.mobile ? (
                <a 
                  href={`tel:${contact.mobile}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.5rem', 
                    padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', 
                    borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                  }}
                >
                  <PhoneCall size={18} /> Call
                </a>
              ) : (
                <button disabled style={{ padding: '0.5rem 1rem', backgroundColor: '#e2e8f0', color: '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'not-allowed' }}>
                  No Number
                </button>
              )}
            </div>
          ))
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
            No contacts found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactModule;
