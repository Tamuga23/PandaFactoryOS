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
  createdAt: number;
  updatedAt: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Sale {
  id: string;
  date: number;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  discount?: number;
  shipping?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  transport?: string;
  invoiceNumber: string;
  ownerId: string;
  status: 'completed' | 'returned' | 'cancelled';
}

export interface PurchaseItem {
  id: string;
  name: string;
  sku: string;
  cost: number;
  quantity: number;
}

export interface Purchase {
  id: string;
  date: number;
  supplier: string;
  notes?: string;
  items: PurchaseItem[];
  totalCost: number;
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
}
