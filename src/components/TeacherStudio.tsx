import React, { useState } from 'react';
import { useApp, getCourseCategories } from '../context/AppContext';
import {
  Course,
  QuizQuestion,
  QuizQuestionType,
  Lesson,
  LessonResource,
  CourseCategory,
  CourseLevel,
  UserCourseProgress,
  CertificateTemplate,
  CertificatePresetTheme
} from '../types';
import {
  GraduationCap,
  Plus,
  BookOpen,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
  Copy,
  Check,
  Video,
  ListPlus,
  FileText,
  Sliders,
  ChevronDown,
  ChevronUp,
  Award,
  AlertCircle,
  Eye,
  ArrowRight,
  Save,
  X,
  Share2,
  Users,
  Upload,
  Image as ImageIcon,
  Stamp,
  Palette,
  Layers,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

import { LessonCoverField, normalizeImageUrl } from './LessonCoverField';
import { SubLessonsEditor } from './SubLessonsEditor';
import { QuizBuilderField } from './QuizBuilderField';
import { suggestSubjectiveGrade } from '../api';
import { cleanQuiz } from '../utils/lessonQuizzes';
import { LessonMaterialsField } from './LessonMaterialsField';
import type { Quiz, SubLesson } from '../types';

interface TeacherStudioProps {
  onSelectCourse?: (course: Course) => void;
  onOpenPreviewQuiz?: (course: Course, type: 'pre_test' | 'post_test') => void;
}

type StudioTab = 'my_classrooms' | 'create_course' | 'grading_hub' | 'certificate_studio';

export const TeacherStudio: React.FC<TeacherStudioProps> = ({ onSelectCourse, onOpenPreviewQuiz }) => {
  const { currentUser, courses, users, progressList, addCourse, updateCourse, deleteCourse, gradeSubjectiveSubmission, appSettings } = useApp();
  const courseCategories = getCourseCategories(appSettings);

  if (currentUser.role === 'student') {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded font-semibold border border-amber-200">
            Role Restricted · สิทธิ์เฉพาะอาจารย์ผู้สอน
          </span>
          <h2 className="text-xl font-bold text-slate-900 pt-2">
            พื้นที่นี้เฉพาะอาจารย์ผู้สอน (Teacher Only)
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            บัญชีของคุณคือ <strong>{currentUser.name}</strong> ในสถานะ <strong>ผู้เรียน (Student)</strong> ซึ่งไม่มีสิทธิ์ในการสร้างห้องเรียน หรือแก้ไขคอร์สและข้อสอบ
          </p>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<StudioTab>('my_classrooms');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Editing course state (null = creating new course)
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // Creator Form Steps: 1 = Basic Info, 2 = Lessons, 3 = Versatile Quizzes
  const [creatorStep, setCreatorStep] = useState<1 | 2 | 3>(1);

  // Form State: Course Metadata
  const [title, setTitle] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CourseCategory>('web_dev');
  const [level, setLevel] = useState<CourseLevel>('ระดับปานกลาง');
  const [classroomCode, setClassroomCode] = useState(() => `BB-CLS-${Math.floor(100 + Math.random() * 900)}`);
  const [instructorName, setInstructorName] = useState(currentUser.name);
  const [instructorTitle, setInstructorTitle] = useState('อาจารย์ผู้สอนประจำหลักสูตร');
  const [organization, setOrganization] = useState('สถาบันการเรียนรู้ดิจิทัล BB FlexLearn');
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>([
    'เข้าใจหลักการและแนวคิดพื้นฐานอย่างเป็นระบบ',
    'สามารถนำไปประยุกต์ใช้งานได้จริงในสถานการณ์จำลอง',
    'ผ่านการทดสอบวัดผลทั้งแบบปรนัยและอัตนัย'
  ]);
  const [newOutcome, setNewOutcome] = useState('');
  const DEFAULT_REQUIREMENTS = ['อุปกรณ์คอมพิวเตอร์ แท็บเล็ต หรือสมาร์ทโฟน', 'ความตั้งใจในการเรียนรู้'];
  const [requirements, setRequirements] = useState<string[]>(DEFAULT_REQUIREMENTS);
  const [newRequirement, setNewRequirement] = useState('');

  // Form State: Lessons
  const [lessons, setLessons] = useState<Lesson[]>([
    {
      id: 'lesson-temp-1',
      title: '01. บทนำและภาพรวมของหลักสูตร',
      description: 'ปูพื้นฐานแนวคิดสำคัญและเป้าหมายการเรียนรู้ตลอดหลักสูตร',
      durationMinutes: 20,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      order: 1,
      keyTakeaways: ['เข้าใจภาพรวมหลักสูตร', 'การตั้งค่าและเตรียมพร้อมสภาพแวดล้อม']
    }
  ]);

  // Lesson Edit Modal
  const [editingLessonIndex, setEditingLessonIndex] = useState<number | null>(null);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [lessonForm, setLessonForm] = useState<{
    title: string;
    description: string;
    durationMinutes: number;
    videoUrl: string;
    coverImageUrl: string;
    subLessons: SubLesson[];
    resources: LessonResource[];
    keyTakeawaysText: string;
    quiz?: Quiz;
  }>({
    title: '',
    description: '',
    durationMinutes: 15,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    coverImageUrl: '',
    subLessons: [],
    resources: [],
    keyTakeawaysText: ''
  });

  // Form State: Quizzes (Pre-test & Post-test)
  const [activeQuizTab, setActiveQuizTab] = useState<'pre_test' | 'post_test'>('pre_test');
  const [preTestPassing, setPreTestPassing] = useState<number>(60);
  const [postTestPassing, setPostTestPassing] = useState<number>(75);

  const [preTestQuestions, setPreTestQuestions] = useState<QuizQuestion[]>([
    {
      id: `q-pre-${Date.now()}-1`,
      question: 'ข้อใดอธิบายเป้าหมายหลักของหลักสูตรนี้ได้ถูกต้องที่สุด?',
      type: 'multiple_choice',
      options: [
        'เพื่อเรียนรู้และยกระดับทักษะอย่างเป็นขั้นตอน',
        'เพื่อท่องจำทฤษฎีโดยไม่ต้องลงมือปฏิบัติ',
        'เพื่อจำกัดการใช้งานบนระบบเดียวเท่านั้น',
        'เพื่อหลีกเลี่ยงการทดสอบวัดผล'
      ],
      correctIndex: 0,
      points: 1,
      explanation: 'หลักสูตรนี้มุ่งเน้นการสร้างความเข้าใจอย่างเป็นระบบและนำไปปรับใช้ได้จริง'
    },
    {
      id: `q-pre-${Date.now()}-2`,
      question: 'ให้ระบุคำสำคัญหรือแนวคิดหลักของวิชานี้ (อัตนัย ตอบสั้น)',
      type: 'subjective_short',
      sampleAnswer: 'การเรียนรู้แบบโต้ตอบ',
      keywords: ['โต้ตอบ', 'interactive', 'flexlearn', 'ระบบ', 'ทักษะ'],
      points: 2,
      explanation: 'การเรียนรู้ที่มีประสิทธิภาพต้องอาศัยการลงมือปฏิบัติและการมีปฏิสัมพันธ์สองทาง'
    }
  ]);

  const [postTestQuestions, setPostTestQuestions] = useState<QuizQuestion[]>([
    {
      id: `q-post-${Date.now()}-1`,
      question: 'จริงหรือไม่: "ระบบการเรียนรู้ยุคใหม่รองรับการใช้งานได้ทุกแพลตฟอร์มทั้ง PC, iOS และ Android"',
      type: 'true_false',
      options: ['จริง (True)', 'เท็จ (False)'],
      correctIndex: 0,
      points: 2,
      explanation: 'ระบบได้รับการออกแบบให้เป็น Cross-Platform Responsive รองรับทุกหน้าจอ'
    },
    {
      id: `q-post-${Date.now()}-2`,
      question: 'กรณีศึกษา: ให้อธิบายวิธีการประยุกต์ใช้ความรู้จากบทเรียนเพื่อแก้ปัญหาในชีวิตจริง พร้อมระบุขั้นตอนอย่างละเอียด (อัตนัย ความเรียง/วิเคราะห์)',
      type: 'subjective_essay',
      points: 5,
      maxWords: 200,
      rubricGuide: 'เกณฑ์ Rubric (5 คะแนน): 1. ระบุปัญหาและเป้าหมายชัดเจน (2 คะแนน), 2. เสนอแนวทางแก้ปัญหาตามเนื้อหาบทเรียน (2 คะแนน), 3. ความสมบูรณ์ของภาษาและความคิดสร้างสรรค์ (1 คะแนน)',
      sampleAnswer: 'แนวทางการตอบ: 1. วิเคราะห์ Pain Point 2. เลือกใช้เครื่องมือที่เหมาะสม 3. ดำเนินการตาม Best Practices และประเมินผลอย่างต่อเนื่อง',
      explanation: 'การวิเคราะห์กรณีศึกษาช่วยวัดความสามารถในการคิดขั้นสูงและการประยุกต์ใช้'
    }
  ]);

  // Question Creator Modal
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionForm, setQuestionForm] = useState<{
    question: string;
    type: QuizQuestionType;
    points: number;
    options: string[];
    correctIndex: number;
    correctIndices: number[];
    explanation: string;
    sampleAnswer: string;
    keywordsText: string;
    rubricGuide: string;
    maxWords: number;
  }>({
    question: '',
    type: 'multiple_choice',
    points: 1,
    options: ['', '', '', ''],
    correctIndex: 0,
    correctIndices: [0],
    explanation: '',
    sampleAnswer: '',
    keywordsText: '',
    rubricGuide: '',
    maxWords: 200
  });

  // Grading Hub Drawer & State
  const [selectedSubmissionToGrade, setSelectedSubmissionToGrade] = useState<{
    course: Course;
    user: (typeof users)[0];
    progress: UserCourseProgress;
    quizType: 'pre_test' | 'post_test';
  } | null>(null);

  const [gradingDraft, setGradingDraft] = useState<Record<string, { scoreAwarded: number; teacherComment: string }>>({});
  const [aiGradingQid, setAiGradingQid] = useState<string | null>(null);
  const [aiGradeError, setAiGradeError] = useState<{ qId: string; message: string } | null>(null);

  /** ให้ AI เสนอคะแนน+ข้อเสนอแนะลงในฟอร์ม — ครูแก้ไขได้และต้องกดบันทึกเอง */
  const handleAiSuggestGrade = async (qId: string, studentAnswer: string) => {
    if (!selectedSubmissionToGrade) return;
    setAiGradingQid(qId);
    setAiGradeError(null);
    try {
      const r = await suggestSubjectiveGrade({
        courseId: selectedSubmissionToGrade.course.id,
        quizType: selectedSubmissionToGrade.quizType,
        questionId: qId,
        studentAnswer,
      });
      setGradingDraft(prev => ({ ...prev, [qId]: { scoreAwarded: r.score, teacherComment: r.comment } }));
    } catch (err) {
      setAiGradeError({ qId, message: err instanceof Error ? err.message : 'เรียก AI ไม่สำเร็จ' });
    } finally {
      setAiGradingQid(null);
    }
  };

  // Certificate Studio State
  const [certCourseId, setCertCourseId] = useState<string>(() => courses[0]?.id || '');
  const [certTemplateType, setCertTemplateType] = useState<'preset' | 'custom_upload'>('preset');
  const [certPresetId, setCertPresetId] = useState<CertificatePresetTheme>('royal_gold');
  const [certCustomBgUrl, setCertCustomBgUrl] = useState<string>('');
  const [certDocTitleTh, setCertDocTitleTh] = useState<string>('ใบประกาศนียบัตรจบหลักสูตร');
  const [certDocTitleEn, setCertDocTitleEn] = useState<string>('Certificate of Competence & Professional Mastery');
  const [certOrgName, setCertOrgName] = useState<string>('BB FlexLearn Academy');
  const [certOrgSubtitle, setCertOrgSubtitle] = useState<string>('สถาบันการเรียนรู้และพัฒนาทักษะดิจิทัลแห่งประเทศไทย');
  const [certCustomLogoUrl, setCertCustomLogoUrl] = useState<string>('');
  const [certSignatureType, setCertSignatureType] = useState<'text' | 'image'>('text');
  const [certSignatureImageUrl, setCertSignatureImageUrl] = useState<string>('');
  const [certSignerName, setCertSignerName] = useState<string>(currentUser.name);
  const [certSignerTitle, setCertSignerTitle] = useState<string>('อาจารย์ผู้สอนประจำหลักสูตร');
  const [certSealStyle, setCertSealStyle] = useState<'gold' | 'silver' | 'emerald' | 'tech'>('gold');
  const [certShowSeal, setCertShowSeal] = useState<boolean>(true);
  const [certSavedSuccess, setCertSavedSuccess] = useState<boolean>(false);
  const [certPreviewZoom, setCertPreviewZoom] = useState<boolean>(false);

  // Helper to sync certificate form when selecting a course
  const loadCertificateTemplateForCourse = (targetCourse: Course) => {
    const tmpl = targetCourse.certificateTemplate;
    if (tmpl) {
      setCertTemplateType(tmpl.templateType || 'preset');
      setCertPresetId(tmpl.presetId || 'royal_gold');
      setCertCustomBgUrl(tmpl.customBackgroundUrl || '');
      setCertDocTitleTh(tmpl.documentTitleTh || 'ใบประกาศนียบัตรจบหลักสูตร');
      setCertDocTitleEn(tmpl.documentTitleEn || 'Certificate of Competence & Professional Mastery');
      setCertOrgName(tmpl.organizationName || targetCourse.instructor.organization || 'BB FlexLearn Academy');
      setCertOrgSubtitle(tmpl.organizationSubtitle || 'สถาบันการเรียนรู้และพัฒนาทักษะดิจิทัลแห่งประเทศไทย');
      setCertCustomLogoUrl(tmpl.customLogoUrl || '');
      setCertSignatureType(tmpl.signatureType || 'text');
      setCertSignatureImageUrl(tmpl.signatureImageUrl || '');
      setCertSignerName(tmpl.signerName || targetCourse.instructor.name);
      setCertSignerTitle(tmpl.signerTitle || targetCourse.instructor.title);
      setCertSealStyle(tmpl.sealStyle || 'gold');
      setCertShowSeal(tmpl.showSeal !== false);
    } else {
      setCertTemplateType('preset');
      setCertPresetId('royal_gold');
      setCertCustomBgUrl('');
      setCertDocTitleTh('ใบประกาศนียบัตรจบหลักสูตร');
      setCertDocTitleEn('Certificate of Competence & Professional Mastery');
      setCertOrgName(targetCourse.instructor.organization || 'BB FlexLearn Academy');
      setCertOrgSubtitle('สถาบันการเรียนรู้และพัฒนาทักษะดิจิทัลแห่งประเทศไทย');
      setCertCustomLogoUrl('');
      setCertSignatureType('text');
      setCertSignatureImageUrl('');
      setCertShowSeal(true);
      setCertSignerName(targetCourse.instructor.name || currentUser.name);
      setCertSignerTitle(targetCourse.instructor.title || 'อาจารย์ผู้สอนประจำหลักสูตร');
      setCertSealStyle('gold');
    }
  };

  const handleCertificateBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('ไฟล์ภาพพื้นหลังมีขนาดเกิน 5MB กรุณาเลือกไฟล์ที่มีขนาดเล็กกว่า');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCertCustomBgUrl(event.target.result as string);
        setCertTemplateType('custom_upload');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCertificateLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCertCustomLogoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCertSignatureImageUrl(event.target.result as string);
        setCertSignatureType('image');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCertificateTemplate = (applyToAll: boolean = false) => {
    const newTemplate: CertificateTemplate = {
      templateType: certTemplateType,
      presetId: certPresetId,
      customBackgroundUrl: certCustomBgUrl || undefined,
      documentTitleTh: certDocTitleTh,
      documentTitleEn: certDocTitleEn,
      organizationName: certOrgName,
      organizationSubtitle: certOrgSubtitle,
      customLogoUrl: certCustomLogoUrl || undefined,
      signatureType: certSignatureType,
      signatureImageUrl: certSignatureImageUrl || undefined,
      signerName: certSignerName,
      showSeal: certShowSeal,
      signerTitle: certSignerTitle,
      sealStyle: certSealStyle
    };

    if (applyToAll) {
      courses.forEach(c => {
        updateCourse({
          ...c,
          certificateTemplate: newTemplate
        });
      });
    } else {
      const targetCourse = courses.find(c => c.id === certCourseId) || courses[0];
      if (targetCourse) {
        updateCourse({
          ...targetCourse,
          certificateTemplate: newTemplate
        });
      }
    }

    setCertSavedSuccess(true);
    setTimeout(() => setCertSavedSuccess(false), 3000);
  };

  // Helper to load course for editing
  const handleEditCourse = (course: Course) => {
    setEditingCourseId(course.id);
    loadCertificateTemplateForCourse(course);
    setTitle(course.title);
    setCoverImageUrl(course.coverImageUrl || '');
    setSubtitle(course.subtitle);
    setDescription(course.description);
    setCategory(course.category);
    setLevel(course.level);
    setClassroomCode(course.classroomCode || `BB-CLS-${Math.floor(100 + Math.random() * 900)}`);
    setInstructorName(course.instructor.name);
    setInstructorTitle(course.instructor.title);
    setOrganization(course.instructor.organization);
    setLearningOutcomes(course.learningOutcomes || []);
    setRequirements(course.requirements?.length ? course.requirements : DEFAULT_REQUIREMENTS);
    setLessons(course.lessons || []);
    setPreTestPassing(course.preTest.passingScorePercent || 60);
    setPostTestPassing(course.postTest.passingScorePercent || 75);
    setPreTestQuestions(course.preTest.questions || []);
    setPostTestQuestions(course.postTest.questions || []);
    setCreatorStep(1);
    setActiveTab('create_course');
  };

  const handleResetCreatorForm = () => {
    setEditingCourseId(null);
    setTitle('');
    setCoverImageUrl('');
    setSubtitle('');
    setDescription('');
    setCategory('web_dev');
    setLevel('ระดับปานกลาง');
    setClassroomCode(`BB-CLS-${Math.floor(100 + Math.random() * 900)}`);
    setInstructorName(currentUser.name);
    setInstructorTitle('อาจารย์ผู้สอนประจำหลักสูตร');
    setOrganization('สถาบันการเรียนรู้ดิจิทัล BB FlexLearn');
    setLearningOutcomes([
      'เข้าใจหลักการและแนวคิดพื้นฐานอย่างเป็นระบบ',
      'สามารถนำไปประยุกต์ใช้งานได้จริงในสถานการณ์จำลอง',
      'ผ่านการทดสอบวัดผลทั้งแบบปรนัยและอัตนัย'
    ]);
    setRequirements(DEFAULT_REQUIREMENTS);
    setLessons([
      {
        id: `lesson-init-${Date.now()}`,
        title: '01. บทนำและภาพรวมของหลักสูตร',
        description: 'ปูพื้นฐานแนวคิดสำคัญและเป้าหมายการเรียนรู้ตลอดหลักสูตร',
        durationMinutes: 20,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        order: 1,
        keyTakeaways: ['เข้าใจภาพรวมหลักสูตร', 'การตั้งค่าและเตรียมพร้อมสภาพแวดล้อม']
      }
    ]);
    setPreTestPassing(60);
    setPostTestPassing(75);
    setCreatorStep(1);
  };

  // Outcome helpers
  const handleAddOutcome = () => {
    if (newOutcome.trim()) {
      setLearningOutcomes([...learningOutcomes, newOutcome.trim()]);
      setNewOutcome('');
    }
  };

  const handleEditOutcome = (idx: number, value: string) => {
    setLearningOutcomes(learningOutcomes.map((o, i) => (i === idx ? value : o)));
  };

  const handleRemoveOutcome = (idx: number) => {
    setLearningOutcomes(learningOutcomes.filter((_, i) => i !== idx));
  };

  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      setRequirements([...requirements, newRequirement.trim()]);
      setNewRequirement('');
    }
  };

  const handleRemoveRequirement = (idx: number) => {
    setRequirements(requirements.filter((_, i) => i !== idx));
  };

  // Lesson helpers
  const handleOpenAddLesson = () => {
    setEditingLessonIndex(null);
    setLessonForm({
      title: '',
      description: '',
      durationMinutes: 15,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      coverImageUrl: '',
      subLessons: [],
      resources: [],
      keyTakeawaysText: ''
    });
    setLessonModalOpen(true);
  };

  const handleOpenEditLesson = (idx: number) => {
    const l = lessons[idx];
    setEditingLessonIndex(idx);
    setLessonForm({
      title: l.title,
      description: l.description,
      durationMinutes: l.durationMinutes,
      videoUrl: l.videoUrl,
      coverImageUrl: l.coverImageUrl || '',
      subLessons: l.subLessons || [],
      keyTakeawaysText: (l.keyTakeaways || []).join('\n'),
      resources: l.resources || [],
      quiz: l.quiz,
    });
    setLessonModalOpen(true);
  };

  const handleSaveLesson = () => {
    if (!lessonForm.title.trim()) return;

    const takeaways = lessonForm.keyTakeawaysText
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean);

    const savedLesson: Lesson = {
      id: editingLessonIndex !== null ? lessons[editingLessonIndex].id : `lesson-${Date.now()}`,
      title: lessonForm.title,
      description: lessonForm.description || 'บทเรียนออนไลน์คุณภาพสูง',
      durationMinutes: Number(lessonForm.durationMinutes) || 15,
      videoUrl: lessonForm.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      coverImageUrl: normalizeImageUrl(lessonForm.coverImageUrl) || undefined,
      subLessons: lessonForm.subLessons
        .filter(s => s.title.trim())
        .map((s, i) => ({ ...s, title: s.title.trim(), order: i + 1, quiz: cleanQuiz(s.quiz) })),
      quiz: cleanQuiz(lessonForm.quiz),
      order: editingLessonIndex !== null ? lessons[editingLessonIndex].order : lessons.length + 1,
      keyTakeaways: takeaways,
      resources: lessonForm.resources,
    };

    const updatedLessons = editingLessonIndex !== null
      ? lessons.map((l, i) => (i === editingLessonIndex ? savedLesson : l))
      : [...lessons, savedLesson];
    setLessons(updatedLessons);

    // ถ้ากำลังแก้ไขคอร์สที่มีอยู่ ให้บันทึกบทเรียน (รวมหน้าปก) ลงคอร์สทันที ไม่ต้องรอขั้นตอนบันทึกหลักสูตร
    if (editingCourseId) {
      const target = courses.find(c => c.id === editingCourseId);
      if (target) updateCourse({ ...target, lessons: updatedLessons });
    }

    setLessonModalOpen(false);
  };

  const handleDeleteLesson = (idx: number) => {
    setLessons(lessons.filter((_, i) => i !== idx));
  };

  // Question helpers
  const handleOpenAddQuestion = () => {
    setEditingQuestionId(null);
    setQuestionForm({
      question: '',
      type: 'multiple_choice',
      points: 1,
      options: ['ตัวเลือก ก', 'ตัวเลือก ข', 'ตัวเลือก ค', 'ตัวเลือก ง'],
      correctIndex: 0,
      correctIndices: [0],
      explanation: '',
      sampleAnswer: '',
      keywordsText: '',
      rubricGuide: '',
      maxWords: 200
    });
    setQuestionModalOpen(true);
  };

  const handleOpenEditQuestion = (q: QuizQuestion) => {
    setEditingQuestionId(q.id);
    setQuestionForm({
      question: q.question,
      type: q.type || 'multiple_choice',
      points: q.points || 1,
      options: q.options || (q.type === 'true_false' ? ['จริง (True)', 'เท็จ (False)'] : ['ตัวเลือก ก', 'ตัวเลือก ข']),
      correctIndex: q.correctIndex || 0,
      correctIndices: q.correctIndices || [0],
      explanation: q.explanation || '',
      sampleAnswer: q.sampleAnswer || '',
      keywordsText: (q.keywords || []).join(', '),
      rubricGuide: q.rubricGuide || '',
      maxWords: q.maxWords || 200
    });
    setQuestionModalOpen(true);
  };

  const handleSaveQuestion = () => {
    if (!questionForm.question.trim()) return;

    const keywords = questionForm.keywordsText
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    const savedQ: QuizQuestion = {
      id: editingQuestionId || `q-${Date.now()}`,
      question: questionForm.question,
      type: questionForm.type,
      points: Number(questionForm.points) || 1,
      explanation: questionForm.explanation,
      options:
        questionForm.type === 'multiple_choice' || questionForm.type === 'multiple_select'
          ? questionForm.options.filter(Boolean)
          : questionForm.type === 'true_false'
          ? ['จริง (True)', 'เท็จ (False)']
          : undefined,
      correctIndex:
        questionForm.type === 'multiple_choice' || questionForm.type === 'true_false'
          ? questionForm.correctIndex
          : undefined,
      correctIndices: questionForm.type === 'multiple_select' ? questionForm.correctIndices : undefined,
      sampleAnswer: questionForm.sampleAnswer || undefined,
      keywords: keywords.length > 0 ? keywords : undefined,
      rubricGuide: questionForm.type === 'subjective_essay' ? questionForm.rubricGuide : undefined,
      maxWords: questionForm.type === 'subjective_essay' ? questionForm.maxWords : undefined
    };

    if (activeQuizTab === 'pre_test') {
      if (editingQuestionId) {
        setPreTestQuestions(preTestQuestions.map(q => (q.id === editingQuestionId ? savedQ : q)));
      } else {
        setPreTestQuestions([...preTestQuestions, savedQ]);
      }
    } else {
      if (editingQuestionId) {
        setPostTestQuestions(postTestQuestions.map(q => (q.id === editingQuestionId ? savedQ : q)));
      } else {
        setPostTestQuestions([...postTestQuestions, savedQ]);
      }
    }

    setQuestionModalOpen(false);
  };

  const handleDeleteQuestion = (qId: string) => {
    if (activeQuizTab === 'pre_test') {
      setPreTestQuestions(preTestQuestions.filter(q => q.id !== qId));
    } else {
      setPostTestQuestions(postTestQuestions.filter(q => q.id !== qId));
    }
  };

  // Submit complete Course Save
  const handleSaveCourse = () => {
    if (!title.trim()) {
      alert('กรุณาระบุชื่อหลักสูตร');
      return;
    }

    const totalHours = Number((lessons.reduce((acc, l) => acc + l.durationMinutes, 0) / 60).toFixed(1)) || 2.0;

    const courseData: Omit<Course, 'id' | 'updatedAt'> = {
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `course-${Date.now()}`,
      coverImageUrl: normalizeImageUrl(coverImageUrl) || undefined,
      subtitle: subtitle || 'หลักสูตรออนไลน์พัฒนาทักษะวิชาชีพ',
      description: description || 'เนื้อหาครอบคลุม พร้อมแบบทดสอบวัดผลทั้งปรนัยและอัตนัย',
      category,
      categoryNameTh: courseCategories.find(c => c.id === category)?.label || 'ทั่วไป',
      level,
      durationHours: totalHours,
      classroomCode,
      createdById: currentUser.id,
      classroomCapacity: 60,
      isClassroomOpen: true,
      instructor: {
        name: instructorName || currentUser.name,
        title: instructorTitle,
        avatar: currentUser.avatar,
        organization: organization,
        signatureName: instructorName || currentUser.name
      },
      colorTheme: {
        primary: 'slate-900',
        secondary: 'indigo-600',
        badgeBg: 'bg-indigo-50 text-indigo-700',
        textAccent: 'text-indigo-600',
        gradient: 'from-indigo-600 to-blue-700'
      },
      iconType: category === 'ux_ui' ? 'palette' : category === 'ai_data' ? 'brain' : 'code',
      learningOutcomes: learningOutcomes.map(s => s.trim()).filter(Boolean),
      requirements: requirements.length ? requirements : DEFAULT_REQUIREMENTS,
      published: true,
      lessons,
      preTest: {
        id: `pre-${Date.now()}`,
        title: `แบบทดสอบก่อนเรียน (Pre-test) - ${title}`,
        type: 'pre_test',
        passingScorePercent: preTestPassing,
        questions: preTestQuestions
      },
      postTest: {
        id: `post-${Date.now()}`,
        title: `แบบทดสอบหลังเรียน (Post-test) - ${title}`,
        type: 'post_test',
        passingScorePercent: postTestPassing,
        questions: postTestQuestions
      },
      certificateTemplate: {
        templateType: certTemplateType,
        presetId: certPresetId,
        customBackgroundUrl: certCustomBgUrl || undefined,
        documentTitleTh: certDocTitleTh,
        documentTitleEn: certDocTitleEn,
        organizationName: organization || certOrgName,
        organizationSubtitle: certOrgSubtitle,
        customLogoUrl: certCustomLogoUrl || undefined,
        signatureType: certSignatureType,
        signatureImageUrl: certSignatureImageUrl || undefined,
        signerName: instructorName || currentUser.name,
        signerTitle: instructorTitle,
        sealStyle: certSealStyle
      }
    };

    if (editingCourseId) {
      updateCourse({
        ...courseData,
        id: editingCourseId,
        updatedAt: new Date().toISOString().split('T')[0]
      });
    } else {
      addCourse(courseData);
    }

    handleResetCreatorForm();
    setActiveTab('my_classrooms');
  };

  // Copy classroom code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Collect all submissions that need grading
  const pendingGradingItems: {
    course: Course;
    user: (typeof users)[0];
    progress: UserCourseProgress;
    quizType: 'pre_test' | 'post_test';
    submission: NonNullable<UserCourseProgress['preTestScore']>;
    ungradedCount: number;
  }[] = [];

  courses.forEach(c => {
    progressList.forEach(p => {
      if (p.courseId === c.id) {
        const studentUser = users.find(u => u.id === p.userId);
        if (!studentUser) return;

        // Check preTest
        if (p.preTestScore?.subjectiveAnswers) {
          const subMap = p.preTestScore.subjectiveAnswers;
          const ungrad = Object.values(subMap).filter(item => !item.isGraded).length;
          if (ungrad > 0 || Object.keys(subMap).length > 0) {
            pendingGradingItems.push({
              course: c,
              user: studentUser,
              progress: p,
              quizType: 'pre_test',
              submission: p.preTestScore,
              ungradedCount: ungrad
            });
          }
        }

        // Check postTest
        if (p.postTestScore?.subjectiveAnswers) {
          const subMap = p.postTestScore.subjectiveAnswers;
          const ungrad = Object.values(subMap).filter(item => !item.isGraded).length;
          if (ungrad > 0 || Object.keys(subMap).length > 0) {
            pendingGradingItems.push({
              course: c,
              user: studentUser,
              progress: p,
              quizType: 'post_test',
              submission: p.postTestScore,
              ungradedCount: ungrad
            });
          }
        }
      }
    });
  });

  // Open grading modal for submission
  const handleOpenGradeSubmission = (item: (typeof pendingGradingItems)[0]) => {
    setSelectedSubmissionToGrade({
      course: item.course,
      user: item.user,
      progress: item.progress,
      quizType: item.quizType
    });

    const initialDraft: Record<string, { scoreAwarded: number; teacherComment: string }> = {};
    const subMap = item.submission.subjectiveAnswers || {};

    Object.entries(subMap).forEach(([qId, val]) => {
      initialDraft[qId] = {
        scoreAwarded: val.scoreAwarded || 0,
        teacherComment: val.teacherComment || ''
      };
    });

    setGradingDraft(initialDraft);
  };

  const handleSaveGrading = () => {
    if (!selectedSubmissionToGrade) return;

    gradeSubjectiveSubmission({
      courseId: selectedSubmissionToGrade.course.id,
      userId: selectedSubmissionToGrade.user.id,
      quizType: selectedSubmissionToGrade.quizType,
      grades: gradingDraft
    });

    setSelectedSubmissionToGrade(null);
  };

  const activeQuestionsList = activeQuizTab === 'pre_test' ? preTestQuestions : postTestQuestions;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header Banner & Teacher Spotlight */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 overflow-hidden shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
              <span className="uppercase tracking-wider font-mono">Teacher Studio & Classroom Engine</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300">BB FlexLearn 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              ห้องเรียนครูและระบบสร้างแบบทดสอบ (ปรนัย & อัตนัย)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              เครื่องมือครบวงจรสำหรับอาจารย์ผู้สอน: สร้างห้องเรียน คอร์สเรียน อัปโหลดคลิปวิดีโอ ออกแบบแบบทดสอบปรนัย (4 ตัวเลือก, ถูก/ผิด, หลายตัวเลือก) และอัตนัย (เติมคำ, ความเรียงวิเคราะห์ตามเกณฑ์ Rubric) พร้อมศูนย์ตรวจข้อสอบและออกใบประกาศนียบัตรอัตโนมัติ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => {
                handleResetCreatorForm();
                setActiveTab('create_course');
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>สร้างห้องเรียน / คอร์สใหม่</span>
            </button>
          </div>
        </div>

        {/* Studio Stats Summary Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-slate-300">
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">{courses.length}</div>
            <div className="text-[11px] text-slate-400">คอร์ส / ห้องเรียนทั้งหมด</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-400 tabular-nums">
              {users.filter(u => u.role === 'student').length}
            </div>
            <div className="text-[11px] text-slate-400">ผู้เรียนในระบบ</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 tabular-nums">
              {pendingGradingItems.filter(i => i.ungradedCount > 0).length}
            </div>
            <div className="text-[11px] text-slate-400">ข้อสอบอัตนัยที่รอการตรวจ</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tabular-nums">100%</div>
            <div className="text-[11px] text-slate-400">ระบบ Rubric อัตโนมัติ</div>
          </div>
        </div>
      </div>

      {/* 2. Primary Tab Segmented Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar scroll-smooth">
        <button
          onClick={() => setActiveTab('my_classrooms')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'my_classrooms'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">ห้องเรียนและคอร์สของฉัน ({courses.length})</span>
          <span className="sm:hidden">ห้องเรียน ({courses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('create_course')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'create_course'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">{editingCourseId ? 'แก้ไขคอร์ส & แบบทดสอบ' : 'สร้างคอร์ส & ออกแบบแบบทดสอบ'}</span>
          <span className="sm:hidden">{editingCourseId ? 'แก้ไขคอร์ส' : 'สร้างคอร์ส'}</span>
        </button>

        <button
          onClick={() => setActiveTab('grading_hub')}
          className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'grading_hub'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Edit3 className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">ศูนย์ตรวจข้อสอบอัตนัย ({pendingGradingItems.length})</span>
          <span className="sm:hidden">ตรวจข้อสอบ ({pendingGradingItems.length})</span>
          {pendingGradingItems.some(i => i.ungradedCount > 0) && (
            <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('certificate_studio')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'certificate_studio'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">เทมเพลตใบประกาศ / วุฒิบัตร / ใบรับรอง</span>
          <span className="sm:hidden">เทมเพลตใบประกาศ</span>
        </button>
      </div>

      {/* TAB 1: MY CLASSROOMS & COURSES */}
      {activeTab === 'my_classrooms' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">รายการห้องเรียนและคอร์สเรียน</h2>
              <p className="text-xs text-slate-500">
                จัดการบทเรียน วิดีโอ ชุดแบบทดสอบ และรหัสห้องเรียนสำหรับให้นักเรียนเข้าร่วม
              </p>
            </div>
            <button
              onClick={() => {
                handleResetCreatorForm();
                setActiveTab('create_course');
              }}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-500 transition-colors flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>สร้างห้องเรียนใหม่</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => {
              const enrolledCount = users.filter(u => u.enrolledCourseIds.includes(course.id)).length;
              const preQCount = course.preTest.questions.length;
              const postQCount = course.postTest.questions.length;
              const hasSubjective = [...course.preTest.questions, ...course.postTest.questions].some(
                q => q.type === 'subjective_short' || q.type === 'subjective_essay'
              );

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header tags & Classroom Code */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {course.categoryNameTh}
                      </span>

                      {course.classroomCode ? (
                        <button
                          onClick={() => handleCopyCode(course.classroomCode!)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono font-bold transition-colors"
                          title="คลิกเพื่อคัดลอกรหัสห้องเรียน"
                        >
                          <span>{course.classroomCode}</span>
                          {copiedCode === course.classroomCode ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-400">คอร์สสาธารณะ</span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                      {course.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {course.subtitle}
                    </p>

                    {/* Features breakdown */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Video className="w-3.5 h-3.5 text-indigo-500" />
                          <span>บทเรียนวิดีโอ:</span>
                        </span>
                        <span className="font-semibold">{course.lessons.length} บท ({course.durationHours} ชม.)</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <FileText className="w-3.5 h-3.5 text-emerald-500" />
                          <span>แบบทดสอบ (Pre / Post):</span>
                        </span>
                        <span className="font-semibold">{preQCount} / {postQCount} ข้อ</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Users className="w-3.5 h-3.5 text-blue-500" />
                          <span>ผู้เรียนลงทะเบียน:</span>
                        </span>
                        <span className="font-semibold">{enrolledCount} คน</span>
                      </div>

                      {hasSubjective && (
                        <div className="pt-1 flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>มีข้อสอบอัตนัย พร้อมระบบ Rubric</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => handleEditCourse(course)}
                      className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>แก้ไขคอร์ส & ข้อสอบ</span>
                    </button>

                    <button
                      onClick={() => {
                        setCertCourseId(course.id);
                        loadCertificateTemplateForCourse(course);
                        setActiveTab('certificate_studio');
                      }}
                      className="p-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors"
                      title="ตั้งค่าเทมเพลตใบประกาศ / วุฒิบัตร"
                    >
                      <Award className="w-4 h-4" />
                    </button>

                    {onSelectCourse && (
                      <button
                        onClick={() => onSelectCourse(course)}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors"
                        title="ดูหน้าคอร์สเรียน"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (confirm(`คุณต้องการลบห้องเรียน "${course.title}" ใช่หรือไม่?`)) {
                          deleteCourse(course.id);
                        }
                      }}
                      className="p-2 rounded-xl border border-rose-100 text-rose-500 hover:bg-rose-50 transition-colors"
                      title="ลบห้องเรียน"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: COURSE & QUIZ CREATOR */}
      {activeTab === 'create_course' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-8">
          {/* Multi-Step Stepper */}
          <div className="flex items-center justify-between max-w-xl mx-auto pb-4 border-b border-slate-100">
            {[
              { num: 1, label: 'ข้อมูลห้องเรียน' },
              { num: 2, label: 'บทเรียนและคลิปวิดีโอ' },
              { num: 3, label: 'สร้างแบบทดสอบ ปรนัย/อัตนัย' }
            ].map(step => (
              <button
                key={step.num}
                onClick={() => setCreatorStep(step.num as 1 | 2 | 3)}
                className="flex items-center gap-2 text-xs font-bold transition-colors"
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                    creatorStep === step.num
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : creatorStep > step.num
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {creatorStep > step.num ? <Check className="w-3.5 h-3.5" /> : step.num}
                </div>
                <span className={creatorStep === step.num ? 'text-indigo-950 font-extrabold' : 'text-slate-500'}>
                  {step.label}
                </span>
              </button>
            ))}
          </div>

          {/* STEP 1: Basic Info */}
          {creatorStep === 1 && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div>
                <h3 className="text-base font-bold text-slate-900">ขั้นตอนที่ 1: ข้อมูลคอร์สและห้องเรียน</h3>
                <p className="text-xs text-slate-500">กำหนดชื่อคอร์ส หมวดหมู่ ระดับความยาก และรหัสห้องเรียน</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อคอร์ส / ห้องเรียน *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="เช่น Full-Stack Cloud Architecture & Kubernetes..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <LessonCoverField label="หน้าปกคอร์ส (แสดงในการ์ดเลือกคอร์ส)" value={coverImageUrl} onChange={setCoverImageUrl} />

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">คำโปรย / คำอธิบายย่อ (Subtitle)</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={e => setSubtitle(e.target.value)}
                    placeholder="เช่น เรียนรู้การออกแบบระบบขนาดใหญ่ พร้อมทำแบบทดสอบอัตนัยวิเคราะห์เคส..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">หมวดหมู่</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value as CourseCategory)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                    >
                      {courseCategories.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ระดับเนื้อหา</label>
                    <select
                      value={level}
                      onChange={e => setLevel(e.target.value as CourseLevel)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                    >
                      <option value="ระดับเริ่มต้น">ระดับเริ่มต้น</option>
                      <option value="ระดับปานกลาง">ระดับปานกลาง</option>
                      <option value="ระดับสูง">ระดับสูง</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">รหัสห้องเรียน (Classroom Code)</label>
                    <input
                      type="text"
                      value={classroomCode}
                      onChange={e => setClassroomCode(e.target.value)}
                      placeholder="เช่น BB-CLS-889"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ชื่ออาจารย์ผู้สอน</label>
                    <input
                      type="text"
                      value={instructorName}
                      onChange={e => setInstructorName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ตำแหน่ง / สังกัดผู้สอน</label>
                    <input
                      type="text"
                      value={instructorTitle}
                      onChange={e => setInstructorTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">รายละเอียดหลักสูตรโดยละเอียด</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="อธิบายเนื้อหาและสิ่งที่ผู้เรียนจะได้รับ..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                {/* Learning Outcomes Builder */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">ผลลัพธ์การเรียนรู้ (Learning Outcomes)</label>
                  <div className="space-y-1.5">
                    {learningOutcomes.map((outcome, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800">
                        <input
                          type="text"
                          value={outcome}
                          onChange={e => handleEditOutcome(idx, e.target.value)}
                          onBlur={e => { if (!e.target.value.trim()) handleRemoveOutcome(idx); }}
                          className="flex-1 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-slate-300 rounded px-1.5 py-0.5"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveOutcome(idx)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newOutcome}
                      onChange={e => setNewOutcome(e.target.value)}
                      placeholder="พิมพ์ผลลัพธ์การเรียนรู้ใหม่..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOutcome();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddOutcome}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                    >
                      เพิ่ม
                    </button>
                  </div>
                </div>
                {/* Requirements Builder */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">ความรู้พื้นฐานที่จำเป็น (Requirements)</label>
                  <div className="space-y-1.5">
                    {requirements.map((req, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800">
                        <span>• {req}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRequirement(idx)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newRequirement}
                      onChange={e => setNewRequirement(e.target.value)}
                      placeholder="พิมพ์ความรู้พื้นฐานที่จำเป็น..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddRequirement();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddRequirement}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                    >
                      เพิ่ม
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setCreatorStep(2)}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  <span>ต่อไป: จัดการบทเรียน</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Lessons Manager */}
          {creatorStep === 2 && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">ขั้นตอนที่ 2: บทเรียนและคลิปวิดีโอ</h3>
                  <p className="text-xs text-slate-500">เพิ่มบทเรียน ลิงก์คลิปวิดีโอ (MP4/Full HD) และสาระสำคัญ</p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddLesson}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-500 transition-colors flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มบทเรียน</span>
                </button>
              </div>

              {/* Lessons list */}
              <div className="space-y-3">
                {lessons.map((lesson, idx) => (
                  <div
                    key={lesson.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{lesson.title}</h4>
                        <span className="text-[11px] text-slate-500 font-mono">({lesson.durationMinutes} นาที)</span>
                      </div>
                      <p className="text-xs text-slate-600 pl-8">{lesson.description}</p>
                      {lesson.keyTakeaways && lesson.keyTakeaways.length > 0 && (
                        <div className="pl-8 pt-1 flex flex-wrap gap-1.5">
                          {lesson.keyTakeaways.map((k, ki) => (
                            <span key={ki} className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                              ✓ {k}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditLesson(idx)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200"
                        title="แก้ไขบทเรียน"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLesson(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50"
                        title="ลบบทเรียน"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreatorStep(1)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="button"
                  onClick={() => setCreatorStep(3)}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  <span>ต่อไป: ออกแบบแบบทดสอบ</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Versatile Quiz Creator (Objective & Subjective) */}
          {creatorStep === 3 && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    ขั้นตอนที่ 3: ออกแบบชุดแบบทดสอบ (ปรนัย & อัตนัย)
                  </h3>
                  <p className="text-xs text-slate-500">
                    สร้างแบบทดสอบหลากหลายประเภท: 4 ตัวเลือก, ถูก/ผิด, เลือกหลายข้อ, ตอบสั้น, และความเรียงวิเคราะห์พร้อมเกณฑ์ Rubric
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddQuestion}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-bold rounded-xl hover:from-indigo-500 hover:to-blue-500 transition-all flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มข้อสอบใหม่</span>
                </button>
              </div>

              {/* Sub-tabs: Pre-test vs Post-test */}
              <div className="flex items-center justify-between gap-4 p-2 bg-slate-100 rounded-2xl">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveQuizTab('pre_test')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeQuizTab === 'pre_test'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    แบบทดสอบก่อนเรียน (Pre-test) · {preTestQuestions.length} ข้อ
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveQuizTab('post_test')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeQuizTab === 'post_test'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    แบบทดสอบหลังเรียน (Post-test) · {postTestQuestions.length} ข้อ
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600 pr-2">
                  <span>เกณฑ์การผ่าน:</span>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={activeQuizTab === 'pre_test' ? preTestPassing : postTestPassing}
                    onChange={e => {
                      const val = Number(e.target.value);
                      if (activeQuizTab === 'pre_test') setPreTestPassing(val);
                      else setPostTestPassing(val);
                    }}
                    className="w-14 px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 text-center"
                  />
                  <span>%</span>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {activeQuestionsList.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400 space-y-2">
                    <HelpCircle className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">ยังไม่มีข้อสอบในส่วนนี้</p>
                    <p className="text-[11px]">คลิกปุ่ม &quot;+ เพิ่มข้อสอบใหม่&quot; ด้านบนเพื่อเพิ่มข้อคำถาม</p>
                  </div>
                ) : (
                  activeQuestionsList.map((q, qIndex) => {
                    const qType = q.type || 'multiple_choice';
                    return (
                      <div
                        key={q.id}
                        className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 shadow-sm transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="w-6 h-6 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                                {qIndex + 1}
                              </span>

                              {qType === 'multiple_choice' && (
                                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-bold">
                                  🔘 ปรนัย (4 ตัวเลือก)
                                </span>
                              )}
                              {qType === 'true_false' && (
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold">
                                  ⚖️ ปรนัย (ถูก/ผิด)
                                </span>
                              )}
                              {qType === 'multiple_select' && (
                                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[11px] font-bold">
                                  ☑️ ปรนัย (เลือกหลายข้อ)
                                </span>
                              )}
                              {qType === 'subjective_short' && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-bold">
                                  ✍️ อัตนัย (ตอบสั้น/เติมคำ)
                                </span>
                              )}
                              {qType === 'subjective_essay' && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-bold">
                                  📝 อัตนัย (ความเรียง/วิเคราะห์ Rubric)
                                </span>
                              )}

                              <span className="text-[11px] text-slate-500 font-mono">
                                ({q.points || 1} คะแนน)
                              </span>
                            </div>

                            <p className="text-sm font-bold text-slate-900 pt-1">
                              {q.question}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEditQuestion(q)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                              title="แก้ไขคำถาม"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50"
                              title="ลบคำถาม"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Options preview for Objective */}
                        {(qType === 'multiple_choice' || qType === 'true_false') && q.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                            {q.options.map((opt, oi) => (
                              <div
                                key={oi}
                                className={`p-2 rounded-xl border flex items-center gap-2 ${
                                  oi === q.correctIndex
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                                    : 'bg-slate-50 border-slate-200 text-slate-600'
                                }`}
                              >
                                <span className="font-bold text-[10px] w-4">{String.fromCharCode(65 + oi)}.</span>
                                <span>{opt}</span>
                                {oi === q.correctIndex && <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto" />}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Options preview for Multiple Select */}
                        {qType === 'multiple_select' && q.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                            {q.options.map((opt, oi) => {
                              const isCorrect = q.correctIndices?.includes(oi);
                              return (
                                <div
                                  key={oi}
                                  className={`p-2 rounded-xl border flex items-center gap-2 ${
                                    isCorrect
                                      ? 'bg-purple-50 border-purple-300 text-purple-950 font-semibold'
                                      : 'bg-slate-50 border-slate-200 text-slate-600'
                                  }`}
                                >
                                  <span className="font-bold text-[10px] w-4">{oi + 1}.</span>
                                  <span>{opt}</span>
                                  {isCorrect && <Check className="w-3.5 h-3.5 text-purple-600 ml-auto" />}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Preview for Subjective Short */}
                        {qType === 'subjective_short' && (
                          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1">
                            {q.sampleAnswer && (
                              <p>
                                <span className="font-bold text-amber-900">แนวคำตอบ:</span> {q.sampleAnswer}
                              </p>
                            )}
                            {q.keywords && q.keywords.length > 0 && (
                              <p className="text-[11px] text-amber-800">
                                <span className="font-bold">คีย์เวิร์ดตรวจอัตโนมัติ:</span> {q.keywords.join(', ')}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Preview for Subjective Essay */}
                        {qType === 'subjective_essay' && (
                          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                            {q.rubricGuide && (
                              <p>
                                <span className="font-bold text-emerald-900">เกณฑ์ Rubric:</span> {q.rubricGuide}
                              </p>
                            )}
                            {q.sampleAnswer && (
                              <p className="text-[11px] text-slate-600">
                                <span className="font-bold text-slate-700">Model Answer:</span> {q.sampleAnswer}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreatorStep(2)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  ย้อนกลับไปบทเรียน
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveCourse}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>บันทึกและเปิดห้องเรียน (Publish Classroom)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SUBJECTIVE GRADING HUB */}
      {activeTab === 'grading_hub' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">ศูนย์ตรวจข้อสอบอัตนัย (Subjective Evaluation Hub)</h2>
            <p className="text-xs text-slate-500">
              ตรวจสอบคำตอบอัตนัย (ตอบสั้นและความเรียงวิเคราะห์) ของผู้เรียน ให้คะแนนตามเกณฑ์ Rubric พร้อมพิมพ์ข้อเสนอแนะ
            </p>
          </div>

          {pendingGradingItems.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-3">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
              <h3 className="text-base font-bold text-slate-800">ไม่มีข้อสอบอัตนัยที่ค้างตรวจในขณะนี้</h3>
              <p className="text-xs text-slate-400">เมื่อผู้เรียนทำข้อสอบอัตนัย รายการจะปรากฏที่นี่ให้อาจารย์ตรวจทันที</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingGradingItems.map((item, idx) => {
                const isAllGraded = item.ungradedCount === 0;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                          isAllGraded
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {isAllGraded ? '✓ ตรวจครบแล้ว' : `รอตรวจ ${item.ungradedCount} ข้อ`}
                        </span>

                        <span className="text-[11px] font-mono text-slate-400">
                          {item.quizType === 'post_test' ? 'Post-test' : 'Pre-test'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <img
                          src={item.user.avatar}
                          alt={item.user.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{item.user.name}</h4>
                          <p className="text-xs text-slate-500">{item.user.email}</p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 text-xs space-y-1">
                        <p className="font-semibold text-slate-800 truncate">{item.course.title}</p>
                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                          <span>คะแนนรวมปัจจุบัน: {item.submission.score}/{item.submission.total} ({item.submission.percentage}%)</span>
                          <span>ส่งเมื่อ: {item.submission.date}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenGradeSubmission(item)}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isAllGraded ? 'ดูรายละเอียดและปรับคะแนน' : 'ตรวจข้อสอบอัตนัยตอนนี้'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CERTIFICATE & CREDENTIAL STUDIO */}
      {activeTab === 'certificate_studio' && (() => {
        const selectedCourse = courses.find(c => c.id === certCourseId) || courses[0];
        const isCustomUpload = certTemplateType === 'custom_upload' && !!certCustomBgUrl;
        const isDarkTheme = !isCustomUpload && certPresetId === 'modern_tech';

        const sampleSignatureSvg =
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 220 70"><path d="M15,45 Q40,10 75,35 T125,25 T165,45 T205,18 M45,55 Q95,30 145,52 T195,40" fill="none" stroke="%231e3a8a" stroke-width="3" stroke-linecap="round"/></svg>';

        const sampleBg1 =
          'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80';
        const sampleBg2 =
          'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80';

        // Container styles for preview
        let previewContainerStyles = 'bg-white border-[10px] border-double border-amber-600/40 text-slate-900';
        let previewBgInline: React.CSSProperties = {
          backgroundImage: 'radial-gradient(circle at center, #ffffff 0%, #fefcf6 100%)',
          boxShadow: '0 20px 40px -15px rgba(180, 83, 9, 0.15)'
        };

        if (isCustomUpload) {
          previewContainerStyles = 'bg-slate-950 border-4 border-slate-300 shadow-xl relative text-slate-900';
          previewBgInline = {
            backgroundImage: `url(${certCustomBgUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          };
        } else if (certPresetId === 'modern_tech') {
          previewContainerStyles =
            'bg-slate-950 border-4 border-cyan-500/60 shadow-xl text-slate-100 shadow-[0_0_35px_rgba(6,182,212,0.15)]';
          previewBgInline = {
            backgroundImage: 'radial-gradient(circle at top right, #0f172a 0%, #020617 100%)'
          };
        } else if (certPresetId === 'emerald_academic') {
          previewContainerStyles =
            'bg-white border-[8px] border-double border-emerald-700/60 shadow-xl text-slate-900';
          previewBgInline = {
            backgroundImage: 'radial-gradient(circle at center, #ffffff 0%, #f0fdf4 100%)',
            boxShadow: '0 20px 40px -15px rgba(16, 185, 129, 0.15)'
          };
        } else if (certPresetId === 'minimal_executive') {
          previewContainerStyles = 'bg-white border-2 border-slate-800 shadow-xl text-slate-900';
          previewBgInline = {
            backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.1)'
          };
        }

        const renderPreviewSeal = (style: 'gold' | 'silver' | 'emerald' | 'tech') => {
          if (style === 'silver') {
            return (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-slate-300 bg-gradient-to-tr from-slate-400 via-slate-100 to-slate-200 p-0.5 flex items-center justify-center shadow-md">
                <div className="w-full h-full rounded-full border border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-800 font-serif text-[6px] sm:text-[7px] font-bold text-center leading-tight">
                  <span className="tracking-widest">OFFICIAL</span>
                  <span className="text-xs text-slate-600 my-0.5">★</span>
                  <span className="tracking-widest">VERIFIED</span>
                </div>
              </div>
            );
          }
          if (style === 'emerald') {
            return (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-emerald-400 bg-gradient-to-tr from-emerald-600 via-emerald-200 to-teal-100 p-0.5 flex items-center justify-center shadow-md">
                <div className="w-full h-full rounded-full border border-dashed border-emerald-900 flex flex-col items-center justify-center text-emerald-950 font-serif text-[6px] sm:text-[7px] font-bold text-center leading-tight">
                  <span className="tracking-widest">ACADEMIC</span>
                  <span className="text-xs text-emerald-700 my-0.5">★</span>
                  <span className="tracking-widest">HONORS</span>
                </div>
              </div>
            );
          }
          if (style === 'tech') {
            return (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-cyan-400 bg-gradient-to-tr from-indigo-700 via-cyan-500 to-sky-300 p-0.5 flex items-center justify-center shadow-md">
                <div className="w-full h-full rounded-full border border-dashed border-cyan-900 flex flex-col items-center justify-center text-slate-950 font-mono text-[6px] sm:text-[7px] font-bold text-center leading-tight">
                  <span className="tracking-widest">DIGITAL</span>
                  <span className="text-xs text-cyan-900 my-0.5">◆</span>
                  <span className="tracking-widest">AUTHENTIC</span>
                </div>
              </div>
            );
          }
          return (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-amber-500 bg-gradient-to-tr from-amber-600 via-amber-300 to-amber-100 p-0.5 flex items-center justify-center shadow-md">
              <div className="w-full h-full rounded-full border border-dashed border-amber-900 flex flex-col items-center justify-center text-amber-950 font-serif text-[6px] sm:text-[7px] font-bold text-center leading-tight">
                <span className="tracking-widest">OFFICIAL</span>
                <span className="text-xs text-amber-800 my-0.5">★</span>
                <span className="tracking-widest">CERTIFIED</span>
              </div>
            </div>
          );
        };

        return (
          <div className="space-y-6">
            {/* Studio Header Bar */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded font-semibold border border-amber-200">
                    Certificate & Diploma Studio
                  </span>
                  <span className="text-xs text-slate-400">· BB FlexLearn</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  สตูดิโออัปโหลดและปรับแต่งเทมเพลตใบประกาศนียบัตร / วุฒิบัตร / ใบรับรอง
                </h2>
                <p className="text-xs text-slate-500 max-w-2xl">
                  อาจารย์ผู้สอนสามารถเลือกธีมมาตรฐาน 4 สไตล์ หรืออัปโหลดภาพพื้นหลังเทมเพลตของตนเอง (PNG/JPG/SVG) ปรับชื่อเอกสาร โลโก้สถาบัน ตราประทับ และอัปโหลดไฟล์ภาพลายเซ็นจริงได้ทันที
                </p>
              </div>

              {/* Course Selector Dropdown */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="text-xs text-slate-600 font-semibold shrink-0">เลือกห้องเรียน:</div>
                <select
                  value={certCourseId}
                  onChange={e => {
                    const nextCourseId = e.target.value;
                    setCertCourseId(nextCourseId);
                    const found = courses.find(c => c.id === nextCourseId);
                    if (found) loadCertificateTemplateForCourse(found);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.classroomCode ? `[${c.classroomCode}] ` : ''}{c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Saved Toast Alert */}
            {certSavedSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500 text-white flex items-center justify-between gap-3 shadow-lg shadow-emerald-500/20 animate-fadeIn">
                <div className="flex items-center gap-2.5 text-xs font-bold">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>บันทึกเทมเพลตใบประกาศนียบัตรเรียบร้อยแล้ว! ผู้เรียนที่สำเร็จหลักสูตรจะได้รับเอกสารตามเทมเพลตนี้</span>
                </div>
                <button onClick={() => setCertSavedSuccess(false)} className="p-1 hover:bg-emerald-600 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Main Studio 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Customizer Controls (7 cols) */}
              <div className="lg:col-span-6 xl:col-span-5 space-y-5">
                
                {/* 1. Template Type & Background */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>1. รูปแบบและภาพพื้นหลังเทมเพลต</span>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {certTemplateType === 'custom_upload' ? 'Custom Upload' : 'Preset Design'}
                    </span>
                  </div>

                  {/* Template Type Segmented Switcher */}
                  <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl gap-1">
                    <button
                      type="button"
                      onClick={() => setCertTemplateType('preset')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        certTemplateType === 'preset'
                          ? 'bg-white text-indigo-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Palette className="w-3.5 h-3.5 text-indigo-500" />
                      <span>4 ธีมสำเร็จรูป</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCertTemplateType('custom_upload')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        certTemplateType === 'custom_upload'
                          ? 'bg-white text-indigo-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-500" />
                      <span>อัปโหลดภาพเอง</span>
                    </button>
                  </div>

                  {/* Mode A: Preset Themes */}
                  {certTemplateType === 'preset' && (
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      {[
                        {
                          id: 'royal_gold' as const,
                          name: 'Royal Gold',
                          desc: 'ขอบทองคู่ ลายกิโยเช่ คลาสสิก',
                          borderCls: 'border-amber-400 bg-amber-50/50',
                          badge: 'ยอดนิยม'
                        },
                        {
                          id: 'modern_tech' as const,
                          name: 'Cyber Tech',
                          desc: 'ดำ-น้ำเงิน นีออนไซอัน เหมาะสายไอที',
                          borderCls: 'border-cyan-400 bg-slate-950 text-cyan-200',
                          badge: 'ไอที & AI'
                        },
                        {
                          id: 'emerald_academic' as const,
                          name: 'Emerald Academic',
                          desc: 'เขียวมรกตวิชาการ สไตล์มหาวิทยาลัย',
                          borderCls: 'border-emerald-400 bg-emerald-50/50',
                          badge: 'วิชาการ'
                        },
                        {
                          id: 'minimal_executive' as const,
                          name: 'Minimal Executive',
                          desc: 'มินิมอลโมเดิร์น เรียบหรู คมชัด',
                          borderCls: 'border-slate-400 bg-slate-50',
                          badge: 'ผู้บริหาร'
                        }
                      ].map(theme => (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setCertPresetId(theme.id)}
                          className={`p-3 rounded-2xl border text-left transition-all relative ${
                            certPresetId === theme.id
                              ? 'ring-2 ring-indigo-600 border-indigo-600 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300'
                          } ${theme.borderCls}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">{theme.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/10 font-medium">
                              {theme.badge}
                            </span>
                          </div>
                          <p className="text-[10px] opacity-75 mt-1 leading-tight line-clamp-2">{theme.desc}</p>
                          {certPresetId === theme.id && (
                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Mode B: Custom Background Image Upload */}
                  {certTemplateType === 'custom_upload' && (
                    <div className="space-y-3 pt-1">
                      <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl p-4 text-center bg-indigo-50/30 transition-colors">
                        <input
                          type="file"
                          id="bg-upload-input"
                          accept="image/png, image/jpeg, image/webp, image/svg+xml"
                          onChange={handleCertificateBackgroundUpload}
                          className="hidden"
                        />
                        <label htmlFor="bg-upload-input" className="cursor-pointer block space-y-2">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-slate-800">
                              คลิกเพื่อเลือกไฟล์ภาพเทมเพลตใบประกาศ
                            </p>
                            <p className="text-[11px] text-slate-500">
                              รองรับ PNG, JPG, WebP, SVG ขนาดไม่เกิน 5MB (อัตราส่วน 1.414:1 แนวนอน A4 แนะนำ)
                            </p>
                          </div>
                        </label>
                      </div>

                      {/* Current image status & quick test buttons */}
                      {certCustomBgUrl && (
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="flex items-center gap-2">
                            <img
                              src={certCustomBgUrl}
                              alt="Template Preview"
                              className="w-10 h-7 object-cover rounded border border-slate-300"
                            />
                            <span className="text-xs font-semibold text-slate-700">มีภาพเทมเพลตพื้นหลังแล้ว</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCertCustomBgUrl('');
                              setCertTemplateType('preset');
                            }}
                            className="text-xs text-rose-600 hover:underline font-semibold"
                          >
                            ลบภาพ / ใช้ธีมมาตรฐาน
                          </button>
                        </div>
                      )}

                      {/* Quick sample backgrounds */}
                      <div className="pt-1">
                        <div className="text-[11px] font-bold text-slate-600 mb-1.5">หรือคลิกทดสอบภาพตัวอย่าง:</div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCertCustomBgUrl(sampleBg1);
                              setCertTemplateType('custom_upload');
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                          >
                            🎨 ตัวอย่าง 1: กระดาษเกียรติยศวินเทจ
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCertCustomBgUrl(sampleBg2);
                              setCertTemplateType('custom_upload');
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                          >
                            🌌 ตัวอย่าง 2: ลายน้ำหรูหรา
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Document Title & Organization Customization */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>2. ชื่อเอกสารและข้อมูลสถาบัน</span>
                  </div>

                  {/* Document Title Quick Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                      เลือกประเภทเอกสารที่ต้องการออกให้ผู้เรียน:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {[
                        { th: 'ใบประกาศนียบัตรจบหลักสูตร', en: 'Certificate of Competence & Professional Mastery' },
                        { th: 'วุฒิบัตรแสดงความรู้ความสามารถ', en: 'Diploma of Professional Competence' },
                        { th: 'หนังสือรับรองการฝึกอบรมวิชาชีพ', en: 'Certificate of Professional Training' },
                        { th: 'เกียรติบัตรเรียนดีเด่นและผู้มีความเป็นเลิศ', en: 'Certificate of Academic Excellence & Honor' }
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setCertDocTitleTh(item.th);
                            setCertDocTitleEn(item.en);
                          }}
                          className={`p-2 rounded-xl text-left border text-[11px] font-medium transition-all ${
                            certDocTitleTh === item.th
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {item.th}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Document Titles Custom Inputs */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        หัวเรื่องภาษาไทย (Thai Document Title) *
                      </label>
                      <input
                        type="text"
                        value={certDocTitleTh}
                        onChange={e => setCertDocTitleTh(e.target.value)}
                        placeholder="เช่น ใบประกาศนียบัตรจบหลักสูตร..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        หัวเรื่องภาษาอังกฤษ (English Subtitle)
                      </label>
                      <input
                        type="text"
                        value={certDocTitleEn}
                        onChange={e => setCertDocTitleEn(e.target.value)}
                        placeholder="e.g. Certificate of Competence..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-serif"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ชื่อสถาบัน / โรงเรียน / หน่วยงานผู้จัดอบรม *
                      </label>
                      <input
                        type="text"
                        value={certOrgName}
                        onChange={e => setCertOrgName(e.target.value)}
                        placeholder="เช่น สถาบันการเรียนรู้ดิจิทัล BB FlexLearn..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        คำบรรยายสถาบัน (Organization Subtitle)
                      </label>
                      <input
                        type="text"
                        value={certOrgSubtitle}
                        onChange={e => setCertOrgSubtitle(e.target.value)}
                        placeholder="เช่น Digital Learning & Skills Institute of Thailand..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>

                    {/* Custom Logo Upload */}
                    <div className="pt-1">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ตราสัญลักษณ์ / โลโก้ของสถาบัน (Custom Logo)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          id="logo-upload-input"
                          accept="image/png, image/jpeg, image/svg+xml"
                          onChange={handleCertificateLogoUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="logo-upload-input"
                          className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>อัปโหลดไฟล์โลโก้ (PNG/SVG)</span>
                        </label>
                        {certCustomLogoUrl && (
                          <div className="flex items-center gap-2">
                            <img
                              src={certCustomLogoUrl}
                              alt="Logo"
                              className="w-8 h-8 object-contain rounded border border-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => setCertCustomLogoUrl('')}
                              className="text-[11px] text-rose-600 hover:underline"
                            >
                              คืนค่าโลโก้เดิม
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Official Seal & Signer Customization */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
                    <Stamp className="w-4 h-4 text-amber-600" />
                    <span>3. ตราประทับและลายมือชื่อผู้สอน</span>
                  </div>

                  {/* Seal visibility toggle */}
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                    <div>
                      <p className="text-xs font-bold text-slate-800">แสดงตราประทับทางการ</p>
                      <p className="text-[11px] text-slate-500">ปิดถ้าใบประกาศฯ แบบนี้ไม่ต้องการตราประทับ</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={certShowSeal}
                      onClick={() => setCertShowSeal((v) => !v)}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${certShowSeal ? 'bg-teal-600' : 'bg-slate-300'}`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${certShowSeal ? 'left-[22px]' : 'left-0.5'}`} />
                    </button>
                  </div>

                  {/* Seal Style Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      รูปแบบตราประทับทางการ (Official Seal Style):
                    </label>
                    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 ${certShowSeal ? '' : 'opacity-40 pointer-events-none'}`}>
                      {[
                        { id: 'gold' as const, label: 'Gold Foil', color: 'bg-amber-100 text-amber-900 border-amber-300' },
                        { id: 'silver' as const, label: 'Silver', color: 'bg-slate-100 text-slate-800 border-slate-300' },
                        { id: 'emerald' as const, label: 'Emerald', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
                        { id: 'tech' as const, label: 'Cyber Tech', color: 'bg-cyan-100 text-cyan-900 border-cyan-300' }
                      ].map(seal => (
                        <button
                          key={seal.id}
                          type="button"
                          onClick={() => setCertSealStyle(seal.id)}
                          className={`p-2 rounded-xl border text-center text-xs font-bold transition-all ${
                            certSealStyle === seal.id
                              ? `${seal.color} ring-2 ring-indigo-600 shadow-xs`
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {seal.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Signer Info */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          ชื่อผู้ลงนามรับรอง *
                        </label>
                        <input
                          type="text"
                          value={certSignerName}
                          onChange={e => setCertSignerName(e.target.value)}
                          placeholder="เช่น ดร.ภัทรดนัย บุญเรือง"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          ตำแหน่งผู้ลงนาม *
                        </label>
                        <input
                          type="text"
                          value={certSignerTitle}
                          onChange={e => setCertSignerTitle(e.target.value)}
                          placeholder="เช่น อาจารย์ผู้สอนประจำวิชา"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                        />
                      </div>
                    </div>

                    {/* Signature Mode */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        รูปแบบลายมือชื่อ (Signature Mode):
                      </label>
                      <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl gap-1 mb-2">
                        <button
                          type="button"
                          onClick={() => setCertSignatureType('text')}
                          className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                            certSignatureType === 'text'
                              ? 'bg-white text-indigo-900 shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          ลายมือชื่อคัดลายมือ (Font)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCertSignatureType('image')}
                          className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                            certSignatureType === 'image'
                              ? 'bg-white text-indigo-900 shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          อัปโหลดภาพลายเซ็นจริง (PNG)
                        </button>
                      </div>

                      {certSignatureType === 'image' && (
                        <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <input
                            type="file"
                            id="sig-upload-input"
                            accept="image/png, image/svg+xml"
                            onChange={handleSignatureUpload}
                            className="hidden"
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <label
                              htmlFor="sig-upload-input"
                              className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-xs"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>เลือกไฟล์ภาพลายเซ็น (PNG โปร่งใส)</span>
                            </label>

                            <button
                              type="button"
                              onClick={() => {
                                setCertSignatureImageUrl(sampleSignatureSvg);
                                setCertSignatureType('image');
                              }}
                              className="px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold"
                            >
                              ✍️ ใช้ลายเซ็นตัวอย่าง
                            </button>

                            {certSignatureImageUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCertSignatureImageUrl('');
                                  setCertSignatureType('text');
                                }}
                                className="text-xs text-rose-600 hover:underline ml-auto"
                              >
                                ลบภาพลายเซ็น
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Actions & Save Buttons */}
                <div className="p-5 rounded-3xl bg-slate-900 text-white space-y-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300">
                      บันทึกเทมเพลตสำหรับ: {selectedCourse?.title}
                    </span>
                    <span className="text-[10px] text-slate-400">มีผลต่อใบประกาศทันที</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleSaveCertificateTemplate(false)}
                      className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Save className="w-4 h-4" />
                      <span>บันทึกเทมเพลตคอร์สนี้</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveCertificateTemplate(true)}
                      className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 flex items-center justify-center gap-1.5 active:scale-95"
                      title="นำเทมเพลตนี้ไปปรับใช้กับทุกห้องเรียนของครูในระบบ"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>ใช้กับทุกคอร์สของฉัน</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Column: Interactive Live Certificate Preview (5-7 cols) */}
              <div className="lg:col-span-6 xl:col-span-7 sticky top-6 space-y-4">
                
                {/* Preview Card Container */}
                <div className="bg-slate-800/95 backdrop-blur-md rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-700">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-700">
                    <div className="flex items-center gap-2 text-white text-xs font-bold">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>ภาพจำลองแบบเรียลไทม์ (Live Interactive Certificate Preview)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {isCustomUpload ? 'CUSTOM BG' : certPresetId.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Rendered Certificate Sheet */}
                  <div className="overflow-x-auto flex justify-center py-2">
                    <div
                      className={`w-full max-w-[700px] aspect-[1.414/1] p-5 sm:p-8 relative flex flex-col justify-between text-center select-none overflow-hidden rounded-lg ${previewContainerStyles}`}
                      style={previewBgInline}
                    >
                      {/* Scrim overlay for custom background */}
                      {isCustomUpload && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] pointer-events-none" />
                      )}

                      {/* Corner Ornaments */}
                      {certPresetId === 'royal_gold' && !isCustomUpload && (
                        <>
                          <div className="absolute top-2 left-2 w-10 h-10 border-t-2 border-l-2 border-amber-700/70" />
                          <div className="absolute top-2 right-2 w-10 h-10 border-t-2 border-r-2 border-amber-700/70" />
                          <div className="absolute bottom-2 left-2 w-10 h-10 border-b-2 border-l-2 border-amber-700/70" />
                          <div className="absolute bottom-2 right-2 w-10 h-10 border-b-2 border-r-2 border-amber-700/70" />
                          <div className="absolute inset-2 border border-amber-600/25 pointer-events-none" />
                        </>
                      )}

                      {certPresetId === 'emerald_academic' && !isCustomUpload && (
                        <>
                          <div className="absolute top-2 left-2 w-10 h-10 border-t-2 border-l-2 border-emerald-700/70" />
                          <div className="absolute top-2 right-2 w-10 h-10 border-t-2 border-r-2 border-emerald-700/70" />
                          <div className="absolute bottom-2 left-2 w-10 h-10 border-b-2 border-l-2 border-emerald-700/70" />
                          <div className="absolute bottom-2 right-2 w-10 h-10 border-b-2 border-r-2 border-emerald-700/70" />
                          <div className="absolute inset-2 border border-emerald-600/20 pointer-events-none" />
                        </>
                      )}

                      {certPresetId === 'modern_tech' && !isCustomUpload && (
                        <>
                          <div className="absolute inset-1.5 border border-cyan-500/20 pointer-events-none" />
                          <div className="absolute top-1.5 left-1.5 w-6 h-6 border-t border-l border-cyan-400" />
                          <div className="absolute top-1.5 right-1.5 w-6 h-6 border-t border-r border-cyan-400" />
                          <div className="absolute bottom-1.5 left-1.5 w-6 h-6 border-b border-l border-cyan-400" />
                          <div className="absolute bottom-1.5 right-1.5 w-6 h-6 border-b border-r border-cyan-400" />
                        </>
                      )}

                      {/* Certificate Content */}
                      <div className="relative z-10 flex flex-col justify-between h-full">
                        
                        {/* Header Branding */}
                        <div className="pt-0.5">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            {certCustomLogoUrl ? (
                              <img
                                src={certCustomLogoUrl}
                                alt="Logo"
                                className="w-8 h-8 object-contain rounded drop-shadow-sm"
                              />
                            ) : (
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs tracking-wider shadow-sm border ${
                                  isDarkTheme
                                    ? 'bg-cyan-950 text-cyan-400 border-cyan-400/40'
                                    : 'bg-slate-900 text-amber-400 border-amber-400/40'
                                }`}
                              >
                                BB
                              </div>
                            )}
                            <span
                              className={`text-lg sm:text-2xl font-extrabold tracking-tight font-serif ${
                                isDarkTheme ? 'text-white' : 'text-slate-900'
                              }`}
                            >
                              {certOrgName}
                            </span>
                          </div>
                          <p
                            className={`text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-semibold ${
                              isDarkTheme
                                ? 'text-cyan-400'
                                : certPresetId === 'emerald_academic'
                                ? 'text-emerald-800'
                                : 'text-amber-800'
                            }`}
                          >
                            {certOrgSubtitle}
                          </p>
                          <div
                            className={`w-24 h-0.5 mx-auto mt-1.5 ${
                              isDarkTheme
                                ? 'bg-gradient-to-r from-transparent via-cyan-400 to-transparent'
                                : certPresetId === 'emerald_academic'
                                ? 'bg-gradient-to-r from-transparent via-emerald-600 to-transparent'
                                : 'bg-gradient-to-r from-transparent via-amber-600 to-transparent'
                            }`}
                          />
                        </div>

                        {/* Title Section */}
                        <div className="my-1">
                          <h1
                            className={`text-xl sm:text-3xl font-serif font-bold tracking-wide ${
                              isDarkTheme
                                ? 'text-cyan-300'
                                : certPresetId === 'emerald_academic'
                                ? 'text-emerald-950'
                                : 'text-slate-900'
                            }`}
                          >
                            {certDocTitleTh}
                          </h1>
                          <p
                            className={`text-[10px] sm:text-xs italic mt-0.5 font-serif ${
                              isDarkTheme
                                ? 'text-slate-400'
                                : certPresetId === 'emerald_academic'
                                ? 'text-emerald-900/80'
                                : 'text-amber-900/80'
                            }`}
                          >
                            {certDocTitleEn}
                          </p>
                        </div>

                        {/* Recipient Details */}
                        <div className="my-0.5 space-y-1">
                          <p className={`text-[10px] sm:text-xs ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                            ขอมอบเอกสารฉบับนี้ไว้เพื่อแสดงว่า
                          </p>
                          <h2
                            className={`text-xl sm:text-2xl font-extrabold tracking-wide underline decoration-2 underline-offset-4 ${
                              isDarkTheme
                                ? 'text-white decoration-cyan-400/60'
                                : certPresetId === 'emerald_academic'
                                ? 'text-emerald-950 decoration-emerald-500/50'
                                : 'text-slate-900 decoration-amber-500/50'
                            }`}
                          >
                            นายสมชาย ตั้งใจเรียน
                          </h2>
                          <p className={`text-[10px] sm:text-xs pt-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                            ได้สำเร็จการศึกษาครบถ้วนทุกบทเรียน และผ่านเกณฑ์การประเมินด้วยผลคะแนน{' '}
                            <span className={`font-bold font-mono ${isDarkTheme ? 'text-cyan-300' : 'text-slate-900'}`}>
                              96% (เกียรตินิยม)
                            </span>{' '}
                            ในหลักสูตร
                          </p>
                          <h3
                            className={`text-sm sm:text-base font-bold px-2 line-clamp-1 ${
                              isDarkTheme ? 'text-cyan-100' : 'text-indigo-950'
                            }`}
                          >
                            "{selectedCourse?.title}"
                          </h3>
                        </div>

                        {/* Footer Signatures, Verification & Official Seal */}
                        <div
                          className={`pt-2 border-t grid items-end gap-1.5 text-left ${certShowSeal ? 'grid-cols-3' : 'grid-cols-2'} ${
                            isDarkTheme ? 'border-cyan-900/60' : 'border-slate-200/90'
                          }`}
                        >
                          {/* Left: Credential Info */}
                          <div className={`text-[9px] sm:text-[10px] space-y-0.5 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                            <p>
                              <span>วันที่ออกเอกสาร:</span>{' '}
                              <span className={`font-semibold ${isDarkTheme ? 'text-slate-200' : 'text-slate-800'}`}>
                                {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </span>
                            </p>
                            <p className="font-mono text-[9px]">
                              <span>รหัสตรวจสอบ:</span>{' '}
                              <span className={`font-bold ${isDarkTheme ? 'text-cyan-300' : 'text-indigo-900'}`}>
                                CERT-2026-BB889
                              </span>
                            </p>
                            <div
                              className={`flex items-center gap-1 text-[8px] font-semibold ${
                                isDarkTheme ? 'text-emerald-400' : 'text-emerald-700'
                              }`}
                            >
                              <ShieldCheck className="w-3 h-3 shrink-0" />
                              <span className="truncate">รับรองลายมือชื่อและบันทึกในระบบแล้ว</span>
                            </div>
                          </div>

                          {/* Center: Official Seal */}
                          <div className={certShowSeal ? 'flex flex-col items-center justify-center' : 'hidden'}>
                            {renderPreviewSeal(certSealStyle)}
                          </div>

                          {/* Right: Signature */}
                          <div className="text-right text-[10px] space-y-0.5">
                            {certSignatureType === 'image' && certSignatureImageUrl ? (
                              <div className="flex flex-col items-end">
                                <div className="h-8 flex items-end justify-end mb-0.5">
                                  <img
                                    src={certSignatureImageUrl}
                                    alt="Signature"
                                    className="max-h-8 max-w-[120px] object-contain"
                                  />
                                </div>
                                <div className={`w-28 h-px ${isDarkTheme ? 'bg-cyan-500/50' : 'bg-slate-400'} ml-auto`} />
                              </div>
                            ) : (
                              <div>
                                <div
                                  className={`font-serif italic text-sm sm:text-base -mb-0.5 font-['Playfair_Display',serif] ${
                                    isDarkTheme ? 'text-cyan-300' : 'text-slate-800'
                                  }`}
                                >
                                  {certSignerName}
                                </div>
                                <div className={`w-28 h-px ${isDarkTheme ? 'bg-cyan-500/50' : 'bg-slate-400'} ml-auto`} />
                              </div>
                            )}
                            <p className={`font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                              {certSignerName}
                            </p>
                            <p className={`text-[8px] ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                              {certSignerTitle}
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-700 flex items-center justify-between text-slate-400 text-xs">
                    <span className="text-[11px]">💡 เอกสารจริงจะออกให้ผู้เรียนพร้อมรหัสรับรองเฉพาะบุคคลหลังผ่านเกณฑ์ Post-test</span>
                    <button
                      type="button"
                      onClick={() => handleSaveCertificateTemplate(false)}
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow"
                    >
                      บันทึกเทมเพลตนี้
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        );
      })()}

      {/* MODAL: ADD / EDIT LESSON */}
      {lessonModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl m-auto max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingLessonIndex !== null ? 'แก้ไขบทเรียน' : 'เพิ่มบทเรียนใหม่'}
              </h3>
              <button
                onClick={() => setLessonModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อบทเรียน *</label>
                <input
                  type="text"
                  value={lessonForm.title}
                  onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                  placeholder="เช่น 02. ออกแบบระบบ Caching ด้วย Redis Cluster..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ความยาวบทเรียน (นาที)</label>
                <input
                  type="number"
                  value={lessonForm.durationMinutes}
                  onChange={e => setLessonForm({ ...lessonForm, durationMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">URL วิดีโอ (YouTube / Vimeo / Google Drive / MP4 / WebM)</label>
                <input
                  type="text"
                  value={lessonForm.videoUrl}
                  onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>

              <LessonCoverField
                value={lessonForm.coverImageUrl}
                onChange={coverImageUrl => setLessonForm({ ...lessonForm, coverImageUrl })}
              />

              <SubLessonsEditor
                value={lessonForm.subLessons}
                onChange={subLessons => setLessonForm({ ...lessonForm, subLessons })}
              />

              <QuizBuilderField
                label="แบบทดสอบท้ายบทเรียน (ทำหลังดูวิดีโอทุกตอนของบทนี้จบ)"
                value={lessonForm.quiz}
                onChange={quiz => setLessonForm({ ...lessonForm, quiz })}
              />

              <LessonMaterialsField
                value={lessonForm.resources}
                onChange={resources => setLessonForm({ ...lessonForm, resources })}
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">คำอธิบายบทเรียน</label>
                <textarea
                  rows={2}
                  value={lessonForm.description}
                  onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ประเด็นสำคัญที่ได้เรียนรู้ (Key Takeaways, 1 บรรทัดต่อ 1 ข้อ)
                </label>
                <textarea
                  rows={2}
                  value={lessonForm.keyTakeawaysText}
                  onChange={e => setLessonForm({ ...lessonForm, keyTakeawaysText: e.target.value })}
                  placeholder="เช่น เทคนิค Cache Stampede Protection..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLessonModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveLesson}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500"
              >
                บันทึกบทเรียน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT QUIZ QUESTION (VERSATILE) */}
      {questionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl m-auto max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingQuestionId ? 'แก้ไขข้อสอบ' : 'สร้างข้อสอบใหม่'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {activeQuizTab === 'pre_test' ? 'แบบทดสอบก่อนเรียน (Pre-test)' : 'แบบทดสอบหลังเรียน (Post-test)'}
                </p>
              </div>
              <button
                onClick={() => setQuestionModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Question Type Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">ประเภทคำถาม (Question Type) *</label>
                <select
                  value={questionForm.type}
                  onChange={e => {
                    const newT = e.target.value as QuizQuestionType;
                    setQuestionForm({
                      ...questionForm,
                      type: newT,
                      options:
                        newT === 'true_false'
                          ? ['จริง (True)', 'เท็จ (False)']
                          : questionForm.options.length >= 2
                          ? questionForm.options
                          : ['ตัวเลือก ก', 'ตัวเลือก ข', 'ตัวเลือก ค', 'ตัวเลือก ง']
                    });
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                >
                  <option value="multiple_choice">🔘 ปรนัย: 4 ตัวเลือก (เลือกคำตอบที่ถูก 1 ข้อ)</option>
                  <option value="true_false">⚖️ ปรนัย: ถูก / ผิด (True or False)</option>
                  <option value="multiple_select">☑️ ปรนัย: เลือกได้มากกว่า 1 คำตอบ (Multi-select)</option>
                  <option value="subjective_short">✍️ อัตนัย: ตอบสั้น / เติมคำ (พร้อม Keyword Matching)</option>
                  <option value="subjective_essay">📝 อัตนัย: ความเรียง / วิเคราะห์ (พร้อมเกณฑ์ Rubric Guide)</option>
                </select>
              </div>

              {/* Question Text */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">โจทย์คำถาม *</label>
                <textarea
                  rows={3}
                  value={questionForm.question}
                  onChange={e => setQuestionForm({ ...questionForm, question: e.target.value })}
                  placeholder="พิมพ์โจทย์คำถามหรือสถานการณ์จำลอง..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              {/* Points */}
              <div className="flex items-center gap-3">
                <label className="font-bold text-slate-700">คะแนนเต็มข้อนี้:</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={questionForm.points}
                  onChange={e => setQuestionForm({ ...questionForm, points: Number(e.target.value) })}
                  className="w-20 px-3 py-1.5 rounded-xl border border-slate-200 font-mono font-bold text-center"
                />
                <span className="text-slate-400">คะแนน</span>
              </div>

              {/* Options for Multiple Choice */}
              {questionForm.type === 'multiple_choice' && (
                <div className="space-y-2">
                  <label className="block font-bold text-slate-700">ตัวเลือกคำตอบ (เลือก Radio หน้ารายการที่ถูกต้อง):</label>
                  {questionForm.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={questionForm.correctIndex === oi}
                        onChange={() => setQuestionForm({ ...questionForm, correctIndex: oi })}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={e => {
                          const updated = [...questionForm.options];
                          updated[oi] = e.target.value;
                          setQuestionForm({ ...questionForm, options: updated });
                        }}
                        placeholder={`ตัวเลือก ${String.fromCharCode(65 + oi)}`}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Options for True / False */}
              {questionForm.type === 'true_false' && (
                <div className="space-y-2">
                  <label className="block font-bold text-slate-700">คำตอบที่ถูกต้อง:</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tfOpt"
                        checked={questionForm.correctIndex === 0}
                        onChange={() => setQuestionForm({ ...questionForm, correctIndex: 0 })}
                      />
                      <span>จริง (True)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tfOpt"
                        checked={questionForm.correctIndex === 1}
                        onChange={() => setQuestionForm({ ...questionForm, correctIndex: 1 })}
                      />
                      <span>เท็จ (False)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Options for Multi-Select */}
              {questionForm.type === 'multiple_select' && (
                <div className="space-y-2">
                  <label className="block font-bold text-slate-700">ตัวเลือกคำตอบ (ติ๊กถูกหน้าข้อที่ถูกต้องทั้งหมด):</label>
                  {questionForm.options.map((opt, oi) => {
                    const isChecked = questionForm.correctIndices.includes(oi);
                    return (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            const newIndices = e.target.checked
                              ? [...questionForm.correctIndices, oi]
                              : questionForm.correctIndices.filter(i => i !== oi);
                            setQuestionForm({ ...questionForm, correctIndices: newIndices });
                          }}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={e => {
                            const updated = [...questionForm.options];
                            updated[oi] = e.target.value;
                            setQuestionForm({ ...questionForm, options: updated });
                          }}
                          placeholder={`ตัวเลือก ${oi + 1}`}
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Subjective Short Answer Fields */}
              {questionForm.type === 'subjective_short' && (
                <div className="space-y-3 p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <div>
                    <label className="block font-bold text-amber-950 mb-1">แนวทางการตอบ / คำตอบตัวอย่าง (Sample Answer)</label>
                    <input
                      type="text"
                      value={questionForm.sampleAnswer}
                      onChange={e => setQuestionForm({ ...questionForm, sampleAnswer: e.target.value })}
                      placeholder="เช่น Multi-stage build..."
                      className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-amber-950 mb-1">
                      คีย์เวิร์ดตรวจอัตโนมัติ (คั่นด้วยเครื่องหมายจุลภาค ,)
                    </label>
                    <input
                      type="text"
                      value={questionForm.keywordsText}
                      onChange={e => setQuestionForm({ ...questionForm, keywordsText: e.target.value })}
                      placeholder="เช่น multi-stage, multistage, หลายขั้นตอน"
                      className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Subjective Essay Fields */}
              {questionForm.type === 'subjective_essay' && (
                <div className="space-y-3 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <div>
                    <label className="block font-bold text-emerald-950 mb-1">
                      เกณฑ์การให้คะแนน (Rubric Guide) *
                    </label>
                    <textarea
                      rows={2}
                      value={questionForm.rubricGuide}
                      onChange={e => setQuestionForm({ ...questionForm, rubricGuide: e.target.value })}
                      placeholder="เช่น เกณฑ์ 5 คะแนน: 1. ระบุสาเหตุ (2 คะแนน), 2. เสนอสถาปัตยกรรม (2 คะแนน), 3. ความสมบูรณ์ (1 คะแนน)"
                      className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-emerald-950 mb-1">
                      คำตอบตัวอย่างที่สมบูรณ์ (Model Answer)
                    </label>
                    <textarea
                      rows={2}
                      value={questionForm.sampleAnswer}
                      onChange={e => setQuestionForm({ ...questionForm, sampleAnswer: e.target.value })}
                      placeholder="เขียนแนวทางการตอบที่ได้คะแนนเต็มสำหรับให้อาจารย์ใช้อ้างอิง..."
                      className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-emerald-950 mb-1">จำนวนคำที่แนะนำ (Max Words)</label>
                    <input
                      type="number"
                      value={questionForm.maxWords}
                      onChange={e => setQuestionForm({ ...questionForm, maxWords: Number(e.target.value) })}
                      className="w-28 px-3 py-1.5 rounded-xl border border-emerald-200 bg-white text-center"
                    />
                  </div>
                </div>
              )}

              {/* Explanation */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">คำอธิบายเฉลยเชิงลึก (Explanation)</label>
                <textarea
                  rows={2}
                  value={questionForm.explanation}
                  onChange={e => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  placeholder="เขียนอธิบายเหตุผลและหลักการที่ถูกต้อง..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQuestionModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveQuestion}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 shadow"
              >
                บันทึกข้อสอบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER / MODAL: TEACHER GRADING SUBMISSION */}
      {selectedSubmissionToGrade && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl m-auto max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider font-mono">
                  ตรวจให้คะแนนข้อสอบอัตนัย
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {selectedSubmissionToGrade.user.name} ({selectedSubmissionToGrade.course.title})
                </h3>
              </div>
              <button
                onClick={() => setSelectedSubmissionToGrade(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              {Object.entries(
                (selectedSubmissionToGrade.quizType === 'pre_test'
                  ? selectedSubmissionToGrade.progress.preTestScore
                  : selectedSubmissionToGrade.progress.postTestScore
                )?.subjectiveAnswers || {}
              ).map(([qId, subItem]) => {
                const targetQuiz =
                  selectedSubmissionToGrade.quizType === 'pre_test'
                    ? selectedSubmissionToGrade.course.preTest
                    : selectedSubmissionToGrade.course.postTest;
                const questionObj = targetQuiz.questions.find(q => q.id === qId);

                const currentDraft = gradingDraft[qId] || { scoreAwarded: 0, teacherComment: '' };

                return (
                  <div key={qId} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3 text-xs">
                    <div className="font-bold text-slate-900 leading-snug">
                      โจทย์: {questionObj?.question}
                    </div>

                    {questionObj?.rubricGuide && (
                      <div className="p-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-[11px]">
                        <span className="font-bold block">เกณฑ์การให้คะแนน (Rubric):</span>
                        <span>{questionObj.rubricGuide}</span>
                      </div>
                    )}

                    <div>
                      <span className="font-semibold text-slate-700 block mb-1">คำตอบของผู้เรียน:</span>
                      <p className="bg-white p-3 rounded-xl border border-slate-200 text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {subItem.studentAnswer || '(ผู้เรียนไม่ได้ระบุคำตอบ)'}
                      </p>
                    </div>

                    {questionObj?.sampleAnswer && (
                      <div className="text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">Model Answer:</span> {questionObj.sampleAnswer}
                      </div>
                    )}

                    {/* Grading Form for this question */}
                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500">AI เป็นเพียงข้อเสนอ ครูตรวจทานก่อนบันทึกเสมอ</span>
                        <button
                          type="button"
                          onClick={() => handleAiSuggestGrade(qId, subItem.studentAnswer || '')}
                          disabled={aiGradingQid !== null || !subItem.studentAnswer}
                          className="shrink-0 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold disabled:opacity-40"
                        >
                          {aiGradingQid === qId ? 'กำลังให้ AI ตรวจ...' : '✨ ให้ AI ช่วยตรวจ'}
                        </button>
                      </div>
                      {aiGradeError?.qId === qId && (
                        <p className="text-[11px] text-rose-600">{aiGradeError.message}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                      <div className="flex items-center gap-2">
                        <label className="font-bold text-slate-700">คะแนนที่ให้:</label>
                        <input
                          type="number"
                          min="0"
                          max={subItem.maxScore}
                          value={currentDraft.scoreAwarded}
                          onChange={e => {
                            const val = Math.min(subItem.maxScore, Math.max(0, Number(e.target.value)));
                            setGradingDraft({
                              ...gradingDraft,
                              [qId]: { ...currentDraft, scoreAwarded: val }
                            });
                          }}
                          className="w-16 px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-center"
                        />
                        <span className="text-slate-400">/ {subItem.maxScore}</span>
                      </div>

                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={currentDraft.teacherComment}
                          onChange={e => {
                            setGradingDraft({
                              ...gradingDraft,
                              [qId]: { ...currentDraft, teacherComment: e.target.value }
                            });
                          }}
                          placeholder="พิมพ์ข้อเสนอแนะหรือคำติชมให้อาจารย์ผู้เรียน..."
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                เมื่อบันทึก คะแนนจะถูกคำนวณใหม่ และผู้เรียนจะได้รับการแจ้งเตือนผลทันที
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSubmissionToGrade(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveGrading}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors shadow"
                >
                  บันทึกผลการตรวจและอัปเดตคะแนน
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
