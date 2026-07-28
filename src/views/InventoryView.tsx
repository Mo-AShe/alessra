import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import { exportToCSV, exportToPDF } from '../utils/export';

export const InventoryView: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, showToast, refreshStoreData } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState('pipes');
  const [formBuyPrice, setFormBuyPrice] = useState('');
  const [formSellPrice, setFormSellPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formMinStock, setFormMinStock] = useState('');

  // Helpers
  const getCategoryName = (code: string) => {
    const categories: Record<string, string> = {
      pipes: 'أنابيب',
      fittings: 'وصلات',
      valves: 'محابس',
      pumps: 'مضخات',
      materials: 'مواد',
      tools: 'أدوات'
    };
    return categories[code] || code;
  };

  const getCategoryIcon = (code: string) => {
    const icons: Record<string, string> = {
      pipes: 'fa-[#1a2a6c] fa-[#f9a825] fa-pipe',
      fittings: 'fa-link',
      valves: 'fa-toggle-on',
      pumps: 'fa-water',
      materials: 'fa-cubes',
      tools: 'fa-tools'
    };
    return icons[code] || 'fa-cube';
  };

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock <= 0) return { class: 'bg-rose-50 text-rose-700', text: '❗ نفد' };
    if (stock <= minStock) return { class: 'bg-rose-50 text-rose-600', text: '⚠️ منخفض' };
    if (stock <= minStock * 2) return { class: 'bg-amber-50 text-amber-700', text: '🟡 متوسط' };
    return { class: 'bg-emerald-50 text-emerald-700', text: '✅ مرتفع' };
  };

  // Filter products
  const filteredProducts = products.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;

    let matchStock = true;
    if (stockFilter === 'high') matchStock = item.stock > item.minStock * 2;
    else if (stockFilter === 'medium') matchStock = item.stock > item.minStock && item.stock <= item.minStock * 2;
    else if (stockFilter === 'low') matchStock = item.stock > 0 && item.stock <= item.minStock;
    else if (stockFilter === 'out') matchStock = item.stock <= 0;

    return matchSearch && matchCategory && matchStock;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIdx, startIdx + itemsPerPage);

  // Modal actions
  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCode(`PROD-${Math.floor(100 + Math.random() * 900)}`);
    setFormCategory('pipes');
    setFormBuyPrice('');
    setFormSellPrice('');
    setFormStock('');
    setFormMinStock('5');
    setIsAddEditOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCode(p.code);
    setFormCategory(p.category);
    setFormBuyPrice(p.buyPrice.toString());
    setFormSellPrice(p.sellPrice.toString());
    setFormStock(p.stock.toString());
    setFormMinStock(p.minStock.toString());
    setIsAddEditOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const buy = parseFloat(formBuyPrice);
    const sell = parseFloat(formSellPrice);
    const stock = parseInt(formStock);
    const min = parseInt(formMinStock);

    if (!formName.trim() || !formCode.trim() || isNaN(buy) || isNaN(sell) || isNaN(stock) || isNaN(min)) {
      showToast('⚠️ يرجى ملء جميع الحقول بشكل صحيح', 'error');
      return;
    }

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        name: formName.trim(),
        code: formCode.trim(),
        category: formCategory,
        buyPrice: buy,
        sellPrice: sell,
        stock: stock,
        minStock: min
      });
    } else {
      addProduct({
        name: formName.trim(),
        code: formCode.trim(),
        category: formCategory,
        buyPrice: buy,
        sellPrice: sell,
        stock: stock,
        minStock: min
      });
    }

    setIsAddEditOpen(false);
  };

  const handleExportCSV = () => {
    if (products.length === 0) {
      showToast('⚠️ لا توجد منتجات لتصديرها', 'error');
      return;
    }
    const headers = ['المعرف', 'الكود', 'الاسم', 'الفئة', 'سعر الشراء (ج.م)', 'سعر البيع (ج.م)', 'الكمية', 'الحد الأدنى'];
    const rows = products.map((p) => [
      p.id,
      p.code,
      p.name,
      getCategoryName(p.category),
      p.buyPrice,
      p.sellPrice,
      p.stock,
      p.minStock
    ]);
    exportToCSV(`مخزون_محل_الاسراء_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    showToast('📊 تم تصدير قائمة المخزون بملف Excel/CSV بنجاح!', 'success');
  };

  const handleExportPDF = () => {
    if (products.length === 0) {
      showToast('⚠️ لا توجد منتجات لتصديرها', 'error');
      return;
    }
    const headers = ['المعرف', 'الكود', 'الاسم', 'الفئة', 'سعر الشراء (ج.م)', 'سعر البيع (ج.م)', 'الكمية', 'الحد الأدنى'];
    const rows = products.map((p) => [
      p.id,
      p.code,
      p.name,
      getCategoryName(p.category),
      p.buyPrice,
      p.sellPrice,
      p.stock,
      p.minStock
    ]);
    exportToPDF('جرد المنتجات والمخزون - محل الإسراء', headers, rows);
    showToast('📄 جاري تجهيز تقرير المخزون PDF والطباعة...', 'info');
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <i className="fas fa-boxes text-[#f9a825]"></i>
          <span>إدارة المخزون</span>
          <span className="text-sm font-normal text-slate-400">({products.length} منتج)</span>
        </h1>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={openAddModal}
            className="bg-gradient-to-r from-[#1a2a6c] to-[#2a3f8f] text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-[#1a2a6c]/20 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
          >
            <i className="fas fa-plus"></i>
            <span>إضافة منتج</span>
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

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          {/* Search Input */}
          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-sm flex-1 min-w-[200px]">
            <i className="fas fa-search text-slate-400"></i>
            <input
              type="text"
              placeholder="اسم المنتج أو الكود..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none w-full focus:outline-none text-slate-800"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">الفئة:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1a2a6c] cursor-pointer"
            >
              <option value="all">جميع الفئات</option>
              <option value="pipes">أنابيب</option>
              <option value="fittings">وصلات</option>
              <option value="valves">محابس</option>
              <option value="pumps">مضخات</option>
              <option value="materials">مواد</option>
              <option value="tools">أدوات</option>
            </select>
          </div>

          {/* Stock Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">الحالة:</label>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1a2a6c] cursor-pointer"
            >
              <option value="all">الكل</option>
              <option value="high">مخزون مرتفع</option>
              <option value="medium">مخزون متوسط</option>
              <option value="low">مخزون منخفض</option>
              <option value="out">نفد من المخزون</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => {
            setSearchTerm('');
            setCategoryFilter('all');
            setStockFilter('all');
            showToast('🔄 تم إعادة ضبط الفلترة', 'info');
          }}
          className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <i className="fas fa-undo ml-1"></i> إعادة
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">المنتج</th>
                <th className="py-3.5 px-4">الفئة</th>
                <th className="py-3.5 px-4">سعر الشراء</th>
                <th className="py-3.5 px-4">سعر البيع</th>
                <th className="py-3.5 px-4">الكمية</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    <i className="fas fa-box-open text-4xl block mb-2 opacity-50"></i>
                    لا توجد منتجات مطابقة للبحث
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((item, index) => {
                  const status = getStockStatus(item.stock, item.minStock);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-500">{startIdx + index + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-lg text-[#1a2a6c]">
                            <i className={`fas ${getCategoryIcon(item.category)}`}></i>
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{item.name}</div>
                            <div className="text-xs text-slate-400">{item.code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">{getCategoryName(item.category)}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 dir-ltr text-right">
                        {item.buyPrice.toLocaleString('ar-EG')} <span className="text-xs text-[#f9a825]">ج.م</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#1a2a6c] dir-ltr text-right">
                        {item.sellPrice.toLocaleString('ar-EG')} <span className="text-xs text-[#f9a825]">ج.م</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{item.stock}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.class}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="w-8 h-8 rounded-lg bg-[#1a2a6c]/10 text-[#1a2a6c] hover:bg-[#1a2a6c]/20 flex items-center justify-center transition-colors cursor-pointer"
                            title="تعديل"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors cursor-pointer"
                            title="حذف"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
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
            عرض <strong>{filteredProducts.length > 0 ? startIdx + 1 : 0}</strong> -{' '}
            <strong>{Math.min(startIdx + itemsPerPage, filteredProducts.length)}</strong> من <strong>{filteredProducts.length}</strong> منتج
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

      {/* Add / Edit Product Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center pb-4 mb-5 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <i className="fas fa-edit text-[#f9a825]"></i>
                <span>{editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</span>
              </h2>
              <button onClick={() => setIsAddEditOpen(false)} className="text-slate-400 hover:text-rose-500 text-2xl font-bold cursor-pointer">
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المنتج</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: ماسورة PVC 4م"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c] text-sm text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الكود</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c] text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الفئة</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c] text-sm text-slate-800 bg-white"
                  >
                    <option value="pipes">أنابيب</option>
                    <option value="fittings">وصلات</option>
                    <option value="valves">محابس</option>
                    <option value="pumps">مضخات</option>
                    <option value="materials">مواد</option>
                    <option value="tools">أدوات</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">سعر الشراء (ج.م)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    value={formBuyPrice}
                    onChange={(e) => setFormBuyPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c] text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">سعر البيع (ج.م)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    value={formSellPrice}
                    onChange={(e) => setFormSellPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c] text-sm text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الكمية</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c] text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الحد الأدنى</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c] text-sm text-slate-800"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-[#1a2a6c] to-[#2a3f8f] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer text-sm"
                >
                  <i className="fas fa-save ml-1.5"></i> حفظ التعديلات
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors cursor-pointer text-sm"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full text-center shadow-2xl animate-slide-up">
            <i className="fas fa-exclamation-triangle text-5xl text-rose-500 mb-3 block"></i>
            <h3 className="text-lg font-bold text-slate-900 mb-2">تأكيد الحذف النهائي</h3>
            <p className="text-slate-600 text-sm">
              أنت على وشك حذف المنتج <strong className="text-[#1a2a6c]">{deleteTarget.name}</strong>
            </p>
            <p className="text-xs text-slate-400 mt-1 mb-6">هذا الإجراء لا يمكن التراجع عنه</p>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-rose-700 text-white font-bold rounded-xl shadow hover:shadow-lg transition-all cursor-pointer text-sm"
              >
                <i className="fas fa-trash ml-1.5"></i> حذف نهائي
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer text-sm"
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
            <i className="fas fa-file-pdf ml-1.5"></i> تصدير تقرير PDF
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
