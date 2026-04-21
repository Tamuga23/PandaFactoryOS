import React from 'react';
import { useStoreData } from '../hooks/useStoreData';
import ProductCatalog, { CatalogProduct } from '../components/ProductCatalog';
import { fileToBase64, compressImage } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';

export default function Catalog() {
  const { products, addProduct, updateProduct, loading } = useStoreData();

  if (loading) {
    return <div className="text-zinc-500">Cargando catálogo...</div>;
  }

  // Preparamos los datos para que el componente ProductCatalog los entienda
  const catalogForComponent: CatalogProduct[] = products.map((p) => ({
    id: p.id,
    description: p.name, // Usamos el nombre del producto como descripcion principal
    priceUSD: p.price,
    category: p.category,
    status: p.stock >= 0 ? 'Activo' : 'Inactivo', // Mapeo temporal
    imageUrl: p.imageBase64,
  }));

  const handleAddProduct = async (productData: any) => {
    let imageBase64 = '';
    if (productData.imageFile) {
       const rawBase64 = await fileToBase64(productData.imageFile);
       imageBase64 = await compressImage(rawBase64);
    }
    
    // Convertir de formato ProductCatalog a Formato Product BD
    const newProduct = {
      id: productData.id || uuidv4(),
      sku: productData.id || uuidv4(), // Usamos el ID como SKU también
      name: productData.description,
      description: productData.description,
      price: productData.priceUSD,
      cost: 0, // Costo base (lo manejaría compras)
      stock: 0, // Stock inicia en 0 (lo manejaría compras)
      minStockAlert: 5,
      category: productData.category,
      imageBase64: imageBase64,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await addProduct(newProduct);
  };

  const handleUpdateProduct = async (id: string, productData: any) => {
    // Buscar el producto original para no perder datos como stock, etc.
    const originalProduct = products.find(p => p.id === id);
    if (!originalProduct) throw new Error('Producto no encontrado');

    let imageBase64 = originalProduct.imageBase64;
    // Si subió un archivo nuevo, reemplazar imagen
    if (productData.imageFile) {
       const rawBase64 = await fileToBase64(productData.imageFile);
       imageBase64 = await compressImage(rawBase64);
    }

    const updatedProduct = {
      ...originalProduct,
      name: productData.description,
      description: productData.description,
      price: productData.priceUSD,
      category: productData.category,
      imageBase64: imageBase64,
      updatedAt: Date.now(),
    };

    await updateProduct(updatedProduct);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Gestor de Catálogo</h1>
      </div>
      
      <ProductCatalog 
        catalog={catalogForComponent}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onSuccess={() => {
           console.log("Catálogo actualizado");
        }}
      />
    </div>
  );
}
