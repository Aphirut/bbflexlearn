/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ApiError, AUTH_EXPIRED_EVENT, fetchBootstrap, getToken, setToken, type Bootstrap } from './api';
import { LoginView } from './components/LoginView';
import { AppProvider, useApp, getCourseCategories } from './context/AppContext';
import { Header } from './components/Header';
import { CourseCard } from './components/CourseCard';
import { CourseDetail } from './components/CourseDetail';
import { LessonPlayerView } from './components/LessonPlayerView';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminPanel } from './components/AdminPanel';
import { QuizModal } from './components/QuizModal';
import { CertificateModal } from './components/CertificateModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { EmailPreviewModal } from './components/EmailPreviewModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { TeacherStudio } from './components/TeacherStudio';
import { AppLogo } from './components/AppLogo';
import { JoinClassroomModal } from './components/JoinClassroomModal';
import { Course, CourseCategory, Certificate, EmailNotification } from './types';
import {
  Search,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Award,
  Smartphone,
  ArrowRight,
  PlayCircle,
  TrendingUp,
  CheckCircle2,
  Users,
  ShieldAlert,
  Lock,
  KeyRound
} from 'lucide-react';

type AppView = 'catalog' | 'my_courses' | 'dashboard' | 'admin' | 'course_detail' | 'lesson_player' | 'teacher_studio';

import { loadNavState, saveNavState } from './utils/navPersistence';

function MainApp() {
  const { currentUser, courses, notifications, certificates, deleteCertificate, appSettings } = useApp();

  // Navigation State
  const [currentView, setCurrentView] = useState<AppView>('catalog');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [targetLessonId, setTargetLessonId] = useState<string | undefined>(undefined);

  // รีเฟรชหน้า: กู้หน้า/คอร์ส/บทเรียนล่าสุดกลับมา ไม่เด้งไปหน้าคอร์ส
  const navRestoredRef = React.useRef(false);
  useEffect(() => {
    if (navRestoredRef.current || courses.length === 0) return;
    navRestoredRef.current = true;
    const nav = loadNavState(localStorage, currentUser.id);
    if (!nav) return;
    if (nav.courseId) {
      const course = courses.find(c => c.id === nav.courseId);
      if (!course) return;
      setSelectedCourse(course);
      if (nav.lessonId && course.lessons.some(l => l.id === nav.lessonId)) {
        setTargetLessonId(nav.lessonId);
      }
    }
    setCurrentView(nav.view as AppView);
  }, [courses, currentUser.id]);

  // บันทึกสถานะนำทางทุกครั้งที่เปลี่ยนหน้า/คอร์ส/บท (หลัง restore เสร็จเท่านั้น กันเขียนทับค่าที่จะกู้)
  useEffect(() => {
    if (!navRestoredRef.current) return;
    saveNavState(localStorage, currentUser.id, {
      view: currentView,
      courseId: selectedCourse?.id,
      lessonId: targetLessonId,
    });
  }, [currentView, selectedCourse?.id, targetLessonId, currentUser.id]);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CourseCategory>('all');

  // Modals State
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [activeQuizType, setActiveQuizType] = useState<'pre_test' | 'post_test'>('pre_test');
  const [activeCert, setActiveCert] = useState<Certificate | null>(null);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [notificationsDrawerOpen, setNotificationsDrawerOpen] = useState(false);
  const [previewEmail, setPreviewEmail] = useState<EmailNotification | null>(null);
  const [joinClassroomOpen, setJoinClassroomOpen] = useState(false);

  // Handlers
  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    setCurrentView('course_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartLesson = (lessonId: string) => {
    setTargetLessonId(lessonId);
    setCurrentView('lesson_player');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPreTest = (course?: Course) => {
    if (course) setSelectedCourse(course);
    setActiveQuizType('pre_test');
    setQuizModalOpen(true);
  };

  const handleOpenPostTest = (course?: Course) => {
    if (course) setSelectedCourse(course);
    setActiveQuizType('post_test');
    setQuizModalOpen(true);
  };

  const handleOpenCertificate = (cert: Certificate) => {
    setActiveCert(cert);
    setCertModalOpen(true);
  };

  const handleOpenCertificateByCourseId = (courseId: string) => {
    // เปิดเฉพาะใบประกาศฯ จริงของผู้ใช้ในคอร์สนี้ ถ้ายังไม่มีจะไม่สร้างปลอมขึ้นมา
    const cert = certificates.find(c => c.courseId === courseId && c.userId === currentUser.id);
    if (!cert) return;
    setActiveCert(cert);
    setCertModalOpen(true);
  };

  const handleOpenEmailPreviewById = (emailId: string) => {
    const notif = notifications.find(n => n.id === emailId);
    if (notif) {
      setPreviewEmail(notif);
    }
  };

  // Filtered courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesView = currentView === 'my_courses' ? currentUser.enrolledCourseIds.includes(course.id) : true;
    return matchesSearch && matchesCat && matchesView;
  });

  const featuredCourse = courses[0];

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 1-Row 3-Zone Header Contract */}
      <Header
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenNotifications={() => setNotificationsDrawerOpen(true)}
        onOpenJoinClassroom={() => setJoinClassroomOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8">
        
        {/* VIEW 1: CATALOG OR MY COURSES */}
        {(currentView === 'catalog' || currentView === 'my_courses') && (
          <div className="space-y-10">
            
            {/* World-Class Hero Section */}
            {currentView === 'catalog' && (
              <div className="relative rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-12 overflow-hidden shadow-2xl border border-slate-800">
                {/* Ambient glow mesh */}
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                  {/* Left Column: Value Prop */}
                  <div className="lg:col-span-7 space-y-5">
                    {/* Quiet Editorial Tag (Zero-Pill) */}
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 tracking-wider">
                      <span className="uppercase font-mono">{appSettings.appName} Academy</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="text-slate-300">{appSettings.tagline || 'มาตรฐานการเรียนรู้ออนไลน์ระดับองค์กร 2026'}</span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] text-white">
                      ยกระดับทักษะแห่งอนาคต ด้วยระบบการเรียนรู้แบบโต้ตอบ
                    </h1>

                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                      เรียนรู้ผ่านคลิปวิดีโอ Full HD ระบบทดสอบประมวลผลทันทีก่อนเรียนและหลังเรียน พร้อมออกใบประกาศนียบัตรดิจิทัลอย่างเป็นทางการแบบเรียลไทม์ รองรับทั้ง PC, iOS และ Android
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        onClick={() => {
                          const catalogElem = document.getElementById('courses-section');
                          catalogElem?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 active:scale-95 cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>สำรวจคอร์สเรียนทั้งหมด</span>
                      </button>

                      <button
                        onClick={() => setJoinClassroomOpen(true)}
                        className="px-5 py-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs font-semibold transition-all backdrop-blur-sm flex items-center gap-2 active:scale-95 cursor-pointer"
                      >
                        <KeyRound className="w-4 h-4 text-indigo-300" />
                        <span>มีรหัสห้องเรียน? ใส่รหัสที่นี่</span>
                      </button>

                      <button
                        onClick={() => setCurrentView('dashboard')}
                        className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-semibold transition-all backdrop-blur-sm flex items-center gap-2 active:scale-95 cursor-pointer"
                      >
                        <span>ไปที่แดชบอร์ดสรุปผล</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quantitative Proof Strip */}
                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800 text-slate-300">
                      <div>
                        <div className="text-lg sm:text-2xl font-bold font-mono text-white tabular-nums">12,500+</div>
                        <div className="text-[11px] text-slate-400">ผู้เรียนจบหลักสูตร</div>
                      </div>
                      <div>
                        <div className="text-lg sm:text-2xl font-bold font-mono text-emerald-400 tabular-nums">98.4%</div>
                        <div className="text-[11px] text-slate-400">ความพึงพอใจเนื้อหา</div>
                      </div>
                      <div>
                        <div className="text-lg sm:text-2xl font-bold font-mono text-amber-400 tabular-nums">100%</div>
                        <div className="text-[11px] text-slate-400">ออกใบประกาศอัตโนมัติ</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Featured Interactive Spotlight Card */}
                  {featuredCourse && (
                    <div className="lg:col-span-5">
                      <div className="relative rounded-2xl bg-slate-900/90 border border-slate-700/80 p-5 shadow-2xl backdrop-blur-md space-y-4">
                        <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800">
                          <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                            <Sparkles className="w-4 h-4" />
                            <span>คอร์สแนะนำประจำสัปดาห์</span>
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">1080p Full HD</span>
                        </div>

                        {/* Interactive Spotlight Info */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
                            <span>{featuredCourse.categoryNameTh}</span>
                            <span>·</span>
                            <span>{featuredCourse.level}</span>
                          </div>
                          <h2 className="text-lg font-bold text-white line-clamp-1">
                            {featuredCourse.title}
                          </h2>
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {featuredCourse.subtitle}
                          </p>
                        </div>

                        {/* Video Teaser Bar */}
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-xs text-slate-300">
                            <span className="flex items-center gap-1.5 font-medium">
                              <PlayCircle className="w-4 h-4 text-indigo-400" />
                              <span>บทที่ 01: สถาปัตยกรรม Web App ยุคใหม่</span>
                            </span>
                            <span className="font-mono text-[11px] text-slate-400">18:00 นาที</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-[65%]" />
                          </div>
                        </div>

                        <button
                          onClick={() => handleSelectCourse(featuredCourse)}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow"
                        >
                          <span>เริ่มเรียนคอร์สนี้ทันที</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* My Courses Title Header */}
            {currentView === 'my_courses' && (
              <div className="pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-mono tracking-wider text-indigo-600 font-bold">
                    My Learning
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-500">{currentUser.name}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                  คอร์สเรียนของฉัน (My Enrolled Courses)
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  หลักสูตรที่คุณได้ลงทะเบียนไว้ สามารถเข้าเรียนต่อและดาวน์โหลดใบประกาศได้ที่นี่
                </p>
              </div>
            )}

            {/* Search and Category Filter Bar */}
            <div id="courses-section" className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
              {/* Category Segmented Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full p-1.5 bg-slate-200/70 rounded-2xl">
                {[
                  { id: 'all', label: 'ทั้งหมด' },
                  ...getCourseCategories(appSettings)
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as CourseCategory)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search Box & Join Classroom Button */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อคอร์ส หรือชื่อผู้สอน..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-slate-200/90 bg-white focus:outline-none focus:border-indigo-600 shadow-sm"
                  />
                </div>
                <button
                  onClick={() => setJoinClassroomOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-xs font-bold transition shrink-0 shadow-2xs active:scale-95 cursor-pointer"
                  title="ใส่รหัสห้องเรียนเพื่อเข้าร่วมทันที"
                >
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">ใส่รหัสห้องเรียน</span>
                  <span className="sm:hidden">รหัส</span>
                </button>
              </div>
            </div>

            {/* Course Grid */}
            {filteredCourses.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 space-y-3 shadow-sm">
                <BookOpen className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-base font-bold text-slate-700">ไม่พบคอร์สเรียนที่ตรงกับเงื่อนไขการค้นหา</p>
                <p className="text-xs text-slate-400">ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่นๆ</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold shadow hover:bg-slate-800 transition-colors"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {filteredCourses.map(course => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onSelect={handleSelectCourse}
                    onOpenCertificate={handleOpenCertificateByCourseId}
                  />
                ))}
              </div>
            )}

          </div>
        )}

        {/* VIEW 2: COURSE DETAIL */}
        {currentView === 'course_detail' && selectedCourse && (
          <CourseDetail
            course={selectedCourse}
            onBack={() => setCurrentView('catalog')}
            onStartLesson={handleStartLesson}
            onOpenPreTest={() => handleOpenPreTest(selectedCourse)}
            onOpenPostTest={() => handleOpenPostTest(selectedCourse)}
            onOpenCertificate={() => handleOpenCertificateByCourseId(selectedCourse.id)}
          />
        )}

        {/* VIEW 3: LESSON PLAYER VIEW */}
        {currentView === 'lesson_player' && selectedCourse && (
          <LessonPlayerView
            course={selectedCourse}
            initialLessonId={targetLessonId}
            onBack={() => setCurrentView('course_detail')}
            onOpenPreTest={() => handleOpenPreTest(selectedCourse)}
            onOpenPostTest={() => handleOpenPostTest(selectedCourse)}
            onOpenCertificate={handleOpenCertificate}
            onActiveLessonChange={(lessonId) => setTargetLessonId(lessonId)}
          />
        )}

        {/* VIEW 4: STUDENT DASHBOARD */}
        {currentView === 'dashboard' && (
          <StudentDashboard
            onSelectCourse={handleSelectCourse}
            onOpenCertificate={handleOpenCertificate}
            onBrowseCourses={() => setCurrentView('catalog')}
            onOpenJoinClassroom={() => setJoinClassroomOpen(true)}
          />
        )}

        {/* VIEW 5: ADMIN PANEL */}
        {currentView === 'admin' && (
          currentUser.role === 'admin' ? (
            <AdminPanel
              onPreviewEmail={handleOpenEmailPreviewById}
            />
          ) : (
            <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded font-semibold border border-rose-200">
                  Admin Access Required · เฉพาะผู้ดูแลระบบ
                </span>
                <h2 className="text-xl font-bold text-slate-900 pt-2">
                  คุณไม่มีสิทธิ์เข้าถึงแผงควบคุมผู้ดูแลระบบ
                </h2>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  บัญชีปัจจุบันของคุณคือ <strong>{currentUser.name}</strong> ({currentUser.role === 'student' ? 'ผู้เรียน' : 'อาจารย์'}) พื้นที่นี้สงวนไว้เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentView('catalog')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
                >
                  กลับสู่หน้าหลักคอร์สเรียน
                </button>
              </div>
            </div>
          )
        )}

        {/* VIEW 6: TEACHER STUDIO (ห้องเรียนครู & เครื่องมือสร้างแบบทดสอบ) */}
        {currentView === 'teacher_studio' && (
          (currentUser.role === 'teacher' || currentUser.role === 'admin') ? (
            <TeacherStudio
              onSelectCourse={handleSelectCourse}
              onOpenPreviewQuiz={(c, qType) => {
                setSelectedCourse(c);
                setActiveQuizType(qType);
                setQuizModalOpen(true);
              }}
            />
          ) : (
            <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded font-semibold border border-amber-200">
                  Role Restricted · สิทธิ์เฉพาะอาจารย์ผู้สอน
                </span>
                <h2 className="text-xl font-bold text-slate-900 pt-2">
                  ผู้เรียนไม่สามารถสร้างหรือแก้ไขคอร์สและแบบทดสอบได้
                </h2>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  บัญชีปัจจุบันของคุณคือ <strong>{currentUser.name}</strong> ในสถานะ <strong>ผู้เรียน (Student)</strong> ซึ่งมีสิทธิ์ในการเข้าเรียน ทำแบบทดสอบ Pre/Post-test จดบันทึก และรับใบประกาศนียบัตรเท่านั้น
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-1.5">
                <p className="font-bold text-slate-800">ระบบรักษาความปลอดภัยแบบ Role-Based Access Control (RBAC):</p>
                <p>• <strong>ผู้เรียน (Student):</strong> เรียนวิดีโอ, ทำแบบทดสอบ, จดบันทึก, ดู Leaderboard</p>
                <p>• <strong>อาจารย์ (Teacher):</strong> สร้างคอร์ส, จัดการบทเรียน, ออกข้อสอบอัตนัย-ปรนัย, ตรวจข้อสอบ</p>
                <p>• <strong>ผู้ดูแลระบบ (Admin):</strong> บริหารจัดการผู้ใช้, ตรวจสอบ Analytics, ตั้งค่าแบรนด์ & โลโก้</p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentView('catalog')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
                >
                  กลับไปสำรวจคอร์สเรียน
                </button>
              </div>
            </div>
          )
        )}

      </main>

      {/* QUIZ MODAL */}
      {selectedCourse && (
        <QuizModal
          course={selectedCourse}
          quizType={activeQuizType}
          isOpen={quizModalOpen}
          onClose={() => setQuizModalOpen(false)}
          onCertificateUnlocked={handleOpenCertificate}
        />
      )}

      {/* CERTIFICATE MODAL */}
      {activeCert && (
        <CertificateModal
          certificate={activeCert}
          isOpen={certModalOpen}
          onClose={() => setCertModalOpen(false)}
          canDelete={currentUser.role === 'admin'}
          onDelete={(certId) => {
            deleteCertificate(certId);
            setActiveCert(null);
            setCertModalOpen(false);
          }}
        />
      )}

      {/* NOTIFICATIONS DRAWER */}
      <NotificationsDrawer
        isOpen={notificationsDrawerOpen}
        onClose={() => setNotificationsDrawerOpen(false)}
        onSelectNotification={(n) => {
          setPreviewEmail(n);
          setNotificationsDrawerOpen(false);
        }}
      />

      {/* EMAIL PREVIEW MODAL */}
      <EmailPreviewModal
        notification={previewEmail}
        isOpen={!!previewEmail}
        onClose={() => setPreviewEmail(null)}
      />

      {/* JOIN CLASSROOM WITH CODE MODAL */}
      <JoinClassroomModal
        isOpen={joinClassroomOpen}
        onClose={() => setJoinClassroomOpen(false)}
        onJoinSuccess={(course) => handleSelectCourse(course)}
      />

      {/* Mobile Bottom Touch Navigation */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenNotifications={() => setNotificationsDrawerOpen(true)}
      />

      {/* PWA Offline Connectivity Indicator */}
      <OfflineIndicator />

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-8 px-4 sm:px-6 text-center text-xs text-slate-500 hidden md:block no-print mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AppLogo size="xs" />
            <span className="font-bold text-slate-800">{appSettings.appName || 'BB FlexLearn'}</span>
            <span className="text-slate-300">·</span>
            <span>{appSettings.tagline || 'แพลตฟอร์มคอร์สเรียนออนไลน์แบบโต้ตอบ รองรับทุกอุปกรณ์'}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-600 font-medium">
            <span className="hover:text-slate-900 cursor-pointer">นโยบายความเป็นส่วนตัว (PDPA)</span>
            <span>·</span>
            <span className="hover:text-slate-900 cursor-pointer">เงื่อนไขการออกใบประกาศนียบัตร</span>
            <span>·</span>
            <span className="hover:text-slate-900 cursor-pointer">ติดต่อผู้ดูแลระบบ</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  const [boot, setBoot] = useState<Bootstrap | null>(null);
  const [loading, setLoading] = useState<boolean>(() => !!getToken());
  const [notice, setNotice] = useState<string | undefined>();

  const load = () => {
    setLoading(true);
    fetchBootstrap()
      .then(setBoot)
      .catch(err => {
        if (err instanceof ApiError && err.status === 401) { setToken(null); setNotice('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่'); }
        else setNotice('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่');
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => { if (getToken()) load(); else setLoading(false); }, []);
  useEffect(() => {
    const onExpired = () => { setToken(null); setBoot(null); setNotice('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่'); };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-sm text-slate-500">กำลังโหลดข้อมูล...</div>
    );
  }
  if (!boot) return <LoginView notice={notice} onAuthed={load} />;

  return (
    <AppProvider key={boot.currentUserId} initial={boot} onLogout={() => { setToken(null); setBoot(null); setNotice(undefined); }}>
      <MainApp />
    </AppProvider>
  );
}
