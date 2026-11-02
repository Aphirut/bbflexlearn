/** จำตำแหน่งวิดีโอข้ามการปิดเบราว์เซอร์: เปิดใหม่ต้องเล่นต่อจากจุดที่ค้างไว้ */

export const RESUME_MIN_SECS = 5; // ต้นคลิปไม่กี่วิแรก เริ่มใหม่เลย
export const RESUME_END_MARGIN = 10; // เหลือท้ายคลิปนิดเดียว ถือว่าดูจบแล้ว ไม่ต้อง resume

/** จุดนี้ควร resume หรือไม่ (ตรงกับเงื่อนไข tryResumeSeek ใน VideoPlayer) */
export function shouldResumePosition(pos: number, duration: number): boolean {
  if (!Number.isFinite(pos) || !Number.isFinite(duration)) return false;
  if (!(duration > 0) || !(pos > RESUME_MIN_SECS)) return false;
  return pos < duration - RESUME_END_MARGIN;
}

export interface SeekCommand {
  message: string;
  target: string;
}

/**
 * สร้างคำสั่ง seek ผ่าน postMessage สำหรับตัวเล่น embed ที่มี player API
 * (YouTube / Vimeo) — Drive กับ Dailymotion ไม่มี API ให้สั่ง คืน null
 * แล้วนับเวลาดูต่อจากตัวสะสมแทน
 */
export function buildEmbedSeekCommands(embedSrc: string, position: number): SeekCommand[] | null {
  if (!embedSrc || !Number.isFinite(position) || position <= 0) return null;
  const s = embedSrc.toLowerCase();
  const pos = Math.floor(position);
  if (s.includes('youtube')) {
    return [{ message: JSON.stringify({ event: 'command', func: 'seekTo', args: [pos, true] }), target: '*' }];
  }
  if (s.includes('vimeo')) {
    return [{ message: JSON.stringify({ method: 'setCurrentTime', value: pos }), target: '*' }];
  }
  return null;
}
