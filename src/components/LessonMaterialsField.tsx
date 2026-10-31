import React, { useRef, useState } from 'react';
import { FileText, Loader2, Trash2, Upload } from 'lucide-react';
import type { LessonResource } from '../types';
import { ApiError, formatFileSize, uploadMaterial } from '../api';

interface LessonMaterialsFieldProps {
  value: LessonResource[];
  onChange: (value: LessonResource[]) => void;
  label?: string;
}

/** อัปโหลดสื่อการสอน PDF ต่อบทเรียน: เลือกไฟล์แล้วอัปโหลดทันที เก็บ URL ไว้ในรายการ */
export const LessonMaterialsField: React.FC<LessonMaterialsFieldProps> = ({
  value,
  onChange,
  label = 'สื่อการเรียนการสอน (PDF)',
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const lowerName = file.name.toLowerCase();
    const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');
    if (!isPdf) {
      setError('รองรับเฉพาะไฟล์ PDF');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('ไฟล์ PDF ต้องมีขนาดไม่เกิน 20MB');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const uploaded = await uploadMaterial(file);
      onChange([
        ...value,
        {
          id: `res-${Date.now()}`,
          title: uploaded.name.replace(/\.pdf$/i, ''),
          type: 'pdf',
          url: uploaded.url,
          size: formatFileSize(uploaded.size),
        },
      ]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'อัปโหลดไฟล์ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1">{label}</label>
      {value.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {value.map((res, idx) => (
            <div
              key={res.id}
              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
            >
              <span className="flex items-center gap-1.5 truncate">
                <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">{res.title}</span>
                {res.size && <span className="text-[10px] text-slate-400 font-mono shrink-0">({res.size})</span>}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="text-slate-400 hover:text-rose-500 shrink-0"
                aria-label={`ลบ ${res.title}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-xs font-bold transition active:scale-95 disabled:opacity-50 shrink-0"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          <span>{uploading ? 'กำลังอัปโหลด...' : value.length > 0 ? 'เพิ่มไฟล์ PDF' : 'เลือกไฟล์ PDF'}</span>
        </button>
        <span className="text-[11px] text-slate-400">PDF ไม่เกิน 20MB ผู้เรียนดาวน์โหลดได้ที่หน้าบทเรียน</span>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={e => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {error && <p role="alert" className="mt-1.5 text-[11px] font-medium text-rose-600">{error}</p>}
    </div>
  );
};
