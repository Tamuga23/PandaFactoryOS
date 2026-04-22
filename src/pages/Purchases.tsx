import { useState, useMemo } from 'react';
import { useStoreData } from '../hooks/useStoreData';
import { Purchase, Product } from '../types';
import { formatCurrency } from '../lib/utils';
import { Trash2, Calendar, User, Plus, Package, Clock, CheckCircle2, Navigation } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import PurchaseRegistration from '../components/PurchaseRegistration';

export default function Purchases() {
  const { products, purchases, recordPurchase, updatePurchase, deletePurchase, addProduct, loading } = useStoreData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trackingModalPurchase, setTrackingModalPurchase] = useState<Purchase | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    if (confirmingDelete === id) {
      deletePurchase(id);
      setConfirmingDelete(null);
    } else {
      setConfirmingDelete(id);
      setTimeout(() => setConfirmingDelete(null), 3000);
    }
  };
  
  // Phase 2 State
  const [trackingId, setTrackingId] = useState('');
  const [trackingStatus, setTrackingStatus] = useState('');
  const [agentDate, setAgentDate] = useState('');
  const [receptionDate, setReceptionDate] = useState('');
  const [finalWeight, setFinalWeight] = useState('');
  const [isSavingPhase2, setIsSavingPhase2] = useState(false);

  const openTrackingModal = (p: Purchase) => {
    setTrackingModalPurchase(p);
    setTrackingId(p.trackingId || '');
    setTrackingStatus(p.trackingStatus || '');
    setAgentDate(p.agentDeliveryDate ? new Date(p.agentDeliveryDate).toISOString().split('T')[0] : '');
    setReceptionDate(p.receptionDate ? new Date(p.receptionDate).toISOString().split('T')[0] : '');
    setFinalWeight(p.finalWeight ? String(p.finalWeight) : '');
  };

  const handleTrackingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingModalPurchase) return;
    setIsSavingPhase2(true);
    
    const updated: any = {
      ...trackingModalPurchase,
      trackingId,
      trackingStatus,
    };
    
    if (agentDate) updated.agentDeliveryDate = new Date(agentDate).getTime();
    else delete updated.agentDeliveryDate;
    
    if (receptionDate) updated.receptionDate = new Date(receptionDate).getTime();
    else delete updated.receptionDate;
    
    if (finalWeight) updated.finalWeight = Number(finalWeight);
    else delete updated.finalWeight;
    
    await updatePurchase(updated);
    setIsSavingPhase2(false);
    setTrackingModalPurchase(null);
  };

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
          REGISTRAR ORDEN (FASE 1)
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-800 text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Status & Ref</th>
                <th className="px-6 py-4">Dates & Logistics</th>
                <th className="px-6 py-4">Supplier & Channel</th>
                <th className="px-6 py-4">Items & Info</th>
                <th className="px-6 py-4 text-right">Total Cost</th>
                <th className="px-6 py-4 text-center">Tracking (Fase 2)</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {purchases.sort((a, b) => b.date - a.date).map(p => {
                const isClosed = p.status === 'CLOSED';
                
                // Calculates ETA
                let etaStr = 'N/A';
                if (p.agentDeliveryDate && p.shippingModality) {
                  const etaDate = new Date(p.agentDeliveryDate);
                  etaDate.setDate(etaDate.getDate() + (p.shippingModality === 'Sea Cargo' ? 17 : 5));
                  etaStr = etaDate.toLocaleDateString();
                }

                // Calculate Lead Time
                let leadTimeStr = 'Pending';
                if (p.receptionDate) {
                  const days = Math.round((p.receptionDate - p.date) / 86400000);
                  leadTimeStr = `${days} días`;
                }

                return (
                  <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 w-fit">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isClosed 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        }`}>
                          {isClosed ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          <span>{p.status || 'OPEN'}</span>
                        </div>
                        <span className="font-mono text-[10px] text-zinc-500 px-1">{p.id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      <div className="space-y-1.5 flex flex-col items-start w-fit">
                         <div className="flex items-center gap-2 w-full justify-between">
                            <span className="text-zinc-500 flex items-center gap-1"><Calendar className="w-3 h-3"/> Order:</span> 
                            <span className="text-zinc-200 font-medium">{new Date(p.date).toLocaleDateString()}</span>
                         </div>
                         
                         {p.agentDeliveryDate ? (
                           <div className="flex items-center gap-2 w-full justify-between">
                              <span className="text-zinc-500 flex items-center gap-1"><Navigation className="w-3 h-3"/> ETA:</span>
                              <span className="text-amber-400 font-medium">{etaStr}</span>
                           </div>
                         ) : !isClosed ? (
                           <div className="flex items-center gap-2 w-full justify-between">
                              <span className="text-zinc-500 flex items-center gap-1"><Navigation className="w-3 h-3"/> ETA:</span>
                              <span className="text-zinc-600 italic">Pendiente Agente</span>
                           </div>
                         ) : null}

                         {isClosed && p.receptionDate && (
                           <div className="flex items-center gap-2 w-full justify-between">
                              <span className="text-zinc-500 flex items-center gap-1"><Package className="w-3 h-3"/> Lead Time:</span>
                              <span className="text-emerald-400 font-medium">{leadTimeStr}</span>
                           </div>
                         )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="font-bold text-zinc-200">{p.supplier || 'N/A'}</div>
                      <div className="text-zinc-500 text-[10px]">{p.shippingModality} via {p.shippingChannel}</div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="text-zinc-300">{p.items.length} items</div>
                      <div className="text-zinc-500 line-clamp-1 max-w-[150px]" title={p.items.map(i=>i.name).join(', ')}>
                        {p.items[0]?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-cyan-400">
                      {formatCurrency(p.totalCost)}
                    </td>
                    <td className="px-6 py-4 text-center">
                       <button
                         onClick={() => openTrackingModal(p)}
                         className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isClosed ? 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700' : 'bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/20'}`}
                       >
                         {isClosed ? 'Ver Recepción' : 'Actualizar Track'}
                       </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDeleteClick(p.id)}
                        className={`transition-colors text-xs font-bold ${confirmingDelete === p.id ? 'text-rose-500' : 'text-zinc-500 hover:text-rose-400'}`}
                      >
                        {confirmingDelete === p.id ? 'Delete?' : <Trash2 className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-zinc-500 italic">No purchase history found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {trackingModalPurchase && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={() => setTrackingModalPurchase(null)}></div>
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-zinc-700 flex justify-between items-center bg-zinc-800/50">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                 <Navigation className="w-5 h-5 text-sky-400" /> Tracking y Recepción (Fase 2)
              </h3>
              <button onClick={() => setTrackingModalPurchase(null)} className="text-zinc-400 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleTrackingSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-500 font-bold">Tracking ID</label>
                    <input type="text" value={trackingId} onChange={e=>setTrackingId(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-200 focus:border-sky-500 outline-none" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-500 font-bold">Estado Logístico</label>
                    <select value={trackingStatus} onChange={e=>setTrackingStatus(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-200 focus:border-sky-500 outline-none">
                       <option value="">Seleccionar...</option>
                       <option value="Procesando">Procesando</option>
                       <option value="Enviado a Miami">Enviado a Miami</option>
                       <option value="Recibido en Miami">Recibido en Miami</option>
                       <option value="En Tránsito a NIC">En Tránsito a NIC</option>
                       <option value="Listo para Retiro">Listo para Retiro</option>
                    </select>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-500 font-bold">Fecha Entrega Agente (Miami)</label>
                    <input type="date" value={agentDate} onChange={e=>setAgentDate(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-200 focus:border-sky-500 outline-none" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-500 font-bold">Fecha Recepción (Nicaragua)</label>
                    <input type="date" value={receptionDate} onChange={e=>setReceptionDate(e.target.value)} className="w-full bg-zinc-800 border border-emerald-700/50 rounded-lg p-2 text-sm text-emerald-400 focus:border-emerald-500 outline-none" />
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-[10px] uppercase text-zinc-500 font-bold">Peso Final Cobrado (lbs)</label>
                 <input type="number" step="0.01" value={finalWeight} onChange={e=>setFinalWeight(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-200 focus:border-sky-500 outline-none" placeholder="Ej. 3.2" />
              </div>

              <div className="pt-4 border-t border-zinc-800 mt-6">
                 {receptionDate && !trackingModalPurchase.stockAdded && (
                   <div className="p-3 mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-2">
                     <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                     <p className="text-xs text-emerald-400 leading-relaxed">Al guardar con Fecha de Recepción, esta orden se marcará como <b>CLOSED</b> y el inventario del producto se <b>aumentará automáticamente</b>.</p>
                   </div>
                 )}
                 <button type="submit" disabled={isSavingPhase2} className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-sky-900 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg flex justify-center items-center">
                    {isSavingPhase2 ? 'Actualizando...' : 'Guardar FASE 2'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                     stock: 0, // Stock will be added by the purchase logic when CLOSED
                     minStockAlert: 5,
                     category: newProductData.category,
                     imageBase64: base64,
                     createdAt: Date.now(),
                     updatedAt: Date.now()
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
                     platform: purchaseData.platform,
                     shippingChannel: purchaseData.shippingChannel,
                     shippingModality: purchaseData.shippingMode,
                     orderNumber: purchaseData.orderNumber,
                     financing: purchaseData.financing,
                     estimatedWeight: purchaseData.estimatedWeight,
                     status: 'OPEN',
                     stockAdded: false,
                     currency: 'USD',
                     exchangeRate: 36.6243, // Defaulting if not handled dynamically here
                     items: [{
                       id: purchaseData.itemId,
                       name: purchaseData.description,
                       sku: 'REF', // simplified for this UI
                       cost: purchaseData.unitCost,
                       quantity: purchaseData.quantity,
                       color: purchaseData.color,
                     }],
                     totalCost: purchaseData.unitCost * purchaseData.quantity
                   };
                   
                   // Clean up undefined fields
                   Object.keys(purchase).forEach(key => purchase[key as keyof typeof purchase] === undefined && delete purchase[key as keyof typeof purchase]);
                   purchase.items.forEach(item => {
                     Object.keys(item).forEach(key => item[key as keyof typeof item] === undefined && delete item[key as keyof typeof item]);
                   });

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
