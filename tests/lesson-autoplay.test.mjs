import assert from 'node:assert/strict';
import { embedAutoplaySrc, resolveVideoSource } from '../src/utils/embedPlayback.ts';

// คลิกบทเรียนแล้วต้องเล่นต่อทันที: YouTube/Vimeo เติม autoplay=1 ให้ตัวเล่นเริ่มเอง
const yt = resolveVideoSource('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
assert.ok(yt.src.includes('autoplay=1') === false, 'ต้นฉบับต้องยังไม่มี autoplay');
assert.ok(embedAutoplaySrc(yt.src).includes('autoplay=1'));

const vimeo = resolveVideoSource('https://vimeo.com/123456789');
assert.ok(embedAutoplaySrc(vimeo.src).includes('autoplay=1'));

// Google Drive preview / Dailymotion ไม่รองรับ autoplay ผ่าน URL — ต้องได้ src เดิมกลับมา (ผู้ใช้กดเล่นในตัวเล่นเอง)
const drive = resolveVideoSource('https://drive.google.com/file/d/ABC123xyz/view?usp=sharing');
assert.equal(embedAutoplaySrc(drive.src), drive.src);

const dm = resolveVideoSource('https://www.dailymotion.com/video/x8abc12');
assert.equal(embedAutoplaySrc(dm.src), dm.src);

// ลิงก์ไฟล์ตรงไม่ใช่ embed — ไม่ต้องแตะ (ตัว <video> สั่ง play() เองตอน mount)
assert.equal(embedAutoplaySrc('https://cdn.example.com/clip.mp4'), 'https://cdn.example.com/clip.mp4');

console.log('lesson-autoplay tests passed');
