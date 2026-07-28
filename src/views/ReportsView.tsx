import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { exportToCSV, exportToPDF } from '../utils/export';

export const ReportsView: React.FC = () => {
  const { products, customers, transactions, showToast, refreshStoreData } = useStore();
  const [activeTab, setActiveTab] = useState<'sales' | 'profit' | 'inventory' | 'customers' | 'top'>('sales');

  // Computed Report Datasets
  // 1. Sales Report
  const totalSalesRevenue = transactions.filter((t) => t.status === 'done').reduce((s, t) => s + t.amount, 0);
  const totalInvoicesCount = transactions.filter((t) => t.status === 'done').length;
  const avgInvoiceValue = totalInvoicesCount > 0 ? Math.round(totalSalesRevenue / totalInvoicesCount) : 0;

  // 2. Profit Report
  const profitData = products.map((p) => {
    const qtySold = 10 + (p.id * 3) % 25; // derived simulation
    const profitPerUnit = p.sellPrice - p.buyPrice;
    const totalProfit = profitPerUnit * qtySold;
    return {
      product: p.name,
      qty: qtySold,
      sellPrice: p.sellPrice,
      buyPrice: p.buyPrice,
      profitPerUnit,
      totalProfit
    };
  });

  const netProfitTotal = profitData.reduce((s, i) => s + i.totalProfit, 0);

  // 3. Inventory Report
  const totalInventoryValue = products.reduce((s, p) => s + p.stock * p.buyPrice, 0);
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  // 4. Top Products (Ranked)
  const topProductsList = [...products]
    .map((p) => ({
      name: p.name,
      qty: Math.floor(p.id * 4 + 8),
      total: p.sellPrice * (p.id * 4 + 8),
      percentage: Math.round((p.sellPrice / 2500) * 100 * 10) / 10
    }))
    .sort((a, b) => b.total - a.total);

  const getReportData = () => {
    const today = new Date().toISOString().slice(0, 10);
    if (activeTab === 'sales') {
      const headers = ['رقم الفاتورة', 'العميل', 'بيان المنتجات', 'المبلغ (ج.م)', 'التاريخ', 'الوقت', 'الحالة'];
      const rows = transactions.map((t) => [
        t.invoiceNo,
        t.customerName,
        t.productName,
        t.amount,
        t.date,
        t.time,
        t.status === 'done' ? 'مكتملة' : 'ملغاة'
      ]);
      return { title: 'تقرير حركة المبيعات التفصيلي', headers, rows, filename: `تقرير_المبيعات_${today}` };
    } else if (activeTab === 'profit') {
      const headers = ['المنتج', 'الكمية المباعة', 'سعر الشراء (ج.م)', 'سعر البيع (ج.م)', 'ربح القطعة (ج.م)', 'إجمالي الربح (ج.م)'];
      const rows = profitData.map((i) => [
        i.product,
        i.qty,
        i.buyPrice,
        i.sellPrice,
        i.profitPerUnit,
        i.totalProfit
      ]);
      return { title: 'تقرير أرباح المنتجات والمبيعات', headers, rows, filename: `تقرير_الأرباح_${today}` };
    } else if (activeTab === 'inventory') {
      const headers = ['الكود', 'الاسم', 'سعر الشراء (ج.م)', 'سعر البيع (ج.م)', 'الكمية المتبقية', 'قيمة المخزون (ج.م)'];
      const rows = products.map((p) => [
        p.code,
        p.name,
        p.buyPrice,
        p.sellPrice,
        p.stock,
        p.stock * p.buyPrice
      ]);
      return { title: 'تقرير جرد وقيمة المخزون', headers, rows, filename: `تقرير_جرد_المخزون_${today}` };
    } else if (activeTab === 'customers') {
      const headers = ['اسم العميل', 'رقم الهاتف', 'المشتريات (ج.م)', 'المدفوع (ج.م)', 'المتبقي (ج.م)', 'الحالة'];
      const rows = customers.map((c) => [
        c.name,
        c.phone,
        c.totalPurchases,
        c.paid,
        c.totalPurchases - c.paid,
        c.status === 'paid' ? 'مدفوع' : c.status === 'partial' ? 'جزئي' : c.status === 'unpaid' ? 'غير مدفوع' : 'متأخر'
      ]);
      return { title: 'تقرير ديون وحسابات العملاء', headers, rows, filename: `تقرير_حسابات_العملاء_${today}` };
    } else {
      const headers = ['المنتج', 'إجمالي القطع المباعة', 'إجمالي الإيراد (ج.م)', 'النسبة من المبيعات'];
      const rows = topProductsList.map((t) => [
        t.name,
        t.qty,
        t.total,
        `${t.percentage}%`
      ]);
      return { title: 'تقرير الأصناف الأكثر مبيعا ورواجا', headers, rows, filename: `تقرير_الأكثر_مبيعا_${today}` };
    }
  };

  const handleExportCSV = () => {
    const { headers, rows, filename } = getReportData();
    exportToCSV(`${filename}.csv`, headers, rows);
    showToast('📊 تم تصدير التقرير بملف Excel/CSV بنجاح!', 'success');
  };

  const handleExportPDF = () => {
    const { title, headers, rows } = getReportData();
    exportToPDF(title, headers, rows);
    showToast('📄 جاري تجهيز تقرير PDF والطباعة...', 'info');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <i className="fas fa-chart-pie text-[#f9a825]"></i>
          <span>التقارير والتحليلات</span>
          <span className="text-sm font-normal text-slate-400">(آخر 30 يوم)</span>
        </h1>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportPDF}
            className="bg-gradient-to-r from-[#1a2a6c] to-[#2a3f8f] text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <i className="fas fa-file-pdf"></i>
            <span>تصدير PDF</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-white border border-slate-200 text-slate-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <i className="fas fa-file-excel text-emerald-600"></i>
            <span>تصدير Excel</span>
          </button>
          <button
            onClick={() => window.print()}
            className="bg-white border border-slate-200 text-slate-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <i className="fas fa-print text-slate-500"></i>
            <span>طباعة</span>
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex gap-1.5 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'sales'
              ? 'bg-[#1a2a6c] text-white shadow'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <i className="fas fa-chart-line"></i>
          <span>المبيعات</span>
        </button>

        <button
          onClick={() => setActiveTab('profit')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'profit'
              ? 'bg-[#1a2a6c] text-white shadow'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <i className="fas fa-coins"></i>
          <span>الأرباح</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'bg-[#1a2a6c] text-white shadow'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <i className="fas fa-boxes"></i>
          <span>المخزون</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'customers'
              ? 'bg-[#1a2a6c] text-white shadow'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <i className="fas fa-users"></i>
          <span>العملاء</span>
        </button>

        <button
          onClick={() => setActiveTab('top')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'top'
              ? 'bg-[#1a2a6c] text-white shadow'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <i className="fas fa-trophy"></i>
          <span>الأفضل</span>
        </button>
      </div>

      {/* Tab 1: Sales Report */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-xs text-slate-400 font-medium mb-1">إجمالي المبيعات</div>
              <div className="text-xl sm:text-2xl font-black text-slate-800 dir-ltr text-right">
                {totalSalesRevenue.toLocaleString('ar-EG')} <span className="text-xs text-[#f9a825]">ج.م</span>
              </div>
              <div className="text-xs text-emerald-600 mt-1 font-bold">▲ +8.5% عن الشهر الماضي</div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-xs text-slate-400 font-medium mb-1">عدد الفواتير</div>
              <div className="text-xl sm:text-2xl font-black text-slate-800">{totalInvoicesCount}</div>
              <div className="text-xs text-emerald-600 mt-1 font-bold">▲ +12% عن الشهر الماضي</div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-xs text-slate-400 font-medium mb-1">متوسط الفاتورة</div>
              <div className="text-xl sm:text-2xl font-black text-slate-800 dir-ltr text-right">
                {avgInvoiceValue.toLocaleString('ar-EG')} <span className="text-xs text-[#f9a825]">ج.م</span>
              </div>
              <div className="text-xs text-amber-600 mt-1 font-bold">━ ثابت</div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-xs text-slate-400 font-medium mb-1">مبيعات اليوم</div>
              <div className="text-xl sm:text-2xl font-black text-slate-800 dir-ltr text-right">
                1,850 <span className="text-xs text-[#f9a825]">ج.م</span>
              </div>
              <div className="text-xs text-emerald-600 mt-1 font-bold">▲ +5% عن الأمس</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-slate-700 font-bold text-xs uppercase border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">رقم الفاتورة</th>
                    <th className="py-3 px-4">التاريخ والوقت</th>
                    <th className="py-3 px-4">العميل</th>
                    <th className="py-3 px-4">المنتج الرئيسي</th>
                    <th className="py-3 px-4">المبلغ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-[#1a2a6c]">{t.invoiceNo}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">{t.date} - {t.time}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{t.customerName}</td>
                      <td className="py-3 px-4 text-slate-700">{t.productName}</td>
                      <td className="py-3 px-4 font-bold text-[#1a2a6c] dir-ltr text-right">
                        {t.amount.toLocaleString('ar-EG')} <span className="text-xs text-[#f9a825]">ج.م</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Profit Report */}
      {activeTab === 'profit' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-xs text-slate-400 font-medium mb-1">صافي الربح المتوقع</div>
              <div className="text-2xl font-black text-emerald-600 dir-ltr text-right">
                +{netProfitTotal.toLocaleString('ar-EG')} <span className="text-xs text-[#f9a825]">ج.م</span>
              </div>
              <div className="text-xs text-emerald-600 font-bold mt-1">▲ +10.2% هذا الشهر</div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-xs text-slate-400 font-medium mb-1">متوسط هامش الربح</div>
              <div className="text-2xl font-black text-slate-800">41%</div>
              <div className="text-xs text-emerald-600 font-bold mt-1">▲ ممتاز</div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-xs text-slate-400 font-medium mb-1">تكلفة البضاعة المباعة</div>
              <div className="text-2xl font-black text-slate-800 dir-ltr text-right">
                26,710 <span className="text-xs text-[#f9a825]">ج.م</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">تكلفة الشراء</div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-xs text-slate-400 font-medium mb-1">أعلى ربحية</div>
              <div className="text-base font-black text-[#1a2a6c] truncate">مضخة ماء 2 حصان</div>
              <div className="text-xs text-emerald-600 font-bold mt-1">هامش ربح +52%</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-slate-700 font-bold text-xs uppercase border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">المنتج</th>
                    <th className="py-3 px-4">الكمية المباعة</th>
                    <th className="py-3 px-4">سعر البيع</th>
                    <th className="py-3 px-4">تكلفة الشراء</th>
                    <th className="py-3 px-4">الربح/وحدة</th>
                    <th className="py-3 px-4">إجمالي الربح</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profitData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-800">{item.product}</td>
                      <td className="py-3 px-4 font-mono">{item.qty}</td>
                      <td className="py-3 px-4 font-bold text-slate-800 dir-ltr text-right">
                        {item.sellPrice.toLocaleString('ar-EG')} ج.م
                      </td>
                      <td className="py-3 px-4 text-slate-500 dir-ltr text-right">
                        {item.buyPrice.toLocaleString('ar-EG')} ج.م
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600 dir-ltr text-right">
                        +{item.profitPerUnit.toLocaleString('ar-EG')} ج.م
                      </td>
                      <td className="py-3 px-4 font-black text-emerald-600 dir-ltr text-right">
                        +{item.totalProfit.toLocaleString('ar-EG')} ج.م
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Inventory Report */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-xs text-slate-400 font-medium mb-1">إجمالي المنتجات</div>
              <div className="text-2xl font-black text-slate-800">{products.length}</div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-xs text-slate-400 font-medium mb-1">إجمالي القطع بالخزن</div>
              <div className="text-2xl font-black text-slate-800">
                {products.reduce((s, p) => s + p.stock, 0)} قطعة
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-xs text-slate-400 font-medium mb-1">منتجات منخفضة</div>
              <div className="text-2xl font-black text-rose-600">{lowStockCount}</div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-xs text-slate-400 font-medium mb-1">قيمة المخزون الإجمالية</div>
              <div className="text-2xl font-black text-[#1a2a6c] dir-ltr text-right">
                {totalInventoryValue.toLocaleString('ar-EG')} <span className="text-xs text-[#f9a825]">ج.م</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-slate-700 font-bold text-xs uppercase border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">المنتج</th>
                    <th className="py-3 px-4">الفئة</th>
                    <th className="py-3 px-4">الكمية</th>
                    <th className="py-3 px-4">الحد الأدنى</th>
                    <th className="py-3 px-4">الحالة</th>
                    <th className="py-3 px-4">قيمة المخزون (سعر الشراء)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => {
                    const val = p.stock * p.buyPrice;
                    const isLow = p.stock <= p.minStock;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-800">{p.name}</td>
                        <td className="py-3 px-4 text-slate-600">{p.category}</td>
                        <td className="py-3 px-4 font-bold">{p.stock}</td>
                        <td className="py-3 px-4 text-slate-400">{p.minStock}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              isLow ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {isLow ? '⚠️ منخفض' : '✅ جيد'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-[#1a2a6c] dir-ltr text-right">
                          {val.toLocaleString('ar-EG')} ج.م
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Customers Report */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-slate-700 font-bold text-xs uppercase border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">العميل</th>
                    <th className="py-3 px-4">الهاتف</th>
                    <th className="py-3 px-4">إجمالي المشتريات</th>
                    <th className="py-3 px-4">المدفوع</th>
                    <th className="py-3 px-4">الدين المتبقي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c, idx) => {
                    const remaining = c.totalPurchases - c.paid;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-600">{c.phone}</td>
                        <td className="py-3 px-4 font-bold dir-ltr text-right">{c.totalPurchases.toLocaleString('ar-EG')} ج.م</td>
                        <td className="py-3 px-4 font-bold text-emerald-600 dir-ltr text-right">{c.paid.toLocaleString('ar-EG')} ج.م</td>
                        <td
                          className={`py-3 px-4 font-bold dir-ltr text-right ${
                            remaining > 0 ? 'text-rose-600' : 'text-slate-400'
                          }`}
                        >
                          {remaining.toLocaleString('ar-EG')} ج.م
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Top Products Report */}
      {activeTab === 'top' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-slate-700 font-bold text-xs uppercase border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">الترتيب</th>
                    <th className="py-3 px-4">المنتج</th>
                    <th className="py-3 px-4">الكمية التقديرية المباعة</th>
                    <th className="py-3 px-4">إجمالي المبيعات</th>
                    <th className="py-3 px-4">نسبة المشاركة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topProductsList.map((item, idx) => {
                    let rankBadge = `#${idx + 1}`;
                    let rankClass = 'bg-slate-100 text-slate-600';
                    if (idx === 0) {
                      rankBadge = '🥇';
                      rankClass = 'bg-amber-100 text-amber-800 text-base';
                    } else if (idx === 1) {
                      rankBadge = '🥈';
                      rankClass = 'bg-slate-200 text-slate-800 text-base';
                    } else if (idx === 2) {
                      rankBadge = '🥉';
                      rankClass = 'bg-amber-50 text-amber-900 text-base';
                    }

                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${rankClass}`}>
                            {rankBadge}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                        <td className="py-3 px-4 font-mono font-bold">{item.qty} قطعة</td>
                        <td className="py-3 px-4 font-black text-[#1a2a6c] dir-ltr text-right">
                          {item.total.toLocaleString('ar-EG')} ج.م
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-600">{item.percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
