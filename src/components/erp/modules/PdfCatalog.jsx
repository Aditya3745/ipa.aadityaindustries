import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff'
  },
  coverPage: {
    padding: 30,
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 250,
    marginBottom: 20
  },
  title: {
    fontSize: 24,
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  grid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  card: {
    width: '31%', // roughly 1/3 minus gap
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15
  },
  productImage: {
    width: '100%',
    height: 120,
    objectFit: 'contain',
    marginBottom: 10
  },
  productTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4
  },
  badge: {
    fontSize: 8,
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    padding: '2px 4px',
    borderRadius: 4,
    marginBottom: 4,
    alignSelf: 'flex-start'
  },
  productCategory: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 8
  },
  productPrice: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: 'auto'
  }
});

// A valid fallback image to prevent crash if product image is empty
const FALLBACK_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

export const CatalogDocument = ({ products, logoBase64 }) => (
  <Document>
    {/* Cover Page */}
    <Page size="A4" style={styles.coverPage}>
      {logoBase64 && <Image src={logoBase64} style={styles.logo} />}
      <Text style={styles.title}>Aaditya Industries</Text>
      <Text style={styles.subtitle}>Premium Office Seating Catalog</Text>
    </Page>

    {/* Product Pages */}
    <Page size="A4" style={styles.page}>
      <View style={styles.grid}>
        {products.map((product, index) => {
          const rawImg = (product.images && product.images.length > 0) ? product.images[0] : (product.image_url || '');
          const imgUrl = (rawImg && !rawImg.startsWith('data:image/webp') && !rawImg.endsWith('.webp')) ? rawImg : FALLBACK_IMAGE;
          
          return (
            <View key={product.product_id || index} style={styles.card} wrap={false}>
              <Image src={imgUrl} style={styles.productImage} />
              
              {product.badge && <Text style={styles.badge}>{product.badge}</Text>}
              
              <Text style={styles.productTitle}>
                {product.title || product.product_name || 'Unnamed Product'}
              </Text>
              
              <Text style={styles.productCategory}>
                {product.category || 'Furniture'}
              </Text>
              
              <Text style={styles.productPrice}>
                ₹{Number(product.selling_rate || 0).toLocaleString()}
              </Text>
            </View>
          );
        })}
      </View>
    </Page>
  </Document>
);
