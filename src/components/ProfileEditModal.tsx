import React, { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ApiError, uploadAvatar, changePassword, logoutAllDevices } from '../api';

interface ProfileEditModalProps {
  onClose: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ onClose }) => {
  const { currentUser, updateProfile, logout } = useApp();
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  const handleChangePassword = async () => {
    setPwMsg(null);
    if (newPw.length < 8) return setPwMsg({ ok: false, text: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' });
    if (newPw !== newPw2) return setPwMsg({ ok: false, text: 'ยืนยันรหัสผ่านใหม่ไม่ตรงกัน' });
    setPwBusy(true);
    try {
      await changePassword(curPw, newPw);
      setCurPw(''); setNewPw(''); setNewPw2('');
      setPwMsg({ ok: true, text: 'เปลี่ยนรหัสผ่านแล้ว อุปกรณ์อื่นที่ล็อกอินค้างไว้จะถูกออกจากระบบ' });
    } catch (e) {
      setPwMsg({ ok: false, text: e instanceof ApiError ? e.message : 'เปลี่ยนรหัสผ่านไม่สำเร็จ' });
    } finally {
      setPwBusy(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('ออกจากระบบทุกอุปกรณ์ รวมถึงเครื่องนี้?')) return;
    try { await logoutAllDevices(); } catch { /* ออกจากระบบเครื่องนี้ต่อไป */ }
    logout();
  };
  const [name, setName] = useState(currentUser.name);
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [department, setDepartment] = useState(currentUser.department || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพ (PNG, JPG, WebP)');
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      setError('ไฟล์รูปต้องมีขนาดไม่เกิน 2MB');
      return;
    }
    setError(null);
    setFile(f);
    setPreview(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('กรุณากรอกชื่อ');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const avatarUrl = file ? await uploadAvatar(file) : avatar.trim();
      updateProfile({
        name: name.trim(),
        avatar: avatarUrl,
        department: department.trim(),
        phone: phone.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  };

  // Note: no onClick-to-close on the backdrop below — only X / ยกเลิก / บันทึก
  // close this modal, so stray clicks can never dismiss it while editing.
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        className="bg-white m-auto rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">แก้ไขข้อมูลส่วนตัว</h3>
            <p className="text-xs text-slate-500">{currentUser.email}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="ปิด">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">ชื่อที่แสดง *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">รูปโปรไฟล์</label>
            <div className="flex items-center gap-3">
              {(preview || avatar) && (
                <img
                  src={preview || avatar}
                  alt="ตัวอย่างรูปโปรไฟล์"
                  className="w-12 h-12 rounded-full object-cover border border-slate-200 bg-slate-100 shrink-0"
                />
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-xs font-bold transition active:scale-95 shrink-0"
              >
                <ImagePlus className="w-3.5 h-3.5" />
                <span>{file ? 'เปลี่ยนรูป' : 'อัปโหลดรูป'}</span>
              </button>
              <span className="text-[11px] text-slate-400 truncate">
                {file ? file.name : 'PNG, JPG, WebP ไม่เกิน 2MB'}
              </span>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                handleFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <input
              type="text"
              inputMode="url"
              placeholder="หรือวาง URL รูปภาพ https://..."
              value={avatar}
              onChange={e => {
                setAvatar(e.target.value);
                setFile(null);
                setPreview(prev => {
                  if (prev) URL.revokeObjectURL(prev);
                  return null;
                });
              }}
              className="mt-2 w-full p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] focus:outline-none focus:border-indigo-600"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">แผนก / สังกัด</label>
            <input
              type="text"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">เบอร์โทรศัพท์</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600"
            />
          </div>
        </div>

        {error && <p role="alert" className="text-[11px] font-medium text-rose-600">{error}</p>}

        <details className="rounded-lg border border-slate-200 p-3 text-xs">
          <summary className="cursor-pointer font-semibold text-slate-700">เปลี่ยนรหัสผ่าน / ความปลอดภัย</summary>
          <div className="mt-3 space-y-2">
            <input type="password" autoComplete="current-password" placeholder="รหัสผ่านปัจจุบัน" value={curPw}
              onChange={e => setCurPw(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600" />
            <input type="password" autoComplete="new-password" placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)" value={newPw}
              onChange={e => setNewPw(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600" />
            <input type="password" autoComplete="new-password" placeholder="ยืนยันรหัสผ่านใหม่" value={newPw2}
              onChange={e => setNewPw2(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600" />
            {pwMsg && <p role="status" className={`text-[11px] font-medium ${pwMsg.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{pwMsg.text}</p>}
            <div className="flex flex-wrap justify-between gap-2 pt-1">
              <button type="button" onClick={handleLogoutAll}
                className="px-3 py-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50">
                ออกจากระบบทุกอุปกรณ์
              </button>
              <button type="button" onClick={handleChangePassword} disabled={pwBusy || !curPw || !newPw}
                className="px-3 py-2 rounded-lg bg-slate-800 text-white font-semibold hover:bg-slate-900 disabled:opacity-50">
                {pwBusy ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
              </button>
            </div>
          </div>
        </details>

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  );
};
