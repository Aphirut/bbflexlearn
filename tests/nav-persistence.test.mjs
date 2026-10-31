import assert from 'node:assert/strict';
import { saveNavState, loadNavState, navStorageKey } from '../src/utils/navPersistence.ts';

const store = new Map();
const storage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
};

// บันทึกขณะอยู่หน้า lesson_player บทที่ 3 แล้วโหลดกลับ (จำลองรีเฟรช) ต้องได้หน้าและบทเดิม
saveNavState(storage, 'user-1', { view: 'lesson_player', courseId: 'course-a', lessonId: 'lesson-3' });
assert.deepEqual(loadNavState(storage, 'user-1'), { view: 'lesson_player', courseId: 'course-a', lessonId: 'lesson-3' });
assert.equal(navStorageKey('user-1'), 'bbflex-nav:user-1');

// แยกตามผู้ใช้: ผู้ใช้อื่นต้องไม่เห็นสถานะของ user-1
assert.equal(loadNavState(storage, 'user-2'), null);

// ข้อมูลเสีย/หน้าไม่รู้จัก ต้อง fail-safe เป็น null ไม่เด้งมั่ว
store.set(navStorageKey('user-1'), '{broken json');
assert.equal(loadNavState(storage, 'user-1'), null);
saveNavState(storage, 'user-1', { view: 'not-a-view', courseId: 'course-a' });
assert.equal(loadNavState(storage, 'user-1'), null);

// หน้า lesson_player ที่ไม่มี courseId ใช้ไม่ได้
saveNavState(storage, 'user-1', { view: 'lesson_player', lessonId: 'lesson-3' });
assert.equal(loadNavState(storage, 'user-1'), null);

console.log('nav-persistence tests passed');
