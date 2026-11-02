import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfNoteItem {
  timeLabel: string;
  createdAt: string;
  tags?: string[];
  text: string;
}

export interface PdfNoteGroup {
  lessonTitle: string;
  notes: PdfNoteItem[];
}

export interface NotesPdfInput {
  title: string;
  metaLines: string[];
  groups: PdfNoteGroup[];
  fileName: string;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** A4 ที่ 96 dpi */
const PAGE_W_PX = 794;
const PAGE_H_MM = 297;
const PAGE_W_MM = 210;

function buildHtml(input: NotesPdfInput): string {
  const meta = input.metaLines.map(line => `<div class="meta">${esc(line)}</div>`).join('');
  const groups = input.groups.map(g => {
    const notes = g.notes.map(n => `
      <div class="note">
        <div class="note-head">⏱ ${esc(n.timeLabel)} · ${esc(n.createdAt)}</div>
        ${n.tags?.length ? `<div class="tags">แท็ก: ${esc(n.tags.join(', '))}</div>` : ''}
        <div class="note-body">${esc(n.text)}</div>
      </div>`).join('');
    return `<section class="group"><h2>${esc(g.lessonTitle)}</h2>${notes}</section>`;
  }).join('');
  return `
    <style>
      .pdf-root { width: ${PAGE_W_PX}px; box-sizing: border-box; padding: 48px 56px; background: #fff; color: #0f172a;
        font-family: 'TH Sarabun New', sans-serif; font-size: 18px; line-height: 1.55; }
      .pdf-root h1 { font-size: 30px; font-weight: 700; margin: 0 0 8px; }
      .pdf-root .meta { font-size: 16px; color: #475569; }
      .pdf-root hr { border: 0; border-top: 1px solid #cbd5e1; margin: 16px 0 20px; }
      .pdf-root h2 { font-size: 22px; font-weight: 700; color: #3730a3; margin: 20px 0 10px; }
      .pdf-root .note { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 10px; page-break-inside: avoid; }
      .pdf-root .note-head { font-size: 15px; color: #64748b; font-weight: 700; }
      .pdf-root .tags { font-size: 14px; color: #64748b; }
      .pdf-root .note-body { white-space: pre-wrap; margin-top: 4px; }
    </style>
    <div class="pdf-root">
      <h1>${esc(input.title)}</h1>
      ${meta}
      <hr />
      ${groups}
    </div>`;
}

/** สร้างไฟล์ PDF จริงจากบันทึกการเรียนรู้ (เรนเดอร์ด้วยเบราว์เซอร์ เพื่อให้ภาษาไทยและวรรณยุกต์ถูกต้อง) */
export async function downloadNotesPdf(input: NotesPdfInput): Promise<void> {
  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${PAGE_W_PX}px;background:#fff;`;
  host.innerHTML = buildHtml(input);
  document.body.appendChild(host);

  try {
    await document.fonts.load('18px "TH Sarabun New"');
    await document.fonts.ready;
    const canvas = await html2canvas(host.querySelector('.pdf-root') as HTMLElement, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    });

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const sliceH = Math.floor((canvas.width * PAGE_H_MM) / PAGE_W_MM); // ความสูงของหนึ่งหน้าในหน่วยพิกเซลของ canvas
    let offset = 0;
    let first = true;
    while (offset < canvas.height) {
      const h = Math.min(sliceH, canvas.height - offset);
      const page = document.createElement('canvas');
      page.width = canvas.width;
      page.height = h;
      const ctx = page.getContext('2d');
      if (!ctx) throw new Error('canvas not supported');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, page.width, page.height);
      ctx.drawImage(canvas, 0, offset, canvas.width, h, 0, 0, canvas.width, h);
      if (!first) pdf.addPage();
      const imgH = (h * PAGE_W_MM) / canvas.width;
      pdf.addImage(page.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, PAGE_W_MM, imgH);
      offset += h;
      first = false;
    }
    pdf.save(input.fileName);
  } finally {
    host.remove();
  }
}
