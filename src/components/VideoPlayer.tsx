import React, { useState, useRef, useEffect } from 'react';
import { Course, Lesson, UserNote } from '../types';
import { useApp } from '../context/AppContext';
import { api, getToken } from '../api';
import { resolveVideoSource, supportsEmbedEndedEvent, embedAutoplaySrc } from '../utils/embedPlayback';
import { buildEmbedSeekCommands } from '../utils/resumePlayback';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  CheckCircle,
  FileText,
  Clock,
  Plus,
  Trash2,
  Video,
  Bookmark,
  Sparkles
} from 'lucide-react';

interface VideoPlayerProps {
  lesson: Lesson;
  courseId: string;
  courseTitle: string;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onNextLesson?: () => void;
  /** เรียกเมื่อวิดีโอเล่นจบ (ถ้าไม่ส่งมา จะ mark complete + ไปบทถัดไปเอง) */
  onVideoEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  seekTimestamp?: { timestamp: number; key: number } | null;
  onOpenNotesSidebar?: () => void;
  subLessonId?: string | null;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  lesson,
  courseId,
  courseTitle,
  isCompleted,
  onToggleComplete,
  onNextLesson,
  onVideoEnded,
  onTimeUpdate,
  seekTimestamp,
  onOpenNotesSidebar,
  subLessonId
}) => {
  const { currentUser, addUserNote, deleteUserNote, getUserNotes, updateCourse } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const endedFiredRef = useRef(false);
  // Anti-cheat: track actually-watched position; cannot seek past it
  const watchKey = `bbflex-watched:${courseId}:${lesson.id}:${lesson.videoUrl}`;
  const savedWatch = (() => { try { return JSON.parse(localStorage.getItem(watchKey) || '{"max":0,"secs":0}'); } catch { return { max: 0, secs: 0 }; } })();
  const maxWatchedRef = useRef<number>(savedWatch.max || 0);
  const watchedSecsRef = useRef<number>(savedWatch.secs || 0);
  const lastTimeRef = useRef(0);
  const embedStartRef = useRef(Date.now());
  const [maxWatched, setMaxWatched] = useState(maxWatchedRef.current);
  const [watchedSecs, setWatchedSecs] = useState(watchedSecsRef.current);
  const [embedElapsed, setEmbedElapsed] = useState(savedWatch.secs || 0);
  const [embedDuration, setEmbedDuration] = useState(0); // ความยาวจริงจากตัวเล่น embed (วินาที) ถ้ารู้
  const embedPlayingRef = useRef(false);
  const embedWatchedRef = useRef<number>(savedWatch.secs || 0);
  const lastEmbedPosRef = useRef(0);
  const resumeAppliedRef = useRef(false);
  const embedDurationRef = useRef(0);
  const [seekWarning, setSeekWarning] = useState('');
  const [resumedFrom, setResumedFrom] = useState(0);
  const freeSeek = isCompleted;
  const REQUIRED_RATIO = 0.9;
  const persistWatch = () => { try { localStorage.setItem(watchKey, JSON.stringify({ max: maxWatchedRef.current, secs: watchedSecsRef.current })); } catch { /* ignore */ } };
  const warnSeek = () => setSeekWarning('ไม่สามารถลากข้ามไปส่วนที่ยังไม่ได้ดูได้ กรุณาดูตามลำดับ (ลากย้อนกลับได้เสมอ)');
  const clampSeek = (t: number) => freeSeek ? t : Math.min(t, maxWatchedRef.current);
  const watchedEnough = (dur: number) => freeSeek || (dur > 0 && watchedSecsRef.current >= dur * REQUIRED_RATIO && maxWatchedRef.current >= dur * REQUIRED_RATIO);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(lesson.durationMinutes * 60);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'notes'>('overview');

  // User notes from profile
  const profileNotes = getUserNotes(courseId, lesson.id);
  const [newNoteText, setNewNoteText] = useState('');

  // Handle external seek requests from MyNotesSidebar or timestamp clicks
  useEffect(() => {
    if (seekTimestamp && typeof seekTimestamp.timestamp === 'number') {
      const targetSec = clampSeek(seekTimestamp.timestamp);
      if (targetSec < seekTimestamp.timestamp) warnSeek();
      setCurrentTime(targetSec);
      if (videoRef.current) {
        videoRef.current.currentTime = targetSec;
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(true));
      }
    }
  }, [seekTimestamp]);

  const videoSource = resolveVideoSource(lesson.videoUrl);
  const isEmbed = videoSource.kind === 'embed';

  // วัดความยาวจริงของคลิปแล้วให้ server บันทึกลงบทเรียน (server รวมทุกคลิปเป็นความยาวบทให้เอง)
  const reportedDurRef = useRef('');
  const reportActualDuration = (sec: number) => {
    if (!Number.isFinite(sec) || sec <= 0) return;
    const rounded = Math.round(sec);
    const key = `${lesson.id}:${subLessonId || ''}:${lesson.videoUrl}:${rounded}`;
    if (reportedDurRef.current === key) return;
    if (lesson.videoDurationSeconds && Math.abs(lesson.videoDurationSeconds - rounded) <= 1) return;
    reportedDurRef.current = key;
    api<{ course: Course }>('POST', `/api/courses/${courseId}/lesson-duration`, {
      lessonId: lesson.id, subLessonId: subLessonId || null, durationSeconds: rounded,
    }).then(r => { if (r.course) updateCourse(r.course); }).catch(() => { reportedDurRef.current = ''; });
  };

  // Embed: นับเฉพาะช่วงที่กำลังเล่นจริงเท่านั้น (สถานะมาจาก player API ด้านล่าง) หยุดพัก/ยังไม่กดเล่น = ไม่นับ
  useEffect(() => {
    if (!isEmbed) return;
    embedPlayingRef.current = false;
    const t = setInterval(() => {
      if (!embedPlayingRef.current) return;
      embedWatchedRef.current += 0.5;
      setEmbedElapsed(embedWatchedRef.current);
    }, 500);
    return () => clearInterval(t);
  }, [isEmbed, lesson.videoUrl]);

  // Embed (YouTube/Vimeo): สั่งตัวเล่นข้ามไปจุดที่ค้างไว้
  // iframe ข้ามโดเมนมักยังไม่พร้อมรับคำสั่งในครั้งแรก จึงลองซ้ำเมื่อ iframe โหลดเสร็จ + อีก 2 ครั้ง
  const pendingEmbedResumeRef = useRef(0);
  const embedResumeTimers = useRef<number[]>([]);
  const attemptEmbedResume = (pos: number) => {
    const cmds = buildEmbedSeekCommands(videoSource.src, pos);
    if (!cmds) return;
    try {
      const win = iframeRef.current?.contentWindow;
      if (win) for (const c of cmds) win.postMessage(c.message, c.target);
    } catch { /* iframe ยังไม่พร้อม — รอรอบถัดไป */ }
    setResumedFrom(Math.floor(pos));
  };
  const scheduleEmbedResume = (pos: number) => {
    pendingEmbedResumeRef.current = pos;
    attemptEmbedResume(pos);
    embedResumeTimers.current.forEach(t => clearTimeout(t));
    embedResumeTimers.current = [2000, 4000].map(ms => window.setTimeout(() => {
      if (pendingEmbedResumeRef.current === pos) attemptEmbedResume(pos);
    }, ms));
  };

  // เรียนต่อจากวินาทีที่ค้างไว้ (ใช้จุดไกลสุดที่เคยดูถึง — ลากเลยจุดนี้ไม่ได้อยู่แล้ว จึงไม่ขัดระบบกันโกง)
  const tryResumeSeek = () => {
    if (resumeAppliedRef.current || freeSeek) return;
    const v = videoRef.current;
    if (!v || !v.duration || !Number.isFinite(v.duration)) return;
    const pos = maxWatchedRef.current;
    if (pos > 5 && pos < v.duration - 10) {
      resumeAppliedRef.current = true;
      v.currentTime = pos;
      lastTimeRef.current = pos;
      setCurrentTime(pos);
      setResumedFrom(Math.floor(pos));
    } else if (pos > 5) resumeAppliedRef.current = true;
  };

  // รายงานเวลาดูให้ server ยืนยันทุก 5 วิ (server cap ตามเวลาจริง ปั้นเลขเองไม่ได้) + โหลดค่าที่ server ยืนยันแล้วมา resume
  useEffect(() => {
    let cancelled = false;
    api<{ watch: { lessonId: string; videoUrl?: string; maxWatched: number; watchedSecs: number }[] }>('GET', `/api/watch/${courseId}`)
      .then(r => {
        if (cancelled) return;
        const mine = (r.watch || []).filter(w => w.lessonId === lesson.id);
        const rec = mine.find(w => w.videoUrl && w.videoUrl === lesson.videoUrl)
          || (mine.length === 1 ? mine[0] : mine.sort((a, b) => b.maxWatched - a.maxWatched)[0]);
        // Embed แสดง % จากตัวสะสมเฉพาะของมัน ต้องกู้ค่านี้กลับมาด้วย ไม่งั้นเปิดใหม่จะเริ่ม 0%
        if (rec && isEmbed && (rec.watchedSecs || rec.maxWatched) > embedWatchedRef.current) {
          embedWatchedRef.current = Math.max(rec.watchedSecs || 0, Math.min(rec.maxWatched, rec.watchedSecs || rec.maxWatched));
          setEmbedElapsed(embedWatchedRef.current);
        }
        if (rec && rec.maxWatched > maxWatchedRef.current) {
          maxWatchedRef.current = rec.maxWatched;
          watchedSecsRef.current = Math.max(watchedSecsRef.current, rec.watchedSecs || 0);
          setMaxWatched(maxWatchedRef.current); setWatchedSecs(watchedSecsRef.current);
          tryResumeSeek();
          // Embed: สั่งตัวเล่นข้ามไปจุดที่ค้างไว้ (ไม่เกินจุดที่เคยดูถึง จึงไม่เป็นการลากโกง)
          // iframe มักยังโหลดไม่เสร็จตอนนี้ — scheduleEmbedResume จะลองซ้ำเมื่อ iframe พร้อม
          if (isEmbed && rec.maxWatched > 5 && !resumeAppliedRef.current) {
            resumeAppliedRef.current = true;
            scheduleEmbedResume(rec.maxWatched);
          }
        }
      }).catch(() => { /* ออฟไลน์: ใช้ค่า local ไปก่อน server จะตรวจตอนบันทึก progress อยู่ดี */ });
    const timer = setInterval(() => {
      // Embed: ซิงก์ตัวสะสมลง local ด้วย จะได้ไม่หายตอนปิดหน้า/เซิร์ฟเวอร์ยังไม่ตอบ
      if (isEmbed) {
        watchedSecsRef.current = Math.max(watchedSecsRef.current, embedWatchedRef.current);
        maxWatchedRef.current = Math.max(maxWatchedRef.current, embedWatchedRef.current);
        persistWatch();
      }
      const dur = isEmbed ? (embedDurationRef.current || lesson.durationMinutes * 60) : (videoRef.current?.duration || duration);
      const payload = isEmbed
        ? { lessonId: lesson.id, videoUrl: lesson.videoUrl, duration: dur, maxWatched: Math.min(dur, embedWatchedRef.current), watchedSecs: Math.min(dur, embedWatchedRef.current) }
        : { lessonId: lesson.id, videoUrl: lesson.videoUrl, duration: dur, maxWatched: maxWatchedRef.current, watchedSecs: watchedSecsRef.current };
      api('POST', `/api/watch/${courseId}`, payload).catch(() => { /* ignore */ });
    }, 5000);
    return () => { cancelled = true; clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lesson.id, lesson.videoUrl, isEmbed]);

  // Reset states on lesson change
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setHasError(false);
    endedFiredRef.current = false;
    resumeAppliedRef.current = false;
    pendingEmbedResumeRef.current = 0;
    embedResumeTimers.current.forEach(t => clearTimeout(t));
    embedResumeTimers.current = [];
    lastTimeRef.current = 0;
    embedStartRef.current = Date.now();
    setSeekWarning('');
    return () => { embedResumeTimers.current.forEach(t => clearTimeout(t)); };
  }, [lesson.id, lesson.videoUrl]);

  // ปิดเบราว์เซอร์/ปิดแท็บแล้วกลับมา: เซฟตำแหน่งล่าสุดทันที (keepalive ส่งถึง server แม้หน้า unload)
  // ไม่งั้นความคืบหน้า ~5 วิสุดท้ายหาย แล้วเปิดใหม่จะถอยหลัง
  useEffect(() => {
    const flush = () => {
      if (isEmbed) {
        watchedSecsRef.current = Math.max(watchedSecsRef.current, embedWatchedRef.current);
        maxWatchedRef.current = Math.max(maxWatchedRef.current, embedWatchedRef.current);
      }
      persistWatch();
      try {
        const seen = isEmbed ? embedWatchedRef.current : maxWatchedRef.current;
        if (!(seen > 0)) return;
        const dur = isEmbed
          ? (embedDurationRef.current || lesson.durationMinutes * 60)
          : (videoRef.current?.duration && Number.isFinite(videoRef.current.duration) ? videoRef.current.duration : duration);
        const token = getToken();
        fetch(`/api/watch/${courseId}`, {
          method: 'POST',
          keepalive: true,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            lessonId: lesson.id,
            videoUrl: lesson.videoUrl,
            duration: dur,
            maxWatched: Math.min(dur || seen, seen),
            watchedSecs: isEmbed ? Math.min(dur || seen, seen) : watchedSecsRef.current,
          }),
        }).catch(() => { /* เน็ตหลุด: ค่าใน localStorage ยัง resume ต่อได้ */ });
      } catch { /* ignore */ }
    };
    const onHidden = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onHidden);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lesson.id, lesson.videoUrl, isEmbed]);

  const handleVideoEnded = async () => {
    if (endedFiredRef.current) return;
    if (resolveVideoSource(lesson.videoUrl).kind === 'embed') {
      const minRealSecs = (embedDurationRef.current || lesson.durationMinutes * 60) * 0.45;
      if (!freeSeek && embedWatchedRef.current < minRealSecs) {
        setSeekWarning('วิดีโอนี้ยังดูไม่ครบ ระบบยังไม่นับว่าเรียนจบ (ห้ามลากข้ามไปท้ายคลิป)');
        return;
      }
    } else if (!watchedEnough(duration) && !(duration > 0 && maxWatchedRef.current >= duration * REQUIRED_RATIO)) {
      // ดูต่อเนื่องจนถึงท้ายจริง (seek ถูก clamp ไว้ ข้ามมาไม่ได้) ถือว่าจบ แม้ตัวสะสมเวลาจะ lag เล็กน้อย
      setSeekWarning('ยังดูวิดีโอไม่ถึง 90% ระบบยังไม่นับว่าเรียนจบ');
      if (videoRef.current) videoRef.current.currentTime = maxWatchedRef.current;
      return;
    }
    endedFiredRef.current = true;
    // ส่ง heartbeat สุดท้ายให้ server ยืนยันก่อนติ๊กจบ ไม่งั้น progress อาจถูกส่งไปก่อนและโดน server ตัด
    try {
      const dur = isEmbed ? (embedDurationRef.current || lesson.durationMinutes * 60) : (videoRef.current?.duration || duration);
      const seen = isEmbed ? embedWatchedRef.current : maxWatchedRef.current;
      await api('POST', `/api/watch/${courseId}`, {
        lessonId: lesson.id, videoUrl: lesson.videoUrl, duration: dur,
        maxWatched: Math.min(dur || seen, seen), watchedSecs: isEmbed ? Math.min(dur, embedWatchedRef.current) : watchedSecsRef.current,
      });
    } catch { /* ออฟไลน์: server จะตรวจซ้ำตอน sync progress อยู่ดี */ }
    setIsPlaying(false);
    if (onVideoEnded) {
      onVideoEnded();
    } else {
      if (!isCompleted) onToggleComplete();
      onNextLesson?.();
    }
  };

  // เปิดบทเรียนแล้วเล่นทันที (คลิกบทเอง / ปุ่มบทถัดไป / จบแล้วไปต่อ — component ถูก remount ด้วย key=videoUrl)
  // ถ้าเบราว์เซอร์บล็อก autoplay (ยังไม่มีปฏิสัมพันธ์กับเว็บ) ก็แค่ค้างเป็นหยุดชั่วคราว ผู้ใช้กดเล่นเองได้
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [lesson.videoUrl]);

  // รับ event "เล่นจบ" จาก YouTube / Vimeo embed
  // (Drive preview / Dailymotion ไม่มี player API ให้ดัก — ใช้ตัวจับเวลาสำรองใน effect ถัดไป)
  useEffect(() => {
    if (!isEmbed) return;
    if (!supportsEmbedEndedEvent(videoSource.src)) return;
    const isYouTube = videoSource.src.includes('youtube');
    const isVimeo = videoSource.src.includes('vimeo');
    if (!isYouTube && !isVimeo) return;
    const subscribe = () => {
      const win = iframeRef.current?.contentWindow;
      if (!win) return;
      if (isYouTube) win.postMessage(JSON.stringify({ event: 'listening' }), '*');
      if (isVimeo) {
        for (const ev of ['finish', 'play', 'pause', 'timeupdate']) win.postMessage(JSON.stringify({ method: 'addEventListener', value: ev }), '*');
      }
    };
    const timer = setTimeout(subscribe, 800);
    const resub = setInterval(subscribe, 2000); // iframe โหลดช้า/รีโหลด ต้องสมัครซ้ำ ไม่งั้นไม่ได้รับสถานะเล่น/จบ
    const onMessage = (e: MessageEvent) => {
      if (iframeRef.current && e.source !== iframeRef.current.contentWindow) return;
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (isYouTube && data?.event === 'onStateChange') {
          if (data.info === 1) embedPlayingRef.current = true;
          if (data.info === 2 || data.info === 0) embedPlayingRef.current = false;
          if (data.info === 0) handleVideoEnded();
        }
        if (isYouTube && data?.event === 'infoDelivery' && typeof data?.info?.playerState === 'number') {
          if (data.info.playerState === 1) embedPlayingRef.current = true;
          if (data.info.playerState === 2 || data.info.playerState === 0) embedPlayingRef.current = false;
          if (data.info.playerState === 0) handleVideoEnded();
        }
        const reportedEmbedDur = isYouTube ? data?.info?.duration : isVimeo ? data?.data?.duration : undefined;
        if (typeof reportedEmbedDur === 'number' && reportedEmbedDur > 0) { embedDurationRef.current = reportedEmbedDur; setEmbedDuration(reportedEmbedDur); reportActualDuration(reportedEmbedDur); }
        // ตำแหน่งที่ขยับไปข้างหน้าอย่างต่อเนื่อง = กำลังดูจริง (สำรองกรณี event สถานะมาไม่ถึง)
        const embedPos = isYouTube ? data?.info?.currentTime : isVimeo ? data?.data?.seconds : undefined;
        if (typeof embedPos === 'number' && embedPos > 0) {
          const d = embedPos - lastEmbedPosRef.current;
          if (d > 0 && d <= 3) {
            embedWatchedRef.current = Math.min(embedDurationRef.current || lesson.durationMinutes * 60, embedWatchedRef.current + d);
            setEmbedElapsed(embedWatchedRef.current);
            embedPlayingRef.current = true;
          }
          lastEmbedPosRef.current = embedPos;
        }
        if (isVimeo && data?.event === 'play') embedPlayingRef.current = true;
        if (isVimeo && data?.event === 'pause') embedPlayingRef.current = false;
        if (isVimeo && data?.event === 'timeupdate' && typeof data?.data?.seconds === 'number') {
          embedWatchedRef.current = Math.max(embedWatchedRef.current, data.data.seconds);
          setEmbedElapsed(embedWatchedRef.current);
        }
        if (isVimeo && data?.event === 'finish') { embedPlayingRef.current = false; handleVideoEnded(); }
      } catch { /* ไม่ใช่ JSON จาก embed */ }
    };
    window.addEventListener('message', onMessage);
    return () => { clearTimeout(timer); clearInterval(resub); window.removeEventListener('message', onMessage); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmbed, videoSource.src, isCompleted, onVideoEnded, onNextLesson]);

  // สำรองสำหรับ embed ที่ไม่มี event "เล่นจบ" (Google Drive preview / Dailymotion):
  // iframe ข้ามโดเมนและไม่มี player API จึงดักจบจริงไม่ได้ — นับเวลาเฉพาะตอนแท็บมองเห็นอยู่
  // แล้วจบอัตโนมัติ (mark complete + ไปบทถัดไป) เมื่อดูครบความยาวบท เหมือนเจ้าอื่น
  useEffect(() => {
    if (!isEmbed) return;
    if (supportsEmbedEndedEvent(videoSource.src)) return;
    const total = embedDurationRef.current || lesson.durationMinutes * 60;
    if (!(total > 0)) return;
    const t = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      if (endedFiredRef.current) return;
      embedWatchedRef.current = Math.min(total, embedWatchedRef.current + 1);
      setEmbedElapsed(embedWatchedRef.current);
      if (embedWatchedRef.current >= total) handleVideoEnded();
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmbed, videoSource.src, isCompleted, onVideoEnded, onNextLesson]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {
        // Fallback for autoplay policy or error
        setIsPlaying(true);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const delta = cur - lastTimeRef.current;
      if (!freeSeek) {
        const maxDelta = Math.max(2, (videoRef.current.playbackRate || 1) * 2);
        if (delta > 0 && delta <= maxDelta) {
          watchedSecsRef.current += delta;
          if (cur > maxWatchedRef.current) maxWatchedRef.current = cur;
          setWatchedSecs(watchedSecsRef.current); setMaxWatched(maxWatchedRef.current); persistWatch();
        } else if (delta > 2 && cur > maxWatchedRef.current + 2) {
          videoRef.current.currentTime = maxWatchedRef.current; warnSeek(); lastTimeRef.current = maxWatchedRef.current; return;
        }
      }
      lastTimeRef.current = cur;
      setCurrentTime(cur);
      const dur = (videoRef.current.duration && !isNaN(videoRef.current.duration))
        ? videoRef.current.duration
        : lesson.durationMinutes * 60;
      setDuration(dur);
      if (onTimeUpdate) {
        onTimeUpdate(cur, dur);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = Number(e.target.value);
    const time = clampSeek(raw);
    if (time < raw) warnSeek();
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    if (onTimeUpdate) {
      onTimeUpdate(time, duration);
    }
  };

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      const nextTime = clampSeek(Math.min(duration, Math.max(0, videoRef.current.currentTime + seconds)));
      if (seconds > 0 && nextTime < videoRef.current.currentTime + seconds) warnSeek();
      videoRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
      if (onTimeUpdate) {
        onTimeUpdate(nextTime, duration);
      }
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMute = !isMuted;
      videoRef.current.muted = nextMute;
      setIsMuted(nextMute);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  // % ที่แสดง: อิงจุดไกลสุดที่ดูถึงจริง (ไฟล์) หรือเวลาจริงบนหน้า (embed) — ขยับทุก 0.1%
  const watchedBasis = isEmbed ? embedElapsed : Math.max(maxWatched, watchedSecs);
  const displayDuration = isEmbed && embedDuration > 0 ? embedDuration : duration;
  const watchedPercent = displayDuration > 0 ? Math.min(100, (watchedBasis / displayDuration) * 100) : 0;
  const watchedPercentLabel = watchedPercent >= 100 ? '100' : watchedPercent.toFixed(1);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    addUserNote({
      courseId,
      courseTitle,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      timestampSeconds: Math.floor(currentTime),
      text: newNoteText.trim(),
      tags: ['💡 สรุปใจความ']
    });
    setNewNoteText('');
  };

  const handleDeleteNote = (id: string) => {
    deleteUserNote(id);
  };

  const handleJumpToTimestamp = (rawSeconds: number) => {
    const seconds = clampSeek(rawSeconds);
    if (seconds < rawSeconds) warnSeek();
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      setCurrentTime(seconds);
      if (onTimeUpdate) {
        onTimeUpdate(seconds, duration);
      }
    }
  };

  return (
    <div className="flex flex-col rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
      {/* Video Screen Container */}
      <div className="relative aspect-video bg-slate-950 w-full overflow-hidden flex items-center justify-center group">
        {isEmbed ? (
          <iframe
            ref={iframeRef}
            key={videoSource.src}
            src={embedAutoplaySrc(videoSource.src)}
            onLoad={() => { if (pendingEmbedResumeRef.current > 5) attemptEmbedResume(pendingEmbedResumeRef.current); }}
            title={lesson.title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : !hasError && videoSource.src ? (
          <video
            ref={videoRef}
            src={videoSource.src}
            className="w-full h-full object-contain"
            onLoadedMetadata={() => { const d = videoRef.current?.duration; if (d && Number.isFinite(d)) { setDuration(d); reportActualDuration(d); tryResumeSeek(); } }}
            onTimeUpdate={handleTimeUpdate}
            onPause={persistWatch}
            onEnded={handleVideoEnded}
            onSeeking={() => { if (!freeSeek && videoRef.current && videoRef.current.currentTime > maxWatchedRef.current + 2) { videoRef.current.currentTime = maxWatchedRef.current; warnSeek(); } }}
            onError={() => setHasError(true)}
            playsInline
            preload="metadata"
          />
        ) : (
          /* High-Fidelity Animated Interactive Playback Fallback */
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-16 h-16 rounded-full bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center mb-4 text-indigo-400">
              <Video className="w-8 h-8" />
            </div>
            <p className="text-base font-semibold text-slate-100">{lesson.title}</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md">{lesson.description}</p>
            <div className="mt-4 px-3 py-1 rounded bg-indigo-500/20 text-indigo-300 text-xs font-mono">
              เล่นวิดีโอจาก URL นี้ไม่ได้ — ไฟล์อาจถูกลบ, ไม่เปิดสิทธิ์เข้าถึง หรือไม่ใช่ไฟล์วิดีโอโดยตรง
            </div>
            {lesson.videoUrl && (
              <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-3 text-xs text-indigo-300 underline hover:text-indigo-200">
                เปิดวิดีโอต้นฉบับ ↗
              </a>
            )}
          </div>
        )}

        {/* Video Overlay Control Bar (เฉพาะไฟล์วิดีโอตรง — embed ใช้ปุ่มควบคุมของต้นทาง) */}
        {!isEmbed && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 sm:p-4 text-white opacity-95 transition-opacity">
          {/* Progress Timeline Slider */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-mono text-slate-300 shrink-0">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
            />
            <span className="text-[11px] font-mono text-slate-400 shrink-0">
              {formatTime(duration)}
            </span>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-2 text-xs">
            {/* Left Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={togglePlay}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                aria-label={isPlaying ? 'หยุดวิดีโอ' : 'เล่นวิดีโอ'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <button
                onClick={() => handleSkip(-10)}
                className="p-1.5 hover:text-indigo-400 transition-colors text-slate-300 hidden sm:block"
                title="ย้อนหลัง 10 วินาที"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleSkip(10)}
                className="p-1.5 hover:text-indigo-400 transition-colors text-slate-300 hidden sm:block"
                title="ข้ามไปข้างหน้า 10 วินาที"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleMute}
                  className="p-1.5 hover:text-indigo-400 transition-colors text-slate-300"
                  aria-label={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-14 sm:w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Playback speed selector */}
              <div className="flex items-center gap-1 bg-black/40 rounded-md p-0.5 border border-white/10">
                {[0.75, 1, 1.25, 1.5, 2].map(rate => (
                  <button
                    key={rate}
                    onClick={() => handleRateChange(rate)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      playbackRate === rate ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {/* Fullscreen */}
              <button
                onClick={handleFullscreen}
                className="p-1.5 hover:text-indigo-400 transition-colors text-slate-300"
                title="เต็มหน้าจอ"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        )}
      </div>

      {seekWarning && (<div className="px-4 py-2 text-xs font-medium text-amber-800 bg-amber-50 border-b border-amber-200" role="alert">{seekWarning}</div>)}
      {resumedFrom > 5 && !seekWarning && (<div className="px-4 py-2 text-xs font-medium text-indigo-800 bg-indigo-50 border-b border-indigo-200">เรียนต่อจากจุดที่ค้างไว้ ({formatTime(resumedFrom)}) — ส่วนที่ดูแล้วไม่ต้องดูซ้ำ</div>)}
      {/* Lesson Details & Actions Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs text-slate-400 font-medium">{courseTitle}</span>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
            {lesson.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenNotesSidebar && (
            <button
              onClick={onOpenNotesSidebar}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shadow-2xs"
              title="เปิดแถบด้านข้าง 'บันทึกช่วยจำ' (My Notes)"
            >
              <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
              <span>บันทึกช่วยจำ</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-mono font-bold">
                {profileNotes.length}
              </span>
            </button>
          )}

          {!isCompleted && (
            <div className="flex items-center gap-2" aria-live="polite">
              <div className="w-20 sm:w-28 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-[width] duration-500" style={{ width: `${watchedPercent}%` }} />
              </div>
              <span className="text-[11px] font-mono text-slate-500">{watchedPercentLabel}%</span>
            </div>
          )}

          <button
            onClick={onToggleComplete}
            disabled={!isCompleted && !watchedEnough(duration)}
            title={!isCompleted && !watchedEnough(duration) ? 'ต้องดูวิดีโอให้ถึง 90% ก่อน' : undefined}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              isCompleted
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isCompleted ? 'เรียนจบบทนี้แล้ว ✓' : watchedEnough(duration) ? 'ทำเครื่องหมายว่าเรียนจบ' : `ดูแล้ว ${watchedPercentLabel}% (ต้องถึง 90%)`}</span>
          </button>

          {onNextLesson && (
            <button
              onClick={onNextLesson}
              className="px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white transition-colors"
            >
              บทถัดไป
            </button>
          )}
        </div>
      </div>

      {/* Content Tabs: Overview vs Interactive Notes */}
      <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-100 bg-slate-50/50">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>รายละเอียดบทเรียน</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'notes'
              ? 'border-indigo-600 text-indigo-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>บันทึกช่วยจำในบทนี้ ({profileNotes.length})</span>
        </button>
      </div>

      {/* Tab Body */}
      <div className="p-5">
        {activeTab === 'overview' ? (
          <div className="space-y-4 text-xs sm:text-sm text-slate-600">
            <p className="leading-relaxed text-slate-700">{lesson.description}</p>

            {/* Key takeaways */}
            {lesson.keyTakeaways && lesson.keyTakeaways.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2">
                <span className="font-semibold text-slate-900 block text-xs">
                  📌 ประเด็นสำคัญในบทนี้ (Key Takeaways):
                </span>
                <ul className="space-y-1 list-disc list-inside text-xs text-slate-600">
                  {lesson.keyTakeaways.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Attached Resources */}
            {lesson.resources && lesson.resources.length > 0 && (
              <div className="pt-2">
                <span className="font-semibold text-slate-800 block text-xs mb-2">
                  📎 เอกสารและโค้ดตัวอย่างประกอบบทเรียน:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {lesson.resources.map(res => {
                    const local = res.url.startsWith('/');
                    const fileName = `${res.title.replace(/[\\/:*?"<>|]/g, '').trim() || 'document'}.pdf`;
                    return (
                    <a
                      key={res.id}
                      href={res.url}
                      {...(local
                        ? { download: fileName }
                        : { target: '_blank', rel: 'noopener noreferrer' })}
                      title={`ดาวน์โหลด ${res.title} (PDF)`}
                      className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors flex items-center justify-between text-xs group"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="font-medium text-slate-800 truncate group-hover:text-indigo-700">{res.title}</span>
                      </div>
                      <span className="text-[10px] text-indigo-600 font-semibold shrink-0 ml-2">
                        {res.size ? `${res.size} · ดาวน์โหลด` : 'ดาวน์โหลด'}
                      </span>
                    </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Interactive Notes Tab */
          <div className="space-y-4">
            {/* Note input form */}
            <form onSubmit={handleAddNote} className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>บันทึกความเข้าใจ ณ เวลาปัจจุบัน ({formatTime(currentTime)})</span>
                {onOpenNotesSidebar && (
                  <button
                    type="button"
                    onClick={onOpenNotesSidebar}
                    className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <span>เปิดแถบด้านข้างเต็มรูปแบบ ↗</span>
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="พิมพ์ข้อความสรุปหรือคำถามที่ต้องการบันทึก..."
                  value={newNoteText}
                  onChange={e => setNewNoteText(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600 bg-slate-50/50"
                />
                <button
                  type="submit"
                  disabled={!newNoteText.trim()}
                  className="flex items-center gap-1 px-3.5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>บันทึก</span>
                </button>
              </div>
            </form>

            {/* Notes List */}
            <div className="space-y-2 pt-2">
              {profileNotes.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  ยังไม่มีบันทึกช่วยจำในบทนี้ สามารถพิมพ์บันทึกพร้อมประทับเวลาได้ทันที หรือใช้แถบด้านข้าง My Notes
                </div>
              ) : (
                profileNotes.map(note => (
                  <div
                    key={note.id}
                    className="p-3 rounded-lg border border-slate-200/80 bg-white flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleJumpToTimestamp(note.timestampSeconds)}
                          className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[10px] font-semibold hover:bg-indigo-100 transition-colors"
                          title="คลิกเพื่อกระโดดไปยังเวลานี้ในวิดีโอ"
                        >
                          ▶ {formatTime(note.timestampSeconds)}
                        </button>
                        <span className="text-[10px] text-slate-400">{note.createdAt}</span>
                      </div>
                      <p className="text-slate-800 leading-relaxed">{note.text}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                      title="ลบบันทึก"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
