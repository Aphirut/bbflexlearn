import type { Lesson, Quiz, QuizQuestion } from '../types';

export type QuizAnswer = number | number[] | string;

/** แบบทดสอบที่มีคำถามจริงเท่านั้น (แบบทดสอบว่างถือว่าไม่มี) */
export const hasQuestions = (quiz?: Quiz): quiz is Quiz => !!quiz && quiz.questions.length > 0;

/**
 * แบบทดสอบที่ต้องทำเมื่อดูวิดีโอหน่วยนั้นจบ
 * - subLessonId = null: คลิปหลักของบท -> มีแบบทดสอบเฉพาะกรณีบทนั้นไม่มีบทเรียนย่อย
 * - subLessonId = id ของบทย่อย: แบบทดสอบของตอนนั้น และถ้าเป็นตอนสุดท้ายของบท ให้ทำแบบทดสอบประจำบทต่อท้ายด้วย
 */
export function getQuizzesAfterUnit(lesson: Lesson, subLessonId: string | null): Quiz[] {
  const subs = lesson.subLessons || [];
  if (subLessonId === null) {
    return subs.length === 0 && hasQuestions(lesson.quiz) ? [lesson.quiz] : [];
  }
  const out: Quiz[] = [];
  const sub = subs.find(s => s.id === subLessonId);
  if (hasQuestions(sub?.quiz)) out.push(sub.quiz);
  const isLast = subs[subs.length - 1]?.id === subLessonId;
  if (isLast && hasQuestions(lesson.quiz)) out.push(lesson.quiz);
  return out;
}

/** ลำดับแสดงผลของรายการขวาในข้อจับคู่ (สลับแบบกำหนดค่าได้จาก id เพื่อไม่ให้ตำแหน่งเดาได้จากลำดับที่ครูพิมพ์) */
export function matchRightOrder(q: QuizQuestion): number[] {
  const n = q.matchPairs?.length || 0;
  if (n === 0) return [];
  let hash = 0;
  for (const ch of q.id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const shift = hash % n;
  return Array.from({ length: n }, (_, i) => (i + shift) % n);
}

/** ให้คะแนนแบบทดสอบประจำบทฝั่งผู้เรียน (ตรรกะเดียวกับ server/grading.ts) — อัตนัยตอบยาวไม่นับคะแนนอัตโนมัติ */
export function scoreLessonQuiz(quiz: Quiz, answers: QuizAnswer[]): { percent: number; passed: boolean } {
  let earned = 0;
  let total = 0;
  quiz.questions.forEach((q, i) => {
    const type = q.type || 'multiple_choice';
    const points = q.points && q.points > 0 ? q.points : 1;
    const a = answers[i];

    if (type === 'subjective_essay') return;

    if (type === 'subjective_short') {
      const keys = [q.sampleAnswer, ...(q.keywords || [])].map(k => (k || '').trim().toLowerCase()).filter(Boolean);
      if (keys.length === 0) return; // ไม่มีเฉลยให้เทียบ -> ไม่นับ
      total += points;
      const text = typeof a === 'string' ? a.trim().toLowerCase() : '';
      if (text && keys.some(k => text.includes(k))) earned += points;
      return;
    }

    total += points;
    if (type === 'matching') {
      const pairs = q.matchPairs || [];
      const picks = Array.isArray(a) ? a : [];
      const correct = pairs.reduce((sum, _, li) => sum + (picks[li] === li ? 1 : 0), 0);
      earned += pairs.length ? points * (correct / pairs.length) : 0;
    } else if (type === 'multiple_select') {
      const sel = Array.isArray(a) ? [...a].sort().join(',') : '';
      if (sel === [...(q.correctIndices || [])].sort().join(',')) earned += points;
    } else if (a === q.correctIndex) {
      earned += points;
    }
  });
  const percent = total === 0 ? 100 : Math.round((earned / total) * 100);
  return { percent, passed: percent >= quiz.passingScorePercent };
}

/**
 * ทำความสะอาดแบบทดสอบก่อนบันทึก: ตัดตัวเลือก/คู่ที่ว่าง, ตัดข้อที่ไม่สมบูรณ์ และ remap ลำดับเฉลย
 * ไม่มีข้อที่สมบูรณ์เลย = คืน undefined
 */
export function cleanQuiz(quiz: Quiz | undefined): Quiz | undefined {
  if (!quiz) return undefined;
  const questions: QuizQuestion[] = [];
  for (const q of quiz.questions) {
    const text = q.question.trim();
    const type = q.type || 'multiple_choice';
    const explanation = (q.explanation || '').trim();

    if (type === 'subjective_short' || type === 'subjective_essay') {
      if (!text) continue;
      const keywords = (q.keywords || []).map(k => k.trim()).filter(Boolean);
      questions.push({
        ...q,
        question: text,
        explanation,
        sampleAnswer: (q.sampleAnswer || '').trim() || undefined,
        keywords: type === 'subjective_short' && keywords.length ? keywords : undefined,
        rubricGuide: type === 'subjective_essay' ? (q.rubricGuide || '').trim() || undefined : undefined,
        options: undefined,
        matchPairs: undefined,
      });
      continue;
    }

    if (type === 'matching') {
      const pairs = (q.matchPairs || [])
        .map(p => ({ left: p.left.trim(), right: p.right.trim() }))
        .filter(p => p.left && p.right);
      if (!text || pairs.length < 2) continue;
      questions.push({ ...q, question: text, explanation, matchPairs: pairs, options: undefined });
      continue;
    }

    const kept = (q.options || [])
      .map((option, index) => ({ option: option.trim(), index }))
      .filter(entry => entry.option.length > 0);
    if (!text || kept.length < 2) continue;
    const newIndex = new Map(kept.map((entry, i) => [entry.index, i]));
    const base: QuizQuestion = { ...q, question: text, options: kept.map(e => e.option), explanation };

    if (type === 'multiple_select') {
      const correctIndices = (q.correctIndices || [])
        .map(i => newIndex.get(i))
        .filter((i): i is number => i !== undefined);
      if (correctIndices.length) questions.push({ ...base, correctIndices, correctIndex: undefined });
      continue;
    }
    const correctIndex = newIndex.get(q.correctIndex ?? -1);
    if (correctIndex !== undefined) questions.push({ ...base, correctIndex, correctIndices: undefined });
  }
  if (questions.length === 0) return undefined;
  return {
    ...quiz,
    title: quiz.title.trim() || 'แบบทดสอบ',
    passingScorePercent: Math.min(100, Math.max(0, Number(quiz.passingScorePercent) || 0)),
    questions,
  };
}
