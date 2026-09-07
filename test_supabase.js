import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tpfqflalimrqzumpyjff.supabase.co';
const supabaseKey = 'sb_publishable_Q0xP3zR8n4xBhpZ2n_pcNw_r4ycQbBX';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Testing stock join...");
  const { data: stkData, error: stkErr } = await supabase.from('stock').select('*, products(*)');
  console.log("Stock Data:", stkData);
  console.log("Stock Error:", stkErr);
}

test();
