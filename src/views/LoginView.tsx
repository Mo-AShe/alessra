import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { UserRole } from '../types';

export const LoginView: React.FC = () => {
  const { login } = useStore();

  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    // Pre-fill demo credentials for the selected role so the user can
    // log in quickly during development. Real users will type their own.
    if (role === 'admin') {
      setEmail('admin@al-esraa.com');
      setPassword('admin123');
    } else {
      setEmail('employee@al-esraa.com');
      setPassword('emp123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('⚠️ من فضلك أدخل البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    const success = await login(email, password);
    setLoading(false);

    if (!success) {
      setErrorMsg('❌ البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1a3a] via-[#1a2a6c] to-[#2a3f8f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating background graphic */}
      <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_30%_50%,rgba(255,215,0,0.03),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(255,215,0,0.02),transparent_50%)] animate-bg-float pointer-events-none"></div>

      {/* Login Card */}
      <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-8 sm:p-11 max-w-md w-full border border-white/10 shadow-2xl shadow-black/50 relative z-10 animate-slide-up">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="w-[72px] h-[72px] bg-gradient-to-br from-[#fdd835] to-[#f9a825] rounded-2xl flex items-center justify-center text-3xl text-[#0f1a3a] mx-auto mb-3 shadow-lg shadow-[#fdd835]/25 relative">
            <i className="fas fa-wrench"></i>
            <span className="absolute -bottom-1 -right-1 text-base">🇪🇬</span>
          </div>
          <div className="text-3xl font-black text-white tracking-wide">
            محل <span className="text-[#fdd835]">الاسراء</span>
          </div>
          <div className="text-xs text-white/40 font-light tracking-widest mt-1">
            ✦ أدوات سباكة ✦
          </div>
        </div>

        <div className="text-center text-white/70 text-sm mb-6 font-light">
          👋 مرحباً بك! <strong className="text-white font-bold">سجل الدخول</strong> لإدارة المحل
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="bg-red-500/15 border border-red-500/30 text-red-300 p-3 rounded-xl text-sm mb-5 flex items-center gap-2">
            <i className="fas fa-exclamation-circle text-red-400"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div
              onClick={() => handleRoleSelect('admin')}
              className={`p-3.5 rounded-2xl border-2 text-center cursor-pointer transition-all ${
                selectedRole === 'admin'
                  ? 'border-[#fdd835] bg-[#fdd835]/10 text-[#fdd835]'
                  : 'border-white/5 bg-white/2 text-white/40 hover:bg-white/5'
              }`}
            >
              <div className="text-sm font-bold">👑 مدير</div>
              <div className="text-[11px] opacity-60">صلاحية كاملة</div>
            </div>

            <div
              onClick={() => handleRoleSelect('employee')}
              className={`p-3.5 rounded-2xl border-2 text-center cursor-pointer transition-all ${
                selectedRole === 'employee'
                  ? 'border-[#fdd835] bg-[#fdd835]/10 text-[#fdd835]'
                  : 'border-white/5 bg-white/2 text-white/40 hover:bg-white/5'
              }`}
            >
              <div className="text-sm font-bold">👤 موظف</div>
              <div className="text-[11px] opacity-60">مبيعات فقط</div>
            </div>
          </div>

          {/* Email input */}
          <div className="mb-4">
            <label className="block text-white/50 text-xs font-semibold mb-1">
              📧 البريد الإلكتروني
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full py-3.5 pr-12 pl-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#fdd835]/40 focus:bg-white/10 transition-all"
              />
              <i className="fas fa-envelope absolute right-4 top-1/2 -translate-y-1/2 text-white/20 text-lg"></i>
            </div>
          </div>

          {/* Password input */}
          <div className="mb-5">
            <label className="block text-white/50 text-xs font-semibold mb-1">
              🔑 كلمة المرور
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full py-3.5 pr-12 pl-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#fdd835]/40 focus:bg-white/10 transition-all"
              />
              <i className="fas fa-lock absolute right-4 top-1/2 -translate-y-1/2 text-white/20 text-lg"></i>
            </div>
          </div>

          {/* Options */}
          <div className="flex justify-between items-center text-xs text-white/40 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-[#fdd835]" />
              <span>تذكرني</span>
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#fdd835] to-[#f9a825] text-[#0f1a3a] font-black text-lg shadow-lg shadow-[#fdd835]/20 hover:shadow-xl hover:shadow-[#fdd835]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                <span>جاري التحقق...</span>
              </>
            ) : (
              <>
                <i className="fas fa-arrow-right"></i>
                <span>دخول</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 text-white/20 text-xs tracking-wider">
          محل الاسراء لأدوات السباكة © 2026
        </div>
      </div>
    </div>
  );
};
