import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';

const fetchERPData = async () => {
  const [
    { data: pData, error: pErr },
    { data: cData, error: cErr },
    { data: sData, error: sErr },
    { data: purData, error: purErr },
    { data: mfgData, error: mfgErr },
    { data: stkData, error: stkErr },
    { data: empData, error: empErr },
    { data: supData, error: supErr },
    { data: usrData, error: usrErr },
    { data: txnData, error: txnErr },
    { data: rptData, error: rptErr }
  ] = await Promise.all([
    supabase.from('products').select('*').order('created_at', { ascending: false }),
    supabase.from('customers').select('*').order('created_at', { ascending: false }),
    supabase.from('sales').select('*, sale_items(*)').order('created_at', { ascending: false }),
    supabase.from('purchases').select('*, purchase_items(*)').order('created_at', { ascending: false }),
    supabase.from('manufacturing_orders').select('*, products(*)').order('created_at', { ascending: false }),
    supabase.from('stock').select('*, products(*)'),
    supabase.from('employees').select('*').order('created_at', { ascending: false }),
    supabase.from('suppliers').select('*').order('created_at', { ascending: false }),
    supabase.from('users').select('*').order('created_at', { ascending: false }),
    supabase.from('transactions').select('*').order('transaction_date', { ascending: false }),
    supabase.from('report_logs').select('*').order('generated_at', { ascending: false })
  ]);

  if (pErr) console.warn("Products error:", pErr);
  if (cErr) console.warn("Customers error:", cErr);
  if (sErr) console.warn("Sales error:", sErr);
  if (purErr) console.warn("Purchases error:", purErr);
  if (mfgErr) console.warn("Mfg error:", mfgErr);
  if (stkErr) console.warn("Stock error:", stkErr);
  if (empErr) console.warn("Employees error:", empErr);
  if (supErr) console.warn("Suppliers error:", supErr);
  if (usrErr) console.warn("Users error:", usrErr);
  if (txnErr) console.warn("Txn error:", txnErr);
  if (rptErr) console.warn("Reports error:", rptErr);

  return {
    products: pData || [],
    customers: cData || [],
    sales: sData || [],
    purchases: purData || [],
    manufacturing: mfgData || [],
    stock: stkData || [],
    employees: empData || [],
    suppliers: supData || [],
    users: usrData || [],
    transactions: txnData || [],
    reportLogs: rptData || []
  };
};

export const useERPData = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['erpData'],
    queryFn: fetchERPData,
    staleTime: 1000 * 60 * 2, // 2 minutes cache - tab switching is instant!
    refetchOnWindowFocus: false
  });

  const refetchAll = () => {
    return queryClient.invalidateQueries({ queryKey: ['erpData'] });
  };

  return {
    ...query,
    data: query.data || {
      products: [],
      customers: [],
      sales: [],
      purchases: [],
      manufacturing: [],
      stock: [],
      employees: [],
      suppliers: [],
      users: [],
      transactions: [],
      reportLogs: []
    },
    refetchAll
  };
};

export default useERPData;
