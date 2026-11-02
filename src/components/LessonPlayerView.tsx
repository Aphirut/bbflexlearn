import React, { useState, useEffect } from 'react';
import { Course, Lesson, Certificate, Quiz } from '../types';
import { useApp } from '../context/AppContext';
import { VideoPlayer } from './VideoPlayer';
import { MyNotesSidebar } from './MyNotesSidebar';
import { getQuizzesAfterUnit } from '../utils/lessonQuizzes';
import { LessonQuizGateModal } from './LessonQuizGateModal';
import {
  ArrowLeft,
  CheckCircle,
  PlayCircle,
  Award,
  ClipboardCheck,
  ChevronRight,
  ShieldCheck,
  Lock,
  Bookmark,
  ListOrdered
} from 'lucide-react';

interface LessonPlayerViewProps {
  course: Course;
  initialLessonId?: string;
  onBack: () => void;
  onOpenPreTest: () => void;
  onOpenPostTest: () => void;
  onOpenCertificate: (certificate: Certificate) => void;
  onActiveLessonChange?: (lessonId: string) => void;
}

export const LessonPlayerView: React.FC<LessonPlayerViewProps> = ({
  course,
  initialLessonId,
  onBack,
  onOpenPreTest,
  onOpenPostTest,
  onOpenCertificate,
  onActiveLessonChange
}) => {
  const {
    currentUser,
    progressList,
    markLessonComplete,
    updateLastAccessedLesson,
    calculateCourseProgressPercentage,
    getCertificate,
    getUserNotes
  } = useApp();

  const progress = progressList.find(p => p.courseId === course.id && p.userId === currentUser.id);
  const completedLessons = progress?.completedLessonIds || [];

  // นับความก้าวหน้าเป็นรายวิดีโอ (บทหลัก + บทเรียนย่อยทุกตอน) เพื่อให้แถบขยับทุกครั้งที่ข้ามไปวิดีโอถัดไป
  const videoUnits: string[] = course.lessons.flatMap(l => [
    l.id,
    ...(l.subLessons || []).map(s => `${l.id}::${s.id}`),
  ]);
  const finishedStorageKey = `bbflex-finished-units:${currentUser.id}:${course.id}`;
  const [finishedUnits, setFinishedUnits] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(finishedStorageKey) || '[]'); } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem(finishedStorageKey, JSON.stringify(finishedUnits)); } catch { /* ignore */ }
  }, [finishedStorageKey, finishedUnits]);

  const finishedSet = new Set(finishedUnits);
  // บทหลักที่เรียนจบแล้ว = ทุกวิดีโอในบทนั้นจบแล้ว
  course.lessons.forEach(l => {
    if (completedLessons.includes(l.id)) {
      finishedSet.add(l.id);
      (l.subLessons || []).forEach(s => finishedSet.add(`${l.id}::${s.id}`));
    }
  });
  const finishedCount = videoUnits.filter(u => finishedSet.has(u)).length;
  const progressPercent = videoUnits.length === 0
    ? calculateCourseProgressPercentage(course.id)
    : Math.min(100, Math.round((finishedCount / videoUnits.length) * 100));


  // จุดที่เรียนค้างไว้ (บท + คลิปย่อย) จำไว้กลับมาเรียนต่อได้ ไม่ต้องเริ่มใหม่
  const resumeUnitKey = `bbflex-resume-unit:${currentUser.id}:${course.id}`;
  const savedResumeUnit = (() => {
    try {
      const v = JSON.parse(localStorage.getItem(resumeUnitKey) || 'null');
      return v && course.lessons.some(l => l.id === v.lessonId) ? v as { lessonId: string; subLessonId: string | null } : null;
    } catch { return null; }
  })();

  // Active Lesson State
  const [activeLessonId, setActiveLessonId] = useState<string>(() => {
    return initialLessonId || savedResumeUnit?.lessonId || progress?.lastAccessedLessonId || course.lessons[0]?.id || '';
  });

  // Playback & Notes State
  const [rightSidebarTab, setRightSidebarTab] = useState<'playlist' | 'notes'>('playlist');
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [seekTimestamp, setSeekTimestamp] = useState<{ timestamp: number; key: number } | null>(null);

  // Notes in profile for this course
  const courseNotes = getUserNotes(course.id);
  const currentLessonNotes = courseNotes.filter(n => n.lessonId === activeLessonId);

  useEffect(() => {
    if (activeLessonId) {
      updateLastAccessedLesson(course.id, activeLessonId);
      onActiveLessonChange?.(activeLessonId);
    }
  }, [activeLessonId, course.id]);

  const activeLessonIndex = course.lessons.findIndex(l => l.id === activeLessonId);
  const currentLesson: Lesson = course.lessons[activeLessonIndex] || course.lessons[0];
  const isCurrentCompleted = completedLessons.includes(currentLesson.id);

  // บทเรียนย่อยที่กำลังเล่น (null = กำลังเล่นบทเรียนหลัก) — กู้จากจุดที่ค้างไว้เฉพาะตอนเปิดครั้งแรก
  const [activeSubLessonId, setActiveSubLessonId] = useState<string | null>(() =>
    savedResumeUnit && savedResumeUnit.lessonId === activeLessonId ? savedResumeUnit.subLessonId : null);
  const firstLessonChangeRef = React.useRef(true);
  useEffect(() => {
    if (firstLessonChangeRef.current) { firstLessonChangeRef.current = false; return; }
    setActiveSubLessonId(null);
  }, [activeLessonId]);
  useEffect(() => {
    try { localStorage.setItem(resumeUnitKey, JSON.stringify({ lessonId: activeLessonId, subLessonId: activeSubLessonId })); } catch { /* ignore */ }
  }, [resumeUnitKey, activeLessonId, activeSubLessonId]);
  const activeSubLesson = currentLesson?.subLessons?.find(s => s.id === activeSubLessonId) || null;
  const playingLesson: Lesson = activeSubLesson
    ? {
        ...currentLesson,
        title: activeSubLesson.title,
        description: activeSubLesson.description || currentLesson.description,
        durationMinutes: activeSubLesson.durationMinutes,
        videoDurationSeconds: activeSubLesson.videoDurationSeconds,
        videoUrl: activeSubLesson.videoUrl || currentLesson.videoUrl,
        coverImageUrl: activeSubLesson.coverImageUrl || currentLesson.coverImageUrl,
      }
    : currentLesson;

  // --- ด่านแบบทดสอบประจำบท: ถ้ามีและยังไม่ผ่าน ต้องทำผ่านก่อนไปวิดีโอถัดไป ---
  const passedStorageKey = `bbflex-passed-quizzes:${currentUser.id}:${course.id}`;
  const [passedQuizIds, setPassedQuizIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(passedStorageKey) || '[]'); } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem(passedStorageKey, JSON.stringify(passedQuizIds)); } catch { /* ignore */ }
  }, [passedStorageKey, passedQuizIds]);
  // คิวแบบทดสอบที่ต้องทำให้ผ่านก่อนไปหน่วยถัดไป (ตอนนี้ + ประจำบทถ้าเป็นตอนสุดท้าย)
  const [gateQueue, setGateQueue] = useState<Quiz[]>([]);
  const pendingAdvanceRef = React.useRef<(() => void) | null>(null);

  const pendingUnitQuizzes = getQuizzesAfterUnit(currentLesson, activeSubLessonId)
    .filter(q => !passedQuizIds.includes(q.id));

  /** ถ้ามีแบบทดสอบค้างอยู่ ให้เปิดทำทีละชุดก่อน แล้วค่อยทำ advance ต่อเมื่อผ่านทั้งหมด */
  const withQuizGate = (advance: () => void) => {
    if (pendingUnitQuizzes.length === 0) {
      advance();
      return;
    }
    pendingAdvanceRef.current = advance;
    setGateQueue(pendingUnitQuizzes);
  };

  const handleQuizPassed = (quiz: Quiz) => {
    setPassedQuizIds(prev => (prev.includes(quiz.id) ? prev : [...prev, quiz.id]));
    const rest = gateQueue.filter(q => q.id !== quiz.id);
    if (rest.length > 0) {
      setGateQueue(rest);
      return;
    }
    setGateQueue([]);
    const advance = pendingAdvanceRef.current;
    pendingAdvanceRef.current = null;
    advance?.();
  };

  const advanceToNextLesson = () => {
    if (activeLessonIndex < course.lessons.length - 1) {
      setActiveLessonId(course.lessons[activeLessonIndex + 1].id);
    } else if (allLessonsFinished) {
      onOpenPostTest();
    }
  };

  const handleNextLesson = () => withQuizGate(advanceToNextLesson);

  // วิดีโอจบ -> (ผ่านแบบทดสอบก่อน ถ้ามี) -> ไปตอนถัดไปทันที (บทเรียนย่อยถัดไปก่อน หมดแล้วจึงไปบทถัดไป)
  const handleAutoNext = () => withQuizGate(advanceAutoNext);
  const advanceAutoNext = () => {
    // บันทึกวิดีโอปัจจุบันว่าจบแล้ว -> progressPercent คำนวณใหม่และแถบขยับทันทีเมื่อข้ามบท
    const unitKey = activeSubLesson ? `${currentLesson.id}::${activeSubLesson.id}` : currentLesson.id;
    setFinishedUnits(prev => (prev.includes(unitKey) ? prev : [...prev, unitKey]));
    const subs = currentLesson.subLessons || [];
    if (activeSubLesson) {
      const subIdx = subs.findIndex(s => s.id === activeSubLesson.id);
      if (subIdx >= 0 && subIdx < subs.length - 1) {
        setActiveSubLessonId(subs[subIdx + 1].id);
        return;
      }
      // หมดบทเรียนย่อยแล้ว = จบบทนี้
      if (!isCurrentCompleted) markLessonComplete(course.id, currentLesson.id);
      if (activeLessonIndex < course.lessons.length - 1) {
        setActiveLessonId(course.lessons[activeLessonIndex + 1].id);
      }
      return;
    }
    if (subs.length > 0) {
      setActiveSubLessonId(subs[0].id);
      return;
    }
    if (!isCurrentCompleted) markLessonComplete(course.id, currentLesson.id);
    if (activeLessonIndex < course.lessons.length - 1) {
      setActiveLessonId(course.lessons[activeLessonIndex + 1].id);
    }
  };

  const handleSeekToNoteTimestamp = (timestampSeconds: number, targetLessonId?: string) => {
    if (targetLessonId && targetLessonId !== activeLessonId) {
      setActiveLessonId(targetLessonId);
    }
    setSeekTimestamp({ timestamp: timestampSeconds, key: Date.now() });
  };

  const allLessonsFinished = completedLessons.length >= course.lessons.length;
  const certificateUnlocked = !!progress?.certificateIssued;
  const userCert = progress?.certificateId ? getCertificate(progress.certificateId) : undefined;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Header Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับไปยังหน้ารายละเอียดหลักสูตร</span>
        </button>

        <div className="flex items-center gap-3 text-xs">
          {/* Quick Tab Toggle in Header */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200">
            <button
              onClick={() => setRightSidebarTab('playlist')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                rightSidebarTab === 'playlist'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListOrdered className="w-3 h-3" />
              <span>สารบัญ</span>
            </button>
            <button
              onClick={() => setRightSidebarTab('notes')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                rightSidebarTab === 'notes'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bookmark className="w-3 h-3" />
              <span>บันทึกของฉัน</span>
              <span className="px-1 py-0.2 rounded-full bg-indigo-100 text-indigo-800 text-[9px] font-bold font-mono">
                {courseNotes.length}
              </span>
            </button>
          </div>

          <span className="text-slate-300">|</span>

          <span className="text-slate-500 hidden sm:inline">ความก้าวหน้า:</span>
          <div className="w-24 sm:w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${allLessonsFinished ? 'bg-emerald-500' : 'bg-indigo-600'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="font-mono font-bold text-indigo-700">{progressPercent}%</span>
          <span className="text-slate-400 hidden md:inline">({finishedCount}/{videoUnits.length} วิดีโอ)</span>
        </div>
      </div>

      {/* Two-Zone Layout (Left: Video Player; Right: Sidebar - Playlist or My Notes) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Video Player */}
        <div className="lg:col-span-8">
          <VideoPlayer
            key={`${playingLesson.videoUrl}::${playingLesson.title}`}
            lesson={playingLesson}
            courseId={course.id}
            courseTitle={course.title}
            isCompleted={isCurrentCompleted}
            onToggleComplete={() => withQuizGate(() => markLessonComplete(course.id, currentLesson.id))}
            onNextLesson={activeLessonIndex < course.lessons.length - 1 ? handleNextLesson : undefined}
            onVideoEnded={handleAutoNext}
            onTimeUpdate={(t, d) => {
              setCurrentVideoTime(t);
              setVideoDuration(d);
            }}
            seekTimestamp={seekTimestamp}
            subLessonId={activeSubLessonId}
            onOpenNotesSidebar={() => setRightSidebarTab('notes')}
          />
        </div>

        {/* Right 4 Cols: Sidebar (Switchable between Playlist & My Notes) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Sidebar Top Tab Selector */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100/90 border border-slate-200 text-xs shadow-2xs">
            <button
              onClick={() => setRightSidebarTab('playlist')}
              className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                rightSidebarTab === 'playlist'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5 text-indigo-600" />
              <span>สารบัญ & ข้อสอบ</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono">
                {completedLessons.length}/{course.lessons.length}
              </span>
            </button>

            <button
              onClick={() => setRightSidebarTab('notes')}
              className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                rightSidebarTab === 'notes'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
              <span>บันทึกช่วยจำ</span>
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-mono font-bold">
                {courseNotes.length}
              </span>
            </button>
          </div>

          {/* Conditional Rendering: My Notes Sidebar vs Playlist/Exam Deck */}
          {rightSidebarTab === 'notes' ? (
            <MyNotesSidebar
              course={course}
              currentLesson={currentLesson}
              currentVideoTime={currentVideoTime}
              onSeekToTimestamp={handleSeekToNoteTimestamp}
              onSelectLesson={(lessonId) => setActiveLessonId(lessonId)}
              onClose={() => setRightSidebarTab('playlist')}
            />
          ) : (
            <div className="space-y-4">
          {/* Certificate Banner if issued */}
          {certificateUnlocked && userCert && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Award className="w-6 h-6 text-amber-200 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-100">
                    สำเร็จการศึกษาแล้ว!
                  </span>
                  <p className="text-xs font-bold leading-tight">ใบประกาศนียบัตรของคุณพร้อมแล้ว</p>
                </div>
              </div>
              <button
                onClick={() => onOpenCertificate(userCert)}
                className="px-3 py-1.5 rounded-lg bg-white text-slate-900 text-xs font-bold hover:bg-amber-50 transition-colors whitespace-nowrap shadow"
              >
                ดูใบประกาศ
              </button>
            </div>
          )}

          {/* Pre-test & Post-test Step Strip */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              ขั้นตอนการวัดผลการเรียนรู้:
            </h3>

            {/* Pre-test Item */}
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="font-semibold text-slate-800 block">แบบทดสอบก่อนเรียน</span>
                  <span className="text-[10px] text-slate-500">
                    {progress?.preTestScore
                      ? `สอบแล้ว: ${progress.preTestScore.score}/${progress.preTestScore.total} (${progress.preTestScore.percentage}%)`
                      : 'ยังไม่ได้ทำแบบทดสอบ'}
                  </span>
                </div>
              </div>
              <button
                onClick={onOpenPreTest}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
              >
                {progress?.preTestScore ? 'ดูผลสอบ' : 'ทำแบบทดสอบ'}
              </button>
            </div>

            {/* Post-test Item */}
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs">
              <div className="flex items-center gap-2">
                {allLessonsFinished ? (
                  <Award className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Lock className="w-4 h-4 text-slate-400" />
                )}
                <div>
                  <span className="font-semibold text-slate-800 block">แบบทดสอบหลังเรียน</span>
                  <span className="text-[10px] text-slate-500">
                    {progress?.postTestScore
                      ? `คะแนน: ${progress.postTestScore.percentage}% (${progress.postTestScore.passed ? 'ผ่าน' : 'ไม่ผ่าน'})`
                      : allLessonsFinished
                      ? 'ปลดล็อคแล้ว (เกณฑ์ผ่าน 80%)'
                      : 'ต้องเรียนครบทุกบทก่อน'}
                  </span>
                </div>
              </div>
              <button
                onClick={onOpenPostTest}
                disabled={!allLessonsFinished && !progress?.postTestScore}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none"
              >
                {progress?.postTestScore ? 'ดูผล/สอบใหม่' : 'เริ่มทำข้อสอบ'}
              </button>
            </div>
          </div>

          {/* Playlist Container */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                บทเรียนทั้งหมด ({completedLessons.length}/{course.lessons.length})
              </h3>
              <span className="text-[11px] font-mono text-slate-400">{course.durationHours} ชม.</span>
            </div>

            <div className="space-y-1.5 max-h-[460px] overflow-y-auto">
              {course.lessons.map((lesson, idx) => {
                const isSelected = lesson.id === activeLessonId;
                const isDone = completedLessons.includes(lesson.id);

                return (
                  <div key={lesson.id}>
                  <button
                    onClick={() => { setActiveLessonId(lesson.id); setActiveSubLessonId(null); }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                        : 'border-slate-100 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {lesson.coverImageUrl && (
                        <img src={lesson.coverImageUrl} alt="" className="h-9 w-14 shrink-0 rounded-md object-cover" />
                      )}
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-700'
                          : isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : idx + 1}
                      </div>

                      <div className="truncate">
                        <span className={`text-xs block truncate ${isSelected ? 'font-bold text-indigo-950' : 'text-slate-800'}`}>
                          {lesson.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {lesson.durationMinutes} นาที
                        </span>
                      </div>
                    </div>

                    {isSelected && !activeSubLesson && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                    )}
                  </button>

                  {!!lesson.subLessons?.length && (
                    <div className="ml-9 mt-1 space-y-1 border-l-2 border-slate-100 pl-2">
                      {lesson.subLessons.map((sub, sIdx) => {
                        const isSubActive = isSelected && activeSubLessonId === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => { setActiveLessonId(lesson.id); setActiveSubLessonId(sub.id); }}
                            className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-2 text-xs transition ${
                              isSubActive ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <PlayCircle className="w-3.5 h-3.5 shrink-0" />
                            <span className="flex-1 truncate">{idx + 1}.{sIdx + 1} {sub.title}</span>
                            <span className={`text-[10px] font-mono ${isSubActive ? 'text-indigo-100' : 'text-slate-400'}`}>{sub.durationMinutes} นาที</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  </div>
                );
              })}
            </div>
          </div>
            </div>
          )}
        </div>
      </div>
      {gateQueue.length > 0 && (
        <LessonQuizGateModal
          key={gateQueue[0].id}
          quiz={gateQueue[0]}
          lessonTitle={playingLesson.title}
          onPassed={() => handleQuizPassed(gateQueue[0])}
          onClose={() => { setGateQueue([]); pendingAdvanceRef.current = null; }}
        />
      )}
    </div>
  );
};
