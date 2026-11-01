import { z } from 'zod';

// สคีมาแบบหลวม: บังคับเฉพาะฟิลด์หลักให้ถูกชนิด ฟิลด์อื่นปล่อยผ่าน (passthrough) เพื่อไม่ให้ฟีเจอร์เดิมพัง
const id = z.string().min(1).max(128);
const str = (max: number) => z.string().max(max);

export const courseSchema = z.object({
  id,
  title: str(300),
  category: str(120).optional().default(''),
  published: z.boolean().optional(),
  classroomCode: str(64).nullish(),
  lessons: z.array(z.object({ id, title: str(300) }).passthrough()).max(500).default([]),
  preTest: z.object({ questions: z.array(z.any()).max(300), passingScorePercent: z.number().min(0).max(100) }).passthrough(),
  postTest: z.object({ questions: z.array(z.any()).max(300), passingScorePercent: z.number().min(0).max(100) }).passthrough(),
}).passthrough();

export const progressSchema = z.object({
  userId: id,
  courseId: id,
  completedLessonIds: z.array(id).max(1000).default([]),
  totalWatchSeconds: z.number().min(0).optional(),
}).passthrough();

export const settingsSchema = z.object({
  appName: str(120),
  appShortName: str(60),
  tagline: str(300).optional().default(''),
  logoType: z.enum(['monogram', 'image']),
  logoUrl: str(2_000_000).optional(),
  logoBgColor: str(64).optional(),
  presetLogoId: str(64).optional(),
  categories: z.array(z.object({ id: str(128) }).passthrough()).max(200).optional(),
}).passthrough();

export const notificationSchema = z.object({
  id,
  toEmail: z.string().email().max(255),
  toName: str(200).optional().default(''),
  subject: str(300),
  type: z.enum(['lesson_update', 'certificate_issued', 'course_enrolled', 'exam_passed', 'course_announcement']),
  previewText: str(1000).optional().default(''),
  htmlBody: str(100_000).optional().default(''),
  isRead: z.boolean().optional().default(false),
  relatedCourseId: str(128).optional(),
}).passthrough();

export const noteSchema = z.object({ id, userId: id }).passthrough();
export const certificateSchema = z.object({ id, userId: id, courseId: id }).passthrough();
export const analyticsSchema = z.object({ courseId: id }).passthrough();

export const userUpdateSchema = z.object({
  name: str(120).min(1).optional(),
  avatar: str(2_000_000).optional(),
  department: str(200).nullish(),
  phone: str(40).nullish(),
  role: z.enum(['admin', 'teacher', 'student']).optional(),
  enrolledCourseIds: z.array(id).max(1000).optional(),
}).strip();

// URL ที่รันสคริปต์ได้ (javascript:, vbscript:, data:text/html, SVG ฝังสคริปต์ ฯลฯ)
const DANGEROUS = /^(javascript|vbscript|livescript):|^data:(?!image\/)/i;

const URL_KEY = /(url|src|href|link|avatar|image|logo|cover|thumbnail)$/i;

/** ค้นทุกฟิลด์ที่เป็น URL (ตามชื่อ key) ว่ามี scheme อันตรายไหม */
export function hasDangerousUrl(value: unknown, depth = 0, key = ''): boolean {
  if (depth > 40) return true;
  if (typeof value === 'string') return URL_KEY.test(key) && DANGEROUS.test(value.replace(/[\u0000-\u0020]/g, ''));
  if (Array.isArray(value)) return value.some(v => hasDangerousUrl(v, depth + 1, key));
  if (value && typeof value === 'object')
    return Object.entries(value).some(([k, v]) => hasDangerousUrl(v, depth + 1, k));
  return false;
}

/** parse + ตรวจ URL; คืน null ถ้าไม่ผ่าน */
export function check<T>(schema: z.ZodType<T>, body: unknown): T | null {
  const r = schema.safeParse(body);
  if (!r.success || hasDangerousUrl(r.data)) return null;
  return r.data;
}
