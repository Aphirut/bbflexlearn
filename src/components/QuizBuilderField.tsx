import React from 'react';
import { Plus, Trash2, ClipboardCheck } from 'lucide-react';
import type { Quiz, QuizQuestion, QuizQuestionType } from '../types';

const TYPE_LABEL: Record<QuizQuestionType, string> = {
  multiple_choice: 'ปรนัย เลือก 1 ข้อ',
  true_false: 'ถูก / ผิด',
  multiple_select: 'ปรนัย เลือกได้หลายข้อ',
  matching: 'จับคู่',
  subjective_short: 'อัตนัย ตอบสั้น (ตรวจจากคำสำคัญ)',
  subjective_essay: 'อัตนัย ความเรียง (ครูตรวจ)',
};

const MAX_OPTIONS = 6;
const MAX_PAIRS = 8;
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const newQuestion = (type: QuizQuestionType = 'multiple_choice'): QuizQuestion => {
  const base: QuizQuestion = { id: uid('q'), question: '', type, explanation: '', points: 1 };
  switch (type) {
    case 'true_false': return { ...base, options: ['ถูก', 'ผิด'], correctIndex: 0 };
    case 'multiple_select': return { ...base, options: ['', '', '', ''], correctIndices: [] };
    case 'multiple_choice': return { ...base, options: ['', '', '', ''], correctIndex: 0 };
    case 'matching': return { ...base, matchPairs: [{ left: '', right: '' }, { left: '', right: '' }] };
    case 'subjective_short': return { ...base, sampleAnswer: '', keywords: [] };
    case 'subjective_essay': return { ...base, sampleAnswer: '', rubricGuide: '', maxWords: undefined };
  }
};

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

/** ตัวสร้างแบบทดสอบ: ปรนัย / ถูกผิด / หลายคำตอบ / จับคู่ / อัตนัย — ใช้ได้ทั้งบทเรียนหลักและบทย่อย */
export const QuizBuilderField: React.FC<QuizBuilderFieldProps> = ({ label, value, onChange, compact }) => {
  const inputCls = 'w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white';

  if (!value) {
    return (
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
    );
  }

  const quiz = value;
  const patchQuiz = (patch: Partial<Quiz>) => onChange({ ...quiz, ...patch });
  const patchQuestion = (qi: number, patch: Partial<QuizQuestion>) =>
    patchQuiz({ questions: quiz.questions.map((q, i) => (i === qi ? { ...q, ...patch } : q)) });

  const changeType = (qi: number, type: QuizQuestionType) => {
    const q = quiz.questions[qi];
    const fresh = newQuestion(type);
    // คงโจทย์และคำอธิบายไว้ ส่วนฟิลด์เฉพาะของรูปแบบใหม่ใช้ค่าตั้งต้น
    patchQuestion(qi, { ...fresh, id: q.id, question: q.question, explanation: q.explanation, type });
  };

  const isObjective = (t: QuizQuestionType) => t === 'multiple_choice' || t === 'true_false' || t === 'multiple_select';

  const toggleCorrect = (qi: number, oi: number) => {
    const q = quiz.questions[qi];
    if (q.type === 'multiple_select') {
      const current = q.correctIndices || [];
      patchQuestion(qi, { correctIndices: current.includes(oi) ? current.filter(x => x !== oi) : [...current, oi] });
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

  const setPair = (qi: number, pi: number, patch: { left?: string; right?: string }) => {
    const pairs = [...(quiz.questions[qi].matchPairs || [])];
    pairs[pi] = { ...pairs[pi], ...patch };
    patchQuestion(qi, { matchPairs: pairs });
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
        const type = q.type ?? 'multiple_choice';
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
                placeholder={type === 'matching' ? 'คำสั่ง เช่น จับคู่คำศัพท์กับความหมาย' : 'พิมพ์โจทย์คำถาม'}
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

            <select
              value={type}
              onChange={e => changeType(qi, e.target.value as QuizQuestionType)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px]"
              aria-label="รูปแบบคำถาม"
            >
              {(Object.keys(TYPE_LABEL) as QuizQuestionType[]).map(t => (
                <option key={t} value={t}>{TYPE_LABEL[t]}</option>
              ))}
            </select>

            {isObjective(type) && (
              <>
                <span className="block text-[10px] text-slate-400">{isMulti ? 'ติ๊กทุกข้อที่ถูก' : 'เลือกวงกลมข้อที่ถูก'}</span>
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
                          <button type="button" onClick={() => removeOption(qi, oi)} className="shrink-0 p-1 text-slate-400 hover:text-rose-500" aria-label={`ลบตัวเลือก ${oi + 1}`}>
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {!isTF && (q.options || []).length < MAX_OPTIONS && (
                    <button type="button" onClick={() => addOption(qi)} className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800">
                      <Plus className="h-3 w-3" /> เพิ่มตัวเลือก
                    </button>
                  )}
                </div>
              </>
            )}

            {type === 'matching' && (
              <>
                <span className="block text-[10px] text-slate-400">ใส่คู่ที่ถูกต้อง (ซ้าย ↔ ขวา) ระบบจะสลับลำดับฝั่งขวาให้ผู้เรียน</span>
                <div className="space-y-1.5">
                  {(q.matchPairs || []).map((pair, pi) => (
                    <div key={pi} className="flex items-center gap-2">
                      <input type="text" value={pair.left} onChange={e => setPair(qi, pi, { left: e.target.value })} placeholder={`รายการซ้าย ${pi + 1}`} className={inputCls} />
                      <span className="text-slate-400">↔</span>
                      <input type="text" value={pair.right} onChange={e => setPair(qi, pi, { right: e.target.value })} placeholder={`คู่ขวา ${pi + 1}`} className={inputCls} />
                      {(q.matchPairs || []).length > 2 && (
                        <button
                          type="button"
                          onClick={() => patchQuestion(qi, { matchPairs: (q.matchPairs || []).filter((_, i) => i !== pi) })}
                          className="shrink-0 p-1 text-slate-400 hover:text-rose-500"
                          aria-label={`ลบคู่ที่ ${pi + 1}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  {(q.matchPairs || []).length < MAX_PAIRS && (
                    <button
                      type="button"
                      onClick={() => patchQuestion(qi, { matchPairs: [...(q.matchPairs || []), { left: '', right: '' }] })}
                      className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      <Plus className="h-3 w-3" /> เพิ่มคู่
                    </button>
                  )}
                </div>
              </>
            )}

            {type === 'subjective_short' && (
              <div className="space-y-2">
                <input type="text" value={q.sampleAnswer || ''} onChange={e => patchQuestion(qi, { sampleAnswer: e.target.value })} placeholder="คำตอบตัวอย่าง (ถ้าคำตอบมีข้อความนี้ = ผ่านข้อนี้)" className={inputCls} />
                <input
                  type="text"
                  value={(q.keywords || []).join(', ')}
                  onChange={e => patchQuestion(qi, { keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) })}
                  placeholder="หรือคำสำคัญ คั่นด้วยเครื่องหมายจุลภาค เช่น Redis, Cache, TTL"
                  className={inputCls}
                />
                <span className="block text-[10px] text-slate-400">ไม่ได้ใส่ทั้งสองช่อง ข้อนี้จะไม่ถูกนับคะแนนอัตโนมัติ</span>
              </div>
            )}

            {type === 'subjective_essay' && (
              <div className="space-y-2">
                <textarea value={q.rubricGuide || ''} onChange={e => patchQuestion(qi, { rubricGuide: e.target.value })} rows={2} placeholder="เกณฑ์การให้คะแนน (Rubric) เช่น ความถูกต้อง 3 คะแนน, ยกตัวอย่าง 2 คะแนน" className={inputCls} />
                <div className="flex items-center gap-2">
                  <input type="text" value={q.sampleAnswer || ''} onChange={e => patchQuestion(qi, { sampleAnswer: e.target.value })} placeholder="แนวทาง/คำตอบตัวอย่าง (ไม่บังคับ)" className={inputCls} />
                  <input
                    type="number"
                    min={0}
                    value={q.maxWords ?? ''}
                    onChange={e => patchQuestion(qi, { maxWords: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="คำ"
                    className={`${inputCls} w-20`}
                    aria-label="จำนวนคำที่แนะนำ"
                  />
                </div>
                <span className="block text-[10px] text-slate-400">ข้อความยาวจะไม่ถูกนับคะแนนอัตโนมัติ ครูตรวจภายหลัง</span>
              </div>
            )}

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
        <span className="text-[10px] text-slate-500">ข้อที่ไม่สมบูรณ์ (ไม่มีโจทย์, ตัวเลือก/คู่ไม่ครบ, ไม่มีเฉลย) จะไม่ถูกบันทึก</span>
      </div>
    </div>
  );
};
