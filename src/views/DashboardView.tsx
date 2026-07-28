import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { exportToPDF, exportToCSV } from '../utils/export';

export const DashboardView: React.FC = () => {
  const { products, customers, transactions, showToast, refreshStoreData, setCurrentPage } = useStore();
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('week');

  // Computed metrics
  const totalSales = transactions
    .filter((t) => t.status === 'done')
    .reduce((sum, t) => sum + t.amount, 0);

  const soldProductsCount = 156 + transactions.length * 2;
  const todayInvoicesCount = transactions.filter((t) => t.status === 'done').length;
  const activeCustomersCount = customers.filter((c) => c.status === 'paid' || c.status === 'partial').length;

  // Low stock alerts
  const alertProducts = products.filter((p) => p.stock <= p.minStock);

  // Chart data
  const chartData = {
    week: {
      labels: ['أحد', 'اثن', 'ثلث', 'أرب', 'خم', 'جم', 'سبت'],
      values: [4200, 5800, 3900, 7200, 5100, 4600, 6500]
    },
    month: {
      labels: ['أسبوع 1', 'أسبوع 2', 'أسبوع 3', 'أسبوع 4'],
      values: [18500, 23400, 21000, 28900]
    },
    year: {
      labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
      values: [52000, 68000, 49000, 82000, 74000, 95000]
    }
  };

  const currentChart = chartData[chartPeriod];
  const maxChartVal = Math.max(...currentChart.values);
  const colors = ['#1a2a6c', '#2a3f8f', '#3a5a9f', '#5a7abf', '#7a9adf', '#9abaff', '#bad4ff'];

  const handleExportDashboardPDF = () => {
    const headers = ['المؤشر / البيان', 'القيمة / العشرات'];
    const rows = [
      ['إجمالي المبيعات', `${totalSales.toLocaleString('ar-EG')} ج.م`],
      ['عدد الفواتير المنفذة', `${todayInvoicesCount} فاتورة`],
      ['إجمالي الأصناف المسجلة', `${products.length} صنف`],
      ['إجمالي العملاء', `${customers.length} عميل`],
      ['تنبيهات نقص المخزون', `${alertProducts.length} أصناف بحاجة لإعادة طلب`]
    ];
    exportToPDF('التقرير المالي والتنفيذي الشامل - محل الإسراء', headers, rows);
    showToast('📄 جاري تجهيز التقرير التنفيذي PDF والطباعة...', 'info');
  };

  const handleExportDashboardCSV = () => {
    const headers = ['المؤشر / البيان', 'القيمة / العشرات'];
    const rows = [
      ['إجمالي المبيعات', `${totalSales} ج.م`],
      ['عدد الفواتير المنفذة', `${todayInvoicesCount}`],
      ['إجمالي الأصناف المسجلة', `${products.length}`],
      ['إجمالي العملاء', `${customers.length}`],
      ['تنبيهات نقص المخزون', `${alertProducts.length}`]
    ];
    exportToCSV(`التقرير_الرئيسي_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    showToast('📊 تم تصدير الملخص التنفيذي بملف Excel/CSV بنجاح!', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick Action Buttons Banner */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a2a6c] to-[#2a3f8f] text-[#fdd835] flex items-center justify-center font-bold text-lg shadow-sm">
            <i className="fas fa-bolt"></i>
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm sm:text-base">إجراءات سريعة للمتجر</h2>
            <p className="text-xs text-slate-400">وصول مباشر لأهم عمليات البيع والمخزون</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCurrentPage('pos')}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
          >
            <i className="fas fa-[#f9a825] fa-shopping-cart"></i>
            <span>فاتورة بيع جديدة</span>
          </button>

          <button
            onClick={() => setCurrentPage('inventory')}
            className="bg-[#1a2a6c] hover:bg-[#0f1a3a] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
          >
            <i className="fas fa-plus"></i>
            <span>إضافة منتج</span>
          </button>

          <button
            onClick={() => setCurrentPage('customers')}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
          >
            <i className="fas fa-user-plus"></i>
            <span>تسجيل عميل</span>
          </button>

          <button
            onClick={() => setCurrentPage('reports')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <i className="fas fa-chart-line text-[#1a2a6c]"></i>
            <span>التقارير</span>
          </button>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Sales */}
        <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group border border-slate-100">
          <div className="w-[58px] h-[58px] rounded-2xl bg-gradient-to-br from-[#1a2a6c] to-[#2a3f8f] flex items-center justify-center text-2xl text-white flex-shrink-0 shadow-md shadow-[#1a2a6c]/20">
            <i className="fas fa-money-bill-wave text-[#fdd835]"></i>
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-400 font-medium mb-1">إجمالي المبيعات</div>
            <div className="text-2xl font-black text-slate-800 dir-ltr text-right">
              {totalSales.toLocaleString('ar-EG')} <span className="text-sm font-semibold text-[#f9a825]">ج.م</span>
            </div>
            <div className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <i className="fas fa-arrow-up text-[10px]"></i>
              <span>12.5% عن الأمس</span>
            </div>
          </div>
        </div>

        {/* Card 2: Sold Products */}
        <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group border border-slate-100">
          <div className="w-[58px] h-[58px] rounded-2xl bg-gradient-to-br from-[#0f6e3f] to-[#1a9c5a] flex items-center justify-center text-2xl text-white flex-shrink-0 shadow-md shadow-emerald-700/20">
            <i className="fas fa-box text-emerald-200"></i>
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-400 font-medium mb-1">المنتجات المباعة</div>
            <div className="text-2xl font-black text-slate-800">{soldProductsCount}</div>
            <div className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <i className="fas fa-arrow-up text-[10px]"></i>
              <span>8% عن الأمس</span>
            </div>
          </div>
        </div>

        {/* Card 3: Today Invoices */}
        <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group border border-slate-100">
          <div className="w-[58px] h-[58px] rounded-2xl bg-gradient-to-br from-[#b7791f] to-[#d69e2e] flex items-center justify-center text-2xl text-white flex-shrink-0 shadow-md shadow-amber-600/20">
            <i className="fas fa-file-invoice text-amber-100"></i>
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-400 font-medium mb-1">الفواتير اليوم</div>
            <div className="text-2xl font-black text-slate-800">{todayInvoicesCount}</div>
            <div className="text-xs font-semibold text-amber-600 mt-1 flex items-center gap-1">
              <i className="fas fa-minus text-[10px]"></i>
              <span>معدل ممتاز</span>
            </div>
          </div>
        </div>

        {/* Card 4: Active Customers */}
        <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group border border-slate-100">
          <div className="w-[58px] h-[58px] rounded-2xl bg-gradient-to-br from-[#9b2c2c] to-[#c53030] flex items-center justify-center text-2xl text-white flex-shrink-0 shadow-md shadow-rose-700/20">
            <i className="fas fa-users text-rose-200"></i>
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-400 font-medium mb-1">العملاء النشطاء</div>
            <div className="text-2xl font-black text-slate-800">{activeCustomersCount}</div>
            <div className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <i className="fas fa-arrow-up text-[10px]"></i>
              <span>3 جديدين</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Transactions + Low Stock Alerts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table: Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center flex-wrap gap-2">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <i className="fas fa-clock text-[#1a2a6c]"></i>
              <span>آخر المعاملات</span>
            </h3>
            <button
              onClick={() => setCurrentPage('pos')}
              className="text-[#1a2a6c] text-xs font-bold px-3 py-1.5 rounded-full bg-[#1a2a6c]/5 hover:bg-[#1a2a6c]/10 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>عرض الكل</span>
              <i className="fas fa-arrow-left text-[10px]"></i>
            </button>
          </div>

          <div className="p-4 overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b-2 border-slate-100 text-slate-500 text-xs font-semibold uppercase">
                  <th className="py-2.5 px-3">الوقت</th>
                  <th className="py-2.5 px-3">العميل</th>
                  <th className="py-2.5 px-3">المنتج</th>
                  <th className="py-2.5 px-3">المبلغ</th>
                  <th className="py-2.5 px-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.slice(0, 6).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-slate-600 font-mono text-xs">{t.time}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{t.customerName}</td>
                    <td className="py-3 px-3 text-slate-700">{t.productName}</td>
                    <td className="py-3 px-3 font-bold text-[#1a2a6c] dir-ltr text-right">
                      {t.amount.toLocaleString('ar-EG')} <span className="text-xs text-[#f9a825]">ج.م</span>
                    </td>
                    <td className="py-3 px-3">
                      {t.status === 'done' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                          ✅ تم
                        </span>
                      )}
                      {t.status === 'pending' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/50">
                          ⏳ معلق
                        </span>
                      )}
                      {t.status === 'canceled' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/50">
                          ❌ ملغي
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <i className="fas fa-exclamation-triangle text-amber-500"></i>
                <span>تنبيهات المخزون</span>
              </h3>
              <span className="bg-rose-600 text-white font-bold text-xs px-3 py-0.5 rounded-full shadow-sm shadow-rose-600/30">
                {alertProducts.length}
              </span>
            </div>

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {alertProducts.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <i className="fas fa-check-circle text-3xl text-emerald-500 mb-2 block"></i>
                  المخزون متوفر وفي حالة جيدة!
                </div>
              ) : (
                alertProducts.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold">
                        <i className="fas fa-exclamation-circle"></i>
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-slate-800">{item.name}</div>
                        <div className="text-xs text-slate-500">
                          المتبقي: <strong className="text-rose-600 font-bold">{item.stock}</strong> (الحد الأدنى: {item.minStock})
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => showToast(`📦 طلب إعادة توريد لـ ${item.name}`, 'info')}
                      className="bg-gradient-to-r from-[#1a2a6c] to-[#2a3f8f] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm hover:scale-105 transition-transform cursor-pointer"
                    >
                      أعد الطلب
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => setCurrentPage('inventory')}
            className="w-full mt-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors text-center cursor-pointer"
          >
            إدارة كل منتجات المخزون →
          </button>
        </div>
      </section>

      {/* Sales Analysis Chart */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100 flex-wrap gap-2">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <i className="fas fa-chart-line text-[#1a2a6c]"></i>
            <span>تحليل المبيعات</span>
          </h3>
          <select
            value={chartPeriod}
            onChange={(e) => setChartPeriod(e.target.value as any)}
            className="px-4 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-[#1a2a6c] cursor-pointer"
          >
            <option value="week">📅 هذا الأسبوع</option>
            <option value="month">📆 هذا الشهر</option>
            <option value="year">📈 هذا العام</option>
          </select>
        </div>

        {/* Custom Bar Chart Visualizer */}
        <div className="pt-6 pb-2">
          <div className="flex justify-around items-end h-[200px] gap-2 pt-4 px-2">
            {currentChart.values.map((val, idx) => {
              const heightPercent = Math.max((val / maxChartVal) * 100, 12);
              const barColor = colors[idx % colors.length];

              return (
                <div key={idx} className="flex flex-col items-center gap-2 flex-1 max-w-[60px] group relative">
                  <div
                    style={{
                      height: `${heightPercent}%`,
                      background: `linear-gradient(180deg, ${barColor}, ${colors[(idx + 1) % colors.length]})`
                    }}
                    className="w-full rounded-t-xl rounded-b-sm transition-all duration-500 hover:opacity-85 hover:scale-y-[1.03] origin-bottom cursor-pointer relative"
                  >
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-md">
                      ج.م {val.toLocaleString('ar-EG')}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-500">{currentChart.labels[idx]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

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
            onClick={handleExportDashboardPDF}
            className="bg-gradient-to-r from-[#1a2a6c] to-[#2a3f8f] text-white text-xs font-bold px-4 py-2 rounded-full shadow hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <i className="fas fa-file-pdf ml-1.5"></i> تصدير PDF
          </button>
          <button
            onClick={handleExportDashboardCSV}
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
