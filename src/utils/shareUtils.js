import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export const shareProduct = async (product) => {
  try {
    const displayTitle = product.title || product.product_name || 'Product';
    const displayImages = product.images || (product.image_url ? [product.image_url] : []);
    const imageUrl = displayImages.length > 0 ? displayImages[0] : null;
    let shareUrl = null;
    let webFile = null;

    if (imageUrl && !imageUrl.startsWith('data:')) {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      if (Capacitor.isNativePlatform()) {
        // Download image and write to cache on Native devices (Android/iOS)
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
        });

        const fileName = `shared_${Date.now()}.jpg`;
        const result = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache
        });
        shareUrl = result.uri; // Native Share uses 'url' for local file paths
      } else {
        // On Web, prepare a File object to share directly without a link
        webFile = new File([blob], `product_${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
      }
    }

    let shareText = `Check out the ${displayTitle}!\n\n`;
    if (product.materials) shareText += `Materials: ${product.materials}\n`;
    if (product.dimensions) shareText += `Dimensions: ${product.dimensions}\n`;
    if (product.weight_capacity) shareText += `Capacity: ${product.weight_capacity}\n`;
    if (product.colors) shareText += `Colors: ${product.colors}\n`;

    if (Capacitor.isNativePlatform()) {
      await Share.share({
        text: shareText,
        url: shareUrl || undefined, // Local file URI that Native Android turns into an image attachment
        dialogTitle: 'Share Product',
      });
    } else {
      // Web Fallback
      if (navigator.share) {
        const shareData = {
          text: shareText,
        };
        
        // If the browser supports sharing files, attach the actual image file
        if (webFile && navigator.canShare && navigator.canShare({ files: [webFile] })) {
          shareData.files = [webFile];
        }
        
        await navigator.share(shareData);
      } else {
        alert('Sharing is not supported on this device/browser.');
      }
    }
    return true;
  } catch (error) {
    console.error('Error sharing product:', error);
    return false;
  }
};
