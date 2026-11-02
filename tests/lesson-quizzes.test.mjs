import assert from "node:assert/strict";
import { getQuizzesAfterUnit, cleanQuiz } from "../src/utils/lessonQuizzes.ts";

const q = (id) => ({ id, title: id, type: "lesson_quiz", passingScorePercent: 70, questions: [{ id: `${id}-q`, question: "?", type: "multiple_choice", options: ["a", "b"], correctIndex: 0, explanation: "" }] });
const empty = { id: "empty", title: "empty", type: "lesson_quiz", passingScorePercent: 70, questions: [] };

// บทที่ไม่มีบทย่อย: แบบทดสอบประจำบทต่อท้ายคลิปหลัก
const plain = { id: "L1", title: "", description: "", durationMinutes: 1, videoUrl: "", order: 1, quiz: q("lq") };
assert.deepEqual(getQuizzesAfterUnit(plain, null).map(x => x.id), ["lq"]);

// บทที่มีบทย่อย: คลิปหลักไม่ gate, ตอนย่อยมีแบบทดสอบของตัวเอง, ตอนสุดท้ายต่อด้วยแบบทดสอบประจำบท
const withSubs = {
  ...plain,
  subLessons: [
    { id: "s1", title: "1", durationMinutes: 1, videoUrl: "", order: 1, quiz: q("s1q") },
    { id: "s2", title: "2", durationMinutes: 1, videoUrl: "", order: 2 },
  ],
};
assert.deepEqual(getQuizzesAfterUnit(withSubs, null), []);
assert.deepEqual(getQuizzesAfterUnit(withSubs, "s1").map(x => x.id), ["s1q"]);
assert.deepEqual(getQuizzesAfterUnit(withSubs, "s2").map(x => x.id), ["lq"]);

// แบบทดสอบที่ไม่มีคำถามต้องไม่ gate
assert.deepEqual(getQuizzesAfterUnit({ ...plain, quiz: empty }, null), []);

// cleanQuiz: ตัดตัวเลือกว่างแล้ว remap เฉลย, ตัดข้อที่ไม่สมบูรณ์
const dirty = {
  id: "d", title: "  ", type: "lesson_quiz", passingScorePercent: 150,
  questions: [
    { id: "a", question: " โจทย์ ", type: "multiple_select", options: ["x", "", "y", "z"], correctIndices: [2, 3, 1], explanation: " e " },
    { id: "b", question: "ไม่มีเฉลย", type: "multiple_choice", options: ["1", "2"], correctIndex: -1, explanation: "" },
    { id: "c", question: "", type: "multiple_choice", options: ["1", "2"], correctIndex: 0, explanation: "" },
    { id: "d", question: "เฉลยเป็นช่องว่าง", type: "multiple_choice", options: ["", "k", "m"], correctIndex: 2, explanation: "" },
  ],
};
const cleaned = cleanQuiz(dirty);
assert.equal(cleaned.title, "แบบทดสอบ");
assert.equal(cleaned.passingScorePercent, 100);
assert.equal(cleaned.questions.length, 2);
assert.deepEqual(cleaned.questions[0].options, ["x", "y", "z"]);
assert.deepEqual(cleaned.questions[0].correctIndices, [1, 2]);
assert.equal(cleaned.questions[0].question, "โจทย์");
assert.equal(cleaned.questions[1].correctIndex, 1);
assert.deepEqual(cleaned.questions[1].options, ["k", "m"]);
assert.equal(cleanQuiz({ ...dirty, questions: [dirty.questions[1], dirty.questions[2]] }), undefined);
assert.equal(cleanQuiz(undefined), undefined);

console.log("lesson-quizzes tests passed");
