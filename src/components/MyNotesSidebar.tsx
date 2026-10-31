import React, { useState, useMemo } from 'react';
import { Course, Lesson, UserNote } from '../types';
import { useApp } from '../context/AppContext';
import {
  FileEdit,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Download,
  Copy,
  Tag,
  Bookmark,
  Sparkles,
  ExternalLink,
  Filter,
  CheckCircle2
} from 'lucide-react';

interface MyNotesSidebarProps {
  course: Course;
  currentLesson: Lesson;
  currentVideoTime: number;
  onSeekToTimestamp: (timestampSeconds: number, lessonId?: string) => void;
  onSelectLesson?: (lessonId: string) => void;
  onClose?: () => void;
}

const PRESET_TAGS = [
  '💡 สรุปใจความ',
  '❓ ข้อสงสัย',
  '⚠️ จุดระวัง',
  '🚀 นำไปใช้',
  '📌 ทบทวน'
];

export const MyNotesSidebar: React.FC<MyNotesSidebarProps> = ({
  course,
  currentLesson,
  currentVideoTime,
  onSeekToTimestamp,
  onSelectLesson,
  onClose
}) => {
  const { currentUser, addUserNote, updateUserNote, deleteUserNote } = useApp();

  // State
  const [filterScope, setFilterScope] = useState<'current_lesson' | 'all_lessons'>('current_lesson');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'timestamp' | 'newest'>('timestamp');

  // New Note State
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['💡 สรุปใจความ']);
  const [customTimestamp, setCustomTimestamp] = useState<number | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Edit Note State
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingTags, setEditingTags] = useState<string[]>([]);

  // Get notes for current user
  const userNotes = currentUser.notes || [];

  // Filter notes belonging to this course
  const courseNotes = useMemo(() => {
    return userNotes.filter(n => n.courseId === course.id);
  }, [userNotes, course.id]);

  // Active timestamp to use for note creation (either captured or live)
  const activeTimestamp = customTimestamp !== null ? customTimestamp : Math.floor(currentVideoTime);

  // Helper format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Add Note Handler
  const handleAddNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newNoteText.trim()) return;

    addUserNote({
      courseId: course.id,
      courseTitle: course.title,
      lessonId: currentLesson.id,
      lessonTitle: currentLesson.title,
      timestampSeconds: activeTimestamp,
      text: newNoteText.trim(),
      tags: selectedTags
    });

    setNewNoteText('');
    setCustomTimestamp(null);
  };

  // Save Edit Handler
  const handleSaveEdit = (noteId: string) => {
    if (!editingText.trim()) return;
    updateUserNote(noteId, editingText.trim(), editingTags);
    setEditingNoteId(null);
    setEditingText('');
    setEditingTags([]);
  };

  // Start Editing
  const handleStartEdit = (note: UserNote) => {
    setEditingNoteId(note.id);
    setEditingText(note.text);
    setEditingTags(note.tags || []);
  };

  // Toggle Tag in creation form
  const togglePresetTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  // Toggle Tag in edit form
  const toggleEditTag = (tag: string) => {
    if (editingTags.includes(tag)) {
      setEditingTags(prev => prev.filter(t => t !== tag));
    } else {
      setEditingTags(prev => [...prev, tag]);
    }
  };

  // Filtered & Sorted Notes
  const displayedNotes = useMemo(() => {
    return courseNotes
      .filter(note => {
        // Scope filter
        if (filterScope === 'current_lesson' && note.lessonId !== currentLesson.id) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchText = note.text.toLowerCase().includes(q);
          const matchLesson = note.lessonTitle.toLowerCase().includes(q);
          const matchTag = note.tags?.some(t => t.toLowerCase().includes(q));
          if (!matchText && !matchLesson && !matchTag) return false;
        }
        // Tag filter
        if (selectedTagFilter) {
          if (!note.tags || !note.tags.includes(selectedTagFilter)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'timestamp') {
          // If in all_lessons mode, group by lesson first then timestamp
          if (filterScope === 'all_lessons' && a.lessonId !== b.lessonId) {
            return a.lessonId.localeCompare(b.lessonId);
          }
          return a.timestampSeconds - b.timestampSeconds;
        }
        // newest
        return b.id.localeCompare(a.id);
      });
  }, [courseNotes, filterScope, currentLesson.id, searchQuery, selectedTagFilter, sortBy]);

  // Counts
  const currentLessonNotesCount = courseNotes.filter(n => n.lessonId === currentLesson.id).length;
  const totalCourseNotesCount = courseNotes.length;

  // Export Notes to Markdown (.md)
  const handleExportMarkdown = () => {
    const notesToExport = filterScope === 'current_lesson'
      ? courseNotes.filter(n => n.lessonId === currentLesson.id)
      : courseNotes;

    if (notesToExport.length === 0) return;

    let md = `# บันทึกการเรียนรู้: ${course.title}\n`;
    md += `> ผู้เรียน: ${currentUser.name} (${currentUser.email})\n`;
    md += `> วันที่ส่งออก: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;
    md += `---\n\n`;

    // Group by lesson
    const grouped: Record<string, UserNote[]> = {};
    notesToExport.forEach(n => {
      if (!grouped[n.lessonTitle]) grouped[n.lessonTitle] = [];
      grouped[n.lessonTitle].push(n);
    });

    Object.entries(grouped).forEach(([lessonTitle, nList]) => {
      md += `## 📚 ${lessonTitle}\n\n`;
      nList.sort((a, b) => a.timestampSeconds - b.timestampSeconds).forEach(n => {
        md += `### ⏱ [${formatTime(n.timestampSeconds)}] - ${n.createdAt}\n`;
        if (n.tags && n.tags.length > 0) {
          md += `**แท็ก:** ${n.tags.join(', ')}\n\n`;
        }
        md += `${n.text}\n\n`;
      });
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BBFlexLearn-Notes-${course.slug || 'course'}.md`;
    link.click();
    URL.revokeObjectURL(url);

    setCopyFeedback('ส่งออกไฟล์ Markdown เรียบร้อย');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  // Copy All Notes to Clipboard
  const handleCopyAll = () => {
    const notesToExport = filterScope === 'current_lesson'
      ? courseNotes.filter(n => n.lessonId === currentLesson.id)
      : courseNotes;

    if (notesToExport.length === 0) return;

    const summary = notesToExport
      .map(n => `[${formatTime(n.timestampSeconds)}] (${n.lessonTitle})\n${n.text}`)
      .join('\n\n');

    navigator.clipboard.writeText(summary);
    setCopyFeedback('คัดลอกบันทึกทั้งหมดลงคลิปบอร์ดแล้ว');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col h-full max-h-[780px]">
      {/* 1. Header Bar */}
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                บันทึกช่วยจำ (My Notes)
              </h3>
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold font-mono">
                {filterScope === 'current_lesson' ? currentLessonNotesCount : totalCourseNotesCount}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate max-w-[210px] sm:max-w-xs">
              ผูกกับโปรไฟล์ของ <span className="font-semibold text-slate-700">{currentUser.name}</span>
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="ปิดแถบด้านข้าง"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. New Note Input Form */}
      <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 space-y-2.5">
        {/* Timestamp Header & Capture Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500">ตำแหน่งวิดีโอ:</span>
            <button
              type="button"
              onClick={() => onSeekToTimestamp(activeTimestamp, currentLesson.id)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-mono text-[11px] font-bold transition-colors"
              title="คลิกเพื่อตรวจสอบตำแหน่งเวลานี้"
            >
              <Clock className="w-3 h-3 text-indigo-600" />
              <span>{formatTime(activeTimestamp)}</span>
            </button>
            {customTimestamp !== null && (
              <button
                type="button"
                onClick={() => setCustomTimestamp(null)}
                className="text-[10px] text-indigo-600 hover:underline"
              >
                (ซิงค์เวลาปัจจุบัน)
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCustomTimestamp(Math.floor(currentVideoTime))}
            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
          >
            <span>ประทับเวลาตอนนี้</span>
          </button>
        </div>

        {/* Note Textarea */}
        <div className="relative">
          <textarea
            rows={isInputFocused || newNoteText ? 3 : 2}
            value={newNoteText}
            onChange={e => setNewNoteText(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onKeyDown={e => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleAddNote();
              }
            }}
            placeholder="พิมพ์ข้อความสรุป ไอเดีย หรือจุดที่ต้องการทบทวน (กด Ctrl+Enter เพื่อบันทึก)..."
            className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none bg-white placeholder-slate-400 transition-all resize-none"
          />
        </div>

        {/* Tag Selection Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-slate-400 flex items-center gap-1 mr-1">
            <Tag className="w-2.5 h-2.5" /> แท็ก:
          </span>
          {PRESET_TAGS.map(tag => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => togglePresetTag(tag)}
                className={`text-[10px] px-2 py-0.5 rounded-md transition-all font-medium ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Submit Button Row */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-slate-400 italic">
            บันทึกจะถูกเก็บในโปรไฟล์อัตโนมัติ
          </span>
          <button
            type="button"
            onClick={() => handleAddNote()}
            disabled={!newNoteText.trim()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>บันทึกโน้ต</span>
          </button>
        </div>
      </div>

      {/* 3. Scope Segmented Tabs & Filters */}
      <div className="p-3 border-b border-slate-100 bg-white space-y-2">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
          <button
            onClick={() => setFilterScope('current_lesson')}
            className={`flex-1 py-1 px-2 rounded-lg text-center font-medium transition-all ${
              filterScope === 'current_lesson'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            บทเรียนนี้ ({currentLessonNotesCount})
          </button>
          <button
            onClick={() => setFilterScope('all_lessons')}
            className={`flex-1 py-1 px-2 rounded-lg text-center font-medium transition-all ${
              filterScope === 'all_lessons'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทุกบทในคอร์ส ({totalCourseNotesCount})
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาข้อความหรือแท็ก..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600 bg-slate-50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort By Toggle */}
          <button
            onClick={() => setSortBy(prev => prev === 'timestamp' ? 'newest' : 'timestamp')}
            className="px-2 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-medium shrink-0"
            title="สลับลำดับการแสดงผล"
          >
            {sortBy === 'timestamp' ? '⏱ เรียงตามเวลา' : '🕒 ล่าสุด'}
          </button>
        </div>

        {/* Feedback message banner if present */}
        {copyFeedback && (
          <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-1.5 animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{copyFeedback}</span>
          </div>
        )}
      </div>

      {/* 4. Notes Scrollable List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[220px]">
        {displayedNotes.length === 0 ? (
          <div className="py-10 text-center px-4 space-y-2">
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-400 mx-auto flex items-center justify-center">
              <FileEdit className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-700">
              {searchQuery
                ? 'ไม่พบบันทึกที่ตรงกับคำค้นหา'
                : filterScope === 'current_lesson'
                ? 'ยังไม่มีบันทึกสำหรับบทเรียนนี้'
                : 'ยังไม่มีบันทึกในคอร์สเรียนนี้'}
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              พิมพ์ข้อความด้านบนและคลิก "บันทึกโน้ต" ระบบจะจดจำจุดเวลาในวิดีโอให้คุณกลับมาทบทวนได้ทันที
            </p>
          </div>
        ) : (
          displayedNotes.map(note => {
            const isEditing = editingNoteId === note.id;
            const isCurrentLesson = note.lessonId === currentLesson.id;
            const isPlayingNear =
              isCurrentLesson &&
              Math.abs(currentVideoTime - note.timestampSeconds) < 6;

            return (
              <div
                key={note.id}
                className={`p-3 rounded-xl border transition-all text-xs space-y-2 ${
                  isPlayingNear
                    ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-200'
                    : 'border-slate-200/90 bg-white hover:border-slate-300'
                }`}
              >
                {/* Note Item Header: Timestamp + Lesson info + Actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Timestamp Pill Jump Button */}
                    <button
                      onClick={() => {
                        if (note.lessonId !== currentLesson.id && onSelectLesson) {
                          onSelectLesson(note.lessonId);
                        }
                        onSeekToTimestamp(note.timestampSeconds, note.lessonId);
                      }}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold transition-all shadow-2xs ${
                        isPlayingNear
                          ? 'bg-indigo-600 text-white'
                          : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60'
                      }`}
                      title="คลิกเพื่อกระโดดไปยังช่วงเวลานี้ในวิดีโอ"
                    >
                      <span>▶</span>
                      <span>{formatTime(note.timestampSeconds)}</span>
                    </button>

                    {/* Lesson Title badge if showing all lessons */}
                    {filterScope === 'all_lessons' && (
                      <button
                        onClick={() => onSelectLesson && onSelectLesson(note.lessonId)}
                        className={`text-[10px] truncate max-w-[140px] px-1.5 py-0.5 rounded border transition-colors ${
                          isCurrentLesson
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                        }`}
                        title={note.lessonTitle}
                      >
                        {note.lessonTitle}
                      </button>
                    )}

                    <span className="text-[10px] text-slate-400">{note.createdAt}</span>
                  </div>

                  {/* Quick Action Icons */}
                  {!isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`[${formatTime(note.timestampSeconds)}] ${note.text}`);
                          setCopyFeedback('คัดลอกโน้ตแล้ว');
                          setTimeout(() => setCopyFeedback(null), 2000);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        title="คัดลอกข้อความ"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleStartEdit(note)}
                        className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                        title="แก้ไขโน้ต"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteUserNote(note.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="ลบโน้ตนี้"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Note Content (View mode vs Inline Edit mode) */}
                {isEditing ? (
                  <div className="space-y-2 pt-1">
                    <textarea
                      rows={3}
                      value={editingText}
                      onChange={e => setEditingText(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-indigo-500 focus:outline-none bg-white resize-none"
                    />

                    {/* Edit Tags */}
                    <div className="flex flex-wrap gap-1">
                      {PRESET_TAGS.map(tag => {
                        const isSel = editingTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleEditTag(tag)}
                            className={`text-[9px] px-1.5 py-0.5 rounded ${
                              isSel
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditingNoteId(null)}
                        className="px-2 py-1 rounded text-[11px] font-medium text-slate-500 hover:bg-slate-100"
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={() => handleSaveEdit(note.id)}
                        className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
                      >
                        <Check className="w-3 h-3" />
                        <span>บันทึกการแก้ไข</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
                      {note.text}
                    </p>

                    {/* Tags row */}
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        {note.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-600"
                          >
                            {tag}
                          </span>
                        ))}
                        {note.updatedAt && (
                          <span className="text-[9px] text-slate-400 ml-auto italic">
                            (แก้ไขเมื่อ {note.updatedAt})
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 5. Footer / Export Actions Bar */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportMarkdown}
            disabled={courseNotes.length === 0}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium text-[11px] transition-colors disabled:opacity-40"
            title="ส่งออกบันทึกเป็นไฟล์ Markdown (.md)"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>ดาวน์โหลด .md</span>
          </button>
          <button
            onClick={handleCopyAll}
            disabled={courseNotes.length === 0}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium text-[11px] transition-colors disabled:opacity-40"
            title="คัดลอกข้อความสรุปทั้งหมด"
          >
            <Copy className="w-3 h-3 text-slate-500" />
            <span className="hidden sm:inline">คัดลอกทั้งหมด</span>
          </button>
        </div>

        <div className="text-[10px] text-slate-400 font-mono">
          {totalCourseNotesCount} โน้ตในคอร์สนี้
        </div>
      </div>
    </div>
  );
};
