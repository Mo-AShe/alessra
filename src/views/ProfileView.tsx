import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';

export const ProfileView: React.FC = () => {
  const { currentUserSession, logout, updateUserProfile, changeUserPassword, showToast, refreshStoreData } = useStore();

  const user = currentUserSession?.user;
  const initialPhone = localStorage.getItem('userPhone') || '012-3456-7890';

  const [fullName, setFullName] = useState(user?.name || 'أحمد إبراهيم');
  const [phone, setPhone] = useState(initialPhone);

  // Change password modal
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handleSaveProfile = () => {
    if (!fullName.trim()) {
      showToast('⚠️ يرجى أدخال الاسم الكامل', 'error');
      return;
    }
    updateUserProfile(fullName.trim(), phone.trim());
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass || !newPass) {
      showToast('⚠️ يرجى ملء حقول كلمة المرور', 'error');
      return;
    }

    if (newPass.length < 4) {
      showToast('⚠️ يجب أن تكون كلمة المرور 4 أحرف على الأقل', 'error');
      return;
    }

    if (newPass !== confirmPass) {
      showToast('❌ كلمات المرور الجديدة غير متطابقة', 'error');
      return;
    }

    const ok = await changeUserPassword(currentPass, newPass);
    if (ok) {
      setIsPassModalOpen(false);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <i className="fas fa-user text-[#f9a825]"></i>
          <span>الملف الشخصي</span>
          <span className="text-sm font-normal text-slate-400">(بياناتي)</span>
        </h1>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleSaveProfile}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <i className="fas fa-save"></i>
            <span>حفظ التعديلات</span>
          </button>
          <button
            onClick={() => setIsPassModalOpen(true)}
            className="bg-white border border-slate-200 text-[#1a2a6c] font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <i className="fas fa-key"></i>
            <span>تغيير كلمة المرور</span>
          </button>
          <button
            onClick={() => logout()}
            className="bg-rose-50 border border-rose-200 text-rose-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-rose-100 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-br from-[#1a2a6c] via-[#2a3f8f] to-[#0f1a3a] p-8 text-center text-white relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#fdd835] to-[#f9a825] border-4 border-white/20 shadow-xl flex items-center justify-center text-4xl font-black text-[#0f1a3a] mx-auto mb-3">
            {fullName.charAt(0)}
          </div>
          <div className="text-2xl font-black">{fullName}</div>
          <div className="text-xs text-white/60 font-light mt-1">{user?.role || 'مدير النظام'}</div>
          <div className="inline-flex items-center gap-2 mt-3 px-4 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot"></span>
            <span>نشط حالياً بالنظام</span>
          </div>
        </div>

        {/* Body Fields */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                <i className="fas fa-user text-[#f9a825] ml-1"></i> الاسم الكامل
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c] text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                <i className="fas fa-envelope text-[#f9a825] ml-1"></i> البريد الإلكتروني
              </label>
              <input
                type="email"
                disabled
                value={user?.email || 'admin@al-esraa.com'}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                <i className="fas fa-phone text-[#f9a825] ml-1"></i> رقم الهاتف
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c] text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                <i className="fas fa-id-badge text-[#f9a825] ml-1"></i> درجة الصلاحية
              </label>
              <input
                type="text"
                disabled
                value={user?.roleCode === 'admin' ? 'صلاحيات كاملة (مدير)' : 'صلاحيات محدودة (موظف مبيعات)'}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 font-semibold cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="flex items-center gap-1.5 text-slate-400">
                <i className="fas fa-clock text-[#f9a825]"></i> آخر تسجيل دخول:
              </span>
              <span className="font-mono text-slate-800">
                {currentUserSession?.loginTime
                  ? new Date(currentUserSession.loginTime).toLocaleString('ar-EG')
                  : '2026-07-27 15:00:00'}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="flex items-center gap-1.5 text-slate-400">
                <i className="fas fa-calendar-check text-[#f9a825]"></i> تاريخ الانضمام:
              </span>
              <span className="font-mono text-slate-800">2026-01-15</span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="flex items-center gap-1.5 text-slate-400">
                <i className="fas fa-store text-[#f9a825]"></i> الفرع / المتجر:
              </span>
              <span className="font-bold text-slate-900">محل الاسراء لأدوات السباكة 🇪🇬</span>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {isPassModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <i className="fas fa-key text-[#f9a825]"></i>
                <span>تغيير كلمة المرور</span>
              </h2>
              <button onClick={() => setIsPassModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-2xl font-bold cursor-pointer">
                &times;
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">كلمة المرور الحالية</label>
                <input
                  type="password"
                  required
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  required
                  min="4"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تأكيد كلمة المرور الجديدة</label>
                <input
                  type="password"
                  required
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1a2a6c]"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-[#1a2a6c] to-[#2a3f8f] text-white font-bold rounded-xl shadow cursor-pointer text-xs"
                >
                  حفظ كلمة المرور
                </button>
                <button
                  type="button"
                  onClick={() => setIsPassModalOpen(false)}
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
        </div>
        <button
          onClick={refreshStoreData}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-full transition-all cursor-pointer"
        >
          <i className="fas fa-sync-alt ml-1.5"></i> تحديث
        </button>
      </div>
    </div>
  );
};
