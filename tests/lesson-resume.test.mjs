import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildEmbedSeekCommands, shouldResumePosition } from '../src/utils/resumePlayback.ts';

// ปิดเบราว์เซอร์แล้วกลับมา: ตำแหน่งค้างต้องกลับมาเล่นต่อได้
// ข้ามช่วงต้นคลิป (ยังไม่ถึง 5 วิ) และท้ายคลิป (เหลือไม่ถึง 10 วิ) ไม่ต้อง resume
assert.equal(shouldResumePosition(0, 600), false);
assert.equal(shouldResumePosition(3, 600), false);
assert.equal(shouldResumePosition(60, 600), true);
assert.equal(shouldResumePosition(595, 600), false);
assert.equal(shouldResumePosition(590, 600), false);
assert.equal(shouldResumePosition(589, 600), true);
assert.equal(shouldResumePosition(60, 0), false);
assert.equal(shouldResumePosition(-5, 600), false);

// สั่งตัวเล่น embed ข้ามไปจุดที่ค้างไว้ (YouTube/Vimeo มี player API)
const yt = buildEmbedSeekCommands('https://www.youtube-nocookie.com/embed/abc?rel=0&enablejsapi=1', 60);
assert.ok(yt && yt[0].target === '*' && yt[0].message.includes('seekTo') && yt[0].message.includes('60'));
const vi = buildEmbedSeekCommands('https://player.vimeo.com/video/123?api=1', 90);
assert.ok(vi && vi[0].message.includes('setCurrentTime') && vi[0].message.includes('90'));
// Drive/Dailymotion ไม่มี API ให้สั่ง seek — ต้องคืน null (นับเวลาดูต่อจากตัวสะสมแทน)
assert.equal(buildEmbedSeekCommands('https://drive.google.com/file/d/x/preview', 60), null);
assert.equal(buildEmbedSeekCommands('https://www.dailymotion.com/embed/video/x', 60), null);

// VideoPlayer ต้องเซฟตำแหน่งตอนปิดแท็บ (ไม่งั้น 5 วิสุดท้ายหาย) และสั่ง seek ซ้ำจนกว่า iframe จะพร้อม
const player = readFileSync(new URL('../src/components/VideoPlayer.tsx', import.meta.url), 'utf8');
assert.ok(player.includes('pagehide'), 'must flush watch position when the tab closes');
assert.ok(player.includes('keepalive'), 'close-time flush must survive page unload');
assert.ok(
  player.includes('onLoad') && player.includes('attemptEmbedResume'),
  'embed resume seek must retry when the iframe becomes ready',
);

console.log('lesson-resume tests passed');
