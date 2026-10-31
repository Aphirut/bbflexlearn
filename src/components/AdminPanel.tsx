import React, { useState, useEffect } from 'react';
import { useApp, DEFAULT_APP_SETTINGS, DEFAULT_CATEGORIES, getCourseCategories } from '../context/AppContext';
import { Course, UserRole } from '../types';
import { AppLogo, PRESET_LOGOS, LOGO_BG_COLORS } from './AppLogo';
import { LessonCoverField, normalizeImageUrl } from './LessonCoverField';
import { SubLessonsEditor } from './SubLessonsEditor';
import { LessonMaterialsField } from './LessonMaterialsField';
import type { LessonResource, SubLesson } from '../types';
import {
  Users,
  Video,
  BarChart3,
  Mail,
  Plus,
  Trash2,
  Send,
  AlertCircle,
  Lightbulb,
  ExternalLink,
  Clock,
  Sparkles,
  TrendingUp,
  X,
  Palette,
  Image as ImageIcon,
  Upload,
  Check,
  RotateCcw,
  Eye,
  Sliders,
  Pencil
} from 'lucide-react';

interface AdminPanelProps {
  onPreviewEmail?: (emailId: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onPreviewEmail }) => {
  const {
    currentUser,
    users,
    addUser,
    deleteUser,
    courses,
    addCourse,
    updateCourse,
    deleteCourse,
    addLessonToCourse,
    analytics,
    notifications,
    broadcastAnnouncement,
    sendCustomEmail,
    appSettings,
    updateAppSettings
  } = useApp();

  const [activeTab, setActiveTab] = useState<'users' | 'courses' | 'analytics' | 'emails' | 'settings'>('analytics');

  // Branding & App Name State
  const [brandAppName, setBrandAppName] = useState(appSettings.appName);
  const [brandShortName, setBrandShortName] = useState(appSettings.appShortName);
  const [brandTagline, setBrandTagline] = useState(appSettings.tagline);
  const [brandLogoType, setBrandLogoType] = useState<'monogram' | 'image'>(appSettings.logoType);
  const [brandLogoUrl, setBrandLogoUrl] = useState(appSettings.logoUrl || '');
  const [brandBgColor, setBrandBgColor] = useState(appSettings.logoBgColor || 'indigo');
  const [brandPresetLogoId, setBrandPresetLogoId] = useState(appSettings.presetLogoId || 'flexlearn_badge');
  const [brandSaveSuccess, setBrandSaveSuccess] = useState(false);
  const [brandUploadError, setBrandUploadError] = useState<string | null>(null);

  useEffect(() => {
    setBrandAppName(appSettings.appName);
    setBrandShortName(appSettings.appShortName);
    setBrandTagline(appSettings.tagline);
    setBrandLogoType(appSettings.logoType);
    setBrandLogoUrl(appSettings.logoUrl || '');
    setBrandBgColor(appSettings.logoBgColor || 'indigo');
    setBrandPresetLogoId(appSettings.presetLogoId || 'flexlearn_badge');
  }, [appSettings]);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBrandUploadError(null);
    if (!file.type.startsWith('image/')) {
      setBrandUploadError('กรุณาเลือกไฟล์รูปภาพเท่านั้น (PNG, JPG, SVG, WebP)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setBrandUploadError('ขนาดไฟล์ภาพต้องไม่เกิน 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setBrandLogoUrl(base64);
      setBrandLogoType('image');
    };
    reader.onerror = () => {
      setBrandUploadError('เกิดข้อผิดพลาดในการอ่านไฟล์รูปภาพ');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBrandSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateAppSettings({
      appName: brandAppName.trim() || 'BB FlexLearn',
      appShortName: brandShortName.trim() || 'BB',
      tagline: brandTagline.trim() || 'Enterprise Digital Learning & Assessment Platform',
      logoType: brandLogoType,
      logoUrl: brandLogoUrl.trim(),
      logoBgColor: brandBgColor,
      presetLogoId: brandPresetLogoId,
    });
    setBrandSaveSuccess(true);
    setTimeout(() => setBrandSaveSuccess(false), 3000);
  };

  const handleResetBrandDefaults = () => {
    setBrandAppName(DEFAULT_APP_SETTINGS.appName);
    setBrandShortName(DEFAULT_APP_SETTINGS.appShortName);
    setBrandTagline(DEFAULT_APP_SETTINGS.tagline);
    setBrandLogoType(DEFAULT_APP_SETTINGS.logoType);
    setBrandLogoUrl(DEFAULT_APP_SETTINGS.logoUrl || '');
    setBrandBgColor(DEFAULT_APP_SETTINGS.logoBgColor || 'indigo');
    setBrandPresetLogoId(DEFAULT_APP_SETTINGS.presetLogoId || 'flexlearn_badge');
    updateAppSettings(DEFAULT_APP_SETTINGS);
    setBrandSaveSuccess(true);
    setTimeout(() => setBrandSaveSuccess(false), 3000);
  };

  // Modals state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('student');
  const [newUserDepartment, setNewUserDepartment] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  // Course & Lesson state
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonDuration, setLessonDuration] = useState(20);
  const [lessonVideoUrl, setLessonVideoUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  const [lessonCoverUrl, setLessonCoverUrl] = useState('');
  const [lessonSubLessons, setLessonSubLessons] = useState<SubLesson[]>([]);
  const [lessonResources, setLessonResources] = useState<LessonResource[]>([]);
  const [notifyEnrolled, setNotifyEnrolled] = useState(true);

  // New Course modal state
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseCover, setNewCourseCover] = useState('');
  const [newCourseSubtitle, setNewCourseSubtitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseCategory, setNewCourseCategory] = useState<string>('web_dev');

  // Edit / delete course state (admin)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCover, setEditCover] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState<string>('web_dev');
  const [editLevel, setEditLevel] = useState<Course['level']>('ระดับปานกลาง');
  const [editDuration, setEditDuration] = useState(3);
  const [editClassroomCode, setEditClassroomCode] = useState('');
  const [editPublished, setEditPublished] = useState(true);
  const [editRequirementsText, setEditRequirementsText] = useState('');
  const [editOutcomesText, setEditOutcomesText] = useState('');
  const [pendingDeleteCourse, setPendingDeleteCourse] = useState<Course | null>(null);

  // Broadcast state
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastCourseId, setBroadcastCourseId] = useState(courses[0]?.id || '');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Handlers
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || newUserPassword.length < 8) return;

    addUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80`,
      role: newUserRole,
      password: newUserPassword,
      department: newUserDepartment.trim() || 'ทั่วไป',
      phone: newUserPhone.trim() || '080-000-0000'
    });

    setNewUserName('');
    setNewUserEmail('');
    setNewUserDepartment('');
    setNewUserPhone('');
    setNewUserPassword('');
    setShowAddUserModal(false);
  };

  const handleAddLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim() || !selectedCourseId) return;

    addLessonToCourse(selectedCourseId, {
      title: lessonTitle.trim(),
      description: lessonDescription.trim() || 'คำอธิบายเนื้อหาบทเรียนและสรุปผลการเรียนรู้',
      durationMinutes: Number(lessonDuration) || 15,
      videoUrl: lessonVideoUrl.trim(),
      coverImageUrl: normalizeImageUrl(lessonCoverUrl) || undefined,
      resources: lessonResources,
      subLessons: lessonSubLessons
        .filter(s => s.title.trim())
        .map((s, i) => ({ ...s, title: s.title.trim(), order: i + 1 }))
    }, notifyEnrolled);

    setLessonTitle('');
    setLessonDescription('');
    setLessonCoverUrl('');
    setLessonSubLessons([]);
    setLessonResources([]);
    setShowAddLessonModal(false);
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;

    const newCourse: Omit<Course, 'id' | 'updatedAt'> = {
      title: newCourseTitle.trim(),
      coverImageUrl: normalizeImageUrl(newCourseCover) || undefined,
      slug: newCourseTitle.toLowerCase().replace(/\s+/g, '-'),
      subtitle: newCourseSubtitle.trim() || 'คอร์สเรียนออนไลน์คุณภาพสูง',
      description: newCourseDesc.trim() || 'หลักสูตรพัฒนาทักษะวิชาชีพระดับองค์กร',
      category: newCourseCategory,
      categoryNameTh: courseCategories.find(c => c.id === newCourseCategory)?.label || 'ทั่วไป',
      level: 'ระดับปานกลาง',
      durationHours: 3.0,
      instructor: {
        name: currentUser.name,
        title: 'Senior Lecturer, BB FlexLearn',
        avatar: currentUser.avatar,
        organization: 'BB FlexLearn Digital Institute',
        signatureName: currentUser.name
      },
      colorTheme: {
        primary: 'slate-900',
        secondary: 'indigo-600',
        badgeBg: 'bg-indigo-50 text-indigo-700',
        textAccent: 'text-indigo-600',
        gradient: 'from-indigo-600 to-blue-700'
      },
      iconType: newCourseCategory === 'web_dev' ? 'code' : newCourseCategory === 'ux_ui' ? 'palette' : newCourseCategory === 'ai_data' ? 'brain' : 'trending',
      learningOutcomes: [
        'เข้าใจหลักการทำงานเชิงลึกอย่างเป็นระบบ',
        'สามารถนำไปปฏิบัติจริงในบริบทการทำงาน'
      ],
      requirements: ['สมาร์ทโฟนหรือคอมพิวเตอร์ที่เชื่อมต่ออินเทอร์เน็ตได้'],
      published: true,
      lessons: [
        {
          id: `lesson-init-${Date.now()}`,
          title: '01. บทนำและภาพรวมหลักสูตร',
          description: 'โครงสร้างการเรียนรู้และเป้าหมายความสำเร็จ',
          durationMinutes: 15,
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          order: 1
        }
      ],
      preTest: {
        id: `pre-${Date.now()}`,
        title: `แบบทดสอบก่อนเรียน - ${newCourseTitle}`,
        type: 'pre_test',
        passingScorePercent: 60,
        questions: [
          {
            id: 'q-new-1',
            question: 'คำถามวัดพื้นฐานข้อที่ 1',
            options: ['ตัวเลือก A (ถูกต้อง)', 'ตัวเลือก B', 'ตัวเลือก C', 'ตัวเลือก D'],
            correctIndex: 0,
            explanation: 'คำอธิบายพื้นฐาน'
          }
        ]
      },
      postTest: {
        id: `post-${Date.now()}`,
        title: `แบบทดสอบหลังเรียน - ${newCourseTitle}`,
        type: 'post_test',
        passingScorePercent: 80,
        questions: [
          {
            id: 'q-new-post-1',
            question: 'คำถามวัดผลสัมฤทธิ์ข้อที่ 1',
            options: ['ตัวเลือก A (ถูกต้อง)', 'ตัวเลือก B', 'ตัวเลือก C', 'ตัวเลือก D'],
            correctIndex: 0,
            explanation: 'คำอธิบายเชิงลึก'
          }
        ]
      }
    };

    addCourse(newCourse);
    setNewCourseTitle('');
    setNewCourseCover('');
    setNewCourseSubtitle('');
    setNewCourseDesc('');
    setShowAddCourseModal(false);
  };

  const courseCategories = getCourseCategories(appSettings);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [renamingCategoryId, setRenamingCategoryId] = useState<string | null>(null);
  const [renameCategoryLabel, setRenameCategoryLabel] = useState('');

  const saveCategories = (cats: { id: string; label: string }[]) => {
    updateAppSettings({ categories: cats });
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newCategoryLabel.trim();
    if (!label) return;
    if (courseCategories.some(c => c.label === label)) {
      setCategoryError('มีหมวดหมู่ชื่อนี้อยู่แล้ว');
      return;
    }
    const id = `cat-${Date.now()}`;
    saveCategories([...courseCategories, { id, label }]);
    setNewCategoryLabel('');
    setCategoryError(null);
  };

  const handleRenameCategory = (id: string) => {
    const label = renameCategoryLabel.trim();
    if (!label) return;
    if (courseCategories.some(c => c.id !== id && c.label === label)) {
      setCategoryError('มีหมวดหมู่ชื่อนี้อยู่แล้ว');
      return;
    }
    saveCategories(courseCategories.map(c => (c.id === id ? { ...c, label } : c)));
    courses.filter(c => c.category === id).forEach(c => updateCourse({ ...c, categoryNameTh: label }));
    setRenamingCategoryId(null);
    setCategoryError(null);
  };

  const handleDeleteCategory = (id: string, label: string) => {
    const used = courses.filter(c => c.category === id).length;
    if (used > 0) {
      setCategoryError(`ลบไม่ได้: หมวดหมู่ “${label}” มีคอร์สใช้งานอยู่ ${used} คอร์ส กรุณาย้ายคอร์สไปหมวดอื่นก่อน`);
      return;
    }
    if (!confirm(`ต้องการลบหมวดหมู่ “${label}” ใช่หรือไม่?`)) return;
    saveCategories(courseCategories.filter(c => c.id !== id));
    setCategoryError(null);
  };

  const openEditCourse = (course: Course) => {
    setEditingCourse(course);
    setEditTitle(course.title);
    setEditCover(course.coverImageUrl || '');
    setEditSubtitle(course.subtitle || '');
    setEditDesc(course.description || '');
    setEditCategory((course.category as typeof editCategory) || 'web_dev');
    setEditLevel(course.level);
    setEditDuration(course.durationHours || 0);
    setEditClassroomCode(course.classroomCode || '');
    setEditPublished(course.published !== false);
    setEditRequirementsText((course.requirements || []).join('\n'));
    setEditOutcomesText((course.learningOutcomes || []).join('\n'));
  };

  const handleUpdateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse || !editTitle.trim()) return;
    updateCourse({
      ...editingCourse,
      title: editTitle.trim(),
      coverImageUrl: normalizeImageUrl(editCover) || undefined,
      subtitle: editSubtitle.trim(),
      description: editDesc.trim(),
      category: editCategory,
      categoryNameTh: courseCategories.find(c => c.id === editCategory)?.label || editingCourse.categoryNameTh,
      level: editLevel,
      durationHours: Number(editDuration) || 0,
      classroomCode: editClassroomCode.trim() || undefined,
      requirements: editRequirementsText.split('\n').map(s => s.trim()).filter(Boolean),
      learningOutcomes: editOutcomesText.split('\n').map(s => s.trim()).filter(Boolean),
      published: editPublished
    });
    setEditingCourse(null);
  };

  const handleDeleteCourse = () => {
    if (!pendingDeleteCourse) return;
    const deletedId = pendingDeleteCourse.id;
    deleteCourse(deletedId);
    const remaining = courses.filter(c => c.id !== deletedId);
    setSelectedCourseId(remaining[0]?.id || '');
    if (editingCourse?.id === deletedId) setEditingCourse(null);
    setPendingDeleteCourse(null);
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) return;

    broadcastAnnouncement(broadcastCourseId, broadcastSubject.trim(), broadcastMessage.trim());
    setBroadcastSubject('');
    setBroadcastMessage('');
    setBroadcastSuccess(true);
    setTimeout(() => setBroadcastSuccess(false), 3000);
  };

  const activeCourse = courses.find(c => c.id === selectedCourseId) || courses[0];

  if (currentUser.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded font-semibold border border-rose-200">
            Admin Access Required · เฉพาะผู้ดูแลระบบ
          </span>
          <h2 className="text-xl font-bold text-slate-900 pt-2">
            คุณไม่มีสิทธิ์เข้าถึงแผงควบคุมระบบ
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            บัญชีปัจจุบันของคุณคือ <strong>{currentUser.name}</strong> ({currentUser.role === 'student' ? 'ผู้เรียน' : 'อาจารย์'}) พื้นที่นี้สงวนไว้เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-semibold">
              Admin Portal · แผงควบคุมผู้ดูแลระบบ
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">ระบบรักษาความปลอดภัยและการวิเคราะห์</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            ระบบบริหารจัดการคอร์สและการเรียนรู้องค์กร
          </h1>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddCourseModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>สร้างคอร์สใหม่</span>
          </button>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เพิ่มผู้ใช้งาน</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 p-1 bg-slate-200/70 rounded-xl overflow-x-auto no-scrollbar scroll-smooth">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'analytics'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="hidden sm:inline">วิเคราะห์ผลการเรียนรู้ & สถิติ</span>
          <span className="sm:hidden">สถิติ</span>
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'courses'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Video className="w-4 h-4 text-sky-600 shrink-0" />
          <span className="hidden sm:inline">จัดการบทเรียนวิดีโอ</span>
          <span className="sm:hidden">บทเรียน</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'users'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="hidden sm:inline">จัดการผู้ใช้งาน ({users.length} คน)</span>
          <span className="sm:hidden">ผู้ใช้ ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('emails')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'emails'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Mail className="w-4 h-4 text-purple-600 shrink-0" />
          <span className="hidden sm:inline">ระบบกระจายอีเมล & แจ้งเตือน</span>
          <span className="sm:hidden">อีเมล</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'settings'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Palette className="w-4 h-4 text-pink-600 shrink-0" />
          <span className="hidden sm:inline">ตั้งค่าชื่อแอป & โลโก้</span>
          <span className="sm:hidden">โลโก้ & ชื่อแอป</span>
        </button>
      </div>

      {/* TAB 1: LEARNING ANALYTICS & CONTENT QUALITY */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-medium">จำนวนผู้เรียนทั้งหมดในระบบ</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                665 <span className="text-sm font-normal text-slate-500">คน</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-medium">
                +18.4% จากเดือนที่ผ่านมา
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-medium">อัตราการเรียนจบเฉลี่ย</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 font-mono tabular-nums">
                75.8%
              </div>
              <p className="text-[11px] text-slate-500">
                สูงกว่ามาตรฐานอุตสาหกรรม (60%)
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-medium">คะแนนพัฒนาการเฉลี่ย (+Delta)</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono tabular-nums">
                +40.2%
              </div>
              <p className="text-[11px] text-slate-500">
                เปรียบเทียบ Pre-test vs Post-test
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-medium">ดัชนีความพึงพอใจต่อเนื้อหา</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono tabular-nums">
                4.89 <span className="text-sm font-normal text-slate-500">/ 5.0</span>
              </div>
              <p className="text-[11px] text-slate-500">
                จากแบบประเมินผู้เรียน 420 คน
              </p>
            </div>
          </div>

          {/* AI Content Quality Insights Banner */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl p-5 shadow-md flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                <span>คำแนะนำเชิงลึกเพื่อปรับปรุงคุณภาพเนื้อหา (Actionable Content Insights)</span>
              </h2>
              <p className="text-xs text-slate-200 leading-relaxed">
                ระบบตรวจพบว่าในคอร์ส <strong>Modern Full-Stack Web Development</strong> บทเรียนที่ 4 (REST API & Data Fetching) มีอัตราการรับชมลดลงเหลือ 71% (จุด Drop-off สูงสุด) แนะนำให้ผู้สอนแบ่งคลิปวิดีโอที่มีความยาว 28 นาทีออกเป็น 2 คลิปย่อยความยาวละ 14 นาที เพื่อเพิ่มอัตราความสำเร็จของผู้เรียนอีกประมาณ +16%
              </p>
            </div>
          </div>

          {/* Analytics Table by Course */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                สถิติการเรียนรู้แยกตามหลักสูตร (Course Learning Metrics)
              </h2>
              <p className="text-xs text-slate-500">
                วิเคราะห์ประสิทธิภาพการเรียน การสอบวัดผล และจุดที่ผู้เรียนเริ่มติดขัด
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 px-3 font-semibold">ชื่อหลักสูตร</th>
                    <th className="py-2.5 px-3 font-semibold text-center">ผู้เรียน</th>
                    <th className="py-2.5 px-3 font-semibold text-center">อัตราเรียนจบ</th>
                    <th className="py-2.5 px-3 font-semibold text-center">คะแนนก่อนเรียน</th>
                    <th className="py-2.5 px-3 font-semibold text-center">คะแนนหลังเรียน</th>
                    <th className="py-2.5 px-3 font-semibold text-center">พัฒนาการ</th>
                    <th className="py-2.5 px-3 font-semibold">จุดติดขัด (Drop-off Lesson)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analytics.map(item => (
                    <tr key={item.courseId} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-medium text-slate-900">
                        {item.courseTitle}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        {item.totalEnrolled}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600" style={{ width: `${item.completionRate}%` }} />
                          </div>
                          <span className="font-mono font-semibold">{item.completionRate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-600">
                        {item.avgPreTestScore}%
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-indigo-700">
                        {item.avgPostTestScore}%
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-0.5 text-emerald-700 font-semibold font-mono">
                          <TrendingUp className="w-3 h-3" />
                          <span>+{item.avgImprovementDelta}%</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-amber-700 text-[11px]">
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[200px]">{item.dropOffLessonTitle}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COURSE & LESSON VIDEO STUDIO */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          {/* Category manager (admin) */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900">จัดการหมวดหมู่คอร์ส</h2>
            <p className="mt-0.5 text-xs text-slate-500">หมวดหมู่ที่สร้างจะไปปรากฏในตัวกรองหน้าหลัก และในรายการเลือกหมวดหมู่ตอนสร้าง/แก้ไขคอร์สทันที</p>

            <form onSubmit={handleAddCategory} className="mt-3 flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={newCategoryLabel}
                onChange={e => setNewCategoryLabel(e.target.value)}
                placeholder="ชื่อหมวดหมู่ใหม่ เช่น ภาษาต่างประเทศ"
                className="min-w-56 flex-1 rounded-lg border border-slate-200 p-2.5 text-xs focus:border-indigo-600 focus:outline-none"
              />
              <button type="submit" className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700">
                <Plus className="h-3.5 w-3.5" />
                เพิ่มหมวดหมู่
              </button>
            </form>

            {categoryError && (
              <p role="alert" className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{categoryError}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {courseCategories.map(cat => {
                const usedCount = courses.filter(c => c.category === cat.id).length;
                const isDefault = DEFAULT_CATEGORIES.some(d => d.id === cat.id);
                return renamingCategoryId === cat.id ? (
                  <span key={cat.id} className="flex items-center gap-1.5 rounded-full border border-indigo-300 bg-indigo-50 py-1 pl-3 pr-1">
                    <input
                      autoFocus
                      value={renameCategoryLabel}
                      onChange={e => setRenameCategoryLabel(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleRenameCategory(cat.id)}
                      className="w-36 bg-transparent text-xs font-semibold text-slate-800 focus:outline-none"
                    />
                    <button onClick={() => handleRenameCategory(cat.id)} className="rounded-full bg-indigo-600 p-1.5 text-white hover:bg-indigo-700" aria-label="บันทึกชื่อหมวดหมู่">
                      <Check className="h-3 w-3" />
                    </button>
                    <button onClick={() => setRenamingCategoryId(null)} className="rounded-full bg-white p-1.5 text-slate-500 hover:bg-slate-100" aria-label="ยกเลิก">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ) : (
                  <span key={cat.id} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-1 pl-3 pr-1 text-xs font-semibold text-slate-700">
                    {cat.label}
                    <span className="font-normal text-slate-400">{usedCount} คอร์ส{isDefault ? ' · เริ่มต้น' : ''}</span>
                    <button
                      onClick={() => { setRenamingCategoryId(cat.id); setRenameCategoryLabel(cat.label); setCategoryError(null); }}
                      className="rounded-full bg-white p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      aria-label={`เปลี่ยนชื่อหมวดหมู่ ${cat.label}`}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.label)}
                      className="rounded-full bg-white p-1.5 text-rose-500 hover:bg-rose-50"
                      aria-label={`ลบหมวดหมู่ ${cat.label}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Course List Picker */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">เลือกคอร์สเพื่อจัดการ</h2>
              <button
                onClick={() => setShowAddCourseModal(true)}
                className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>คอร์สใหม่</span>
              </button>
            </div>

            <div className="space-y-2">
              {courses.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCourseId(c.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    selectedCourseId === c.id
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>{c.categoryNameTh}</span>
                    <span className="font-mono">{c.lessons.length} บท</span>
                  </div>
                  <h3 className={`text-xs sm:text-sm font-bold line-clamp-1 ${selectedCourseId === c.id ? 'text-indigo-950' : 'text-slate-900'}`}>
                    {c.title}
                  </h3>
                </button>
              ))}
            </div>
          </div>

          {/* Right Lesson Manager & Uploader */}
          {!activeCourse ? (
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-10 shadow-sm text-center space-y-2">
              <h2 className="text-base font-bold text-slate-900">ยังไม่มีคอร์สเรียนในระบบ</h2>
              <p className="text-xs text-slate-500">คอร์สทั้งหมดถูกลบแล้ว กดปุ่ม “คอร์สใหม่” เพื่อสร้างคอร์สแรก</p>
              <button
                onClick={() => setShowAddCourseModal(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                คอร์สใหม่
              </button>
            </div>
          ) : (
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs text-slate-500 font-medium">{activeCourse.categoryNameTh}</span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  {activeCourse.title}
                </h2>
                <p className="text-xs text-slate-500">
                  ความยาวรวม {activeCourse.durationHours} ชั่วโมง · มี {activeCourse.lessons.length} บทเรียน
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => openEditCourse(activeCourse)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>แก้ไขคอร์ส</span>
                </button>
                <button
                  onClick={() => setPendingDeleteCourse(activeCourse)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบคอร์ส</span>
                </button>
                <button
                  onClick={() => setShowAddLessonModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>อัปโหลดบทเรียนวิดีโอใหม่</span>
                </button>
              </div>
            </div>

            {/* Lesson List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                รายการบทเรียนในหลักสูตรนี้ ({activeCourse.lessons.length} ตอน):
              </h3>

              {activeCourse.lessons.map((lesson, idx) => (
                <div
                  key={lesson.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    {lesson.coverImageUrl ? (
                      <img src={lesson.coverImageUrl} alt="" className="h-11 w-[72px] shrink-0 rounded-lg object-cover mt-0.5" />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                    )}
                    <div className="space-y-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        {lesson.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {lesson.description}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{lesson.durationMinutes} นาที</span>
                        </span>
                        <span>·</span>
                        <span className="truncate max-w-xs">{lesson.videoUrl}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded shrink-0">
                    ออนไลน์
                  </span>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                บัญชีผู้ใช้งานในระบบ (User Directory)
              </h2>
              <p className="text-xs text-slate-500">
                ผู้ดูแลระบบสามารถเพิ่ม แก้ไขบทบาท หรือตรวจสอบการเรียนของผู้ใช้แต่ละรายได้
              </p>
            </div>

            <button
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มผู้ใช้งานใหม่</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 px-3 font-semibold">ผู้ใช้งาน</th>
                  <th className="py-2.5 px-3 font-semibold">อีเมลติดต่อ</th>
                  <th className="py-2.5 px-3 font-semibold">แผนก / สังกัด</th>
                  <th className="py-2.5 px-3 font-semibold text-center">บทบาท</th>
                  <th className="py-2.5 px-3 font-semibold text-center">คอร์สที่ลง</th>
                  <th className="py-2.5 px-3 font-semibold">วันที่สร้าง</th>
                  <th className="py-2.5 px-3 font-semibold text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200"
                        />
                        <span className="font-semibold text-slate-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono">{u.email}</td>
                    <td className="py-3 px-3 text-slate-600">{u.department || '-'}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        u.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'ผู้เรียน (Student)'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-medium">
                      {u.enrolledCourseIds.length} คอร์ส
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono">{u.createdAt}</td>
                    <td className="py-3 px-3 text-right">
                      {u.id !== currentUser.id && (
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded hover:bg-slate-100"
                          title="ลบบัญชีผู้ใช้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: EMAIL NOTIFICATION CENTER & BROADCAST */}
      {activeTab === 'emails' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Compose Broadcast Notification */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-600" />
                <span>ส่งอีเมลแจ้งเตือนผู้เรียน (Broadcast Notification)</span>
              </h2>
              <p className="text-xs text-slate-500">
                แจ้งเตือนบทเรียนใหม่ ประกาศข่าวสาร หรือเตือนผู้เรียนให้เข้ามาทำแบบทดสอบ
              </p>
            </div>

            {broadcastSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                ✓ ส่งการแจ้งเตือนและจำลองอีเมลไปยังผู้เรียนทุกคนเรียบร้อยแล้ว
              </div>
            )}

            <form onSubmit={handleBroadcast} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">เลือกกลุ่มผู้รับ (คอร์สเรียน)</label>
                <select
                  value={broadcastCourseId}
                  onChange={e => setBroadcastCourseId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">หัวข้ออีเมล (Subject)</label>
                <input
                  type="text"
                  placeholder="เช่น อัปเดตเนื้อหาบทเรียนใหม่ หรือ แจ้งเตือนทำแบบทดสอบ"
                  value={broadcastSubject}
                  onChange={e => setBroadcastSubject(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">เนื้อหาข้อความ (Message Body)</label>
                <textarea
                  rows={4}
                  placeholder="พิมพ์รายละเอียดประกาศที่จะส่งตรงเข้าอีเมลและหน้าจอของผู้เรียน..."
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>ส่งอีเมลแจ้งเตือนทันที</span>
              </button>
            </form>
          </div>

          {/* Right: Sent Emails History */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  ประวัติการส่งอีเมลแจ้งเตือน ({notifications.length} ฉบับ)
                </h3>
                <p className="text-xs text-slate-500">
                  ระบบจำลองกล่องจดหมายจริงที่ส่งไปยังอีเมลของผู้เรียน
                </p>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto">
              {notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => onPreviewEmail && onPreviewEmail(n.id)}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all cursor-pointer flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{n.subject}</span>
                    </div>
                    <p className="text-slate-500 line-clamp-1">{n.previewText}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>ส่งถึง: {n.toName} ({n.toEmail})</span>
                      <span>·</span>
                      <span>{n.sentAt}</span>
                    </div>
                  </div>

                  <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 shrink-0 hover:underline">
                    <span>ดูตัวอย่างอีเมล</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BRANDING, APP NAME & LOGO CUSTOMIZATION */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Header banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    White-Label & Enterprise Branding
                  </span>
                  <span className="text-xs text-indigo-300">· ผู้ดูแลระบบสูงสุด</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Palette className="w-6 h-6 text-indigo-400" />
                  <span>ตั้งค่าชื่อแอปพลิเคชัน & อัตลักษณ์โลโก้</span>
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  ปรับแต่งชื่อแพลตฟอร์ม ตัวย่อ คำอธิบายสโลแกน และโลโก้ของระบบ (รองรับทั้งอัปโหลดภาพ, เวกเตอร์ไอคอนประจำสถาบัน และโมโนแกรม) การเปลี่ยนแปลงจะมีผลทันทีทั่วทั้งแพลตฟอร์ม
                </p>
              </div>

              {/* Status Alert */}
              {brandSaveSuccess && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-xs shadow-lg animate-fadeIn shrink-0">
                  <Check className="w-4 h-4" />
                  <span>บันทึกและอัปเดตระบบเรียบร้อยแล้ว!</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Form Controls */}
            <form onSubmit={handleSaveBrandSettings} className="lg:col-span-7 space-y-6">
              {/* Card 1: App Names & Slogans */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">1. ข้อมูลชื่อและคำอธิบายแพลตฟอร์ม</h3>
                  </div>
                  <span className="text-[11px] text-slate-400">แสดงผลใน Header, Hero, Footer และหัวเอกสาร</span>
                </div>

                <div className="space-y-4">
                  {/* App Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชื่อแอปพลิเคชัน / ชื่อระบบ (Platform Name) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={brandAppName}
                      onChange={(e) => setBrandAppName(e.target.value)}
                      placeholder="เช่น BB FlexLearn, EduPulse, TechAcademy"
                      maxLength={40}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition"
                      required
                    />
                    <div className="flex justify-between items-center mt-1 text-[11px] text-slate-400">
                      <span>แสดงเป็นหัวเรื่องหลักที่แถบนำทางและชื่อแท็บเบราว์เซอร์</span>
                      <span>{brandAppName.length}/40 ตัวอักษร</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* App Short Name / Monogram */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ชื่อย่อ / ตัวย่อโมโนแกรม (Short Name) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={brandShortName}
                        onChange={(e) => setBrandShortName(e.target.value.toUpperCase())}
                        placeholder="เช่น BB, FL, AC"
                        maxLength={5}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-bold tracking-wider text-slate-900 uppercase placeholder:text-slate-400 transition"
                        required
                      />
                      <span className="block mt-1 text-[11px] text-slate-400">
                        สำหรับใช้เป็น Favicon และตราสัญลักษณ์ย่อ (2-4 ตัวอักษร)
                      </span>
                    </div>

                    {/* Preset Slogan Selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        คำบรรยายสโลแกน (Tagline / Slogan)
                      </label>
                      <input
                        type="text"
                        value={brandTagline}
                        onChange={(e) => setBrandTagline(e.target.value)}
                        placeholder="เช่น Enterprise Digital Learning Platform"
                        maxLength={80}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition"
                      />
                      <span className="block mt-1 text-[11px] text-slate-400">
                        แสดงใน Hero Banner และ Meta Description
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Logo Style & Assets */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">2. การเลือกและตกแต่งตราสัญลักษณ์โลโก้</h3>
                  </div>
                  <span className="text-[11px] text-slate-400">3 รูปแบบอัตลักษณ์ที่เลือกได้</span>
                </div>

                {/* Logo Type Selector */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setBrandLogoType('monogram');
                      if (brandPresetLogoId === 'monogram') {
                        setBrandPresetLogoId('flexlearn_badge');
                      }
                    }}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-bold transition ${
                      brandLogoType === 'monogram' && brandPresetLogoId !== 'monogram'
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>ไอคอนองค์กร (Preset)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBrandLogoType('monogram');
                      setBrandPresetLogoId('monogram');
                    }}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-bold transition ${
                      brandLogoType === 'monogram' && brandPresetLogoId === 'monogram'
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="w-4 h-4 rounded bg-indigo-600 text-white font-mono text-[10px] flex items-center justify-center font-extrabold">
                      {brandShortName.slice(0, 2) || 'BB'}
                    </span>
                    <span>โมโนแกรม (Monogram)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBrandLogoType('image')}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-bold transition ${
                      brandLogoType === 'image'
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-4 h-4 text-indigo-600" />
                    <span>อัปโหลดภาพ (Image)</span>
                  </button>
                </div>

                {/* Mode A: Preset Badges */}
                {brandLogoType === 'monogram' && brandPresetLogoId !== 'monogram' && (
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-bold text-slate-700">
                      เลือกตราสัญลักษณ์เวกเตอร์ประจำสถาบัน:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {PRESET_LOGOS.map((item) => {
                        const Icon = item.icon;
                        const isSelected = brandPresetLogoId === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setBrandPresetLogoId(item.id)}
                            className={`p-3 rounded-xl border text-left flex items-center gap-3 transition ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-600'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.color} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                                {item.name}
                              </p>
                              <span className="text-[10px] text-slate-400">เวกเตอร์คุณภาพสูง</span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Mode B: Monogram Colors */}
                {brandLogoType === 'monogram' && brandPresetLogoId === 'monogram' && (
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-bold text-slate-700">
                      เลือกสีพื้นหลังของกล่องโมโนแกรมย่อ:
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(LOGO_BG_COLORS).map(([colorKey, style]) => {
                        const isSelected = brandBgColor === colorKey;
                        return (
                          <button
                            key={colorKey}
                            type="button"
                            onClick={() => setBrandBgColor(colorKey)}
                            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition ${
                              isSelected
                                ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-md ${style.bg} shrink-0 shadow-inner flex items-center justify-center text-[10px] text-white font-bold`}>
                              {isSelected ? '✓' : ''}
                            </span>
                            <span className="text-xs font-semibold capitalize">{colorKey}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      ตัวอักษรย่อจะดึงจากช่อง "ชื่อย่อ / ตัวย่อโมโนแกรม" ด้านบนโดยอัตโนมัติ: <strong className="text-slate-900 font-mono">[{brandShortName || 'BB'}]</strong>
                    </p>
                  </div>
                )}

                {/* Mode C: Custom Image Upload / URL */}
                {brandLogoType === 'image' && (
                  <div className="space-y-4 pt-2">
                    {/* File Uploader */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        อัปโหลดไฟล์ภาพโลโก้โดยตรง (รองรับ PNG, SVG, JPG, WebP)
                      </label>
                      <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-4 text-center bg-slate-50/50 hover:bg-indigo-50/30 transition cursor-pointer relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                          <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-indigo-600">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              คลิกเพื่อเลือกไฟล์ หรือลากไฟล์ภาพมาวางที่นี่
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              ขนาดไฟล์ไม่เกิน 2MB (แนะนำอัตราส่วน 1:1 หรือสี่เหลี่ยมจัตุรัสแบบโปร่งใส PNG)
                            </p>
                          </div>
                        </div>
                      </div>
                      {brandUploadError && (
                        <p className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{brandUploadError}</span>
                        </p>
                      )}
                    </div>

                    {/* Or URL */}
                    <div>
                      <div className="flex items-center gap-2 my-2">
                        <div className="h-px bg-slate-200 flex-1" />
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">หรือใส่ลิงก์รูปภาพ URL</span>
                        <div className="h-px bg-slate-200 flex-1" />
                      </div>

                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        URL ของรูปภาพโลโก้ภายนอก
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={brandLogoUrl}
                          onChange={(e) => setBrandLogoUrl(e.target.value)}
                          placeholder="https://example.com/logo.png"
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-xs font-mono text-slate-900 placeholder:text-slate-400 transition"
                        />
                        {brandLogoUrl && (
                          <button
                            type="button"
                            onClick={() => setBrandLogoUrl('')}
                            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-300 text-xs font-semibold"
                          >
                            ล้างภาพ
                          </button>
                        )}
                      </div>
                    </div>

                    {brandLogoUrl && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                        <img
                          src={brandLogoUrl}
                          alt="Logo Preview"
                          className="w-12 h-12 object-contain rounded-lg border border-slate-200 bg-white p-1"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800">ภาพโลโก้ปัจจุบันที่เลือก</p>
                          <p className="text-[11px] text-slate-400 truncate font-mono">{brandLogoUrl.startsWith('data:') ? 'ไฟล์อัปโหลดในเครื่อง (Data URL)' : brandLogoUrl}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Form Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetBrandDefaults}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold transition"
                >
                  <RotateCcw className="w-4 h-4 text-slate-400" />
                  <span>คืนค่าเริ่มต้นเดิม (Reset to BB FlexLearn)</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Check className="w-4 h-4" />
                    <span>บันทึกการตั้งค่าแบรนด์ (Save & Apply)</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Right Column: Live Interactive Preview Studio */}
            <div className="lg:col-span-5 space-y-4 sticky top-6">
              <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">ห้องทดสอบแสดงผลตัวอย่างสด (Live Studio)</h3>
                  </div>
                  <span className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Interactive
                  </span>
                </div>

                {/* Preview 1: Header Navbar Mockup */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                    <span>1. แถบเมนูด้านบน (Main Navigation Header)</span>
                    <span className="text-slate-500 text-[10px]">Real-time preview</span>
                  </span>
                  <div className="bg-white text-slate-900 rounded-xl p-3 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <AppLogo
                        size="md"
                        showText={true}
                        overrideSettings={{
                          appName: brandAppName || 'BB FlexLearn',
                          appShortName: brandShortName || 'BB',
                          tagline: brandTagline,
                          logoType: brandLogoType,
                          logoUrl: brandLogoUrl,
                          logoBgColor: brandBgColor,
                          presetLogoId: brandPresetLogoId
                        }}
                      />
                      <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="px-2 py-1 rounded-md bg-slate-100 font-medium text-slate-600">คอร์สเรียน</span>
                        <span className="px-2 py-1 rounded-md bg-slate-100 font-medium text-slate-600">แดชบอร์ด</span>
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                          AD
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview 2: Browser Tab Mockup */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">
                    2. แถบชื่อแท็บในเว็บเบราว์เซอร์ (Browser Tab & Favicon)
                  </span>
                  <div className="bg-slate-950 rounded-xl p-2.5 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-1.5 pb-1 border-b border-slate-800/80">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                      <span className="text-[10px] text-slate-500 font-mono ml-2">Chrome / Edge / Safari</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-800/90 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700/60 max-w-full">
                      <AppLogo
                        size="xs"
                        overrideSettings={{
                          appName: brandAppName || 'BB FlexLearn',
                          appShortName: brandShortName || 'BB',
                          tagline: brandTagline,
                          logoType: brandLogoType,
                          logoUrl: brandLogoUrl,
                          logoBgColor: brandBgColor,
                          presetLogoId: brandPresetLogoId
                        }}
                      />
                      <span className="text-xs font-semibold truncate text-slate-100">
                        {brandAppName || 'BB FlexLearn'} — {brandTagline || 'Enterprise Platform'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Preview 3: Hero Banner Mockup */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">
                    3. การแสดงผลหน้าแรก (Hero Section Banner)
                  </span>
                  <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 rounded-xl p-4 border border-indigo-900/40 text-center space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      <span>{brandTagline || 'Enterprise Digital Learning & Assessment'}</span>
                    </div>
                    <h4 className="text-lg font-black text-white tracking-tight">
                      {brandAppName || 'BB FlexLearn'}
                    </h4>
                    <p className="text-[11px] text-slate-300 max-w-xs mx-auto leading-relaxed">
                      พัฒนาทักษะวิชาชีพชั้นนำด้วยแบบทดสอบทั้งอัตนัยและปรนัย
                    </p>
                  </div>
                </div>

                {/* Preview 4: Official Certificate Seal Mockup */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">
                    4. ตราประทับบนประกาศนียบัตร (Certificate of Completion Seal)
                  </span>
                  <div className="bg-amber-50/10 rounded-xl p-3 border border-amber-500/30 text-amber-200 flex items-center gap-3">
                    <AppLogo
                      size="lg"
                      overrideSettings={{
                        appName: brandAppName || 'BB FlexLearn',
                        appShortName: brandShortName || 'BB',
                        tagline: brandTagline,
                        logoType: brandLogoType,
                        logoUrl: brandLogoUrl,
                        logoBgColor: brandBgColor,
                        presetLogoId: brandPresetLogoId
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-amber-400 font-mono font-bold">
                        VERIFIED BY
                      </p>
                      <p className="text-xs font-bold text-white truncate">
                        {brandAppName || 'BB FlexLearn'} Certified
                      </p>
                      <p className="text-[10px] text-amber-200/70">
                        รหัสรับรองมาตรฐานดิจิทัลสากล
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                    <Check className="w-3.5 h-3.5 text-indigo-400" />
                    <span>ระบบบันทึกความจำอัตโนมัติ (LocalStorage Persistence)</span>
                  </div>
                  <p className="text-slate-400 text-[10px] leading-relaxed">
                    ค่าที่ตั้งไว้จะถูกบันทึกและจดจำในระบบอย่างถาวร แม้รีเฟรชหน้าเว็บหรือเปลี่ยนอุปกรณ์การเข้าใช้งาน
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD USER */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl m-auto max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">เพิ่มผู้ใช้งานใหม่</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">ชื่อ - นามสกุล *</label>
                <input
                  type="text"
                  placeholder="เช่น สมเกียรติ สว่างวงศ์"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">อีเมลผู้ใช้งาน *</label>
                <input
                  type="email"
                  placeholder="user@bbflexlearn.th"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">รหัสผ่านเริ่มต้น * (อย่างน้อย 8 ตัวอักษร)</label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">บทบาท (Role) *</label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as UserRole)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="student">ผู้เรียน (Student)</option>
                  <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">แผนก / สังกัด</label>
                <input
                  type="text"
                  placeholder="เช่น Engineering / Design / ฝ่ายบุคคล"
                  value={newUserDepartment}
                  onChange={e => setNewUserDepartment(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  placeholder="08X-XXX-XXXX"
                  value={newUserPhone}
                  onChange={e => setNewUserPhone(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                >
                  บันทึกผู้ใช้
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPLOAD LESSON VIDEO */}
      {showAddLessonModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl m-auto max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">อัปโหลดบทเรียนวิดีโอใหม่</h3>
                <p className="text-xs text-slate-500">คอร์ส: {activeCourse.title}</p>
              </div>
              <button onClick={() => setShowAddLessonModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLesson} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">ชื่อบทเรียน *</label>
                <input
                  type="text"
                  placeholder="เช่น 06. Performance Auditing with Lighthouse"
                  value={lessonTitle}
                  onChange={e => setLessonTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">ลิงก์ไฟล์คลิปวิดีโอ (Direct MP4 / Stream URL) *</label>
                <input
                  type="text"
                  placeholder="YouTube / Vimeo / Drive หรือ https://.../video.mp4"
                  value={lessonVideoUrl}
                  onChange={e => setLessonVideoUrl(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 font-mono text-[11px]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">ความยาวคลิป (นาที) *</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={lessonDuration}
                    onChange={e => setLessonDuration(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">ความคมชัด</label>
                  <input
                    type="text"
                    disabled
                    value="1080p Full HD"
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-100 text-slate-500"
                  />
                </div>
              </div>

              <LessonCoverField value={lessonCoverUrl} onChange={setLessonCoverUrl} />

              <SubLessonsEditor value={lessonSubLessons} onChange={setLessonSubLessons} />

              <LessonMaterialsField value={lessonResources} onChange={setLessonResources} />

              <div>
                <label className="font-semibold text-slate-700 block mb-1">คำอธิบายและสาระสำคัญของบทเรียน</label>
                <textarea
                  rows={3}
                  placeholder="สรุปเนื้อหาหลักที่ผู้เรียนจะได้รับในบทนี้..."
                  value={lessonDescription}
                  onChange={e => setLessonDescription(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="notifyEnrolled"
                  checked={notifyEnrolled}
                  onChange={e => setNotifyEnrolled(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <label htmlFor="notifyEnrolled" className="text-slate-800 font-medium cursor-pointer">
                  ส่งอีเมลแจ้งเตือนผู้เรียนที่ลงทะเบียนคอร์สนี้ทุกคนโดยอัตโนมัติ
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddLessonModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                >
                  เพิ่มบทเรียน & ส่งแจ้งเตือน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE COURSE */}
      {showAddCourseModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl m-auto max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">สร้างหลักสูตรคอร์สเรียนใหม่</h3>
              <button onClick={() => setShowAddCourseModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">ชื่อคอร์สเรียน *</label>
                <input
                  type="text"
                  placeholder="เช่น Cloud Infrastructure with Kubernetes"
                  value={newCourseTitle}
                  onChange={e => setNewCourseTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <LessonCoverField label="หน้าปกคอร์ส (แสดงในการ์ดเลือกคอร์ส)" value={newCourseCover} onChange={setNewCourseCover} />

              <div>
                <label className="font-semibold text-slate-700 block mb-1">หมวดหมู่คอร์ส *</label>
                <select
                  value={newCourseCategory}
                  onChange={e => setNewCourseCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
                >
                  {courseCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">คำอธิบายสั้น (Subtitle)</label>
                <input
                  type="text"
                  placeholder="เช่น สร้างสถาปัตยกรรมคลาวด์ที่รองรับทราฟฟิกระดับล้านคำขอต่อวินาที"
                  value={newCourseSubtitle}
                  onChange={e => setNewCourseSubtitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">รายละเอียดหลักสูตร (Description)</label>
                <textarea
                  rows={3}
                  placeholder="อธิบายเนื้อหาและจุดเด่นของหลักสูตร..."
                  value={newCourseDesc}
                  onChange={e => setNewCourseDesc(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCourseModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                >
                  สร้างคอร์ส
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT COURSE (admin) */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl m-auto max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">แก้ไขคอร์สเรียน</h3>
              <button onClick={() => setEditingCourse(null)} className="text-slate-400 hover:text-slate-700" aria-label="ปิด">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateCourse} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">ชื่อคอร์สเรียน *</label>
                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600" required />
              </div>
              <LessonCoverField label="หน้าปกคอร์ส (แสดงในการ์ดเลือกคอร์ส)" value={editCover} onChange={setEditCover} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">หมวดหมู่</label>
                  <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 bg-white">
                    {courseCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">ระดับ</label>
                  <select value={editLevel} onChange={e => setEditLevel(e.target.value as Course['level'])} className="w-full p-2.5 rounded-lg border border-slate-200 bg-white">
                    <option value="ระดับเริ่มต้น">ระดับเริ่มต้น</option>
                    <option value="ระดับปานกลาง">ระดับปานกลาง</option>
                    <option value="ระดับสูง">ระดับสูง</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">คำอธิบายสั้น (Subtitle)</label>
                <input type="text" value={editSubtitle} onChange={e => setEditSubtitle(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200" />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">รายละเอียดหลักสูตร</label>
                <textarea rows={3} value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">จำนวนชั่วโมงรวม</label>
                  <input type="number" min={0} step="any" value={editDuration} onChange={e => setEditDuration(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-slate-200" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">รหัสห้องเรียน</label>
                  <input type="text" value={editClassroomCode} onChange={e => setEditClassroomCode(e.target.value)} placeholder="เช่น BB-CLS-101" className="w-full p-2.5 rounded-lg border border-slate-200" />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">ความรู้พื้นฐานที่จำเป็น (บรรทัดละ 1 ข้อ)</label>
                <textarea rows={3} value={editRequirementsText} onChange={e => setEditRequirementsText(e.target.value)} placeholder={'อุปกรณ์คอมพิวเตอร์ แท็บเล็ต หรือสมาร์ทโฟน\nความตั้งใจในการเรียนรู้'} className="w-full p-2.5 rounded-lg border border-slate-200" />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">สิ่งที่จะได้รับจากคอร์ส (บรรทัดละ 1 ข้อ)</label>
                <textarea rows={3} value={editOutcomesText} onChange={e => setEditOutcomesText(e.target.value)} placeholder="เข้าใจหลักการและแนวคิดพื้นฐานอย่างเป็นระบบ" className="w-full p-2.5 rounded-lg border border-slate-200" />
              </div>
              <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                <input type="checkbox" checked={editPublished} onChange={e => setEditPublished(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                เผยแพร่คอร์สให้นักเรียนเห็น
              </label>
              <p className="text-[11px] text-slate-400">บทเรียนและแบบทดสอบเดิมของคอร์สนี้จะไม่ถูกเปลี่ยนแปลง</p>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setEditingCourse(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700">บันทึกการแก้ไข</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: CONFIRM DELETE COURSE (admin) */}
      {pendingDeleteCourse && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl m-auto max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">ลบคอร์สเรียนนี้?</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                ต้องการลบ <strong className="text-slate-700">“{pendingDeleteCourse.title}”</strong> ใช่หรือไม่
                บทเรียน แบบทดสอบ และความก้าวหน้าของผู้เรียนในคอร์สนี้จะถูกลบตามไปด้วย และไม่สามารถกู้คืนได้
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setPendingDeleteCourse(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">ยกเลิก</button>
              <button onClick={handleDeleteCourse} className="px-4 py-2 rounded-lg bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700">ลบคอร์ส</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
