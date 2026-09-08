import React, { useState, useMemo } from 'react';
import { PhoneCall, Search, User, Briefcase } from 'lucide-react';

const cardStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' };
const inputStyle = { width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem' };

export const ContactModule = ({ suppliers = [], customers = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, supplier, customer

  // Combine and format contacts
  const contacts = useMemo(() => {
    const formattedSuppliers = suppliers.map(s => ({
      id: `sup_${s.supplier_id || s.id}`,
      name: s.supp_comp_name || s.vendor_name || s.name || 'Unknown Supplier',
      type: 'Supplier',
      mobile: s.supp_comp_no || s.supp_comp_person_no || s.phone || s.mobile || '',
      balance: s.supplier_balance || s.balance || s.opening_balance || 0,
      icon: <Briefcase size={20} color="#3b82f6" />
    }));

    const formattedCustomers = customers.map(c => ({
      id: `cust_${c.customer_id || c.id}`,
      name: c.cust_comp_name || c.customer_name || c.name || 'Unknown Customer',
      type: 'Customer',
      mobile: c.cust_comp_no || c.cust_comp_person_no || c.customer_phone || c.phone || '',
      balance: c.customer_balance || c.balance || c.outstanding_balance || 0,
      icon: <User size={20} color="#10b981" />
    }));

    return [...formattedSuppliers, ...formattedCustomers].sort((a, b) => a.name.localeCompare(b.name));
  }, [suppliers, customers]);

  // Filter contacts
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) || contact.mobile.includes(searchTerm);
    const matchesType = filterType === 'all' || contact.type.toLowerCase() === filterType;
    return matchesSearch && matchesType;
  });

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
            style={inputStyle} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          style={{ padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', backgroundColor: 'white' }}
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
            <div key={contact.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  {contact.icon}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', color: '#0f172a' }}>{contact.name}</h3>
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
                    <span style={{ color: contact.balance < 0 ? '#ef4444' : (contact.balance > 0 ? '#10b981' : '#64748b'), fontWeight: 'bold' }}>
                      Bal: ₹{Math.abs(contact.balance || 0).toLocaleString()} {contact.balance < 0 ? '(Dr)' : (contact.balance > 0 ? '(Cr)' : '')}
                    </span>
                  </div>
                </div>
              </div>
              
              {contact.mobile ? (
                <a 
                  href={`tel:${contact.mobile}`}
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
