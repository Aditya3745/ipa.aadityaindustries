import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tpfqflalimrqzumpyjff.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZnFmbGFsaW1ycXp1bXB5amZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjU0MjU5NCwiZXhwIjoyMTAyMTE4NTk0fQ.I7mHuuEdX7P0uY7b72fM1bgSFO31a604J0EosOsVLho';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching all products to find active images...");
  const { data: products, error: dbError } = await supabase.from('products').select('image_url').not('image_url', 'is', null);
  
  if (dbError) {
    console.error("Error fetching products:", dbError);
    return;
  }

  // Extract filenames from URLs
  const activeFilenames = new Set();
  for (const p of products) {
    if (p.image_url) {
      const parts = p.image_url.split('/');
      const filename = parts[parts.length - 1];
      if (filename) {
        activeFilenames.add(filename);
      }
    }
  }

  console.log(`Found ${activeFilenames.size} active images in the database.`);

  console.log("Fetching all files in storage bucket 'images/product_images'...");
  const { data: files, error: storageError } = await supabase.storage.from('images').list('product_images', {
    limit: 1000,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' }
  });

  if (storageError) {
    console.error("Error fetching storage files:", storageError);
    return;
  }

  const filesToDelete = [];
  for (const file of files) {
    // Ignore the empty placeholder object if exists
    if (file.name === '.emptyFolderPlaceholder') continue;

    if (!activeFilenames.has(file.name)) {
      filesToDelete.push(`product_images/${file.name}`);
    }
  }

  console.log(`Found ${filesToDelete.length} unused files to delete.`);

  if (filesToDelete.length > 0) {
    console.log("Deleting files...");
    const { data: deleted, error: deleteError } = await supabase.storage.from('images').remove(filesToDelete);
    if (deleteError) {
      console.error("Error deleting files:", deleteError);
    } else {
      console.log(`Successfully deleted ${deleted.length} old images.`);
    }
  } else {
    console.log("No old images to delete.");
  }
}

run();
