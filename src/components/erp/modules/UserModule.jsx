import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { Plus, ShieldCheck } from 'lucide-react';
import DataCard from '../../DataCard';
import ModalWrapper from '../../ModalWrapper';
import FormActions from '../../FormActions';
import { generateId, peekNextId } from '../../../utils/sequenceManager';
import { cardStyle, inputStyle, labelStyle, gridStyle3 } from '../../../styles/formStyles';
import toast from 'react-hot-toast';

export const UserModule = ({ users = [], setModalConfig }) => {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>System Users</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setModalConfig({ isOpen: true, type: 'user' })}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <Plus size={16} /> Add User
          </button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {users.map((u, idx) => (
          <DataCard
            key={u.user_id || idx}
            index={idx}
            icon={ShieldCheck}
            iconColor="#f59e0b"
            title={u.username}
            subtitle={u.user_id}
            status={u.role}
            details={[
              { label: 'Full Name', value: u.full_name || '—' },
              { label: 'Email', value: u.email || '—' },
              { label: 'Phone', value: u.phone || '—' }
            ]}
          />
        ))}
      </div>
      {users.length === 0 && <p style={{ padding: '1rem', color: '#64748b' }}>No users found.</p>}
    </div>
  );
};

export const UserModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ 
    username: '', 
    password: '', 
    role: 'Staff', 
    full_name: '',
    email: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userIdPreview, setUserIdPreview] = useState('AIND/USR/...');

  useEffect(() => {
    peekNextId('USER_ID', 'AIND/USR/').then(setUserIdPreview);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const userId = await generateId('USER_ID', 'AIND/USR/');
      const { error } = await supabase.from('users').insert([{ user_id: userId, ...formData }]);
      if (error) throw error;

      toast.success("User added successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add user: " + (err.message || ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper title="Add System User" onClose={onClose} maxWidth="750px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={gridStyle3}>
          <div>
            <label style={labelStyle}>User ID (Auto):</label>
            <input type="text" style={{ ...inputStyle, backgroundColor: '#f8fafc', color: '#64748b' }} value={userIdPreview} disabled />
          </div>
          <div>
            <label style={labelStyle}>Username *:</label>
            <input
              type="text"
              style={inputStyle}
              required
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Password *:</label>
            <input
              type="password"
              style={inputStyle}
              required
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
        </div>

        <div style={gridStyle3}>
          <div>
            <label style={labelStyle}>Full Name:</label>
            <input
              type="text"
              style={inputStyle}
              value={formData.full_name}
              onChange={e => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Role *:</label>
            <select
              style={inputStyle}
              required
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Staff">Staff</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Email:</label>
            <input
              type="email"
              style={inputStyle}
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        <div style={gridStyle3}>
          <div>
            <label style={labelStyle}>Phone:</label>
            <input
              type="text"
              style={inputStyle}
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>

        <FormActions onClose={onClose} isSubmitting={isSubmitting} label="Save User" />
      </form>
    </ModalWrapper>
  );
};

export default UserModule;
