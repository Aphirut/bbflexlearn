import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserCourseProgress } from '../types';
import {
  Trophy,
  Medal,
  Clock,
  CheckCircle2,
  Award,
  Zap,
  Target,
  Sparkles,
  ArrowUpRight,
  Search,
  BookOpen,
  ChevronRight,
  TrendingUp,
  Flame,
  HelpCircle
} from 'lucide-react';

export type LeaderboardSortOption = 'overall' | 'accuracy' | 'speed';

interface CourseLeaderboardProps {
  courseId: string;
  courseTitle?: string;
  totalLessons?: number;
  onStartLesson?: (lessonId: string) => void;
  onOpenPostTest?: () => void;
}

export interface RankedLearner {
  rank: number;
  user: User;
  progress: UserCourseProgress;
  isCurrentUser: boolean;
  isCompleted: boolean;
  completedLessonsCount: number;
  totalLessonsCount: number;
  completionPercent: number;
  quizAccuracy: number; // Post-test percentage (or pre-test if not yet taken)
  preTestAccuracy?: number;
  postTestAccuracy?: number;
  hasPostTest: boolean;
  completionDays: number;
  watchMinutes: number;
  formattedSpeed: string;
  compositeScore: number;
  speedPoints: number;
}

export const CourseLeaderboard: React.FC<CourseLeaderboardProps> = ({
  courseId,
  courseTitle,
  totalLessons,
  onStartLesson,
  onOpenPostTest
}) => {
  const { users, progressList, currentUser, courses } = useApp();

  const [sortOption, setSortOption] = useState<LeaderboardSortOption>('overall');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  // Retrieve course info
  const course = useApp().courses.find(c => c.id === courseId);
  const lessonsCount = totalLessons || course?.lessons.length || 1;

  // Process all learners enrolled in this course
  const rankedLearners = useMemo(() => {
    // 1. Find all progress records for this course
    const courseProgress = progressList.filter(p => p.courseId === courseId);

    // Also include any user who has enrolledCourseIds including this course even if no progress record yet
    const enrolledUserIds = new Set(courseProgress.map(p => p.userId));
    users.forEach(u => {
      if (u.enrolledCourseIds?.includes(courseId) && !enrolledUserIds.has(u.id)) {
        enrolledUserIds.add(u.id);
      }
    });

    const entries: RankedLearner[] = [];

    enrolledUserIds.forEach(userId => {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const progress = courseProgress.find(p => p.userId === userId) || {
        courseId,
        userId,
        enrolledDate: user.createdAt || '2026-02-01',
        completedLessonIds: [],
        certificateIssued: false,
        totalWatchSeconds: 0
      };

      const completedCount = progress.completedLessonIds.length;
      const isCompleted = progress.certificateIssued ||
        (completedCount >= lessonsCount && !!progress.postTestScore?.passed);
      
      const completionPercent = Math.min(100, Math.round((completedCount / lessonsCount) * 100));

      const postTestAccuracy = progress.postTestScore?.percentage;
      const preTestAccuracy = progress.preTestScore?.percentage;
      const hasPostTest = postTestAccuracy !== undefined;
      const quizAccuracy = postTestAccuracy !== undefined ? postTestAccuracy : (preTestAccuracy || 0);

      // Completion days calculation
      let completionDays = 0;
      if (isCompleted && progress.certificateDate && progress.enrolledDate) {
        const start = new Date(progress.enrolledDate).getTime();
        const end = new Date(progress.certificateDate).getTime();
        const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
        completionDays = isNaN(diffDays) ? 2 : diffDays;
      } else if (isCompleted) {
        // Fallback realistic based on watch seconds
        completionDays = Math.max(1, Math.ceil((progress.totalWatchSeconds || 3600) / 3600));
      } else {
        // For in-progress, days since enrollment
        const start = new Date(progress.enrolledDate || '2026-02-15').getTime();
        const now = new Date('2026-03-15').getTime();
        completionDays = Math.max(1, Math.round((now - start) / (1000 * 60 * 60 * 24)));
      }

      const watchMinutes = Math.round((progress.totalWatchSeconds || 0) / 60);

      // Speed Points & Text
      let formattedSpeed = '';
      let speedPoints = 0;
      if (isCompleted) {
        if (completionDays === 1) {
          formattedSpeed = '1 วัน (รวดเร็วมาก)';
          speedPoints = 98;
        } else if (completionDays <= 3) {
          formattedSpeed = `${completionDays} วัน`;
          speedPoints = 94 - ((completionDays - 1) * 4);
        } else if (completionDays <= 7) {
          formattedSpeed = `${completionDays} วัน`;
          speedPoints = 84 - ((completionDays - 3) * 3);
        } else {
          formattedSpeed = `${completionDays} วัน`;
          speedPoints = Math.max(45, 72 - ((completionDays - 7) * 2));
        }
      } else {
        formattedSpeed = `กำลังเรียน (${completedCount}/${lessonsCount} บท)`;
        speedPoints = Math.round((completedCount / lessonsCount) * 40);
      }

      // Composite Score:
      // When completed: (Quiz Accuracy * 70%) + (Speed Score * 30%) + (Score Growth Bonus up to 3 pts)
      // When in progress: (Completed Lessons Ratio * 45) + (Pre-test * 20%)
      let compositeScore = 0;
      if (isCompleted) {
        const growthBonus = (postTestAccuracy && preTestAccuracy && postTestAccuracy > preTestAccuracy)
          ? Math.min(3, ((postTestAccuracy - preTestAccuracy) * 0.05))
          : 0;
        compositeScore = Math.round(((quizAccuracy * 0.70) + (speedPoints * 0.30) + growthBonus) * 10) / 10;
      } else {
        compositeScore = Math.round(((completedCount / lessonsCount) * 40 + (preTestAccuracy ? preTestAccuracy * 0.15 : 0)) * 10) / 10;
      }

      entries.push({
        rank: 0, // Will be set after sorting
        user,
        progress,
        isCurrentUser: user.id === currentUser.id,
        isCompleted,
        completedLessonsCount: completedCount,
        totalLessonsCount: lessonsCount,
        completionPercent,
        quizAccuracy,
        preTestAccuracy,
        postTestAccuracy,
        hasPostTest,
        completionDays,
        watchMinutes,
        formattedSpeed,
        compositeScore,
        speedPoints
      });
    });

    // 2. Sort based on selected sortOption
    entries.sort((a, b) => {
      // Completed students always rank above non-completed
      if (a.isCompleted && !b.isCompleted) return -1;
      if (!a.isCompleted && b.isCompleted) return 1;

      if (sortOption === 'accuracy') {
        // 1. Highest quiz accuracy
        if (b.quizAccuracy !== a.quizAccuracy) {
          return b.quizAccuracy - a.quizAccuracy;
        }
        // 2. Faster completion time (fewer days)
        if (a.completionDays !== b.completionDays) {
          return a.completionDays - b.completionDays;
        }
        return b.compositeScore - a.compositeScore;
      } else if (sortOption === 'speed') {
        // 1. Completion days ascending (fastest first)
        if (a.isCompleted && b.isCompleted) {
          if (a.completionDays !== b.completionDays) {
            return a.completionDays - b.completionDays;
          }
        }
        // 2. Higher accuracy
        if (b.quizAccuracy !== a.quizAccuracy) {
          return b.quizAccuracy - a.quizAccuracy;
        }
        return b.compositeScore - a.compositeScore;
      } else {
        // 'overall' composite score
        if (b.compositeScore !== a.compositeScore) {
          return b.compositeScore - a.compositeScore;
        }
        if (b.quizAccuracy !== a.quizAccuracy) {
          return b.quizAccuracy - a.quizAccuracy;
        }
        return a.completionDays - b.completionDays;
      }
    });

    // Assign 1-indexed ranks
    return entries.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
  }, [courseId, lessonsCount, progressList, users, currentUser.id, sortOption]);

  // Current user's entry
  const currentUserEntry = rankedLearners.find(l => l.isCurrentUser);

  // Filtered entries for search
  const filteredLearners = useMemo(() => {
    if (!searchQuery.trim()) return rankedLearners;
    const q = searchQuery.toLowerCase().trim();
    return rankedLearners.filter(
      l =>
        l.user.name.toLowerCase().includes(q) ||
        l.user.email.toLowerCase().includes(q) ||
        (l.user.department && l.user.department.toLowerCase().includes(q))
    );
  }, [rankedLearners, searchQuery]);

  // Top 3 Podium
  const top1 = rankedLearners[0];
  const top2 = rankedLearners[1];
  const top3 = rankedLearners[2];

  // Course Aggregates
  const totalEnrolled = rankedLearners.length;
  const completedCount = rankedLearners.filter(l => l.isCompleted).length;
  const completionRate = totalEnrolled > 0 ? Math.round((completedCount / totalEnrolled) * 100) : 0;
  
  const completedLearners = rankedLearners.filter(l => l.isCompleted && l.hasPostTest);
  const avgPostTest = completedLearners.length > 0
    ? Math.round(completedLearners.reduce((acc, curr) => acc + curr.quizAccuracy, 0) / completedLearners.length)
    : 0;

  const fastestLearner = completedLearners.length > 0
    ? [...completedLearners].sort((a, b) => a.completionDays - b.completionDays)[0]
    : undefined;

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 mb-1">
              <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
              <span>อันดับผู้เรียนยอดเยี่ยม (Course Leaderboard)</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {courseTitle ? `ตารางผู้นำ: ${courseTitle}` : 'ตารางผู้นำของหลักสูตร'}
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              จัดอันดับผู้เรียนด้วยสูตรคำนวณถ่วงน้ำหนักระหว่าง <span className="font-semibold text-slate-900">ความแม่นยำของแบบทดสอบ (Quiz Accuracy 70%)</span> และ <span className="font-semibold text-slate-900">ความเร็วในการเรียนจบ (Completion Speed 30%)</span>
            </p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="flex items-center gap-2 sm:gap-4 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-5 shrink-0">
            <div className="text-center px-2">
              <p className="text-[10px] text-slate-400 font-medium">ผู้เรียนทั้งหมด</p>
              <p className="text-base font-bold font-mono tabular-nums text-slate-900">{totalEnrolled} คน</p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center px-2">
              <p className="text-[10px] text-slate-400 font-medium">สำเร็จหลักสูตร</p>
              <p className="text-base font-bold font-mono tabular-nums text-emerald-600">{completionRate}%</p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center px-2">
              <p className="text-[10px] text-slate-400 font-medium">ความแม่นยำเฉลี่ย</p>
              <p className="text-base font-bold font-mono tabular-nums text-indigo-600">{avgPostTest}%</p>
            </div>
          </div>
        </div>

        {/* Current User Spotlight Banner */}
        {currentUserEntry ? (
          <div className="mt-5 p-4 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold font-mono text-base shadow-xs shrink-0 ${
                currentUserEntry.rank === 1
                  ? 'bg-amber-400 text-amber-950'
                  : currentUserEntry.rank === 2
                  ? 'bg-slate-300 text-slate-900'
                  : currentUserEntry.rank === 3
                  ? 'bg-amber-700 text-amber-100'
                  : 'bg-indigo-600 text-white'
              }`}>
                #{currentUserEntry.rank}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    ตำแหน่งของคุณ: อันดับที่ {currentUserEntry.rank} จาก {totalEnrolled} ผู้เรียน
                  </span>
                  {currentUserEntry.isCompleted && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      เรียนจบแล้ว
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-600 mt-0.5 font-mono">
                  <span>ความแม่นยำ: <strong className="text-slate-900">{currentUserEntry.quizAccuracy}%</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>ความเร็ว: <strong className="text-slate-900">{currentUserEntry.formattedSpeed}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>คะแนนรวม: <strong className="text-indigo-600">{currentUserEntry.compositeScore}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {!currentUserEntry.isCompleted ? (
                <button
                  onClick={() => {
                    if (currentUserEntry.completedLessonsCount < lessonsCount && onStartLesson) {
                      const firstIncomplete = course?.lessons.find(
                        l => !currentUserEntry.progress.completedLessonIds.includes(l.id)
                      );
                      const targetId = firstIncomplete?.id || course?.lessons[0]?.id;
                      if (targetId) onStartLesson(targetId);
                    } else if (onOpenPostTest) {
                      onOpenPostTest();
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    {currentUserEntry.completedLessonsCount < lessonsCount ? 'เรียนต่อเพื่อไต่อันดับ' : 'ทำ Post-test สู่ Top 3'}
                  </span>
                </button>
              ) : currentUserEntry.rank <= 3 ? (
                <div className="text-xs font-bold text-amber-700 flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>คุณอยู่ใน Top 3 ยอดเยี่ยมมาก!</span>
                </div>
              ) : (
                <div className="text-xs text-slate-500 font-medium">
                  {currentUserEntry.quizAccuracy < 100 && onOpenPostTest ? (
                    <button
                      onClick={onOpenPostTest}
                      className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                    >
                      สอบ Post-test ใหม่ให้ได้ 100%
                    </button>
                  ) : (
                    <span>รักษามาตรฐานอันดับของคุณ</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-5 p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>คุณยังไม่ได้ลงทะเบียนหลักสูตรนี้ ลงทะเบียนเพื่อเข้าร่วมแข่งขันบนตารางผู้นำ!</span>
            </div>
          </div>
        )}
      </div>

      {/* Podium Visual for Top 3 (Responsive 3 Cards Layout) */}
      {rankedLearners.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
          {/* #2 Silver (Left) */}
          {top2 && (
            <div className="order-2 md:order-1 bg-white rounded-2xl border border-slate-300/90 p-5 shadow-xs relative flex flex-col items-center text-center hover:border-slate-400 transition-all">
              <div className="absolute -top-3.5 px-3 py-0.5 rounded-full bg-slate-700 text-white text-[11px] font-bold font-mono tracking-wider shadow-xs flex items-center gap-1">
                <Medal className="w-3.5 h-3.5 text-slate-300" />
                <span>อันดับ 2</span>
              </div>

              <div className="relative mt-2 mb-3">
                <img
                  src={top2.user.avatar}
                  alt={top2.user.name}
                  className="w-16 h-16 rounded-full object-cover border-3 border-slate-300 shadow-sm"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-800">
                  2
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1">
                <span>{top2.user.name}</span>
                {top2.isCurrentUser && <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">(คุณ)</span>}
              </h4>
              <p className="text-[11px] text-slate-500 mb-3">{top2.user.department || 'ผู้เรียน'}</p>

              <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-left">
                <div className="p-2 rounded-lg bg-slate-50">
                  <span className="text-[10px] text-slate-400 block">ความแม่นยำ</span>
                  <span className="text-xs font-mono font-bold text-slate-900 flex items-center gap-1">
                    <Target className="w-3 h-3 text-indigo-600" />
                    {top2.quizAccuracy}%
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50">
                  <span className="text-[10px] text-slate-400 block">ระยะเวลาจบ</span>
                  <span className="text-xs font-mono font-bold text-slate-900 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-600" />
                    {top2.completionDays} วัน
                  </span>
                </div>
              </div>

              <div className="mt-3 w-full py-1.5 rounded-lg bg-slate-100 text-center">
                <span className="text-[11px] text-slate-500">คะแนนสะสม: </span>
                <span className="text-xs font-mono font-bold text-slate-900">{top2.compositeScore}</span>
              </div>
            </div>
          )}

          {/* #1 Gold (Center, Elevated) */}
          {top1 && (
            <div className="order-1 md:order-2 bg-gradient-to-b from-amber-50/80 via-white to-amber-50/30 rounded-2xl border-2 border-amber-300 p-6 shadow-md relative flex flex-col items-center text-center scale-102 transition-all">
              {/* Crown Badge */}
              <div className="absolute -top-4 px-4 py-1 rounded-full bg-amber-500 text-amber-950 text-xs font-extrabold font-mono tracking-wider shadow-sm flex items-center gap-1.5">
                <Trophy className="w-4 h-4 fill-amber-950 text-amber-950" />
                <span>ชนะเลิศอันดับ 1</span>
              </div>

              <div className="relative mt-2 mb-3">
                <img
                  src={top1.user.avatar}
                  alt={top1.user.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-amber-400 shadow-md ring-4 ring-amber-100"
                />
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-xs font-extrabold text-amber-950 shadow-xs">
                  1
                </div>
              </div>

              <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>{top1.user.name}</span>
                {top1.isCurrentUser && <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">(คุณ)</span>}
              </h4>
              <p className="text-xs text-amber-800 font-medium mb-3">{top1.user.department || 'ผู้เรียนยอดเยี่ยม'}</p>

              <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-amber-100 text-left">
                <div className="p-2.5 rounded-xl bg-amber-100/60 border border-amber-200/60">
                  <span className="text-[10px] text-amber-800 block font-medium">ความแม่นยำ</span>
                  <span className="text-sm font-mono font-extrabold text-amber-950 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-amber-700" />
                    {top1.quizAccuracy}%
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-100/60 border border-amber-200/60">
                  <span className="text-[10px] text-amber-800 block font-medium">ระยะเวลาจบ</span>
                  <span className="text-sm font-mono font-extrabold text-amber-950 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-700" />
                    {top1.completionDays} วัน
                  </span>
                </div>
              </div>

              <div className="mt-3 w-full py-2 rounded-xl bg-amber-500 text-amber-950 text-center font-bold shadow-xs">
                <span className="text-xs">คะแนนผู้นำ: </span>
                <span className="text-sm font-mono font-extrabold">{top1.compositeScore} คะแนน</span>
              </div>
            </div>
          )}

          {/* #3 Bronze (Right) */}
          {top3 && (
            <div className="order-3 md:order-3 bg-white rounded-2xl border border-amber-200/90 p-5 shadow-xs relative flex flex-col items-center text-center hover:border-amber-300 transition-all">
              <div className="absolute -top-3.5 px-3 py-0.5 rounded-full bg-amber-800 text-white text-[11px] font-bold font-mono tracking-wider shadow-xs flex items-center gap-1">
                <Medal className="w-3.5 h-3.5 text-amber-300" />
                <span>อันดับ 3</span>
              </div>

              <div className="relative mt-2 mb-3">
                <img
                  src={top3.user.avatar}
                  alt={top3.user.name}
                  className="w-16 h-16 rounded-full object-cover border-3 border-amber-600 shadow-sm"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-700 text-white border-2 border-white flex items-center justify-center text-[10px] font-bold">
                  3
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1">
                <span>{top3.user.name}</span>
                {top3.isCurrentUser && <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">(คุณ)</span>}
              </h4>
              <p className="text-[11px] text-slate-500 mb-3">{top3.user.department || 'ผู้เรียน'}</p>

              <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-left">
                <div className="p-2 rounded-lg bg-slate-50">
                  <span className="text-[10px] text-slate-400 block">ความแม่นยำ</span>
                  <span className="text-xs font-mono font-bold text-slate-900 flex items-center gap-1">
                    <Target className="w-3 h-3 text-indigo-600" />
                    {top3.quizAccuracy}%
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50">
                  <span className="text-[10px] text-slate-400 block">ระยะเวลาจบ</span>
                  <span className="text-xs font-mono font-bold text-slate-900 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-600" />
                    {top3.completionDays} วัน
                  </span>
                </div>
              </div>

              <div className="mt-3 w-full py-1.5 rounded-lg bg-slate-100 text-center">
                <span className="text-[11px] text-slate-500">คะแนนสะสม: </span>
                <span className="text-xs font-mono font-bold text-slate-900">{top3.compositeScore}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Controls Bar: Sort Segmented Tabs & Search */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Sort Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setSortOption('overall')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                sortOption === 'overall'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>คะแนนรวม (Overall)</span>
            </button>
            <button
              onClick={() => setSortOption('accuracy')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                sortOption === 'accuracy'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-indigo-600" />
              <span>ความแม่นยำ (Accuracy)</span>
            </button>
            <button
              onClick={() => setSortOption('speed')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                sortOption === 'speed'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>เรียนจบเร็วสุด (Speed)</span>
            </button>
          </div>

          {/* Search & Info Help */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาชื่อผู้เรียน หรือ แผนก..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <button
              onClick={() => setShowFormulaModal(true)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="ดูสูตรการคำนวณอันดับ"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table of All Learners */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                <th className="py-3 px-4 w-14 text-center">อันดับ</th>
                <th className="py-3 px-4">ผู้เรียน (Learner)</th>
                <th className="py-3 px-4 text-center">สถานะบทเรียน</th>
                <th className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Target className="w-3.5 h-3.5 text-indigo-500" />
                    <span>ความแม่นยำ (Post-test)</span>
                  </div>
                </th>
                <th className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>เวลาที่ใช้จบ</span>
                  </div>
                </th>
                <th className="py-3 px-4 text-right">คะแนนรวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLearners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    ไม่พบผู้เรียนที่ตรงกับการค้นหา "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredLearners.map(learner => {
                  const isTop1 = learner.rank === 1;
                  const isTop2 = learner.rank === 2;
                  const isTop3 = learner.rank === 3;
                  const isCurrentUser = learner.isCurrentUser;

                  return (
                    <tr
                      key={learner.user.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCurrentUser ? 'bg-indigo-50/40 font-medium' : ''
                      }`}
                    >
                      {/* Rank Column */}
                      <td className="py-3 px-4 text-center">
                        {isTop1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-bold font-mono text-xs shadow-xs">
                            1
                          </span>
                        ) : isTop2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-bold font-mono text-xs shadow-xs">
                            2
                          </span>
                        ) : isTop3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white font-bold font-mono text-xs shadow-xs">
                            3
                          </span>
                        ) : (
                          <span className="font-mono text-xs font-semibold text-slate-500 tabular-nums">
                            #{learner.rank}
                          </span>
                        )}
                      </td>

                      {/* Learner Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={learner.user.avatar}
                            alt={learner.user.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900 text-xs">
                                {learner.user.name}
                              </span>
                              {isCurrentUser && (
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded">
                                  คุณ
                                </span>
                              )}
                              {learner.isCompleted && (
                                <span title="สำเร็จหลักสูตรและได้รับใบประกาศ">
                                  <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block">
                              {learner.user.department || learner.user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Course Completion Progress */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`text-[11px] font-mono font-semibold ${learner.isCompleted ? 'text-emerald-700' : 'text-slate-600'}`}>
                            {learner.completedLessonsCount}/{learner.totalLessonsCount} บทเรียน ({learner.completionPercent}%)
                          </span>
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full ${learner.isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                              style={{ width: `${learner.completionPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Quiz Accuracy */}
                      <td className="py-3 px-4 text-center">
                        {learner.hasPostTest ? (
                          <span className={`inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded ${
                            learner.quizAccuracy === 100
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : learner.quizAccuracy >= 80
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            <Target className="w-3 h-3" />
                            <span>{learner.quizAccuracy}%</span>
                          </span>
                        ) : learner.preTestAccuracy !== undefined ? (
                          <span className="text-[11px] text-slate-400 font-mono" title="ยังไม่ได้สอบ Post-test (แสดงคะแนน Pre-test)">
                            (Pre: {learner.preTestAccuracy}%)
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-300">-</span>
                        )}
                      </td>

                      {/* Speed */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono text-xs text-slate-700">
                          {learner.isCompleted ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                              <Zap className="w-3 h-3 text-amber-500" />
                              <span>{learner.formattedSpeed}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">
                              กำลังเรียน
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Composite Score */}
                      <td className="py-3 px-4 text-right">
                        <span className={`font-mono text-sm font-extrabold tabular-nums ${
                          isTop1 ? 'text-amber-600' : isCurrentUser ? 'text-indigo-600' : 'text-slate-900'
                        }`}>
                          {learner.compositeScore}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formula Explanation Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white m-auto rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>สูตรการจัดอันดับบน Leaderboard</span>
              </h3>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                ปิด
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              ตารางผู้นำคำนวณคะแนนด้วยหลักการประเมินผลการเรียนรู้มาตรฐานสากล:
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                <p className="font-bold text-indigo-900">1. ความแม่นยำของแบบทดสอบ (Quiz Accuracy) - สัดส่วน 70%</p>
                <p className="text-[11px] text-indigo-700 mt-1">
                  คำนวณจากเปอร์เซ็นต์คะแนนแบบทดสอบหลังเรียน (Post-test) สอบได้ 100% เต็ม ได้ 70 คะแนนเต็ม
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                <p className="font-bold text-amber-900">2. ความเร็วในการสำเร็จหลักสูตร (Completion Speed) - สัดส่วน 30%</p>
                <p className="text-[11px] text-amber-800 mt-1">
                  เรียนจบใน 1-2 วัน ได้คะแนนความเร็ว 94-98 คะแนน (แปลงเป็น 28-29.4 คะแนนถ่วงน้ำหนัก) ยิ่งเรียนจบเร็วและเข้าใจ ยิ่งได้คะแนนสูง
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="font-bold text-emerald-900">3. โบนัสพัฒนาการการเรียนรู้ (Learning Growth Bonus)</p>
                <p className="text-[11px] text-emerald-800 mt-1">
                  หากคะแนน Post-test พัฒนาขึ้นจาก Pre-test อย่างก้าวกระโดด จะได้รับโบนัสพิเศษเพิ่มสูงสุด 3 คะแนน
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowFormulaModal(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              เข้าใจแล้ว
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
