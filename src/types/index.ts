export type UserRole = 'admin' | 'student' | 'teacher';

export interface CourseCategoryItem {
  id: string;
  label: string;
}

export interface AppSettings {
  appName: string;
  appShortName: string;
  tagline: string;
  categories?: CourseCategoryItem[];
  logoType: 'monogram' | 'image';
  logoUrl?: string;
  logoBgColor?: string;
  presetLogoId?: string;
}

export interface UserNote {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  timestampSeconds: number;
  text: string;
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  createdAt: string;
  department?: string;
  phone?: string;
  enrolledCourseIds: string[];
  notes?: UserNote[];
}

export interface LessonResource {
  id: string;
  title: string;
  type: 'pdf' | 'code' | 'link';
  url: string;
  size?: string;
}

export interface LessonNote {
  id: string;
  lessonId: string;
  timestampSeconds: number;
  text: string;
  createdAt: string;
}

export interface SubLesson {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  videoDurationSeconds?: number; // ความยาวจริงของคลิป (วินาที) วัดอัตโนมัติจากตัวเล่น
  videoUrl: string;
  coverImageUrl?: string;
  order: number;
  quiz?: Quiz; // ถ้ามี ต้องทำผ่านก่อนไปวิดีโอถัดไป
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  durationMinutes: number; // ผลรวมความยาวทุกคลิปในบท (นาที) — คำนวณอัตโนมัติจากคลิปจริงเมื่อทราบ
  videoDurationSeconds?: number; // ความยาวจริงของคลิปหลัก (วินาที) วัดอัตโนมัติจากตัวเล่น
  videoUrl: string;
  coverImageUrl?: string; // URL หรือ data URL ของรูปหน้าปกบทเรียน
  subLessons?: SubLesson[]; // บทเรียนย่อยภายในบทเรียนหลัก
  quiz?: Quiz; // ถ้ามี ต้องทำผ่านก่อนไปวิดีโอถัดไป
  order: number;
  resources?: LessonResource[];
  keyTakeaways?: string[];
}

export type QuizQuestionType =
  | 'multiple_choice'    // ปรนัย 4 ตัวเลือก
  | 'true_false'         // ปรนัย ถูก/ผิด
  | 'multiple_select'    // ปรนัย เลือกได้หลายข้อ
  | 'subjective_short'   // อัตนัย ตอบสั้น/เติมคำ
  | 'subjective_essay';  // อัตนัย ความเรียง/วิเคราะห์ พร้อมเกณฑ์ Rubric

export interface QuizQuestion {
  id: string;
  question: string;
  type?: QuizQuestionType;
  options?: string[]; // สำหรับ multiple_choice, true_false, multiple_select
  correctIndex?: number; // สำหรับ multiple_choice, true_false (0-based)
  correctIndices?: number[]; // สำหรับ multiple_select
  explanation: string;
  points?: number; // คะแนนเต็มข้อนี้ (ค่าเริ่มต้น: 1)
  // ข้อมูลสำหรับข้อสอบอัตนัย (Subjective):
  sampleAnswer?: string; // แนวทางการตอบ / คำตอบตัวอย่าง
  keywords?: string[]; // คำสำคัญสำหรับการตรวจอัตโนมัติหรือประเมินเบื้องต้น
  rubricGuide?: string; // คำอธิบายเกณฑ์การให้คะแนน (Rubric) เช่น ความถูกต้อง 3 คะแนน, การยกตัวอย่าง 2 คะแนน
  maxWords?: number; // จำนวนคำที่แนะนำ
}

export interface Quiz {
  id: string;
  title: string;
  type: 'pre_test' | 'post_test' | 'lesson_quiz';
  passingScorePercent: number;
  questions: QuizQuestion[];
}

/** รหัสหมวดหมู่คอร์ส — เป็นสตริงอิสระเพื่อให้แอดมินสร้างหมวดหมู่เองได้ ('all' = ตัวกรองทั้งหมด) */
export type CourseCategory = string;
export type CourseLevel = 'ระดับเริ่มต้น' | 'ระดับปานกลาง' | 'ระดับสูง';

export type CertificatePresetTheme = 'royal_gold' | 'modern_tech' | 'emerald_academic' | 'minimal_executive';

export interface CertificateTemplate {
  templateType: 'preset' | 'custom_upload';
  presetId: CertificatePresetTheme;
  customBackgroundUrl?: string; // Base64 data URL หรือ image URL
  documentTitleTh: string; // เช่น "ใบประกาศนียบัตรจบหลักสูตร", "วุฒิบัตรแสดงความรู้ความสามารถ", "หนังสือรับรองการฝึกอบรม", "เกียรติบัตรเรียนดีเด่น"
  documentTitleEn: string; // เช่น "Certificate of Completion", "Diploma of Professional Mastery"
  organizationName: string; // เช่น "สถาบันการเรียนรู้ดิจิทัล BB FlexLearn"
  organizationSubtitle?: string; // เช่น "Digital Learning & Professional Institute of Thailand"
  customLogoUrl?: string; // โลโก้หรือตราสัญลักษณ์ของโรงเรียน/สถาบันของครู
  signatureType: 'text' | 'image';
  signatureImageUrl?: string; // ภาพลายเซ็นโปร่งใส
  signerName: string; // ชื่อผู้ลงนาม
  signerTitle: string; // ตำแหน่งผู้ลงนาม
  sealStyle: 'gold' | 'silver' | 'emerald' | 'tech';
  showSeal?: boolean; // false = ซ่อนตราประทับทางการ (ค่าเริ่มต้นแสดง)
  accentColor?: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  coverImageUrl?: string; // URL หรือ data URL ของรูปหน้าปกคอร์ส (แสดงในการ์ดเลือกคอร์ส)
  subtitle: string;
  description: string;
  category: CourseCategory;
  categoryNameTh: string;
  level: CourseLevel;
  durationHours: number;
  instructor: {
    name: string;
    title: string;
    avatar: string;
    organization: string;
    signatureName: string;
  };
  colorTheme: {
    primary: string;
    secondary: string;
    badgeBg: string;
    textAccent: string;
    gradient: string;
  };
  iconType: 'code' | 'palette' | 'brain' | 'trending';
  lessons: Lesson[];
  preTest: Quiz;
  postTest: Quiz;
  published: boolean;
  updatedAt: string;
  learningOutcomes: string[];
  requirements: string[];
  // Classroom specifics (ห้องเรียนครู)
  classroomCode?: string; // เช่น BB-CLS-889
  createdById?: string; // ID ของครูผู้สร้าง
  classroomCapacity?: number;
  isClassroomOpen?: boolean;
  // Template ใบประกาศนียบัตร/วุฒิบัตร/ใบรับรอง
  certificateTemplate?: CertificateTemplate;
}

export interface SubjectiveGradeItem {
  questionId: string;
  studentAnswer: string;
  scoreAwarded: number;
  maxScore: number;
  teacherComment?: string;
  gradedBy?: string;
  gradedAt?: string;
  isGraded: boolean;
}

export interface QuizSubmission {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  date: string;
  answers: (number | number[] | string)[]; // ตัวเลือกลำดับ, ชุดลำดับ หรือข้อความอัตนัย
  subjectiveAnswers?: Record<string, SubjectiveGradeItem>; // key = questionId
  pendingTeacherReview?: boolean;
}

export interface UserCourseProgress {
  courseId: string;
  userId: string;
  enrolledDate: string;
  completedLessonIds: string[];
  preTestScore?: QuizSubmission;
  postTestScore?: QuizSubmission;
  certificateIssued: boolean;
  certificateId?: string;
  certificateDate?: string;
  lastAccessedLessonId?: string;
  totalWatchSeconds: number;
}

export interface Certificate {
  id: string;
  credentialId: string;
  courseId: string;
  courseTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  issuedDate: string;
  instructorName: string;
  instructorTitle: string;
  scorePercentage: number;
  verificationHash: string;
  certificateTemplate?: CertificateTemplate;
}

export interface EmailNotification {
  id: string;
  toEmail: string;
  toName: string;
  subject: string;
  type: 'lesson_update' | 'certificate_issued' | 'course_enrolled' | 'exam_passed' | 'course_announcement';
  previewText: string;
  htmlBody: string;
  sentAt: string;
  isRead: boolean;
  relatedCourseId?: string;
}

export interface CourseAnalytics {
  courseId: string;
  courseTitle: string;
  totalEnrolled: number;
  completionRate: number;
  avgPreTestScore: number;
  avgPostTestScore: number;
  avgImprovementDelta: number;
  dropOffLessonTitle: string;
  satisfactionRating: number;
  lessonCompletions: {
    lessonTitle: string;
    completionPercentage: number;
  }[];
}
