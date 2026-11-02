import React, { useState } from 'react';
import type { Quiz, QuizQuestion } from '../types';
import { matchRightOrder, scoreLessonQuiz, type QuizAnswer } from '../utils/lessonQuizzes';

const isEssay = (q: QuizQuestion) => q.type === 'subjective_essay';
const isText = (q: QuizQuestion) => q.type === 'subjective_short' || q.type === 'subjective_essay';

const initialAnswer = (q: QuizQuestion): QuizAnswer => {
  if (q.type === 'multiple_select') return [];
  if (q.type === 'matching') return (q.matchPairs || []).map(() => -1);
  if (isText(q)) return '';
  return -1;
};

const isAnswered = (q: QuizQuestion, a: QuizAnswer) => {
  if (q.type === 'multiple_select') return Array.isArray(a) && a.length > 0;
  if (q.type === 'matching') return Array.isArray(a) && a.every(x => typeof x === 'number' && x >= 0);
  if (isText(q)) return typeof a === 'string' && a.trim().length > 0;
  return typeof a === 'number' && a !== -1;
};

/** ด่านแบบทดสอบประจำบท/ตอน: ตรวจอัตโนมัติ ต้องได้คะแนนถึงเกณฑ์จึงไปวิดีโอถัดไปได้ */
export const LessonQuizGateModal: React.FC<{
  quiz: Quiz;
  lessonTitle: string;
  onPassed: () => void;
  onClose: () => void;
}> = ({ quiz, lessonTitle, onPassed, onClose }) => {
  const [answers, setAnswers] = useState<QuizAnswer[]>(() => quiz.questions.map(initialAnswer));
  const [result, setResult] = useState<{ percent: number; passed: boolean } | null>(null);

  const allAnswered = quiz.questions.every((q, i) => isAnswered(q, answers[i]));
  const hasEssay = quiz.questions.some(isEssay);

  const setAnswer = (qi: number, value: QuizAnswer) =>
    setAnswers(prev => prev.map((a, i) => (i === qi ? value : a)));

  const toggleMulti = (qi: number, oi: number) => {
    const arr = answers[qi] as number[];
    setAnswer(qi, arr.includes(oi) ? arr.filter(x => x !== oi) : [...arr, oi]);
  };

  const setMatch = (qi: number, li: number, ri: number) => {
    const arr = [...(answers[qi] as number[])];
    arr[li] = ri;
    setAnswer(qi, arr);
  };

  const handleSubmit = () => setResult(scoreLessonQuiz(quiz, answers));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={quiz.title}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 space-y-4">
        <div>
          <p className="text-[11px] font-semibold text-indigo-600">ทำแบบทดสอบก่อนไปบทถัดไป · {lessonTitle}</p>
          <h2 className="text-base font-bold text-slate-900 mt-0.5">{quiz.title}</h2>
          <p className="text-xs text-slate-500 mt-1">
            เกณฑ์ผ่าน {quiz.passingScorePercent}% — ผ่านแล้วระบบจะพาไปวิดีโอถัดไปอัตโนมัติ
            {hasEssay && ' · ข้อเขียนยาวไม่นับคะแนนอัตโนมัติ ครูจะตรวจภายหลัง'}
          </p>
        </div>

        {quiz.questions.map((q, qi) => {
          const type = q.type || 'multiple_choice';
          return (
            <div key={q.id} className="space-y-2">
              <p className="text-sm font-medium text-slate-800">{qi + 1}. {q.question}</p>

              {type === 'subjective_short' && (
                <input type="text" value={answers[qi] as string} onChange={e => setAnswer(qi, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="พิมพ์คำตอบ..." />
              )}

              {type === 'subjective_essay' && (
                <>
                  <textarea value={answers[qi] as string} onChange={e => setAnswer(qi, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" rows={5} placeholder="พิมพ์คำตอบ..." />
                  {q.maxWords && <p className="text-[11px] text-slate-400">แนะนำไม่เกิน {q.maxWords} คำ</p>}
                </>
              )}

              {type === 'matching' && (
                <div className="space-y-1.5">
                  {(q.matchPairs || []).map((pair, li) => {
                    const picked = (answers[qi] as number[])[li];
                    return (
                      <div key={li} className="flex items-center gap-2">
                        <span className="flex-1 text-sm text-slate-700 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">{pair.left}</span>
                        <span className="text-slate-400">→</span>
                        <select value={picked} onChange={e => setMatch(qi, li, Number(e.target.value))}
                          className="flex-1 px-2 py-2 rounded-lg border border-slate-200 text-sm bg-white" aria-label={`จับคู่: ${pair.left}`}>
                          <option value={-1}>เลือกคู่...</option>
                          {matchRightOrder(q).map(ri => (
                            <option key={ri} value={ri}>{q.matchPairs![ri].right}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              )}

              {(type === 'multiple_choice' || type === 'true_false' || type === 'multiple_select') && (
                <div className="space-y-1.5">
                  {(q.options || []).map((opt, oi) => {
                    const selected = type === 'multiple_select' ? (answers[qi] as number[]).includes(oi) : answers[qi] === oi;
                    return (
                      <button key={oi} type="button"
                        onClick={() => type === 'multiple_select' ? toggleMulti(qi, oi) : setAnswer(qi, oi)}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${selected ? 'border-indigo-600 bg-indigo-50 text-indigo-800 font-medium' : 'border-slate-200 hover:border-indigo-300'}`}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {result && q.explanation && <p className="text-xs text-slate-500">เฉลย: {q.explanation}</p>}
              {result && type === 'subjective_essay' && q.rubricGuide && <p className="text-xs text-slate-500">เกณฑ์การให้คะแนน: {q.rubricGuide}</p>}
            </div>
          );
        })}

        {result && (
          <div className={`p-3 rounded-xl text-sm font-medium ${result.passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
            {result.passed ? `ผ่าน! ได้ ${result.percent}% — ไปวิดีโอถัดไปได้เลย` : `ได้ ${result.percent}% ยังไม่ถึงเกณฑ์ ${quiz.passingScorePercent}% กรุณาลองอีกครั้ง`}
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700">กลับไปทบทวนวิดีโอ</button>
          {result?.passed ? (
            <button type="button" onClick={onPassed} className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">ไปวิดีโอถัดไป</button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={!allAnswered} className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40">ส่งคำตอบ</button>
          )}
        </div>
      </div>
    </div>
  );
};
