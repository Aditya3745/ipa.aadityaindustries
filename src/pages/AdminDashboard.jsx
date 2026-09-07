import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Info 
} from 'lucide-react';
import { generateCollectiveReportPDF, generateIndividualInvoicePDF } from '../utils/pdfGenerator';
import CreateSaleForm from '../components/erp/CreateSaleForm';
import { MODULES_CONFIG } from '../config/modules';
import PrintFormatModal from '../components/PrintFormatModal';

// Import our new Modular Views
import { SupplierModule, SupplierModal } from '../components/erp/modules/SupplierModule';
import { EmployeeModule, EmployeeModal } from '../components/erp/modules/EmployeeModule';
import { UserModule, UserModal } from '../components/erp/modules/UserModule';
import { CustomerModule, CustomerModal } from '../components/erp/modules/CustomerModule';
import { ProductModule, ProductModal } from '../components/erp/modules/ProductModule';
import { SellModule } from '../components/erp/modules/SellModule';
import { PurchaseModule } from '../components/erp/modules/PurchaseModule';
import { StockModule } from '../components/erp/modules/StockModule';
import { ManufacturingModule, ManufacturingModal } from '../components/erp/modules/ManufacturingModule';
import { AccountsModule, TransactionModal } from '../components/erp/modules/AccountsModule';
import { ReportModule } from '../components/erp/modules/ReportModule';
import { OverviewModule } from '../components/erp/modules/OverviewModule';
import CreatePurchaseForm from '../components/erp/CreatePurchaseForm';

const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get('module') || 'overview';
  const setCurrentView = (view) => setSearchParams({ module: view });

  const [loading, setLoading] = useState(true);
  
  // Data State
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [manufacturing, setManufacturing] = useState([]);
  const [stock, setStock] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reportLogs, setReportLogs] = useState([]);

  // Modal State for generic forms
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, editData: null });
  // Modal State for print formatting
  const [printConfig, setPrintConfig] = useState({ isOpen: false, target: null });
  // Edit State for transactions (sales & purchases)
  const [editTransactionData, setEditTransactionData] = useState(null);

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: pData, error: pErr } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (pErr) console.error("Products error:", pErr);
      setProducts(pData || []);

      const { data: cData, error: cErr } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (cErr) console.error("Customers error:", cErr);
      setCustomers(cData || []);

      const { data: sData, error: sErr } = await supabase.from('sales').select('*, sale_items(*)').order('created_at', { ascending: false });
      if (sErr) console.error("Sales error:", sErr);
      setSales(sData || []);

      const { data: purData, error: purErr } = await supabase.from('purchases').select('*, purchase_items(*)').order('created_at', { ascending: false });
      if (purErr) console.error("Purchases error:", purErr);
      setPurchases(purData || []);

      const { data: mfgData, error: mfgErr } = await supabase.from('manufacturing_orders').select('*, products(*)').order('created_at', { ascending: false });
      if (mfgErr) console.error("Manufacturing error:", mfgErr);
      setManufacturing(mfgData || []);

      const { data: stkData, error: stkErr } = await supabase.from('stock').select('*, products(*)');
      if (stkErr) console.error("Stock error:", stkErr);
      setStock(stkData || []);

      const { data: empData, error: empErr } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
      if (empErr) console.error("Employees error:", empErr);
      setEmployees(empData || []);

      const { data: supData, error: supErr } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false });
      if (supErr) console.error("Suppliers error:", supErr);
      setSuppliers(supData || []);

      const { data: usrData, error: usrErr } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (usrErr) console.error("Users error:", usrErr);
      setUsers(usrData || []);

      const { data: txnData, error: txnErr } = await supabase.from('transactions').select('*').order('transaction_date', { ascending: false });
      if (txnErr) console.error("Transactions error:", txnErr);
      setTransactions(txnData || []);

      const { data: rptData, error: rptErr } = await supabase.from('report_logs').select('*').order('generated_at', { ascending: false });
      if (rptErr) console.error("Reports error:", rptErr);
      setReportLogs(rptData || []);

    } catch (error) {
      console.error("Error fetching data: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentView]);

  // --- Print Actions ---
  const printSalesTable = () => setPrintConfig({ isOpen: true, target: 'sales' });
  const printCustomersTable = () => setPrintConfig({ isOpen: true, target: 'customers' });
  const printProductsTable = () => setPrintConfig({ isOpen: true, target: 'products' });
  const printSuppliersTable = () => setPrintConfig({ isOpen: true, target: 'suppliers' });
  const printPurchasesTable = () => setPrintConfig({ isOpen: true, target: 'purchases' });
  const printStockTable = () => setPrintConfig({ isOpen: true, target: 'stock' });

  const handlePrintSelect = (format) => {
    if (format === 'catalog') {
      window.print();
    } else if (format === 'detailed') {
      switch(printConfig.target) {
        case 'sales':
          generateCollectiveReportPDF("SALES REPORT", 
            ["Invoice ID", "Customer", "Date", "Total Amount", "Status"],
            sales.map(s => [s.sale_id, s.customer_name, s.sale_date, Number(s.grand_total || 0).toFixed(2), s.payment_status])
          );
          break;
        case 'customers':
          generateCollectiveReportPDF("CUSTOMER REPORT", 
            ["ID", "Name", "Phone", "Email", "Balance"],
            customers.map(c => [c.customer_id, c.cust_comp_name, c.cust_comp_person_no || '', c.cust_email || '', Number(c.customer_balance || 0).toFixed(2)])
          );
          break;
        case 'products':
          generateCollectiveReportPDF("PRODUCT CATALOG", 
            ["ID", "Name", "Category", "Type", "Selling Rate"],
            products.map(p => [p.product_id, p.product_name, p.category || '', p.product_type || '', Number(p.selling_rate || 0).toFixed(2)])
          );
          break;
        case 'suppliers':
          generateCollectiveReportPDF("SUPPLIER REPORT", 
            ["ID", "Name", "Phone", "Email", "Balance"],
            suppliers.map(s => [s.supplier_id, s.supp_comp_name, s.supp_comp_no || '', s.supp_email || '', Number(s.supplier_balance || 0).toFixed(2)])
          );
          break;
        case 'purchases':
          generateCollectiveReportPDF("PURCHASES REPORT", 
            ["PO Number", "Supplier", "Date", "Total Amount", "Status"],
            purchases.map(p => [p.purchase_id, p.supplier_id || '', p.purchase_date?.split('T')[0] || '', Number(p.grand_total || 0).toFixed(2), p.status || 'Completed'])
          );
          break;
        case 'stock':
          generateCollectiveReportPDF("STOCK INVENTORY REPORT", 
            ["Stock ID", "Product ID", "Quantity", "Warehouse", "Last Updated"],
            stock.map(s => [s.stock_id, s.product_id || '', s.quantity || 0, s.warehouse_location || '', s.last_updated?.split('T')[0] || ''])
          );
          break;
      }
    }
    setPrintConfig({ isOpen: false, target: null });
  };

  const printSingleSale = (sale) => {
    const cust = customers.find(c => c.cust_comp_name === sale.customer_name);
    const mappedSale = {
       ...sale,
       id: sale.sale_id,
       dues: sale.grand_total - sale.advance_amount,
       tax_total: sale.tax,
       customer_gst_no: cust ? cust.cust_gst_no : null
    };
    
    const mappedItems = (sale.sale_items || []).map(item => {
        const prod = products.find(p => p.product_id === item.product_id);
        return {
            ...item,
            product_name: prod ? prod.product_name : item.product_id,
            hsn_code: prod ? prod.hsn_code : 'N/A'
        };
    });
    
    generateIndividualInvoicePDF('sale', mappedSale, mappedItems);
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>Loading ERP...</div>;

  // Render Logic
  if (currentView === 'create_sale') {
    return (
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        <SecondaryAppbar title={editTransactionData ? "Edit Sale" : "Create Sale"} onBack={() => { setCurrentView('sell'); setEditTransactionData(null); }} />
        <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
          <CreateSaleForm editData={editTransactionData} onBack={() => { setCurrentView('sell'); setEditTransactionData(null); }} onSuccess={() => { fetchData(); setCurrentView('sell'); setEditTransactionData(null); }} />
        </div>
      </div>
    );
  }

  if (currentView === 'create_purchase') {
    return (
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        <SecondaryAppbar title={editTransactionData ? "Edit Purchase" : "Create Purchase"} onBack={() => { setCurrentView('purchase'); setEditTransactionData(null); }} />
        <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
          <CreatePurchaseForm editData={editTransactionData} onBack={() => { setCurrentView('purchase'); setEditTransactionData(null); }} onSuccess={() => { fetchData(); setCurrentView('purchase'); setEditTransactionData(null); }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '5rem' }}>
      <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
        <ModuleView 
          view={currentView} 
          data={{ products, customers, sales, purchases, manufacturing, stock, employees, suppliers, users, transactions, reportLogs }}
          actions={{ setModalConfig, setCurrentView, printCustomersTable, printSalesTable, printSingleSale, printProductsTable, printSuppliersTable, printPurchasesTable, printStockTable, setEditTransactionData }}
        />
      </div>
      
      {/* Render Extracted Modals */}
      {modalConfig.isOpen && modalConfig.type === 'customer' && <CustomerModal onClose={() => { setModalConfig({ isOpen: false, type: null }); fetchData(); }} editData={modalConfig.editData} />}
      {modalConfig.isOpen && modalConfig.type === 'product' && <ProductModal onClose={() => { setModalConfig({ isOpen: false, type: null }); fetchData(); }} editData={modalConfig.editData} />}
      {modalConfig.isOpen && modalConfig.type === 'supplier' && <SupplierModal onClose={() => { setModalConfig({ isOpen: false, type: null }); fetchData(); }} editData={modalConfig.editData} />}
      {modalConfig.isOpen && modalConfig.type === 'employee' && <EmployeeModal onClose={() => { setModalConfig({ isOpen: false, type: null }); fetchData(); }} editData={modalConfig.editData} />}
      {modalConfig.isOpen && modalConfig.type === 'user' && <UserModal onClose={() => { setModalConfig({ isOpen: false, type: null }); fetchData(); }} editData={modalConfig.editData} />}
      {modalConfig.isOpen && modalConfig.type === 'manufacturing' && <ManufacturingModal onClose={() => { setModalConfig({ isOpen: false, type: null }); fetchData(); }} products={products} employees={employees} editData={modalConfig.editData} />}
      {modalConfig.isOpen && modalConfig.type === 'transaction' && <TransactionModal onClose={() => { setModalConfig({ isOpen: false, type: null }); fetchData(); }} editData={modalConfig.editData} />}
      
      {/* Print Format Modal */}
      {printConfig.isOpen && <PrintFormatModal onClose={() => setPrintConfig({ isOpen: false, target: null })} onSelect={handlePrintSelect} />}
    </div>
  );
};

// --- Sub Components ---

const SecondaryAppbar = ({ title, onBack }) => (
  <div style={{ backgroundColor: '#1e293b', padding: '1rem', color: 'white', display: 'flex', alignItems: 'center' }}>
    <ArrowLeft size={24} style={{ cursor: 'pointer', marginRight: '1rem' }} onClick={onBack} />
    <h1 style={{ fontSize: '1.2rem', margin: 0, fontWeight: '600' }}>{title}</h1>
  </div>
);

// This function now just routes the data to the correct Modular Component
const ModuleView = ({ view, data, actions }) => {
  const { products, customers, sales, purchases, manufacturing, suppliers, employees, users, stock, transactions, reportLogs } = data;
  const { setModalConfig, setCurrentView, printCustomersTable, printSalesTable, printSingleSale, printProductsTable, printSuppliersTable, printPurchasesTable, printStockTable, setEditTransactionData } = actions;

  // Extracted Modular Components
  if (view === 'overview') return <OverviewModule data={data} setCurrentView={setCurrentView} />;
  if (view === 'supplier') return <SupplierModule suppliers={suppliers} setModalConfig={setModalConfig} printSuppliersTable={printSuppliersTable} />;
  if (view === 'employee') return <EmployeeModule employees={employees} setModalConfig={setModalConfig} />;
  if (view === 'users') return <UserModule users={users} setModalConfig={setModalConfig} />;
  if (view === 'customer') return <CustomerModule customers={customers} setModalConfig={setModalConfig} printCustomersTable={printCustomersTable} />;
  if (view === 'product') return <ProductModule products={products} setModalConfig={setModalConfig} printProductsTable={printProductsTable} />;
  if (view === 'sell') return <SellModule sales={sales} setCurrentView={setCurrentView} printSalesTable={printSalesTable} printSingleSale={printSingleSale} setEditTransactionData={setEditTransactionData} />;
  if (view === 'purchase') return <PurchaseModule purchases={purchases} setCurrentView={setCurrentView} printPurchasesTable={printPurchasesTable} setEditTransactionData={setEditTransactionData} />;
  if (view === 'stock') return <StockModule stock={stock} printStockTable={printStockTable} />;
  if (view === 'manufacturing') return <ManufacturingModule manufacturing={manufacturing} setModalConfig={setModalConfig} />;
  if (view === 'accounts') return <AccountsModule transactions={transactions} setModalConfig={setModalConfig} />;
  if (view === 'report') return <ReportModule report_logs={reportLogs} printSalesTable={printSalesTable} printCustomersTable={printCustomersTable} />;

  // Fallback for unbuilt modules
  const cardStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' };
  return (
    <div style={{ ...cardStyle, textAlign: 'center', padding: '4rem 2rem' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '32px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
        <Info size={32} color="#94a3b8" />
      </div>
      <h2 style={{ fontSize: '1.5rem', color: '#1e293b', marginBottom: '0.5rem' }}>Coming Soon</h2>
      <p style={{ color: '#64748b' }}>The <strong>{MODULES_CONFIG.find(m => m.id === view)?.label}</strong> module is currently under development.</p>
    </div>
  );
};

export default AdminDashboard;
