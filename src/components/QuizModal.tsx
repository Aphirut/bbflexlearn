import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { Course, Quiz, QuizSubmission, Certificate } from '../types';
import { useApp } from '../context/AppContext';
import {
  CheckCircle2,
  XCircle,
  Award,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  HelpCircle,
  TrendingUp,
  Sparkles,
  X,
  Check
} from 'lucide-react';

interface QuizModalProps {
  course: Course;
  quizType: 'pre_test' | 'post_test';
  isOpen: boolean;
  onClose: () => void;
  onCertificateUnlocked?: (certificate: Certificate) => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  course,
  quizType,
  isOpen,
  onClose,
  onCertificateUnlocked
}) => {
  const { submitQuiz, getCurrentUserCourseProgress } = useApp();
  const quiz: Quiz = quizType === 'pre_test' ? course.preTest : course.postTest;
  const progress = getCurrentUserCourseProgress(course.id);

  // States
  const [selectedAnswers, setSelectedAnswers] = useState<(number | number[] | string)[]>(() => {
    return quiz.questions.map(q => {
      const type = q.type || 'multiple_choice';
      if (type === 'multiple_select') return [];
      if (type === 'subjective_short' || type === 'subjective_essay') return '';
      return -1;
    });
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [submissionResult, setSubmissionResult] = useState<QuizSubmission | null>(null);
  const [unlockedCert, setUnlockedCert] = useState<Certificate | null>(null);
  const [showExplanations, setShowExplanations] = useState(false);
  const [showRubricModal, setShowRubricModal] = useState(false);

  const quizKey = `${course.id}:${quizType}:${quiz.questions.length}`;
  useEffect(() => {
    setSelectedAnswers(
      quiz.questions.map(q => {
        const type = q.type || 'multiple_choice';
        if (type === 'multiple_select') return [];
        if (type === 'subjective_short' || type === 'subjective_essay') return '';
        return -1;
      })
    );
    setCurrentQuestionIndex(0);
    setDirection('next');
    setSubmissionResult(null);
    setUnlockedCert(null);
    setShowExplanations(false);
    setShowRubricModal(false);
  }, [quizKey, quiz.questions]);

  if (!isOpen) return null;

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isQuestionAnswered = (ans: number | number[] | string | undefined, qType: string = 'multiple_choice') => {
    if (qType === 'multiple_select') {
      return Array.isArray(ans) && ans.length > 0;
    }
    if (qType === 'subjective_short' || qType === 'subjective_essay') {
      return typeof ans === 'string' && ans.trim().length > 0;
    }
    return typeof ans === 'number' && ans !== -1;
  };

  const answeredCount = selectedAnswers.filter((ans, idx) => {
    const qType = quiz.questions[idx]?.type || 'multiple_choice';
    return isQuestionAnswered(ans, qType);
  }).length;

  const allAnswered = answeredCount === quiz.questions.length;
  const isPostTest = quizType === 'post_test';
  const preTestScore = progress?.preTestScore;
  const progressPercent = Math.round(((currentQuestionIndex + 1) / (quiz.questions.length || 1)) * 100);

  // Handlers for different question types
  const handleSelectSingleOption = (optionIndex: number) => {
    const updated = [...selectedAnswers];
    updated[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(updated);
  };

  const handleToggleMultiSelect = (optionIndex: number) => {
    const current = (Array.isArray(selectedAnswers[currentQuestionIndex])
      ? selectedAnswers[currentQuestionIndex]
      : []) as number[];
    const exists = current.includes(optionIndex);
    const updated = exists ? current.filter(i => i !== optionIndex) : [...current, optionIndex];
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = updated;
    setSelectedAnswers(newAnswers);
  };

  const handleTextAnswerChange = (text: string) => {
    const updated = [...selectedAnswers];
    updated[currentQuestionIndex] = text;
    setSelectedAnswers(updated);
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setDirection('next');
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setDirection('prev');
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    setDirection(index > currentQuestionIndex ? 'next' : 'prev');
    setCurrentQuestionIndex(index);
  };

  const handleSubmit = () => {
    const { submission, certificateGenerated } = submitQuiz(course.id, quizType, selectedAnswers);
    setSubmissionResult(submission);

    if (certificateGenerated) {
      setUnlockedCert(certificateGenerated);
      try {
        confetti({
          particleCount: 130,
          spread: 75,
          origin: { y: 0.6 }
        });
      } catch (e) {
        console.log('Confetti effect', e);
      }
    } else if (submission.passed && isPostTest) {
      try {
        confetti({
          particleCount: 90,
          spread: 65,
          origin: { y: 0.6 }
        });
      } catch (e) {
        console.log('Confetti effect', e);
      }
    }
  };

  const handleResetQuiz = () => {
    setSelectedAnswers(quiz.questions.map(q => {
      const type = q.type || 'multiple_choice';
      if (type === 'multiple_select') return [];
      if (type === 'subjective_short' || type === 'subjective_essay') return '';
      return -1;
    }));
    setCurrentQuestionIndex(0);
    setDirection('next');
    setSubmissionResult(null);
    setUnlockedCert(null);
    setShowExplanations(false);
  };

  // Variants for smooth transition between questions
  const slideVariants = {
    enter: (dir: 'next' | 'prev') => ({
      x: dir === 'next' ? 40 : -40,
      opacity: 0,
      scale: 0.98
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.28,
        ease: 'easeOut' as const
      }
    },
    exit: (dir: 'next' | 'prev') => ({
      x: dir === 'next' ? -40 : 40,
      opacity: 0,
      scale: 0.98,
      transition: {
        duration: 0.2,
        ease: 'easeIn' as const
      }
    })
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="relative m-auto w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Topmost Gradient Progress Bar */}
        {!submissionResult && (
          <div className="w-full bg-slate-100 h-2 relative overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 via-blue-500 to-emerald-500 transition-all duration-400 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                isPostTest ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {isPostTest ? 'Post-test (แบบทดสอบหลังเรียน)' : 'Pre-test (แบบทดสอบก่อนเรียน)'}
              </span>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-medium truncate max-w-[200px] sm:max-w-xs">
                {course.title}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
              {quiz.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {!submissionResult ? (
            /* Taking Quiz Mode with Smooth Single-Question Transition */
            <div className="space-y-6">
              {/* Question Position Meta & Mini Step Indicators */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    คำถามข้อที่ {currentQuestionIndex + 1}
                  </span>
                  <span className="text-slate-400">จากทั้งหมด {quiz.questions.length} ข้อ</span>
                  <span className="text-[11px] text-indigo-600 font-medium">
                    (ตอบแล้ว {answeredCount}/{quiz.questions.length})
                  </span>
                </div>

                <div className="flex items-center gap-1 font-mono text-[11px]">
                  <span>เกณฑ์ผ่าน:</span>
                  <span className="font-bold text-slate-800">{quiz.passingScorePercent}%</span>
                </div>
              </div>

              {/* Animated Question & Options Container */}
              <div className="relative min-h-[300px]">
                <AnimatePresence custom={direction} mode="wait">
                  <motion.div
                    key={currentQuestionIndex}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="space-y-5"
                  >
                    {/* Question Header & Type Badge */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {(!currentQuestion.type || currentQuestion.type === 'multiple_choice') && (
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold">
                            🔘 ปรนัย (เลือก 1 คำตอบ)
                          </span>
                        )}
                        {currentQuestion.type === 'true_false' && (
                          <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold">
                            ⚖️ ปรนัย (ถูก / ผิด)
                          </span>
                        )}
                        {currentQuestion.type === 'multiple_select' && (
                          <span className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-bold">
                            ☑️ ปรนัย (เลือกได้มากกว่า 1 คำตอบ)
                          </span>
                        )}
                        {currentQuestion.type === 'subjective_short' && (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                            ✍️ อัตนัย (ตอบสั้น / เติมคำ)
                          </span>
                        )}
                        {currentQuestion.type === 'subjective_essay' && (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                            📝 อัตนัย (ความเรียง / วิเคราะห์)
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500 font-medium">
                          {currentQuestion.points || 1} คะแนน
                        </span>
                      </div>

                      {currentQuestion.rubricGuide && (
                        <button
                          type="button"
                          onClick={() => setShowRubricModal(!showRubricModal)}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 flex items-center gap-1"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>{showRubricModal ? 'ซ่อนเกณฑ์ Rubric' : 'ดูเกณฑ์การให้คะแนน (Rubric)'}</span>
                        </button>
                      )}
                    </div>

                    {/* Rubric Card Accordion */}
                    {showRubricModal && currentQuestion.rubricGuide && (
                      <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 text-xs text-amber-950 space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-amber-900">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>เกณฑ์การให้คะแนน (Rubric Guide):</span>
                        </div>
                        <p className="leading-relaxed">{currentQuestion.rubricGuide}</p>
                      </div>
                    )}

                    {/* Question Statement Box */}
                    <div className="bg-slate-50/90 p-5 rounded-2xl border border-slate-200/90 shadow-sm">
                      <p className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">
                        {currentQuestion.question}
                      </p>
                    </div>

                    {/* TYPE 1 & TYPE 2: Single Choice & True/False */}
                    {(!currentQuestion.type || currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'true_false') && (
                      <div className="space-y-2.5">
                        {(currentQuestion.options || ['จริง (True)', 'เท็จ (False)']).map((option, idx) => {
                          const isSelected = selectedAnswers[currentQuestionIndex] === idx;
                          return (
                            <button
                              key={idx}
                              onClick={() => handleSelectSingleOption(idx)}
                              className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 group active:scale-[0.99] ${
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-50/70 shadow-sm shadow-indigo-500/10'
                                  : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                              }`}
                            >
                              <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                              }`}>
                                {isSelected ? <Check className="w-4 h-4" /> : String.fromCharCode(65 + idx)}
                              </div>

                              <span className={`text-sm pt-0.5 leading-snug transition-colors ${
                                isSelected ? 'text-indigo-950 font-bold' : 'text-slate-700'
                              }`}>
                                {option}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* TYPE 3: Multiple Select (Checkboxes) */}
                    {currentQuestion.type === 'multiple_select' && (
                      <div className="space-y-2.5">
                        <p className="text-xs text-slate-500 font-medium italic">
                          * สามารถเลือกตอบได้มากกว่าหนึ่งข้อ
                        </p>
                        {(currentQuestion.options || []).map((option, idx) => {
                          const currentSelected = (Array.isArray(selectedAnswers[currentQuestionIndex])
                            ? selectedAnswers[currentQuestionIndex]
                            : []) as number[];
                          const isSelected = currentSelected.includes(idx);

                          return (
                            <button
                              key={idx}
                              onClick={() => handleToggleMultiSelect(idx)}
                              className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 group active:scale-[0.99] ${
                                isSelected
                                  ? 'border-purple-600 bg-purple-50/70 shadow-sm shadow-purple-500/10'
                                  : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                              }`}
                            >
                              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                                  : 'bg-slate-50 border-slate-300 text-transparent group-hover:border-slate-400'
                              }`}>
                                <Check className="w-4 h-4 text-white" />
                              </div>

                              <span className={`text-sm pt-0.5 leading-snug transition-colors ${
                                isSelected ? 'text-purple-950 font-bold' : 'text-slate-700'
                              }`}>
                                {option}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* TYPE 4: Subjective Short Answer (ตอบสั้น/เติมคำ) */}
                    {currentQuestion.type === 'subjective_short' && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700">
                          พิมพ์คำตอบของคุณ (คำตอบสั้น / ข้อความสำคัญ):
                        </label>
                        <input
                          type="text"
                          value={(selectedAnswers[currentQuestionIndex] as string) || ''}
                          onChange={(e) => handleTextAnswerChange(e.target.value)}
                          placeholder="พิมพ์คำตอบของคุณที่นี่ เช่น gRPC หรือ Multi-stage build..."
                          className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                        />
                        <p className="text-[11px] text-slate-500">
                          💡 ระบบจะประเมินความสอดคล้องกับคีย์เวิร์ดของอาจารย์ผู้สอนทันที และอาจารย์สามารถปรับคะแนนเพิ่มเติมได้
                        </p>
                      </div>
                    )}

                    {/* TYPE 5: Subjective Essay (ความเรียง/วิเคราะห์) */}
                    {currentQuestion.type === 'subjective_essay' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-slate-700">
                            เขียนคำตอบ/วิเคราะห์อย่างละเอียด:
                          </label>
                          <span className="text-[11px] text-slate-400">
                            แนะนำ: ไม่เกิน {currentQuestion.maxWords || 200} คำ
                          </span>
                        </div>
                        <textarea
                          rows={6}
                          value={(selectedAnswers[currentQuestionIndex] as string) || ''}
                          onChange={(e) => handleTextAnswerChange(e.target.value)}
                          placeholder="เขียนอธิบายแนวคิด การออกแบบสถาปัตยกรรม วิธีการแก้ไขปัญหา และเหตุผลประกอบ..."
                          className="w-full p-4 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm leading-relaxed"
                        />
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>
                            จำนวนตัวอักษร: {((selectedAnswers[currentQuestionIndex] as string) || '').length}
                          </span>
                          <span>
                            คำตอบนี้จะถูกส่งให้อาจารย์ผู้สอนตรวจให้คะแนนตาม Rubric
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation Deck & Numbered Jump Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <button
                  onClick={handlePrev}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>ข้อก่อนหน้า</span>
                </button>

                {/* Question Numbers Quick Switcher */}
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
                  {quiz.questions.map((q, i) => {
                    const isAnswered = isQuestionAnswered(selectedAnswers[i], q.type || 'multiple_choice');
                    const isCurrent = i === currentQuestionIndex;

                    return (
                      <button
                        key={i}
                        onClick={() => handleJumpToQuestion(i)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all shrink-0 ${
                          isCurrent
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-105'
                            : isAnswered
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                        title={`ข้อที่ ${i + 1} (${isAnswered ? 'ตอบแล้ว' : 'ยังไม่ตอบ'})`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Next or Submit Button */}
                {currentQuestionIndex < quiz.questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-sm active:scale-95"
                  >
                    <span>ข้อถัดไป</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!allAnswered}
                    className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl transition-all disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-indigo-600/30 active:scale-95"
                  >
                    <span>ส่งคำตอบประมวลผล ({answeredCount}/{quiz.questions.length})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Results & Evaluation Screen */
            <div className="space-y-6">
              {/* Score Summary Banner */}
              <div className={`p-6 sm:p-8 rounded-3xl text-center border ${
                submissionResult.passed
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : submissionResult.pendingTeacherReview
                  ? 'bg-blue-50/80 border-blue-200 text-blue-950'
                  : 'bg-amber-50/70 border-amber-200 text-amber-950'
              }`}>
                {submissionResult.passed ? (
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                ) : submissionResult.pendingTeacherReview ? (
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3 shadow-sm">
                    <Sparkles className="w-8 h-8" />
                  </div>
                ) : (
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3 shadow-sm">
                    <XCircle className="w-8 h-8" />
                  </div>
                )}

                <h3 className="text-xl sm:text-2xl font-extrabold mb-1 tracking-tight">
                  {submissionResult.passed
                    ? 'ยินดีด้วย! คุณผ่านการทดสอบแล้ว'
                    : submissionResult.pendingTeacherReview
                    ? 'ส่งคำตอบเรียบร้อย (รอการตรวจข้อสอบอัตนัยจากอาจารย์)'
                    : 'ยังไม่ผ่านเกณฑ์การทดสอบ'}
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  {submissionResult.passed
                    ? isPostTest
                      ? 'คุณผ่านการทดสอบวัดความรู้หลังเรียนตามมาตรฐานของสถาบัน'
                      : 'คุณทำการทดสอบวัดพื้นฐานก่อนเรียนเรียบร้อยแล้ว พร้อมเริ่มเรียนบทเรียนแรก'
                    : submissionResult.pendingTeacherReview
                    ? 'ข้อสอบชุดนี้มีข้อสอบอัตนัยแบบวิเคราะห์/ความเรียง ซึ่งอาจารย์ผู้สอนจะตรวจและประเมินคะแนนตาม Rubric ทางระบบจะแจ้งเตือนเมื่อตรวจเสร็จสิ้น'
                    : `เกณฑ์การผ่านคือ ${quiz.passingScorePercent}% คุณสามารถทบทวนเนื้อหาและสอบใหม่ได้ตลอดเวลา`}
                </p>

                {/* Score Number Display */}
                <div className="my-5 flex items-center justify-center gap-4">
                  <div className="px-8 py-4 bg-white rounded-2xl shadow-sm border border-slate-200/80 inline-flex flex-col items-center">
                    <span className="text-4xl font-extrabold text-slate-900 font-mono tabular-nums">
                      {submissionResult.percentage}%
                    </span>
                    <span className="text-xs text-slate-500 mt-1 font-medium">
                      ({submissionResult.pendingTeacherReview ? 'คะแนนเบื้องต้น ' : 'คะแนนที่ได้ '}
                      {submissionResult.score} จาก {submissionResult.total} คะแนน)
                    </span>
                  </div>
                </div>

                {/* Comparative Pre vs Post Score Growth Box */}
                {isPostTest && preTestScore && (
                  <div className="mt-4 p-4 bg-white/95 rounded-2xl border border-indigo-100 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs shadow-sm">
                    <div>
                      <span className="text-slate-400 block text-[10px]">ก่อนเรียน (Pre-test)</span>
                      <span className="font-mono font-bold text-slate-700 text-sm">{preTestScore.percentage}%</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">หลังเรียน (Post-test)</span>
                      <span className="font-mono font-bold text-indigo-700 text-sm">{submissionResult.percentage}%</span>
                    </div>
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                      <TrendingUp className="w-4 h-4" />
                      <span>+{Math.max(0, submissionResult.percentage - preTestScore.percentage)}% การพัฒนาการ!</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Automatic Certificate Unlocked Card */}
              {unlockedCert && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white shadow-xl border border-indigo-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                      <Award className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span className="text-xs font-bold text-amber-300">ปลดล็อคใบประกาศนียบัตรอัตโนมัติแล้ว!</span>
                      </div>
                      <p className="text-xs text-indigo-100 mt-0.5">
                        รหัสตรวจสอบ: <span className="font-mono font-bold text-amber-200">{unlockedCert.credentialId}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (onCertificateUnlocked) onCertificateUnlocked(unlockedCert);
                      onClose();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-extrabold hover:bg-amber-300 transition-colors whitespace-nowrap shadow-lg active:scale-95"
                  >
                    ดูใบประกาศทันที
                  </button>
                </div>
              )}

              {/* Explanations Review Toggle */}
              <div>
                <button
                  onClick={() => setShowExplanations(!showExplanations)}
                  className="flex items-center gap-2 text-xs font-bold text-indigo-700 hover:text-indigo-800 transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>{showExplanations ? 'ซ่อนเฉลยและคำอธิบาย' : 'ดูเฉลยละเอียดและแนวทางการตอบ (Review Answers)'}</span>
                </button>

                {showExplanations && (
                  <div className="mt-4 space-y-4">
                    {quiz.questions.map((q, idx) => {
                      const userAns = submissionResult.answers[idx];
                      const qType = q.type || 'multiple_choice';

                      let isCorrect = false;
                      if (qType === 'multiple_choice' || qType === 'true_false') {
                        isCorrect = userAns === q.correctIndex;
                      } else if (qType === 'multiple_select') {
                        const correct = (q.correctIndices || []).slice().sort();
                        const userSelected = (Array.isArray(userAns) ? userAns : []).slice().sort();
                        isCorrect = JSON.stringify(correct) === JSON.stringify(userSelected);
                      } else if (qType === 'subjective_short') {
                        const subInfo = submissionResult.subjectiveAnswers?.[q.id];
                        isCorrect = (subInfo?.scoreAwarded || 0) > 0;
                      }

                      const subItem = submissionResult.subjectiveAnswers?.[q.id];

                      return (
                        <div key={q.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 leading-snug">
                              ข้อ {idx + 1}: {q.question}
                            </span>
                            {qType === 'subjective_essay' ? (
                              <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg shrink-0">
                                {subItem?.isGraded ? `ตรวจแล้ว (${subItem.scoreAwarded}/${subItem.maxScore} คะแนน)` : 'รอครูผู้สอนตรวจ'}
                              </span>
                            ) : isCorrect ? (
                              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5" /> ถูกต้อง (+{q.points || 1})
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-lg shrink-0">
                                <XCircle className="w-3.5 h-3.5" /> ไม่ถูกต้อง (0/{q.points || 1})
                              </span>
                            )}
                          </div>

                          <div className="text-xs space-y-2 text-slate-600">
                            {/* Single choice & True/False Answer Display */}
                            {(qType === 'multiple_choice' || qType === 'true_false') && (
                              <>
                                <p>
                                  <span className="text-slate-400">คำตอบของคุณ:</span>{' '}
                                  {typeof userAns === 'number' && q.options && q.options[userAns]
                                    ? q.options[userAns]
                                    : 'ไม่ได้ตอบ'}
                                </p>
                                {!isCorrect && q.options && typeof q.correctIndex === 'number' && (
                                  <p className="text-emerald-700 font-semibold">
                                    <span className="text-slate-400">คำตอบที่ถูกต้อง:</span> {q.options[q.correctIndex]}
                                  </p>
                                )}
                              </>
                            )}

                            {/* Multiple select Answer Display */}
                            {qType === 'multiple_select' && (
                              <>
                                <p>
                                  <span className="text-slate-400">คำตอบที่คุณเลือก:</span>{' '}
                                  {Array.isArray(userAns) && userAns.length > 0
                                    ? userAns.map(i => q.options?.[i]).filter(Boolean).join(', ')
                                    : 'ไม่ได้ตอบ'}
                                </p>
                                {!isCorrect && q.options && q.correctIndices && (
                                  <p className="text-emerald-700 font-semibold">
                                    <span className="text-slate-400">คำตอบที่ถูกต้องทั้งหมด:</span>{' '}
                                    {q.correctIndices.map(i => q.options?.[i]).filter(Boolean).join(', ')}
                                  </p>
                                )}
                              </>
                            )}

                            {/* Subjective Short Answer Display */}
                            {qType === 'subjective_short' && (
                              <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
                                <p>
                                  <span className="font-semibold text-slate-700">คำตอบของคุณ:</span>{' '}
                                  <span className="font-mono">{String(userAns || 'ไม่ได้ตอบ')}</span>
                                </p>
                                {q.sampleAnswer && (
                                  <p className="text-emerald-700 font-semibold">
                                    <span className="text-slate-400">แนวคำตอบ:</span> {q.sampleAnswer}
                                  </p>
                                )}
                                {q.keywords && q.keywords.length > 0 && (
                                  <p className="text-[11px] text-slate-500">
                                    <span>คีย์เวิร์ดสำคัญ:</span> {q.keywords.join(', ')}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Subjective Essay Display */}
                            {qType === 'subjective_essay' && (
                              <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200">
                                <div>
                                  <span className="font-semibold text-slate-700 block mb-1">คำตอบ/ความเรียงของคุณ:</span>
                                  <p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg whitespace-pre-wrap leading-relaxed">
                                    {String(userAns || 'ไม่ได้ตอบ')}
                                  </p>
                                </div>
                                {subItem?.teacherComment && (
                                  <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900">
                                    <span className="font-bold block">💬 ข้อเสนอแนะจากอาจารย์ ({subItem.gradedBy || 'อาจารย์ผู้ตรวจ'}):</span>
                                    <span>{subItem.teacherComment}</span>
                                  </div>
                                )}
                                {q.sampleAnswer && (
                                  <div>
                                    <span className="font-semibold text-emerald-800 block">แนวทางคำตอบที่สมบูรณ์ (Model Answer):</span>
                                    <p className="text-slate-600 text-[11px] leading-relaxed">{q.sampleAnswer}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Detailed Explanation */}
                            {q.explanation && (
                              <div className="mt-2.5 p-3 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                                <span className="font-bold text-slate-800">💡 คำอธิบายเชิงลึก:</span> {q.explanation}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={handleResetQuiz}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ทำแบบทดสอบอีกครั้ง</span>
                </button>

                <button
                  onClick={onClose}
                  className="px-6 py-2.5 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                >
                  เสร็จสิ้นและกลับสู่บทเรียน
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
