import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tpfqflalimrqzumpyjff.supabase.co';
const supabaseKey = 'sb_publishable_Q0xP3zR8n4xBhpZ2n_pcNw_r4ycQbBX';

export const supabase = createClient(supabaseUrl, supabaseKey);
