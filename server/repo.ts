import { sql, parseJson } from "./db";
import type { User, Course, UserCourseProgress, Certificate, EmailNotification, CourseAnalytics, UserNote, AppSettings } from "../src/types";

type UserRow = Omit<User, "notes">;
const toUser = (r: any): UserRow => ({
  id: r.id, name: r.name, email: r.email, avatar: r.avatar || "", role: r.role,
  createdAt: r.created_at, department: r.department || undefined, phone: r.phone || undefined,
  enrolledCourseIds: parseJson<string[]>(r.enrolled_course_ids),
});

export async function insertUser(u: UserRow, passwordHash: string) {
  await sql`INSERT INTO users (id,name,email,password_hash,avatar,role,department,phone,enrolled_course_ids,created_at)
     VALUES (${u.id},${u.name},${u.email.toLowerCase()},${passwordHash},${u.avatar},${u.role},${u.department ?? null},${u.phone ?? null},
     ${JSON.stringify(u.enrolledCourseIds || [])},${u.createdAt})`;
}
export async function updateUserProfile(u: UserRow, allowRole: boolean) {
  if (allowRole) {
    await sql`UPDATE users SET name=${u.name}, avatar=${u.avatar}, department=${u.department ?? null}, phone=${u.phone ?? null},
      enrolled_course_ids=${JSON.stringify(u.enrolledCourseIds || [])}, role=${u.role} WHERE id=${u.id}`;
  } else {
    await sql`UPDATE users SET name=${u.name}, avatar=${u.avatar}, department=${u.department ?? null}, phone=${u.phone ?? null},
      enrolled_course_ids=${JSON.stringify(u.enrolledCourseIds || [])} WHERE id=${u.id}`;
  }
}
export const deleteUser = async (id: string) => {
  await sql`DELETE FROM notes WHERE user_id=${id}`;
  await sql`DELETE FROM progress WHERE user_id=${id}`;
  await sql`DELETE FROM users WHERE id=${id}`;
};
export async function getUserById(id: string) {
  const r = await sql`SELECT * FROM users WHERE id=${id}`;
  return (r as any[])[0] as any | undefined;
}
export async function getUserByEmail(email: string) {
  const r = await sql`SELECT * FROM users WHERE email=${email.toLowerCase()}`;
  return (r as any[])[0] as any | undefined;
}
export async function listUsers(onlyId?: string): Promise<UserRow[]> {
  const r = onlyId ? await sql`SELECT * FROM users WHERE id=${onlyId}` : await sql`SELECT * FROM users`;
  return (r as any[]).map(toUser);
}
export { toUser };

export async function saveCourse(c: Course) {
  await sql`INSERT INTO courses (id,title,category,published,created_by_id,classroom_code,data)
     VALUES (${c.id},${c.title},${c.category},${c.published ? 1 : 0},${c.createdById ?? null},${c.classroomCode ?? null},${JSON.stringify(c)})
     ON DUPLICATE KEY UPDATE title=VALUES(title),category=VALUES(category),published=VALUES(published),
       classroom_code=VALUES(classroom_code),data=VALUES(data)`;
}
export const getCourseRow = async (id: string) =>
  (((await sql`SELECT id, created_by_id FROM courses WHERE id=${id}`) as any[])[0]) as
    { id: string; created_by_id: string | null } | undefined;
export const deleteCourse = async (id: string) => {
  await sql`DELETE FROM courses WHERE id=${id}`;
  await sql`DELETE FROM progress WHERE course_id=${id}`;
  await sql`DELETE FROM watch_progress WHERE course_id=${id}`;
  await sql`DELETE FROM certificates WHERE course_id=${id}`;
  await sql`DELETE FROM notes WHERE course_id=${id}`;
  await sql`DELETE FROM analytics WHERE course_id=${id}`;
  await sql`DELETE FROM notifications WHERE data LIKE ${`%"relatedCourseId":"${id}"%`}`;
};
export async function listCourses(user: { id: string; role: string }): Promise<Course[]> {
  const r = user.role === "admin"
    ? await sql`SELECT data FROM courses`
    : await sql`SELECT data FROM courses WHERE published=1 OR created_by_id=${user.id}`;
  return (r as any[]).map((x) => parseJson<Course>(x.data));
}

export async function saveProgress(p: UserCourseProgress) {
  await sql`INSERT INTO progress (user_id,course_id,data) VALUES (${p.userId},${p.courseId},${JSON.stringify(p)})
    ON DUPLICATE KEY UPDATE data=VALUES(data)`;
}
export async function listProgress(user: { id: string; role: string }): Promise<UserCourseProgress[]> {
  const r = user.role === "admin" ? await sql`SELECT data FROM progress`
    : user.role === "teacher"
      ? await sql`SELECT p.data FROM progress p LEFT JOIN courses c ON c.id=p.course_id WHERE p.user_id=${user.id} OR c.created_by_id=${user.id}`
      : await sql`SELECT data FROM progress WHERE user_id=${user.id}`;
  return (r as any[]).map((x) => parseJson<UserCourseProgress>(x.data));
}

export const getCourse = async (id: string): Promise<Course | undefined> => {
  const r = await sql`SELECT data FROM courses WHERE id=${id}`;
  const row = (r as any[])[0];
  return row ? parseJson<Course>(row.data) : undefined;
};
export const getProgress = async (userId: string, courseId: string): Promise<UserCourseProgress | undefined> => {
  const r = await sql`SELECT data FROM progress WHERE user_id=${userId} AND course_id=${courseId}`;
  const row = (r as any[])[0];
  return row ? parseJson<UserCourseProgress>(row.data) : undefined;
};
export async function saveWatch(userId: string, courseId: string, rec: import("./watchGuard").WatchRecord) {
  await sql`INSERT INTO watch_progress (user_id,course_id,lesson_key,data) VALUES (${userId},${courseId},${rec.lessonKey},${JSON.stringify(rec)})
    ON DUPLICATE KEY UPDATE data=VALUES(data)`;
}
export async function listWatch(userId: string, courseId?: string): Promise<import("./watchGuard").WatchRecord[]> {
  const r = courseId
    ? await sql`SELECT data FROM watch_progress WHERE user_id=${userId} AND course_id=${courseId}`
    : await sql`SELECT data FROM watch_progress WHERE user_id=${userId}`;
  return (r as any[]).map((x) => parseJson<import("./watchGuard").WatchRecord>(x.data));
}

export async function saveCertificate(c: Certificate) {
  await sql`INSERT INTO certificates (id,credential_id,user_id,course_id,data) VALUES (${c.id},${c.credentialId},${c.userId},${c.courseId},${JSON.stringify(c)})
     ON DUPLICATE KEY UPDATE data=VALUES(data)`;
}
export async function listCertificates(user: { id: string; role: string }): Promise<Certificate[]> {
  const r = user.role === "admin" ? await sql`SELECT data FROM certificates`
    : user.role === "teacher"
      ? await sql`SELECT k.data FROM certificates k LEFT JOIN courses c ON c.id=k.course_id WHERE k.user_id=${user.id} OR c.created_by_id=${user.id}`
      : await sql`SELECT data FROM certificates WHERE user_id=${user.id}`;
  return (r as any[]).map((x) => parseJson<Certificate>(x.data));
}

export async function saveNotification(n: EmailNotification) {
  await sql`INSERT INTO notifications (id,to_email,is_read,data) VALUES (${n.id},${n.toEmail.toLowerCase()},${n.isRead ? 1 : 0},${JSON.stringify(n)})
     ON DUPLICATE KEY UPDATE is_read=VALUES(is_read),data=VALUES(data)`;
}
export const getNotificationEmail = async (id: string) =>
  ((((await sql`SELECT to_email FROM notifications WHERE id=${id}`) as any[])[0])?.to_email) as string | undefined;
export async function listNotifications(user: { email: string; role: string }): Promise<EmailNotification[]> {
  const r = user.role === "admin" ? await sql`SELECT data FROM notifications`
    : await sql`SELECT data FROM notifications WHERE to_email=${user.email.toLowerCase()}`;
  return (r as any[]).map((x) => parseJson<EmailNotification>(x.data));
}

export async function saveNote(n: UserNote) {
  await sql`INSERT INTO notes (id,user_id,course_id,data) VALUES (${n.id},${n.userId},${n.courseId},${JSON.stringify(n)})
    ON DUPLICATE KEY UPDATE data=VALUES(data)`;
}
export const getNoteOwner = async (id: string) =>
  ((((await sql`SELECT user_id FROM notes WHERE id=${id}`) as any[])[0])?.user_id) as string | undefined;
export const deleteNote = async (id: string) => { await sql`DELETE FROM notes WHERE id=${id}`; };
export const deleteCertificate = async (id: string) => { await sql`DELETE FROM certificates WHERE id=${id}`; };
export const revokeCertificate = async (id: string) => {
  await sql`DELETE FROM certificates WHERE id=${id}`;
  await sql`INSERT INTO deleted_certificates (id) VALUES (${id}) ON DUPLICATE KEY UPDATE id=VALUES(id)`;
};
export const isCertificateRevoked = async (id: string) => {
  const r = await sql`SELECT id FROM deleted_certificates WHERE id=${id}`;
  return (r as any[]).length > 0;
};
export const getCertificate = async (id: string): Promise<Certificate | undefined> => {
  const r = await sql`SELECT data FROM certificates WHERE id=${id}`;
  const row = (r as any[])[0];
  return row ? parseJson<Certificate>(row.data) : undefined;
};
export async function listNotes(userIds?: string[]): Promise<UserNote[]> {
  const ids = userIds && userIds.length ? userIds : [""];
  const r = userIds ? await sql`SELECT data FROM notes WHERE user_id IN ${sql(ids)}` : await sql`SELECT data FROM notes`;
  return (r as any[]).map((x) => parseJson<UserNote>(x.data));
}

export async function saveAnalytics(a: CourseAnalytics) {
  await sql`INSERT INTO analytics (course_id,data) VALUES (${a.courseId},${JSON.stringify(a)})
    ON DUPLICATE KEY UPDATE data=VALUES(data)`;
}
export async function listAnalytics(): Promise<CourseAnalytics[]> {
  const r = await sql`SELECT data FROM analytics`;
  return (r as any[]).map((x) => parseJson<CourseAnalytics>(x.data));
}

export async function getSettings(): Promise<Partial<AppSettings> | null> {
  const r = await sql`SELECT v FROM app_settings WHERE k='app'`;
  const row = (r as any[])[0];
  return row ? parseJson<Partial<AppSettings>>(row.v) : null;
}
export async function saveSettings(s: AppSettings) {
  await sql`INSERT INTO app_settings (k,v) VALUES ('app',${JSON.stringify(s)}) ON DUPLICATE KEY UPDATE v=VALUES(v)`;
}
