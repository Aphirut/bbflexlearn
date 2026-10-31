import React, { useRef, useState } from 'react';
import { ImagePlus, Link2, Trash2 } from 'lucide-react';

interface LessonCoverFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

/** ช่องใส่หน้าปกบทเรียน: วาง URL รูปภาพ หรืออัปโหลดไฟล์รูป (เก็บเป็น data URL, ไม่เกิน 2MB) */
/** เติม https:// ให้ URL ที่ผู้ใช้วางมาโดยไม่มี scheme เพื่อให้รูปโหลดได้และไม่ติด validation ของฟอร์ม */
export const normalizeImageUrl = (raw: string) => {
  const v = raw.trim();
  if (!v || v.startsWith('data:') || v.startsWith('http://') || v.startsWith('https://') || v.startsWith('/')) return v;
  return `https://${v}`;
};

export const LessonCoverField: React.FC<LessonCoverFieldProps> = ({ value, onChange, label = 'หน้าปกบทเรียน (ไม่บังคับ)' }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [imgBroken, setImgBroken] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพ (PNG, JPG, WebP)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('ไฟล์รูปต้องมีขนาดไม่เกิน 2MB');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result || ''));
    reader.onerror = () => setError('อ่านไฟล์ไม่สำเร็จ กรุณาลองใหม่');
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1">{label}</label>

      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-slate-200">
          <img
            src={value}
            alt="รูปหน้าปก"
            className="h-36 w-full object-cover"
            onLoad={() => setImgBroken(false)}
            onError={() => setImgBroken(true)}
          />
          {imgBroken && (
            <p role="alert" className="absolute inset-x-0 bottom-0 bg-rose-600/90 px-3 py-1.5 text-[11px] font-semibold text-white">
              โหลดรูปจากลิงก์นี้ไม่สำเร็จ กรุณาตรวจสอบ URL ให้เป็นลิงก์รูปภาพโดยตรง
            </p>
          )}
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-slate-950/70 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-950"
          >
            <Trash2 className="h-3.5 w-3.5" />
            ลบหน้าปก
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-slate-500 transition hover:border-indigo-400 hover:text-indigo-600"
        >
          <ImagePlus className="h-6 w-6" />
          <span className="text-xs font-semibold">อัปโหลดรูปหน้าปก</span>
          <span className="text-[11px] text-slate-400">PNG, JPG, WebP ขนาดไม่เกิน 2MB แนะนำสัดส่วน 16:9</span>
        </button>
      )}

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

      <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
        <Link2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <input
          type="text"
          inputMode="url"
          value={value.startsWith('data:') ? '' : value}
          onChange={e => {
            setError(null);
            setImgBroken(false);
            onChange(e.target.value);
          }}
          onBlur={e => onChange(normalizeImageUrl(e.target.value))}
          placeholder={value.startsWith('data:') ? 'กำลังใช้รูปที่อัปโหลด — ลบหน้าปกก่อนหากต้องการใช้ URL' : 'หรือวาง URL รูปภาพ https://...'}
          disabled={value.startsWith('data:')}
          className="w-full bg-transparent font-mono text-xs focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />
        {!value && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="shrink-0 text-[11px] font-bold text-indigo-600 hover:underline"
          >
            เลือกไฟล์
          </button>
        )}
      </div>

      {error && <p role="alert" className="mt-1.5 text-[11px] font-medium text-rose-600">{error}</p>}
    </div>
  );
};
