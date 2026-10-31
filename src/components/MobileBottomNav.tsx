import React from 'react';
import { useApp } from '../context/AppContext';
import { BookOpen, Library, LayoutDashboard, Shield, Bell, GraduationCap } from 'lucide-react';

interface MobileBottomNavProps {
  currentView: 'catalog' | 'my_courses' | 'dashboard' | 'admin' | 'course_detail' | 'lesson_player' | 'teacher_studio';
  onNavigate: (view: 'catalog' | 'my_courses' | 'dashboard' | 'admin' | 'teacher_studio') => void;
  onOpenNotifications: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenNotifications
}) => {
  const { currentUser, notifications } = useApp();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const isTeacher = currentUser.role === 'teacher';
  const isAdmin = currentUser.role === 'admin';
  const colClass = isAdmin ? 'grid-cols-6' : isTeacher ? 'grid-cols-5' : 'grid-cols-4';

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-lg no-print overflow-hidden w-full max-w-full">
      <div className={`grid ${colClass} items-center justify-around w-full max-w-full`}>
        <button
          onClick={() => onNavigate('catalog')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg transition-colors min-h-[46px] min-w-0 ${
            currentView === 'catalog' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4 mb-0.5 shrink-0" />
          <span className="text-[10px] tracking-tight truncate w-full text-center">คอร์ส</span>
        </button>

        <button
          onClick={() => onNavigate('my_courses')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg transition-colors min-h-[46px] min-w-0 ${
            currentView === 'my_courses' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Library className="w-4 h-4 mb-0.5 shrink-0" />
          <span className="text-[10px] tracking-tight truncate w-full text-center">ของฉัน</span>
        </button>

        {(isTeacher || isAdmin) && (
          <button
            onClick={() => onNavigate('teacher_studio')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg transition-colors min-h-[46px] min-w-0 ${
              currentView === 'teacher_studio' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4 mb-0.5 shrink-0" />
            <span className="text-[10px] tracking-tight truncate w-full text-center">ห้องเรียน</span>
          </button>
        )}

        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg transition-colors min-h-[46px] min-w-0 ${
            currentView === 'dashboard' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5 shrink-0" />
          <span className="text-[10px] tracking-tight truncate w-full text-center">แดชบอร์ด</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => onNavigate('admin')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg transition-colors min-h-[46px] min-w-0 ${
              currentView === 'admin' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4 mb-0.5 shrink-0" />
            <span className="text-[10px] tracking-tight truncate w-full text-center">แอดมิน</span>
          </button>
        )}

        <button
          onClick={onOpenNotifications}
          className="relative flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg transition-colors min-h-[46px] min-w-0 text-slate-500 hover:text-slate-900"
        >
          <div className="relative shrink-0">
            <Bell className="w-4 h-4 mb-0.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </div>
          <span className="text-[10px] tracking-tight truncate w-full text-center">แจ้งเตือน</span>
        </button>
      </div>
    </div>
  );
};
