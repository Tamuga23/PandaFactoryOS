import { useState, useMemo } from 'react';
import { useStoreData } from '../hooks/useStoreData';
import { Purchase, Product } from '../types';
import { formatCurrency } from '../lib/utils';
import { Trash2, Calendar, User, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import PurchaseRegistration from '../components/PurchaseRegistration';

export default function Purchases() {
  const { products, purchases, recordPurchase, deletePurchase, addProduct, loading } = useStoreData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) return <div className="text-zinc-500">Loading purchases...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 italic">Inventory Inbound (Compras)</h2>
          <p className="text-xs text-zinc-400">Track and register stock purchases from suppliers.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          REGISTRAR COMPRA
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-800 text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Ref #</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4 text-right">Total Cost</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {purchases.sort((a, b) => b.date - a.date).map(p => (
                <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-zinc-400">{p.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 text-zinc-300 flex items-center gap-2 whitespace-nowrap">
                    <Calendar className="w-3 h-3 text-sky-400" />
                    {new Date(p.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-zinc-300">
                    <div className="flex items-center gap-2">
                       <User className="w-3 h-3 text-zinc-500" />
                       {p.supplier || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 italic">
                    {p.items.length} items
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-cyan-400">
                    {formatCurrency(p.totalCost)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => { if(window.confirm('Delete this purchase? This will not revert stock automatically.')) deletePurchase(p.id)}}
                      className="text-zinc-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-zinc-500 italic">No purchase history found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-700 flex justify-between items-center bg-zinc-800/50">
               {/* Custom Full Purchase Registration Component */}
               <PurchaseRegistration 
                 inventory={products}
                 onCancel={() => setIsModalOpen(false)}
                 onSuccess={() => setIsModalOpen(false)}
                 onAddProduct={async (newProductData: any) => {
                   const { fileToBase64, compressImage } = await import('../lib/utils');
                   let base64 = '';
                   if (newProductData.imageFile) {
                      const compressed = await compressImage(newProductData.imageFile, 800, 800, 0.7);
                      base64 = await fileToBase64(compressed);
                   }
                   
                   const id = uuidv4();
                   const productToSave: Product = {
                     id,
                     name: newProductData.name,
                     sku: newProductData.sku,
                     price: newProductData.price,
                     cost: newProductData.cost,
                     stock: 0, // Stock will be added by the purchase logic
                     category: newProductData.category,
                     imageBase64: base64,
                     ownerId: '' // Set safely in hook
                   };
                   
                   await addProduct(productToSave);
                   return id;
                 }}
                 onAddPurchase={async (purchaseData: any) => {
                   const pId = uuidv4();
                   const purchase: Omit<Purchase, 'ownerId'> = {
                     id: pId,
                     date: purchaseData.date,
                     supplier: purchaseData.supplier,
                     notes: `Platform: ${purchaseData.platform} | Channel: ${purchaseData.shippingChannel} | Mode: ${purchaseData.shippingMode}`,
                     items: [{
                       id: purchaseData.itemId,
                       name: purchaseData.description,
                       sku: 'REF', // simplified for this UI
                       cost: purchaseData.unitCost,
                       quantity: purchaseData.quantity
                     }],
                     totalCost: purchaseData.unitCost * purchaseData.quantity
                   };
                   await recordPurchase(purchase);
                 }}
               />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
