import React from 'react';
import { useApp } from '../context/AppContext';
import { Course, Certificate } from '../types';
import { StudentProgress } from './StudentProgress';
import {
  BookOpen,
  Clock,
  Award,
  TrendingUp,
  PlayCircle,
  Flame,
  CheckCircle2,
  Printer,
  ChevronRight,
  ShieldCheck,
  Bookmark,
  FileEdit,
  Tag,
  Trophy,
  KeyRound
} from 'lucide-react';

interface StudentDashboardProps {
  onSelectCourse: (course: Course) => void;
  onOpenCertificate: (certificate: Certificate) => void;
  onBrowseCourses: () => void;
  onOpenJoinClassroom?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onSelectCourse,
  onOpenCertificate,
  onBrowseCourses,
  onOpenJoinClassroom
}) => {
  const { currentUser, courses, progressList, getUserCertificates, calculateCourseProgressPercentage, getStudyStreak } = useApp();
  const studyStreak = getStudyStreak();

  const userCertificates = getUserCertificates();
  const userProgressList = progressList.filter(p => p.userId === currentUser.id);

  // Calculate statistics
  const enrolledCourses = courses.filter(c => currentUser.enrolledCourseIds.includes(c.id));
  
  // Total study hours
  const totalWatchSeconds = userProgressList.reduce((acc, p) => acc + (p.totalWatchSeconds || 0), 0);
  const totalHours = (totalWatchSeconds / 3600).toFixed(1);

  // Average post-test score
  const postTestScores = userProgressList
    .map(p => p.postTestScore?.percentage)
    .filter((score): score is number => typeof score === 'number');
  const avgPostTest = postTestScores.length > 0
    ? Math.round(postTestScores.reduce((a, b) => a + b, 0) / postTestScores.length)
    : 0;

  // Completed courses
  const completedCoursesCount = userCertificates.length;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-indigo-400/50 shadow"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-indigo-300 font-mono">
                แดชบอร์ดสรุปผลการเรียน
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs text-slate-300">{currentUser.department || 'ผู้เรียนออนไลน์'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
              ยินดีต้อนรับ, {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              ระบบกำลังบันทึกเวลาเรียนและความก้าวหน้าของคุณบนทุกอุปกรณ์แบบเรียลไทม์
            </p>
          </div>
        </div>

        {/* Streak Counter Box */}
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-3 rounded-xl">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Flame className="w-6 h-6 fill-amber-400/30" />
          </div>
          <div>
            <span className="text-[11px] text-slate-300 block">สถิติการเรียนต่อเนื่อง</span>
            <span className="text-base font-bold text-white font-mono">
              {studyStreak > 0 ? `${studyStreak} วันติดต่อกัน` : 'เริ่มวันแรกวันนี้'}
            </span>
          </div>
        </div>
      </div>

      {/* Learning Mastery Tier & Level Progress */}
      <StudentProgress variant="dashboard" />

      {/* KPI Cards Row (Zero-Pill, Tabular Numbers) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Enrolled Courses */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">คอร์สที่ลงทะเบียน</span>
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
            {enrolledCourses.length}
          </div>
          <p className="text-[11px] text-slate-500">
            พร้อมเข้าเรียนได้ตลอด 24 ชม.
          </p>
        </div>

        {/* Study Time */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">เวลาเรียนสะสม</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
            {totalHours} <span className="text-sm font-normal text-slate-500">ชม.</span>
          </div>
          <p className="text-[11px] text-slate-500">
            คำนวณจากการรับชมวิดีโอจริง
          </p>
        </div>

        {/* Certificates Earned */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">ใบประกาศนียบัตรที่ได้รับ</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 font-mono tabular-nums">
            {completedCoursesCount} <span className="text-sm font-normal text-slate-500">ใบ</span>
          </div>
          <p className="text-[11px] text-slate-500">
            ตรวจสอบความถูกต้องออนไลน์ได้
          </p>
        </div>

        {/* Average Post-Test Score */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">คะแนนสอบเฉลี่ย</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono tabular-nums">
            {avgPostTest > 0 ? `${avgPostTest}%` : '-'}
          </div>
          <p className="text-[11px] text-slate-500">
            เกณฑ์ผ่านขั้นต่ำ 80%
          </p>
        </div>

        {/* User Notes Saved in Profile */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-2 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">บันทึกช่วยจำ</span>
            <Bookmark className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-700 font-mono tabular-nums">
            {currentUser.notes?.length || 0} <span className="text-sm font-normal text-slate-500">โน้ต</span>
          </div>
          <p className="text-[11px] text-slate-500">
            บันทึกผูกกับโปรไฟล์ของคุณ
          </p>
        </div>
      </div>

      {/* Courses in Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              คอร์สเรียนที่คุณกำลังศึกษา (Courses In Progress)
            </h2>
            <p className="text-xs text-slate-500">
              กดเรียนต่อเพื่อกลับสู่บทเรียนที่ค้างไว้ได้ทันที
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenJoinClassroom && (
              <button
                onClick={onOpenJoinClassroom}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 text-xs font-semibold border border-indigo-200/80 transition shadow-2xs active:scale-95 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                <span>ใส่รหัสห้องเรียน</span>
              </button>
            )}

            <button
              onClick={onBrowseCourses}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <span>สำรวจคอร์สเพิ่มเติม</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {enrolledCourses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 space-y-4">
            <p className="text-sm">คุณยังไม่ได้ลงทะเบียนในคอร์สเรียนหรือห้องเรียนใดๆ</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onBrowseCourses}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors"
              >
                เลือกดูคอร์สเรียนทั้งหมด
              </button>
              {onOpenJoinClassroom && (
                <button
                  onClick={onOpenJoinClassroom}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>ใส่รหัสเพื่อเข้าร่วมห้องเรียน</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrolledCourses.map(course => {
              const progress = progressList.find(p => p.courseId === course.id && p.userId === currentUser.id);
              const progressPercent = calculateCourseProgressPercentage(course.id);
              const isFinished = progress?.certificateIssued || progressPercent === 100;

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <span>{course.categoryNameTh}</span>
                        {course.classroomCode && (
                          <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                            {course.classroomCode}
                          </span>
                        )}
                      </div>
                      <span className="font-mono">{course.lessons.length} บทเรียน</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                      {course.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-1">
                      {course.subtitle}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 font-medium">ความคืบหน้า</span>
                        <span className="font-mono font-bold text-indigo-700">{progressPercent}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${isFinished ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">
                          เรียนแล้ว {progress?.completedLessonIds.length || 0}/{course.lessons.length} บท
                        </span>
                        <span aria-hidden="true" className="text-slate-200">·</span>
                        <button
                          onClick={() => onSelectCourse(course)}
                          className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 transition-colors"
                          title="ดูตารางผู้นำของคอร์สนี้"
                        >
                          <Trophy className="w-3 h-3 text-amber-500" />
                          <span>Leaderboard</span>
                        </button>
                      </div>

                      <button
                        onClick={() => onSelectCourse(course)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          isFinished
                            ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                        }`}
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>{isFinished ? 'ทบทวนบทเรียน' : 'เรียนต่อ'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* My Notes Showcase Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-indigo-600" />
              <span>บันทึกช่วยจำของคุณ (My Notes & Timestamped Highlights)</span>
            </h2>
            <p className="text-xs text-slate-500">
              ข้อความสรุปและประเด็นสำคัญที่คุณบันทึกไว้ตามจุดเวลาในคลิปวิดีโอ (ผูกกับโปรไฟล์ {currentUser.name})
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
            {currentUser.notes?.length || 0} รายการบันทึก
          </span>
        </div>

        {(!currentUser.notes || currentUser.notes.length === 0) ? (
          <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs space-y-1">
            <FileEdit className="w-6 h-6 mx-auto text-slate-300 mb-1" />
            <p>ยังไม่มีบันทึกช่วยจำ คุณสามารถเปิดบทเรียนและกด "บันทึกช่วยจำ" หรือคลิกจุดเวลาในวิดีโอเพื่อจดโน้ตได้ทันที</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentUser.notes.slice(0, 6).map(note => {
              const matchedCourse = courses.find(c => c.id === note.courseId);
              return (
                <div
                  key={note.id}
                  className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all flex flex-col justify-between space-y-2 text-xs shadow-2xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold">
                        ▶ {formatTime(note.timestampSeconds)}
                      </span>
                      <span className="text-[10px] text-slate-400">{note.createdAt}</span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-indigo-900 block truncate">
                        {note.courseTitle}
                      </span>
                      <p className="text-[11px] text-slate-600 truncate font-medium">
                        {note.lessonTitle}
                      </p>
                    </div>

                    <p className="text-slate-800 text-xs leading-relaxed line-clamp-3 bg-white p-2 rounded-lg border border-slate-100">
                      {note.text}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {note.tags?.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200/60 text-slate-600">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {matchedCourse && (
                      <button
                        onClick={() => onSelectCourse(matchedCourse)}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-0.5 hover:underline"
                      >
                        <span>เปิดวิดีโอ</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Test Scores & Assessment Growth History */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            ผลการทดสอบและการพัฒนาการ (Pre-test vs Post-test Analysis)
          </h2>
          <p className="text-xs text-slate-500">
            ระบบเปรียบเทียบผลคะแนนก่อนและหลังเรียนเพื่อวัดผลสัมฤทธิ์ทางการศึกษาจริง
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 px-3 font-semibold">ชื่อหลักสูตร</th>
                <th className="py-2.5 px-3 font-semibold">ก่อนเรียน (Pre-test)</th>
                <th className="py-2.5 px-3 font-semibold">หลังเรียน (Post-test)</th>
                <th className="py-2.5 px-3 font-semibold">พัฒนาการ (Growth Delta)</th>
                <th className="py-2.5 px-3 font-semibold text-right">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrolledCourses.map(course => {
                const progress = progressList.find(p => p.courseId === course.id && p.userId === currentUser.id);
                const preScore = progress?.preTestScore;
                const postScore = progress?.postTestScore;
                const growth = postScore && preScore ? postScore.percentage - preScore.percentage : null;

                return (
                  <tr key={course.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-medium text-slate-900 max-w-xs truncate">
                      {course.title}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {preScore ? (
                        <span>{preScore.percentage}% ({preScore.score}/{preScore.total})</span>
                      ) : (
                        <span className="text-slate-400">ยังไม่ได้ทำ</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {postScore ? (
                        <span className={postScore.passed ? 'text-indigo-700 font-bold' : 'text-amber-700'}>
                          {postScore.percentage}% ({postScore.score}/{postScore.total})
                        </span>
                      ) : (
                        <span className="text-slate-400">ยังไม่ถึงขั้นตอนสอบ</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {growth !== null ? (
                        <span className={`inline-flex items-center gap-1 font-semibold ${growth >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>+{growth}%</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {progress?.certificateIssued ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>จบหลักสูตรแล้ว</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">กำลังศึกษา</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Certificates Showcase Gallery */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>ทำเนียบใบประกาศนียบัตรของคุณ (Official Certificates)</span>
            </h2>
            <p className="text-xs text-slate-500">
              ใบประกาศนียบัตรที่ออกโดยระบบอัตโนมัติพร้อมรหัส Credential ID สำหรับอ้างอิง
            </p>
          </div>
        </div>

        {userCertificates.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
            เมื่อคุณเรียนจบคลิปวิดีโอครบทุกบทและสอบผ่าน Post-test (80% ขึ้นไป) ระบบจะออกใบประกาศนียบัตรให้ที่นี่โดยอัตโนมัติ
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userCertificates.map(cert => (
              <div
                key={cert.id}
                className="p-4 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono text-amber-800 font-bold">
                        {cert.credentialId}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 line-clamp-1">
                        {cert.courseTitle}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        สำเร็จการศึกษาเมื่อ: {cert.issuedDate}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-amber-100/80 text-xs">
                  <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>ดิจิทัลยืนยันแล้ว</span>
                  </div>

                  <button
                    onClick={() => onOpenCertificate(cert)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>ดู / พิมพ์ใบประกาศ</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
