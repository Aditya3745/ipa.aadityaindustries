import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../supabase';
import {
  PhoneCall, Plus, Bell, CheckCircle, XCircle, Clock, AlertTriangle,
  Edit2, Trash2, RefreshCw, MessageSquare, User, X, Package,
  ShoppingCart, Send, Calculator, FileText
} from 'lucide-react';
import ModalWrapper from '../../ModalWrapper';
import FormActions from '../../FormActions';
import { cardStyle, inputStyle, labelStyle, gridStyle3 } from '../../../styles/formStyles';
import toast from 'react-hot-toast';
import { scheduleDailyFollowUpReminder, requestNotificationPermission } from '../../../utils/notificationService';
import { generateIndividualInvoicePDF } from '../../../utils/pdfGenerator';
import RateCalculatorModal from './RateCalculatorModal';

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: '#f59e0b', bg: '#fffbeb', icon: Clock       },
  quote_sent:  { label: 'Quote Sent',  color: '#8b5cf6', bg: '#f3e8ff', icon: FileText    },
  aayega:      { label: 'Aayega',      color: '#10b981', bg: '#ecfdf5', icon: CheckCircle },
  confirmed:   { label: 'Confirmed',   color: '#3b82f6', bg: '#eff6ff', icon: CheckCircle },
  nahi_aayega: { label: 'Nahi Aayega', color: '#ef4444', bg: '#fef2f2', icon: XCircle    },
};
const FILTER_OPTIONS = ['all', 'pending', 'quote_sent', 'aayega', 'confirmed', 'nahi_aayega', 'today', 'overdue'];
const todayStr = () => new Date().toISOString().split('T')[0];
const daysDiff = (d) => { if (!d) return null; return Math.ceil((new Date(d) - new Date(todayStr())) / 86400000); };
const formatDate = (d) => { if (!d) return '---'; return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); };

// ── WhatsApp helper ────────────────────────────────────────────────
const openWhatsApp = (item) => {
  const items = Array.isArray(item.items) ? item.items : [];
  const totalPrice = items.reduce((sum, it) => sum + (Number(it.unit_price || 0) * Number(it.quantity || 1)), 0);
  const products = items.length > 0
    ? items.map(it => `  - ${it.product_name} x${it.quantity}${it.unit_price ? ` (@ ₹${Number(it.unit_price).toLocaleString('en-IN')})` : ''}`).join('\n')
    : '';
  const totalStr = totalPrice > 0 ? `\n*Total Deal Amount: ₹${totalPrice.toLocaleString('en-IN')}*\n` : '';
  const msg = `Namaste ${item.customer_name} ji 🙏\n\nAaditya Industries ki taraf se aapka follow-up karna tha.\n${products ? `\nAapke required products:\n${products}\n` : ''}${totalStr}\nKya aap abhi order confirm karna chahenge?\n\nHamse contact karein — dhanyawad! 😊`;
  const phone = item.contact_number?.replace(/\D/g, '');
  const url = phone
    ? `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
};

// ── Alert Banner ──────────────────────────────────────────────────
const AlertBanner = ({ followups, onEnableNotifications }) => {
  const t = todayStr();
  const todayA   = followups.filter(f => f.next_followup_date === t && f.status !== 'nahi_aayega');
  const overdueA = followups.filter(f => f.next_followup_date && f.next_followup_date < t && f.status !== 'nahi_aayega' && f.status !== 'confirmed');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
      {todayA.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg,#fef3c7,#fde68a)', border: '1px solid #f59e0b', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Bell size={18} color="#d97706" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#92400e' }}>Aaj {todayA.length} customer(s) ko call karna hai: {todayA.map(f => f.customer_name).join(', ')}</span>
          </div>
          <button onClick={onEnableNotifications} style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', background: 'white', border: '1px solid #f59e0b', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            🔔 Enable Notifications
          </button>
        </div>
      )}
      {overdueA.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg,#fef2f2,#fecaca)', border: '1px solid #ef4444', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={18} color="#dc2626" />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#991b1b' }}>{overdueA.length} follow-up(s) overdue: {overdueA.map(f => f.customer_name).join(', ')}</span>
        </div>
      )}
    </div>
  );
};

const dBox = { backgroundColor: 'white', border: '1px solid #f1f5f9', borderRadius: '8px', padding: '0.45rem 0.6rem' };
const dLbl = { display: 'block', fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.15rem' };
const dVal = { display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' };

// ── Follow-up Card ────────────────────────────────────────────────
const FollowUpCard = ({ item, onEdit, onDelete, onStatusChange, onConvertToSale, onGenerateQuotation }) => {
  const cfg  = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
  const SI   = cfg.icon;
  const t    = todayStr();
  const over = item.next_followup_date && item.next_followup_date < t && item.status !== 'nahi_aayega';
  const due  = item.next_followup_date === t;
  const diff = daysDiff(item.next_followup_date);
  const items = Array.isArray(item.items) ? item.items : [];
  const totalPrice = items.reduce((sum, it) => sum + (Number(it.unit_price || 0) * Number(it.quantity || 1)), 0);

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.25rem', border: `1px solid ${over?'#fecaca':due?'#fde68a':'#f1f5f9'}`, boxShadow: over?'0 2px 12px rgba(239,68,68,0.08)':due?'0 2px 12px rgba(245,158,11,0.10)':'0 2px 8px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: cfg.color, borderRadius: '12px 12px 0 0' }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <User size={14} color="#6366f1" />
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{item.customer_name}</span>
          </div>
          {item.contact_number && <a href={'tel:'+item.contact_number} style={{ fontSize: '0.8rem', color: '#10b981', textDecoration: 'none', fontWeight: 500 }}>{item.contact_number}</a>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.65rem', borderRadius: '20px', backgroundColor: cfg.bg, border: `1px solid ${cfg.color}33` }}>
          <SI size={12} color={cfg.color} />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
        </div>
      </div>

      {/* Products */}
      {items.length > 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Products Required:</span>
            {totalPrice > 0 && (
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '0.15rem 0.5rem', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                Total: ₹{totalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {items.map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.3rem 0.6rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Package size={12} color="#6366f1" />
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{it.product_name}</span>
                  <span style={{ color: '#6366f1', fontWeight: 700 }}>x{it.quantity}</span>
                </div>
                {Number(it.unit_price) > 0 ? (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#64748b', fontSize: '0.72rem' }}>@ ₹{Number(it.unit_price).toLocaleString('en-IN')} = </span>
                    <strong style={{ color: '#059669', fontSize: '0.8rem' }}>₹{(Number(it.unit_price) * Number(it.quantity)).toLocaleString('en-IN')}</strong>
                  </div>
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: '0.72rem', fontStyle: 'italic' }}>Rate not set</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.6rem', marginBottom: '0.75rem' }}>
        {item.expected_date && <div style={dBox}><span style={dLbl}>Expected</span><span style={dVal}>{formatDate(item.expected_date)}</span></div>}
        {item.next_followup_date && (
          <div style={{ ...dBox, borderColor: due?'#fde68a':over?'#fecaca':'#f1f5f9', backgroundColor: due?'#fffbeb':over?'#fef2f2':'white' }}>
            <span style={dLbl}>Follow-up</span>
            <span style={{ ...dVal, color: due?'#d97706':over?'#ef4444':'#0f172a' }}>
              {due ? 'Aaj!' : over ? Math.abs(diff)+'d overdue' : diff+'d baad'}
            </span>
          </div>
        )}
      </div>

      {item.last_checked_on && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.65rem' }}>Last checked: {formatDate(item.last_checked_on)}</div>}

      {item.notes && (
        <div style={{ fontSize: '0.8rem', color: '#475569', backgroundColor: '#f8fafc', borderRadius: '6px', padding: '0.5rem 0.65rem', marginBottom: '0.75rem', display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
          <MessageSquare size={12} color="#94a3b8" style={{ marginTop: '2px', flexShrink: 0 }} />
          <span>{item.notes}</span>
        </div>
      )}

      {/* Quick status row */}
      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
        {Object.entries(STATUS_CONFIG).map(([key, val]) => (
          <button key={key} onClick={() => onStatusChange(item.id, key)}
            style={{ padding: '0.22rem 0.5rem', borderRadius: '6px', border: `1px solid ${item.status===key?val.color:'#e2e8f0'}`, background: item.status===key?val.bg:'white', color: item.status===key?val.color:'#64748b', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer' }}>
            {val.label}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem' }}>
        {/* WhatsApp */}
        <button onClick={() => openWhatsApp(item)}
          style={{ flex: 1, minWidth: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', padding: '0.45rem 0.6rem', background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: '8px', cursor: 'pointer', color: '#059669', fontSize: '0.78rem', fontWeight: 700 }}>
          <Send size={13} /> WhatsApp
        </button>
        {/* Quote PDF */}
        {items.length > 0 && (
          <button onClick={() => onGenerateQuotation(item)}
            style={{ flex: 1, minWidth: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', padding: '0.45rem 0.6rem', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px', cursor: 'pointer', color: '#b45309', fontSize: '0.78rem', fontWeight: 700 }}>
            <FileText size={13} /> Quote PDF
          </button>
        )}
        {/* Convert to Sale */}
        {items.length > 0 && item.status !== 'nahi_aayega' && (
          <button onClick={() => onConvertToSale(item)}
            style={{ flex: 1, minWidth: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', padding: '0.45rem 0.6rem', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '8px', cursor: 'pointer', color: '#1d4ed8', fontSize: '0.78rem', fontWeight: 700 }}>
            <ShoppingCart size={13} /> Convert to Sale
          </button>
        )}
        {/* Edit */}
        <button onClick={() => onEdit(item)} style={{ padding: '0.45rem 0.6rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', color: '#6366f1', display: 'flex', alignItems: 'center' }} title="Edit"><Edit2 size={14} /></button>
        {/* Delete */}
        <button onClick={() => onDelete(item.id)} style={{ padding: '0.45rem 0.6rem', border: '1px solid #fecaca', borderRadius: '8px', background: 'white', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }} title="Delete"><Trash2 size={14} /></button>
      </div>
    </div>
  );
};

// ── Main Module ───────────────────────────────────────────────────
export const FollowUpModule = ({ customers = [], products = [], onRefresh, setCurrentView, setEditTransactionData }) => {
  const [followups, setFollowups]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editData, setEditData]     = useState(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('customer_followups').select('*').order('next_followup_date', { ascending: true, nullsLast: true });
    if (error) toast.error('Could not load follow-ups');
    const rows = data || [];
    setFollowups(rows);
    setLoading(false);
    // Schedule notification for today's follow-ups
    const t = todayStr();
    const todayCount = rows.filter(f => f.next_followup_date === t && f.status !== 'nahi_aayega').length;
    if (todayCount > 0) scheduleDailyFollowUpReminder(todayCount);
  };

  useEffect(() => { load(); }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    toast[granted ? 'success' : 'error'](granted ? 'Notifications enabled!' : 'Permission denied');
  };

  const handleStatusChange = async (id, s) => {
    const { error } = await supabase.from('customer_followups').update({ status: s, last_checked_on: todayStr() }).eq('id', id);
    if (error) { toast.error('Failed'); return; }
    toast.success('Status updated!');
    setFollowups(prev => prev.map(f => f.id === id ? { ...f, status: s, last_checked_on: todayStr() } : f));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete karna chahte ho?')) return;
    const { error } = await supabase.from('customer_followups').delete().eq('id', id);
    if (error) { toast.error('Delete failed'); return; }
    toast.success('Deleted');
    setFollowups(prev => prev.filter(f => f.id !== id));
  };

  // ── Generate Quotation PDF ─────────────────────────────────────────
  const handleGenerateQuotation = async (item) => {
    try {
      toast.loading("Generating Quotation PDF...", { id: "quote-toast" });
      const customer = customers.find(c => c.cust_comp_name === item.customer_name);
      const items = Array.isArray(item.items) ? item.items : [];
      const totalPrice = items.reduce((sum, it) => sum + (Number(it.unit_price || 0) * Number(it.quantity || 1)), 0);

      const mappedData = {
        id: item.id ? `EST-${String(item.id).slice(-6).toUpperCase()}` : `EST-${Date.now().toString().slice(-6)}`,
        sale_id: item.id ? `EST-${String(item.id).slice(-6).toUpperCase()}` : `EST-${Date.now().toString().slice(-6)}`,
        customer_name: item.customer_name,
        customer_phone: item.contact_number,
        customer_gst_no: customer?.cust_gst_no || null,
        sale_date: todayStr(),
        expected_date: item.expected_date,
        grand_total: totalPrice,
        amount_paid: 0,
        advance_amount: 0,
        dues: totalPrice,
        notes: item.notes || 'Quotation Estimate from Aaditya Industries'
      };

      const mappedItems = items.map(it => {
        const prod = products.find(p => p.product_id === it.product_id);
        const uPrice = Number(it.unit_price) > 0 ? Number(it.unit_price) : (prod?.selling_rate || prod?.price || 0);
        return {
          product_name: it.product_name,
          quantity: Number(it.quantity) || 1,
          unit_price: uPrice,
          total_price: uPrice * (Number(it.quantity) || 1),
          hsn_code: prod?.hsn_code || '9401'
        };
      });

      await generateIndividualInvoicePDF('sale', mappedData, mappedItems, true, [], true);
      toast.success("Quotation PDF generated successfully!", { id: "quote-toast" });

      if (item.status === 'pending') {
        handleStatusChange(item.id, 'quote_sent');
      }
    } catch (err) {
      console.error("Failed to generate quote PDF", err);
      toast.error("Failed to generate Quotation PDF", { id: "quote-toast" });
    }
  };

  // ── Convert to Sale ──────────────────────────────────────────────
  const handleConvertToSale = async (item) => {
    // Mark as confirmed
    await supabase.from('customer_followups').update({ status: 'confirmed', last_checked_on: todayStr() }).eq('id', item.id);
    setFollowups(prev => prev.map(f => f.id === item.id ? { ...f, status: 'confirmed' } : f));

    // Build pre-fill data for CreateSaleForm
    const customer = customers.find(c => c.cust_comp_name === item.customer_name);
    const saleItems = (item.items || []).map(it => {
      const prod = products.find(p => p.product_id === it.product_id);
      const unitPrice = Number(it.unit_price) > 0 ? Number(it.unit_price) : (prod?.selling_rate || prod?.price || 0);
      return {
        product_id: it.product_id,
        product_name: it.product_name,
        quantity: it.quantity,
        unit_price: unitPrice,
        total_price: unitPrice * it.quantity,
        cgst: prod?.cgst || 0,
        sgst: prod?.sgst || 0,
        igst: prod?.igst || 0,
        tax_amount: 0,
      };
    });

    const prefill = {
      customer_name: item.customer_name,
      customer_id: customer?.customer_id || null,
      delivery_date: item.expected_date || '',
      notes: `Converted from Follow-up. ${item.notes || ''}`.trim(),
      sale_items: saleItems,
      _isFollowUpConvert: true,
    };

    toast.success('Follow-up confirmed! Sale form mein ja raha hai...');
    setTimeout(() => {
      if (setEditTransactionData && setCurrentView) {
        setEditTransactionData(prefill);
        setCurrentView('create_sale');
      } else {
        toast('Sale form open karo aur items manually daalo', { icon: 'ℹ️' });
      }
    }, 800);
  };

  const filtered = useMemo(() => {
    const t = todayStr(); let list = [...followups];
    if (filter === 'today') list = list.filter(f => f.next_followup_date === t);
    else if (filter === 'overdue') list = list.filter(f => f.next_followup_date && f.next_followup_date < t && f.status !== 'nahi_aayega');
    else if (filter !== 'all') list = list.filter(f => f.status === filter);
    if (searchTerm.trim()) { const q = searchTerm.toLowerCase(); list = list.filter(f => f.customer_name?.toLowerCase().includes(q) || f.contact_number?.includes(q)); }
    return list;
  }, [followups, filter, searchTerm]);

  const stats = useMemo(() => {
    const t = todayStr();
    const totalPipelineValue = followups.reduce((acc, f) => {
      const items = Array.isArray(f.items) ? f.items : [];
      return acc + items.reduce((sum, it) => sum + (Number(it.unit_price || 0) * Number(it.quantity || 1)), 0);
    }, 0);

    return {
      total: followups.length,
      today: followups.filter(f => f.next_followup_date === t).length,
      overdue: followups.filter(f => f.next_followup_date && f.next_followup_date < t && f.status !== 'nahi_aayega').length,
      aayega: followups.filter(f => f.status === 'aayega' || f.status === 'confirmed').length,
      pipelineValue: totalPipelineValue
    };
  }, [followups]);

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><PhoneCall size={20} color="#6366f1" /> Customer Follow-up Tracker</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>Kaunse customer se kya update mila, kab aayega aur kya deal rate finalize hua</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={load} style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><RefreshCw size={15} color="#64748b" /></button>
          <button onClick={() => { setEditData(null); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}><Plus size={16} /> New Follow-up</button>
        </div>
      </div>

      <AlertBanner followups={followups} onEnableNotifications={handleEnableNotifications} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[{ label:'Total', value:stats.total, color:'#6366f1', bg:'#eef2ff' },{ label:'Aaj Call', value:stats.today, color:'#d97706', bg:'#fffbeb' },{ label:'Overdue', value:stats.overdue, color:'#ef4444', bg:'#fef2f2' },{ label:'Aayega/Confirmed', value:stats.aayega, color:'#10b981', bg:'#ecfdf5' },{ label:'Pipeline Value', value:`₹${(stats.pipelineValue/1000).toFixed(1)}k`, color:'#8b5cf6', bg:'#f3e8ff' }].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}22`, borderRadius: '10px', padding: '0.75rem 1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <input type="text" placeholder="Customer naam ya number..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: '200px', maxWidth: '300px' }} />
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {FILTER_OPTIONS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '0.4rem 0.75rem', borderRadius: '20px', border: `1px solid ${filter===f?'#6366f1':'#e2e8f0'}`, background: filter===f?'#eef2ff':'white', color: filter===f?'#6366f1':'#64748b', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
              {f==='all'?'Sab':f==='today'?'Aaj':f==='overdue'?'Overdue':STATUS_CONFIG[f]?.label||f}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:'3rem', color:'#64748b' }}>Loading...</div>
      : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'#94a3b8' }}>
          <PhoneCall size={40} color="#e2e8f0" style={{ marginBottom:'0.75rem' }} />
          <div style={{ fontWeight:600 }}>Koi follow-up nahi mila</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'1rem' }}>
          {filtered.map(item => (
            <FollowUpCard key={item.id} item={item}
              onEdit={d => { setEditData(d); setShowModal(true); }}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onConvertToSale={handleConvertToSale}
              onGenerateQuotation={handleGenerateQuotation}
            />
          ))}
        </div>
      )}
      {showModal && <FollowUpModal editData={editData} customers={customers} products={products} onClose={() => { setShowModal(false); setEditData(null); }} onSuccess={() => { load(); setShowModal(false); setEditData(null); }} />}
    </div>
  );
};

// ── Add/Edit Modal ────────────────────────────────────────────────
export const FollowUpModal = ({ onClose, editData, customers = [], products = [], onSuccess }) => {
  const [form, setForm] = useState({
    customer_name: '', contact_number: '', items: [],
    expected_date: '', next_followup_date: '', last_checked_on: todayStr(),
    status: 'pending', notes: '',
    ...(editData ? { ...editData, items: Array.isArray(editData.items) ? editData.items : [] } : {}),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [custSug, setCustSug]           = useState([]);
  const [showSug, setShowSug]           = useState(false);
  const [selProd, setSelProd]           = useState('');
  const [qty, setQty]                   = useState(1);
  const [unitPrice, setUnitPrice]       = useState('');
  const [showRateCalc, setShowRateCalc] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleCustInput = (val) => {
    set('customer_name', val);
    if (val.length > 0) { const m = customers.filter(c => c.cust_comp_name?.toLowerCase().includes(val.toLowerCase())).slice(0,5); setCustSug(m); setShowSug(m.length>0); }
    else setShowSug(false);
  };
  const pickCustomer = (c) => { set('customer_name', c.cust_comp_name); set('contact_number', c.cust_comp_person_no||c.cust_comp_no||''); setShowSug(false); };

  const handleProductSelect = (pid) => {
    setSelProd(pid);
    const prod = products.find(p => p.product_id === pid);
    if (prod) {
      setUnitPrice(prod.selling_rate || prod.price || '');
    } else {
      setUnitPrice('');
    }
  };

  const addItem = () => {
    if (!selProd) { toast.error('Product select karo'); return; }
    const prod = products.find(p => p.product_id === selProd);
    if (!prod) return;
    const priceNum = Number(unitPrice) >= 0 ? Number(unitPrice) : (prod.selling_rate || prod.price || 0);
    const exists = form.items.find(it => it.product_id === selProd);
    if (exists) {
      set('items', form.items.map(it => it.product_id === selProd ? { ...it, quantity: it.quantity + qty, unit_price: priceNum } : it));
    } else {
      set('items', [...form.items, {
        product_id: prod.product_id,
        product_name: prod.product_name || prod.title,
        quantity: qty,
        unit_price: priceNum
      }]);
    }
    setSelProd(''); setQty(1); setUnitPrice('');
  };

  const removeItem  = (pid) => set('items', form.items.filter(it => it.product_id !== pid));
  const updateQty   = (pid, q) => set('items', form.items.map(it => it.product_id === pid ? { ...it, quantity: Math.max(1, q) } : it));
  const updatePrice = (pid, p) => set('items', form.items.map(it => it.product_id === pid ? { ...it, unit_price: Number(p) || 0 } : it));

  const totalCalculatedAmount = useMemo(() => {
    return form.items.reduce((sum, it) => sum + (Number(it.unit_price || 0) * Number(it.quantity || 1)), 0);
  }, [form.items]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_name.trim()) { toast.error('Customer naam daalo'); return; }
    setIsSubmitting(true);
    try {
      // Sanitize: convert empty date strings to null (Supabase DATE columns reject '')
      const payload = {
        customer_name:      form.customer_name.trim(),
        contact_number:     form.contact_number || null,
        items:              form.items || [],
        expected_date:      form.expected_date      || null,
        next_followup_date: form.next_followup_date || null,
        last_checked_on:    form.last_checked_on    || null,
        status:             form.status || 'pending',
        notes:              form.notes || null,
      };
      if (editData?.id) {
        const { error } = await supabase.from('customer_followups').update(payload).eq('id', editData.id);
        if (error) throw error;
        toast.success('Follow-up update ho gaya!');
      } else {
        const { error } = await supabase.from('customer_followups').insert([payload]);
        if (error) throw error;
        toast.success('Follow-up add ho gaya!');
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Follow-up save error:', err);
      toast.error(err.message || 'Kuch galat ho gaya, dobara try karo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper title={editData ? 'Follow-up Edit Karo' : 'Naya Follow-up Add Karo'} onClose={onClose} maxWidth="720px">
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
          <div style={{ position:'relative' }}>
            <label style={labelStyle}>Customer / Company Name *</label>
            <input type="text" style={inputStyle} required value={form.customer_name}
              onChange={e => handleCustInput(e.target.value)}
              onBlur={() => setTimeout(() => setShowSug(false), 150)}
              placeholder="Naam likhna shuru karo..." />
            {showSug && (
              <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'white', border:'1px solid #e2e8f0', borderRadius:'8px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', zIndex:999, maxHeight:'180px', overflowY:'auto' }}>
                {custSug.map(c => (
                  <div key={c.customer_id} onMouseDown={() => pickCustomer(c)}
                    style={{ padding:'0.6rem 0.85rem', cursor:'pointer', fontSize:'0.875rem', borderBottom:'1px solid #f8fafc' }}
                    onMouseEnter={e => (e.currentTarget.style.background='#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background='white')}>
                    <strong>{c.cust_comp_name}</strong> <span style={{ color:'#94a3b8', fontSize:'0.78rem' }}>{c.cust_comp_person_no||c.cust_comp_no}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label style={labelStyle}>Contact Number</label>
            <input type="tel" style={inputStyle} value={form.contact_number} onChange={e => set('contact_number', e.target.value)} placeholder="Mobile number" />
          </div>
        </div>

        {/* Products Required Section */}
        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <label style={{ ...labelStyle, marginBottom: 0, fontWeight: 700, color: '#1e293b' }}>
              📦 Products & Decided Rate (Kya Deal Fix Hui)
            </label>
            {totalCalculatedAmount > 0 && (
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid #6ee7b7' }}>
                Est. Total: ₹{totalCalculatedAmount.toLocaleString('en-IN')}
              </div>
            )}
          </div>

          <div style={{ display:'flex', gap:'0.5rem', marginBottom:'0.75rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '2', minWidth: '180px' }}>
              <select style={inputStyle} value={selProd} onChange={e => handleProductSelect(e.target.value)}>
                <option value="">Select product...</option>
                {products.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name||p.title}{p.category?` (${p.category})`:''}</option>)}
              </select>
            </div>
            <div style={{ width: '80px' }}>
              <input type="number" min={1} placeholder="Qty" style={{ ...inputStyle, textAlign:'center' }} value={qty} onChange={e => setQty(Math.max(1,Number(e.target.value)))} />
            </div>
            <div style={{ width: '130px', display: 'flex', alignItems: 'stretch' }}>
              <input type="number" min={0} placeholder="Decided Rate ₹" style={{ ...inputStyle, borderRadius: '8px 0 0 8px', borderRight: 'none' }} value={unitPrice} onChange={e => setUnitPrice(e.target.value)} title="Customer se kya rate decide hua" />
              <button type="button" onClick={() => setShowRateCalc(true)} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '0 8px 8px 0', padding: '0 0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Open Rate Calculator">
                <Calculator size={16} color="#64748b" />
              </button>
            </div>
            <button type="button" onClick={addItem} style={{ padding:'0.5rem 1rem', background:'#6366f1', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:600, display:'flex', alignItems:'center', gap:'0.35rem', whiteSpace:'nowrap' }}>
              <Plus size={15} /> Add Item
            </button>
          </div>

          {showRateCalc && (
            <RateCalculatorModal
              initialBasePrice={unitPrice || (products.find(p => p.product_id === selProd)?.selling_rate || products.find(p => p.product_id === selProd)?.price || 0)}
              onClose={() => setShowRateCalc(false)}
              onApply={(calculatedRate) => {
                setUnitPrice(calculatedRate);
                setShowRateCalc(false);
              }}
            />
          )}

          {form.items.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem', marginTop: '0.5rem' }}>
              {form.items.map(it => {
                const rowTotal = (Number(it.unit_price) || 0) * (Number(it.quantity) || 1);
                return (
                  <div key={it.product_id} style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 0.75rem', background:'white', borderRadius:'8px', border:'1px solid #cbd5e1', flexWrap: 'wrap' }}>
                    <Package size={14} color="#6366f1" />
                    <span style={{ flex: '2', minWidth: '130px', fontSize:'0.85rem', fontWeight: 600 }}>{it.product_name}</span>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ fontSize:'0.75rem', color:'#64748b' }}>Qty:</span>
                      <input type="number" min={1} style={{ ...inputStyle, width:'60px', padding:'0.25rem 0.35rem', textAlign:'center', fontSize:'0.85rem' }} value={it.quantity} onChange={e => updateQty(it.product_id, Number(e.target.value))} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ fontSize:'0.75rem', color:'#64748b' }}>Rate ₹:</span>
                      <input type="number" min={0} style={{ ...inputStyle, width:'90px', padding:'0.25rem 0.35rem', textAlign:'right', fontSize:'0.85rem' }} value={it.unit_price ?? ''} onChange={e => updatePrice(it.product_id, e.target.value)} />
                    </div>

                    <div style={{ minWidth: '85px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 700, color: '#059669' }}>
                      ₹{rowTotal.toLocaleString('en-IN')}
                    </div>

                    <button type="button" onClick={() => removeItem(it.product_id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', display:'flex', alignItems:'center', padding: '0.2rem' }} title="Remove"><X size={16} /></button>
                  </div>
                );
              })}

              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: '#ecfdf5', borderRadius: '6px', border: '1px solid #a7f3d0', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#065f46' }}>Total Deal Amount:</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#059669' }}>₹{totalCalculatedAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>Status</label>
          <select style={{ ...inputStyle, cursor:'pointer' }} value={form.status} onChange={e => set('status', e.target.value)}>
            {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        <div style={gridStyle3}>
          <div><label style={labelStyle}>Expected Delivery Date</label><input type="date" style={inputStyle} value={form.expected_date} onChange={e => set('expected_date', e.target.value)} /></div>
          <div><label style={labelStyle}>Next Follow-up Date</label><input type="date" style={inputStyle} value={form.next_followup_date} onChange={e => set('next_followup_date', e.target.value)} /></div>
          <div><label style={labelStyle}>Last Checked On</label><input type="date" style={inputStyle} value={form.last_checked_on} onChange={e => set('last_checked_on', e.target.value)} /></div>
        </div>

        <div>
          <label style={labelStyle}>Notes / Update</label>
          <textarea style={{ ...inputStyle, minHeight:'75px', resize:'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Kya update mila? Customer ne kya kaha?" />
        </div>

        <FormActions onClose={onClose} isSubmitting={isSubmitting} label={editData ? 'Update Karo' : 'Add Karo'} />
      </form>
    </ModalWrapper>
  );
};

export default FollowUpModule;

