import React from 'react';
import { Info, Mail, Phone, Globe } from 'lucide-react';

export const AboutModule = () => {
  const cardStyle = { backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', maxWidth: '800px', margin: '0 auto' };
  
  return (
    <div style={cardStyle}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '40px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
          <Info size={40} color="#3b82f6" />
        </div>
        <h2 style={{ fontSize: '1.75rem', color: '#1e293b', margin: '0 0 0.5rem 0' }}>About Aaditya ERP</h2>
        <p style={{ color: '#64748b', margin: 0 }}>Version 1.0.0</p>
      </div>

      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', color: '#1e293b', marginBottom: '1rem' }}>System Information</h3>
        <p style={{ color: '#475569', lineHeight: '1.6' }}>
          Aaditya ERP is a comprehensive Enterprise Resource Planning solution designed specifically for Aaditya Industries. It provides powerful tools for managing inventory, tracking sales, processing purchase orders, and generating professional catalogs and invoices.
        </p>
      </div>

      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', color: '#1e293b', marginBottom: '1.5rem' }}>Support & Contact</h3>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: '8px' }}><Mail size={20} color="#475569" /></div>
            <div>
              <p style={{ margin: 0, fontWeight: '500', color: '#1e293b' }}>Email Support</p>
              <a href="mailto:info@aadityaindustries.online" style={{ color: '#3b82f6', textDecoration: 'none' }}>info@aadityaindustries.online</a>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: '8px' }}><Phone size={20} color="#475569" /></div>
            <div>
              <p style={{ margin: 0, fontWeight: '500', color: '#1e293b' }}>Phone Support</p>
              <a href="tel:+916202759310" style={{ color: '#3b82f6', textDecoration: 'none' }}>+91-6202759310</a>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: '8px' }}><Globe size={20} color="#475569" /></div>
            <div>
              <p style={{ margin: 0, fontWeight: '500', color: '#1e293b' }}>Website</p>
              <a href="https://ipa.aadityaindustries.online" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>ipa.aadityaindustries.online</a>
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' }}>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>&copy; {new Date().getFullYear()} Aaditya Industries. All rights reserved.</p>
      </div>
    </div>
  );
};
