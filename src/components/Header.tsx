import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { PWAInstallButton } from './PWAInstallButton';
import { StudentProgress } from './StudentProgress';
import {
  Bell,
  Shield,
  User,
  ChevronDown,
  RotateCcw,
  GraduationCap,
  KeyRound,
  Menu,
  X,
  BookOpen,
  Library,
  LayoutDashboard,
  Pencil
} from 'lucide-react';

import { AppLogo } from './AppLogo';
import { ProfileEditModal } from './ProfileEditModal';

interface HeaderProps {
  currentView: 'catalog' | 'my_courses' | 'dashboard' | 'admin' | 'course_detail' | 'lesson_player' | 'teacher_studio';
  onNavigate: (view: 'catalog' | 'my_courses' | 'dashboard' | 'admin' | 'teacher_studio') => void;
  onOpenNotifications: () => void;
  onOpenJoinClassroom?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, onOpenNotifications, onOpenJoinClassroom }) => {
  const { currentUser, notifications, logout, appSettings } = useApp();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNavClick = (view: 'catalog' | 'my_courses' | 'dashboard' | 'admin' | 'teacher_studio') => {
    onNavigate(view);
    setShowMobileMenu(false);
    setShowUserDropdown(false);
  };

  return (
    <header className="sticky top-0 z-40 pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] bg-white/95 backdrop-blur-md border-b border-slate-200 w-full">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 lg:gap-6 px-3 sm:px-6 py-2.5 sm:py-3.5">
        
        {/* Zone 1: Single text element wordmark with customizable AppLogo */}
        <div
          onClick={() => handleNavClick('catalog')}
          className="flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 group"
        >
          <AppLogo size="md" />
          <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors truncate min-w-0 max-w-[38vw] sm:max-w-[200px] md:max-w-[220px] xl:max-w-none lg:hidden xl:inline">
            {appSettings.appName || 'BB FlexLearn'}
          </span>
        </div>

        {/* Zone 2: clean desktop text navigation links (Visible on large screens >= 1024px to prevent overflow) */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-xs sm:text-sm font-medium text-slate-600 shrink-0">
          <button
            onClick={() => handleNavClick('catalog')}
            className={`whitespace-nowrap transition-colors hover:text-slate-900 pb-0.5 cursor-pointer ${
              currentView === 'catalog' ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600' : ''
            }`}
          >
            คอร์สทั้งหมด
          </button>

          <button
            onClick={() => handleNavClick('my_courses')}
            className={`whitespace-nowrap transition-colors hover:text-slate-900 pb-0.5 cursor-pointer ${
              currentView === 'my_courses' ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600' : ''
            }`}
          >
            คอร์สของฉัน
          </button>

          <button
            onClick={() => handleNavClick('dashboard')}
            className={`whitespace-nowrap transition-colors hover:text-slate-900 pb-0.5 cursor-pointer ${
              currentView === 'dashboard' ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600' : ''
            }`}
          >
            แดชบอร์ดสรุปผล
          </button>

          {(currentUser.role === 'teacher' || currentUser.role === 'admin') && (
            <button
              onClick={() => handleNavClick('teacher_studio')}
              className={`flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-slate-900 pb-0.5 cursor-pointer ${
                currentView === 'teacher_studio' ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600' : ''
              }`}
            >
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>ห้องเรียนครู & สร้างข้อสอบ</span>
            </button>
          )}

          {currentUser.role === 'admin' && (
            <button
              onClick={() => handleNavClick('admin')}
              className={`flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-slate-900 pb-0.5 cursor-pointer ${
                currentView === 'admin' ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600' : ''
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>แผงควบคุมแอดมิน</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Actions & Account cluster (Adaptive to prevent overflow) */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          
          {/* Learning Level Indicator */}
          <div className="hidden lg:block">
            <StudentProgress
              variant="header"
              onOpenDashboard={() => handleNavClick('dashboard')}
            />
          </div>

          {/* Join Classroom with Code Button */}
          {onOpenJoinClassroom && (
            <button
              onClick={onOpenJoinClassroom}
              className="hidden lg:flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 text-xs font-semibold border border-indigo-200/80 transition shadow-2xs active:scale-95 cursor-pointer shrink-0"
              title="เข้าร่วมห้องเรียนด้วยรหัส (Classroom Code)"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="hidden xl:inline">ใส่รหัสเข้าห้องเรียน</span>
              <span className="hidden sm:inline xl:hidden">รหัสเรียน</span>
            </button>
          )}

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Email Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
            title="การแจ้งเตือนอีเมล"
            aria-label="การแจ้งเตือนอีเมล"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {/* User Profile Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 transition-colors shrink-0"
              title={`${currentUser.name} (${currentUser.role})`}
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
              />
              <div className="hidden xl:block text-left text-xs">
                <span className="font-semibold text-slate-800 block truncate max-w-[100px]">{currentUser.name}</span>
                <span className="text-[10px] text-slate-500 block">
                  {currentUser.role === 'admin'
                    ? 'ผู้ดูแลระบบ'
                    : currentUser.role === 'teacher'
                    ? 'อาจารย์'
                    : 'ผู้เรียน'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Dropdown Menu (Screen-bounded with max-w to prevent overflowing viewport) */}
            {showUserDropdown && (
              <div
                className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-xs"
                onClick={() => setShowUserDropdown(false)}
              >
                <div className="p-2 border-b border-slate-100 mb-1">
                  <div className="flex items-center gap-2 mb-2">
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover border" />
                    <div className="truncate">
                      <span className="font-bold text-slate-900 block truncate">{currentUser.name}</span>
                      <span className="text-[10px] text-slate-500 block truncate">{currentUser.email}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 block">
                    {currentUser.role === 'admin' ? 'ผู้ดูแลระบบ' : currentUser.role === 'teacher' ? 'อาจารย์ผู้สอน' : 'ผู้เรียน'}
                  </span>
                </div>

                <div className="p-1 space-y-1">
                  {onOpenJoinClassroom && (
                    <button
                      onClick={onOpenJoinClassroom}
                      className="w-full text-left p-2 rounded-lg hover:bg-indigo-50 text-indigo-700 flex items-center gap-2 font-medium"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                      <span>ใส่รหัสเข้าห้องเรียน</span>
                    </button>
                  )}

                  {(currentUser.role === 'teacher' || currentUser.role === 'admin') && (
                    <button
                      onClick={() => handleNavClick('teacher_studio')}
                      className="w-full text-left p-2 rounded-lg hover:bg-indigo-50 text-indigo-700 flex items-center gap-2 font-semibold"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                      <span>ห้องเรียนครู & สร้างแบบทดสอบ</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setShowProfileEdit(true);
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>แก้ไขข้อมูลส่วนตัว</span>
                  </button>

                  <button
                    onClick={() => handleNavClick('dashboard')}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>ไปที่แดชบอร์ดสรุปผล</span>
                  </button>

                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => handleNavClick('admin')}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                    >
                      <Shield className="w-3.5 h-3.5 text-slate-500" />
                      <span>เข้าสู่หน้าแอดมิน</span>
                    </button>
                  )}

                  <button
                    onClick={logout}
                    className="w-full text-left p-2 rounded-lg hover:bg-rose-50 text-rose-600 flex items-center gap-2 pt-2 border-t border-slate-100"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile & Tablet Hamburger Button (lg:hidden) */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors shrink-0"
            aria-label="เมนูหลัก"
            title="เปิดเมนูนำทาง"
          >
            {showMobileMenu ? <X className="w-5 h-5 text-indigo-600" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

      </div>

      {/* Mobile & Tablet Navigation Drawer (Sliding down cleanly within screen bounds) */}
      {showMobileMenu && (
        <div className="lg:hidden border-t border-slate-200 bg-white/98 backdrop-blur-lg px-4 py-3.5 space-y-3 shadow-xl max-h-[85vh] overflow-y-auto">
          {/* Main Navigation Links */}
          <div className="grid grid-cols-1 gap-1">
            <button
              onClick={() => handleNavClick('catalog')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                currentView === 'catalog'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>คอร์สทั้งหมด</span>
            </button>

            <button
              onClick={() => handleNavClick('my_courses')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                currentView === 'my_courses'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Library className="w-4 h-4 shrink-0" />
              <span>คอร์สของฉัน</span>
            </button>

            <button
              onClick={() => handleNavClick('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                currentView === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>แดชบอร์ดสรุปผลการเรียน</span>
            </button>

            {(currentUser.role === 'teacher' || currentUser.role === 'admin') && (
              <button
                onClick={() => handleNavClick('teacher_studio')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  currentView === 'teacher_studio'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>ห้องเรียนครู & สร้างแบบทดสอบ</span>
              </button>
            )}

            {currentUser.role === 'admin' && (
              <button
                onClick={() => handleNavClick('admin')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  currentView === 'admin'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Shield className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>แผงควบคุมผู้ดูแลระบบ (Admin)</span>
              </button>
            )}
          </div>

          {/* Mobile Quick Classroom Access */}
          {onOpenJoinClassroom && (
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  onOpenJoinClassroom();
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-200 hover:bg-indigo-100 transition-colors"
              >
                <KeyRound className="w-4 h-4" />
                <span>ใส่รหัสเข้าห้องเรียน (Classroom Code)</span>
              </button>
            </div>
          )}

          {/* User Profile Info Footer in Drawer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover border" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">{currentUser.name}</span>
                <span className="text-[10px] text-slate-500 block">
                  {currentUser.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : currentUser.role === 'teacher' ? 'อาจารย์ผู้สอน' : 'ผู้เรียน (Student)'}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setShowMobileMenu(false);
                setShowProfileEdit(true);
              }}
              className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-medium mr-3"
            >
              <Pencil className="w-3 h-3" />
              <span>แก้ไขข้อมูลส่วนตัว</span>
            </button>
            <button
              onClick={() => {
                logout();
                setShowMobileMenu(false);
              }}
              className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      )}
    {showProfileEdit && createPortal(
      <ProfileEditModal onClose={() => setShowProfileEdit(false)} />,
      document.body
    )}
    </header>
  );
};
