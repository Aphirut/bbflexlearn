import assert from 'node:assert/strict';
import { advanceWatch, verifiedLessonIds, watchKeyFor, applyActualDuration } from '../server/watchGuard.ts';

const t0 = 1_000_000;
// รายงานแรกอ้างว่าดูจบ 600 วิในทันที ต้องถูก cap เหลือแค่เครดิตช่วงแรก
let r = advanceWatch(undefined, { maxWatched: 600, watchedSecs: 600 }, t0, 600, 'k', 'l1');
assert.ok(r.maxWatched <= 25 && r.watchedSecs <= 25, `first report capped, got ${r.maxWatched}`);

// ผ่านไป 10 วิจริง เร่งสุด 2x ขยับได้ไม่เกิน ~25 วิ แม้ client ส่ง 600
r = advanceWatch(r, { maxWatched: 600, watchedSecs: 600 }, t0 + 10_000, 600, 'k', 'l1');
assert.ok(r.maxWatched <= 50, `rate limited, got ${r.maxWatched}`);

// ดูจริงต่อเนื่อง 300 วิ (จำลอง heartbeat ทุก 10 วิ) ต้องสะสมจนยืนยันจบได้
let rec;
let now = t0;
for (let played = 0; played <= 600; played += 10) {
  rec = advanceWatch(rec, { maxWatched: played, watchedSecs: played }, now, 600, watchKeyFor('l1', 'v.mp4'), 'l1');
  now += 10_000;
}
const course = { lessons: [{ id: 'l1', videoUrl: 'v.mp4', durationMinutes: 10 }] };
assert.ok(verifiedLessonIds(course, new Map([[rec.lessonKey, rec]])).has('l1'), 'watched fully = verified');

// ค่าถอยหลังไม่ได้
const back = advanceWatch(rec, { maxWatched: 0, watchedSecs: 0 }, now + 1000, 600);
assert.equal(back.maxWatched, rec.maxWatched);

// ความยาวบทเรียนคำนวณจากคลิปจริงอัตโนมัติ: คลิปหลัก 95 วิ + คลิปรอง 125 วิ = รวม 220 วิ -> 4 นาที
const c2 = { lessons: [{ id: 'l1', videoUrl: 'a.mp4', durationMinutes: 15, subLessons: [{ id: 's1', videoUrl: 'b.mp4', durationMinutes: 10 }] }] };
let u = applyActualDuration(c2, { lessonId: 'l1', durationSeconds: 95 });
assert.equal(u.lessons[0].videoDurationSeconds, 95);
u = applyActualDuration(u, { lessonId: 'l1', subLessonId: 's1', durationSeconds: 125 });
assert.equal(u.lessons[0].subLessons[0].videoDurationSeconds, 125);
assert.equal(u.lessons[0].durationMinutes, 4, `total from actual clips, got ${u.lessons[0].durationMinutes}`);
assert.equal(applyActualDuration(c2, { lessonId: 'nope', durationSeconds: 60 }), null);
assert.equal(applyActualDuration(c2, { lessonId: 'l1', durationSeconds: -5 }), null);

console.log('watch-guard tests passed');
