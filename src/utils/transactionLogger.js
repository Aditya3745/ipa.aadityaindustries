import { supabase } from '../supabase';
import { generateId } from './sequenceManager';

/**
 * Logs a financial transaction with full reference tracking and payment date.
 * 
 * @param {string} type 'Income' | 'Expense' | 'Transfer'
 * @param {number} amount Payment amount
 * @param {string} description Human-readable description
 * @param {string} paymentMethod 'Cash' | 'Bank' | 'UPI' | 'Cheque'
 * @param {string|null} referenceId ID of related sale, purchase, employee, etc.
 * @param {string|null} referenceTable 'sales' | 'purchases' | 'employees' | 'customers' | 'suppliers'
 * @param {string|null} paymentDate YYYY-MM-DD (defaults to today)
 * @param {number|null} dues Remaining balance due after this transaction
 * @returns {Promise<boolean>}
 */
export const logTransaction = async (
  type,
  amount,
  description,
  paymentMethod = 'Cash',
  referenceId = null,
  referenceTable = null,
  paymentDate = null,
  dues = null
) => {
  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) return false;

  try {
    const txnId = await generateId('TRANS_ID', 'AIND/TRNS/');
    const today = new Date().toISOString().split('T')[0];
    const txDate = paymentDate || today;

    const row = {
      transaction_id: txnId,
      transaction_type: type,
      amount: numericAmount,
      description: description,
      status: 'Completed',
      account_type: paymentMethod || 'Cash',
      reference_id: referenceId ? String(referenceId) : null,
      reference_table: referenceTable ? String(referenceTable) : null,
      payment_date: txDate,
      transaction_date: new Date().toISOString()
    };

    if (dues !== null && dues !== undefined && !isNaN(Number(dues))) {
      row.dues = Number(dues);
    }

    const { error } = await supabase.from('transactions').insert([row]);
    if (error) {
      console.error("Supabase error inserting transaction:", error);
      throw error;
    }
    return true;
  } catch (error) {
    console.error("Failed to log transaction:", error);
    return false;
  }
};
