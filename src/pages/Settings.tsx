import React, { useState, useEffect } from 'react';
import { useStoreData } from '../hooks/useStoreData';
import { CompanyInfo } from '../types';
import { fileToBase64, compressImage } from '../lib/utils';
import { Settings as SettingsIcon, Save, Upload, Building2, Phone, Mail, MapPin } from 'lucide-react';

export default function Settings() {
  const { companyInfo, updateCompanyInfo, loading } = useStoreData();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Omit<CompanyInfo, 'ownerId'>>({
    name: 'PandaStore',
    phone: '+505 8372 5528',
    address: 'Camino de Oriente, Detrás de INISER en Colectivo Dreamy',
    email: 'pandastorenic@gmail.com',
    logoBase64: '',
    defaultExchangeRate: 36.6243, // Pilar 4: Tasa congelada
  });

  useEffect(() => {
    if (companyInfo) {
      setFormData({
        name: companyInfo.name,
        phone: companyInfo.phone,
        address: companyInfo.address,
        email: companyInfo.email,
        logoBase64: companyInfo.logoBase64,
        defaultExchangeRate: companyInfo.defaultExchangeRate || 36.6243,
      });
    }
  }, [companyInfo]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const rawBase64 = await fileToBase64(file);
        const compressed = await compressImage(rawBase64, 400, 400, 0.8);
        setFormData(prev => ({ ...prev, logoBase64: compressed }));
      } catch (error) {
        console.error('Error processing image:', error);
        alert('Error processing image. Please try again.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateCompanyInfo(formData);
      alert('Configuración guardada correctamente.');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error al guardar la configuración.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="text-zinc-500 p-8">Cargando configuración...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-lg">
        <div className="p-2 bg-sky-500/10 rounded-lg">
          <SettingsIcon className="w-6 h-6 text-sky-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Configuración de la Empresa</h2>
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Personaliza los datos que aparecen en tus facturas</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-zinc-800">
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" /> Nombre de la Empresa
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" /> Teléfono de Contacto
                </label>
                <input
                  required
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> Dirección Fiscal
              </label>
              <textarea
                required
                rows={3}
                value={formData.address}
                onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> Correo Electrónico
              </label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-medium"
              />
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-zinc-400 uppercase">Configuración Fiscal</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase flex items-center gap-2">
                    Tasa de Cambio Oficial (USD a NIO)
                  </label>
                  <input
                    required
                    type="number"
                    step="0.0001"
                    min="1"
                    value={formData.defaultExchangeRate}
                    onChange={e => setFormData(p => ({ ...p, defaultExchangeRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-medium"
                  />
                  <p className="text-[10px] text-zinc-500">Tasa de cambio del BCN congelada por ley (Ej. 36.6243).</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-zinc-400 uppercase">Logo de la Empresa</label>
              <div className="flex items-start gap-6">
                <div className="w-40 h-40 bg-zinc-800 rounded-2xl border-2 border-dashed border-zinc-700 flex items-center justify-center overflow-hidden group relative">
                  {formData.logoBase64 ? (
                    <img src={formData.logoBase64} alt="Preview" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Building2 className="w-12 h-12 text-zinc-600" />
                  )}
                  <label className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all">
                    <Upload className="w-6 h-6 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-zinc-300 font-medium">Sube el logo de tu tienda</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Se recomienda una imagen en formato PNG o JPG con fondo transparente o blanco. 
                    El sistema comprimirá la imagen automáticamente para optimizar el rendimiento.
                  </p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-bold text-zinc-200 hover:bg-zinc-700 cursor-pointer transition-all">
                    <Upload className="w-3.5 h-3.5" /> Seleccionar Archivo
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-zinc-800/20 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/10 disabled:opacity-50"
            >
              {isSaving ? (
                <>Procesando...</>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar Configuración
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
