import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Trash2, Plus } from 'lucide-react';
import { logTransaction } from '../../utils/transactionLogger';

const CreatePurchaseForm = ({ onBack, onSuccess, editData }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [withoutGst, setWithoutGst] = useState(false);

  // Selection States
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [cart, setCart] = useState([]);

  // Item Entry State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);

  // Summary State
  const [discount, setDiscount] = useState(0);
  const [transport, setTransport] = useState(0);
  const [advance, setAdvance] = useState(0);
  const [payStatus, setPayStatus] = useState('Pending');
  const [payMethod, setPayMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [address, setAddress] = useState('');
  const [orderStatus, setOrderStatus] = useState('Received');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: suppData } = await supabase.from('suppliers').select('*');
    setSuppliers(suppData || []);

    const { data: prodData } = await supabase.from('products').select('*');
    setProducts(prodData || []);

    if (editData) {
      const supp = suppData?.find(s => s.supplier_id === editData.supplier_id);
      if (supp) setSelectedSupplier(supp);

      setCart(editData.purchase_items?.map(item => ({
        ...item,
        product_name: prodData?.find(p => p.product_id === item.product_id)?.product_name || item.product_id,
        tax_amount: (item.total_cost * ((item.cgst || 0) + (item.sgst || 0) + (item.igst || 0))) / 100
      })) || []);

      setDiscount(editData.discount || 0);
      setTransport(editData.transport || 0);
      setAdvance(editData.advance_amount || 0);
      setPayStatus(editData.payment_status || 'Pending');
      setPayMethod(editData.payment_method || 'Cash');
      setNotes(editData.notes || '');
      setPurchaseDate(editData.purchase_date?.split('T')[0] || new Date().toISOString().split('T')[0]);
      setDeliveryDate(editData.delivery_date?.split('T')[0] || '');
      setAddress(editData.supplier_address || '');
      setOrderStatus(editData.order_status || 'Received');
    }
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return alert('Select a product first.');
    if (qty <= 0) return alert('Quantity must be greater than 0.');

    const baseAmount = qty * price;

    // Tax logic based on product setup
    const cgstRate = selectedProduct.cgst || 0;
    const sgstRate = selectedProduct.sgst || 0;
    const igstRate = selectedProduct.igst || 0;

    const taxAmount = (baseAmount * (cgstRate + sgstRate + igstRate)) / 100;

    const item = {
      purchase_item_id: `PI${Date.now()}${Math.floor(Math.random() * 100)}`,
      product_id: selectedProduct.product_id,
      product_name: selectedProduct.product_name,
      quantity: qty,
      unit_cost: price,
      cgst: cgstRate,
      sgst: sgstRate,
      igst: igstRate,
      total_cost: baseAmount,
      tax_amount: taxAmount
    };

    setCart([...cart, item]);
    setSelectedProduct(null);
    setQty(1);
    setPrice(0);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.total_cost, 0);
  const cgstTotal = withoutGst ? 0 : cart.reduce((sum, item) => sum + (item.total_cost * (item.cgst || 0) / 100), 0);
  const sgstTotal = withoutGst ? 0 : cart.reduce((sum, item) => sum + (item.total_cost * (item.sgst || 0) / 100), 0);
  const igstTotal = withoutGst ? 0 : cart.reduce((sum, item) => sum + (item.total_cost * (item.igst || 0) / 100), 0);
  const taxTotal = cgstTotal + sgstTotal + igstTotal;
  const grandTotal = subtotal + taxTotal - Number(discount) + Number(transport);
  const dues = grandTotal - Number(advance);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSupplier) return alert('Please select a supplier.');
    if (cart.length === 0) return alert('Cart is empty.');

    setIsSubmitting(true);

    let purchaseId = '';
    let hasSeqData = false;
    if (editData) {
      purchaseId = editData.purchase_id;
    } else {
      const { data: seqData } = await supabase.from('sequence_manager').select('*').eq('seq_name', 'PURCHASE_ID').maybeSingle();
      if (seqData) hasSeqData = true;
      let newSeqVal = 1; let prefix = 'AIND/PUR/';
      if (seqData) { newSeqVal = (seqData.current_val || 0) + 1; prefix = seqData.prefix || prefix; }
      purchaseId = `${prefix}${String(newSeqVal).padStart(3, '0')}`;
    }

    const purchaseData = {
      purchase_id: purchaseId,
      supplier_id: selectedSupplier.supplier_id,
      purchase_date: purchaseDate,
      delivery_date: deliveryDate || null,
      total_amount: subtotal,
      discount: Number(discount),
      tax: taxTotal,
      transport: Number(transport),
      grand_total: grandTotal,
      advance_amount: Number(advance),
      payment_status: payStatus,
      payment_method: payMethod,
      order_status: orderStatus,
      notes
    };

    try {
      if (editData) {
        const { error: purError } = await supabase.from('purchases').update(purchaseData).eq('purchase_id', editData.purchase_id);
        if (purError) throw purError;

        // Revert old stock
        for (let oldItem of (editData.purchase_items || [])) {
          const { data: stockData } = await supabase.from('stock').select('*').eq('product_id', oldItem.product_id).maybeSingle();
          if (stockData) {
            await supabase.from('stock').update({ quantity: Math.max(0, stockData.quantity - oldItem.quantity) }).eq('product_id', oldItem.product_id);
          }
        }

        await supabase.from('purchase_items').delete().eq('purchase_id', editData.purchase_id);
      } else {
        const { error: purError } = await supabase.from('purchases').insert([purchaseData]);
        if (purError) throw purError;
      }

      const itemsData = cart.map(item => ({
        purchase_item_id: item.purchase_item_id,
        purchase_id: purchaseId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        cgst: withoutGst ? 0 : item.cgst,
        sgst: withoutGst ? 0 : item.sgst,
        igst: withoutGst ? 0 : item.igst,
        total_cost: item.total_cost
      }));

      const { error: itemsError } = await supabase.from('purchase_items').insert(itemsData);
      if (itemsError) throw itemsError;

      if (!editData) {
        const newSeqVal = Number(purchaseId.split('/').pop());
        if (hasSeqData) {
          await supabase.from('sequence_manager').update({ current_val: newSeqVal }).eq('seq_name', 'PURCHASE_ID');
        } else {
          await supabase.from('sequence_manager').insert([{ seq_name: 'PURCHASE_ID', current_val: newSeqVal, prefix: 'AIND/PUR/' }]);
        }
      }

      // Update supplier balance based on dues difference
      const oldDues = editData ? (editData.grand_total - editData.advance_amount) : 0;
      const duesDiff = dues - oldDues;

      if (duesDiff !== 0) {
        const newBalance = Number(selectedSupplier.supplier_balance || 0) + duesDiff;
        await supabase.from('suppliers').update({ supplier_balance: newBalance }).eq('supplier_id', selectedSupplier.supplier_id);
      }

      // Apply new stock
      for (let item of cart) {
        const { data: stockData } = await supabase.from('stock').select('*').eq('product_id', item.product_id).maybeSingle();
        if (stockData) {
          await supabase.from('stock').update({ quantity: stockData.quantity + item.quantity }).eq('product_id', item.product_id);
        } else {
          const { data: sSeq } = await supabase.from('sequence_manager').select('*').eq('seq_name', 'STOCK_ID').maybeSingle();
          let sVal = 1; if (sSeq) sVal = (sSeq.current_val || 0) + 1;
          await supabase.from('stock').insert([{ stock_id: `AIND/STK/${String(sVal).padStart(3, '0')}`, product_id: item.product_id, quantity: item.quantity, location: 'Main Warehouse', min_quantity: 0 }]);
          if (sSeq) {
             await supabase.from('sequence_manager').update({ current_val: sVal }).eq('seq_name', 'STOCK_ID');
          } else {
             await supabase.from('sequence_manager').insert([{ seq_name: 'STOCK_ID', current_val: sVal, prefix: 'AIND/STK/' }]);
          }
        }
      }

      // Log Transaction
      if (editData) {
        const extraPayment = Number(advance) - Number(editData.advance_amount || 0);
        if (extraPayment > 0) {
          await logTransaction('Expense', extraPayment, `Additional Payment - Purchase Order ${purchaseId} (${selectedSupplier.supp_comp_name})`, payMethod);
        }
      } else {
        if (Number(advance) > 0) {
          await logTransaction('Expense', Number(advance), `Payment - Purchase Order ${purchaseId} (${selectedSupplier.supp_comp_name})`, payMethod);
        }
      }

      alert(`Purchase Order ${editData ? 'updated' : 'created'} successfully!`);
      onSuccess();
    } catch (error) {
      console.error(error);
      alert(`Error ${editData ? 'updating' : 'creating'} purchase order.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = { width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px', marginBottom: '1rem' };
  const labelStyle = { display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' };

  return (
    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* LEFT COLUMN: Form */}
        <div>
          <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>1. Supplier Details</h3>
          <label style={labelStyle}>Select Supplier</label>
          <select
            style={inputStyle}
            onChange={(e) => {
              const supp = suppliers.find(s => s.supplier_id === e.target.value);
              setSelectedSupplier(supp);
              if (supp) setAddress(supp.supp_address || '');
            }}
            value={selectedSupplier?.supplier_id || ''}
            disabled={!!editData}
          >
            <option value="" disabled>Select a supplier...</option>
            {suppliers.map(s => (
              <option key={s.supplier_id} value={s.supplier_id}>{s.supp_comp_name} ({s.supp_comp_no})</option>
            ))}
          </select>

          {selectedSupplier && (
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '4px', marginBottom: '1rem' }}>
              <strong>{selectedSupplier.supp_comp_name}</strong><br />
              Phone: {selectedSupplier.supp_comp_no}<br />
              Balance: Rs {selectedSupplier.supplier_balance}
            </div>
          )}

          <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '2rem' }}>2. Order Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={labelStyle}>Order Status</label>
              <select style={inputStyle} value={orderStatus} onChange={e => setOrderStatus(e.target.value)}>
                <option>Pending</option>
                <option>Ordered</option>
                <option>Shipped</option>
                <option>Received</option>
                <option>Cancelled</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Purchase Date</label>
              <input type="date" style={inputStyle} value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Delivery Date</label>
              <input type="date" style={inputStyle} value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Address</label>
              <input type="text" style={{ ...inputStyle, marginBottom: 0 }} value={address} onChange={e => setAddress(e.target.value)} placeholder="Shipping / Billing Address..." />
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Notes / Remarks</label>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special instructions..."></textarea>
          </div>

          <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '2rem' }}>3. Add Products</h3>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>Product</label>
              <select
                style={inputStyle}
                value={selectedProduct?.product_id || ''}
                onChange={(e) => {
                  const p = products.find(prod => prod.product_id === e.target.value);
                  setSelectedProduct(p);
                  setPrice(p.purchase_rate || 0);
                }}
              >
                <option value="" disabled>Select...</option>
                {products.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Qty</label>
              <input type="number" style={inputStyle} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Cost</label>
              <input type="number" style={inputStyle} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            </div>
          </div>
          <button onClick={handleAddToCart} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Plus size={16} /> Add to Cart
          </button>
        </div>

        {/* RIGHT COLUMN: Cart & Summary */}
        <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px' }}>
          <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>4. Cart & Summary</h3>

          <div style={{ minHeight: '150px', marginBottom: '1rem' }}>
            {cart.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', marginTop: '3rem' }}>Cart is empty</p>
            ) : (
              <table style={{ width: '100%', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ paddingBottom: '0.5rem' }}>Item</th>
                    <th style={{ paddingBottom: '0.5rem' }}>Qty</th>
                    <th style={{ paddingBottom: '0.5rem' }}>Total</th>
                    <th style={{ paddingBottom: '0.5rem' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.5rem 0' }}>{item.product_name}</td>
                      <td>{item.quantity}</td>
                      <td>{item.total_cost.toFixed(2)}</td>
                      <td>
                        <button onClick={() => removeFromCart(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ borderTop: '2px solid #cbd5e1', paddingTop: '1rem' }}>
            <div style={{ backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#64748b' }}>
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>

              {cgstTotal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#64748b', fontSize: '0.875rem' }}>
                  <span>+ CGST</span>
                  <span>₹{cgstTotal.toFixed(2)}</span>
                </div>
              )}
              {sgstTotal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#64748b', fontSize: '0.875rem' }}>
                  <span>+ SGST</span>
                  <span>₹{sgstTotal.toFixed(2)}</span>
                </div>
              )}
              {igstTotal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#64748b', fontSize: '0.875rem' }}>
                  <span>+ IGST</span>
                  <span>₹{igstTotal.toFixed(2)}</span>
                </div>
              )}
              {taxTotal === 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#64748b' }}>
                  <span>+ Tax Total</span>
                  <span>₹0.00</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', marginBottom: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: '#64748b' }}>- Discount (₹)</label>
                  <input type="number" style={{ ...inputStyle, padding: '0.5rem', marginBottom: 0, backgroundColor: 'white' }} value={discount} onChange={e => setDiscount(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: '#64748b' }}>+ Transport (₹)</label>
                  <input type="number" style={{ ...inputStyle, padding: '0.5rem', marginBottom: 0, backgroundColor: 'white' }} value={transport} onChange={e => setTransport(e.target.value)} />
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #cbd5e1', marginTop: '1rem', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', color: '#0f172a', fontWeight: 'bold' }}>
                <span>= Grand Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', backgroundColor: '#f1f5f9', padding: '0.75rem', borderRadius: '8px' }}>
              <input type="checkbox" id="noGstPur" checked={withoutGst} onChange={(e) => setWithoutGst(e.target.checked)} style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }} />
              <label htmlFor="noGstPur" style={{ cursor: 'pointer', fontWeight: '500', color: '#0f172a' }}>Without GST (Apply 0% Tax)</label>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem' }}>Advance Paid</label>
                <input type="number" style={{ ...inputStyle, padding: '0.5rem', marginBottom: 0 }} value={advance} onChange={e => setAdvance(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', color: '#ef4444' }}>Balance Due</label>
                <div style={{ padding: '0.5rem', fontWeight: 'bold', color: '#ef4444' }}>Rs {dues.toFixed(2)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <select style={{ ...inputStyle, flex: 1, padding: '0.5rem' }} value={payStatus} onChange={e => setPayStatus(e.target.value)}>
                <option>Pending</option><option>Paid</option><option>Partial</option>
              </select>
              <select style={{ ...inputStyle, flex: 1, padding: '0.5rem' }} value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                <option>Cash</option><option>UPI</option><option>Card</option><option>Bank Transfer</option>
              </select>
            </div>

            <button onClick={handleSubmit} disabled={isSubmitting} style={{ width: '100%', padding: '1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer', marginTop: '1rem', fontSize: '1.1rem' }}>
              {isSubmitting ? 'Saving...' : (editData ? 'Update PO & Save' : 'Generate PO & Save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePurchaseForm;
