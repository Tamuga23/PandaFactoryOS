import React, { useState, useRef } from 'react';
import { useStoreData } from '../hooks/useStoreData';
import { Product } from '../types';
import { formatCurrency, fileToBase64, compressImage } from '../lib/utils';
import { Plus, Edit2, Trash2, Image as ImageIcon, Search } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function Inventory() {
  const { products, loading, addProduct, updateProduct, deleteProduct } = useStoreData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  if (loading) return <div className="text-zinc-500">Loading inventory...</div>;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
    } else {
      setEditingProduct(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      // Handle image separately if uploaded
      const fileInput = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
      let imageBase64 = editingProduct?.imageBase64 || '';
      if (fileInput.files && fileInput.files[0]) {
        const rawBase64 = await fileToBase64(fileInput.files[0]);
        imageBase64 = await compressImage(rawBase64);
      }

      const productData: Product = {
        id: editingProduct?.id || uuidv4(),
        sku: formData.get('sku') as string,
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: Number(formData.get('price')),
        cost: Number(formData.get('cost')),
        stock: Number(formData.get('stock')),
        minStockAlert: Number(formData.get('minStockAlert')),
        category: formData.get('category') as string,
        imageBase64,
        createdAt: editingProduct?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      if (editingProduct) {
        await updateProduct(productData);
      } else {
        await addProduct(productData);
      }
      closeModal();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1> */}
        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-zinc-700 bg-zinc-800 rounded-lg leading-5 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 text-sm"
            placeholder="Search products by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-lg shadow-cyan-900/20 text-white bg-cyan-600 hover:bg-cyan-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </button>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="font-semibold text-zinc-200">Current Inventory Status</h3>
        </div>

        <div className="overflow-x-auto p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-800/50 text-zinc-400 text-xs uppercase">
              <tr className="border-b border-zinc-800">
                <th scope="col" className="px-4 py-3">Image</th>
                <th scope="col" className="px-4 py-3">Product Name</th>
                <th scope="col" className="px-4 py-3">SKU</th>
                <th scope="col" className="px-4 py-3 text-right">Price</th>
                <th scope="col" className="px-4 py-3 text-right">Stock</th>
                <th scope="col" className="px-4 py-3 text-center">Status</th>
                <th scope="col" className="px-4 py-3 relative"><span className="sr-only">Edit</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredProducts.map((product) => {
                const isLowStock = product.stock <= product.minStockAlert;
                return (
                <tr key={product.id} className={`hover:bg-zinc-800/30 ${isLowStock ? 'bg-rose-500/5' : ''}`}>
                  <td className="px-4 py-2">
                    <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center text-[8px] text-zinc-500 overflow-hidden">
                      {product.imageBase64 ? (
                        <img className="h-10 w-10 object-cover" src={product.imageBase64} alt="" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-zinc-600" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 font-medium text-zinc-200">
                    <div>{product.name}</div>
                    <div className="text-xs text-zinc-500 font-normal">{product.category}</div>
                  </td>
                  <td className="px-4 py-2 text-zinc-500">{product.sku}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(product.price)}</td>
                  <td className={`px-4 py-2 text-right ${isLowStock ? 'text-rose-400 font-medium' : 'text-zinc-300'}`}>
                    {product.stock}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      isLowStock ? 'bg-rose-500/10 text-rose-500' : 'bg-cyan-500/10 text-cyan-500'
                    }`}>
                      {isLowStock ? 'Low Stock' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-sm font-medium">
                    <button onClick={() => openModal(product)} className="text-zinc-400 hover:text-cyan-400 mr-4 transition-colors">
                      <Edit2 className="h-4 w-4 inline" />
                    </button>
                    <button 
                      onClick={() => {
                        if(window.confirm('Are you sure you want to delete this product?')) deleteProduct(product.id);
                      }} 
                      className="text-zinc-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
              )})}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-zinc-500">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Overlay & Content */}
      {isModalOpen && (
        <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-zinc-950/75 transition-opacity backdrop-blur-sm" aria-hidden="true" onClick={closeModal}></div>
            <div className="relative inline-block align-bottom bg-zinc-900 border border-zinc-700 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <form onSubmit={handleSave}>
                <div className="bg-zinc-900 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-zinc-100 mb-4" id="modal-title">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">SKU</label>
                        <input required type="text" name="sku" defaultValue={editingProduct?.sku} className="block w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Category</label>
                        <input required type="text" name="category" defaultValue={editingProduct?.category} className="block w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Name</label>
                      <input required type="text" name="name" defaultValue={editingProduct?.name} className="block w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
                    </div>

                    <div>
                      <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Description</label>
                      <textarea name="description" rows={2} defaultValue={editingProduct?.description} className="block w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Price (Sell)</label>
                        <input required type="number" step="0.01" name="price" defaultValue={editingProduct?.price} className="block w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Cost (Buy)</label>
                        <input required type="number" step="0.01" name="cost" defaultValue={editingProduct?.cost} className="block w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Current Stock</label>
                        <input required type="number" name="stock" defaultValue={editingProduct?.stock} className="block w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Min Stock Alert</label>
                        <input required type="number" name="minStockAlert" defaultValue={editingProduct?.minStockAlert} className="block w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Product Image</label>
                      <input type="file" accept="image/*" className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-cyan-400 hover:file:bg-zinc-700" />
                      {editingProduct?.imageBase64 && (
                        <div className="mt-3">
                          <img src={editingProduct.imageBase64} alt="Preview" className="h-20 w-20 object-cover rounded-md border border-zinc-700" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-zinc-900 border-t border-zinc-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-cyan-600 text-base font-medium text-white hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Processing...' : 'Save Changes'}
                  </button>
                  <button 
                    type="button" 
                    onClick={closeModal} 
                    disabled={isSaving}
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-zinc-700 shadow-sm px-4 py-2 bg-zinc-800 text-base font-medium text-zinc-300 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
