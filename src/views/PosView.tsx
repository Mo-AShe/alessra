import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { CartItem, Product } from '../types';
import { exportToCSV, exportToPDF, downloadElementAsPDF } from '../utils/export';

export const PosView: React.FC = () => {
  const { products, customers, transactions, processCheckout, showToast, refreshStoreData, settings } = useStore();

  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');

  // Invoice modal popup
  const [receiptModal, setReceiptModal] = useState<{
    isOpen: boolean;
    invoiceNo: string;
    items: CartItem[];
    subtotal: number;
    discount: number;
    total: number;
    customerName: string;
    date: string;
    time: string;
  } | null>(null);

  // Invoice counter preview
  const currentInvoiceNo = settings.invoice.start + transactions.length;

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      pipes: 'fa-pipe',
      fittings: 'fa-link',
      valves: 'fa-toggle-on',
      pumps: 'fa-water',
      materials: 'fa-cubes',
      tools: 'fa-tools'
    };
    return icons[category] || 'fa-cube';
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchQuery = p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.code.toLowerCase().includes(productSearch.toLowerCase());
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchQuery && matchCat;
  });

  // Cart operations
  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.id === product.id);
    const currentQty = existing ? existing.qty : 0;

    if (currentQty >= product.stock) {
      showToast(`⚠️ الكمية المطلوبة غير متوفرة! المتبقي بالمخزن: ${product.stock}`, 'error');
      return;
    }

    if (existing) {
      setCart((prev) =>
        prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.sellPrice,
          qty: 1,
          category: product.category,
          maxStock: product.stock
        }
      ]);
    }
    showToast(`✅ تم إضافة ${product.name} إلى السلة`, 'success');
  };

  const changeQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            if (newQty > item.maxStock) {
              showToast(`⚠️ تجاوزت الكمية المتاحة بالمخزن (${item.maxStock})`, 'error');
              return item;
            }
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
  };

  const removeFromCart = (id: number) => {
    const target = cart.find((i) => i.id === id);
    setCart((prev) => prev.filter((i) => i.id !== id));
    if (target) showToast(`🗑️ تم حذف ${target.name} من السلة`, 'info');
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('⚠️ هل أنت متأكد من تفريغ السلة؟')) {
      setCart([]);
      setDiscount(0);
      showToast('🗑️ تم تفريغ السلة', 'info');
    }
  };

  // Total & Checkout
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      showToast('⚠️ لا توجد مبيعات لتصديرها', 'error');
      return;
    }
    const headers = ['رقم الفاتورة', 'العميل', 'المبلغ (ج.م)', 'البيان', 'التاريخ', 'الوقت', 'الحالة'];
    const rows = transactions.map((t) => [
      t.invoiceNo,
      t.customerName,
      t.amount,
      t.productName,
      t.date,
      t.time,
      t.status === 'done' ? 'مكتملة' : 'ملغاة'
    ]);
    exportToCSV(`سجل_المبيعات_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    showToast('📊 تم تصدير سجل عمليات البيع بنجاح!', 'success');
  };

  const handleExportPDF = () => {
    if (transactions.length === 0) {
      showToast('⚠️ لا توجد مبيعات لتصديرها', 'error');
      return;
    }
    const headers = ['رقم الفاتورة', 'العميل', 'المبلغ (ج.م)', 'البيان', 'التاريخ', 'الوقت', 'الحالة'];
    const rows = transactions.map((t) => [
      t.invoiceNo,
      t.customerName,
      t.amount,
      t.productName,
      t.date,
      t.time,
      t.status === 'done' ? 'مكتملة' : 'ملغاة'
    ]);
    exportToPDF('سجل عمليات المبيعات والفواتير - محل الإسراء', headers, rows);
    showToast('📄 جاري تجهيز تقرير المبيعات PDF والطباعة...', 'info');
  };

  // Subtotal & Total
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalAmount = Math.max(0, subtotal - discount);

  // Checkout — opens the receipt preview. Does NOT deduct stock or clear the
  // cart; the actual commit happens when the user clicks "طباعة الفاتورة" so the
  // data is preserved if they just want to preview or close the modal.
  const handleCheckout = () => {
    if (cart.length === 0) {
      showToast('⚠️ السلة فارغة! أضف منتجات أولاً', 'error');
      return;
    }

    const custId = selectedCustomerId !== '' ? Number(selectedCustomerId) : undefined;
    const custObj = customers.find((c) => c.id === custId);
    const customerName = custObj ? custObj.name : 'عميل نقدي';

    const nextInvoiceNum = settings.invoice.start + transactions.length;
    const invoiceNo = `INV-${String(nextInvoiceNum).padStart(3, '0')}`;

    const now = new Date();
    setReceiptModal({
      isOpen: true,
      invoiceNo,
      items: [...cart],
      subtotal,
      discount,
      total: totalAmount,
      customerName,
      date: now.toLocaleDateString('ar-EG'),
      time: now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    });
  };

  // Print & commit — exports the receipt as a real PDF file (like the other
  // export buttons at the bottom) AND fires the checkout call so the item
  // quantities are deducted from the database. Only on success do we close
  // the modal and clear the cart.
  const handlePrintInvoice = async () => {
    if (!receiptModal) return;
    if (cart.length === 0) {
      showToast('⚠️ السلة فارغة!', 'error');
      setReceiptModal(null);
      return;
    }

    const receiptEl = document.getElementById('printableReceipt');
    if (!receiptEl) {
      showToast('⚠️ تعذر العثور على الفاتورة', 'error');
      return;
    }

    const custId = selectedCustomerId !== '' ? Number(selectedCustomerId) : undefined;

    // 1. Export the PDF first so the user always gets a copy of the bill
    //    even if the DB call later fails.
    showToast('📄 جاري إنشاء ملف PDF للفاتورة...', 'info');
    const filename = `فاتورة_${receiptModal.invoiceNo}.pdf`;
    try {
      await downloadElementAsPDF(receiptEl, filename);
      showToast('✅ تم تنزيل ملف PDF للفاتورة بنجاح!', 'success');
    } catch (e) {
      console.error('PDF export failed', e);
      showToast('⚠️ تعذر تنزيل ملف PDF، حاول مرة أخرى', 'error');
      return;
    }

    // 2. Commit the sale to the database (deducts stock, saves invoice,
    //    updates customer balance).
    const result = processCheckout(cart, discount, custId);
    if (result.success) {
      setCart([]);
      setDiscount(0);
      setSelectedCustomerId('');
      setReceiptModal(null);
      showToast(`✅ تم إصدار الفاتورة #${result.invoiceNo} وخصم الكميات من المخزن بنجاح!`, 'success');
    }
  };

  // Close — just hides the preview modal. Cart, discount and selected
  // customer are intentionally preserved so the bill data is never lost
  // and the user can reopen the preview or keep editing.
  const handleCloseReceipt = () => {
    setReceiptModal(null);
    showToast('ℹ️ تم إغلاق المعاينة، بيانات الفاتورة محفوظة في السلة', 'info');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <i className="fas fa-shopping-cart text-[#f9a825]"></i>
          <span>نقطة البيع (POS)</span>
          <span className="text-sm font-normal text-slate-400">
            فاتورة جديدة #{String(currentInvoiceNo).padStart(3, '0')}
          </span>
        </h1>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (cart.length > 0 && !window.confirm('⚠️ لديك منتجات في السلة. بدء فاتورة جديدة؟')) {
                return;
              }
              setCart([]);
              setDiscount(0);
              showToast('📄 بدء فاتورة جديدة', 'info');
            }}
            className="bg-gradient-to-r from-[#1a2a6c] to-[#2a3f8f] text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <i className="fas fa-plus"></i>
            <span>فاتورة جديدة</span>
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left/Main Column: Product Catalog (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          {/* Header & Search */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <i className="fas fa-box text-[#f9a825]"></i>
              <span>قائمة المنتجات</span>
              <span className="text-xs text-slate-400 font-normal">(اختر منتج للإضافة)</span>
            </h3>

            <div className="flex items-center gap-2 flex-wrap flex-1 justify-end">
              {/* Category Filter Pills */}
              <div className="flex gap-1 overflow-x-auto pb-1 max-w-full">
                {['all', 'pipes', 'valves', 'fittings', 'pumps', 'materials', 'tools'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#1a2a6c] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'all'
                      ? 'الكل'
                      : cat === 'pipes'
                      ? 'أنابيب'
                      : cat === 'valves'
                      ? 'محابس'
                      : cat === 'fittings'
                      ? 'وصلات'
                      : cat === 'pumps'
                      ? 'مضخات'
                      : cat === 'materials'
                      ? 'مواد'
                      : 'أدوات'}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 text-xs min-w-[160px]">
                <i className="fas fa-search text-slate-400"></i>
                <input
                  type="text"
                  placeholder="بحث عن منتج..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="bg-transparent border-none focus:outline-none w-full text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[520px] overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-400">
                <i className="fas fa-search text-3xl block mb-2 opacity-50"></i>
                لا توجد منتجات مطابقة للبحث
              </div>
            ) : (
              filteredProducts.map((p) => {
                const inCartItem = cart.find((i) => i.id === p.id);
                const isOutOfStock = p.stock <= 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && addToCart(p)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer relative group flex flex-col justify-between ${
                      isOutOfStock
                        ? 'opacity-40 bg-slate-50 border-slate-200 cursor-not-allowed'
                        : inCartItem
                        ? 'bg-emerald-50/80 border-emerald-500 shadow-md shadow-emerald-500/10'
                        : 'bg-slate-50/70 hover:bg-white border-slate-200 hover:border-[#1a2a6c] hover:shadow-md'
                    }`}
                  >
                    {inCartItem && (
                      <span className="absolute top-2 right-2 bg-emerald-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow">
                        {inCartItem.qty}
                      </span>
                    )}

                    <div>
                      <div className="w-10 h-10 rounded-xl bg-white mx-auto mb-2 flex items-center justify-center text-lg text-[#1a2a6c] shadow-sm">
                        <i className={`fas ${getCategoryIcon(p.category)}`}></i>
                      </div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900 truncate mb-1" title={p.name}>
                        {p.name}
                      </div>
                      <div className="text-xs font-black text-[#1a2a6c] dir-ltr">
                        {p.sellPrice.toLocaleString('ar-EG')} <span className="text-[10px] text-[#f9a825]">ج.م</span>
                      </div>
                    </div>

                    <div className="mt-2 pt-1 border-t border-slate-200/50 flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-mono">{p.code}</span>
                      <span className={`font-bold ${p.stock <= 5 ? 'text-rose-600' : 'text-slate-500'}`}>
                        {p.stock <= 5 ? '⚠️' : '📦'} {p.stock}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Shopping Cart (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col justify-between">
          <div>
            {/* Cart Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <i className="fas fa-shopping-basket text-[#f9a825]"></i>
                <span>سلة المشتريات</span>
              </h3>
              <span className="bg-[#1a2a6c] text-white px-3 py-0.5 rounded-full text-xs font-bold">
                {cart.reduce((s, i) => s + i.qty, 0)} عناصر
              </span>
            </div>

            {/* Customer Selector */}
            <div className="p-3 bg-slate-50 border-b border-slate-100">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                <i className="fas fa-user text-[#f9a825] ml-1"></i> العميل (اختياري):
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1a2a6c]"
              >
                <option value="">عميل نقدي (بدون تسجيل)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            {/* Cart Items List */}
            <div className="p-3 max-h-[300px] overflow-y-auto space-y-2 divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <i className="fas fa-shopping-basket text-4xl block mb-2 opacity-30"></i>
                  <div className="font-bold text-sm">السلة فارغة</div>
                  <div className="text-xs text-slate-400 mt-1">اضغط على أية سلعة لإضافتها</div>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="pt-2 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-800 truncate">{item.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {item.price.toLocaleString('ar-EG')} ج.م
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => changeQty(item.id, -1)}
                        className="w-6 h-6 rounded-full border border-slate-300 bg-white hover:bg-[#1a2a6c] hover:text-white transition-colors flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-bold text-xs w-5 text-center">{item.qty}</span>
                      <button
                        onClick={() => changeQty(item.id, 1)}
                        className="w-6 h-6 rounded-full border border-slate-300 bg-white hover:bg-[#1a2a6c] hover:text-white transition-colors flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* Item Total */}
                    <div className="font-bold text-xs text-[#1a2a6c] dir-ltr min-w-[65px] text-right">
                      {(item.price * item.qty).toLocaleString('ar-EG')}{' '}
                      <span className="text-[10px] text-[#f9a825]">ج.م</span>
                    </div>

                    {/* Delete Item */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-rose-500 hover:text-rose-700 text-sm px-1 cursor-pointer"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cart Summary Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>المجموع الفرعي:</span>
              <span className="font-bold dir-ltr">{subtotal.toLocaleString('ar-EG')} ج.م</span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1">
                <i className="fas fa-tag text-slate-400"></i> الخصم:
              </span>
              <div className="flex items-center gap-1">
                <span>ج.م</span>
                <input
                  type="number"
                  min="0"
                  value={discount || ''}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center font-bold text-slate-800 focus:outline-none focus:border-[#1a2a6c]"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-base font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>الإجمالي النهائي:</span>
              <span className="text-[#1a2a6c] text-lg font-black dir-ltr">
                {totalAmount.toLocaleString('ar-EG')} <span className="text-xs text-[#f9a825]">ج.م</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                disabled={cart.length === 0}
                onClick={handleCheckout}
                className="py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <i className="fas fa-check"></i>
                <span>إصدار الفاتورة</span>
              </button>
              <button
                onClick={clearCart}
                className="py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <i className="fas fa-trash"></i>
                <span>تفريغ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Printable Receipt Modal */}
      {receiptModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-slide-up relative">
            <button
              onClick={() => setReceiptModal(null)}
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 text-2xl font-bold cursor-pointer"
            >
              &times;
            </button>

            {/* Receipt Content */}
            <div id="printableReceipt" className="space-y-4 text-slate-800">
              {/* Header */}
              <div className="text-center border-b pb-3 border-dashed border-slate-200">
                <div className="text-xl font-black text-[#1a2a6c]">محل الاسراء لأدوات السباكة 🇪🇬</div>
                <div className="text-xs text-slate-500 font-light mt-0.5">القاهرة - مدينة نصر • هاتف: 012-3456-7890</div>
                <div className="inline-block mt-2 px-3 py-1 bg-amber-50 text-amber-800 font-mono font-bold text-xs rounded-full border border-amber-200">
                  فاتورة مبيعات #{receiptModal.invoiceNo}
                </div>
              </div>

              {/* Meta */}
              <div className="text-xs space-y-1 text-slate-600 bg-slate-50 p-3 rounded-xl">
                <div className="flex justify-between">
                  <span>العميل:</span>
                  <strong className="text-slate-900">{receiptModal.customerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>التاريخ والوقت:</span>
                  <span>{receiptModal.date} - {receiptModal.time}</span>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-2">المنتج</th>
                    <th className="py-2 text-center">الكمية</th>
                    <th className="py-2 text-left">السعر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receiptModal.items.map((it) => (
                    <tr key={it.id}>
                      <td className="py-2 font-bold text-slate-800">{it.name}</td>
                      <td className="py-2 text-center font-mono">{it.qty}</td>
                      <td className="py-2 text-left font-bold dir-ltr">
                        {(it.price * it.qty).toLocaleString('ar-EG')} ج.م
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="border-t border-dashed border-slate-200 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>المجموع:</span>
                  <span className="font-mono">{receiptModal.subtotal.toLocaleString('ar-EG')} ج.م</span>
                </div>
                {receiptModal.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>الخصم:</span>
                    <span className="font-mono">-{receiptModal.discount.toLocaleString('ar-EG')} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-[#1a2a6c] pt-2 border-t border-slate-200">
                  <span>الإجمالي المدفوع:</span>
                  <span className="font-mono text-lg">{receiptModal.total.toLocaleString('ar-EG')} ج.م</span>
                </div>
              </div>

              <div className="text-center text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                شكراً لتعاملكم مع محل الاسراء! نتمنى لكم يوماً سعيداً 🌺
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handlePrintInvoice}
                className="flex-1 py-3 bg-gradient-to-r from-[#1a2a6c] to-[#2a3f8f] text-white font-bold rounded-xl text-xs cursor-pointer shadow hover:shadow-lg transition-all"
              >
                <i className="fas fa-file-pdf ml-1"></i> طباعة الفاتورة (PDF)
              </button>
              <button
                onClick={handleCloseReceipt}
                className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                إغلاق
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
            onClick={handleExportCSV}
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
