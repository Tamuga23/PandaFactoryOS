import { useState } from 'react';
import { useStoreData } from '../hooks/useStoreData';
import { Sale } from '../types';
import { formatCurrency } from '../lib/utils';
import { Calendar, User, Phone, MapPin, Trash2, Edit, CheckCircle, RotateCcw, XCircle, Search, FileText } from 'lucide-react';

export default function SalesHistory() {
  const { sales, deleteSale, updateSale, loading } = useStoreData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const filteredSales = sales.filter(s => 
    s.documentType !== 'PROFORMA' &&
    (s.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.customerName?.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => b.date - a.date);

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this sale record? This action cannot be undone and will not automatically revert stock.')) {
      await deleteSale(id);
    }
  };

  const handleStatusChange = async (sale: Sale, newStatus: Sale['status']) => {
    await updateSale({ ...sale, status: newStatus });
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setIsEditModalOpen(true);
  };

  const saveEditedSale = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSale) return;

    const formData = new FormData(e.currentTarget);
    const updatedSale: Sale = {
      ...editingSale,
      customerName: formData.get('customerName') as string,
      customerPhone: formData.get('customerPhone') as string,
      customerAddress: formData.get('customerAddress') as string,
      transport: formData.get('transport') as string,
      notes: formData.get('notes') as string,
    } as any; // Cast for custom fields if any

    await updateSale(updatedSale);
    setIsEditModalOpen(false);
    setEditingSale(null);
    alert('Sale record updated!');
  };

  if (loading) return <div className="text-zinc-500 p-8">Loading history...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 uppercase tracking-tight italic">Sales Management (CRUD)</h2>
          <p className="text-xs text-zinc-500">Edit, delete or manage sales and returns.</p>
        </div>
        <div className="relative w-full md:w-64">
           <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
           <input 
            type="text" 
            placeholder="Invoice # or Customer..." 
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 h-10 text-sm text-zinc-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredSales.map(sale => (
          <div key={sale.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg group">
            <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800/50">
               <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${
                    sale.status === 'completed' ? 'bg-cyan-500/10 text-cyan-500' :
                    sale.status === 'returned' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-rose-500/10 text-rose-500'
                  }`}>
                     <FileText className="w-6 h-6" />
                  </div>
                  <div>
                     <h4 className="font-bold text-zinc-100 flex items-center gap-2">
                       {sale.invoiceNumber}
                       <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${
                        sale.status === 'completed' ? 'bg-cyan-500/10 text-cyan-500' :
                        sale.status === 'returned' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-rose-500/10 text-rose-500'
                       }`}>
                         {sale.status || 'completed'}
                       </span>
                     </h4>
                     <p className="text-xs text-zinc-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(sale.date).toLocaleString()}
                     </p>
                  </div>
               </div>

               <div className="flex-1 md:px-8 grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="text-xs space-y-1">
                     <p className="text-zinc-500 font-bold uppercase">Customer</p>
                     <p className="text-zinc-300 flex items-center gap-1"><User className="w-3 h-3" /> {sale.customerName || 'N/A'}</p>
                     <p className="text-zinc-400 flex items-center gap-1"><Phone className="w-3 h-3" /> {sale.customerPhone || '-'}</p>
                  </div>
                  <div className="text-xs space-y-1 hidden lg:block">
                     <p className="text-zinc-500 font-bold uppercase">Location/Transp</p>
                     <p className="text-zinc-300 flex items-center gap-1"><MapPin className="w-3 h-3" /> {sale.customerAddress?.slice(0, 20)}...</p>
                     <p className="text-cyan-500 font-bold uppercase">{sale.transport}</p>
                  </div>
                  <div className="text-right flex flex-col justify-center">
                     <p className="text-zinc-500 text-[10px] font-bold uppercase">Grand Total</p>
                     <p className="text-xl font-bold text-cyan-400">{formatCurrency(sale.total)}</p>
                  </div>
               </div>

               <div className="flex items-center gap-2">
                  {/* Status Actions */}
                  <div className="flex items-center bg-zinc-800 rounded-lg p-1">
                    <button 
                      onClick={() => handleStatusChange(sale, 'completed')}
                      title="Set as Completed"
                      className={`p-1.5 rounded ${sale.status === 'completed' ? 'bg-cyan-600 text-white' : 'text-zinc-500 hover:text-cyan-400'}`}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleStatusChange(sale, 'returned')}
                      title="Set as Returned"
                      className={`p-1.5 rounded ${sale.status === 'returned' ? 'bg-amber-600 text-white' : 'text-zinc-500 hover:text-amber-400'}`}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleStatusChange(sale, 'cancelled')}
                      title="Set as Cancelled"
                      className={`p-1.5 rounded ${sale.status === 'cancelled' ? 'bg-rose-600 text-white' : 'text-zinc-500 hover:text-rose-400'}`}
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button onClick={() => handleEdit(sale)} className="p-2 text-zinc-400 hover:bg-zinc-800 hover:text-sky-400 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(sale.id)} className="p-2 text-zinc-400 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
               </div>
            </div>
            
            {/* Expanded items view */}
            <div className="px-4 py-2 bg-zinc-800/20 text-[10px] text-zinc-500 flex flex-wrap gap-x-4">
               {sale.items.map(item => (
                 <span key={item.id}>• {item.quantity}x {item.name}</span>
               ))}
            </div>
          </div>
        ))}

        {filteredSales.length === 0 && (
          <div className="p-20 text-center text-zinc-500 flex flex-col items-center gap-4">
             <FileText className="w-12 h-12 opacity-20" />
             <p className="italic">No sale records match your criteria.</p>
          </div>
        )}
      </div>

      {isEditModalOpen && editingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
             <form onSubmit={saveEditedSale}>
                <div className="p-6 border-b border-zinc-800">
                   <h3 className="text-xl font-bold text-zinc-100 italic">Edit Invoice {editingSale.invoiceNumber}</h3>
                </div>
                <div className="p-6 space-y-4">
                   <div className="space-y-1">
                      <label className="text-[10px] uppercase text-zinc-500 font-bold">Customer Name</label>
                      <input name="customerName" defaultValue={editingSale.customerName} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm text-zinc-200" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] uppercase text-zinc-500 font-bold">Phone</label>
                      <input name="customerPhone" defaultValue={editingSale.customerPhone} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm text-zinc-200" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] uppercase text-zinc-500 font-bold">Address</label>
                      <textarea name="customerAddress" defaultValue={editingSale.customerAddress} rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm text-zinc-200"></textarea>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] uppercase text-zinc-500 font-bold">Transport</label>
                      <input name="transport" defaultValue={editingSale.transport} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm text-zinc-200" />
                   </div>
                </div>
                <div className="p-6 bg-zinc-800/30 flex justify-end gap-3">
                   <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-zinc-400 hover:text-zinc-200">Cancel</button>
                   <button type="submit" className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition-all">SAVE CHANGES</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
