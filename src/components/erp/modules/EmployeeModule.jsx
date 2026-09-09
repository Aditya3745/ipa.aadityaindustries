import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { Plus, UserSquare2, Banknote } from 'lucide-react';
import DataCard from '../../DataCard';
import ModalWrapper from '../../ModalWrapper';
import FormActions from '../../FormActions';
import PaymentDialog from '../../PaymentDialog';
import { generateId, peekNextId } from '../../../utils/sequenceManager';
import { logTransaction } from '../../../utils/transactionLogger';
import { cardStyle, inputStyle, labelStyle, gridStyle3 } from '../../../styles/formStyles';
import toast from 'react-hot-toast';

export const EmployeeModule = ({ employees = [], setModalConfig, onRefresh }) => {
  const [selectedEmpForSalary, setSelectedEmpForSalary] = useState(null);
  const [isPayingSalary, setIsPayingSalary] = useState(false);

  const handlePaySalaryConfirm = async ({ amount, paymentMethod, paymentDate }) => {
    if (!selectedEmpForSalary) return;
    setIsPayingSalary(true);
    try {
      const emp = selectedEmpForSalary;
      const desc = `Salary Payment - ${emp.employee_name || emp.employees_name}`;
      
      const success = await logTransaction(
        'Expense',
        amount,
        desc,
        paymentMethod,
        emp.employee_id,
        'employees',
        paymentDate
      );

      if (success) {
        const newBalance = Number(emp.employees_balance || 0) - amount;
        await supabase
          .from('employees')
          .update({ employees_balance: newBalance })
          .eq('employee_id', emp.employee_id);

        toast.success(`Salary payment of ₹${amount} recorded for ${emp.employee_name || emp.employees_name}!`);
        setSelectedEmpForSalary(null);
        if (onRefresh) onRefresh();
      } else {
        toast.error("Failed to log salary transaction.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Salary payment failed: " + (err.message || ''));
    } finally {
      setIsPayingSalary(false);
    }
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Employee Directory</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setModalConfig({ isOpen: true, type: 'employee' })}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {employees.map((e, idx) => (
          <DataCard
            key={e.employee_id || idx}
            index={idx}
            icon={UserSquare2}
            iconColor="#8b5cf6"
            title={e.employee_name || e.employees_name}
            subtitle={e.employee_id}
            onEdit={() => setModalConfig({ isOpen: true, type: 'employee', editData: e })}
            action={
              <button 
                onClick={() => setSelectedEmpForSalary(e)} 
                style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 8px', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', fontWeight: 600 }}>
                 <Banknote size={12}/> Pay Salary
              </button>
            }
            details={[
              { label: 'Designation', value: e.role || '—' },
              { label: 'Phone', value: e.phone_no || e.phone || '—' },
              { label: 'Base Salary', value: `₹${Number(e.salary || 0).toFixed(2)}` },
              { label: 'Balance', value: `₹${Number(e.employees_balance || 0).toFixed(2)}`, color: e.employees_balance > 0 ? '#ef4444' : '#10b981' }
            ]}
          />
        ))}
      </div>
      {employees.length === 0 && <p style={{ padding: '1rem', color: '#64748b' }}>No employees found.</p>}

      {/* Modern Salary Payment Dialog */}
      {selectedEmpForSalary && (
        <PaymentDialog
          isOpen={!!selectedEmpForSalary}
          onClose={() => setSelectedEmpForSalary(null)}
          title={`Pay Salary — ${selectedEmpForSalary.employee_name || selectedEmpForSalary.employees_name}`}
          invoiceId={selectedEmpForSalary.employee_id}
          partyName={selectedEmpForSalary.employee_name || selectedEmpForSalary.employees_name}
          dueAmount={Number(selectedEmpForSalary.employees_balance || selectedEmpForSalary.salary || 0)}
          onConfirm={handlePaySalaryConfirm}
          isLoading={isPayingSalary}
        />
      )}
    </div>
  );
};

export const EmployeeModal = ({ onClose, editData, onSuccess }) => {
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

  useEffect(() => {
    if (editData) {
      setEmployeeIdPreview(editData.employee_id);
    } else {
      peekNextId('EMP_ID', 'AIND/EMP/').then(setEmployeeIdPreview);
    }
  }, [editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const employeeData = { ...formData };
    delete employeeData.department; // Not in DB schema
    if (!employeeData.hire_date) delete employeeData.hire_date;

    try {
      if (editData) {
        const { error } = await supabase.from('employees').update(employeeData).eq('employee_id', editData.employee_id);
        if (error) throw error;
        toast.success("Employee updated successfully!");
      } else {
        const employeeId = await generateId('EMP_ID', 'AIND/EMP/');
        employeeData.employee_id = employeeId;
        
        const { error } = await supabase.from('employees').insert([employeeData]);
        if (error) throw error;
        toast.success("Employee added successfully!");
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) { 
      console.error(err); 
      toast.error(`Failed to ${editData ? 'update' : 'add'} employee: ` + (err.message || '')); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <ModalWrapper title={editData ? 'Edit Employee' : 'Add Employee'} onClose={onClose} maxWidth="850px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={gridStyle3}>
          <div>
            <label style={labelStyle}>Employee ID (Auto):</label>
            <input type="text" style={{ ...inputStyle, backgroundColor: '#f8fafc', color: '#64748b' }} value={employeeIdPreview} disabled />
          </div>
          <div>
            <label style={labelStyle}>Employee Name *:</label>
            <input
              type="text"
              style={inputStyle}
              required
              value={formData.employees_name || formData.employee_name || ''}
              onChange={e => setFormData({ ...formData, employees_name: e.target.value, employee_name: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Phone No *:</label>
            <input
              type="text"
              style={inputStyle}
              required
              value={formData.phone || formData.phone_no || ''}
              onChange={e => setFormData({ ...formData, phone: e.target.value, phone_no: e.target.value })}
            />
          </div>
        </div>

        <div style={gridStyle3}>
          <div>
            <label style={labelStyle}>Email ID:</label>
            <input
              type="email"
              style={inputStyle}
              value={formData.email || ''}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Designation (Role):</label>
            <input
              type="text"
              style={inputStyle}
              value={formData.role || ''}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Hire Date:</label>
            <input
              type="date"
              style={inputStyle}
              value={formData.hire_date || ''}
              onChange={e => setFormData({ ...formData, hire_date: e.target.value })}
            />
          </div>
        </div>
        
        <div style={gridStyle3}>
          <div>
            <label style={labelStyle}>Aadhar Card No:</label>
            <input
              type="text"
              style={inputStyle}
              value={formData.aadhar_card || ''}
              onChange={e => setFormData({ ...formData, aadhar_card: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>PAN Card No:</label>
            <input
              type="text"
              style={inputStyle}
              value={formData.pan_no || ''}
              onChange={e => setFormData({ ...formData, pan_no: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Monthly Base Salary (₹):</label>
            <input
              type="number"
              step="0.01"
              style={inputStyle}
              value={formData.salary || 0}
              onChange={e => setFormData({ ...formData, salary: Number(e.target.value) })}
            />
          </div>
        </div>

        <div style={gridStyle3}>
          <div>
            <label style={labelStyle}>Opening / Outstanding Balance (₹):</label>
            <input
              type="number"
              step="0.01"
              style={inputStyle}
              value={formData.employees_balance || 0}
              onChange={e => setFormData({ ...formData, employees_balance: Number(e.target.value) })}
            />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Residential Address:</label>
            <input
              type="text"
              style={inputStyle}
              value={formData.address || ''}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </div>

        <FormActions
          onClose={onClose}
          isSubmitting={isSubmitting}
          label={editData ? 'Update Employee' : 'Save Employee'}
        />
      </form>
    </ModalWrapper>
  );
};

export default EmployeeModule;
