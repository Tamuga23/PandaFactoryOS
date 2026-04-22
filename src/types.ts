export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  stock: number;
  minStockAlert: number;
  category: string;
  imageBase64?: string;
  isReordering?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CartItem extends Product {
  quantity: number;
  serialNumbers?: string[]; // Pilar 1: Seriales/IMEI para electrónicos
}

export interface Sale {
  id: string;
  date: number;
  items: CartItem[];
  subtotal: number;
  tax: number; // Pilar 1: Generalmente 0 para Cuota Fija
  total: number;
  discount?: number;
  shipping?: number;
  
  // Pilar 1: Identificación y Documentos
  documentType: 'RECIBO_OFICIAL' | 'PROFORMA';
  clientDocumentType: 'CEDULA' | 'RUC' | 'PASAPORTE' | 'NINGUNO';
  clientDocumentNumber?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  transport?: string;
  invoiceNumber: string;
  
  // Pilar 1: Moneda y Pagos
  currency: 'NIO' | 'USD';
  exchangeRate: number;
  paymentMethod: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'CREDITO';
  paymentReference?: string;
  notes?: string;
  
  ownerId: string;
  status: 'completed' | 'returned' | 'cancelled';
}

export interface PurchaseItem {
  id: string;
  name: string;
  sku: string;
  cost: number;
  quantity: number;
  color?: string;
  serialNumbers?: string[]; // Pilar 1: Seriales para ingresos
}

export type PurchaseStatus = 'OPEN' | 'CLOSED';
export type ShippingModality = 'Sea Cargo' | 'Air Cargo';

export interface Purchase {
  id: string;
  date: number;
  supplier: string;
  platform?: string;
  notes?: string;
  items: PurchaseItem[];
  totalCost: number;
  
  // Logistics Level 1 (Order)
  shippingChannel?: string;
  shippingModality?: ShippingModality;
  orderNumber?: string;
  financing?: string;
  estimatedWeight?: number;
  
  // Logistics Level 2 (Tracking & Reception)
  trackingId?: string;
  trackingStatus?: string;
  agentDeliveryDate?: number;
  receptionDate?: number;
  finalWeight?: number;

  status: PurchaseStatus;
  stockAdded: boolean;
  
  // Pilar 1: Moneda en compras
  currency: 'NIO' | 'USD';
  exchangeRate: number;
  
  ownerId: string;
  invoiceNumber?: string;
}

export interface CompanyInfo {
  name: string;
  phone: string;
  address: string;
  email: string;
  logoBase64?: string;
  ownerId: string;
  defaultExchangeRate: number; // Pilar 4: Tasa de cambio congelada (ej. 36.6243)
}

export interface DashboardStats {
  totalProducts: number;
  totalStockValue: number;
  lowStockItems: Product[];
  recentSales: Sale[];
  totalSalesValue: number;
}

export interface ClientData {
  fullName: string;
  address: string;
  phone: string;
  transport: string;
  clientDocumentType?: string;
  clientDocumentNumber?: string;
}
