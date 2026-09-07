import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read supabase credentials from source code (e.g., src/supabase.js)
const supabaseFile = fs.readFileSync('./src/supabase.js', 'utf8');
const urlMatch = supabaseFile.match(/const supabaseUrl = ['"]([^'"]+)['"]/);
const keyMatch = supabaseFile.match(/const supabaseKey = ['"]([^'"]+)['"]/);

if (!urlMatch || !keyMatch) {
    console.log("Could not find supabase credentials");
    process.exit(1);
}

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function getSchema() {
    // Note: PostgREST (Supabase) might not expose information_schema to anon role.
    // Let's try querying a row from each table to see the columns, or just try fetching empty rows.
    const tables = ['products', 'customers', 'suppliers', 'sales', 'sale_items', 'purchases', 'purchase_items', 'employees', 'transactions', 'stock', 'manufacturing_orders'];
    
    let schema = {};
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.error(`Error fetching ${table}:`, error.message);
            schema[table] = "Error: " + error.message;
        } else if (data && data.length > 0) {
            schema[table] = Object.keys(data[0]);
        } else {
            schema[table] = "Empty table or cannot infer columns without rows";
        }
    }
    
    fs.writeFileSync('schema_analysis.json', JSON.stringify(schema, null, 2));
    console.log("Schema analysis saved to schema_analysis.json");
}

getSchema();
