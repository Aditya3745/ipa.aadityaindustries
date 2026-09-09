import { supabase } from '../supabase';

/**
 * Updates an entity's balance by fetching the latest value and applying the delta.
 * Delta is positive to increase balance, negative to decrease.
 * 
 * @param {string} table e.g. 'customers', 'suppliers'
 * @param {string} idCol e.g. 'customer_id', 'supplier_id'
 * @param {string} idVal e.g. 'AIND/CUST/001'
 * @param {string} balCol e.g. 'customer_balance', 'supplier_balance'
 * @param {number} delta e.g. -5000 (payment received/made) or +10000 (new invoice dues)
 * @returns {Promise<{ success: boolean, newBalance?: number, error?: any }>}
 */
export async function updateEntityBalance(table, idCol, idVal, balCol, delta) {
  try {
    if (!idVal) {
      console.warn(`updateEntityBalance called with null idVal for table ${table}`);
      return { success: false, error: 'Missing ID' };
    }

    // 1. Fetch current balance directly from DB to avoid stale frontend state
    const { data, error: fetchErr } = await supabase
      .from(table)
      .select(balCol)
      .eq(idCol, idVal)
      .maybeSingle();

    if (fetchErr) {
      console.error(`Error fetching ${balCol} for ${idVal}:`, fetchErr);
      return { success: false, error: fetchErr };
    }

    const currentBal = Number(data?.[balCol]) || 0;
    const newBalance = Math.round((currentBal + Number(delta)) * 100) / 100;

    // 2. Update DB with new balance
    const { error: updateErr } = await supabase
      .from(table)
      .update({ [balCol]: newBalance })
      .eq(idCol, idVal);

    if (updateErr) {
      console.error(`Error updating ${balCol} for ${idVal}:`, updateErr);
      return { success: false, error: updateErr };
    }

    return { success: true, newBalance };
  } catch (err) {
    console.error('updateEntityBalance unexpected error:', err);
    return { success: false, error: err };
  }
}

/**
 * Convenience helper to adjust Customer outstanding balance
 */
export async function updateCustomerBalance(customerId, delta) {
  return updateEntityBalance('customers', 'customer_id', customerId, 'customer_balance', delta);
}

/**
 * Convenience helper to adjust Supplier outstanding balance
 */
export async function updateSupplierBalance(supplierId, delta) {
  return updateEntityBalance('suppliers', 'supplier_id', supplierId, 'supplier_balance', delta);
}
