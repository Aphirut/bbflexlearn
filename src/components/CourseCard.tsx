import React from 'react';
import { Course } from '../types';
import { useApp } from '../context/AppContext';
import { CourseArtwork } from './CourseArtwork';
import { ArrowRight, CheckCircle2, Award, Sparkles, Clock, BookOpen } from 'lucide-react';

interface CourseCardProps {
  course: Course;
  onSelect: (course: Course) => void;
  onOpenCertificate?: (courseId: string) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onSelect, onOpenCertificate }) => {
  const { currentUser, getCurrentUserCourseProgress, calculateCourseProgressPercentage } = useApp();
  
  const progress = getCurrentUserCourseProgress(course.id);
  const isEnrolled = currentUser.enrolledCourseIds.includes(course.id);
  const progressPercent = calculateCourseProgressPercentage(course.id);
  const isFinished = progress?.certificateIssued || progressPercent === 100;

  return (
    <div
      onClick={() => onSelect(course)}
      className="group relative flex flex-col bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-500/8 hover:border-indigo-300/80 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer text-left"
    >
      {/* Course Banner: ใช้รูปหน้าปกถ้ามี ไม่งั้นใช้ artwork เดิม */}
      {course.coverImageUrl ? (
        <img src={course.coverImageUrl} alt={course.title} className="h-44 sm:h-52 w-full object-cover" />
      ) : (
        <CourseArtwork type={course.iconType} categoryTh={course.categoryNameTh} className="h-44 sm:h-52" />
      )}

      {/* Card Content */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Clean Unboxed Metadata with Typographic Separators (Zero-Pill) */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2 font-medium flex-wrap">
            <span className="text-indigo-700 font-semibold">{course.categoryNameTh}</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>{course.level}</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="font-mono">{course.durationHours} ชม.</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>{course.lessons.length} บท</span>
            {course.classroomCode && (
              <>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded text-[10px] border border-indigo-100">
                  {course.classroomCode}
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 tracking-tight">
            {course.title}
          </h3>

          {/* Subtitle / Description */}
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
            {course.subtitle}
          </p>
        </div>

        {/* Progress or Enrollment Status */}
        <div className="pt-5 mt-4 border-t border-slate-100/80 space-y-3">
          {isEnrolled ? (
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">
                  {isFinished ? 'สำเร็จการศึกษาแล้ว' : 'ความคืบหน้าการเรียน'}
                </span>
                <span className={`font-mono font-bold ${isFinished ? 'text-emerald-700' : 'text-indigo-700'}`}>
                  {progressPercent}%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isFinished ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-indigo-600 to-blue-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Status info */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5">
                <span>เรียนแล้ว {progress?.completedLessonIds.length || 0} / {course.lessons.length} บท</span>
                {progress?.certificateIssued && onOpenCertificate && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCertificate(course.id);
                    }}
                    className="flex items-center gap-1 text-amber-700 font-bold hover:text-amber-800 transition-colors"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>ดูใบประกาศ</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <img
                  src={course.instructor.avatar}
                  alt={course.instructor.name}
                  className="w-6 h-6 rounded-full object-cover border border-slate-200"
                />
                <span className="truncate max-w-[140px] font-medium text-slate-700">{course.instructor.name}</span>
              </div>
              <span className="text-indigo-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>ดูหลักสูตร</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          )}

          {/* Action Button */}
          <div>
            {isEnrolled ? (
              <button
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                  isFinished
                    ? 'bg-slate-900 group-hover:bg-slate-800 text-white'
                    : 'bg-indigo-600 group-hover:bg-indigo-700 text-white'
                }`}
              >
                {isFinished ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>ทบทวนเนื้อหา & ข้อสอบ</span>
                  </>
                ) : (
                  <>
                    <span>เรียนต่อในบทเรียน</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            ) : (
              <button
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 group-hover:bg-indigo-600 text-slate-800 group-hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>เข้าสู่คอร์สเรียน</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
