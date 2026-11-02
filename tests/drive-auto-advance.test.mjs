import assert from 'node:assert/strict';
import { supportsEmbedEndedEvent, resolveVideoSource } from '../src/utils/embedPlayback.ts';

// Google Drive preview: เป็น embed แต่ iframe ข้ามโดเมนไม่มี ended event
// ต้องใช้ตัวจับเวลาสำรอง ไม่งั้นไม่มีวันไปบทต่อไปอัตโนมัติ
const drive = resolveVideoSource('https://drive.google.com/file/d/ABC123xyz/view?usp=sharing');
assert.equal(drive.kind, 'embed');
assert.equal(drive.src, 'https://drive.google.com/file/d/ABC123xyz/preview');
assert.equal(supportsEmbedEndedEvent(drive.src), false);

// Dailymotion embed: โค้ดปัจจุบันไม่ดัก ended event เหมือนกัน
const dm = resolveVideoSource('https://www.dailymotion.com/video/x8abc12');
assert.equal(dm.kind, 'embed');
assert.equal(supportsEmbedEndedEvent(dm.src), false);

// YouTube / Vimeo: มี ended event ผ่าน postMessage ต้องไม่ใช้ตัวจับเวลา
const yt = resolveVideoSource('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
assert.equal(yt.kind, 'embed');
assert.equal(supportsEmbedEndedEvent(yt.src), true);

const vimeo = resolveVideoSource('https://vimeo.com/123456789');
assert.equal(vimeo.kind, 'embed');
assert.equal(supportsEmbedEndedEvent(vimeo.src), true);

console.log('drive-auto-advance tests passed');
