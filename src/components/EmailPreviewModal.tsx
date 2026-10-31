import React from 'react';
import { EmailNotification } from '../types';
import { useApp } from '../context/AppContext';
import { Mail, Check, X, ShieldCheck } from 'lucide-react';

interface EmailPreviewModalProps {
  notification: EmailNotification | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  notification,
  isOpen,
  onClose
}) => {
  const { markNotificationRead } = useApp();

  if (!isOpen || !notification) return null;

  const handleMarkAsRead = () => {
    markNotificationRead(notification.id);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="relative m-auto w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Email Client Simulated Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800">BB FlexLearn Mail Client (จำลองอีเมลแจ้งเตือน)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Meta Bar */}
        <div className="p-6 bg-slate-50/50 border-b border-slate-200/70 space-y-2 text-xs">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {notification.subject}
            </h2>
            <span className="text-[11px] font-mono text-slate-400 shrink-0">{notification.sentAt}</span>
          </div>

          <div className="pt-2 text-slate-600 space-y-1">
            <p>
              <span className="text-slate-400 font-medium">จาก (From):</span> BB FlexLearn Notifications &lt;system@bbflexlearn.th&gt;
            </p>
            <p>
              <span className="text-slate-400 font-medium">ถึง (To):</span> {notification.toName} &lt;{notification.toEmail}&gt;
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 pt-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ผ่านการตรวจสอบลายมือชื่อดิจิทัล DKIM/SPF ปลอดภัย 100%</span>
          </div>
        </div>

        {/* Email HTML Body Container */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          <div
            className="prose prose-sm max-w-none text-slate-800"
            dangerouslySetInnerHTML={{ __html: notification.htmlBody }}
          />
        </div>

        {/* Email Bottom Bar */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          {!notification.isRead ? (
            <button
              onClick={handleMarkAsRead}
              className="flex items-center gap-1 text-slate-600 hover:text-indigo-600 font-medium"
            >
              <Check className="w-4 h-4 text-indigo-600" />
              <span>ทำเครื่องหมายว่าอ่านแล้ว</span>
            </button>
          ) : (
            <span className="text-slate-400 text-[11px]">อ่านแล้วเรียบร้อย</span>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors"
          >
            ปิด
          </button>
        </div>

      </div>
    </div>
  );
};
