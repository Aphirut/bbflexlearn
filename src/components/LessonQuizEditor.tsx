import React from 'react';
import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Quiz, QuizQuestion } from '../types';
import { createLessonQuiz, isLessonQuizReady } from '../utils/lessonQuiz';

interface LessonQuizEditorProps {
  /** แบบทดสอบของบทนี้ (undefined = ยังไม่เปิดใช้) */
  quiz: Quiz | undefined;
  onChange: (quiz: Quiz | undefined) => void;
  onAddQuestion: () => void;
  onEditQuestion: (q: QuizQuestion) => void;
  onDeleteQuestion: (qId: string) => void;
}

/** ที่เพิ่ม/แก้แบบทดสอบประจำบท ใช้ซ้ำได้ทั้งบทหลักและบทเรียนย่อย */
export const LessonQuizEditor: React.FC<LessonQuizEditorProps> = ({
  quiz,
  onChange,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
}) => {
  if (!quiz) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2.5">
        <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <ClipboardList className="h-3.5 w-3.5" />
          ยังไม่มีแบบทดสอบ — ผู้เรียนจะดูวิดีโอถัดไปได้ทันที
        </span>
        <button
          type="button"
          onClick={() => onChange(createLessonQuiz('แบบทดสอบท้ายบท'))}
          className="flex shrink-0 items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100"
        >
          <Plus className="h-3.5 w-3.5" />
          เพิ่มแบบทดสอบ
        </button>
      </div>
    );
  }

  const ready = isLessonQuizReady(quiz);
  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={quiz.title}
          onChange={e => onChange({ ...quiz, title: e.target.value })}
          placeholder="ชื่อแบบทดสอบ เช่น แบบทดสอบท้ายบทที่ 1"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
          aria-label="ชื่อแบบทดสอบ"
        />
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="shrink-0 rounded-lg border border-slate-200 bg-white p-2 text-slate-400 hover:text-rose-500"
          aria-label="ลบแบบทดสอบทั้งชุด"
          title="ลบแบบทดสอบทั้งชุด"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-slate-600">
        <label className="font-bold">เกณฑ์ผ่าน (%)</label>
        <input
          type="number"
          min={1}
          max={100}
          value={quiz.passingScorePercent}
          onChange={e => onChange({ ...quiz, passingScorePercent: Math.min(100, Math.max(1, Number(e.target.value) || 0)) })}
          className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
        />
        {!ready && <span className="text-amber-600">เพิ่มอย่างน้อย 1 ข้อ ระบบจึงจะกั้นบทถัดไป</span>}
      </div>
      {quiz.questions.length > 0 && (
        <ul className="space-y-1.5">
          {quiz.questions.map((quest, i) => (
            <li
              key={quest.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800"
            >
              <span className="truncate">
                <span className="mr-1.5 font-bold text-slate-400">{i + 1}.</span>
                {quest.question}
              </span>
              <span className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => onEditQuestion(quest)}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="แก้ไขข้อสอบ"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteQuestion(quest.id)}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                  aria-label="ลบข้อสอบ"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={onAddQuestion}
        className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100"
      >
        <Plus className="h-3.5 w-3.5" />
        เพิ่มข้อสอบ
      </button>
    </div>
  );
};
