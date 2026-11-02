import type { Lesson, Quiz, QuizQuestion } from '../types';

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

/**
 * ทำความสะอาดแบบทดสอบก่อนบันทึก: ตัดตัวเลือกว่าง, ตัดข้อที่ไม่สมบูรณ์ (ไม่มีโจทย์/ตัวเลือกน้อยกว่า 2/ไม่ได้เฉลย)
 * และ remap ลำดับเฉลยให้ตรงกับตัวเลือกที่เหลือ. ไม่มีข้อที่สมบูรณ์เลย = คืน undefined
 */
export function cleanQuiz(quiz: Quiz | undefined): Quiz | undefined {
  if (!quiz) return undefined;
  const questions: QuizQuestion[] = [];
  for (const q of quiz.questions) {
    const text = q.question.trim();
    const kept = (q.options || [])
      .map((option, index) => ({ option: option.trim(), index }))
      .filter(entry => entry.option.length > 0);
    if (!text || kept.length < 2) continue;
    const newIndex = new Map(kept.map((entry, i) => [entry.index, i]));
    const base: QuizQuestion = { ...q, question: text, options: kept.map(e => e.option), explanation: (q.explanation || '').trim() };

    if (q.type === 'multiple_select') {
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
