import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { SubLesson } from '../types';
import { QuizBuilderField } from './QuizBuilderField';

interface SubLessonsEditorProps {
  value: SubLesson[];
  onChange: (value: SubLesson[]) => void;
}

/** ตัวจัดการบทเรียนย่อยภายในบทเรียนหลัก: เพิ่ม/แก้/ลบ รายการย่อย (ชื่อ, ลิงก์วิดีโอ, ความยาว, แบบทดสอบท้ายตอน) */
export const SubLessonsEditor: React.FC<SubLessonsEditorProps> = ({ value, onChange }) => {
  const update = (idx: number, patch: Partial<SubLesson>) =>
    onChange(value.map((s, i) => (i === idx ? { ...s, ...patch } : s)));

  const add = () =>
    onChange([
      ...value,
      {
        id: `sub-${Date.now()}`,
        title: '',
        durationMinutes: 10,
        videoUrl: '',
        order: value.length + 1,
      },
    ]);

  const remove = (idx: number) =>
    onChange(value.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 })));

  const inputCls = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white';

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">บทเรียนย่อย (ไม่บังคับ)</label>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100"
        >
          <Plus className="h-3.5 w-3.5" />
          เพิ่มบทเรียนย่อย
        </button>
      </div>

      {value.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-[11px] text-slate-400">
          ยังไม่มีบทเรียนย่อย — กด “เพิ่มบทเรียนย่อย” เพื่อแบ่งบทเรียนหลักออกเป็นตอนย่อย ๆ
        </p>
      ) : (
        <div className="space-y-2">
          {value.map((sub, idx) => (
            <div key={sub.id} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-[11px] font-bold text-slate-600 border border-slate-200">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={sub.title}
                  onChange={e => update(idx, { title: e.target.value })}
                  placeholder="ชื่อบทเรียนย่อย เช่น 1.1 แนะนำเครื่องมือ"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="shrink-0 rounded-lg border border-rose-200 bg-white p-2 text-rose-500 hover:bg-rose-50"
                  aria-label="ลบบทเรียนย่อย"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sub.videoUrl}
                  onChange={e => update(idx, { videoUrl: e.target.value })}
                  placeholder="URL วิดีโอ (YouTube/Drive/MP4) https://..."
                  className={`${inputCls} font-mono`}
                />
                <input
                  type="number"
                  min={1}
                  value={sub.durationMinutes}
                  onChange={e => update(idx, { durationMinutes: Number(e.target.value) || 0 })}
                  className="w-24 shrink-0 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  aria-label="ความยาว (นาที)"
                />
              </div>
              <QuizBuilderField
                compact
                label="แบบทดสอบท้ายตอนนี้ (ไม่บังคับ)"
                value={sub.quiz}
                onChange={quiz => update(idx, { quiz })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
