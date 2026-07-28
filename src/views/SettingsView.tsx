import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ShopSettings, User } from '../types';
import { exportToPDF, exportToExcel } from '../utils/export';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetSettingsToDefault,
    users,
    addUser,
    updateUser,
    toggleUserStatus,
    showToast,
    refreshStoreData,
    products,
    customers,
    transactions,
    importStoreData
  } = useStore();

  // Settings form state
  const [formSettings, setFormSettings] = useState<ShopSettings>(settings);

  useEffect(() => {
    setFormSettings(settings);
  }, [settings]);

  // Users modal state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [uName, setUName] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uPass, setUPass] = useState('');
  const [uRole, setURole] = useState<'admin' | 'employee'>('employee');

  const handleSaveSettings = () => {
    updateSettings(formSettings);
  };

  const handleCancelSettings = () => {
    setFormSettings(settings);
    showToast('↩️ تم إلغاء التعديلات والاحتفاظ بالبيانات كما هي', 'info');
  };

  const handleExportSettingsPDF = () => {
    const headers = ['اسم الإعداد / العنصر', 'القيمة الحالية'];
    const rows = [
      ['اسم المتجر', formSettings.shop.name],
      ['العنوان', formSettings.shop.address],
      ['الهاتف', formSettings.shop.phone],
      ['البريد الإلكتروني', formSettings.shop.email],
      ['العملة', formSettings.currency],
      ['الضريبة (%)', `${formSettings.invoice.tax}%`],
      ['بداية الترقيم', `${formSettings.invoice.start}`],
      ['الخصم الافتراضي', `${formSettings.invoice.discount}`],
      ['عدد المستخدمين في النظام', `${users.length} مستخدمين`]
    ];
    exportToPDF('تقرير إعدادات النظام ومستخدمي المتجر - محل الإسراء', headers, rows);
    showToast('📄 جاري تجهيز تقرير الإعدادات PDF والطباعة...', 'info');
  };

  const handleExportSettingsCSV = () => {
    const headers = ['اسم الإعداد / العنصر', 'القيمة الحالية'];
    const rows = [
      ['اسم المتجر', formSettings.shop.name],
      ['العنوان', formSettings.shop.address],
      ['الهاتف', formSettings.shop.phone],
      ['البريد الإلكتروني', formSettings.shop.email],
      ['العملة', formSettings.currency],
      ['الضريبة (%)', `${formSettings.invoice.tax}%`],
      ['بداية الترقيم', `${formSettings.invoice.start}`],
      ['الخصم الافتراضي', `${formSettings.invoice.discount}`],
      ['عدد المستخدمين في النظام', `${users.length}`]
    ];
    exportToExcel(`إعدادات_المحل_${new Date().toISOString().slice(0, 10)}.xlsx`, headers, rows);
    showToast('📊 تم تصدير إعدادات النظام بملف Excel بنجاح!', 'success');
  };

  const handleResetSettings = () => {
    if (window.confirm('⚠️ هل أنت متأكد من استعادة الإعدادات الافتراضية؟')) {
      resetSettingsToDefault();
    }
  };

  // Add user
  const openAddUser = () => {
    setEditingUser(null);
    setUName('');
    setUEmail('');
    setUPass('');
    setURole('employee');
    setIsAddUserOpen(true);
  };

  const openEditUser = (u: User) => {
    setEditingUser(u);
    setUName(u.name);
    setUEmail(u.email);
    setUPass('');
    setURole(u.roleCode);
    setIsAddUserOpen(true);
  };

  const handleCancelUserModal = () => {
    setIsAddUserOpen(false);
    setEditingUser(null);
    setUName('');
    setUEmail('');
    setUPass('');
    setURole('employee');
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uName.trim() || !uEmail.trim()) {
      showToast('⚠️ الاسم والبريد مطلوبان', 'error');
      return;
    }

    if (editingUser) {
      updateUser({
        ...editingUser,
        name: uName.trim(),
        email: uEmail.trim(),
        password: uPass ? uPass : editingUser.password,
        roleCode: uRole,
        role: uRole === 'admin' ? 'مدير النظام' : 'موظف',
        permissions:
          uRole === 'admin'
            ? ['dashboard', 'inventory', 'pos', 'customers', 'reports', 'settings', 'profile']
            : ['dashboard', 'pos', 'customers', 'profile']
      });
    } else {
      if (!uPass) {
        showToast('⚠️ يرجى تعيين كلمة مرور للمستخدم الجديد', 'error');
        return;
      }
      addUser({
        email: uEmail.trim(),
        password: uPass,
        name: uName.trim(),
        role: uRole === 'admin' ? 'مدير النظام' : 'موظف',
        roleCode: uRole,
        permissions:
          uRole === 'admin'
            ? ['dashboard', 'inventory', 'pos', 'customers', 'reports', 'settings', 'profile']
            : ['dashboard', 'pos', 'customers', 'profile'],
        status: 'active'
      });
    }

    setIsAddUserOpen(false);
  };

  // Export JSON Backup
  const handleExportData = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      settings,
      users,
      products,
      customers,
      transactions
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `al_esraa_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);

    showToast('📤 تم تصدير بيانات النظام بالكامل بنجاح!', 'success');
  };

  // Import JSON Backup
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        importStoreData(parsed);
      } catch (err) {
        showToast('⚠️ خطأ في قراءة ملف النسخة الاحتياطية', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <i className="fas fa-cog text-[#f9a825]"></i>
          <span>إعدادات النظام</span>
          <span className="text-sm font-normal text-slate-400">(تكوين التطبيق)</span>
        </h1>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleSaveSettings}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <i className="fas fa-save"></i>
            <span>حفظ الإعدادات</span>
          </button>
          <button
            onClick={handleCancelSettings}
            className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            <i className="fas fa-times"></i>
            <span>إلغاء التغييرات</span>
          </button>
          <button
            onClick={handleResetSettings}
            className="bg-white border border-rose-200 text-rose-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-rose-50 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <i className="fas fa-undo"></i>
            <span>استعادة الافتراضي</span>
          </button>
        </div>
      </div>

      {/* Settings Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Shop Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <i className="fas fa-store text-xl text-[#f9a825]"></i>
            <h3 className="text-lg font-bold text-slate-800">معلومات المحل</h3>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-slate-700 mb-1">اسم المحل</label>
              <input
                type="text"
                value={formSettings.shop.name}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    shop: { ...formSettings.shop, name: e.target.value }
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">العنوان</label>
              <input
                type="text"
                value={formSettings.shop.address}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    shop: { ...formSettings.shop, address: e.target.value }
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الهاتف</label>
                <input
                  type="text"
                  value={formSettings.shop.phone}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      shop: { ...formSettings.shop, phone: e.target.value }
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c]"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={formSettings.shop.email}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      shop: { ...formSettings.shop, email: e.target.value }
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Invoice Rules */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <i className="fas fa-file-invoice text-xl text-[#f9a825]"></i>
            <h3 className="text-lg font-bold text-slate-800">إعدادات الفواتير</h3>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">بداية الترقيم</label>
                <input
                  type="number"
                  min="1"
                  value={formSettings.invoice.start}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      invoice: { ...formSettings.invoice, start: parseInt(e.target.value) || 1 }
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c]"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">الخصم الافتراضي (ج.م)</label>
                <input
                  type="number"
                  min="0"
                  value={formSettings.invoice.discount}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      invoice: { ...formSettings.invoice, discount: parseFloat(e.target.value) || 0 }
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الضريبة (%)</label>
                <input
                  type="number"
                  min="0"
                  value={formSettings.invoice.tax}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      invoice: { ...formSettings.invoice, tax: parseFloat(e.target.value) || 0 }
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c]"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">نسخ الطباعة</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formSettings.invoice.copies}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      invoice: { ...formSettings.invoice, copies: parseInt(e.target.value) || 1 }
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={formSettings.invoice.showTax}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      invoice: { ...formSettings.invoice, showTax: e.target.checked }
                    })
                  }
                  className="accent-[#1a2a6c] w-4 h-4"
                />
                <span>إظهار الضريبة في الفاتورة</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={formSettings.invoice.showDiscount}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      invoice: { ...formSettings.invoice, showDiscount: e.target.checked }
                    })
                  }
                  className="accent-[#1a2a6c] w-4 h-4"
                />
                <span>إظهار الخصم في الفاتورة</span>
              </label>
            </div>
          </div>
        </div>

        {/* Card 3: Currency & Locale */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <i className="fas fa-money-bill-wave text-xl text-[#f9a825]"></i>
            <h3 className="text-lg font-bold text-slate-800">العملة والتوقيت</h3>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-slate-700 mb-1">العملة الأساسية</label>
              <select
                value={formSettings.currency}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    currency: e.target.value
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c] bg-white font-bold"
              >
                <option value="EGP">🇪🇬 جنيه مصري (EGP)</option>
                <option value="USD">🇺🇸 دولار أمريكي (USD)</option>
                <option value="EUR">🇪🇺 يورو (EUR)</option>
                <option value="SAR">🇸🇦 ريال سعودي (SAR)</option>
                <option value="AED">🇦🇪 درهم إماراتي (AED)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">المنطقة الزمنية</label>
              <select
                value={formSettings.timezone}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    timezone: e.target.value
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c] bg-white"
              >
                <option value="Africa/Cairo">🇪🇬 القاهرة (UTC+2)</option>
                <option value="Asia/Riyadh">🇸🇦 الرياض (UTC+3)</option>
                <option value="Asia/Dubai">🇦🇪 دبي (UTC+4)</option>
                <option value="Europe/London">🇬🇧 لندن (UTC+0)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card 4: Users Management */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <i className="fas fa-users-cog text-xl text-[#f9a825]"></i>
              <h3 className="text-lg font-bold text-slate-800">المستخدمين والصلاحيات</h3>
            </div>
            <span className="bg-[#1a2a6c] text-white text-xs font-bold px-3 py-1 rounded-full">
              {users.length}
            </span>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1a2a6c] to-[#2a3f8f] text-white flex items-center justify-center font-bold">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{u.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {u.role} • {u.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {u.status === 'active' ? 'نشط' : 'غير نشط'}
                  </span>

                  <button
                    onClick={() => openEditUser(u)}
                    className="p-1.5 text-slate-500 hover:text-[#1a2a6c] transition-colors cursor-pointer"
                    title="تعديل"
                  >
                    <i className="fas fa-edit"></i>
                  </button>

                  <button
                    onClick={() => toggleUserStatus(u.id)}
                    className="p-1.5 text-slate-500 hover:text-amber-600 transition-colors cursor-pointer"
                    title="تغيير الحالة"
                  >
                    <i className={`fas ${u.status === 'active' ? 'fa-toggle-on text-emerald-600' : 'fa-toggle-off text-slate-400'}`}></i>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={openAddUser}
            className="w-full py-2.5 border-2 border-dashed border-[#1a2a6c] text-[#1a2a6c] hover:bg-[#1a2a6c]/5 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            + إضافة مستخدم جديد
          </button>
        </div>

        {/* Card 5: Full Backup & Restore */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <i className="fas fa-database text-xl text-[#f9a825]"></i>
            <h3 className="text-lg font-bold text-slate-800">النسخ الاحتياطي والاستعادة</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="font-bold text-slate-800 text-sm">📤 تصدير البيانات (Backup)</div>
              <p className="text-slate-500">
                تصدير كافة بيانات المحل (المنتجات، العملاء، الفواتير، الإعدادات) كملف JSON آمن للنسخ الاحتياطي.
              </p>
              <button
                onClick={handleExportData}
                className="py-2.5 px-5 bg-[#1a2a6c] hover:bg-[#0f1a3a] text-white font-bold rounded-xl shadow cursor-pointer transition-all flex items-center gap-2"
              >
                <i className="fas fa-file-export"></i>
                <span>تصدير البيانات الآن</span>
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="font-bold text-slate-800 text-sm">📥 استيراد البيانات (Restore)</div>
              <p className="text-slate-500">
                استعادة نسخة احتياطية من ملف JSON سبق تصديره لاسترجاع بيانات المتجر.
              </p>
              <label className="inline-flex py-2.5 px-5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl shadow-sm cursor-pointer transition-all items-center gap-2">
                <i className="fas fa-file-import"></i>
                <span>استيراد من ملف JSON</span>
                <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <i className="fas fa-user-plus text-[#f9a825]"></i>
                <span>{editingUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}</span>
              </h2>
              <button onClick={handleCancelUserModal} className="text-slate-400 hover:text-slate-700 text-2xl font-bold cursor-pointer">
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  value={uName}
                  onChange={(e) => setUName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  value={uEmail}
                  onChange={(e) => setUEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  كلمة المرور {editingUser && '(اتركها فارغة للإبقاء الحالية)'}
                </label>
                <input
                  type="password"
                  value={uPass}
                  onChange={(e) => setUPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الصلاحية</label>
                <select
                  value={uRole}
                  onChange={(e) => setURole(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c] bg-white font-bold"
                >
                  <option value="employee">👤 موظف (مبيعات وعملاء فقط)</option>
                  <option value="admin">👑 مدير (جميع الصلاحيات)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-[#1a2a6c] to-[#2a3f8f] text-white font-bold rounded-xl shadow cursor-pointer text-xs"
                >
                  حفظ البيانات
                </button>
                <button
                  type="button"
                  onClick={handleCancelUserModal}
                  className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer text-xs"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer controls */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex-wrap gap-3">
        <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
          <span><i className="fas fa-store text-[#f9a825] ml-1"></i> محل الاسراء لأدوات السباكة</span>
          <span>|</span>
          <span><i className="fas fa-map-pin text-[#f9a825] ml-1"></i> مصر - القاهرة</span>
          <span>|</span>
          <span><i className="fas fa-phone text-[#f9a825] ml-1"></i> 012-3456-7890</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportSettingsPDF}
            className="bg-gradient-to-r from-[#1a2a6c] to-[#2a3f8f] text-white text-xs font-bold px-4 py-2 rounded-full shadow hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <i className="fas fa-file-pdf ml-1.5"></i> تصدير PDF
          </button>
          <button
            onClick={handleExportSettingsCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <i className="fas fa-file-excel ml-1.5"></i> تصدير Excel
          </button>
          <button
            onClick={refreshStoreData}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-full transition-all cursor-pointer"
          >
            <i className="fas fa-sync-alt ml-1.5"></i> تحديث
          </button>
        </div>
      </div>
    </div>
  );
};
