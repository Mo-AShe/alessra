import React from 'react';
import { useStore } from '../context/StoreContext';
import { ViewPage } from '../types';

export const Sidebar: React.FC = () => {
  const { currentPage, setCurrentPage, currentUserSession, logout, products, customers } = useStore();

  const user = currentUserSession?.user;
  const isAdmin = user?.roleCode === 'admin';

  // Badges
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
  const debtCustomersCount = customers.filter((c) => c.totalPurchases - c.paid > 0).length;

  const navItems: { page: ViewPage; label: string; icon: string; adminOnly?: boolean; badge?: number; badgeColor?: string }[] = [
    { page: 'dashboard', label: 'الرئيسية', icon: 'fa-home' },
    { page: 'inventory', label: 'المخزون', icon: 'fa-boxes', adminOnly: true, badge: lowStockCount, badgeColor: 'bg-rose-500 text-white' },
    { page: 'pos', label: 'المبيعات (POS)', icon: 'fa-shopping-cart' },
    { page: 'customers', label: 'العملاء والديون', icon: 'fa-users', badge: debtCustomersCount, badgeColor: 'bg-amber-500 text-white' },
    { page: 'reports', label: 'التقارير والإحصائيات', icon: 'fa-chart-pie', adminOnly: true },
    { page: 'settings', label: 'إعدادات المتجر', icon: 'fa-cog', adminOnly: true },
    { page: 'profile', label: 'الملف الشخصي', icon: 'fa-user' },
  ];

  return (
    <aside className="w-full md:w-[240px] md:fixed md:right-0 md:top-[96px] md:h-[calc(100vh-96px)] bg-white/95 backdrop-blur-xl border-b md:border-b-0 md:border-l border-slate-200/80 shadow-md md:shadow-[-4px_0_40px_rgba(0,0,0,0.04)] py-5 px-3 flex flex-col justify-between z-40">
      <ul className="space-y-1.5 overflow-x-auto md:overflow-visible flex md:flex-col gap-1 md:gap-0 pb-2 md:pb-0">
        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          const isActive = currentPage === item.page;

          return (
            <li
              key={item.page}
              onClick={() => setCurrentPage(item.page)}
              className={`relative px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 flex-shrink-0 flex items-center justify-between ${
                isActive
                  ? 'bg-gradient-to-r from-[#1a2a6c] to-[#2a3f8f] text-white shadow-md font-bold'
                  : 'text-slate-700 hover:bg-[#1a2a6c]/5 font-semibold'
              }`}
            >
              {isActive && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-[#fdd835] rounded-l-md hidden md:block"></span>
              )}
              <div className="flex items-center gap-3.5 text-sm">
                <i className={`fas ${item.icon} w-5 text-center text-lg ${isActive ? 'text-[#fdd835]' : 'text-[#1a2a6c]'}`}></i>
                <span>{item.label}</span>
              </div>

              {item.badge && item.badge > 0 ? (
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm ${
                    isActive ? 'bg-white text-[#1a2a6c]' : item.badgeColor || 'bg-slate-200 text-slate-800'
                  }`}
                >
                  {item.badge}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>

      {/* Logout button */}
      <div className="pt-4 mt-2 border-t border-slate-100 px-3 block">
        <button
          id="btn-sidebar-logout"
          onClick={() => {
            logout();
          }}
          className="w-full text-rose-600 hover:text-rose-700 font-bold text-xs flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-rose-50 transition-all text-right cursor-pointer"
        >
          <i className="fas fa-sign-out-alt w-5 text-center text-base"></i>
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
};

