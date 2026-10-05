import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const supabaseUrl = 'https://tpfqflalimrqzumpyjff.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZnFmbGFsaW1ycXp1bXB5amZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjU0MjU5NCwiZXhwIjoyMTAyMTE4NTk0fQ.I7mHuuEdX7P0uY7b72fM1bgSFO31a604J0EosOsVLho';
const supabase = createClient(supabaseUrl, supabaseKey);

async function downloadImage(url) {
  if (url.startsWith('data:image')) {
    const base64Data = url.split(',')[1];
    return Buffer.from(base64Data, 'base64');
  } else {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

async function run() {
  console.log("Fetching products...");
  const { data: products, error } = await supabase.from('products').select('product_id, product_name, image_url').not('image_url', 'is', null);
  
  if (error) {
    console.error("Error fetching products:", error);
    return;
  }

  console.log(`Found ${products.length} products with images.`);

  for (const product of products) {
    const { product_id, product_name, image_url } = product;

    if (!image_url) continue;

    try {
      console.log(`Processing ${product_id} (${product_name})...`);
      const imageBuffer = await downloadImage(image_url);
      
      console.log(`Converting ${product_id} to webp...`);
      const webpBuffer = await sharp(imageBuffer).webp().toBuffer();

      const safeName = (product_name || product_id).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const fileName = `${Date.now()}_${safeName}.webp`;
      const filePath = `product_images/${fileName}`;

      console.log(`Uploading ${fileName} to storage...`);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, webpBuffer, {
          contentType: 'image/webp',
          upsert: true
        });

      if (uploadError) {
        console.error(`Failed to upload ${fileName}:`, uploadError);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      const newUrl = publicUrlData.publicUrl;
      console.log(`Updating database for ${product_id} to ${newUrl}...`);

      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: newUrl })
        .eq('product_id', product_id);

      if (updateError) {
        console.error(`Failed to update DB for ${product_id}:`, updateError);
      } else {
        console.log(`Successfully updated ${product_id}.`);
      }
    } catch (e) {
      console.error(`Error processing ${product_id}:`, e);
    }
  }
  
  console.log("Finished converting all images.");
}

run();
