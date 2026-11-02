import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isLocalMaterialUrl, materialDownloadFileName } from '../server/materialDownload.ts';

// ชื่อไฟล์ดาวน์โหลดต้องลงท้าย .pdf เสมอ
assert.equal(materialDownloadFileName('ภาอังกฤษ ประถมบทที่ 1'), 'ภาอังกฤษ ประถมบทที่ 1.pdf');
assert.equal(materialDownloadFileName('doc.pdf'), 'doc.pdf');
assert.equal(materialDownloadFileName('DOC.PDF'), 'DOC.PDF');
assert.equal(materialDownloadFileName('  a/b:c  '), 'abc.pdf');

// ลิงก์ในระบบ (/uploads/...) ต้องดาวน์โหลดตรง ลิงก์ภายนอกเปิดแท็บใหม่ได้
assert.ok(isLocalMaterialUrl('/uploads/mat-123.pdf'));
assert.ok(!isLocalMaterialUrl('https://drive.google.com/file/x'));
assert.ok(!isLocalMaterialUrl('http://example.com/a.pdf'));

// ปุ่มดาวน์โหลดเอกสารประกอบบทเรียนต้องเซฟเป็นไฟล์ ไม่เปิดพรีวิวแท็บใหม่
const player = readFileSync(new URL('../src/components/VideoPlayer.tsx', import.meta.url), 'utf8');
const block = player.slice(player.indexOf('lesson.resources'));
assert.ok(block.includes('download:'), 'local resource link must carry a download filename');
assert.ok(!block.includes('target="_blank"'), 'resource link must not force a new tab (browser would preview instead of downloading)');

// เซิร์ฟเวอร์ต้องสั่งเบราว์เซอร์แนบไฟล์ PDF (Content-Disposition) และ 404 เมื่อไฟล์หาย
const serverSrc = readFileSync(new URL('../server/index.ts', import.meta.url), 'utf8');
assert.ok(serverSrc.includes('content-disposition'), 'server must send Content-Disposition for material PDFs');
assert.ok(
  serverSrc.includes('materialAttachmentDisposition'),
  'material PDFs must be served as attachments so the browser saves a .pdf file',
);
const helper = readFileSync(new URL('../server/materialDownload.ts', import.meta.url), 'utf8');
assert.ok(helper.includes('attachment'), 'attachment disposition must be defined for PDFs');

console.log('material-download tests passed');
