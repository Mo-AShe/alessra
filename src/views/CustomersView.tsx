import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Customer } from '../types';
import { exportToCSV, exportToPDF } from '../utils/export';

export const CustomersView: React.FC = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer, showToast, refreshStoreData, currentUserSession } = useStore();

  const isAdmin = currentUserSession?.user.roleCode === 'admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formTotalPurchases, setFormTotalPurchases] = useState('');
  const [formPaid, setFormPaid] = useState('');
  const [formStatus, setFormStatus] = useState<'paid' | 'partial' | 'unpaid' | 'overdue'>('paid');

  // Stats calculation
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === 'paid' || c.status === 'partial').length;
  const debtCustomers = customers.filter((c) => c.status !== 'paid');
  const totalDebt = debtCustomers.reduce((sum, c) => sum + (c.totalPurchases - c.paid), 0);

  // Avatar helper
  const getAvatarGradient = (id: number) => {
    const gradients = [
      'from-purple-600 to-indigo-500',
      'from-emerald-700 to-emerald-500',
      'from-amber-600 to-amber-500',
      'from-rose-700 to-rose-500',
      'from-[#1a2a6c] to-[#2a3f8f]',
      'from-blue-700 to-sky-500'
    ];
    return gradients[id % gradients.length];
  };

  const getStatusBadge = (status: Customer['status']) => {
    switch (status) {
      case 'paid':
        return { class: 'bg-emerald-50 text-emerald-700', text: '✅ مدفوع' };
      case 'partial':
        return { class: 'bg-amber-50 text-amber-700', text: '🟡 جزئي' };
      case 'unpaid':
        return { class: 'bg-rose-50 text-rose-600', text: '❌ غير مدفوع' };
      case 'overdue':
        return { class: 'bg-rose-100 text-rose-800', text: '🔴 متأخر' };
      default:
        return { class: 'bg-slate-100 text-slate-700', text: status };
    }
  };

  // Filter
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIdx, startIdx + itemsPerPage);

  // Actions
  const openAddModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('010-0000-0000');
    setFormTotalPurchases('0');
    setFormPaid('0');
    setFormStatus('paid');
    setIsAddEditOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormPhone(c.phone);
    setFormTotalPurchases(c.totalPurchases.toString());
    setFormPaid(c.paid.toString());
    setFormStatus(c.status);
    setIsAddEditOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(formTotalPurchases);
    const paid = parseFloat(formPaid);

    if (!formName.trim() || !formPhone.trim() || isNaN(total) || isNaN(paid)) {
      showToast('⚠️ يرجى ملء جميع الحقول بشكل صحيح', 'error');
      return;
    }

    if (paid > total) {
      showToast('⚠️ المدفوع لا يمكن أن يتجاوز إجمالي المشتريات', 'error');
      return;
    }

    if (editingCustomer) {
      updateCustomer({
        ...editingCustomer,
        name: formName.trim(),
        phone: formPhone.trim(),
        totalPurchases: total,
        paid: paid,
        status: formStatus
      });
    } else {
      addCustomer({
        name: formName.trim(),
        phone: formPhone.trim(),
        totalPurchases: total,
        paid: paid,
        status: formStatus
      });
    }

    setIsAddEditOpen(false);
  };

  const handleExportCSV = () => {
    if (customers.length === 0) {
      showToast('⚠️ لا يوجد عملاء لتصديرهم', 'error');
      return;
    }
    const headers = ['المعرف', 'اسم العميل', 'رقم الهاتف', 'إجمالي المشتريات (ج.م)', 'المدفوع (ج.م)', 'المتبقي (الدين) (ج.م)', 'الحالة'];
    const rows = customers.map((c) => [
      c.id,
      c.name,
      c.phone,
      c.totalPurchases,
      c.paid,
      c.totalPurchases - c.paid,
      c.status === 'paid' ? 'مدفوع' : c.status === 'partial' ? 'جزئي' : c.status === 'unpaid' ? 'غير مدفوع' : 'متأخر'
    ]);
    exportToCSV(`عملاء_ومستحقات_محل_الاسراء_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    showToast('📊 تم تصدير كشف العملاء والديون بملف Excel/CSV بنجاح!', 'success');
  };

  const handleExportPDF = () => {
    if (customers.length === 0) {
      showToast('⚠️ لا يوجد عملاء لتصديرهم', 'error');
      return;
    }
    const headers = ['المعرف', 'اسم العميل', 'رقم الهاتف', 'إجمالي المشتريات (ج.م)', 'المدفوع (ج.م)', 'المتبقي (الدين) (ج.م)', 'الحالة'];
    const rows = customers.map((c) => [
      c.id,
      c.name,
      c.phone,
      c.totalPurchases,
      c.paid,
      c.totalPurchases - c.paid,
      c.status === 'paid' ? 'مدفوع' : c.status === 'partial' ? 'جزئي' : c.status === 'unpaid' ? 'غير مدفوع' : 'متأخر'
    ]);
    exportToPDF('كشف حسابات وديون العملاء - محل الإسراء', headers, rows);
    showToast('📄 جاري تجهيز تقرير حسابات العملاء PDF والطباعة...', 'info');
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteCustomer(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <i className="fas fa-users text-[#f9a825]"></i>
          <span>إدارة العملاء</span>
          <span className="text-sm font-normal text-slate-400">({customers.length} عميل)</span>
        </h1>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={openAddModal}
            className="bg-gradient-to-r from-[#1a2a6c] to-[#2a3f8f] text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <i className="fas fa-plus"></i>
            <span>إضافة عميل</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-white border border-slate-200 text-slate-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <i className="fas fa-file-pdf text-red-600"></i>
            <span>تصدير PDF</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-white border border-slate-200 text-slate-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <i className="fas fa-file-excel text-emerald-600"></i>
            <span>تصدير Excel</span>
          </button>
        </div>
      </div>

      {/* Mini Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-500 text-white flex items-center justify-center text-lg font-bold">
            <i className="fas fa-users"></i>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">إجمالي العملاء</div>
            <div className="text-xl font-black text-slate-800">{totalCustomers}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 text-white flex items-center justify-center text-lg font-bold">
            <i className="fas fa-user-check"></i>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">نشطاء</div>
            <div className="text-xl font-black text-slate-800">{activeCustomers}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-600 to-amber-500 text-white flex items-center justify-center text-lg font-bold">
            <i className="fas fa-user-clock"></i>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">معهم ديون</div>
            <div className="text-xl font-black text-slate-800">{debtCustomers.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-700 to-rose-500 text-white flex items-center justify-center text-lg font-bold">
            <i className="fas fa-money-bill-wave"></i>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">إجمالي الديون</div>
            <div className="text-xl font-black text-slate-800 dir-ltr text-right">
              {totalDebt.toLocaleString('ar-EG')} <span className="text-xs text-[#f9a825]">ج.م</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5 whitespace-nowrap">
            <i className="fas fa-search"></i> بحث:
          </label>
          <input
            type="text"
            placeholder="اسم العميل أو رقم الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1a2a6c]"
          />
        </div>
        <button
          onClick={() => {
            setSearchTerm('');
            showToast('🔄 تم إعادة ضبط البحث', 'info');
          }}
          className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <i className="fas fa-undo ml-1"></i> إعادة
        </button>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">العميل</th>
                <th className="py-3.5 px-4">الهاتف</th>
                <th className="py-3.5 px-4">المشتريات</th>
                <th className="py-3.5 px-4">المدفوع</th>
                <th className="py-3.5 px-4">المتبقي (الدين)</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    <i className="fas fa-users-slash text-4xl block mb-2 opacity-40"></i>
                    لا يوجد عملاء مطابقين للبحث
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((c, index) => {
                  const remaining = c.totalPurchases - c.paid;
                  const badge = getStatusBadge(c.status);
                  const firstInitial = c.name.charAt(0);

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-500">{startIdx + index + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarGradient(
                              c.id
                            )} text-white flex items-center justify-center font-bold text-sm shadow-sm`}
                          >
                            {firstInitial}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{c.name}</div>
                            <div className="text-xs text-slate-400 sm:hidden">{c.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{c.phone}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 dir-ltr text-right">
                        {c.totalPurchases.toLocaleString('ar-EG')} <span className="text-xs text-[#f9a825]">ج.م</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600 dir-ltr text-right">
                        {c.paid.toLocaleString('ar-EG')} <span className="text-xs text-[#f9a825]">ج.م</span>
                      </td>
                      <td
                        className={`py-3.5 px-4 font-bold dir-ltr text-right ${
                          remaining > 0 ? 'text-rose-600' : 'text-slate-400'
                        }`}
                      >
                        {remaining.toLocaleString('ar-EG')} <span className="text-xs text-[#f9a825]">ج.م</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.class}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setViewCustomer(c)}
                            className="w-8 h-8 rounded-lg bg-[#1a2a6c]/10 text-[#1a2a6c] hover:bg-[#1a2a6c]/20 flex items-center justify-center transition-colors cursor-pointer"
                            title="عرض التفاصيل"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => openEditModal(c)}
                                className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center justify-center transition-colors cursor-pointer"
                                title="تعديل"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                onClick={() => setDeleteTarget(c)}
                                className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors cursor-pointer"
                                title="حذف"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex flex-wrap justify-between items-center gap-3 text-xs text-slate-500">
          <div>
            عرض <strong>{filteredCustomers.length > 0 ? startIdx + 1 : 0}</strong> -{' '}
            <strong>{Math.min(startIdx + itemsPerPage, filteredCustomers.length)}</strong> من <strong>{filteredCustomers.length}</strong> عميل
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => setCurrentPage(pg)}
                className={`px-3 py-1.5 rounded-lg font-bold border ${
                  currentPage === pg ? 'bg-[#1a2a6c] text-white border-[#1a2a6c]' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                {pg}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
          </div>
        </div>
      </div>

      {/* View Customer Details Modal */}
      {viewCustomer && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <i className="fas fa-user text-[#f9a825]"></i>
                <span>بيانات العميل الكاملة</span>
              </h2>
              <button onClick={() => setViewCustomer(null)} className="text-slate-400 hover:text-slate-700 text-2xl font-bold cursor-pointer">
                &times;
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-400">الاسم:</span>
                <strong className="text-slate-900">{viewCustomer.name}</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-400">الهاتف:</span>
                <span className="font-mono">{viewCustomer.phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-400">إجمالي المشتريات:</span>
                <span className="font-bold text-slate-900 dir-ltr">{viewCustomer.totalPurchases.toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-400">المدفوع:</span>
                <span className="font-bold text-emerald-600 dir-ltr">{viewCustomer.paid.toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-400">المتبقي (الدين):</span>
                <span className={`font-bold dir-ltr ${viewCustomer.totalPurchases - viewCustomer.paid > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {(viewCustomer.totalPurchases - viewCustomer.paid).toLocaleString('ar-EG')} ج.م
                </span>
              </div>
              <div className="flex justify-between py-2 items-center">
                <span className="text-slate-400">الحالة:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(viewCustomer.status).class}`}>
                  {getStatusBadge(viewCustomer.status).text}
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 mt-6">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-3 bg-gradient-to-r from-[#1a2a6c] to-[#2a3f8f] text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow hover:shadow-lg flex items-center justify-center gap-1.5"
              >
                <i className="fas fa-print"></i>
                <span>طباعة كشف الحساب</span>
              </button>
              <button
                onClick={() => setViewCustomer(null)}
                className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <i className="fas fa-edit text-[#f9a825]"></i>
                <span>{editingCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</span>
              </h2>
              <button onClick={() => setIsAddEditOpen(false)} className="text-slate-400 hover:text-slate-700 text-2xl font-bold cursor-pointer">
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم العميل</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="أدخل اسم العميل"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c] text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c] text-sm text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">إجمالي المشتريات (ج.م)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formTotalPurchases}
                    onChange={(e) => setFormTotalPurchases(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c] text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المدفوع (ج.م)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formPaid}
                    onChange={(e) => setFormPaid(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c] text-sm text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الحالة</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c] text-sm text-slate-800 bg-white"
                >
                  <option value="paid">✅ مدفوع</option>
                  <option value="partial">🟡 جزئي</option>
                  <option value="unpaid">❌ غير مدفوع</option>
                  <option value="overdue">🔴 متأخر</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-[#1a2a6c] to-[#2a3f8f] text-white font-bold rounded-xl shadow hover:shadow-lg transition-all cursor-pointer text-xs"
                >
                  حفظ البيانات
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer text-xs"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Customer Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full text-center shadow-2xl animate-slide-up">
            <i className="fas fa-exclamation-triangle text-5xl text-rose-500 mb-3 block"></i>
            <h3 className="text-lg font-bold text-slate-900 mb-2">حذف العميل</h3>
            <p className="text-slate-600 text-sm">
              أنت على وشك حذف العميل <strong className="text-[#1a2a6c]">{deleteTarget.name}</strong>
            </p>
            <p className="text-xs text-slate-400 mt-1 mb-6">هذا الإجراء لا يمكن التراجع عنه</p>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-rose-700 text-white font-bold rounded-xl shadow hover:shadow-lg transition-all cursor-pointer text-xs"
              >
                <i className="fas fa-trash ml-1"></i> حذف نهائي
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer text-xs"
              >
                إلغاء
              </button>
            </div>
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
            onClick={handleExportPDF}
            className="bg-gradient-to-r from-[#1a2a6c] to-[#2a3f8f] text-white text-xs font-bold px-4 py-2 rounded-full shadow hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <i className="fas fa-file-pdf ml-1.5"></i> تصدير PDF
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
