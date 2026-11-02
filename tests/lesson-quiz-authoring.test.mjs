import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createLessonQuiz, isLessonQuizReady } from '../src/utils/lessonQuiz.ts';

// ครู/แอดมินสร้างแบบทดสอบประจำบทได้: มี id, type lesson_quiz, เกณฑ์ผ่าน, รายการข้อสอบ
const q = createLessonQuiz('แบบทดสอบท้ายบท');
assert.equal(q.type, 'lesson_quiz');
assert.ok(q.id.startsWith('lq-'), `quiz id must be namespaced, got ${q.id}`);
assert.equal(q.passingScorePercent, 70);
assert.deepEqual(q.questions, []);
assert.equal(isLessonQuizReady(q), false);
assert.equal(
  isLessonQuizReady({ ...q, questions: [{ id: 'x', question: '?', explanation: '' }] }),
  true,
);

// หน้าสร้างบทเรียนหลักต้องมีที่เพิ่มแบบทดสอบประจำบท
const studio = readFileSync(new URL('../src/components/TeacherStudio.tsx', import.meta.url), 'utf8');
assert.ok(studio.includes('LessonQuizEditor'), 'lesson modal must render the per-lesson quiz editor');
assert.ok(
  studio.includes('lessonForm.quiz') || studio.includes('quiz: lessonForm.quiz'),
  'saving a lesson must persist its quiz',
);

// บทเรียนย่อยแต่ละตอนต้องเพิ่มแบบทดสอบของตัวเองได้
const subs = readFileSync(new URL('../src/components/SubLessonsEditor.tsx', import.meta.url), 'utf8');
assert.ok(subs.includes('quiz'), 'sub-lesson editor must support per-sub-lesson quizzes');

// กล่องเพิ่ม/แก้ข้อสอบต้องรองรับทั้ง pre/post test เดิม และแบบทดสอบประจำบท
assert.ok(
  studio.includes('questionTarget') || studio.includes('lesson_quiz'),
  'question modal must route questions to lesson/sub-lesson quizzes too',
);

console.log('lesson-quiz-authoring tests passed');
