/** แปลง URL ที่ผู้ใช้วาง (YouTube/Vimeo/Drive/Dailymotion/ลิงก์ไฟล์ตรง) ให้เล่นได้ */
export function resolveVideoSource(rawUrl: string): { kind: 'embed' | 'file'; src: string } {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return { kind: 'file', src: '' };
  const src = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try { url = new URL(src); } catch { return { kind: 'file', src }; }
  const host = url.hostname.replace(/^www\.|^m\./, '').toLowerCase();

  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const id = url.searchParams.get('v')
      || url.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{6,})/)?.[1];
    if (id) return { kind: 'embed', src: `https://www.youtube-nocookie.com/embed/${id}?rel=0&enablejsapi=1` };
  }
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0];
    if (id) return { kind: 'embed', src: `https://www.youtube-nocookie.com/embed/${id}?rel=0&enablejsapi=1` };
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = url.pathname.match(/(\d+)/)?.[1];
    if (id) return { kind: 'embed', src: `https://player.vimeo.com/video/${id}?api=1` };
  }
  if (host === 'drive.google.com') {
    const id = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || url.searchParams.get('id');
    if (id) return { kind: 'embed', src: `https://drive.google.com/file/d/${id}/preview` };
  }
  if (host === 'dailymotion.com' || host === 'dai.ly') {
    const id = (host === 'dai.ly' ? url.pathname.slice(1) : url.pathname.match(/\/video\/([^_/]+)/)?.[1]);
    if (id) return { kind: 'embed', src: `https://www.dailymotion.com/embed/video/${id}` };
  }
  return { kind: 'file', src };
}

/**
 * embed นี้ส่ง event "เล่นจบ" ผ่าน postMessage ให้เราดักได้หรือไม่
 * - true: YouTube / Vimeo (มี player API)
 * - false: Google Drive preview, Dailymotion embed (iframe ข้ามโดเมน ไม่มี API ดักจบ)
 *   พวกนี้ต้องใช้ตัวจับเวลาสำรอง (นับเฉพาะตอนแท็บมองเห็น) แล้วจบอัตโนมัติเมื่อครบความยาวบท
 */
export function supportsEmbedEndedEvent(embedSrc: string): boolean {
  if (!embedSrc) return false;
  const s = embedSrc.toLowerCase();
  return s.includes('youtube') || s.includes('vimeo');
}

/**
 * เติมพารามิเตอร์ autoplay ให้ embed ที่รองรับ (YouTube/Vimeo) เพื่อให้เริ่มเล่นทันทีเมื่อเปิดบทเรียน
 * Drive preview / Dailymotion ไม่รองรับ autoplay ผ่าน URL — คืน src เดิม (ผู้ใช้กดเล่นในตัวเล่นเอง)
 */
export function embedAutoplaySrc(embedSrc: string): string {
  if (!embedSrc) return embedSrc;
  const s = embedSrc.toLowerCase();
  if (s.includes('youtube')) return `${embedSrc}&autoplay=1`;
  if (s.includes('vimeo')) return `${embedSrc}${embedSrc.includes('?') ? '&' : '?'}autoplay=1`;
  return embedSrc;
}
