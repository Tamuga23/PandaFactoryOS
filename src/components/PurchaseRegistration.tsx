import React, { useState, useMemo } from 'react';
import { Plus, Trash2, ShoppingBag, Search, Tag, Image as ImageIcon, Loader2 } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { Product } from '../types';

interface PurchaseRegistrationProps {
  inventory: Product[];
  onAddProduct: (productData: any) => Promise<string>;
  onAddPurchase: (purchaseData: any) => Promise<void>;
  onSuccess?: () => void;
  onCancel: () => void;
}

const DEFAULT_SUPPLIERS = ['Amazon', 'AliExpress', 'eBay', 'Alibaba'];
const PLATFORMS = ['AliExpress', 'Amazon', 'eBay', 'Alibaba'];
const SHIPPING_CHANNELS = ['Correos', 'AWBOX', 'Tetraigodetodo'];
const SHIPPING_MODES = ['Sea Cargo', 'Air Cargo'];

export default function PurchaseRegistration({
  inventory,
  onAddProduct,
  onAddPurchase,
  onSuccess,
  onCancel
}: PurchaseRegistrationProps) {
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCustomSupplier, setIsCustomSupplier] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    itemId: '',
    description: '',
    color: '', // NEW
    unitCost: 0,
    quantity: 1,
    supplier: DEFAULT_SUPPLIERS[0],
    platform: PLATFORMS[0],
    shippingChannel: SHIPPING_CHANNELS[0],
    shippingMode: SHIPPING_MODES[0],
    acquisitionDate: new Date().toISOString().split('T')[0],
    orderNumber: '', // NEW
    financing: '', // NEW
    estimatedWeight: '', // NEW
    catalogPriceUSD: 0,
    category: '',
    imageFile: null as File | null,
    imagePreview: ''
  });

  const uniqueCategories = useMemo(() => {
    const categories = new Set(inventory.map((item) => item.category).filter(Boolean));
    return Array.from(categories);
  }, [inventory]);

  const handleToggleProductMode = (isNew: boolean) => {
    setIsNewProduct(isNew);
    setFormData((prev) => ({
      ...prev,
      itemId: '',
      description: '',
      catalogPriceUSD: 0,
      category: uniqueCategories[0] || '',
      imageFile: null,
      imagePreview: ''
    }));
    setFeedback(null);
  };

  const handleExistingItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const selectedItem = inventory.find((item) => item.id === id);
    setFormData((prev) => ({
      ...prev,
      itemId: id,
      description: selectedItem ? selectedItem.name : ''
    }));
  };

  const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'CUSTOM') {
      setIsCustomSupplier(true);
      setFormData((prev) => ({ ...prev, supplier: '' }));
    } else {
      setFormData((prev) => ({ ...prev, supplier: val }));
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'CUSTOM') {
      setIsCustomCategory(true);
      setFormData((prev) => ({ ...prev, category: '' }));
    } else {
      setFormData((prev) => ({ ...prev, category: val }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      imageFile: null,
      imagePreview: ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      let finalItemId = formData.itemId;

      if (isNewProduct) {
        if (!formData.description || !formData.category) {
          throw new Error('Description and Category are required for new products.');
        }

        const newProductData = {
          name: formData.description, // Mapping to Product.name
          description: formData.description,
          price: formData.catalogPriceUSD * 36.6, // Store default price in NIO based on provided USD assuming 36.6 exchange
          cost: formData.unitCost * 36.6, // Cost in NIO
          category: formData.category,
          status: 'Activo',
          imageFile: formData.imageFile,
          stock: formData.quantity,
          sku: `SKU-${Math.floor(Math.random() * 10000)}`
        };

        const newId = await onAddProduct(newProductData);
        finalItemId = newId;
      }

      if (!finalItemId) {
        throw new Error('Please select an existing item or create a new one to proceed.');
      }

      // Record Purchase (We adapt this to the schema expected by onAddPurchase in useStoreData later)
      const purchaseData = {
        itemId: finalItemId,
        description: formData.description,
        color: formData.color,
        unitCost: formData.unitCost,
        quantity: formData.quantity,
        supplier: formData.supplier,
        platform: formData.platform,
        shippingChannel: formData.shippingChannel,
        shippingMode: formData.shippingMode,
        orderNumber: formData.orderNumber,
        financing: formData.financing,
        estimatedWeight: formData.estimatedWeight ? Number(formData.estimatedWeight) : undefined,
        date: new Date(formData.acquisitionDate).getTime(),
      };

      await onAddPurchase(purchaseData);

      setFeedback({ message: 'Purchase successfully registered!', type: 'success' });
      
      // Reset form
      setFormData({
        ...formData,
        itemId: '',
        description: '',
        unitCost: 0,
        quantity: 1,
        catalogPriceUSD: 0,
        imageFile: null,
        imagePreview: ''
      });
      setIsNewProduct(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      setFeedback({ message: error.message || 'An error occurred during submission.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
      <div className="p-4 border-b border-zinc-700 flex justify-between items-center bg-zinc-800/50">
        <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-sky-400" /> Nuevo Registro de Compra
        </h3>
        <button onClick={onCancel} className="text-zinc-400 hover:text-white">✕</button>
      </div>

      <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
        {feedback && (
          <div className={`p-4 mb-6 rounded-xl border ${feedback.type === 'success' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
            {feedback.message}
          </div>
        )}

        <div className="flex gap-2 p-1 bg-zinc-800 rounded-xl w-fit mb-8">
            <button
              onClick={() => handleToggleProductMode(false)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${!isNewProduct ? 'bg-sky-500 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Artículo Existente
            </button>
            <button
              onClick={() => handleToggleProductMode(true)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isNewProduct ? 'bg-sky-500 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Nuevo Artículo
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-800/30 p-6 rounded-xl border border-zinc-800">
             
            {!isNewProduct ? (
              <>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Seleccionar Artículo del Inventario</label>
                  <select
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                    value={formData.itemId}
                    onChange={handleExistingItemChange}
                    required
                  >
                    <option value="">-- Seleccionar --</option>
                    {inventory.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.sku} - {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Descripción del Artículo (Solo lectura)</label>
                  <input
                    type="text"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-400 cursor-not-allowed outline-none"
                    value={formData.description}
                    readOnly
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Nombre / Descripción del Nuevo Artículo</label>
                  <input
                    type="text"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Categoría</label>
                  {isCustomCategory ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="Escribe la categoría"
                        required
                      />
                      <button type="button" onClick={() => setIsCustomCategory(false)} className="px-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-zinc-200 text-xs font-bold transition-colors">Volver</button>
                    </div>
                  ) : (
                    <select
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                      value={formData.category}
                      onChange={handleCategoryChange}
                      required
                    >
                      <option value="">-- Seleccionar --</option>
                      {uniqueCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="CUSTOM" className="font-bold text-sky-400">+ Agregar nueva categoría</option>
                    </select>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider text-cyan-400">Precio Venta Catálogo (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                    value={formData.catalogPriceUSD || ''}
                    onChange={(e) => setFormData({ ...formData, catalogPriceUSD: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                   <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Imagen del Producto</label>
                   {formData.imagePreview ? (
                      <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-zinc-600">
                        <img src={formData.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={removeImage} className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full"><Trash2 className="w-4 h-4"/></button>
                      </div>
                   ) : (
                      <div className="flex items-center justify-center w-full">
                          <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-700 border-dashed rounded-xl cursor-pointer bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <ImageIcon className="w-8 h-8 mb-3 text-zinc-500" />
                                  <p className="mb-2 text-sm text-zinc-400"><span className="font-semibold text-sky-400">Click para subir</span> o arrastra y suelta</p>
                              </div>
                              <input id="dropzone-file" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                          </label>
                      </div>
                   )}
                </div>
              </>
            )}
            
            <div className="col-span-1 md:col-span-2 h-px bg-zinc-700/50 my-2"></div>

            {/* Common Fields */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider text-rose-400">Costo Unitario (USD)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                value={formData.unitCost || ''}
                onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider text-sky-400">Cantidad Recibida</label>
              <input
                type="number"
                min="1"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                value={formData.quantity || ''}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Color (Opcional)</label>
              <input
                type="text"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 outline-none"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Ej. Negro, Azul"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">No. Orden (Opcional)</label>
              <input
                type="text"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 outline-none"
                value={formData.orderNumber}
                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                placeholder="Ej. 114-1234567-890"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Financiación</label>
              <select
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 outline-none"
                value={formData.financing}
                onChange={(e) => setFormData({ ...formData, financing: e.target.value })}
              >
                <option value="">-- Seleccionar --</option>
                <option value="Fondos Propios">Fondos Propios</option>
                <option value="Tarjeta Socio A">Tarjeta Socio A</option>
                <option value="Tarjeta B">Tarjeta B</option>
                <option value="Crédito Proveedor">Crédito Proveedor</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Peso Estimado (lbs)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 outline-none"
                value={formData.estimatedWeight}
                onChange={(e) => setFormData({ ...formData, estimatedWeight: e.target.value })}
                placeholder="Ej. 2.5"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Proveedor</label>
              {isCustomSupplier ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Nombre del proveedor"
                    required
                  />
                  <button type="button" onClick={() => setIsCustomSupplier(false)} className="px-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-zinc-200 text-xs font-bold transition-colors">Volver</button>
                </div>
              ) : (
                <select
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                  value={formData.supplier}
                  onChange={handleSupplierChange}
                  required
                >
                  {DEFAULT_SUPPLIERS.map((sup) => (
                    <option key={sup} value={sup}>{sup}</option>
                  ))}
                  <option value="CUSTOM" className="font-bold text-sky-400">+ Agregar nuevo proveedor</option>
                </select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Plataforma</label>
              <select
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 outline-none"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              >
                {PLATFORMS.map((plat) => <option key={plat} value={plat}>{plat}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Fecha de Adquisición</label>
              <input
                type="date"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 outline-none"
                value={formData.acquisitionDate}
                onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Canal de Envío</label>
              <select
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 outline-none"
                value={formData.shippingChannel}
                onChange={(e) => setFormData({ ...formData, shippingChannel: e.target.value })}
              >
                {SHIPPING_CHANNELS.map((ch) => <option key={ch} value={ch}>{ch}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Modalidad</label>
              <select
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 outline-none"
                value={formData.shippingMode}
                onChange={(e) => setFormData({ ...formData, shippingMode: e.target.value })}
              >
                {SHIPPING_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

          </div>

          <div className="pt-4 border-t border-zinc-700">
             <button
               type="submit"
               disabled={isSubmitting || (!isNewProduct && !formData.itemId)}
               className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-900 disabled:text-cyan-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex justify-center items-center gap-2"
             >
               {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
               {isSubmitting 
                  ? 'Procesando...' 
                  : isNewProduct ? 'Crear Producto y Registrar Orden' : 'Registrar Orden de Compra'
               }
             </button>
          </div>

        </form>
      </div>
    </div>
  );
}
