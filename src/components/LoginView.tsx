import React, { useState } from 'react';
import {
  GraduationCap, Loader2, Mail, Lock, User, Eye, EyeOff,
  PlayCircle, ClipboardCheck, Award, BarChart3, ShieldCheck, ArrowRight,
} from 'lucide-react';
import { login, register } from '../api';

const FEATURES = [
  { icon: PlayCircle, title: 'วิดีโออินเตอร์แอคทีฟ', desc: 'เรียนต่อเนื่องทุกอุปกรณ์ ดูค้างไว้ตรงไหนกลับมาต่อได้ทันที' },
  { icon: ClipboardCheck, title: 'แบบทดสอบก่อน–หลังเรียน', desc: 'วัดผลความเข้าใจทุกบท พร้อมเฉลยและคะแนนแบบเรียลไทม์' },
  { icon: Award, title: 'ใบประกาศนียบัตรอัตโนมัติ', desc: 'เรียนจบผ่านเกณฑ์ รับใบประกาศนียบัตรได้ทันที' },
  { icon: BarChart3, title: 'แดชบอร์ดติดตามความก้าวหน้า', desc: 'เห็นพัฒนาการของตัวเองและผู้เรียนในห้องแบบละเอียด' },
] as const;

export const LoginView: React.FC<{ onAuthed: () => void; notice?: string }> = ({ onAuthed, notice }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(notice || null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') await login(email.trim(), password);
      else await register(name.trim(), email.trim(), password);
      onAuthed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (next: 'login' | 'register') => {
    setMode(next);
    setError(null);
  };

  const labelCls = 'block text-[15px] font-semibold leading-[1.7] text-slate-700 mb-1.5';
  const wrapCls =
    'flex items-center gap-2.5 rounded-lg border border-slate-300 bg-white px-3.5 transition focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-600/10';
  const inputCls =
    'w-full bg-transparent py-3 text-[15px] leading-[1.7] text-slate-900 placeholder:text-slate-400 focus:outline-none';

  return (
    <div className="min-h-dvh grid lg:grid-cols-[1.05fr_1fr] bg-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* ---------- Brand panel ---------- */}
      <aside
        className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#0b1f4d] text-white px-12 py-10 xl:px-16"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-indigo-500 text-white flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="leading-[1.7]">
            <p className="font-bold text-xl tracking-tight">BB FlexLearn</p>
            <p className="text-sm text-indigo-200/80">ศูนย์ส่งเสริมการเรียนรู้ระดับอำเภอบ้านบึง</p>
          </div>
        </div>

        <div className="max-w-md">
          <h2 className="text-[32px] xl:text-4xl font-bold leading-[1.6] tracking-tight">
            เรียนรู้ได้ทุกที่
            <br />
            พัฒนาทักษะได้
            <span className="text-amber-400"> ทุกวัน</span>
          </h2>
          <p className="mt-4 text-base leading-[1.8] text-slate-300">
            คอร์สเรียนวิดีโอพร้อมแบบทดสอบวัดผล ติดตามความก้าวหน้า
            และรับใบประกาศนียบัตรเมื่อเรียนจบ ในที่เดียว
          </p>

          <ul className="mt-10 space-y-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex gap-4">
                <span className="mt-0.5 w-10 h-10 shrink-0 rounded-lg bg-white/[0.07] border border-white/10 flex items-center justify-center text-indigo-300">
                  <Icon className="w-5 h-5" />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold leading-[1.7]">{title}</span>
                  <span className="block mt-0.5 text-sm leading-[1.8] text-slate-400">{desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-8 border-t border-white/10 pt-6 text-sm">
          <div>
            <p className="text-xl font-bold">120+</p>
            <p className="text-xs text-slate-400 mt-0.5">คอร์สเรียน</p>
          </div>
          <div>
            <p className="text-xl font-bold">8,400+</p>
            <p className="text-xs text-slate-400 mt-0.5">ผู้เรียนทั้งหมด</p>
          </div>
          <div>
            <p className="text-xl font-bold">95%</p>
            <p className="text-xs text-slate-400 mt-0.5">เรียนจบตามเป้าหมาย</p>
          </div>
          <p className="ml-auto hidden xl:flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            ข้อมูลของคุณปลอดภัย
          </p>
        </div>
      </aside>

      {/* ---------- Form panel ---------- */}
      <main className="flex items-center justify-center px-4 py-10 sm:px-8 bg-slate-50 lg:bg-white">
        <div className="w-full max-w-[420px]">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="leading-[1.7]">
              <p className="font-bold text-xl tracking-tight text-slate-900">BB FlexLearn</p>
              <p className="text-sm text-slate-500">ศูนย์ส่งเสริมการเรียนรู้ระดับอำเภอบ้านบึง</p>
            </div>
          </div>

          <h1 className="text-[28px] font-bold tracking-tight leading-[1.5] text-slate-900">
            {mode === 'login' ? 'ยินดีต้อนรับกลับมา' : 'สร้างบัญชีใหม่'}
          </h1>
          <p className="mt-1.5 text-[15px] leading-[1.8] text-slate-500">
            {mode === 'login'
              ? 'เข้าสู่ระบบเพื่อเรียนต่อจากครั้งล่าสุดของคุณ'
              : 'สมัครฟรี เริ่มเรียนคอร์สแรกได้ภายในไม่กี่นาที'}
          </p>

          {/* Mode switch */}
          <div
            role="tablist"
            aria-label="โหมดการเข้าใช้งาน"
            className="mt-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm font-semibold"
          >
            {(
              [
                { key: 'login', label: 'เข้าสู่ระบบ' },
                { key: 'register', label: 'สมัครสมาชิก' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={mode === tab.key}
                onClick={() => switchMode(tab.key)}
                className={`rounded-md py-2 transition ${
                  mode === tab.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === 'register' && (
              <div>
                <label htmlFor="login-name" className={labelCls}>ชื่อ–นามสกุล</label>
                <div className={wrapCls}>
                  <User className="w-[18px] h-[18px] shrink-0 text-slate-400" />
                  <input
                    id="login-name"
                    className={inputCls}
                    placeholder="เช่น สมชาย ใจดี"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="login-email" className={labelCls}>อีเมล</label>
              <div className={wrapCls}>
                <Mail className="w-[18px] h-[18px] shrink-0 text-slate-400" />
                <input
                  id="login-email"
                  className={inputCls}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className={labelCls}>รหัสผ่าน</label>
              <div className={wrapCls}>
                <Lock className="w-[18px] h-[18px] shrink-0 text-slate-400" />
                <input
                  id="login-password"
                  className={inputCls}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'อย่างน้อย 8 ตัวอักษร' : 'รหัสผ่านของคุณ'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={mode === 'register' ? 8 : 1}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  className="shrink-0 rounded p-1 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
              {mode === 'register' && (
                <p className="mt-1.5 text-xs text-slate-400">ใช้อย่างน้อย 8 ตัวอักษร ผสมตัวอักษรและตัวเลขจะปลอดภัยยิ่งขึ้น</p>
              )}
            </div>

            {error && (
              <p role="alert" className="text-[13px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3.5 py-2.5">
                {error}
              </p>
            )}

            <button
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold py-3 transition hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-600/30"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[13px] leading-[1.8] text-slate-400">
            การเข้าสู่ระบบถือว่ายอมรับเงื่อนไขการใช้งาน
            <br className="sm:hidden" /> และนโยบายความเป็นส่วนตัวของ BB FlexLearn
          </p>
        </div>
      </main>
    </div>
  );
};
