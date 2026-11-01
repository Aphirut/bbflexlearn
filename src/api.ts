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
  if (!res.ok) {
    // token ถูกเพิกถอน (เปลี่ยนรหัสผ่าน/role/ออกจากทุกเครื่อง) ระหว่างใช้งาน -> แจ้งให้แอปออกจากระบบ
    if (res.status === 401 && token && !url.startsWith('/api/auth/')) {
      try { window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT)); } catch { /* non-browser */ }
    }
    throw new ApiError(res.status, (data as { error?: string }).error || 'เกิดข้อผิดพลาด');
  }
  return data as T;
}

export const AUTH_EXPIRED_EVENT = 'bb:auth-expired';

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
export const changePassword = async (currentPassword: string, newPassword: string) =>
  setToken((await api<{ token: string }>('POST', '/api/auth/change-password', { currentPassword, newPassword })).token);
export const logoutAllDevices = () => api('POST', '/api/auth/logout-all', {});
export const adminResetPassword = (userId: string, newPassword: string) =>
  api('POST', `/api/users/${encodeURIComponent(userId)}/password`, { newPassword });
export const fetchBootstrap = () => api<Bootstrap>('GET', '/api/bootstrap');
