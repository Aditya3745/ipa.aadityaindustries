import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { Plus, UserSquare2, Banknote } from 'lucide-react';
import DataCard from '../../DataCard';
import { logTransaction } from '../../../utils/transactionLogger';

const cardStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' };

export const EmployeeModule = ({ employees, setModalConfig }) => {
  const handlePaySalary = async (employee) => {
    const defaultAmount = employee.salary || employee.employees_balance || 0;
    const amountStr = window.prompt(`Enter salary amount to pay to ${employee.employee_name}:`, defaultAmount);
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) return alert("Invalid amount.");

    const success = await logTransaction('Expense', amount, `Salary Payment - ${employee.employee_name}`, 'Cash');
    if (success) {
       const newBalance = Number(employee.employees_balance || 0) - amount;
       await supabase.from('employees').update({ employees_balance: newBalance }).eq('employee_id', employee.employee_id);
       alert("Salary payment recorded successfully!");
    }
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Employee Directory</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setModalConfig({ isOpen: true, type: 'employee' })} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}><Plus size={16} /> Add</button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {employees.map((e, idx) => (
          <DataCard
            key={e.employee_id}
            index={idx}
            icon={UserSquare2}
            iconColor="#8b5cf6"
            title={e.employee_name}
            subtitle={e.employee_id}
            onEdit={() => setModalConfig({ isOpen: true, type: 'employee', editData: e })}
            action={
              <button 
                onClick={() => handlePaySalary(e)} 
                style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 8px', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem' }}>
                 <Banknote size={12}/> Pay Salary
              </button>
            }
            details={[
              { label: 'Phone', value: e.phone_no },
              { label: 'Email', value: e.email },
              { label: 'Balance', value: `Rs ${Number(e.employees_balance || 0).toFixed(2)}`, color: e.employees_balance > 0 ? '#ef4444' : '#10b981' }
            ]}
          />
        ))}
      </div>
      {employees.length === 0 && <p style={{ padding: '1rem', color: '#64748b' }}>No employees found.</p>}
    </div>
  );
};

export const EmployeeModal = ({ onClose, editData }) => {
  const [formData, setFormData] = useState(editData || { 
    employees_name: '', 
    phone: '', 
    email: '', 
    role: '', 
    department: '',
    salary: 0,
    employees_balance: 0,
    address: '',
    hire_date: '',
    aadhar_card: '',
    pan_no: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeIdPreview, setEmployeeIdPreview] = useState('AIND/EMP/...');

  React.useEffect(() => {
    if (editData) {
      setEmployeeIdPreview(editData.employee_id);
    } else {
      const fetchSeq = async () => {
        const { data } = await supabase.from('sequence_manager').select('*').eq('seq_name', 'EMP_ID').single();
        if (data) {
          setEmployeeIdPreview(`${data.prefix || 'AIND/EMP/'}${String((data.current_val || 0) + 1).padStart(3, '0')}`);
        }
      };
      fetchSeq();
    }
  }, [editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const employeeData = { ...formData };
    delete employeeData.department; // Not in DB schema
    if (!employeeData.hire_date) delete employeeData.hire_date; // Prevent empty string date errors

    try {
      if (editData) {
        const { error } = await supabase.from('employees').update(employeeData).eq('employee_id', editData.employee_id);
        if (error) throw error;
        alert("Employee updated successfully!");
      } else {
        const { data: seqData } = await supabase.from('sequence_manager').select('*').eq('seq_name', 'EMP_ID').single();
        let newSeqVal = 1; let prefix = 'AIND/EMP/';
        if (seqData) { newSeqVal = (seqData.current_val || 0) + 1; prefix = seqData.prefix || prefix; }
        const employeeId = `${prefix}${String(newSeqVal).padStart(3, '0')}`;
        
        employeeData.employee_id = employeeId;
        
        const { error } = await supabase.from('employees').insert([employeeData]);
        if (error) throw error;
        await supabase.from('sequence_manager').update({ current_val: newSeqVal }).eq('seq_name', 'EMP_ID');
        alert("Employee added successfully!");
      }
      onClose();
    } catch (err) { 
       console.error(err); 
       alert(`Failed to ${editData ? 'update' : 'add'} employee: ` + (err.message || JSON.stringify(err))); 
    } finally { setIsSubmitting(false); }
  };

  const inputStyle = { width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem' };
  const labelStyle = { display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.75rem', color: '#475569' };
  const gridStyle3 = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>{editData ? 'Edit Employee' : 'Add Employee'}</h2>
        <form onSubmit={handleSubmit}>
          
          <div style={gridStyle3}>
            <div>
              <label style={labelStyle}>Employee ID:</label>
              <input type="text" style={{...inputStyle, backgroundColor: '#f1f5f9', color: '#64748b'}} value={employeeIdPreview} disabled />
            </div>
            <div>
              <label style={labelStyle}>Employee Name:</label>
              <input type="text" style={inputStyle} required value={formData.employees_name} onChange={e => setFormData({...formData, employees_name: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Phone No:</label>
              <input type="text" style={inputStyle} required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
          </div>

          <div style={gridStyle3}>
            <div>
              <label style={labelStyle}>Email ID:</label>
              <input type="email" style={inputStyle} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Designation (Role):</label>
              <input type="text" style={inputStyle} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Department:</label>
              <input type="text" style={inputStyle} value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
            </div>
          </div>
          
          <div style={gridStyle3}>
            <div>
              <label style={labelStyle}>Aadhar Card:</label>
              <input type="text" style={inputStyle} value={formData.aadhar_card} onChange={e => setFormData({...formData, aadhar_card: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>PAN No:</label>
              <input type="text" style={inputStyle} value={formData.pan_no} onChange={e => setFormData({...formData, pan_no: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Hire Date:</label>
              <input type="date" style={inputStyle} value={formData.hire_date} onChange={e => setFormData({...formData, hire_date: e.target.value})} />
            </div>
          </div>

          <div style={gridStyle3}>
            <div>
              <label style={labelStyle}>Address:</label>
              <input type="text" style={inputStyle} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Base Salary:</label>
              <input type="number" step="0.01" style={inputStyle} value={formData.salary} onChange={e => setFormData({...formData, salary: Number(e.target.value)})} />
            </div>
            <div>
              <label style={labelStyle}>Opening Balance:</label>
              <input type="number" step="0.01" style={inputStyle} value={formData.employees_balance} onChange={e => setFormData({...formData, employees_balance: Number(e.target.value)})} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.75rem 2rem', background: 'white', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
            <button type="submit" disabled={isSubmitting} style={{ padding: '0.75rem 2rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>{isSubmitting ? 'Saving...' : (editData ? 'Update Employee' : 'Save Employee')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
