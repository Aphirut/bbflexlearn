import type { Lesson, Quiz } from '../types';

/** หน่วยวิดีโอตามลำดับการเรียน: บทหลัก 1 หน่วย + บทเรียนย่อยตอนละ 1 หน่วย */
export interface PlayUnit {
  lessonId: string;
  subId: string | null;
  title: string;
  quiz?: Quiz;
  /** มีลิงก์วิดีโอให้เล่นหรือไม่ (ไม่มี = ข้ามหน่วยนี้ไปเลย) */
  hasVideo: boolean;
}

interface UnitSource {
  id: string;
  title: string;
  videoUrl?: string;
  quiz?: Quiz;
  subLessons?: { id: string; title: string; videoUrl?: string; quiz?: Quiz }[];
}

/** มีลิงก์วิดีโอให้เล่นจริงหรือไม่ */
export const hasPlayableVideo = (videoUrl: string | undefined | null): boolean =>
  !!(videoUrl || '').trim();

export function buildPlayUnits(lessons: UnitSource[] | Lesson[]): PlayUnit[] {
  return (lessons || []).flatMap(l => [
    { lessonId: l.id, subId: null, title: l.title, quiz: (l as UnitSource).quiz, hasVideo: hasPlayableVideo((l as UnitSource).videoUrl) },
    ...((l.subLessons || []).map(s => ({ lessonId: l.id, subId: s.id as string, title: s.title, quiz: s.quiz, hasVideo: hasPlayableVideo(s.videoUrl) }))),
  ]);
}

/**
 * หาหน่วยที่เล่นได้ใกล้ที่สุดจากตำแหน่งเป้าหมาย (หน่วยที่ไม่มีลิงก์วิดีโอให้ข้ามไปเลย)
 * dir = 1 เดินหน้า, -1 ถอยหลัง — หาไม่เจอคืน -1
 */
export function resolvePlayableIndex(units: PlayUnit[], idx: number, dir: 1 | -1): number {
  if (units[idx]?.hasVideo) return idx;
  let i = idx;
  while (i >= 0 && i < units.length && !units[i].hasVideo) i += dir;
  return i >= 0 && i < units.length ? i : -1;
}

/** แบบทดสอบนี้กั้นทางไปต่อหรือไม่ (ต้องมีข้อสอบ และยังไม่ผ่าน) */
export function isQuizBlocking(quiz: Quiz | undefined, passedQuizIds: string[]): boolean {
  return !!quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0 && !passedQuizIds.includes(quiz.id);
}

/**
 * หาหน่วยแรกในช่วง [fromIdx, toIdx) ที่แบบทดสอบยังกั้นอยู่
 * (เดินหน้าข้ามหน่วยที่ quiz ค้างไม่ได้ — ถอยหลัง/อยู่กับที่คืน -1 เสมอ)
 */
export function findBlockingUnitIndex(
  units: PlayUnit[],
  fromIdx: number,
  toIdxExclusive: number,
  passedQuizIds: string[],
): number {
  if (!(toIdxExclusive > fromIdx)) return -1;
  for (let i = Math.max(0, fromIdx); i < Math.min(toIdxExclusive, units.length); i++) {
    if (isQuizBlocking(units[i].quiz, passedQuizIds)) return i;
  }
  return -1;
}
