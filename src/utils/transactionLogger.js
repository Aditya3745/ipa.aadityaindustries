import { supabase } from '../supabase';

export const logTransaction = async (type, amount, description, paymentMethod = 'Cash') => {
  if (amount <= 0) return;

  try {
    const { data: seqData } = await supabase.from('sequence_manager').select('*').eq('seq_name', 'TRANS_ID').single();
    let newSeqVal = 1; 
    let prefix = 'AIND/TRNS/';
    if (seqData) { 
      newSeqVal = (seqData.current_val || 0) + 1; 
      prefix = seqData.prefix || prefix; 
    }
    const txnId = `${prefix}${String(newSeqVal).padStart(3, '0')}`;
    
    const { error } = await supabase.from('transactions').insert([{ 
       transaction_id: txnId, 
       transaction_type: type,
       amount: amount,
       description: description,
       status: 'Completed',
       account_type: paymentMethod
    }]);
    
    if (error) throw error;
    
    await supabase.from('sequence_manager').update({ current_val: newSeqVal }).eq('seq_name', 'TRANS_ID');
    return true;
  } catch (error) {
    console.error("Failed to log transaction:", error);
    return false;
  }
};
