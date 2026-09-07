import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { Plus, ShieldCheck } from 'lucide-react';
import DataCard from '../../DataCard';

const cardStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' };

export const UserModule = ({ users, setModalConfig }) => {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>System Users</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setModalConfig({ isOpen: true, type: 'user' })} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}><Plus size={16} /> Add</button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {users.map((u, idx) => (
          <DataCard
            key={u.user_id}
            index={idx}
            icon={ShieldCheck}
            iconColor="#f59e0b"
            title={u.username}
            subtitle={u.user_id}
            status={u.role}
            details={[
              { label: 'Full Name', value: u.full_name }
            ]}
          />
        ))}
      </div>
      {users.length === 0 && <p style={{ padding: '1rem', color: '#64748b' }}>No users found.</p>}
    </div>
  );
};

export const UserModal = ({ onClose }) => {
  const [formData, setFormData] = useState({ 
    username: '', 
    password: '', 
    role: '', 
    full_name: '',
    email: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userIdPreview, setUserIdPreview] = useState('AIND/USRID/...');

  useEffect(() => {
    const fetchSeq = async () => {
      const { data } = await supabase.from('sequence_manager').select('*').eq('seq_name', 'USER_ID').single();
      if (data) setUserIdPreview(`${data.prefix || 'AIND/USRID/'}${String((data.current_val || 0) + 1).padStart(3, '0')}`);
    };
    fetchSeq();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { data: seqData } = await supabase.from('sequence_manager').select('*').eq('seq_name', 'USER_ID').single();
    let newSeqVal = 1; let prefix = 'AIND/USRID/';
    if (seqData) { newSeqVal = (seqData.current_val || 0) + 1; prefix = seqData.prefix || prefix; }
    const userId = `${prefix}${String(newSeqVal).padStart(3, '0')}`;
    try {
      const { error } = await supabase.from('users').insert([{ user_id: userId, ...formData }]);
      if (error) throw error;
      await supabase.from('sequence_manager').update({ current_val: newSeqVal }).eq('seq_name', 'USER_ID');
      alert("User added successfully!"); onClose();
    } catch (err) { console.error(err); alert("Failed to add user."); } finally { setIsSubmitting(false); }
  };

  const inputStyle = { width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem' };
  const labelStyle = { display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.75rem', color: '#475569' };
  const gridStyle3 = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>Add System User</h2>
        <form onSubmit={handleSubmit}>
          
          <div style={gridStyle3}>
            <div>
              <label style={labelStyle}>User ID:</label>
              <input type="text" style={{...inputStyle, backgroundColor: '#f1f5f9', color: '#64748b'}} value={userIdPreview} disabled />
            </div>
            <div>
              <label style={labelStyle}>Username:</label>
              <input type="text" style={inputStyle} required onChange={e => setFormData({...formData, username: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Password:</label>
              <input type="password" style={inputStyle} required onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
          </div>

          <div style={gridStyle3}>
            <div>
              <label style={labelStyle}>Full Name:</label>
              <input type="text" style={inputStyle} onChange={e => setFormData({...formData, full_name: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Role:</label>
              <select style={inputStyle} required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                 <option value="">Select...</option>
                 <option value="Admin">Admin</option>
                 <option value="Manager">Manager</option>
                 <option value="Staff">Staff</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Email:</label>
              <input type="email" style={inputStyle} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>

          <div style={gridStyle3}>
            <div>
              <label style={labelStyle}>Phone:</label>
              <input type="text" style={inputStyle} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div></div>
            <div></div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.75rem 2rem', background: 'white', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
            <button type="submit" disabled={isSubmitting} style={{ padding: '0.75rem 2rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>{isSubmitting ? 'Saving...' : 'Save User'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
