import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Course } from '../types';
import {
  KeyRound,
  X,
  Search,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Clock,
  Sparkles,
  AlertCircle,
  Copy
} from 'lucide-react';

interface JoinClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinSuccess: (course: Course) => void;
}

export const JoinClassroomModal: React.FC<JoinClassroomModalProps> = ({
  isOpen,
  onClose,
  onJoinSuccess
}) => {
  const { courses, currentUser, enrollInCourse, joinByCode } = useApp();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const trimmedCode = code.trim().toUpperCase();

  // Find matching course by classroomCode, id, or slug
  const matchedCourse = courses.find(c => {
    if (!trimmedCode) return false;
    const cCode = (c.classroomCode || '').toUpperCase();
    const cId = c.id.toUpperCase();
    const cSlug = c.slug.toUpperCase();
    return cCode === trimmedCode || cId === trimmedCode || cSlug === trimmedCode;
  });

  const isEnrolled = matchedCourse ? currentUser.enrolledCourseIds.includes(matchedCourse.id) : false;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!trimmedCode) {
      setError('กรุณากรอกรหัสห้องเรียน');
      return;
    }

    let target = matchedCourse;
    if (!target) {
      try {
        target = (await joinByCode(trimmedCode)) || undefined;
      } catch {
        setError('ไม่สามารถตรวจสอบรหัสห้องเรียนได้ กรุณาลองใหม่');
        return;
      }
    }

    if (!target) {
      setError('ไม่พบห้องเรียนที่ตรงกับรหัสดังกล่าว กรุณาตรวจสอบรหัสห้องเรียนจากอาจารย์ผู้สอนอีกครั้ง');
      return;
    }

    // Auto-enroll if not yet enrolled
    if (!currentUser.enrolledCourseIds.includes(target.id)) {
      enrollInCourse(target.id);
    }

    onJoinSuccess(target);
    onClose();
    setCode('');
  };

  const handleQuickCode = (quickCode: string) => {
    setCode(quickCode);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white m-auto rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                เข้าร่วมห้องเรียนด้วยรหัส (Classroom Code)
              </h3>
              <p className="text-xs text-slate-500">
                ใส่รหัสห้องเรียนที่ได้รับจากอาจารย์ผู้สอน เพื่อเข้าสู่ห้องเรียนทันที
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              setCode('');
              setError(null);
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              รหัสห้องเรียน (Classroom Code)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="เช่น BB-CLS-101"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-mono font-bold tracking-wider text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 uppercase transition"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </div>

          {/* Quick Demo Codes for Testing */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500">
              หรือเลือกลองรหัสห้องเรียนตัวอย่าง (Click to test):
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { code: 'BB-CLS-101', name: 'Web Dev' },
                { code: 'BB-CLS-102', name: 'UX/UI' },
                { code: 'BB-CLS-103', name: 'AI & Data' },
                { code: 'BB-CLS-104', name: 'Marketing' }
              ].map(item => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleQuickCode(item.code)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition ${
                    trimmedCode === item.code
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {item.code} <span className="font-sans font-normal text-[10px] opacity-75">({item.name})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Match Card */}
          {matchedCourse && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-white px-2 py-0.5 rounded shadow-2xs border border-indigo-200">
                  {matchedCourse.categoryNameTh}
                </span>
                {isEnrolled ? (
                  <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ลงทะเบียนแล้ว</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>พร้อมเข้าร่วม</span>
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {matchedCourse.title}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                  {matchedCourse.subtitle}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-indigo-100 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <img
                    src={matchedCourse.instructor.avatar}
                    alt={matchedCourse.instructor.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span className="font-medium text-slate-700">{matchedCourse.instructor.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>{matchedCourse.lessons.length} บทเรียน</span>
                  <span>·</span>
                  <span>{matchedCourse.durationHours} ชม.</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                setCode('');
                setError(null);
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!trimmedCode}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
                trimmedCode
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>{isEnrolled ? 'เข้าห้องเรียนต่อ' : 'เข้าร่วมห้องเรียนทันที'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
