import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Award,
  Zap,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  BookOpen,
  CheckCircle2,
  X
} from 'lucide-react';

export interface LearningLevelInfo {
  levelNumber: number;
  titleTh: string;
  titleEn: string;
  minPoints: number;
  maxPoints: number;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  perks: string[];
}

export const LEARNING_LEVELS: LearningLevelInfo[] = [
  {
    levelNumber: 1,
    titleTh: 'ผู้เริ่มต้นใฝ่รู้',
    titleEn: 'Novice Explorer',
    minPoints: 0,
    maxPoints: 800,
    colorClass: 'text-slate-700',
    bgClass: 'bg-slate-100',
    borderClass: 'border-slate-200',
    perks: ['เข้าถึงบทเรียนวิดีโอพื้นฐาน', 'ทำแบบทดสอบ Pre-test และ Post-test']
  },
  {
    levelNumber: 2,
    titleTh: 'ผู้พัฒนาทักษะ',
    titleEn: 'Skill Builder',
    minPoints: 800,
    maxPoints: 1800,
    colorClass: 'text-blue-700',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    perks: ['รับใบประกาศนียบัตรดิจิทัล', 'สิทธิ์ดาวน์โหลดเอกสารสรุปบทเรียน PDF']
  },
  {
    levelNumber: 3,
    titleTh: 'ผู้เชี่ยวชาญระดับสูง',
    titleEn: 'Advanced Scholar',
    minPoints: 1800,
    maxPoints: 3200,
    colorClass: 'text-indigo-700',
    bgClass: 'bg-indigo-50',
    borderClass: 'border-indigo-200',
    perks: ['ใบประกาศนียบัตรประทับตรารับรองเกียรตินิยม', 'เข้าถึงระบบวิเคราะห์คะแนนเชิงลึก']
  },
  {
    levelNumber: 4,
    titleTh: 'ปรมาจารย์แห่งการเรียนรู้',
    titleEn: 'Master Graduate',
    minPoints: 3200,
    maxPoints: 5000,
    colorClass: 'text-amber-700',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    perks: ['ตราประทับเกียรติยศพิเศษ Gold Seal', 'สิทธิ์เป็นผู้ช่วยผู้สอนประจำหลักสูตร']
  }
];

interface StudentProgressProps {
  variant?: 'header' | 'dashboard' | 'compact';
  className?: string;
  onOpenDashboard?: () => void;
}

export const StudentProgress: React.FC<StudentProgressProps> = ({
  variant = 'dashboard',
  className = '',
  onOpenDashboard
}) => {
  const { currentUser, progressList, getUserCertificates } = useApp();
  const [showDetailModal, setShowDetailModal] = useState(false);

  const userCertificates = getUserCertificates();
  const userProgressList = progressList.filter(p => p.userId === currentUser.id);

  // 1. Calculate Completed Courses Count
  const completedCoursesCount = userCertificates.length;

  // 2. Calculate Average Quiz Scores (Post-tests)
  const postTestScores = userProgressList
    .map(p => p.postTestScore?.percentage)
    .filter((score): score is number => typeof score === 'number');

  const avgPostTestScore = postTestScores.length > 0
    ? Math.round(postTestScores.reduce((a, b) => a + b, 0) / postTestScores.length)
    : 0;

  // 3. Total Lessons Completed
  const totalCompletedLessons = userProgressList.reduce(
    (acc, p) => acc + (p.completedLessonIds ? p.completedLessonIds.length : 0),
    0
  );

  // 4. Calculate Comprehensive XP / Learning Points
  // Formula: (completedCourses * 700) + (totalLessons * 120) + (avgQuizScore * 8)
  const totalPoints =
    completedCoursesCount * 700 +
    totalCompletedLessons * 120 +
    Math.round(avgPostTestScore * 8);

  // 5. Determine Current Level
  let currentLevel = LEARNING_LEVELS[0];
  for (let i = LEARNING_LEVELS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEARNING_LEVELS[i].minPoints) {
      currentLevel = LEARNING_LEVELS[i];
      break;
    }
  }

  // 6. Calculate Progress towards Next Level
  const isMaxLevel = currentLevel.levelNumber === LEARNING_LEVELS.length;
  const nextLevel = isMaxLevel ? currentLevel : LEARNING_LEVELS[currentLevel.levelNumber];
  
  const pointsInCurrentLevel = totalPoints - currentLevel.minPoints;
  const levelSpan = currentLevel.maxPoints - currentLevel.minPoints;
  const progressToNextLevel = isMaxLevel
    ? 100
    : Math.min(100, Math.max(0, Math.round((pointsInCurrentLevel / levelSpan) * 100)));

  const pointsNeeded = Math.max(0, currentLevel.maxPoints - totalPoints);

  // HEADER VARIANT
  if (variant === 'header') {
    return (
      <div className={`relative shrink-0 ${className}`}>
        <button
          onClick={() => setShowDetailModal(!showDetailModal)}
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white hover:bg-slate-50 transition-all text-xs shadow-sm group active:scale-95 shrink-0"
          title="ระดับการเรียนรู้ของคุณ คลิกเพื่อดูรายละเอียดคะแนน XP"
        >
          <div className="w-5 h-5 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shadow-sm shrink-0">
            L{currentLevel.levelNumber}
          </div>
          <div className="hidden md:block text-left">
            <span className="font-bold text-slate-800 block leading-tight truncate max-w-[90px]">
              {currentLevel.titleTh}
            </span>
          </div>
          <span className="font-mono font-semibold text-indigo-700 text-[10px] sm:text-[11px] bg-indigo-50 px-1.5 py-0.5 rounded shrink-0">
            {totalPoints.toLocaleString()} XP
          </span>
        </button>

        {/* Header Dropdown Details Modal */}
        {showDetailModal && (
          <div
            className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 text-xs space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-slate-900">ระดับการเรียนรู้ของคุณ</span>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-700 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Level Rank Badge */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Level {currentLevel.levelNumber}</span>
                  <span className="font-bold text-slate-900 text-sm">{currentLevel.titleTh}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-extrabold text-indigo-700 text-sm">
                    {totalPoints.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">XP Points</span>
                </div>
              </div>

              {/* Progress bar to next level */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>ความก้าวหน้าสู่ Level {nextLevel.levelNumber}</span>
                  <span className="font-mono font-bold text-indigo-700">{progressToNextLevel}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-300"
                    style={{ width: `${progressToNextLevel}%` }}
                  />
                </div>
                {!isMaxLevel && (
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    ต้องการอีก {pointsNeeded.toLocaleString()} XP เพื่อเลื่อนระดับ
                  </span>
                )}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">คอร์สที่จบ:</span>
                <span className="font-bold text-slate-800">{completedCoursesCount} คอร์ส</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">คะแนนสอบเฉลี่ย:</span>
                <span className="font-bold text-emerald-700 font-mono">{avgPostTestScore}%</span>
              </div>
            </div>

            {onOpenDashboard && (
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  onOpenDashboard();
                }}
                className="w-full py-2 rounded-xl bg-slate-900 text-white font-semibold text-[11px] hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
              >
                <span>ดูแดชบอร์ดการเรียนรู้ฉบับเต็ม</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // DASHBOARD FULL CARD VARIANT
  return (
    <div className={`bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6 ${className}`}>
      {/* Header of the component */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          {/* Zero-Pill Unboxed Metadata */}
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 tracking-wider">
            <span className="uppercase font-mono">ระบบวัดระดับความสำเร็จ</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Student Learning Mastery Tier</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
            ระดับการเรียนรู้และความเชี่ยวชาญ (Learning Level)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            คำนวณจากจำนวนคอร์สที่จบ คะแนนแบบทดสอบ และเวลาที่ใช้เรียนสะสม
          </p>
        </div>

        {/* Level Rank Badge */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-slate-900 to-indigo-950 text-white px-4 py-2.5 rounded-2xl shadow-sm self-start sm:self-auto">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-extrabold text-sm shadow">
            L{currentLevel.levelNumber}
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-indigo-300 block leading-tight">
              Level {currentLevel.levelNumber} · {currentLevel.titleEn}
            </span>
            <span className="text-sm font-bold text-white block">
              {currentLevel.titleTh}
            </span>
          </div>
        </div>
      </div>

      {/* Progress to Next Level Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">คะแนนสะสมปัจจุบัน:</span>
            <span className="font-mono font-extrabold text-indigo-700 text-sm">
              {totalPoints.toLocaleString()} XP
            </span>
          </div>
          <span className="font-mono text-slate-500">
            {isMaxLevel ? (
              <span className="text-amber-600 font-bold">ระดับสูงสุดแล้ว (Max Level)</span>
            ) : (
              `เป้าหมาย Level ${nextLevel.levelNumber} (${currentLevel.maxPoints.toLocaleString()} XP)`
            )}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 via-blue-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progressToNextLevel}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>ความก้าวหน้า {progressToNextLevel}%</span>
          {!isMaxLevel && (
            <span>ต้องการอีก <strong className="text-slate-700 font-mono">{pointsNeeded.toLocaleString()} XP</strong> เพื่อเลื่อนระดับ</span>
          )}
        </div>
      </div>

      {/* 3 Metric Pillars Driving the Level */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>คอร์สที่สำเร็จการศึกษา</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
            {completedCoursesCount} <span className="text-xs font-normal text-slate-500">คอร์ส</span>
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">+700 XP ต่อคอร์สที่จบ</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>คะแนนสอบเฉลี่ย (Post-test)</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono tabular-nums">
            {avgPostTestScore > 0 ? `${avgPostTestScore}%` : '-'}
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">คำนวณจากทุกบททดสอบ</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>บทเรียนที่เรียนจบแล้ว</span>
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
            {totalCompletedLessons} <span className="text-xs font-normal text-slate-500">บท</span>
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">+120 XP ต่อบทเรียน</span>
        </div>
      </div>

      {/* Current Level Perks */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/70 via-slate-50 to-indigo-50/40 border border-indigo-100 space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>สิทธิพิเศษและเกียรติบัตรที่ปลดล็อคใน Level {currentLevel.levelNumber}:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
          {currentLevel.perks.map((perk, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{perk}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
