import React, { useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Info } from 'lucide-react';
import { generateCollectiveReportPDF, generateIndividualInvoicePDF } from '../utils/pdfGenerator';
import CreateSaleForm from '../components/erp/CreateSaleForm';
import CreatePurchaseForm from '../components/erp/CreatePurchaseForm';
import { MODULES_CONFIG } from '../config/modules';
import PrintFormatModal from '../components/PrintFormatModal';
import ErrorBoundary from '../components/ErrorBoundary';
import useERPData from '../hooks/useERPData';

import { OverviewModule } from '../components/erp/modules/OverviewModule';

// Lazy loaded modules & modals for optimal code-splitting and fastest load times
const SupplierModule = React.lazy(() => import('../components/erp/modules/SupplierModule').then(m => ({ default: m.SupplierModule })));
const SupplierModal = React.lazy(() => import('../components/erp/modules/SupplierModule').then(m => ({ default: m.SupplierModal })));

const EmployeeModule = React.lazy(() => import('../components/erp/modules/EmployeeModule').then(m => ({ default: m.EmployeeModule })));
const EmployeeModal = React.lazy(() => import('../components/erp/modules/EmployeeModule').then(m => ({ default: m.EmployeeModal })));

const UserModule = React.lazy(() => import('../components/erp/modules/UserModule').then(m => ({ default: m.UserModule })));
const UserModal = React.lazy(() => import('../components/erp/modules/UserModule').then(m => ({ default: m.UserModal })));

const CustomerModule = React.lazy(() => import('../components/erp/modules/CustomerModule').then(m => ({ default: m.CustomerModule })));
const CustomerModal = React.lazy(() => import('../components/erp/modules/CustomerModule').then(m => ({ default: m.CustomerModal })));

const ProductModule = React.lazy(() => import('../components/erp/modules/ProductModule').then(m => ({ default: m.ProductModule })));
const ProductModal = React.lazy(() => import('../components/erp/modules/ProductModule').then(m => ({ default: m.ProductModal })));

const ManufacturingModule = React.lazy(() => import('../components/erp/modules/ManufacturingModule').then(m => ({ default: m.ManufacturingModule })));
const ManufacturingModal = React.lazy(() => import('../components/erp/modules/ManufacturingModule').then(m => ({ default: m.ManufacturingModal })));

const AccountsModule = React.lazy(() => import('../components/erp/modules/AccountsModule').then(m => ({ default: m.AccountsModule })));
const TransactionModal = React.lazy(() => import('../components/erp/modules/AccountsModule').then(m => ({ default: m.TransactionModal })));

const SellModule = React.lazy(() => import('../components/erp/modules/SellModule').then(m => ({ default: m.SellModule })));
const PurchaseModule = React.lazy(() => import('../components/erp/modules/PurchaseModule').then(m => ({ default: m.PurchaseModule })));
const StockModule = React.lazy(() => import('../components/erp/modules/StockModule').then(m => ({ default: m.StockModule })));
const ReportModule = React.lazy(() => import('../components/erp/modules/ReportModule').then(m => ({ default: m.ReportModule })));
const AboutModule = React.lazy(() => import('../components/erp/modules/AboutModule').then(m => ({ default: m.AboutModule })));
const ContactModule = React.lazy(() => import('../components/erp/modules/ContactModule').then(m => ({ default: m.ContactModule })));

const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get('module') || 'overview';
  const setCurrentView = (view) => setSearchParams({ module: view });

  // Use TanStack Query cached data - instant navigation without redundant fetches
  const { data, isLoading: loading, refetchAll } = useERPData();
  const {
    products = [],
    customers = [],
    sales = [],
    purchases = [],
    manufacturing = [],
    stock = [],
    employees = [],
    suppliers = [],
    users = [],
    transactions = [],
    reportLogs = []
  } = data;

  // Modal State for generic forms
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, editData: null });
  // Modal State for print formatting
  const [printConfig, setPrintConfig] = useState({ isOpen: false, target: null });
  // Edit State for transactions (sales & purchases)
  const [editTransactionData, setEditTransactionData] = useState(null);

  const navigate = useNavigate();

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
      switch (printConfig.target) {
        case 'sales':
          generateCollectiveReportPDF("SALES REPORT", 
            ["Invoice ID", "Customer", "Date", "Grand Total", "Status"],
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

  const printSingleSale = async (sale) => {
    const cust = customers.find(c => c.customer_id === sale.customer_id || c.cust_comp_name === sale.customer_name);
    const paidAmount = Number(sale.amount_paid !== undefined && sale.amount_paid !== null ? sale.amount_paid : (sale.advance_amount || 0));
    const dues = Math.max(0, Number(sale.grand_total || 0) - paidAmount);

    // Fetch linked payment receipts specifically for this sale ID
    const { data: linkedTxns } = await supabase
      .from('transactions')
      .select('*')
      .eq('reference_id', sale.sale_id)
      .order('payment_date', { ascending: true });

    const mappedSale = {
       ...sale,
       id: sale.sale_id,
       dues: dues,
       amount_paid: paidAmount,
       advance_amount: Number(sale.advance_amount || 0),
       tax_total: sale.tax,
       customer_gst_no: cust ? cust.cust_gst_no : null
    };
    
    const mappedItems = (sale.sale_items || []).map(item => {
        const prod = products.find(p => p.product_id === item.product_id);
        return {
            ...item,
            product_name: prod ? (prod.product_name || prod.title) : item.product_id,
            hsn_code: prod ? prod.hsn_code : 'N/A'
        };
    });
    
    generateIndividualInvoicePDF('sale', mappedSale, mappedItems, false, linkedTxns || []);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: 'var(--primary, #3b82f6)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: '#64748b', fontWeight: 600 }}>Loading Aaditya Industries ERP...</span>
      </div>
    );
  }

  // Render Logic
  if (currentView === 'create_sale') {
    return (
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        <SecondaryAppbar title={editTransactionData ? "Edit Sale" : "Create Sale"} onBack={() => { setCurrentView('sell'); setEditTransactionData(null); }} />
        <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
          <CreateSaleForm
            editData={editTransactionData}
            onBack={() => { setCurrentView('sell'); setEditTransactionData(null); }}
            onSuccess={() => { refetchAll(); setCurrentView('sell'); setEditTransactionData(null); }}
          />
        </div>
      </div>
    );
  }

  if (currentView === 'create_purchase') {
    return (
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        <SecondaryAppbar title={editTransactionData ? "Edit Purchase" : "Create Purchase"} onBack={() => { setCurrentView('purchase'); setEditTransactionData(null); }} />
        <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
          <CreatePurchaseForm
            editData={editTransactionData}
            onBack={() => { setCurrentView('purchase'); setEditTransactionData(null); }}
            onSuccess={() => { refetchAll(); setCurrentView('purchase'); setEditTransactionData(null); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '5rem' }}>
      <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
        <ErrorBoundary onReset={refetchAll}>
          <React.Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading module...</div>}>
            <ModuleView 
              view={currentView} 
              data={{ products, customers, sales, purchases, manufacturing, stock, employees, suppliers, users, transactions, reportLogs }}
              actions={{
                setModalConfig,
                setCurrentView,
                printCustomersTable,
                printSalesTable,
                printSingleSale,
                printProductsTable,
                printSuppliersTable,
                printPurchasesTable,
                printStockTable,
                setEditTransactionData,
                onRefresh: refetchAll
              }}
            />
          </React.Suspense>
        </ErrorBoundary>
      </div>
      
      {/* Render Extracted Modals */}
      {modalConfig.isOpen && modalConfig.type === 'customer' && (
        <CustomerModal onClose={() => setModalConfig({ isOpen: false, type: null })} onSuccess={refetchAll} editData={modalConfig.editData} />
      )}
      {modalConfig.isOpen && modalConfig.type === 'product' && (
        <ProductModal onClose={() => setModalConfig({ isOpen: false, type: null })} onSuccess={refetchAll} editData={modalConfig.editData} />
      )}
      {modalConfig.isOpen && modalConfig.type === 'supplier' && (
        <SupplierModal onClose={() => setModalConfig({ isOpen: false, type: null })} onSuccess={refetchAll} editData={modalConfig.editData} />
      )}
      {modalConfig.isOpen && modalConfig.type === 'employee' && (
        <EmployeeModal onClose={() => setModalConfig({ isOpen: false, type: null })} onSuccess={refetchAll} editData={modalConfig.editData} />
      )}
      {modalConfig.isOpen && modalConfig.type === 'user' && (
        <UserModal onClose={() => setModalConfig({ isOpen: false, type: null })} onSuccess={refetchAll} editData={modalConfig.editData} />
      )}
      {modalConfig.isOpen && modalConfig.type === 'manufacturing' && (
        <ManufacturingModal onClose={() => setModalConfig({ isOpen: false, type: null })} onSuccess={refetchAll} products={products} employees={employees} editData={modalConfig.editData} />
      )}
      {modalConfig.isOpen && modalConfig.type === 'transaction' && (
        <TransactionModal onClose={() => setModalConfig({ isOpen: false, type: null })} onSuccess={refetchAll} editData={modalConfig.editData} />
      )}
      
      {/* Print Format Modal */}
      {printConfig.isOpen && (
        <PrintFormatModal onClose={() => setPrintConfig({ isOpen: false, target: null })} onSelect={handlePrintSelect} />
      )}
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

// This function routes the data to the correct Modular Component
const ModuleView = ({ view, data, actions }) => {
  const { products, customers, sales, purchases, manufacturing, suppliers, employees, users, stock, transactions, reportLogs } = data;
  const {
    setModalConfig,
    setCurrentView,
    printCustomersTable,
    printSalesTable,
    printSingleSale,
    printProductsTable,
    printSuppliersTable,
    printPurchasesTable,
    printStockTable,
    setEditTransactionData,
    onRefresh
  } = actions;

  if (view === 'overview') return <OverviewModule data={data} setCurrentView={setCurrentView} />;
  if (view === 'supplier') return <SupplierModule suppliers={suppliers} setModalConfig={setModalConfig} printSuppliersTable={printSuppliersTable} onRefresh={onRefresh} />;
  if (view === 'employee') return <EmployeeModule employees={employees} setModalConfig={setModalConfig} onRefresh={onRefresh} />;
  if (view === 'users') return <UserModule users={users} setModalConfig={setModalConfig} onRefresh={onRefresh} />;
  if (view === 'customer') return <CustomerModule customers={customers} setModalConfig={setModalConfig} printCustomersTable={printCustomersTable} onRefresh={onRefresh} />;
  if (view === 'product') return <ProductModule products={products} setModalConfig={setModalConfig} printProductsTable={printProductsTable} onRefresh={onRefresh} />;
  if (view === 'sell') return <SellModule sales={sales} setCurrentView={setCurrentView} printSalesTable={printSalesTable} printSingleSale={printSingleSale} setEditTransactionData={setEditTransactionData} onRefresh={onRefresh} />;
  if (view === 'purchase') return <PurchaseModule purchases={purchases} setCurrentView={setCurrentView} printPurchasesTable={printPurchasesTable} setEditTransactionData={setEditTransactionData} onRefresh={onRefresh} />;
  if (view === 'stock') return <StockModule stock={stock} printStockTable={printStockTable} onRefresh={onRefresh} />;
  if (view === 'manufacturing') return <ManufacturingModule manufacturing={manufacturing} setModalConfig={setModalConfig} onRefresh={onRefresh} />;
  if (view === 'accounts') return <AccountsModule transactions={transactions} setModalConfig={setModalConfig} onRefresh={onRefresh} />;
  if (view === 'report') return <ReportModule report_logs={reportLogs} printSalesTable={printSalesTable} printCustomersTable={printCustomersTable} onRefresh={onRefresh} />;
  if (view === 'about') return <AboutModule />;
  if (view === 'contact') return <ContactModule suppliers={suppliers} customers={customers} sales={sales} purchases={purchases} transactions={transactions} onRefresh={onRefresh} />;

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
