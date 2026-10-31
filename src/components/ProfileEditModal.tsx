import React, { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ApiError, uploadAvatar } from '../api';

interface ProfileEditModalProps {
  onClose: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ onClose }) => {
  const { currentUser, updateProfile } = useApp();
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
