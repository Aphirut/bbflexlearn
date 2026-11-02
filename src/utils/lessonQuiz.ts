import type { Quiz } from '../types';

/** แบบทดสอบประจำบท (หลัก/ย่อย): สร้างเปล่าพร้อมเกณฑ์ผ่านเริ่มต้น */
export function createLessonQuiz(title: string): Quiz {
  return {
    id: `lq-${Date.now()}`,
    title: title || 'แบบทดสอบท้ายบท',
    type: 'lesson_quiz',
    passingScorePercent: 70,
    questions: [],
  };
}

/** พร้อมใช้กั้นบทเรียนจริงหรือยัง (ต้องมีอย่างน้อย 1 ข้อ — ตรงกับเงื่อนไขฝั่งผู้เรียน) */
export function isLessonQuizReady(quiz: Quiz | undefined | null): boolean {
  return !!quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0;
}
