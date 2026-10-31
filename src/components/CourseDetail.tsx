import React, { useState } from 'react';
import { Course } from '../types';
import { useApp } from '../context/AppContext';
import { CourseArtwork } from './CourseArtwork';
import { CourseLeaderboard } from './CourseLeaderboard';
import {
  ArrowLeft,
  CheckCircle,
  PlayCircle,
  Award,
  BookOpen,
  ClipboardCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Trophy,
  Zap,
  Users,
  Sparkles,
  Info
} from 'lucide-react';

interface CourseDetailProps {
  course: Course;
  onBack: () => void;
  onStartLesson: (lessonId: string) => void;
  onOpenPreTest: () => void;
  onOpenPostTest: () => void;
  onOpenCertificate: () => void;
  initialTab?: 'curriculum' | 'leaderboard' | 'about';
}

export const CourseDetail: React.FC<CourseDetailProps> = ({
  course,
  onBack,
  onStartLesson,
  onOpenPreTest,
  onOpenPostTest,
  onOpenCertificate,
  initialTab = 'curriculum'
}) => {
  const { currentUser, users, progressList, enrollInCourse, getCurrentUserCourseProgress, calculateCourseProgressPercentage } = useApp();
  const [activeTab, setActiveTab] = useState<'curriculum' | 'leaderboard' | 'about'>(initialTab);

  const isEnrolled = currentUser.enrolledCourseIds.includes(course.id);
  const progress = getCurrentUserCourseProgress(course.id);
  const progressPercent = calculateCourseProgressPercentage(course.id);
  const completedLessons = progress?.completedLessonIds || [];
  const allLessonsDone = completedLessons.length >= course.lessons.length;
  const preTestTaken = !!progress?.preTestScore;
  const postTestTaken = !!progress?.postTestScore;
  const certificateUnlocked = !!progress?.certificateIssued;

  // Top learners snippet for this course
  const courseTopLearners = React.useMemo(() => {
    const list = progressList.filter(p => p.courseId === course.id);
    return list
      .map(p => {
        const u = users.find(user => user.id === p.userId);
        return {
          user: u,
          accuracy: p.postTestScore?.percentage || p.preTestScore?.percentage || 0,
          completed: p.certificateIssued || p.completedLessonIds.length >= course.lessons.length
        };
      })
      .filter(item => item.user && item.completed)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 3);
  }, [progressList, users, course.id, course.lessons.length]);

  const handleEnrollAndStart = () => {
    if (!isEnrolled) {
      enrollInCourse(course.id);
    }
    const firstLessonId = course.lessons[0]?.id;
    if (firstLessonId) {
      onStartLesson(firstLessonId);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>ย้อนกลับไปหน้ารวมคอร์ส</span>
      </button>

      {/* Hero Overview Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12">
        {/* Left Visual Artwork */}
        <div className="lg:col-span-5 relative">
          {course.coverImageUrl ? (
            <img src={course.coverImageUrl} alt={course.title} className="h-full min-h-[260px] w-full object-cover" />
          ) : (
            <CourseArtwork type={course.iconType} categoryTh={course.categoryNameTh} className="h-full min-h-[260px]" />
          )}
        </div>

        {/* Right Info */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            {/* Unboxed Metadata (Zero-Pill) */}
            <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 mb-2">
              <span>{course.categoryNameTh}</span>
              <span aria-hidden="true">·</span>
              <span>{course.level}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{course.durationHours} ชั่วโมง</span>
              <span aria-hidden="true">·</span>
              <span>{course.lessons.length} บทเรียน</span>
              {course.classroomCode && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded text-[11px] border border-indigo-100">
                    รหัสห้องเรียน: {course.classroomCode}
                  </span>
                </>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {course.title}
            </h1>

            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {course.subtitle}
            </p>

            {/* Instructor & Quick Leaderboard */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <img
                  src={course.instructor.avatar}
                  alt={course.instructor.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">{course.instructor.name}</p>
                  <p className="text-[11px] text-slate-500">{course.instructor.title}</p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('leaderboard')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 text-xs font-semibold transition-colors"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-600" />
                <span>ตารางผู้นำ (Leaderboard)</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-700" />
              </button>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            {isEnrolled ? (
              <div className="w-full sm:w-auto flex-1">
                <div className="flex justify-between text-xs mb-1 text-slate-700 font-medium">
                  <span>ความก้าวหน้าการเรียนของคุณ</span>
                  <span className="font-mono font-bold text-indigo-700">{progressPercent}%</span>
                </div>
                <div className="h-2 w-full max-w-md bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${allLessonsDone ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                เข้าเรียนได้ฟรีทันที พร้อมรับใบประกาศนียบัตรเมื่อเรียนจบ
              </p>
            )}

            <div className="flex items-center gap-2">
              {isEnrolled ? (
                <>
                  <button
                    onClick={() => {
                      const resumeId = progress?.lastAccessedLessonId || course.lessons[0]?.id;
                      if (resumeId) onStartLesson(resumeId);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>{progressPercent > 0 ? 'เรียนต่อจากจุดเดิม' : 'เริ่มเรียนบทที่ 1'}</span>
                  </button>

                  {certificateUnlocked && (
                    <button
                      onClick={onOpenCertificate}
                      className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold hover:bg-amber-100 flex items-center gap-1.5 transition-colors"
                    >
                      <Award className="w-4 h-4 text-amber-600" />
                      <span>ดูใบประกาศ</span>
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={handleEnrollAndStart}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>ลงทะเบียนและเริ่มเรียนทันที</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Roadblocks: Pre-test & Post-test Step Banners */}
      {isEnrolled && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pre-test Banner */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${preTestTaken ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                {preTestTaken ? <CheckCircle2 className="w-5 h-5" /> : <ClipboardCheck className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">แบบทดสอบก่อนเรียน (Pre-test)</span>
                  {preTestTaken && (
                    <span className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      คะแนน {progress?.preTestScore?.score}/{progress?.preTestScore?.total} ({progress?.preTestScore?.percentage}%)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {preTestTaken ? 'ทำแบบทดสอบวัดพื้นฐานเรียบร้อยแล้ว' : 'วัดความรู้พื้นฐานก่อนเริ่มเรียนบทเรียน'}
                </p>
              </div>
            </div>

            <button
              onClick={onOpenPreTest}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                preTestTaken
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold'
              }`}
            >
              {preTestTaken ? 'ดูผลการสอบ' : 'เริ่มทำ Pre-test'}
            </button>
          </div>

          {/* Post-test Banner */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                postTestTaken && progress?.postTestScore?.passed
                  ? 'bg-indigo-50 text-indigo-600'
                  : allLessonsDone
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-slate-100 text-slate-400'
              }`}>
                {postTestTaken && progress?.postTestScore?.passed ? (
                  <Award className="w-5 h-5" />
                ) : allLessonsDone ? (
                  <ClipboardCheck className="w-5 h-5" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">แบบทดสอบหลังเรียน (Post-test)</span>
                  {postTestTaken && (
                    <span className="text-[11px] font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      คะแนน {progress?.postTestScore?.score}/{progress?.postTestScore?.total} ({progress?.postTestScore?.percentage}%)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {postTestTaken
                    ? progress?.postTestScore?.passed
                      ? 'ผ่านเกณฑ์เรียบร้อยและได้รับใบประกาศ'
                      : 'ยังไม่ผ่านเกณฑ์ 80% สามารถสอบใหม่ได้'
                    : allLessonsDone
                    ? 'เรียนจบคลิปครบทุกบทแล้ว ปลดล็อคข้อสอบหลังเรียน'
                    : `ต้องเรียนครบทุกบทเรียนก่อน (${completedLessons.length}/${course.lessons.length})`}
                </p>
              </div>
            </div>

            <button
              onClick={onOpenPostTest}
              disabled={!allLessonsDone && !postTestTaken}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:pointer-events-none ${
                postTestTaken && progress?.postTestScore?.passed
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {postTestTaken ? 'ดูผล / สอบใหม่' : 'เริ่มทำ Post-test'}
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tab Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('curriculum')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'curriculum'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>เนื้อหาหลักสูตร (Curriculum)</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 rounded text-slate-600">
            {course.lessons.length} บท
          </span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'leaderboard'
              ? 'border-amber-500 text-amber-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>ตารางผู้นำ (Leaderboard)</span>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
            🏆 Top Learners
          </span>
        </button>

        <button
          onClick={() => setActiveTab('about')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'about'
              ? 'border-slate-800 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Info className="w-4 h-4" />
          <span>ข้อมูลหลักสูตรและผู้สอน</span>
        </button>
      </div>

      {/* TAB 1: CURRICULUM */}
      {activeTab === 'curriculum' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Lesson Syllabus */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <span>เนื้อหาบทเรียนทั้งหมด</span>
                </h2>
                <span className="text-xs text-slate-500 font-mono">
                  {course.lessons.length} บทเรียน ({course.durationHours} ชม.)
                </span>
              </div>

              <div className="space-y-2.5">
                {course.lessons.map((lesson, idx) => {
                  const isFinished = completedLessons.includes(lesson.id);
                  return (
                    <div
                      key={lesson.id}
                      onClick={() => onStartLesson(lesson.id)}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/80 hover:border-slate-300 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        {lesson.coverImageUrl ? (
                          <img src={lesson.coverImageUrl} alt="" className="h-12 w-20 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                            isFinished ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700'
                          }`}>
                            {isFinished ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                          </div>
                        )}
                        <div>
                          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {lesson.title}
                          </h3>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {lesson.description}
                            {!!lesson.subLessons?.length && (
                              <span className="text-indigo-600 font-semibold"> · {lesson.subLessons.length} บทเรียนย่อย</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[11px] font-mono text-slate-400">
                          {lesson.durationMinutes} นาที
                        </span>
                        <PlayCircle className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right 1 Col: Leaderboard Preview & Course Outcomes */}
          <div className="space-y-4">
            {/* Top Learners Quick Preview Card */}
            <div className="bg-white rounded-2xl border border-amber-200/80 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>ผู้นำอันดับต้นของคอร์สนี้</span>
                </h3>
                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-0.5"
                >
                  <span>ดูทั้งหมด</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {courseTopLearners.length > 0 ? (
                <div className="space-y-2">
                  {courseTopLearners.map((item, idx) => (
                    <div
                      key={item.user?.id || idx}
                      onClick={() => setActiveTab('leaderboard')}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-amber-50/50 border border-slate-100 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                          idx === 0 ? 'bg-amber-400 text-amber-950' : idx === 1 ? 'bg-slate-300 text-slate-800' : 'bg-amber-700 text-white'
                        }`}>
                          {idx + 1}
                        </span>
                        <img
                          src={item.user?.avatar}
                          alt={item.user?.name}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200"
                        />
                        <div className="truncate max-w-[120px]">
                          <p className="text-xs font-semibold text-slate-900 truncate">{item.user?.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{item.user?.department || 'ผู้เรียน'}</p>
                        </div>
                      </div>

                      <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {item.accuracy}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">ยังไม่มีผู้เรียนจบหลักสูตรนี้ เป็นคนแรกที่พิชิตอันดับ 1!</p>
              )}

              <button
                onClick={() => setActiveTab('leaderboard')}
                className="w-full py-2 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-600" />
                <span>เปิดดูตารางคะแนน Course Leaderboard</span>
              </button>
            </div>

            {/* Learning Outcomes */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500 font-mono">
                สิ่งที่คุณจะได้รับจากคอร์สนี้
              </h2>
              <ul className="space-y-2 text-xs text-slate-600">
                {course.learningOutcomes.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-2 text-xs text-slate-600">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500 font-mono">
                ความรู้พื้นฐานที่จำเป็น
              </h2>
              <ul className="space-y-1.5 list-disc list-inside">
                {course.requirements.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <CourseLeaderboard
          courseId={course.id}
          courseTitle={course.title}
          totalLessons={course.lessons.length}
          onStartLesson={onStartLesson}
          onOpenPostTest={onOpenPostTest}
        />
      )}

      {/* TAB 3: ABOUT / INSTRUCTOR */}
      {activeTab === 'about' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">เกี่ยวกับหลักสูตรนี้</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {course.description}
            </p>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-4">ข้อมูลผู้สอน (Instructor Bio)</h3>
            <div className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <img
                src={course.instructor.avatar}
                alt={course.instructor.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">{course.instructor.name}</h4>
                <p className="text-xs font-medium text-indigo-600">{course.instructor.title}</p>
                <p className="text-xs text-slate-500">{course.instructor.organization}</p>
                <p className="text-xs text-slate-600 pt-2 leading-relaxed">
                  ผู้เชี่ยวชาญที่มีประสบการณ์สอนและพัฒนาซอฟต์แวร์ระดับองค์กร มุ่งเน้นการถ่ายทอดทักษะที่นำไปประยุกต์ใช้ได้จริงในการทำงานยุคใหม่
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3">ทักษะที่คุณจะได้รับ</h3>
              <ul className="space-y-2 text-xs text-slate-600">
                {course.learningOutcomes.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3">เงื่อนไขการรับใบประกาศนียบัตร</h3>
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>เงื่อนไขความสำเร็จ 2 ประการ</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  1. รับชมและเรียนจบเนื้อหาบทเรียนครบ 100% ({course.lessons.length} บทเรียน)<br />
                  2. สอบแบบทดสอบหลังเรียน (Post-test) ผ่านเกณฑ์ขั้นต่ำ 80%
                </p>
                <p className="text-[10px] text-amber-800 pt-1 border-t border-amber-200/60 font-mono">
                  ใบประกาศนียบัตรจะถูกสร้างขึ้นอัตโนมัติพร้อมระบบตรวจสอบ Hash และรหัส Credential ID
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
