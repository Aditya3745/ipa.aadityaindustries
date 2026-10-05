import React, { useState, useEffect } from 'react';
import ModalWrapper from '../../ModalWrapper';
import { inputStyle, labelStyle, gridStyle3 } from '../../../styles/formStyles';
import FormActions from '../../FormActions';

export const RateCalculatorModal = ({ onClose, onApply, initialBasePrice = 0 }) => {
  const [basePrice, setBasePrice] = useState(initialBasePrice);
  const [transportCost, setTransportCost] = useState('');
  const [labourCost, setLabourCost] = useState('');
  const [marginPerc, setMarginPerc] = useState('');
  const [taxPerc, setTaxPerc] = useState('');

  const [finalRate, setFinalRate] = useState(0);

  useEffect(() => {
    const base = Number(basePrice) || 0;
    const transport = Number(transportCost) || 0;
    const labour = Number(labourCost) || 0;
    
    let current = base + transport + labour;
    
    if (Number(marginPerc) > 0) {
      current = current + (current * (Number(marginPerc) / 100));
    }
    if (Number(taxPerc) > 0) {
      current = current + (current * (Number(taxPerc) / 100));
    }

    // Round to 2 decimal places
    setFinalRate(Math.round(current * 100) / 100);
  }, [basePrice, transportCost, labourCost, marginPerc, taxPerc]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onApply(finalRate);
  };

  return (
    <ModalWrapper title="Rate Calculator" onClose={onClose} maxWidth="450px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>Base Price (₹) *</label>
          <input type="number" step="0.01" min={0} required style={inputStyle} value={basePrice} onChange={e => setBasePrice(e.target.value)} />
        </div>
        
        <div style={gridStyle3}>
          <div>
            <label style={labelStyle}>Transport (₹)</label>
            <input type="number" step="0.01" min={0} style={inputStyle} value={transportCost} onChange={e => setTransportCost(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Labour (₹)</label>
            <input type="number" step="0.01" min={0} style={inputStyle} value={labourCost} onChange={e => setLabourCost(e.target.value)} />
          </div>
        </div>

        <div style={gridStyle3}>
          <div>
            <label style={labelStyle}>Margin (%)</label>
            <input type="number" step="0.01" min={0} style={inputStyle} value={marginPerc} onChange={e => setMarginPerc(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Tax (%)</label>
            <input type="number" step="0.01" min={0} style={inputStyle} value={taxPerc} onChange={e => setTaxPerc(e.target.value)} />
          </div>
        </div>

        <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: '8px', border: '1px solid #6ee7b7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#065f46' }}>Final Rate:</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>₹{finalRate.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
        </div>

        <FormActions onClose={onClose} label="Apply Rate" />
      </form>
    </ModalWrapper>
  );
};

export default RateCalculatorModal;
