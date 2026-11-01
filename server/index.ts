import { Elysia, t, status } from 'elysia';
import { staticPlugin } from '@elysia/static';
import { SignJWT, jwtVerify } from 'jose';
import { z } from 'zod';
import { migrate } from './db';
import * as repo from './repo';
import { advanceWatch, allUnits, applyActualDuration, lessonUnits, verifiedLessonIds, watchKeyFor, type WatchRecord } from './watchGuard';
import { gradeQuiz } from './grading';

const isProd = Bun.env.NODE_ENV === 'production';
const JWT_SECRET = Bun.env.JWT_SECRET || (isProd ? '' : 'dev-only-secret-change-me');
if (!JWT_SECRET) throw new Error('JWT_SECRET must be set in production');
const jwtKey = new TextEncoder().encode(JWT_SECRET);

type Role = 'admin' | 'teacher' | 'student';
type AuthUser = { id: string; email: string; role: Role };

const signToken = (u: AuthUser) =>
  new SignJWT({ email: u.email, role: u.role })
    .setSubject(u.id)
    .setExpirationTime('7d')
    .setProtectedHeader({ alg: 'HS256' })
    .sign(jwtKey);

// Thrown for auth failures; mapped to an HTTP response in onError below.
class HttpError extends Error {
  constructor(public code: number, public body: unknown) { super(typeof body === 'object' && body && 'error' in body ? String((body as { error: unknown }).error) : `HTTP ${code}`); }
}

// Rate limit: failed credential attempts per IP only
const failures = new Map<string, { n: number; reset: number }>();
const MAX_FAILURES = 20;
const checkAuthLimit = (ip: string) => {
  const f = failures.get(ip);
  return !(f && f.reset > Date.now() && f.n >= MAX_FAILURES);
};
const noteFailure = (ip: string) => {
  const now = Date.now();
  const f = failures.get(ip);
  if (!f || f.reset < now) failures.set(ip, { n: 1, reset: now + 15 * 60_000 });
  else f.n++;
};

async function requireAuth(request: Request): Promise<AuthUser> {
  const header = request.headers.get('authorization') || '';
  let id: string;
  try {
    const { payload } = await jwtVerify(header.replace(/^Bearer\s+/, ''), jwtKey);
    id = String(payload.sub || '');
    if (!id) throw new Error('no sub');
  } catch {
    throw new HttpError(401, { error: 'กรุณาเข้าสู่ระบบ' });
  }
  const row = await repo.getUserById(id);
  if (!row) throw new HttpError(401, { error: 'กรุณาเข้าสู่ระบบ' });
  return { id: row.id, email: row.email, role: row.role as Role };
}

const staff = (u: AuthUser) => u.role === 'admin' || u.role === 'teacher';
const clientIp = (request: Request) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'x';

const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(200),
});

const canManageCourse = async (u: AuthUser, courseId: string) => {
  if (u.role === 'admin') return true;
  if (u.role !== 'teacher') return false;
  return (await repo.getCourseRow(courseId))?.created_by_id === u.id;
};

// ตรวจชนิดไฟล์จาก magic bytes (ไม่เชื่อ MIME ที่ client ส่งมา)
type SniffedKind = 'png' | 'jpg' | 'gif' | 'webp' | 'pdf' | null;
async function sniffFileKind(file: File): Promise<SniffedKind> {
  const buf = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const ascii = (a: number, b: number) => String.fromCharCode(...buf.slice(a, b));
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (ascii(0, 6) === 'GIF87a' || ascii(0, 6) === 'GIF89a') return 'gif';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp';
  if (ascii(0, 5) === '%PDF-') return 'pdf';
  return null;
}
async function sniffImageKind(file: File): Promise<'png' | 'jpg' | 'gif' | 'webp' | null> {
  const kind = await sniffFileKind(file);
  return kind === 'pdf' || kind === null ? null : kind;
}

const app = new Elysia()
  .onError(({ error }) => {
    if (error instanceof HttpError) {
      const code = [400, 401, 403, 404, 409, 410, 429].includes(error.code) ? error.code : 500;
      return status(code as 400, error.body as Record<string, string>);
    }
    if (error instanceof Response) return error;
    console.error(error);
    return status(500, { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  })

  // ---------- Auth ----------
  .post('/api/auth/register', async ({ request }) => {
    const ip = clientIp(request);
    if (!checkAuthLimit(ip)) return status(429, { error: 'พยายามบ่อยเกินไป กรุณาลองใหม่ภายหลัง' });
    const p = registerSchema.safeParse(await request.json().catch(() => ({})));
    if (!p.success) return status(400, { error: 'ข้อมูลไม่ถูกต้อง (รหัสผ่านอย่างน้อย 8 ตัวอักษร)' });
    if (await repo.getUserByEmail(p.data.email)) return status(409, { error: 'อีเมลนี้ถูกใช้งานแล้ว' });
    const id = `user-${crypto.randomUUID()}`;
    await repo.insertUser({
      id, name: p.data.name, email: p.data.email,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.data.name)}`,
      role: 'student', createdAt: new Date().toISOString().slice(0, 10), enrolledCourseIds: [],
    }, await Bun.password.hash(p.data.password));
    return { token: await signToken({ id, email: p.data.email.toLowerCase(), role: 'student' }) };
  })

  .post('/api/auth/login', async ({ request }) => {
    const ip = clientIp(request);
    if (!checkAuthLimit(ip)) return status(429, { error: 'พยายามบ่อยเกินไป กรุณาลองใหม่ภายหลัง' });
    const body = await request.json().catch(() => ({}));
    const p = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(body);
    const row = p.success ? await repo.getUserByEmail(p.data.email) : undefined;
    const ok = row && p.success && await Bun.password.verify(p.data.password, row.password_hash);
    if (!row || !ok) {
      noteFailure(ip);
      return status(401, { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }
    return { token: await signToken({ id: row.id, email: row.email, role: row.role }) };
  })

  // ---------- Bootstrap ----------
  .get('/api/bootstrap', async ({ request }) => {
    const me = await requireAuth(request);
    const [users, courses, progress, certificates, notifications, analytics, settings] = await Promise.all([
      staff(me) ? repo.listUsers() : repo.listUsers(me.id),
      repo.listCourses(me), repo.listProgress(me), repo.listCertificates(me),
      repo.listNotifications(me), repo.listAnalytics(), repo.getSettings(),
    ]);
    const notes = await repo.listNotes([me.id]);
    const watch = await repo.listWatch(me.id);
    return {
      currentUserId: me.id,
      users: users.map(u => ({ ...u, notes: notes.filter(n => n.userId === u.id) })),
      courses, progress, certificates, notifications, analytics, settings, watch,
    };
  })

  // ---------- Users ----------
  .post('/api/users', async ({ request }) => {
    const me = await requireAuth(request);
    if (me.role !== 'admin') return status(403, { error: 'ไม่มีสิทธิ์ดำเนินการ' });
    const p = registerSchema.extend({
      role: z.enum(['admin', 'teacher', 'student']).default('student'),
      enrolledCourseIds: z.array(z.string()).optional(),
      id: z.string().regex(/^[\w-]{1,64}$/).optional(),
      avatar: z.string().optional(), department: z.string().optional(), phone: z.string().optional(),
    }).safeParse(await request.json().catch(() => ({})));
    if (!p.success) return status(400, { error: 'ข้อมูลไม่ถูกต้อง' });
    if (await repo.getUserByEmail(p.data.email)) return status(409, { error: 'อีเมลนี้ถูกใช้งานแล้ว' });
    const id = p.data.id || `user-${crypto.randomUUID()}`;
    await repo.insertUser({
      id, name: p.data.name, email: p.data.email, role: p.data.role,
      avatar: p.data.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.data.name)}`,
      department: p.data.department, phone: p.data.phone,
      createdAt: new Date().toISOString().slice(0, 10), enrolledCourseIds: p.data.enrolledCourseIds || [],
    }, await Bun.password.hash(p.data.password));
    return { id };
  })

  .put('/api/users/:id', async ({ request, params }) => {
    const me = await requireAuth(request);
    const isSelf = params.id === me.id;
    if (!isSelf && me.role !== 'admin') return status(403, { error: 'ไม่มีสิทธิ์ดำเนินการ' });
    const existing = await repo.getUserById(params.id);
    if (!existing) return status(404, { error: 'ไม่พบผู้ใช้' });
    const b = await request.json().catch(() => null);
    if (!b || typeof b !== 'object' || Array.isArray(b)) return status(400, { error: 'ข้อมูลไม่ถูกต้อง' });
    if (b.role !== undefined && !['admin', 'teacher', 'student'].includes(b.role)) delete b.role;
    // คนทั่วไปห้ามเปลี่ยน role ตัวเอง (กันอัปเกรดสิทธิ์)
    // enroll เพิ่มได้เฉพาะคอร์สที่ publish แล้วหรือคอร์สที่ตัวเองดูแลเท่านั้น
    if (me.role !== 'admin') {
      delete b.role;
      if (Array.isArray(b.enrolledCourseIds)) {
        const kept = new Set(repo.toUser(existing).enrolledCourseIds || []);
        for (const id of b.enrolledCourseIds) {
          if (typeof id !== 'string' || kept.has(id)) continue;
          const c = await repo.getCourse(id);
          if (!c) continue;
          if (c.published || (me.role === 'teacher' && c.createdById === me.id)) kept.add(id);
        }
        b.enrolledCourseIds = [...kept];
      }
    }
    await repo.updateUserProfile(
      { ...repo.toUser(existing), ...b, id: existing.id, email: existing.email, createdAt: existing.created_at },
      me.role === 'admin' && !!b.role,
    );
    return { ok: true };
  })

  .delete('/api/users/:id', async ({ request, params }) => {
    const me = await requireAuth(request);
    if (me.role !== 'admin' || params.id === me.id) return status(403, { error: 'ไม่มีสิทธิ์ดำเนินการ' });
    await repo.deleteUser(params.id);
    return { ok: true };
  })

  // ---------- Courses ----------
  .put('/api/courses/:id', async ({ request, params }) => {
    const me = await requireAuth(request);
    if (!staff(me)) return status(403, { error: 'ไม่มีสิทธิ์ดำเนินการ' });
    const course = await request.json().catch(() => null);
    if (course?.id !== params.id) return status(400, { error: 'id ไม่ตรงกัน' });
    const existing = await repo.getCourseRow(course.id);
    if (existing && me.role !== 'admin' && existing.created_by_id !== me.id)
      return status(403, { error: 'ไม่มีสิทธิ์ดำเนินการ' });
    const owner = existing ? existing.created_by_id : me.id;
    await repo.saveCourse({ ...course, createdById: owner ?? undefined });
    return { ok: true };
  })

  .delete('/api/courses/:id', async ({ request, params }) => {
    const me = await requireAuth(request);
    const existing = await repo.getCourseRow(params.id);
    if (!existing) return { ok: true };
    if (me.role !== 'admin' && !(me.role === 'teacher' && existing.created_by_id === me.id))
      return status(403, { error: 'ไม่มีสิทธิ์ดำเนินการ' });
    await repo.deleteCourse(params.id);
    return { ok: true };
  })

  .post('/api/classroom/lookup', async ({ request }) => {
    const me = await requireAuth(request);
    const body = await request.json().catch(() => ({}));
    const code = String(body?.code || '').trim().toLowerCase();
    if (!code) return { course: null };
    const all = await repo.listCourses({ id: '', role: 'admin' });
    const hit = all.find(c => c.classroomCode?.toLowerCase() === code && c.isClassroomOpen !== false);
    // รหัสห้องต้องไม่เปิดเผยคอร์สที่ยังไม่ publish ให้คนนอก
    if (hit && !hit.published && !(await canManageCourse(me, hit.id))) return { course: null };
    return { course: hit || null };
  })

  // ---------- Watch verification (server เป็นผู้ยืนยันเวลาดูจริง) ----------
  .get('/api/watch/:courseId', async ({ request, params }) => {
    const me = await requireAuth(request);
    return { watch: await repo.listWatch(me.id, params.courseId) };
  })

  .post('/api/watch/:courseId', async ({ request, params }) => {
    const me = await requireAuth(request);
    const b = await request.json().catch(() => null);
    const course = await repo.getCourse(params.courseId);
    if (!course) return status(404, { error: 'ไม่พบหลักสูตร' });
    const fallback = lessonUnits(course, String(b?.lessonId || ''))[0];
    const unit = allUnits(course).find(u => u.ownerLessonId === b?.lessonId && (!b?.videoUrl || u.videoUrl === b.videoUrl))
      || (fallback ? { ...fallback, ownerLessonId: String(b?.lessonId) } : undefined);
    if (!unit) return status(400, { error: 'ไม่พบบทเรียน' });
    const key = watchKeyFor(unit.ownerLessonId ?? String(b.lessonId), unit.videoUrl);
    const records = await repo.listWatch(me.id, params.courseId);
    const prev = records.find(r => r.lessonKey === key);
    const reportedDur = Number(b?.duration) || 0;
    const effDuration = reportedDur > 0 ? (unit.duration > 0 ? Math.min(unit.duration, reportedDur) : reportedDur) : unit.duration;
    const rec = advanceWatch(prev, { maxWatched: Number(b?.maxWatched) || 0, watchedSecs: Number(b?.watchedSecs) || 0 }, Date.now(), effDuration, key, unit.ownerLessonId ?? String(b.lessonId), unit.videoUrl);
    await repo.saveWatch(me.id, params.courseId, rec);
    return { watch: rec };
  })

  // ความยาวจริงของคลิปที่ตัวเล่นวัดได้ -> บันทึกลงบทเรียนและรวมเป็นความยาวบทอัตโนมัติ
  // นักเรียนรายงานได้เฉพาะบทที่ยังไม่เคยถูกวัดเท่านั้น (กันเขียนทับค่าที่วัดแล้ว)
  .post('/api/courses/:courseId/lesson-duration', async ({ request, params }) => {
    const me = await requireAuth(request);
    const b = await request.json().catch(() => null);
    const course = await repo.getCourse(params.courseId);
    if (!course) return status(404, { error: 'ไม่พบหลักสูตร' });
    const lessonId = String(b?.lessonId || '');
    const subLessonId = b?.subLessonId ? String(b.subLessonId) : null;
    if (!(await canManageCourse(me, params.courseId))) {
      const lesson = course.lessons.find(l => l.id === lessonId);
      const target = subLessonId
        ? lesson?.subLessons?.find(s => s.id === subLessonId)
        : lesson;
      if (!target) return status(400, { error: 'ข้อมูลความยาวไม่ถูกต้อง' });
      if (target.videoDurationSeconds != null) return { course, changed: false };
    }
    const updated = applyActualDuration(course, {
      lessonId,
      subLessonId,
      durationSeconds: Number(b?.durationSeconds) || 0,
    });
    if (!updated) return status(400, { error: 'ข้อมูลความยาวไม่ถูกต้อง' });
    const changed = JSON.stringify(updated.lessons) !== JSON.stringify(course.lessons);
    if (changed) await repo.saveCourse(updated);
    return { course: updated, changed };
  })

  // ---------- Progress / certificates / notes / notifications ----------
  .put('/api/progress/:courseId/:userId', async ({ request, params }) => {
    const me = await requireAuth(request);
    const p = await request.json().catch(() => null);
    if (p?.courseId !== params.courseId || p?.userId !== params.userId)
      return status(400, { error: 'ข้อมูลไม่ตรงกัน' });
    const isSelf = params.userId === me.id;
    if (!isSelf && !(await canManageCourse(me, params.courseId)))
      return status(403, { error: 'ไม่มีสิทธิ์ดำเนินการ' });
    if (isSelf && !staff(me)) {
      // นักเรียนแก้ progress ตัวเอง: บทที่อ้างว่าจบใหม่ต้องมี watch ที่ server ยืนยันแล้วเท่านั้น
      const course = await repo.getCourse(params.courseId);
      if (course) {
        // คะแนนสอบต้องคำนวณจากคำตอบดิบเทียบกับข้อสอบใน DB เท่านั้น ไม่เชื่อ score/passed ที่ client ส่งมา
        for (const key of ['preTestScore', 'postTestScore'] as const) {
          const sub = p[key];
          if (sub && typeof sub === 'object') {
            const quiz = key === 'preTestScore' ? course.preTest : course.postTest;
            const r = gradeQuiz(quiz, (sub as { answers?: unknown }).answers);
            p[key] = {
              ...(sub as object),
              score: r.score,
              total: r.total,
              percentage: r.percentage,
              passed: r.passed,
              pendingTeacherReview: r.pendingTeacherReview,
            };
          }
        }
        const existing = await repo.getProgress(me.id, params.courseId);
        const already = new Set(existing?.completedLessonIds || []);
        const records = new Map((await repo.listWatch(me.id, params.courseId)).map(r => [r.lessonKey, r]));
        const verified = verifiedLessonIds(course, records);
        p.completedLessonIds = (Array.isArray(p.completedLessonIds) ? p.completedLessonIds : [])
          .filter((id: string) => already.has(id) || verified.has(id));
        const allDone = course.lessons.length > 0 && course.lessons.every(l => p.completedLessonIds.includes(l.id));
        if (!allDone || !p.postTestScore?.passed) p.certificateIssued = existing?.certificateIssued || false;
        if (!allDone) { p.certificateId = existing?.certificateId; p.certificateDate = existing?.certificateDate; }
        const verifiedSecs = [...records.values()].reduce((a, r) => a + (r.watchedSecs || 0), 0);
        p.totalWatchSeconds = Math.round(Math.max(existing?.totalWatchSeconds || 0, Math.min(Number(p.totalWatchSeconds) || 0, verifiedSecs)));
      }
    }
    await repo.saveProgress(p);
    return { ok: true };
  })

  .put('/api/certificates/:id', async ({ request, params }) => {
    const me = await requireAuth(request);
    const c = await request.json().catch(() => null);
    if (c?.id !== params.id) return status(400, { error: 'id ไม่ตรงกัน' });
    // ยึด course/user จากใบที่เก็บไว้จริง ไม่ใช่ค่าที่ client ส่งมา (กันย้ายใบข้ามคอร์ส/ข้ามคน)
    if (await repo.isCertificateRevoked(params.id)) return status(410, { error: 'ใบประกาศนียบัตรนี้ถูกเพิกถอนแล้ว' });
    const stored = await repo.getCertificate(params.id);
    const courseId = stored?.courseId ?? c.courseId;
    const ownerId = stored?.userId ?? c.userId;
    if (stored && (c.userId !== stored.userId || c.courseId !== stored.courseId))
      return status(400, { error: 'ข้อมูลไม่ตรงกัน' });
    if (ownerId !== me.id && !(await canManageCourse(me, courseId)))
      return status(403, { error: 'ไม่มีสิทธิ์ดำเนินการ' });
    if (ownerId === me.id && !staff(me)) {
      const course = await repo.getCourse(courseId);
      const prog = await repo.getProgress(me.id, courseId);
      const allDone = !!course && course.lessons.length > 0 && course.lessons.every(l => prog?.completedLessonIds.includes(l.id));
      if (!allDone || !prog?.postTestScore?.passed) return status(403, { error: 'ยังเรียนไม่ครบหรือยังไม่ผ่านแบบทดสอบหลังเรียน' });
    }
    await repo.saveCertificate(stored ? { ...c, userId: ownerId, courseId } : c);
    return { ok: true };
  })

  .delete('/api/certificates/:id', async ({ request, params }) => {
    const me = await requireAuth(request);
    if (me.role !== 'admin') return status(403, { error: 'ไม่มีสิทธิ์ดำเนินการ' });
    await repo.revokeCertificate(params.id);
    return { ok: true };
  })

  .put('/api/notifications/:id', async ({ request, params }) => {
    const me = await requireAuth(request);
    const n = await request.json().catch(() => null);
    if (n?.id !== params.id) return status(400, { error: 'id ไม่ตรงกัน' });
    const owner = await repo.getNotificationEmail(n.id);
    if (owner && owner !== me.email.toLowerCase() && me.role !== 'admin')
      return status(403, { error: 'ไม่มีสิทธิ์ดำเนินการ' });
    await repo.saveNotification(owner ? { ...n, toEmail: owner } : n);
    return { ok: true };
  })

  .put('/api/notes/:id', async ({ request, params }) => {
    const me = await requireAuth(request);
    const n = await request.json().catch(() => null);
    if (n?.id !== params.id || n.userId !== me.id) return status(403, { error: 'ไม่มีสิทธิ์ดำเนินการ' });
    const owner = await repo.getNoteOwner(n.id);
    if (owner && owner !== me.id) return status(403, { error: 'ไม่มีสิทธิ์ดำเนินการ' });
    await repo.saveNote(n);
    return { ok: true };
  })

  .delete('/api/notes/:id', async ({ request, params }) => {
    const me = await requireAuth(request);
    const owner = await repo.getNoteOwner(params.id);
    if (!owner) return status(404, { error: 'ไม่พบบันทึก' });
    if (owner !== me.id && me.role !== 'admin') return status(403, { error: 'ไม่มีสิทธิ์ดำเนินการ' });
    await repo.deleteNote(params.id);
    return { ok: true };
  })

  .put('/api/analytics/:courseId', async ({ request, params }) => {
    const me = await requireAuth(request);
    const a = await request.json().catch(() => null);
    if (a?.courseId !== params.courseId) return status(400, { error: 'id ไม่ตรงกัน' });
    if (!(await canManageCourse(me, params.courseId))) return status(403, { error: 'ไม่มีสิทธิ์ดำเนินการ' });
    await repo.saveAnalytics(a);
    return { ok: true };
  })

  .put('/api/settings', async ({ request }) => {
    const me = await requireAuth(request);
    if (me.role !== 'admin') return status(403, { error: 'ไม่มีสิทธิ์ดำเนินการ' });
    await repo.saveSettings(await request.json().catch(() => ({})));
    return { ok: true };
  })

  // ตรวจชนิดไฟล์จากเนื้อไฟล์จริง กันปลอม MIME/นามสกุล (เช่น สคริปต์สวมรอยเป็นรูป/PDF)
  // ---------- Avatar upload (stored in pic/) ----------
  .post('/api/uploads/avatar', async ({ request }) => {
    const me = await requireAuth(request);
    const form = await request.formData().catch(() => null);
    const file = form?.get('avatar');
    if (!(file instanceof File)) return status(400, { error: 'กรุณาเลือกไฟล์รูปภาพ' });
    if (file.size > 2 * 1024 * 1024) return status(400, { error: 'ไฟล์รูปต้องมีขนาดไม่เกิน 2MB' });
    const ext = await sniffImageKind(file);
    if (!ext) return status(400, { error: 'รองรับเฉพาะไฟล์รูปภาพ (PNG, JPG, GIF, WebP)' });
    const name = `${me.id}-${crypto.randomUUID()}.${ext}`;
    await Bun.write(`${picDir}/${name}`, file);
    return { url: `/pic/${name}` };
  })

  // ---------- Teaching material upload (PDF, stored in uploads/) ----------
  .post('/api/uploads/material', async ({ request }) => {
    const me = await requireAuth(request);
    if (!staff(me)) return status(403, { error: 'ไม่มีสิทธิ์ดำเนินการ' });
    const form = await request.formData().catch(() => null);
    const file = form?.get('material');
    if (!(file instanceof File)) return status(400, { error: 'กรุณาเลือกไฟล์ PDF' });
    if (file.size > 20 * 1024 * 1024) return status(400, { error: 'ไฟล์ PDF ต้องมีขนาดไม่เกิน 20MB' });
    if (file.size === 0) return status(400, { error: 'ไฟล์ว่างเปล่า' });
    if ((await sniffFileKind(file)) !== 'pdf') return status(400, { error: 'รองรับเฉพาะไฟล์ PDF' });
    const name = `mat-${me.id}-${crypto.randomUUID()}.pdf`;
    await Bun.write(`${uploadsDir}/${name}`, file);
    const originalName = String(file.name || name).split(/[\\/]/).pop() || name;
    return { url: `/uploads/${name}`, name: originalName, size: file.size };
  })

  // ---------- Static frontend (production, only when dist exists) ----------
const distDir = `${import.meta.dir}/../dist`;
const picDir = `${import.meta.dir}/../pic`;
const uploadsDir = `${import.meta.dir}/../uploads`;
// Bun.write สร้างโฟลเดอร์แม่ให้เองตอนอัปโหลดไฟล์อยู่แล้ว
app.use(staticPlugin({ assets: picDir, prefix: '/pic' }));
app.use(staticPlugin({ assets: uploadsDir, prefix: '/uploads' }));
if (await Bun.file(`${distDir}/index.html`).exists()) {
  app
    .use(staticPlugin({ assets: distDir, prefix: '/' }))
    .get('/*', ({ request }) => {
      // SPA fallback: Elysia static serves existing files; others fall back to index.html
      const url = new URL(request.url);
      if (url.pathname.startsWith('/api')) return status(404, { error: 'ไม่พบข้อมูล' });
      return Bun.file(`${distDir}/index.html`);
    });
}

await migrate();
const port = Number(Bun.env.PORT || 3001);
app.listen(port, () => console.log(`Elysia listening on :${port}`));

export type App = typeof app;
export { t };
