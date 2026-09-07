import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { Plus, Printer } from 'lucide-react';
import ProductCard from '../../ProductCard';
import ProductDetailModal from '../../ProductDetailModal';

const cardStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' };

export const ProductModule = ({ products, setModalConfig, printProductsTable }) => {
  const [previewProduct, setPreviewProduct] = useState(null);

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Product Catalog</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={printProductsTable} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}><Printer size={16} /></button>
          <button onClick={() => setModalConfig({ isOpen: true, type: 'product' })} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}><Plus size={16} /> Add</button>
        </div>
      </div>
      
      <div className="product-module-grid">
        {products.map((product, index) => (
          <ProductCard
            key={product.product_id || product.id}
            index={index}
            isCompact={true}
            onEdit={() => setModalConfig({ isOpen: true, type: 'product', editData: product })}
            title={product.title || product.product_name}
            description={product.description}
            images={product.images || (product.image_url ? [product.image_url] : [])}
            category={product.category}
            badge={product.badge}
            materials={product.materials}
            dimensions={product.dimensions}
            weight_capacity={product.weight_capacity}
            colors={product.colors}
            stock_count={product.stock_count}
            model_3d_url={product.model_3d_url}
            onClick={() => setPreviewProduct(product)}
            productData={product}
          />
        ))}
      </div>
      {products.length === 0 && <p style={{ padding: '1rem', color: '#64748b' }}>No products found.</p>}

      {previewProduct && (
        <ProductDetailModal 
          product={previewProduct} 
          onClose={() => setPreviewProduct(null)} 
        />
      )}
    </div>
  );
};

export const ProductModal = ({ onClose, editData }) => {
  const [formData, setFormData] = useState(editData || { 
    product_name: '', 
    category: 'Furniture', 
    product_type: 'Chair',
    unit: 'Piece',
    stock_count: 0,
    purchase_rate: 0,
    selling_rate: 0, 
    cgst: 0,
    sgst: 0,
    igst: 0,
    reorder_level: 0,
    hsn_code: '9401',
    // Web app extra fields
    description: '',
    image_url: '',
    model_3d_url: '',
    materials: '',
    dimensions: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productIdPreview, setProductIdPreview] = useState('AIND/PID/...');

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) { // 1.5MB limit
         alert('Please select an image smaller than 1.5MB');
         return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image_url: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (editData) {
      setProductIdPreview(editData.product_id);
    } else {
      const fetchSeq = async () => {
        const { data } = await supabase.from('sequence_manager').select('*').eq('seq_name', 'PROD_ID').single();
        if (data) {
          setProductIdPreview(`${data.prefix || 'AIND/PID/'}${String((data.current_val || 0) + 1).padStart(3, '0')}`);
        }
      };
      fetchSeq();
    }
  }, [editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const productData = {
      product_name: formData.product_name,
      category: formData.category,
      product_type: formData.product_type,
      unit: formData.unit,
      purchase_rate: formData.purchase_rate,
      selling_rate: formData.selling_rate,
      cgst: formData.cgst,
      sgst: formData.sgst,
      igst: formData.igst,
      reorder_level: formData.reorder_level,
      hsn_code: formData.hsn_code,
      description: formData.description,
      image_url: formData.image_url
    };

    try {
      if (editData) {
        const { error } = await supabase.from('products').update(productData).eq('product_id', editData.product_id);
        if (error) throw error;
        alert("Product updated successfully!");
      } else {
        const { data: seqData } = await supabase.from('sequence_manager').select('*').eq('seq_name', 'PROD_ID').single();
        let newSeqVal = 1; let prefix = 'AIND/PID/';
        if (seqData) { newSeqVal = (seqData.current_val || 0) + 1; prefix = seqData.prefix || prefix; }
        productData.product_id = `${prefix}${String(newSeqVal).padStart(3, '0')}`;
        
        const { error } = await supabase.from('products').insert([productData]);
        if (error) throw error;
        await supabase.from('sequence_manager').update({ current_val: newSeqVal }).eq('seq_name', 'PROD_ID');
        alert("Product added successfully!");
      }
      onClose();
    } catch (err) { 
      console.error(err); 
      alert(`Failed to ${editData ? 'update' : 'add'} product.`); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const inputStyle = { width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem' };
  const labelStyle = { display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.75rem', color: '#475569' };
  const gridStyle3 = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>{editData ? 'Edit Product' : 'Add Product'}</h2>
        <form onSubmit={handleSubmit}>
          
          {/* Row 1 */}
          <div style={gridStyle3}>
            <div>
              <label style={labelStyle}>Product ID:</label>
              <input type="text" style={{...inputStyle, backgroundColor: '#f1f5f9', color: '#64748b'}} value={productIdPreview} disabled />
            </div>
            <div>
              <label style={labelStyle}>Product Name:</label>
              <input type="text" style={inputStyle} required value={formData.product_name || ''} onChange={e => setFormData({...formData, product_name: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Category:</label>
              <select style={inputStyle} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="Furniture">Furniture</option>
                <option value="Electronics">Electronics</option>
                <option value="Raw Material">Raw Material</option>
              </select>
            </div>
          </div>

          {/* Row 2 */}
          <div style={gridStyle3}>
            <div>
              <label style={labelStyle}>Product Type:</label>
              <select style={inputStyle} value={formData.product_type} onChange={e => setFormData({...formData, product_type: e.target.value})}>
                <option value="Chair">Chair</option>
                <option value="Table">Table</option>
                <option value="Sofa">Sofa</option>
                <option value="Bed">Bed</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Unit:</label>
              <select style={inputStyle} value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                <option value="Piece">Piece</option>
                <option value="Box">Box</option>
                <option value="Set">Set</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Stock Qty:</label>
              <input type="number" style={inputStyle} value={formData.stock_count || 0} onChange={e => setFormData({...formData, stock_count: Number(e.target.value)})} />
            </div>
          </div>

          {/* Row 3 */}
          <div style={gridStyle3}>
            <div>
              <label style={labelStyle}>Purchase Rate:</label>
              <input type="number" step="0.01" style={inputStyle} value={formData.purchase_rate || 0} onChange={e => setFormData({...formData, purchase_rate: Number(e.target.value)})} />
            </div>
            <div>
              <label style={labelStyle}>Selling Rate:</label>
              <input type="number" step="0.01" style={inputStyle} required value={formData.selling_rate || 0} onChange={e => setFormData({...formData, selling_rate: Number(e.target.value)})} />
            </div>
            <div>
              <label style={labelStyle}>HSN Code:</label>
              <input type="text" style={inputStyle} value={formData.hsn_code} onChange={e => setFormData({...formData, hsn_code: e.target.value})} />
            </div>
          </div>

          {/* Row 4: Taxes & Reorder */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>CGST (%):</label>
              <input type="number" step="0.01" style={inputStyle} value={formData.cgst} onChange={e => setFormData({...formData, cgst: Number(e.target.value)})} />
            </div>
            <div>
              <label style={labelStyle}>SGST (%):</label>
              <input type="number" step="0.01" style={inputStyle} value={formData.sgst} onChange={e => setFormData({...formData, sgst: Number(e.target.value)})} />
            </div>
            <div>
              <label style={labelStyle}>IGST (%):</label>
              <input type="number" step="0.01" style={inputStyle} value={formData.igst} onChange={e => setFormData({...formData, igst: Number(e.target.value)})} />
            </div>
            <div>
              <label style={labelStyle}>Reorder Level:</label>
              <input type="number" style={inputStyle} value={formData.reorder_level} onChange={e => setFormData({...formData, reorder_level: Number(e.target.value)})} />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '1rem 0' }} />
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#475569' }}>Web Catalog Information</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              <div>
                <label style={labelStyle}>Materials</label>
                <input type="text" style={inputStyle} value={formData.materials || ''} onChange={e => setFormData({...formData, materials: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Dimensions</label>
                <input type="text" style={inputStyle} value={formData.dimensions || ''} onChange={e => setFormData({...formData, dimensions: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Image (Max 1.5MB)</label>
                <input type="file" accept="image/*" style={inputStyle} onChange={handleImageUpload} />
              </div>
              <div>
                <label style={labelStyle}>3D Model URL (Optional)</label>
                <input type="text" style={inputStyle} placeholder="https://..." value={formData.model_3d_url || ''} onChange={e => setFormData({...formData, model_3d_url: e.target.value})} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea style={{...inputStyle, resize: 'vertical', minHeight: '160px'}} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
              {formData.image_url && <img src={formData.image_url} alt="Preview" style={{ width: '100%', maxHeight: '100px', objectFit: 'contain', marginTop: '0.5rem', borderRadius: '4px' }} />}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.75rem 2rem', background: 'white', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
            <button type="submit" disabled={isSubmitting} style={{ padding: '0.75rem 2rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>{isSubmitting ? 'Saving...' : (editData ? 'Update Product' : 'Save Product')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
