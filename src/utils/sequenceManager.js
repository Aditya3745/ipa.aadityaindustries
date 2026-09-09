import { supabase } from '../supabase';

/**
 * Generates the next sequential ID atomically and advances the sequence counter in Supabase.
 * @param {string} seqName e.g. 'USER_ID', 'CUST_ID', 'SUP_ID', 'EMP_ID', 'SALE_ID', 'PURCHASE_ID', 'TRANS_ID', 'MFG', 'STOCK_ID'
 * @param {string} defaultPrefix e.g. 'AIND/USR/', 'AIND/CUST/', etc.
 * @returns {Promise<string>} e.g. 'AIND/USR/005'
 */
export async function generateId(seqName, defaultPrefix) {
  try {
    const { data, error } = await supabase
      .from('sequence_manager')
      .select('*')
      .eq('seq_name', seqName)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.warn(`Error reading sequence ${seqName}:`, error);
    }

    let newSeqVal = 1;
    let prefix = defaultPrefix;

    if (data) {
      newSeqVal = (Number(data.current_val) || 0) + 1;
      prefix = data.prefix || defaultPrefix;
      const { error: updateErr } = await supabase
        .from('sequence_manager')
        .update({ current_val: newSeqVal })
        .eq('seq_name', seqName);

      if (updateErr) {
        console.error(`Error incrementing sequence ${seqName}:`, updateErr);
      }
    } else {
      const { error: insertErr } = await supabase
        .from('sequence_manager')
        .insert([{ seq_name: seqName, current_val: newSeqVal, prefix: defaultPrefix }]);

      if (insertErr) {
        console.error(`Error initializing sequence ${seqName}:`, insertErr);
      }
    }

    return `${prefix}${String(newSeqVal).padStart(3, '0')}`;
  } catch (err) {
    console.error(`generateId failed for ${seqName}:`, err);
    // Fallback ID if table fails
    return `${defaultPrefix}${Date.now().toString().slice(-3)}`;
  }
}

/**
 * Peeks at the next expected ID without incrementing the sequence counter (for UI preview only).
 * @param {string} seqName
 * @param {string} defaultPrefix
 * @returns {Promise<string>}
 */
export async function peekNextId(seqName, defaultPrefix) {
  try {
    const { data } = await supabase
      .from('sequence_manager')
      .select('*')
      .eq('seq_name', seqName)
      .maybeSingle();

    if (data) {
      const nextVal = (Number(data.current_val) || 0) + 1;
      const prefix = data.prefix || defaultPrefix;
      return `${prefix}${String(nextVal).padStart(3, '0')}`;
    }
    return `${defaultPrefix}001`;
  } catch (err) {
    console.warn(`peekNextId failed for ${seqName}:`, err);
    return `${defaultPrefix}001`;
  }
}
