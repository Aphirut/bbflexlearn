import type { Quiz } from "../src/types";

export interface RegradedSubmission {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  pendingTeacherReview: boolean;
}

/**
 * ตรวจข้อสอบฝั่งเซิร์ฟเวอร์ (ตรรกะเดียวกับ client submitQuiz)
 * ใช้ให้คะแนน pre/post test ที่นักเรียนส่งมาใหม่ — client ส่งได้แค่ `answers`
 * ส่วน score/passed ต้องคำนวณตรงนี้เท่านั้น
 */
export function gradeQuiz(
  quiz: Pick<Quiz, "questions" | "passingScorePercent">,
  answers: unknown,
): RegradedSubmission {
  const list = Array.isArray(answers) ? answers : [];
  let earnedPoints = 0;
  let maxPoints = 0;
  let hasPendingSubjective = false;

  quiz.questions.forEach((q, idx) => {
    const qType = q.type || "multiple_choice";
    const qMaxPoints = q.points && q.points > 0 ? q.points : 1;
    maxPoints += qMaxPoints;

    const studentAns = list[idx];

    if (qType === "multiple_choice" || qType === "true_false") {
      if (typeof studentAns === "number" && studentAns === q.correctIndex) {
        earnedPoints += qMaxPoints;
      }
    } else if (qType === "multiple_select") {
      const correct = (q.correctIndices || []).slice().sort();
      const userSelected = (Array.isArray(studentAns) ? (studentAns as number[]) : []).slice().sort();
      if (JSON.stringify(correct) === JSON.stringify(userSelected)) {
        earnedPoints += qMaxPoints;
      }
    } else if (qType === "subjective_short") {
      const text = typeof studentAns === "string" ? studentAns.trim() : "";
      let matched = false;
      if (text) {
        if (q.sampleAnswer && text.toLowerCase().includes(q.sampleAnswer.toLowerCase().trim())) {
          matched = true;
        } else if (q.keywords && q.keywords.length > 0) {
          matched = q.keywords.some((k) => text.toLowerCase().includes(k.toLowerCase().trim()));
        }
      }
      if (matched) earnedPoints += qMaxPoints;
    } else if (qType === "subjective_essay") {
      hasPendingSubjective = true;
    }
  });

  const percentage = Math.round((earnedPoints / (maxPoints || 1)) * 100);
  return {
    score: earnedPoints,
    total: maxPoints,
    percentage,
    passed: !hasPendingSubjective && percentage >= quiz.passingScorePercent,
    pendingTeacherReview: hasPendingSubjective,
  };
}
