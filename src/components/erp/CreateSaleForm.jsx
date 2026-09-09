import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Trash2, Plus, ArrowLeft } from 'lucide-react';
import { logTransaction } from '../../utils/transactionLogger';
import { generateIndividualInvoicePDF } from '../../utils/pdfGenerator';
import { generateId } from '../../utils/sequenceManager';
import toast from 'react-hot-toast';

const CreateSaleForm = ({ onBack, onSuccess, editData }) => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  // Selection States
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isManualCustomer, setIsManualCustomer] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualGst, setManualGst] = useState('');
  const [withoutGst, setWithoutGst] = useState(false);
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
  const [invoiceNo, setInvoiceNo] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [address, setAddress] = useState('');
  const [orderStatus, setOrderStatus] = useState('Delivered');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: custData } = await supabase.from('customers').select('*');
    setCustomers(custData || []);

    const { data: prodData } = await supabase.from('products').select('*');
    setProducts(prodData || []);

    if (editData) {
      const cust = custData?.find(c => c.cust_comp_name === editData.customer_name);
      if (cust) setSelectedCustomer(cust);

      setCart(editData.sale_items?.map(item => ({
        ...item,
        product_name: prodData?.find(p => p.product_id === item.product_id)?.product_name || item.product_id,
        tax_amount: (item.total_price * ((item.cgst || 0) + (item.sgst || 0) + (item.igst || 0))) / 100
      })) || []);

      setDiscount(editData.discount || 0);
      setTransport(editData.transport || 0);
      setAdvance(editData.advance_amount || 0);
      setPayStatus(editData.payment_status || 'Pending');
      setPayMethod(editData.payment_method || 'Cash');
      setNotes(editData.notes || '');
      setInvoiceNo(editData.invoice_no || '');
      setSaleDate(editData.sale_date?.split('T')[0] || new Date().toISOString().split('T')[0]);
      setDeliveryDate(editData.delivery_date?.split('T')[0] || '');
      setAddress(editData.customer_address || '');
      setOrderStatus(editData.order_status || 'Delivered');
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

    // We generate a frontend UUID-like ID for the sale_item_id or just use Date.now() for simplicity
    const item = {
      sale_item_id: `SI${Date.now()}${Math.floor(Math.random() * 100)}`,
      product_id: selectedProduct.product_id,
      product_name: selectedProduct.product_name, // Store for UI only, won't insert to DB if it doesn't exist
      quantity: qty,
      unit_price: price,
      cgst: cgstRate,
      sgst: sgstRate,
      igst: igstRate,
      total_price: baseAmount,
      tax_amount: taxAmount // For UI only
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
  const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
  const cgstTotal = withoutGst ? 0 : cart.reduce((sum, item) => sum + (item.total_price * (item.cgst || 0) / 100), 0);
  const sgstTotal = withoutGst ? 0 : cart.reduce((sum, item) => sum + (item.total_price * (item.sgst || 0) / 100), 0);
  const igstTotal = withoutGst ? 0 : cart.reduce((sum, item) => sum + (item.total_price * (item.igst || 0) / 100), 0);
  const taxTotal = cgstTotal + sgstTotal + igstTotal;
  const grandTotal = subtotal + taxTotal - Number(discount) + Number(transport);
  const currentAmountPaid = editData 
    ? (Number(editData.amount_paid || 0) + (Number(advance) - Number(editData.advance_amount || 0)))
    : Number(advance);
  const dues = grandTotal - currentAmountPaid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return alert('Please select a customer.');
    if (cart.length === 0) return alert('Cart is empty.');

    setIsSubmitting(true);

    // Generate Sequence ID
    let saleId = '';
    if (editData) {
      saleId = editData.sale_id;
    } else {
      saleId = await generateId('SALE_ID', 'AIND/SALE/');
    }

    const saleData = {
      sale_id: saleId,
      invoice_no: invoiceNo || saleId,
      customer_id: isManualCustomer ? null : selectedCustomer.customer_id,
      customer_name: isManualCustomer ? manualName : selectedCustomer.cust_comp_name,
      customer_phone: isManualCustomer ? '' : selectedCustomer.cust_comp_person_no,
      customer_email: isManualCustomer ? '' : selectedCustomer.cust_email,
      customer_gstno: isManualCustomer ? manualGst : (selectedCustomer.cust_gst_no || ''),
      customer_address: address,
      sale_date: saleDate,
      delivery_date: deliveryDate || null,
      total_amount: subtotal,
      discount: Number(discount),
      cgst: cgstTotal,
      sgst: sgstTotal,
      igst: igstTotal,
      transport: Number(transport),
      grand_total: grandTotal,
      advance_amount: Number(advance),
      payment_status: payStatus,
      payment_method: payMethod,
      order_status: orderStatus,
      amount_paid: currentAmountPaid,
      notes
    };

    try {
      if (editData) {
        const { error: saleError } = await supabase.from('sales').update(saleData).eq('sale_id', editData.sale_id);
        if (saleError) throw saleError;

        // Revert old stock
        for (let oldItem of (editData.sale_items || [])) {
          const { data: stockData } = await supabase.from('stock').select('*').eq('product_id', oldItem.product_id).maybeSingle();
          if (stockData) {
            await supabase.from('stock').update({ quantity: stockData.quantity + oldItem.quantity }).eq('product_id', oldItem.product_id);
          }
        }

        // Delete old items and insert new
        await supabase.from('sale_items').delete().eq('sale_id', editData.sale_id);
      } else {
        const { error: saleError } = await supabase.from('sales').insert([saleData]);
        if (saleError) throw saleError;
      }

      const itemsToInsert = cart.map(item => ({
        sale_item_id: item.sale_item_id,
        sale_id: saleId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        cgst: withoutGst ? 0 : item.cgst,
        sgst: withoutGst ? 0 : item.sgst,
        igst: withoutGst ? 0 : item.igst,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;



      // Update customer balance based on dues difference
      const oldDues = editData ? (editData.grand_total - (editData.amount_paid || editData.advance_amount || 0)) : 0;
      
      if (editData && (editData.customer_id !== selectedCustomer.customer_id && editData.customer_name !== selectedCustomer.cust_comp_name)) {
        // Fetch old customer and revert their dues
        let oldCustomerQuery = supabase.from('customers').select('customer_balance');
        if (editData.customer_id) {
          oldCustomerQuery = oldCustomerQuery.eq('customer_id', editData.customer_id);
        } else {
          oldCustomerQuery = oldCustomerQuery.eq('cust_comp_name', editData.customer_name);
        }
        const { data: oldCustomer } = await oldCustomerQuery.maybeSingle();
        if (oldCustomer) {
          const oldNewBalance = Number(oldCustomer.customer_balance || 0) - oldDues;
          if (editData.customer_id) {
            await supabase.from('customers').update({ customer_balance: oldNewBalance }).eq('customer_id', editData.customer_id);
          } else {
            await supabase.from('customers').update({ customer_balance: oldNewBalance }).eq('cust_comp_name', editData.customer_name);
          }
        }
        // Add new dues completely to the new customer
        const newBalance = Number(selectedCustomer.customer_balance || 0) + dues;
        await supabase.from('customers').update({ customer_balance: newBalance }).eq('customer_id', selectedCustomer.customer_id);
      } else {
        const duesDiff = dues - oldDues;
        if (duesDiff !== 0) {
          const newBalance = Number(selectedCustomer.customer_balance || 0) + duesDiff;
          await supabase.from('customers').update({ customer_balance: newBalance }).eq('customer_id', selectedCustomer.customer_id);
        }
      }

      // Apply new stock (decrease stock for sales)
      for (let item of cart) {
        const { data: stockData } = await supabase.from('stock').select('*').eq('product_id', item.product_id).maybeSingle();
        if (stockData) {
          await supabase.from('stock').update({ quantity: stockData.quantity - item.quantity }).eq('product_id', item.product_id);
        } else {
          const newStockId = await generateId('STOCK_ID', 'AIND/STK/');
          await supabase.from('stock').insert([{ stock_id: newStockId, product_id: item.product_id, quantity: 0, location: 'Main Warehouse', min_quantity: 0 }]);
        }
      }

      // Log Transaction with reference tracking
      const partyName = isManualCustomer ? manualName : (selectedCustomer?.cust_comp_name || '');
      if (editData) {
        const extraPayment = Number(advance) - Number(editData.advance_amount || 0);
        if (extraPayment > 0) {
          await logTransaction('Income', extraPayment, `Additional Payment - Sale Invoice ${saleId} (${partyName})`, payMethod, saleId, 'sales', saleDate, dues);
        } else if (extraPayment < 0) {
          await logTransaction('Expense', Math.abs(extraPayment), `Refund - Sale Invoice ${saleId} (${partyName})`, payMethod, saleId, 'sales', saleDate, dues);
        }
      } else {
        if (Number(advance) > 0) {
          await logTransaction('Income', Number(advance), `Advance Payment - Sale Invoice ${saleId} (${partyName})`, payMethod, saleId, 'sales', saleDate, dues);
        }
      }

      toast.success(`Sale ${editData ? 'updated' : 'created'} successfully!`);
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error(`Error ${editData ? 'updating' : 'creating'} sale.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateQuotation = () => {
    if (!selectedCustomer) return alert("Please select a customer for the quotation.");
    if (cart.length === 0) return alert("Cart is empty.");

    const subtotal = cart.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);
    const taxTotal = cart.reduce((sum, item) => sum + (Number(item.tax_amount) || 0), 0);
    const grandTotal = subtotal + taxTotal - Number(discount || 0) + Number(transport || 0);

    const quoteData = {
      id: `QT-${Date.now().toString().slice(-6)}`,
      customer_name: isManualCustomer ? manualName : selectedCustomer.cust_comp_name,
      customer_phone: selectedCustomer?.cust_comp_person_no || '',
      customer_email: selectedCustomer?.cust_email || '',
      customer_address: address,
      customer_gst_no: isManualCustomer ? manualGst : selectedCustomer.cust_gst_no,
      sale_date: saleDate,
      delivery_date: deliveryDate,
      total_amount: subtotal,
      discount: discount,
      tax: taxTotal,
      transport: transport,
      grand_total: grandTotal,
      notes: notes
    };

    generateIndividualInvoicePDF('sale', quoteData, cart, true);
  };

  const inputStyle = { width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px', marginBottom: '1rem' };
  const labelStyle = { display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' };

  return (
    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* LEFT COLUMN: Form */}
        <div>
          <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>1. Customer Details</h3>
          <label style={labelStyle}>Select Customer</label>
          <select
            style={inputStyle}
            onChange={(e) => {
              if (e.target.value === 'MANUAL') {
                setIsManualCustomer(true);
                setSelectedCustomer({ customer_id: 'MANUAL', cust_comp_name: 'Manual' });
                setAddress('');
              } else {
                setIsManualCustomer(false);
                const cust = customers.find(c => c.customer_id === e.target.value);
                setSelectedCustomer(cust);
                if (cust) setAddress(cust.cust_address || '');
              }
            }}
            value={selectedCustomer?.customer_id || ''}
            disabled={!!editData}
          >
            <option value="" disabled>Select a customer...</option>
            <option value="MANUAL">-- Manual Type --</option>
            {customers.map(c => (
              <option key={c.customer_id} value={c.customer_id}>{c.cust_comp_name} ({c.cust_comp_person_no})</option>
            ))}
          </select>

          {isManualCustomer && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle}>Customer Name</label>
                <input type="text" style={inputStyle} value={manualName} onChange={e => setManualName(e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>GST No</label>
                <input type="text" style={inputStyle} value={manualGst} onChange={e => setManualGst(e.target.value)} />
              </div>
            </div>
          )}

          {selectedCustomer && !isManualCustomer && (
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '4px', marginBottom: '1rem' }}>
              <strong>{selectedCustomer.cust_comp_name}</strong><br />
              Phone: {selectedCustomer.cust_comp_person_no}<br />
              Balance: Rs {selectedCustomer.customer_balance}
            </div>
          )}

          <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '2rem' }}>2. Order Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={labelStyle}>Invoice No (Optional)</label>
              <input type="text" style={inputStyle} value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} placeholder="Auto-generated if empty" />
            </div>
            <div>
              <label style={labelStyle}>Order Status</label>
              <select style={inputStyle} value={orderStatus} onChange={e => setOrderStatus(e.target.value)}>
                <option>Pending</option>
                <option>Processing</option>
                <option>Shipped</option>
                <option>Delivered</option>
                <option>Cancelled</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Sale Date</label>
              <input type="date" style={inputStyle} value={saleDate} onChange={e => setSaleDate(e.target.value)} />
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
                  setPrice(p.selling_rate || 0);
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
              <label style={labelStyle}>Price</label>
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
                      <td>{item.total_price.toFixed(2)}</td>
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
              <input type="checkbox" id="noGstSale" checked={withoutGst} onChange={(e) => setWithoutGst(e.target.checked)} style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }} />
              <label htmlFor="noGstSale" style={{ cursor: 'pointer', fontWeight: '500', color: '#0f172a' }}>Without GST (Apply 0% Tax)</label>
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

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button onClick={handleSubmit} disabled={isSubmitting} style={{ flex: 2, padding: '1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '1.1rem' }}>
                {isSubmitting ? 'Saving...' : (editData ? 'Update Bill & Save' : 'Generate Bill & Save')}
              </button>
              {!editData && (
                <button onClick={handleGenerateQuotation} style={{ flex: 1, padding: '1rem', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
                  Generate Quotation
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSaleForm;
