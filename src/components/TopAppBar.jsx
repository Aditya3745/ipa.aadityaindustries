import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Menu, Bell, X, PhoneCall, AlertTriangle, DollarSign, Check, ExternalLink, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import useERPData from '../hooks/useERPData';
import { requestNotificationPermission } from '../utils/notificationService';
import toast from 'react-hot-toast';

const todayStr = () => new Date().toISOString().split('T')[0];

const TopAppBar = ({ toggleDrawer }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [readIds, setReadIds] = useState(new Set());
  const [followups, setFollowups] = useState([]);

  // ERP hook data
  const { data } = useERPData();
  const { stock = [], customers = [] } = data;

  // Fetch follow-ups for notifications
  useEffect(() => {
    const fetchFollowups = async () => {
      const { data: fData } = await supabase
        .from('customer_followups')
        .select('*')
        .order('next_followup_date', { ascending: true, nullsLast: true });
      if (fData) setFollowups(fData);
    };

    fetchFollowups();
    const interval = setInterval(fetchFollowups, 60000); // refresh every min
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Generate Notification Items List
  const notifItems = useMemo(() => {
    const items = [];
    const t = todayStr();

    // 1. Follow-up Calls
    followups.forEach((f) => {
      if (f.next_followup_date === t && f.status !== 'nahi_aayega') {
        items.push({
          id: `f_today_${f.id}`,
          type: 'followup',
          title: `📞 Follow-up Call: ${f.customer_name}`,
          desc: `Call scheduled for today${f.contact_number ? ` (${f.contact_number})` : ''}`,
          time: 'Today',
          path: '/admin/dashboard?module=followup',
          color: '#d97706',
          bg: '#fffbeb',
          icon: PhoneCall,
          phone: f.contact_number
        });
      } else if (f.next_followup_date && f.next_followup_date < t && f.status !== 'nahi_aayega' && f.status !== 'confirmed') {
        items.push({
          id: `f_overdue_${f.id}`,
          type: 'followup',
          title: `⚠️ Overdue Follow-up: ${f.customer_name}`,
          desc: `Missed follow-up call on ${f.next_followup_date}`,
          time: 'Overdue',
          path: '/admin/dashboard?module=followup',
          color: '#dc2626',
          bg: '#fef2f2',
          icon: AlertTriangle,
          phone: f.contact_number
        });
      }
    });

    // 2. Low Stock Alerts
    (stock || []).forEach((stk) => {
      const q = Number(stk.quantity || 0);
      const minQ = Number(stk.min_quantity || 0);
      if (q <= minQ) {
        const prodName = stk.products?.product_name || `Product ID: ${stk.product_id}`;
        items.push({
          id: `s_low_${stk.stock_id || stk.product_id}`,
          type: 'stock',
          title: `📦 Low Stock Alert: ${prodName}`,
          desc: `Current stock: ${q} (Min Re-order: ${minQ})`,
          time: 'Inventory',
          path: '/admin/dashboard?module=stock',
          color: '#ef4444',
          bg: '#fef2f2',
          icon: AlertTriangle
        });
      }
    });

    // 3. Customer Dues Alerts (> ₹5000)
    (customers || []).forEach((c) => {
      const bal = Math.max(0, Number(c.customer_balance || c.balance || 0));
      if (bal >= 5000) {
        items.push({
          id: `c_due_${c.customer_id}`,
          type: 'dues',
          title: `💰 Payment Due: ${c.cust_comp_name}`,
          desc: `Outstanding Balance: ₹${bal.toLocaleString('en-IN')}`,
          time: 'Accounts',
          path: '/admin/dashboard?module=contact',
          color: '#2563eb',
          bg: '#eff6ff',
          icon: DollarSign,
          phone: c.cust_comp_person_no || c.cust_comp_no
        });
      }
    });

    return items;
  }, [followups, stock, customers]);

  const unreadItems = useMemo(() => {
    return notifItems.filter(it => !readIds.has(it.id));
  }, [notifItems, readIds]);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return notifItems;
    return notifItems.filter(it => it.type === filter);
  }, [notifItems, filter]);

  const handleMarkAllRead = () => {
    const all = new Set(readIds);
    notifItems.forEach(it => all.add(it.id));
    setReadIds(all);
    toast.success('All notifications marked as read!');
  };

  const handleItemClick = (it) => {
    setReadIds(prev => new Set(prev).add(it.id));
    setIsOpen(false);
    if (it.path) navigate(it.path);
  };

  const handleEnablePush = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      toast.success('Mobile push notifications enabled!');
    } else {
      toast.error('Notification permission denied.');
    }
  };

  return (
    <header className="top-app-bar" style={{ position: 'relative' }}>
      <div className="top-app-bar-container">
        {/* Menu Button */}
        <button className="icon-btn" onClick={toggleDrawer} aria-label="Toggle Drawer">
          <Menu size={24} color="white" />
        </button>

        {/* Title */}
        <div className="top-app-bar-title-wrapper" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/dashboard?module=overview')}>
          <span className="top-app-bar-title">Aaditya Industries</span>
          <span className="top-app-bar-subtitle">ERP & Production Suite</span>
        </div>

        {/* Bell Button with Unread Badge */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button 
            className="icon-btn" 
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Notifications"
            style={{ position: 'relative' }}
          >
            <Bell size={24} color="white" />
            {unreadItems.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                backgroundColor: '#ef4444',
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: 800,
                borderRadius: '10px',
                minWidth: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                boxShadow: '0 0 0 2px #1b233a',
                animation: 'pulse 2s infinite'
              }}>
                {unreadItems.length > 99 ? '99+' : unreadItems.length}
              </span>
            )}
          </button>

          {/* Glassmorphism Notification Dropdown Panel */}
          {isOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: '-8px',
              width: '350px',
              maxWidth: 'calc(100vw - 24px)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid #cbd5e1',
              borderRadius: '16px',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
              zIndex: 200,
              overflow: 'hidden',
              color: '#0f172a'
            }}>
              {/* Header */}
              <div style={{
                padding: '0.85rem 1rem',
                backgroundColor: '#1e293b',
                color: 'white',
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bell size={18} color="#60a5fa" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Notifications ({unreadItems.length})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {unreadItems.length > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      style={{ background: 'none', border: 'none', color: '#93c5fd', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Mark all read
                    </button>
                  )}
                  <button 
                    onClick={() => setIsOpen(false)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '0.35rem', padding: '0.5rem 0.75rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'followup', label: 'Calls' },
                  { id: 'stock', label: 'Low Stock' },
                  { id: 'dues', label: 'Dues' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '14px',
                      fontSize: '0.725rem',
                      fontWeight: 600,
                      border: filter === f.id ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                      backgroundColor: filter === f.id ? '#eff6ff' : 'white',
                      color: filter === f.id ? '#1d4ed8' : '#64748b',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Notification List */}
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {filteredItems.map((it) => {
                  const IconComp = it.icon;
                  const isRead = readIds.has(it.id);

                  return (
                    <div
                      key={it.id}
                      onClick={() => handleItemClick(it)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: isRead ? '#ffffff' : (it.bg || '#f8fafc'),
                        cursor: 'pointer',
                        transition: 'background-color 0.15s',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'flex-start',
                        opacity: isRead ? 0.75 : 1
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isRead ? '#ffffff' : (it.bg || '#f8fafc'))}
                    >
                      <div style={{
                        padding: '0.4rem',
                        borderRadius: '8px',
                        backgroundColor: `${it.color}15`,
                        color: it.color,
                        marginTop: '2px',
                        flexShrink: 0
                      }}>
                        <IconComp size={16} color={it.color} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.15rem' }}>
                          {it.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '0.35rem' }}>
                          {it.desc}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8' }}>
                          <span>{it.time}</span>
                          {it.phone && (
                            <a
                              href={`tel:${it.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              style={{ color: '#16a34a', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}
                            >
                              📞 Call Now
                            </a>
                          )}
                        </div>
                      </div>

                      {!isRead && (
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', marginTop: '6px', flexShrink: 0 }} />
                      )}
                    </div>
                  );
                })}

                {filteredItems.length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    <Check size={28} color="#cbd5e1" style={{ marginBottom: '0.5rem' }} />
                    <div>No notifications found!</div>
                  </div>
                )}
              </div>

              {/* Footer: Push Notification Enable */}
              <div style={{ padding: '0.6rem 1rem', backgroundColor: '#f1f5f9', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 600 }}>Mobile Push Alerts</span>
                <button
                  onClick={handleEnablePush}
                  style={{
                    padding: '0.25rem 0.65rem',
                    backgroundColor: '#1e293b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <Volume2 size={12} /> Enable
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopAppBar;
