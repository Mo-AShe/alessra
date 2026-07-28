import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Customer,
  Transaction,
  User,
  ShopSettings,
  UserSession,
  ToastMessage,
  ViewPage,
  CartItem
} from '../types';
import {
  initialProducts,
  initialCustomers,
  initialTransactions,
  initialUsers,
  initialSettings
} from '../data/initialData';

interface StoreContextType {
  currentUserSession: UserSession | null;
  currentPage: ViewPage;
  setCurrentPage: (page: ViewPage) => void;
  products: Product[];
  customers: Customer[];
  transactions: Transaction[];
  users: User[];
  settings: ShopSettings;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  // Product actions
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: number) => void;
  // Customer actions
  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: number) => void;
  // POS Checkout
  processCheckout: (cart: CartItem[], discount: number, selectedCustomerId?: number) => { success: boolean; invoiceNo: string };
  // User actions
  addUser: (user: Omit<User, 'id'>) => boolean;
  updateUser: (user: User) => boolean;
  toggleUserStatus: (id: number) => void;
  // Settings actions
  updateSettings: (newSettings: ShopSettings) => void;
  resetSettingsToDefault: () => void;
  // Profile
  updateUserProfile: (name: string, phone: string) => void;
  changeUserPassword: (currentPass: string, newPass: string) => Promise<boolean>;
  // Data Refresh
  refreshStoreData: () => void;
  // Import/Export
  importStoreData: (data: any) => boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation State
  const [currentPage, setCurrentPage] = useState<ViewPage>('dashboard');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Session State
  const [currentUserSession, setCurrentUserSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('userSession');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null; // No auto-login; user must authenticate via /api/login.
  });

  // Data States
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [settings, setSettings] = useState<ShopSettings>(initialSettings);
  const [users, setUsers] = useState<User[]>(initialUsers);

  // Fetch data from FastAPI + Supabase backend
  const loadDataFromBackend = async () => {
    try {
      // 1. Trigger Seed if needed
      await fetch('/api/seed', { method: 'POST' }).catch(() => {});

      // 2. Fetch Products
      const prodRes = await fetch('/api/products');
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        if (Array.isArray(prodData)) {
          setProducts(prodData);
        }
      }

      // 3. Fetch Customers
      const custRes = await fetch('/api/customers');
      if (custRes.ok) {
        const custData = await custRes.json();
        if (Array.isArray(custData)) {
          setCustomers(custData);
        }
      }

      // 4. Fetch Transactions
      const txRes = await fetch('/api/transactions');
      if (txRes.ok) {
        const txData = await txRes.json();
        if (Array.isArray(txData)) {
          setTransactions(txData);
        }
      }

      // 5. Fetch Settings
      const setRes = await fetch('/api/settings');
      if (setRes.ok) {
        const setLocalData = await setRes.json();
        if (setLocalData && setLocalData.shop) {
          setSettings(setLocalData);
        }
      }

      // 6. Fetch Users
      const userRes = await fetch('/api/users');
      if (userRes.ok) {
        const userData = await userRes.json();
        if (Array.isArray(userData) && userData.length > 0) {
          setUsers(userData);
        }
      }
    } catch (err) {
      console.warn('Backend sync warning, using local state:', err);
    }
  };

  useEffect(() => {
    loadDataFromBackend();
  }, []);

  // Login handler — now async and backed by a real /api/login call.
  // The backend verifies the password against a bcrypt hash; we only
  // trust what the server returns.
  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          const session: UserSession = {
            user: data.user,
            loginTime: new Date().toISOString()
          };
          setCurrentUserSession(session);
          localStorage.setItem('userSession', JSON.stringify(session));
          showToast(`مرحباً بك ${data.user.name}! تم تسجيل الدخول بنجاح`, 'success');
          setCurrentPage('dashboard');
          return true;
        }
        return false;
      }

      // Server returned 401 / 403 / etc. Surface the Arabic error message.
      let msg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      try {
        const err = await res.json();
        if (err && err.detail) msg = err.detail;
      } catch {}
      showToast(`❌ ${msg}`, 'error');
      return false;
    } catch (e) {
      console.error('login failed', e);
      showToast('⚠️ تعذر الاتصال بالخادم، حاول مرة أخرى', 'error');
      return false;
    }
  };

  const logout = () => {
    setCurrentUserSession(null);
    localStorage.removeItem('userSession');
    showToast('تم تسجيل الخروج', 'info');
  };

  // Product Actions
  const addProduct = async (p: Omit<Product, 'id'>) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
      if (res.ok) {
        const created = await res.json();
        setProducts((prev) => [created, ...prev]);
        showToast(`✅ تم إضافة المنتج "${created.name}" في قاعدة البيانات بنجاح`, 'success');
        return;
      }
    } catch (e) {}

    // Fallback local
    const newId = products.length > 0 ? Math.max(...products.map((item) => item.id)) + 1 : 1;
    const newProduct: Product = { ...p, id: newId };
    setProducts((prev) => [newProduct, ...prev]);
    showToast(`✅ تم إضافة المنتج "${newProduct.name}" بنجاح`, 'success');
  };

  const updateProduct = async (updated: Product) => {
    try {
      const res = await fetch(`/api/products/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const newProduct = await res.json();
        setProducts((prev) => prev.map((p) => (p.id === newProduct.id ? newProduct : p)));
        showToast(`✅ تم تحديث بيانات المنتج "${newProduct.name}"`, 'success');
        return;
      }
    } catch (e) {}

    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    showToast(`✅ تم تحديث بيانات المنتج "${updated.name}"`, 'success');
  };

  const deleteProduct = async (id: number) => {
    const target = products.find((p) => p.id === id);
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
    } catch (e) {}
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast(`🗑️ تم حذف المنتج "${target?.name || ''}"`, 'info');
  };

  // Customer Actions
  const addCustomer = async (c: Omit<Customer, 'id'>) => {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c)
      });
      if (res.ok) {
        const created = await res.json();
        setCustomers((prev) => [created, ...prev]);
        showToast(`👤 تم إضافة العميل "${created.name}" بنجاح`, 'success');
        return;
      }
    } catch (e) {}

    const newId = customers.length > 0 ? Math.max(...customers.map((item) => item.id)) + 1 : 1;
    const newCust: Customer = { ...c, id: newId };
    setCustomers((prev) => [newCust, ...prev]);
    showToast(`👤 تم إضافة العميل "${newCust.name}" بنجاح`, 'success');
  };

  const updateCustomer = async (updated: Customer) => {
    try {
      const res = await fetch(`/api/customers/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const created = await res.json();
        setCustomers((prev) => prev.map((c) => (c.id === created.id ? created : c)));
        showToast(`✅ تم تحديث بيانات العميل "${created.name}"`, 'success');
        return;
      }
    } catch (e) {}

    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    showToast(`✅ تم تحديث بيانات العميل "${updated.name}"`, 'success');
  };

  const deleteCustomer = async (id: number) => {
    const target = customers.find((c) => c.id === id);
    try {
      await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    } catch (e) {}
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    showToast(`🗑️ تم حذف العميل "${target?.name || ''}"`, 'info');
  };

  // POS Checkout Process
  const processCheckout = (cart: CartItem[], discount: number, selectedCustomerId?: number) => {
    if (cart.length === 0) {
      showToast('⚠️ السلة فارغة!', 'error');
      return { success: false, invoiceNo: '' };
    }

    // Call FastAPI Checkout async
    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart, discount, selectedCustomerId })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          loadDataFromBackend();
        }
      })
      .catch(() => {});

    // Immediate local optimistic state update
    const nextInvoiceNum = settings.invoice.start + transactions.length;
    const invoiceNo = `INV-${String(nextInvoiceNum).padStart(3, '0')}`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toISOString().slice(0, 10);

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const totalAmount = Math.max(0, subtotal - discount);

    // 1. Deduct Product Stock
    setProducts((prev) =>
      prev.map((p) => {
        const cartItem = cart.find((ci) => ci.id === p.id);
        if (cartItem) {
          return {
            ...p,
            stock: Math.max(0, p.stock - cartItem.qty)
          };
        }
        return p;
      })
    );

    // 2. Add New Transaction
    const customerObj = customers.find((c) => c.id === selectedCustomerId);
    const custName = customerObj ? customerObj.name : 'عميل نقدي';

    const newTx: Transaction = {
      id: Date.now(),
      invoiceNo,
      time: timeStr,
      date: dateStr,
      customerName: custName,
      productName: cart.length > 1 ? `${cart[0].name} +${cart.length - 1}` : cart[0].name,
      amount: totalAmount,
      status: 'done'
    };

    setTransactions((prev) => [newTx, ...prev]);

    // 3. Update customer purchase if applicable
    if (customerObj) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerObj.id
            ? {
                ...c,
                totalPurchases: c.totalPurchases + totalAmount,
                paid: c.paid + totalAmount,
                status: c.totalPurchases + totalAmount === c.paid + totalAmount ? 'paid' : c.status
              }
            : c
        )
      );
    }

    showToast(`✅ تم إصدار الفاتورة #${invoiceNo} وحفظها بنجاح!`, 'success');
    return { success: true, invoiceNo };
  };

  // User management
  const addUser = (u: Omit<User, 'id'>): boolean => {
    if (users.some((user) => user.email === u.email)) {
      showToast('⚠️ البريد الإلكتروني مستخدم بالفعل', 'error');
      return false;
    }

    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(u)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.id) {
          setUsers((prev) => [...prev.filter((user) => user.id !== data.id), data]);
        }
      })
      .catch(() => {});

    const newId = users.length > 0 ? Math.max(...users.map((item) => item.id)) + 1 : 1;
    const newUser: User = { ...u, id: newId, status: 'active' };
    setUsers((prev) => [...prev, newUser]);
    showToast(`✅ تم إضافة المستخدم "${newUser.name}" بنجاح`, 'success');
    return true;
  };

  const updateUser = (u: User): boolean => {
    if (users.some((user) => user.email === u.email && user.id !== u.id)) {
      showToast('⚠️ البريد الإلكتروني مستخدم بالفعل', 'error');
      return false;
    }

    fetch(`/api/users/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(u)
    }).catch(() => {});

    setUsers((prev) => prev.map((user) => (user.id === u.id ? u : user)));
    showToast(`✅ تم تحديث بيانات المستخدم "${u.name}"`, 'success');
    return true;
  };

  const toggleUserStatus = (id: number) => {
    const target = users.find((u) => u.id === id);
    const nextStatus = target?.status === 'active' ? 'inactive' : 'active';

    fetch(`/api/users/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus })
    }).catch(() => {});

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          showToast(`🔄 تم تغيير حالة ${u.name} إلى ${nextStatus === 'active' ? 'نشط' : 'غير نشط'}`, 'info');
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  // Settings
  const updateSettings = async (newSettings: ShopSettings) => {
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
    } catch (e) {}

    setSettings(newSettings);
    showToast('✅ تم حفظ الإعدادات بنجاح!', 'success');
  };

  const resetSettingsToDefault = () => {
    setSettings(initialSettings);
    setUsers(initialUsers);
    showToast('🔄 تم استعادة الإعدادات الافتراضية', 'info');
  };

  // Profile update
  const updateUserProfile = (name: string, phone: string) => {
    if (!currentUserSession) return;

    fetch(`/api/users/${currentUserSession.user.id}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone })
    }).catch(() => {});

    const updatedUser = { ...currentUserSession.user, name };
    const updatedSession = { ...currentUserSession, user: updatedUser };
    setCurrentUserSession(updatedSession);
    localStorage.setItem('userSession', JSON.stringify(updatedSession));
    localStorage.setItem('userPhone', phone);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    showToast('✅ تم حفظ بيانات الملف الشخصي بنجاح!', 'success');
  };

  const changeUserPassword = async (currentPass: string, newPass: string): Promise<boolean> => {
    if (!currentUserSession) {
      showToast('❌ يجب تسجيل الدخول أولاً', 'error');
      return false;
    }
    if (!newPass || newPass.length < 4) {
      showToast('⚠️ كلمة المرور الجديدة قصيرة جداً (4 أحرف على الأقل)', 'error');
      return false;
    }

    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUserSession.user.email,
          currentPassword: currentPass,
          newPassword: newPass
        })
      });

      if (!res.ok) {
        let msg = 'كلمة المرور الحالية غير صحيحة';
        try {
          const err = await res.json();
          if (err && err.detail) msg = err.detail;
        } catch {}
        showToast(`❌ ${msg}`, 'error');
        return false;
      }

      // Server confirmed the password is changed. Update local session so
      // the user stays logged in with the new credential reference.
      const updatedUser = { ...currentUserSession.user, password: newPass };
      const updatedSession = { ...currentUserSession, user: updatedUser };
      setCurrentUserSession(updatedSession);
      localStorage.setItem('userSession', JSON.stringify(updatedSession));
      setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      showToast('✅ تم تغيير كلمة المرور بنجاح!', 'success');
      return true;
    } catch (e) {
      console.error('change password failed', e);
      showToast('⚠️ تعذر الاتصال بالخادم، حاول مرة أخرى', 'error');
      return false;
    }
  };

  const refreshStoreData = () => {
    showToast('🔄 جاري تحديث البيانات...', 'info');
    loadDataFromBackend().then(() => {
      showToast('✅ تم تحديث بيانات المتجر بنجاح!', 'success');
    });
  };

  const importStoreData = (data: any): boolean => {
    try {
      if (data.products) setProducts(data.products);
      if (data.customers) setCustomers(data.customers);
      if (data.transactions) setTransactions(data.transactions);
      if (data.settings) setSettings(data.settings);
      if (data.users) setUsers(data.users);
      showToast('📥 تم استيراد بيانات المتجر بنجاح!', 'success');
      return true;
    } catch (e) {
      showToast('⚠️ خطأ في تنسيق ملف البيانات', 'error');
      return false;
    }
  };

  return (
    <StoreContext.Provider
      value={{
        currentUserSession,
        currentPage,
        setCurrentPage,
        products,
        customers,
        transactions,
        users,
        settings,
        toasts,
        showToast,
        removeToast,
        login,
        logout,
        addProduct,
        updateProduct,
        deleteProduct,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        processCheckout,
        addUser,
        updateUser,
        toggleUserStatus,
        updateSettings,
        resetSettingsToDefault,
        updateUserProfile,
        changeUserPassword,
        refreshStoreData,
        importStoreData
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
