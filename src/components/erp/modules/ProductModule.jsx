import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { Plus, Printer } from 'lucide-react';
import ProductCard from '../../ProductCard';
import ProductDetailModal from '../../ProductDetailModal';
import { compressImageToWebP, convertWebPToJpeg } from '../../../utils/imageUtils';


import { getWatermarkLogo, saveOrSharePDF } from '../../../utils/pdfGenerator';
import toast from 'react-hot-toast';

const cardStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' };

export const ProductModule = ({ products = [], suppliers = [], setModalConfig }) => {
  const [previewProduct, setPreviewProduct] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showPrintMenu, setShowPrintMenu] = useState(false);

  const handlePrintCatalog = async (showPrice = true) => {
    setShowPrintMenu(false);
    setIsGeneratingPdf(true);
    try {
      toast.loading("Preparing catalog images...", { id: "catalog-toast" });
      const preparedProducts = await Promise.all(
        products.map(async (p) => {
          const rawImg = (p.images && p.images.length > 0) ? p.images[0] : (p.image_url || '');
          const convertedImg = await convertWebPToJpeg(rawImg);
          return {
            ...p,
            catalogImage: convertedImg
          };
        })
      );

      toast.loading("Generating PDF catalog...", { id: "catalog-toast" });
      const logoBase64 = await getWatermarkLogo();
      const { pdf } = await import('@react-pdf/renderer');
      const { CatalogDocument } = await import('./PdfCatalog');
      const blob = await pdf(<CatalogDocument products={preparedProducts} logoBase64={logoBase64} showPrice={showPrice} />).toBlob();
      const filename = showPrice ? `Product_Catalog_WithPrice_${Date.now()}.pdf` : `Product_Catalog_NoPrice_${Date.now()}.pdf`;
      await saveOrSharePDF(blob, filename, true);
      toast.success("Catalog generated successfully!", { id: "catalog-toast" });
    } catch (e) {
      console.error("Failed to generate PDF", e);
      toast.error("Failed to generate PDF", { id: "catalog-toast" });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }} className="hide-on-print">
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Product Catalog</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            {/* Print Catalog Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowPrintMenu(prev => !prev)}
                disabled={isGeneratingPdf}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: isGeneratingPdf ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
              >
                <Printer size={16} /> {isGeneratingPdf ? 'Generating...' : 'Print Catalog ▾'}
              </button>
              {showPrintMenu && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, minWidth: '190px', overflow: 'hidden' }}>
                  <button
                    onClick={() => handlePrintCatalog(true)}
                    style={{ width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    💰 With Price
                  </button>
                  <button
                    onClick={() => handlePrintCatalog(false)}
                    style={{ width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    🙈 Without Price
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => setModalConfig({ isOpen: true, type: 'product' })} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}><Plus size={16} /> Add</button>
          </div>

      </div>
      
      <div className="catalog-cover">
        <img src="/logo.png" alt="Aaditya Industries Logo" style={{ maxWidth: '400px', width: '80%', height: 'auto' }} />
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
          suppliers={suppliers}
          onClose={() => setPreviewProduct(null)} 
        />
      )}
    </div>
  );
};

export const ProductModal = ({ onClose, editData, onSuccess, suppliers = [] }) => {
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
    supplier_id: editData?.supplier_id || '',
    // Web app extra fields
    description: '',
    image_url: '',
    model_3d_url: '',
    materials: '',
    dimensions: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productIdPreview, setProductIdPreview] = useState('AIND/PID/...');

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // Increased to 5MB since we compress
         alert('Please select an image smaller than 5MB');
         return;
      }
      try {
        const webpBase64 = await compressImageToWebP(file, 800, 0.8);
        setFormData({ ...formData, image_url: webpBase64 });
      } catch (err) {
        console.error("Failed to compress image", err);
        alert("Failed to process image.");
      }
    }
  };

  useEffect(() => {
    if (editData) {
      setProductIdPreview(editData.product_id);
      const fetchExistingStock = async () => {
        const { data: stockData } = await supabase.from('stock').select('quantity').eq('product_id', editData.product_id).maybeSingle();
        if (stockData) {
          setFormData(prev => ({ ...prev, stock_count: stockData.quantity }));
        }
      };
      fetchExistingStock();
    } else {
      const fetchSeq = async () => {
        const { data: productsData } = await supabase.from('products').select('product_id').order('product_id', { ascending: false }).limit(1);
        let nextVal = 1;
        if (productsData && productsData.length > 0 && productsData[0].product_id) {
          const match = productsData[0].product_id.match(/(\d+)$/);
          if (match) {
            nextVal = parseInt(match[1], 10) + 1;
          }
        }
        setProductIdPreview(`AIND/PID/${String(nextVal).padStart(3, '0')}`);
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
      supplier_id: formData.supplier_id || null,
      description: formData.description,
      image_url: formData.image_url
    };

    try {
      let currentProductId = editData ? editData.product_id : null;
      if (!currentProductId) {
        const { data: productsData } = await supabase.from('products').select('product_id').order('product_id', { ascending: false }).limit(1);
        let nextVal = 1; let prefix = 'AIND/PID/';
        if (productsData && productsData.length > 0 && productsData[0].product_id) {
          const match = productsData[0].product_id.match(/(\d+)$/);
          if (match) {
            nextVal = parseInt(match[1], 10) + 1;
            prefix = productsData[0].product_id.substring(0, productsData[0].product_id.length - match[1].length);
          }
        }
        currentProductId = `${prefix}${String(nextVal).padStart(3, '0')}`;
        productData.product_id = currentProductId;
      }

      // Handle image upload to storage if it's a new base64 image
      if (formData.image_url && formData.image_url.startsWith('data:image/webp')) {
        try {
          const base64Data = formData.image_url.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteArrays = [];
          for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
          }
          const blob = new Blob(byteArrays, { type: 'image/webp' });
          
          const safeName = (productData.product_name || currentProductId).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
          const fileName = `${Date.now()}_${safeName}.webp`;
          const filePath = `product_images/${fileName}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage.from('images').upload(filePath, blob, { contentType: 'image/webp', upsert: true });
          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(filePath);
            productData.image_url = publicUrlData.publicUrl;
          } else {
            console.error("Storage upload failed:", uploadError);
          }
        } catch (err) {
          console.error("Failed to upload image to storage", err);
        }
      }

      if (editData) {
        const { error } = await supabase.from('products').update(productData).eq('product_id', currentProductId);
        if (error) throw error;
        
        // Try updating existing stock, or create if missing
        const { data: existingStock, error: stockFetchErr } = await supabase.from('stock').select('stock_id').eq('product_id', currentProductId).maybeSingle();
        if (existingStock) {
          await supabase.from('stock').update({ quantity: formData.stock_count || 0, min_quantity: formData.reorder_level || 0 }).eq('product_id', currentProductId);
        } else {
          await supabase.from('stock').insert([{ product_id: currentProductId, quantity: formData.stock_count || 0, location: 'Main Warehouse', min_quantity: formData.reorder_level || 0 }]);
        }

        toast.success("Product updated successfully!");
      } else {
        let nextVal = parseInt(currentProductId.match(/(\d+)$/)[1], 10);
        
        const { error } = await supabase.from('products').insert([productData]);
        if (error) throw error;
        
        // Initialize stock for new product
        const stockData = {
          product_id: productData.product_id,
          quantity: formData.stock_count || 0,
          location: 'Main Warehouse',
          min_quantity: formData.reorder_level || 0
        };
        const { error: stockError } = await supabase.from('stock').insert([stockData]);
        if (stockError) console.error("Failed to initialize stock:", stockError);

        // Optionally update sequence manager so it's not too far behind
        await supabase.from('sequence_manager').update({ current_val: nextVal }).eq('seq_name', 'PROD_ID');
        toast.success("Product added successfully!");
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) { 
      console.error(err); 
      toast.error(`Failed to ${editData ? 'update' : 'add'} product: ` + (err.message || '')); 
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

          {/* Row 4: Taxes, Reorder & Supplier */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
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
            <div>
              <label style={labelStyle}>Assigned Supplier:</label>
              <select style={inputStyle} value={formData.supplier_id || ''} onChange={e => setFormData({...formData, supplier_id: e.target.value})}>
                <option value="">-- None --</option>
                {suppliers.map(s => (
                  <option key={s.supplier_id} value={s.supplier_id}>
                    {s.supp_comp_name} ({s.supp_comp_no || s.supp_comp_person_no || 'No Phone'})
                  </option>
                ))}
              </select>
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
