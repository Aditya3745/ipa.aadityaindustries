import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tpfqflalimrqzumpyjff.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZnFmbGFsaW1ycXp1bXB5amZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjU0MjU5NCwiZXhwIjoyMTAyMTE4NTk0fQ.I7mHuuEdX7P0uY7b72fM1bgSFO31a604J0EosOsVLho';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
  console.log("Checking if push_subscriptions table exists...");

  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('id')
    .limit(1);

  if (error && error.code === '42P01') {
    console.log("\n❌ Table doesn't exist yet.");
    console.log("Please run this SQL in your Supabase SQL Editor:\n");
    console.log(`
CREATE TABLE push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  device_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert" ON push_subscriptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role all" ON push_subscriptions
  FOR ALL USING (true);
    `);
  } else if (error) {
    console.error("Error:", error.message, error.code);
    console.log("\nIf table doesn't exist, run this SQL in Supabase SQL Editor:\n");
    console.log(`
CREATE TABLE push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  device_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert" ON push_subscriptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role all" ON push_subscriptions
  FOR ALL USING (true);
    `);
  } else {
    console.log("✅ Table already exists! Found", data.length, "subscriptions.");
  }
}

createTable();
