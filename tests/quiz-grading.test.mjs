import assert from "node:assert/strict";
import { gradeQuiz } from "../server/grading.ts";

const quiz = {
  passingScorePercent: 70,
  questions: [
    { id: "q1", type: "multiple_choice", question: "1+1?", options: ["1", "2", "3", "4"], correctIndex: 1, explanation: "", points: 1 },
    { id: "q2", type: "true_false", question: "ฟ้าใส?", options: ["ถูก", "ผิด"], correctIndex: 0, explanation: "", points: 1 },
    { id: "q3", type: "multiple_select", question: "เลือกคู่?", options: ["2", "3", "4", "5"], correctIndices: [0, 2], explanation: "", points: 2 },
    { id: "q4", type: "subjective_short", question: "เมืองหลวง?", sampleAnswer: "กรุงเทพ", explanation: "", points: 1 },
  ],
};

// ตอบถูกหมด -> ต้องผ่าน (ปลอม passed=true เองไม่ได้ช่วยอะไร เพราะ server คำนวณเอง)
const perfect = gradeQuiz(quiz, [1, 0, [0, 2], "กรุงเทพมหานคร"]);
assert.equal(perfect.score, 5);
assert.equal(perfect.total, 5);
assert.equal(perfect.percentage, 100);
assert.equal(perfect.passed, true);

// ตอบผิดหมดแต่ client อ้างว่าผ่าน -> server ต้องคำนวณตก (ช่องโหว่เดิม: เชื่อ passed จาก client)
const forged = gradeQuiz(quiz, [0, 1, [1, 3], "เชียงใหม่"]);
assert.equal(forged.score, 0);
assert.equal(forged.percentage, 0);
assert.equal(forged.passed, false);

// multiple_select เลือกเกิน/ขาด -> ไม่ได้คะแนน
assert.equal(gradeQuiz(quiz, [1, 0, [0], "กรุงเทพ"]).score, 3);
assert.equal(gradeQuiz(quiz, [1, 0, [0, 1, 2], "x"]).score, 2);

// ข้อสอบอัตนัย essay -> ต้องรอครูตรวจ ผ่านไม่ได้ทันทีแม้คะแนนถึง
const essayQuiz = {
  passingScorePercent: 0,
  questions: [{ id: "e1", type: "subjective_essay", question: "อธิบาย?", explanation: "", points: 5 }],
};
const essay = gradeQuiz(essayQuiz, ["ตอบยาว..."]);
assert.equal(essay.passed, false);
assert.equal(essay.pendingTeacherReview, true);

// คำตอบขาด/รูปแบบผิด -> fail closed ไม่ล้ม
const malformed = gradeQuiz(quiz, null);
assert.equal(malformed.passed, false);
assert.equal(malformed.total, 5);

console.log("quiz-grading tests passed");
