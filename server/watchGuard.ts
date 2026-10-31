import type { Course } from '../src/types';

export interface WatchRecord {
  lessonKey: string;
  lessonId: string;
  videoUrl?: string;
  maxWatched: number;
  watchedSecs: number;
  duration: number;
  updatedAt: number; // server epoch ms
}

export const REQUIRED_RATIO = 0.9;
export const MAX_RATE = 2; // เร่งสูงสุดที่อนุญาต
const SLACK_SECS = 5;

export const watchKeyFor = (lessonId: string, videoUrl: string) =>
  new Bun.CryptoHasher('sha1').update(`${lessonId}|${videoUrl || ''}`).digest('hex');

/** หน่วยวิดีโอของบทหนึ่ง: ตัวบทเอง + บทเรียนย่อยทุกตอน */
export function lessonUnits(course: Course, lessonId: string) {
  const lesson = course.lessons.find(l => l.id === lessonId);
  if (!lesson) return [];
  const units = [{ lessonId, videoUrl: lesson.videoUrl || '', duration: (lesson.durationMinutes || 0) * 60 }];
  for (const s of lesson.subLessons || []) {
    units.push({ lessonId, videoUrl: s.videoUrl || lesson.videoUrl || '', duration: (s.durationMinutes || lesson.durationMinutes || 0) * 60 });
  }
  return units;
}

export function allUnits(course: Course) {
  return course.lessons.flatMap(l => lessonUnits(course, l.id).map(u => ({ ...u, ownerLessonId: l.id })));
}

/**
 * รับรายงานจาก client แต่เชื่อได้ไม่เกินเวลาจริงที่ผ่านไปบน server คูณอัตราเร่งสูงสุด
 * ค่าจึงขยับได้เร็วสุด 2x ของเวลาจริงเสมอ ไม่ว่า client จะส่งเลขอะไรมา
 */
export function advanceWatch(
  prev: WatchRecord | undefined,
  report: { maxWatched: number; watchedSecs: number },
  now: number,
  duration: number,
  lessonKey = '',
  lessonId = '',
  videoUrl = '',
): WatchRecord {
  const dur = Math.max(0, duration || 0);
  const cap = (v: number) => (dur > 0 ? Math.min(Math.max(0, v || 0), dur) : Math.max(0, v || 0));
  if (!prev) {
    // รายงานแรก: ให้เครดิตไม่เกินช่วง heartbeat แรกที่เร่งสูงสุด
    const firstAllowance = MAX_RATE * 10 + SLACK_SECS;
    return { lessonKey, lessonId, videoUrl, maxWatched: cap(Math.min(report.maxWatched || 0, firstAllowance)), watchedSecs: cap(Math.min(report.watchedSecs || 0, firstAllowance)), duration: dur, updatedAt: now };
  }
  const elapsedSecs = Math.max(0, (now - prev.updatedAt) / 1000);
  const allowance = elapsedSecs * MAX_RATE + SLACK_SECS;
  return {
    lessonKey: prev.lessonKey || lessonKey,
    lessonId: prev.lessonId || lessonId,
    videoUrl: prev.videoUrl || videoUrl,
    duration: dur || prev.duration,
    updatedAt: now,
    maxWatched: cap(Math.min(Math.max(prev.maxWatched, report.maxWatched || 0), prev.maxWatched + allowance)),
    watchedSecs: cap(Math.min(Math.max(prev.watchedSecs, report.watchedSecs || 0), prev.watchedSecs + allowance)),
  };
}

/**
 * บันทึกความยาวจริงของคลิปหนึ่ง แล้วคำนวณ durationMinutes ของบทใหม่จากผลรวมทุกคลิปในบท
 * (คลิปที่ยังไม่เคยถูกวัดใช้ค่าที่กรอกไว้เป็นค่าประมาณไปก่อน)
 */
export function applyActualDuration(
  course: Course,
  args: { lessonId: string; subLessonId?: string | null; durationSeconds: number },
): Course | null {
  const secs = Math.floor(args.durationSeconds);
  if (!Number.isFinite(secs) || secs <= 0 || secs > 24 * 3600) return null;
  const idx = course.lessons.findIndex(l => l.id === args.lessonId);
  if (idx < 0) return null;
  const toMin = (s: number) => Math.max(1, Math.round(s / 60));
  const lessons = course.lessons.map((l, i) => {
    if (i !== idx) return l;
    const subs = (l.subLessons || []).map(s =>
      args.subLessonId && s.id === args.subLessonId ? { ...s, videoDurationSeconds: secs, durationMinutes: toMin(secs) } : s);
    const isSub = !!args.subLessonId && subs.some(s => s.id === args.subLessonId);
    const main = isSub ? l : { ...l, videoDurationSeconds: secs };
    const unitSecs = [
      main.videoDurationSeconds ?? main.durationMinutes * 60,
      ...subs.map(s => s.videoDurationSeconds ?? s.durationMinutes * 60),
    ];
    return { ...main, subLessons: subs, durationMinutes: toMin(unitSecs.reduce((a, b) => a + b, 0)) };
  });
  return { ...course, lessons };
}

export const isUnitVerified = (rec: WatchRecord | undefined) =>
  // maxWatched ขยับได้เฉพาะตอนดูต่อเนื่อง (seek ถูก clamp) จึงเป็นหลักฐานหลัก ส่วน watchedSecs ใช้กันค่าปั้น โดยยอมให้ lag ได้
  !!rec && rec.duration > 0 && rec.maxWatched >= rec.duration * REQUIRED_RATIO && rec.watchedSecs >= rec.duration * 0.5;

/** บทถือว่าเรียนจบจริงเมื่อทุกหน่วยวิดีโอในบทถูกยืนยัน (หรือเคยจบอยู่ก่อนแล้วใน DB) */
export function verifiedLessonIds(course: Course, records: Map<string, WatchRecord>): Set<string> {
  const done = new Set<string>();
  for (const lesson of course.lessons) {
    const units = lessonUnits(course, lesson.id);
    if (units.length && units.every(u => isUnitVerified(records.get(watchKeyFor(u.lessonId, u.videoUrl))))) done.add(lesson.id);
  }
  return done;
}
