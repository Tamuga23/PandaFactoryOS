import React, { useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import * as htmlToImage from 'html-to-image';
import { formatCurrency } from '../lib/utils';
import { Download, X, Loader2 } from 'lucide-react';

export interface InvoiceItem {
  id: string;
  productName: string;
  quantity: number;
  priceNIO: number;
  priceUSD: number;
  image?: string;
  sku?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  client: {
    fullName: string;
    address: string;
    phone: string;
    transport: string;
  };
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  };
  items: InvoiceItem[];
  shippingCostNIO: number;
  discountNIO: number;
  customNote: string;
  warrantyText: string;
  mainLogo?: string;
}

interface InvoicePreviewProps {
  data: InvoiceData;
  isOpen: boolean;
  onClose: () => void;
}

const PAGE_HEIGHT_LIMIT = 980;
const HEADER_HEIGHT = 340;
const FOOTER_HEIGHT = 310;
const TABLE_HEADER_HEIGHT = 45;
const ITEM_WITH_IMAGE_HEIGHT = 125;
const ITEM_WITHOUT_IMAGE_HEIGHT = 65;

export default function InvoicePreview({ data, isOpen, onClose }: InvoicePreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Lógica de paginación matemática estricta
  const pages: { items: InvoiceItem[]; showHeader: boolean; showFooter: boolean }[] = [];
  let currentPageItems: InvoiceItem[] = [];
  let currentPageHeight = HEADER_HEIGHT + TABLE_HEADER_HEIGHT;
  let isFirstPage = true;

  data.items.forEach((item) => {
    const itemHeight = item.image ? ITEM_WITH_IMAGE_HEIGHT : ITEM_WITHOUT_IMAGE_HEIGHT;
    
    if (currentPageHeight + itemHeight > PAGE_HEIGHT_LIMIT) {
      pages.push({
        items: currentPageItems,
        showHeader: isFirstPage,
        showFooter: false
      });
      isFirstPage = false;
      currentPageItems = [];
      currentPageHeight = TABLE_HEADER_HEIGHT;
    }
    
    currentPageItems.push(item);
    currentPageHeight += itemHeight;
  });

  if (currentPageHeight + FOOTER_HEIGHT <= PAGE_HEIGHT_LIMIT) {
    pages.push({
      items: currentPageItems,
      showHeader: isFirstPage,
      showFooter: true
    });
  } else {
    pages.push({
      items: currentPageItems,
      showHeader: isFirstPage,
      showFooter: false
    });
    pages.push({
      items: [],
      showHeader: false,
      showFooter: true
    });
  }

  const subtotal = data.items.reduce((acc, item) => acc + (item.priceNIO * item.quantity), 0);
  const total = subtotal + data.shippingCostNIO - data.discountNIO;

  const handleDownloadPDF = async () => {
    if (!containerRef.current) return;
    setIsGenerating(true);
    try {
      const pageElements = Array.from(containerRef.current.querySelectorAll('.invoice-page')) as HTMLElement[];
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [794, 1123],
        compress: true
      });

      for (let i = 0; i < pageElements.length; i++) {
        const dUrl = await htmlToImage.toPng(pageElements[i], {
          quality: 0.95,
          pixelRatio: 2,
        });
        
        if (i > 0) pdf.addPage([794, 1123], 'p');
        pdf.addImage(dUrl, 'PNG', 0, 0, 794, 1123);
      }

      pdf.save(`Factura_${data.invoiceNumber}.pdf`);
    } catch (err) {
      console.error('Error al generar PDF:', err);
      alert('Hubo un error al generar el PDF. Por favor, intente nuevamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-zinc-900/90 backdrop-blur-sm overflow-hidden">
      {/* Navbar modal */}
      <div className="flex-none bg-zinc-950 p-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 z-[101]">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Vista Previa de Factura
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-[#1a6ba0] hover:bg-[#1a6ba0]/90 text-white font-bold px-6 py-2.5 rounded-lg transition-all disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {isGenerating ? 'Generando PDF...' : 'Descargar PDF'}
          </button>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-rose-500 rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Pages Container scrollable */}
      <div className="flex-1 overflow-auto p-8 custom-scrollbar">
        <div ref={containerRef} className="flex flex-col items-center gap-8 pb-16 min-w-max mx-auto">
          {pages.map((page, pageIndex) => (
            <div 
              key={pageIndex} 
              className="invoice-page w-[794px] h-[1123px] p-[40px] bg-white shadow-xl relative overflow-hidden flex flex-col font-sans"
              style={{ boxSizing: 'border-box' }}
            >
              
              {/* HEADER */}
              {page.showHeader && (
                <div style={{ minHeight: `${HEADER_HEIGHT}px` }} className="w-full flex flex-col gap-6 shrink-0 relative z-10">
                  {/* Top Header Row */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-4xl font-extrabold text-[#1a6ba0] tracking-tight mb-6">Factura</h1>
                      <div className="flex items-center gap-4 text-xs font-semibold text-zinc-700">
                        <span className="w-24">Factura No #</span>
                        <span className="text-black font-bold uppercase">{data.invoiceNumber}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-semibold text-zinc-700 mt-2">
                        <span className="w-24">Fecha:</span>
                        <span className="text-black font-bold">{data.date}</span>
                      </div>
                    </div>
                    
                    {/* Logo Section */}
                    {data.companyInfo?.logo ? (
                      <div className="w-32 h-32 bg-zinc-900 rounded-2xl flex items-center justify-center p-3 shadow-md">
                        <img src={data.companyInfo.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-32 h-32 bg-zinc-900 rounded-2xl flex flex-col items-center justify-center p-3 shadow-md text-white">
                        <span className="font-bold text-[11px] uppercase tracking-widest leading-tight text-center">
                          {data.companyInfo?.name || 'STORE'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info Boxes */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Facturado Por */}
                    <div className="bg-[#dff3fa] p-5 rounded-2xl shadow-sm border border-[#a2d8ed]">
                      <h3 className="text-[10px] font-bold text-[#1a6ba0] uppercase tracking-wider mb-2">Facturado Por:</h3>
                      <p className="text-xs font-extrabold text-zinc-900 mb-1">{data.companyInfo?.name || 'Empresa'}</p>
                      <p className="text-[11px] text-zinc-600 leading-snug max-w-[90%]">
                        {data.companyInfo?.address || 'Dirección de la empresa'}
                      </p>
                      <div className="flex mt-2 text-[11px] text-zinc-700 leading-snug">
                        <span className="font-bold w-14">Correo:</span>
                        <span>{data.companyInfo?.email || 'N/A'}</span>
                      </div>
                      <div className="flex mt-1 text-[11px] text-zinc-700 leading-snug">
                        <span className="font-bold w-14">Teléfono:</span>
                        <span>{data.companyInfo?.phone || 'N/A'}</span>
                      </div>
                    </div>
                    
                    {/* Facturado A */}
                    <div className="bg-[#dff3fa] p-5 rounded-2xl shadow-sm border border-[#a2d8ed]">
                      <h3 className="text-[10px] font-bold text-[#1a6ba0] uppercase tracking-wider mb-2">Facturado A:</h3>
                      <p className="text-xs font-extrabold text-zinc-900 mb-1">{data.client.fullName.toUpperCase() || 'CLIENTE FINAL'}</p>
                      <div className="flex mt-2 text-[11px] text-zinc-700 leading-snug">
                        <span className="font-bold min-w-[60px]">Dirección:</span>
                        <span className="leading-snug line-clamp-2 pr-2">{data.client.address || 'N/A'}</span>
                      </div>
                      <p className="text-[11px] text-zinc-700 mt-1 ml-[60px] leading-snug">
                        {data.client.phone || ''}
                      </p>
                      <div className="flex mt-2 text-[11px] text-zinc-700 items-center leading-snug">
                        <span className="font-bold min-w-[65px]">Transporte:</span>
                        <span className="text-[#1a6ba0] font-bold uppercase py-0.5 px-3 border border-[#a2d8ed] bg-white rounded-full ml-1 text-[9px] tracking-wider shadow-sm">{data.client.transport || 'ENTREGA LOCAL'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* EMPTY SPACE FILLER FOR PAGES > 1 IF NEEDED */}
              {!page.showHeader && (
                <div style={{ height: '20px' }}></div>
              )}

              {/* TABLE */}
              <div className="w-full flex-1 mb-6 rounded-2xl overflow-hidden border border-[#135c7a]/20 shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#135c7a] text-white">
                    <tr style={{ height: `${TABLE_HEADER_HEIGHT}px` }}>
                      <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider text-center w-[40%]">Articulo</th>
                      <th className="px-2 py-3 text-center font-bold text-[10px] uppercase tracking-wider w-16">Cant.</th>
                      <th className="px-2 py-3 text-center font-bold text-[10px] uppercase tracking-wider w-24">Precio C$</th>
                      <th className="px-2 py-3 text-center font-bold text-[10px] uppercase tracking-wider w-24">Precio $</th>
                      <th className="px-2 py-3 text-center font-bold text-[10px] uppercase tracking-wider w-24">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {page.items.map((item, idx) => {
                      const absoluteIndex = data.items.findIndex(i => i.id === item.id) + 1;
                      const hasImage = !!item.image;
                      
                      return (
                        <React.Fragment key={item.id + idx}>
                          <tr>
                            <td colSpan={5} className="pt-4 px-4 pb-1">
                              <div className="flex items-center gap-3">
                                <span className="w-5 h-5 rounded-full bg-[#dff3fa] text-[#1a6ba0] text-[9px] font-bold flex items-center justify-center shrink-0 border border-[#a2d8ed]/50 shadow-sm">
                                  {absoluteIndex}
                                </span>
                                <span className="font-bold text-zinc-900 leading-none">{item.productName}</span>
                              </div>
                            </td>
                          </tr>
                          <tr 
                            style={{ height: `${(hasImage ? ITEM_WITH_IMAGE_HEIGHT : ITEM_WITHOUT_IMAGE_HEIGHT) - 35}px` }}
                            className="border-b border-zinc-100 last:border-0"
                          >
                            <td className="px-4 pb-4">
                              {hasImage && (
                                <div className="ml-8 w-16 h-16 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm p-1">
                                  <img src={item.image} alt="product" className="max-w-full max-h-full object-contain mix-blend-multiply rounded-lg" />
                                </div>
                              )}
                            </td>
                            <td className="px-2 pb-4 text-center font-bold text-zinc-600 align-middle">{item.quantity}</td>
                            <td className="px-2 pb-4 text-center font-bold text-zinc-600 align-middle">{formatCurrency(item.priceNIO)}</td>
                            <td className="px-2 pb-4 text-center font-bold text-zinc-600 align-middle">${item.priceUSD.toFixed(2)}</td>
                            <td className="px-2 pb-4 text-center font-bold text-[#135c7a] align-middle">
                              {formatCurrency(item.priceNIO * item.quantity)}
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

                  {/* PUSH FOOTER TO BOTTOM OF PAGE */}
                  <div className="mt-auto">
                    {/* FOOTER */}
                    {page.showFooter && (
                      <div style={{ minHeight: `${FOOTER_HEIGHT}px` }} className="w-full flex flex-col justify-end shrink-0 relative z-10 pt-4">
                         <div className="flex justify-between items-stretch gap-6 mb-8 mt-2">
                           {/* NOTE BOX */}
                           {data.customNote ? (
                             <div className="flex-1 border border-[#d2eaf4] bg-white rounded-2xl flex p-4 shadow-sm items-start gap-4">
                                <span className="bg-[#eef8fc] text-[#1a6ba0] font-bold text-[9px] px-3 py-1 rounded-full shadow-sm border border-[#d2eaf4]">NOTA</span>
                                <span className="text-[11px] italic text-zinc-600 flex-1 leading-snug mt-0.5 whitespace-pre-wrap">{data.customNote}</span>
                             </div>
                           ) : <div className="flex-1" />}

                           {/* TOTALS BOX */}
                           <div className="w-[340px] border border-zinc-100 bg-white shadow-sm p-5 rounded-2xl shrink-0">
                              <div className="space-y-4">
                                 <div className="flex justify-between items-center text-xs font-semibold text-zinc-500">
                                   <span>Monto Bruto</span>
                                   <span className="text-zinc-900">{formatCurrency(subtotal)}</span>
                                 </div>
                                 <div className="flex justify-between items-center text-xs font-semibold text-zinc-500">
                                   <span>Costo de Envío</span>
                                   <span className="text-zinc-900">{data.shippingCostNIO > 0 ? formatCurrency(data.shippingCostNIO) : 'C$0.00'}</span>
                                 </div>
                                 <div className="flex justify-between items-center text-xs font-semibold text-rose-600">
                                   <span>Descuento</span>
                                   <span>{data.discountNIO > 0 ? `-${formatCurrency(data.discountNIO)}` : '-C$0.00'}</span>
                                 </div>
                                 <div className="h-px bg-zinc-100 w-full my-3"></div>
                                 <div className="flex justify-between items-center font-extrabold uppercase mt-1">
                                   <span className="text-zinc-900 text-xs">TOTAL (C$)</span>
                                   <span className="text-[#135c7a] text-lg">{formatCurrency(total)}</span>
                                 </div>
                              </div>
                           </div>
                         </div>

                         <div className="space-y-4 text-[9px] text-zinc-600 leading-snug pb-4">
                           <div>
                             <div className="flex gap-2 items-center mb-1.5">
                               <div className="w-1.5 h-1.5 rounded-full bg-[#1a6ba0]" />
                               <h3 className="font-bold text-[#1a6ba0] text-xs tracking-wide">Pago</h3>
                             </div>
                             <div className="ml-3.5 space-y-0.5">
                               <p>1. El pago debe realizarse en su totalidad en el momento de la compra, a menos que se haya acordado un plazo de crédito por escrito.</p>
                               <p>2. Los métodos de pago aceptados son transferencia bancaria, efectivo y pago mediante Tarjeta de Credito/Debito</p>
                             </div>
                           </div>
                           <div>
                             <div className="flex gap-2 items-center mb-1.5 mt-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-[#1a6ba0]" />
                               <h3 className="font-bold text-[#1a6ba0] text-xs tracking-wide">Garantía</h3>
                             </div>
                             <div className="ml-3.5 space-y-0.5">
                               {data.warrantyText ? (
                                 data.warrantyText.split('\n').map((line, i) => <p key={i}>{line}</p>)
                               ) : (
                                 <>
                                   <p>1. Los productos vendidos por Panda Store tienen una garantía de [3] meses a partir de la fecha de compra.</p>
                                   <p>2. La garantía cubre defectos de fabricación y no incluye daños causados por mal uso o accidentes.</p>
                                 </>
                               )}
                             </div>
                           </div>
                         </div>

                      <div className="text-center text-[8px] text-zinc-400 mt-6 pt-4 border-t border-zinc-100 flex flex-col gap-1 relative pb-2">
                        <p>Generado mediante <b>PandaStore System</b></p>
                        <p>Este documento electrónico es válido sin firma autógrafa.</p>
                      </div>
                   </div>
                 )}
                 <div className="absolute bottom-6 right-10 text-[11px] font-bold text-zinc-300">
                   Página {pageIndex + 1} de {pages.length}
                 </div>
               </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
