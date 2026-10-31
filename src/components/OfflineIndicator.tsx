import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, Database } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] sm:bottom-6 left-4 right-4 sm:right-auto sm:max-w-md z-50 flex items-center justify-between gap-3 rounded-2xl bg-slate-900 text-white p-3.5 shadow-2xl border border-amber-500/40 animate-bounce">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
          <WifiOff className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <span className="font-bold text-amber-300 block">โหมดออฟไลน์ (Offline Mode)</span>
          <span className="text-slate-300 text-[11px]">
            กำลังใช้งานข้อมูลที่บันทึกไว้ในแคชบนอุปกรณ์ของคุณ
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-slate-800 px-2 py-1 rounded shrink-0">
        <Database className="w-3 h-3" />
        <span>Cached</span>
      </div>
    </div>
  );
};
