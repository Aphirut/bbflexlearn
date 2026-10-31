import React from 'react';
import { useApp } from '../context/AppContext';
import { EmailNotification } from '../types';
import { Bell, CheckCheck, ExternalLink, X, Mail } from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNotification: (notification: EmailNotification) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  onSelectNotification
}) => {
  const { notifications, markAllNotificationsRead } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-white h-full pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] shadow-2xl flex flex-col border-l border-slate-200">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">การแจ้งเตือนและอีเมล ({notifications.length})</h2>
              <p className="text-[11px] text-slate-500">ระบบจำลองการส่งเข้า Email อัตโนมัติ</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllNotificationsRead}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              title="อ่านทั้งหมด"
            >
              <CheckCheck className="w-4 h-4" />
              <span>อ่านทั้งหมด</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              ไม่มีการแจ้งเตือนในขณะนี้
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => onSelectNotification(notif)}
                className={`p-3.5 rounded-xl cursor-pointer transition-colors flex items-start gap-3 my-1 ${
                  !notif.isRead ? 'bg-indigo-50/60 hover:bg-indigo-50' : 'bg-white hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs mt-0.5 ${
                  !notif.isRead ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Mail className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-xs font-semibold leading-tight line-clamp-1 ${!notif.isRead ? 'text-indigo-950 font-bold' : 'text-slate-800'}`}>
                      {notif.subject}
                    </h3>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">{notif.sentAt}</span>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {notif.previewText}
                  </p>

                  <div className="flex items-center gap-2 text-[10px] text-indigo-600 pt-0.5 font-medium">
                    <span>เปิดอ่านข้อความฉบับเต็ม</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
