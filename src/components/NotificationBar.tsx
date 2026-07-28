import React, { useState, useEffect } from 'react';

export const NotificationBar: React.FC = () => {
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const optionsDate: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Africa/Cairo'
      };
      const optionsTime: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Africa/Cairo'
      };

      setCurrentDateStr(now.toLocaleDateString('ar-EG', optionsDate));
      setCurrentTimeStr(now.toLocaleTimeString('ar-EG', optionsTime));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-r from-[#0d1b2a] to-[#1b2a4a] px-5 sm:px-10 py-1.5 flex flex-wrap justify-between items-center text-xs text-white/50 border-b border-amber-400/5 z-50">
      <div className="flex items-center gap-5 flex-wrap">
        <span className="flex items-center gap-1.5">
          <i className="fas fa-calendar-alt text-[#fdd835] text-[11px]"></i>
          <span>{currentDateStr || 'جاري التحميل...'}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <i className="fas fa-clock text-[#fdd835] text-[11px]"></i>
          <span>{currentTimeStr || 'جاري التحميل...'}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <i className="fas fa-map-marker-alt text-[#fdd835] text-[11px]"></i>
          <span>توقيت القاهرة 🇪🇬</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot"></span>
        <span className="text-white/60 font-light">
          السوق مفتوح • آخر تحديث: <span>{currentTimeStr || 'الان'}</span>
        </span>
      </div>
    </div>
  );
};
