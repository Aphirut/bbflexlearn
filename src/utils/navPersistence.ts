/** จำสถานะการนำทาง (หน้า/คอร์ส/บทเรียน) ไว้ใน storage เพื่อให้รีเฟรชแล้วยังอยู่หน้าเดิม */
export interface NavState {
  view: string;
  courseId?: string;
  lessonId?: string;
}

const VALID_VIEWS = ['catalog', 'my_courses', 'dashboard', 'admin', 'course_detail', 'lesson_player', 'teacher_studio'];
const COURSE_VIEWS = ['course_detail', 'lesson_player'];

export const navStorageKey = (userId: string) => `bbflex-nav:${userId}`;

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function saveNavState(storage: StorageLike, userId: string, state: NavState): void {
  try { storage.setItem(navStorageKey(userId), JSON.stringify(state)); } catch { /* storage blocked */ }
}

export function loadNavState(storage: StorageLike, userId: string): NavState | null {
  try {
    const raw = storage.getItem(navStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NavState;
    if (!parsed || !VALID_VIEWS.includes(parsed.view)) return null;
    if (COURSE_VIEWS.includes(parsed.view) && !parsed.courseId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearNavState(storage: StorageLike, userId: string): void {
  try { storage.removeItem(navStorageKey(userId)); } catch { /* storage blocked */ }
}
