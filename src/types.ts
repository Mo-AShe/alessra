export type UserRole = 'admin' | 'employee';

export interface User {
  id: number;
  email: string;
  password?: string;
  name: string;
  role: string;
  roleCode: UserRole;
  permissions: string[];
  status?: 'active' | 'inactive';
}

export interface UserSession {
  user: User;
  loginTime: string;
}

export interface Product {
  id: number;
  name: string;
  code: string;
  category: 'pipes' | 'fittings' | 'valves' | 'pumps' | 'materials' | 'tools' | string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  totalPurchases: number;
  paid: number;
  status: 'paid' | 'partial' | 'unpaid' | 'overdue';
}

export interface Transaction {
  id: number;
  invoiceNo: string;
  time: string;
  date: string;
  customerName: string;
  productName: string;
  amount: number;
  status: 'done' | 'pending' | 'canceled';
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  category: string;
  maxStock: number;
}

export interface ShopSettings {
  shop: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  invoice: {
    start: number;
    discount: number;
    tax: number;
    copies: number;
    showTax: boolean;
    showDiscount: boolean;
  };
  currency: string;
  dateFormat: string;
  timezone: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export type ViewPage = 'dashboard' | 'inventory' | 'pos' | 'customers' | 'reports' | 'settings' | 'profile';
