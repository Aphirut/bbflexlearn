import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildPlayUnits, findBlockingUnitIndex, hasPlayableVideo, isQuizBlocking, resolvePlayableIndex } from '../src/utils/quizGate.ts';

// แบบทดสอบย่อยที่ทำไม่เสร็จ ต้องกั้นไม่ให้ผ่านไปบทถัดไป (รวมถึงกดข้ามจากสารบัญ)
const q = (id) => ({ id, title: id, type: 'lesson_quiz', passingScorePercent: 70, questions: [{ id: `x-${id}`, question: '?', explanation: '' }] });
const lessons = [
  { id: 'l1', title: 'L1', subLessons: [{ id: 's1', title: 'S1', quiz: q('q-s1') }] },
  { id: 'l2', title: 'L2', quiz: q('q-l2') },
];

const units = buildPlayUnits(lessons);
// ลำดับหน่วย: l1, l1::s1, l2
assert.deepEqual(units.map(u => `${u.lessonId}::${u.subId ?? '-'}`), ['l1::-', 'l1::s1', 'l2::-']);

// ยังไม่ผ่านอะไรเลย: จาก l1 จะไป l2 โดนกั้นที่ s1 (index 1)
assert.equal(findBlockingUnitIndex(units, 0, 3, []), 1);
// ผ่าน s1 แล้ว: ไป l2 โดนกั้นที่แบบทดสอบ l2 เอง
assert.equal(findBlockingUnitIndex(units, 0, 3, ['q-s1']), 2);
// ผ่านหมดแล้ว: ไปได้
assert.equal(findBlockingUnitIndex(units, 0, 3, ['q-s1', 'q-l2']), -1);
// ย้อนกลับไปทบทวนได้เสมอ ไม่โดนกั้น
assert.equal(findBlockingUnitIndex(units, 2, 0, []), -1);
assert.equal(findBlockingUnitIndex(units, 1, 1, []), -1);
// ข้ามจาก s1 ไป l2 ตรง ๆ ก็ยังโดนกั้นที่ s1
assert.equal(findBlockingUnitIndex(units, 1, 3, []), 1);

// แบบทดสอบที่ไม่มีข้อสอบ หรือผ่านแล้ว ไม่กั้น
assert.equal(isQuizBlocking(undefined, []), false);
assert.equal(isQuizBlocking({ ...q('a'), questions: [] }, []), false);
assert.equal(isQuizBlocking(q('a'), ['a']), false);
assert.equal(isQuizBlocking(q('a'), []), true);

// หน่วยที่ไม่มีลิงก์วิดีโอต้องถูกข้ามไปหน่วยที่มีวิดีโอ
assert.equal(hasPlayableVideo('https://example.com/v.mp4'), true);
assert.equal(hasPlayableVideo('  '), false);
assert.equal(hasPlayableVideo(undefined), false);
const mixed = buildPlayUnits([
  { id: 'l1', title: 'L1', videoUrl: '', subLessons: [{ id: 's1', title: 'S1', videoUrl: 'https://example.com/s1.mp4' }] },
  { id: 'l2', title: 'L2', videoUrl: 'https://example.com/l2.mp4' },
]);
assert.deepEqual(mixed.map(u => u.hasVideo), [false, true, true]);
// เป้าหมายไม่มีวิดีโอ: เดินหน้าข้ามไปหน่วยถัดไปที่มี, ถอยหลังข้ามไปหน่วยก่อนหน้าที่มี
assert.equal(resolvePlayableIndex(mixed, 0, 1), 1);
assert.equal(resolvePlayableIndex(mixed, 0, -1), -1);
assert.equal(resolvePlayableIndex(mixed, 2, 1), 2);
// ไม่มีวิดีโอเลยสักหน่วย: คืน -1
const empty = buildPlayUnits([{ id: 'l1', title: 'L1', videoUrl: '' }]);
assert.equal(resolvePlayableIndex(empty, 0, 1), -1);

// ฝั่ง UI: การย้ายบททุกทางต้องผ่านด่านกั้น (ปุ่มถัดไป/จบคลิป/สารบัญ/โน้ต)
const view = readFileSync(new URL('../src/components/LessonPlayerView.tsx', import.meta.url), 'utf8');
assert.ok(view.includes('requestNavigate'), 'all navigation must go through the quiz gate');
assert.ok(view.includes('findBlockingUnitIndex'), 'gate must block on unpassed sub-lesson quizzes');
assert.ok(!view.includes('onClick={() => { setActiveLessonId(lesson.id); setActiveSubLessonId(null); }}'), 'playlist lesson click must not bypass the gate');
assert.ok(!view.includes('onClick={() => { setActiveLessonId(lesson.id); setActiveSubLessonId(sub.id); }}'), 'playlist sub-lesson click must not bypass the gate');
// ด่านต้องเปิดข้อสอบของหน่วยที่ค้างอยู่ (ไม่ใช่แค่ข้อสอบของหน่วยปัจจุบัน)
assert.ok(view.includes('gateQuiz'), 'gate modal must show the blocking quiz');
// หน่วยที่ไม่มีลิงก์วิดีโอต้องถูกข้าม (ไม่ค้างอยู่จอ fallback)
assert.ok(view.includes('resolvePlayableIndex'), 'navigation must skip units without a video link');
// retry หลังสอบผ่านต้องเห็นว่าผ่านแล้ว (ห้ามเปิดด่านซ้ำเพราะ closure ค้างค่าเก่า)
assert.ok(view.includes('passedRef'), 'gate retry must read fresh passed-quiz state');

console.log('quiz-gate tests passed');
