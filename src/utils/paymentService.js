import { supabase } from '../supabase';
import { logTransaction } from './transactionLogger';
import { updateCustomerBalance, updateSupplierBalance } from './balanceService';

/**
 * Records a single payment against a specific Sale or Purchase invoice.
 * Updates the invoice amount_paid & status, logs transaction with reference, and updates contact balance.
 * 
 * @param {Object} params
 * @param {'sale'|'purchase'} params.invoiceType
 * @param {string} params.invoiceId e.g. 'AIND/SALE/001' or 'AIND/PUR/002'
 * @param {number} params.amount Amount being paid now
 * @param {string} [params.paymentMethod='Cash'] 'Cash' | 'Bank' | 'UPI' | 'Cheque'
 * @param {string} [params.paymentDate] YYYY-MM-DD
 * @param {string} [params.partyId] Customer ID or Supplier ID
 * @param {string} [params.partyName] Customer Name or Supplier Name
 * @param {number} params.currentGrandTotal Grand total of the invoice
 * @param {number} [params.currentAmountPaid=0] Total amount paid so far on this invoice
 * @returns {Promise<{ success: boolean, newAmountPaid?: number, newDue?: number, error?: any }>}
 */
export async function recordInvoicePayment({
  invoiceType,
  invoiceId,
  amount,
  paymentMethod = 'Cash',
  paymentDate,
  partyId,
  partyName = '',
  currentGrandTotal = 0,
  currentAmountPaid = 0
}) {
  const payAmt = Number(amount);
  if (!payAmt || payAmt <= 0) {
    return { success: false, error: 'Invalid payment amount' };
  }

  const grandTotal = Number(currentGrandTotal) || 0;
  const prevPaid = Number(currentAmountPaid) || 0;
  const newAmountPaid = Math.round((prevPaid + payAmt) * 100) / 100;
  const newDue = Math.max(0, Math.round((grandTotal - newAmountPaid) * 100) / 100);
  const paymentStatus = newDue <= 0 ? 'Paid' : 'Partial';
  const txDate = paymentDate || new Date().toISOString().split('T')[0];

  try {
    const isSale = invoiceType === 'sale';
    const tableName = isSale ? 'sales' : 'purchases';
    const idColumn = isSale ? 'sale_id' : 'purchase_id';
    const txnType = isSale ? 'Income' : 'Expense';
    const partyLabel = partyName ? ` - ${partyName}` : '';
    const desc = isSale 
      ? `Payment received for Invoice ${invoiceId}${partyLabel}`
      : `Payment made for Purchase ${invoiceId}${partyLabel}`;

    // 1. Log transaction with explicit reference linkage
    const txnSuccess = await logTransaction(
      txnType,
      payAmt,
      desc,
      paymentMethod,
      invoiceId,
      tableName,
      txDate,
      newDue
    );

    if (!txnSuccess) {
      console.warn(`Transaction logging returned false for invoice ${invoiceId}`);
    }

    // 2. Update invoice amount_paid & status
    const { error: invErr } = await supabase
      .from(tableName)
      .update({
        amount_paid: newAmountPaid,
        payment_status: paymentStatus
      })
      .eq(idColumn, invoiceId);

    if (invErr) {
      console.error(`Error updating ${tableName} record ${invoiceId}:`, invErr);
      return { success: false, error: invErr };
    }

    // 3. Update Contact balance if partyId provided
    if (partyId) {
      if (isSale) {
        await updateCustomerBalance(partyId, -payAmt);
      } else {
        await updateSupplierBalance(partyId, -payAmt);
      }
    }

    return {
      success: true,
      newAmountPaid,
      newDue,
      paymentStatus
    };
  } catch (err) {
    console.error('recordInvoicePayment error:', err);
    return { success: false, error: err };
  }
}
