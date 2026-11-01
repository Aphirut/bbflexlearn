import assert from 'node:assert/strict';
import * as V from '../server/validate.ts';
import { safeUrl } from '../src/utils/safeUrl.ts';

const quiz = { questions: [], passingScorePercent: 60 };
const course = { id: 'c1', title: 'JS', lessons: [{ id: 'l1', title: 'intro', videoUrl: 'https://youtu.be/x' }], preTest: quiz, postTest: quiz };

// course ปกติผ่าน และข้อความ "javascript:" ในเนื้อหาไม่ถูกบล็อก
assert.ok(V.check(V.courseSchema, course));
assert.ok(V.check(V.courseSchema, { ...course, description: 'javascript: คืออะไร' }));
// URL อันตรายถูกปฏิเสธ
assert.equal(V.check(V.courseSchema, { ...course, lessons: [{ id: 'l1', title: 'x', videoUrl: 'javascript:alert(1)' }] }), null);
assert.equal(V.check(V.courseSchema, { ...course, coverImageUrl: ' JaVa\tScript:alert(1)' }), null);
assert.equal(V.check(V.courseSchema, { ...course, lessons: [{ id: 'l1', title: 'x', resources: [{ url: 'data:text/html,<script>' }] }] }), null);
// รูป data URL ใช้ได้
assert.ok(V.check(V.courseSchema, { ...course, coverImageUrl: 'data:image/png;base64,AAAA' }));
// ข้อมูลผิดรูปแบบ
assert.equal(V.check(V.courseSchema, null), null);
assert.equal(V.check(V.courseSchema, { id: 'c1' }), null);
assert.equal(V.check(V.settingsSchema, { appName: 'a', appShortName: 'b', logoType: 'image', logoUrl: 'javascript:x' }), null);
// user update ตัดฟิลด์แปลก ๆ และ role ผิดค่า
assert.deepEqual(V.check(V.userUpdateSchema, { name: 'A', password_hash: 'x' }), { name: 'A' });
assert.equal(V.check(V.userUpdateSchema, { role: 'superadmin' }), null);
assert.equal(V.check(V.notificationSchema, { id: 'n', toEmail: 'bad', subject: 's', type: 'course_announcement' }), null);

// safeUrl ฝั่ง client
assert.equal(safeUrl('https://a.com'), 'https://a.com');
assert.equal(safeUrl('/uploads/x.pdf'), '/uploads/x.pdf');
assert.equal(safeUrl('javascript:alert(1)'), 'about:blank');
assert.equal(safeUrl(' java\nscript:alert(1)'), 'about:blank');
assert.equal(safeUrl('data:text/html,x'), 'about:blank');
console.log('security tests passed');
