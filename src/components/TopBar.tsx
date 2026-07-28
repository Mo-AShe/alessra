import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { ViewPage } from '../types';

export const TopBar: React.FC = () => {
  const { currentUserSession, logout, showToast, setCurrentPage, products, customers, transactions } = useStore();

  // Notifications State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState<string[]>([]);
  const [notifFilter, setNotifFilter] = useState<'all' | 'stock' | 'debt' | 'sales'>('all');

  const user = currentUserSession?.user;
  const userName = user?.name || 'أحمد إبراهيم';
  const userRole = user?.role || 'مدير النظام';
  const firstInitial = userName.charAt(0);

  // Compute live system notifications
  const allNotifications = useMemo(() => {
    const list: {
      id: string;
      title: string;
      description: string;
      type: 'stock' | 'debt' | 'sales' | 'system';
      time: string;
      page: ViewPage;
      badgeColor: string;
      icon: string;
    }[] = [];

    // 1. Low stock products
    products.forEach((p) => {
      if (p.stock <= p.minStock) {
        list.push({
          id: `stock-${p.id}`,
          title: `⚠️ تنبيه نقص المخزون: ${p.name}`,
          description: `الكمية المتبقية ${p.stock} قطعة فقط (الحد الأدنى: ${p.minStock})`,
          type: 'stock',
          time: 'الآن',
          page: 'inventory',
          badgeColor: 'bg-rose-500',
          icon: 'fa-exclamation-triangle'
        });
      }
    });

    // 2. Overdue or unpaid customers
    customers.forEach((c) => {
      const remainingDebt = c.totalPurchases - c.paid;
      if (c.status === 'overdue' || c.status === 'unpaid' || remainingDebt > 0) {
        list.push({
          id: `debt-${c.id}`,
          title: `💰 ديون ومستحقات: ${c.name}`,
          description: `مبلغ متبقي غير مدفوع بقيمة ${remainingDebt.toLocaleString()} ج.م (هاتف: ${c.phone})`,
          type: 'debt',
          time: 'اليوم',
          page: 'customers',
          badgeColor: 'bg-amber-500',
          icon: 'fa-hand-holding-usd'
        });
      }
    });

    // 3. Recent Transactions
    transactions.slice(0, 3).forEach((t) => {
      list.push({
        id: `trans-${t.id}`,
        title: `🧾 فاتورة جديدة: ${t.invoiceNo}`,
        description: `العميل: ${t.customerName} - المبلغ: ${t.amount.toLocaleString()} ج.م (${t.productName})`,
        type: 'sales',
        time: t.time || 'اليوم',
        page: 'reports',
        badgeColor: 'bg-emerald-500',
        icon: 'fa-file-invoice'
      });
    });

    // 4. System Notice
    list.push({
      id: 'sys-backup',
      title: '🛡️ نظام النسخ الاحتياطي جاهز',
      description: 'تم تحديث كافة بيانات المتجر بنجاح وتأمين السجلات بالكامل',
      type: 'system',
      time: 'منذ ساعة',
      page: 'settings',
      badgeColor: 'bg-[#1a2a6c]',
      icon: 'fa-database'
    });

    return list;
  }, [products, customers, transactions]);

  // Filter unread notifications
  const unreadCount = useMemo(() => {
    return allNotifications.filter((n) => !readNotifIds.includes(n.id)).length;
  }, [allNotifications, readNotifIds]);

  const filteredNotifications = useMemo(() => {
    return allNotifications.filter((n) => {
      if (notifFilter === 'all') return true;
      return n.type === notifFilter;
    });
  }, [allNotifications, notifFilter]);

  const handleMarkAllRead = () => {
    setReadNotifIds(allNotifications.map((n) => n.id));
    showToast('تم تحديد جميع الإشعارات كمقروءة', 'info');
  };

  const handleNotificationClick = (page: ViewPage, id: string) => {
    if (!readNotifIds.includes(id)) {
      setReadNotifIds((prev) => [...prev, id]);
    }
    setCurrentPage(page);
    setIsNotificationsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-[#0f1a3a] via-[#1a2a6c] to-[#2a3f8f] px-4 sm:px-10 py-3.5 flex flex-wrap justify-between items-center gap-4 shadow-lg shadow-[#0f1a3a]/40">
      {/* Brand Logo */}
      <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => setCurrentPage('dashboard')}>
        <div className="w-[50px] h-[50px] bg-gradient-to-br from-[#fdd835] to-[#f9a825] rounded-2xl flex items-center justify-center text-2xl text-[#0f1a3a] shadow-md shadow-[#fdd835]/30 relative">
          <i className="fas fa-wrench"></i>
          <span className="absolute -bottom-1 -right-1 text-sm drop-shadow">🇪🇬</span>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-2xl font-black text-white tracking-wide flex items-center gap-2">
            محل الاسراء
            <span className="text-lg text-[#fdd835]">🇪🇬</span>
          </span>
          <span className="text-xs font-light text-white/60 tracking-wider">
            أدوات سباكة • Plumbing Tools
          </span>
        </div>
      </div>

      {/* Top Actions: Bell & Profile */}
      <div className="flex items-center gap-3">
        {/* Notifications Bell Button */}
        <button
          onClick={() => setIsNotificationsOpen(true)}
          className="bg-white/10 border border-white/10 text-white w-[44px] h-[44px] rounded-full flex items-center justify-center cursor-pointer transition-all hover:bg-white/20 hover:scale-105 active:scale-95 relative text-lg shadow-md"
          title="الإشعارات والتنبيهات"
        >
          <i className="fas fa-bell text-amber-300"></i>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-bold text-[10px] min-w-[20px] h-[20px] px-1 rounded-full border-2 border-[#0f1a3a] flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Pill & Logout Button */}
        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10 shadow-md">
          <div
            onClick={() => setCurrentPage('profile')}
            className="flex items-center gap-2.5 cursor-pointer hover:bg-white/10 px-2 py-0.5 rounded-full transition-all"
            title="الملف الشخصي"
          >
            <div className="w-[32px] h-[32px] rounded-full bg-gradient-to-br from-[#fdd835] to-[#f9a825] flex items-center justify-center font-bold text-[#0f1a3a] text-sm shadow">
              {firstInitial}
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-white font-semibold text-xs leading-tight">{userName}</div>
              <div className="text-white/60 text-[10px] font-light">{userRole}</div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-8 h-8 rounded-full bg-rose-500/20 hover:bg-rose-600 text-rose-200 hover:text-white flex items-center justify-center text-xs transition-all cursor-pointer border border-rose-400/30"
            title="تسجيل الخروج"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* NOTIFICATIONS FULL SCREEN / MODAL POPUP     */}
      {/* ========================================== */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100 animate-slide-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0f1a3a] via-[#1a2a6c] to-[#2a3f8f] p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 text-xl shadow">
                  <i className="fas fa-bell"></i>
                </div>
                <div>
                  <h2 className="text-lg font-black flex items-center gap-2">
                    <span>مركز الإشعارات والتنبيهات</span>
                    {unreadCount > 0 && (
                      <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                        {unreadCount} جديد
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-white/60">التنبيهات المباشرة لنقص المخزون والديون والتحديثات</p>
                </div>
              </div>
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg cursor-pointer transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Filter Tabs & Actions */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2 text-xs">
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setNotifFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    notifFilter === 'all'
                      ? 'bg-[#1a2a6c] text-white shadow'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  الكل ({allNotifications.length})
                </button>
                <button
                  onClick={() => setNotifFilter('stock')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    notifFilter === 'stock'
                      ? 'bg-rose-600 text-white shadow'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <i className="fas fa-exclamation-triangle ml-1"></i> نقص المخزون
                </button>
                <button
                  onClick={() => setNotifFilter('debt')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    notifFilter === 'debt'
                      ? 'bg-amber-600 text-white shadow'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <i className="fas fa-hand-holding-usd ml-1"></i> الديون
                </button>
                <button
                  onClick={() => setNotifFilter('sales')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    notifFilter === 'sales'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <i className="fas fa-file-invoice ml-1"></i> المبيعات
                </button>
              </div>

              <button
                onClick={handleMarkAllRead}
                className="text-slate-500 hover:text-[#1a2a6c] font-bold underline cursor-pointer"
              >
                تحديد الكل كمقروء
              </button>
            </div>

            {/* Notification List Body */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {filteredNotifications.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <i className="fas fa-check-circle text-4xl text-emerald-400 block"></i>
                  <div className="text-sm font-bold text-slate-700">لا توجد إشعارات في هذا القسم</div>
                  <div className="text-xs">كافة بيانات وسجلات المحل تعمل بصورة ممتازة!</div>
                </div>
              ) : (
                filteredNotifications.map((item) => {
                  const isRead = readNotifIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item.page, item.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 group hover:shadow-md ${
                        isRead
                          ? 'bg-slate-50/60 border-slate-100 text-slate-500 opacity-75'
                          : 'bg-white border-slate-200 text-slate-900 font-medium shadow-sm'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center text-lg shrink-0 ${item.badgeColor}`}
                      >
                        <i className={`fas ${item.icon}`}></i>
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#1a2a6c] transition-colors">
                            {item.title}
                          </h4>
                          <span className="text-[11px] text-slate-400">{item.time}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                      </div>

                      <div className="self-center text-slate-400 group-hover:text-[#1a2a6c] transition-colors">
                        <i className="fas fa-chevron-left text-sm"></i>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
              <span>المتجر: محل الاسراء لأدوات السباكة</span>
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
