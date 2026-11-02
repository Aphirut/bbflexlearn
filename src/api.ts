import type { User, Course, UserCourseProgress, Certificate, EmailNotification, CourseAnalytics, AppSettings } from './types';

const TOKEN_KEY = 'bb_auth_token_v1';

export const getToken = (): string | null => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (t: string | null) => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* storage blocked */ }
};

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(url, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error || 'เกิดข้อผิดพลาด');
  return data as T;
}

export interface Bootstrap {
  currentUserId: string;
  users: User[];
  courses: Course[];
  progress: UserCourseProgress[];
  certificates: Certificate[];
  notifications: EmailNotification[];
  analytics: CourseAnalytics[];
  settings: Partial<AppSettings> | null;
  watch?: { lessonKey: string; lessonId: string; maxWatched: number; watchedSecs: number; duration: number }[];
}

export const uploadAvatar = async (file: File): Promise<string> => {
  const token = getToken();
  const form = new FormData();
  form.append('avatar', file);
  const res = await fetch('/api/uploads/avatar', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error || 'อัปโหลดรูปไม่สำเร็จ');
  return (data as { url: string }).url;
};

export interface UploadedMaterial {
  url: string;
  name: string;
  size: number;
}

export const uploadMaterial = async (file: File): Promise<UploadedMaterial> => {
  const token = getToken();
  const form = new FormData();
  form.append('material', file);
  const res = await fetch('/api/uploads/material', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error || 'อัปโหลดไฟล์ไม่สำเร็จ');
  return data as UploadedMaterial;
};

export const formatFileSize = (bytes?: number): string => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const login = async (email: string, password: string) =>
  setToken((await api<{ token: string }>('POST', '/api/auth/login', { email, password })).token);
export const register = async (name: string, email: string, password: string) =>
  setToken((await api<{ token: string }>('POST', '/api/auth/register', { name, email, password })).token);
export const fetchBootstrap = () => api<Bootstrap>('GET', '/api/bootstrap');

export interface AiGradeSuggestion {
  score: number;
  maxScore: number;
  comment: string;
}

/** ขอข้อเสนอคะแนนอัตนัยจาก AI — ครูต้องยืนยันก่อนบันทึกเสมอ */
export const suggestSubjectiveGrade = (body: {
  courseId: string;
  quizType: 'pre_test' | 'post_test';
  questionId: string;
  studentAnswer: string;
}) => api<AiGradeSuggestion>('POST', '/api/ai/grade-subjective', body);
