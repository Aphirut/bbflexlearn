import React from 'react';
import { Plus, Trash2, ClipboardCheck } from 'lucide-react';
import type { Quiz, QuizQuestion } from '../types';

type ObjectiveType = 'multiple_choice' | 'true_false' | 'multiple_select';

const TYPE_LABEL: Record<ObjectiveType, string> = {
  multiple_choice: 'ปรนัย เลือก 1 ข้อ',
  true_false: 'ถูก / ผิด',
  multiple_select: 'ปรนัย เลือกได้หลายข้อ',
};

const MAX_OPTIONS = 6;
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const newQuestion = (type: ObjectiveType = 'multiple_choice'): QuizQuestion => ({
  id: uid('q'),
  question: '',
  type,
  options: type === 'true_false' ? ['ถูก', 'ผิด'] : ['', '', '', ''],
  correctIndex: type === 'multiple_select' ? undefined : 0,
  correctIndices: type === 'multiple_select' ? [] : undefined,
  explanation: '',
  points: 1,
});

export const newQuiz = (): Quiz => ({
  id: uid('quiz'),
  title: 'แบบทดสอบท้ายบท',
  type: 'lesson_quiz',
  passingScorePercent: 70,
  questions: [newQuestion()],
});

interface QuizBuilderFieldProps {
  label: string;
  value?: Quiz;
  onChange: (quiz: Quiz | undefined) => void;
  /** แบบกะทัดรัดสำหรับใช้ซ้อนในรายการบทเรียนย่อย */
  compact?: boolean;
}

/** ตัวสร้างแบบทดสอบ (ปรนัย) ที่ใช้ได้ทั้งบทเรียนหลักและบทเรียนย่อย — ไม่มีแบบทดสอบ = undefined */
export const QuizBuilderField: React.FC<QuizBuilderFieldProps> = ({ label, value, onChange, compact }) => {
  const inputCls = 'w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white';

  if (!value) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-600">{label}</span>
          <button
            type="button"
            onClick={() => onChange(newQuiz())}
            className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            เพิ่มแบบทดสอบ
          </button>
        </div>
      </div>
    );
  }

  const quiz = value;
  const patchQuiz = (patch: Partial<Quiz>) => onChange({ ...quiz, ...patch });
  const patchQuestion = (qi: number, patch: Partial<QuizQuestion>) =>
    patchQuiz({ questions: quiz.questions.map((q, i) => (i === qi ? { ...q, ...patch } : q)) });

  const changeType = (qi: number, type: ObjectiveType) => {
    const q = quiz.questions[qi];
    const fresh = newQuestion(type);
    patchQuestion(qi, {
      type,
      options: type === 'true_false' ? ['ถูก', 'ผิด'] : (q.options?.length ? q.options : fresh.options),
      correctIndex: type === 'multiple_select' ? undefined : 0,
      correctIndices: type === 'multiple_select' ? [] : undefined,
    });
  };

  const toggleCorrect = (qi: number, oi: number) => {
    const q = quiz.questions[qi];
    if ((q.type ?? 'multiple_choice') === 'multiple_select') {
      const current = q.correctIndices || [];
      patchQuestion(qi, {
        correctIndices: current.includes(oi) ? current.filter(x => x !== oi) : [...current, oi],
      });
    } else {
      patchQuestion(qi, { correctIndex: oi });
    }
  };

  const setOption = (qi: number, oi: number, text: string) => {
    const options = [...(quiz.questions[qi].options || [])];
    options[oi] = text;
    patchQuestion(qi, { options });
  };

  const addOption = (qi: number) => {
    const q = quiz.questions[qi];
    if ((q.options || []).length >= MAX_OPTIONS) return;
    patchQuestion(qi, { options: [...(q.options || []), ''] });
  };

  const removeOption = (qi: number, oi: number) => {
    const q = quiz.questions[qi];
    const options = (q.options || []).filter((_, i) => i !== oi);
    const shift = (n: number) => (n > oi ? n - 1 : n);
    patchQuestion(qi, {
      options,
      correctIndex: q.correctIndex === undefined || q.correctIndex === oi ? 0 : shift(q.correctIndex),
      correctIndices: (q.correctIndices || []).filter(i => i !== oi).map(shift),
    });
  };

  const removeQuestion = (qi: number) => patchQuiz({ questions: quiz.questions.filter((_, i) => i !== qi) });

  return (
    <div className={`space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/40 ${compact ? 'p-2.5' : 'p-3.5'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-emerald-800">{label}</span>
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-1 text-[11px] font-bold text-rose-500 hover:bg-rose-50"
        >
          <Trash2 className="h-3 w-3" />
          ลบแบบทดสอบ
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px]">
        <input
          type="text"
          value={quiz.title}
          onChange={e => patchQuiz({ title: e.target.value })}
          placeholder="ชื่อแบบทดสอบ"
          className={inputCls}
        />
        <label className="flex items-center gap-1.5 text-[11px] text-slate-600">
          เกณฑ์ผ่าน
          <input
            type="number"
            min={0}
            max={100}
            value={quiz.passingScorePercent}
            onChange={e => patchQuiz({ passingScorePercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
            className={`${inputCls} w-16`}
            aria-label="เกณฑ์ผ่าน (%)"
          />
          %
        </label>
      </div>

      {quiz.questions.map((q, qi) => {
        const type = (q.type ?? 'multiple_choice') as ObjectiveType;
        const isMulti = type === 'multiple_select';
        const isTF = type === 'true_false';
        return (
          <div key={q.id} className="space-y-2 rounded-lg border border-slate-200 bg-white p-2.5">
            <div className="flex items-start gap-2">
              <span className="mt-1.5 shrink-0 text-[11px] font-bold text-slate-500">ข้อ {qi + 1}</span>
              <input
                type="text"
                value={q.question}
                onChange={e => patchQuestion(qi, { question: e.target.value })}
                placeholder="พิมพ์โจทย์คำถาม"
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => removeQuestion(qi)}
                disabled={quiz.questions.length <= 1}
                className="shrink-0 rounded-lg border border-rose-200 p-1.5 text-rose-500 hover:bg-rose-50 disabled:opacity-40"
                aria-label={`ลบข้อ ${qi + 1}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={type}
                onChange={e => changeType(qi, e.target.value as ObjectiveType)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px]"
                aria-label="รูปแบบคำถาม"
              >
                {(Object.keys(TYPE_LABEL) as ObjectiveType[]).map(t => (
                  <option key={t} value={t}>{TYPE_LABEL[t]}</option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400">{isMulti ? 'ติ๊กทุกข้อที่ถูก' : 'เลือกวงกลมข้อที่ถูก'}</span>
            </div>

            <div className="space-y-1.5">
              {(q.options || []).map((opt, oi) => {
                const isCorrect = isMulti ? (q.correctIndices || []).includes(oi) : q.correctIndex === oi;
                return (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type={isMulti ? 'checkbox' : 'radio'}
                      name={`correct-${q.id}`}
                      checked={isCorrect}
                      onChange={() => toggleCorrect(qi, oi)}
                      className="h-3.5 w-3.5 shrink-0 accent-emerald-600"
                      aria-label={`ตัวเลือก ${oi + 1} เป็นคำตอบที่ถูก`}
                    />
                    <input
                      type="text"
                      value={opt}
                      disabled={isTF}
                      onChange={e => setOption(qi, oi, e.target.value)}
                      placeholder={`ตัวเลือก ${oi + 1}`}
                      className={`${inputCls} ${isCorrect ? 'border-emerald-400 bg-emerald-50' : ''}`}
                    />
                    {!isTF && (q.options || []).length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(qi, oi)}
                        className="shrink-0 p-1 text-slate-400 hover:text-rose-500"
                        aria-label={`ลบตัวเลือก ${oi + 1}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
              {!isTF && (q.options || []).length < MAX_OPTIONS && (
                <button
                  type="button"
                  onClick={() => addOption(qi)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <Plus className="h-3 w-3" /> เพิ่มตัวเลือก
                </button>
              )}
            </div>

            <input
              type="text"
              value={q.explanation}
              onChange={e => patchQuestion(qi, { explanation: e.target.value })}
              placeholder="คำอธิบายเฉลย (ไม่บังคับ)"
              className={inputCls}
            />
          </div>
        );
      })}

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => patchQuiz({ questions: [...quiz.questions, newQuestion()] })}
          className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
        >
          <Plus className="h-3.5 w-3.5" /> เพิ่มข้อคำถาม
        </button>
        <span className="text-[10px] text-slate-500">ข้อที่ยังไม่มีโจทย์ ตัวเลือกไม่ครบ 2 ข้อ หรือไม่ได้เลือกเฉลย จะไม่ถูกบันทึก</span>
      </div>
    </div>
  );
};
