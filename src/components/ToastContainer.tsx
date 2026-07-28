import React from 'react';
import { useStore } from '../context/StoreContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-r-emerald-600';
      case 'error':
        return 'border-r-red-600';
      default:
        return 'border-r-[#f9a825]';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'fa-check-circle text-emerald-500';
      case 'error':
        return 'fa-exclamation-circle text-red-500';
      default:
        return 'fa-info-circle text-amber-400';
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto bg-[#1a202c] text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-sm font-sans border-r-4 ${getBorderColor(
            toast.type
          )} animate-slide-in-right`}
        >
          <div className="flex items-center gap-3">
            <i className={`fas ${getIcon(toast.type)} text-xl`}></i>
            <span className="leading-snug">{toast.message}</span>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-white/40 hover:text-white transition-colors text-base"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      ))}
    </div>
  );
};
