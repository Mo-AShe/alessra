import { Product, Customer, Transaction, User, ShopSettings } from '../types';

export const initialProducts: Product[] = [];

export const initialCustomers: Customer[] = [];

export const initialTransactions: Transaction[] = [];

// Fallback users shown only if the backend is unreachable. The `password`
// field is intentionally empty — authentication always goes through the
// server (/api/login), which verifies against a bcrypt hash. The real
// demo accounts are seeded into Supabase by POST /api/seed.
export const initialUsers: User[] = [];

export const initialSettings: ShopSettings = {
  shop: {
    name: 'محل الاسراء لأدوات السباكة',
    address: 'مصر - القاهرة - مدينة نصر',
    phone: '012-3456-7890',
    email: 'info@al-esraa.com'
  },
  invoice: {
    start: 1,
    discount: 0,
    tax: 14,
    copies: 1,
    showTax: true,
    showDiscount: true
  },
  currency: 'EGP',
  dateFormat: 'ar-EG',
  timezone: 'Africa/Cairo'
};
