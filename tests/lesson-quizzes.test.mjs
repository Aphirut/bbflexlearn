import assert from "node:assert/strict";
import { getQuizzesAfterUnit, cleanQuiz, scoreLessonQuiz, matchRightOrder } from "../src/utils/lessonQuizzes.ts";

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

// matching: ให้คะแนนเป็นสัดส่วน, เลือกคู่ตามดัชนีคู่เดิม (ไม่ใช่ตำแหน่งที่แสดง)
const match = {
  id: "m", question: "จับคู่", type: "matching", points: 2, explanation: "",
  matchPairs: [{ left: "A", right: "1" }, { left: "B", right: "2" }, { left: "C", right: "3" }, { left: "D", right: "4" }],
};
assert.deepEqual([...matchRightOrder(match)].sort(), [0, 1, 2, 3]);
const mq = (questions, passingScorePercent = 70) => ({ id: "x", title: "t", type: "lesson_quiz", passingScorePercent, questions });
assert.deepEqual(scoreLessonQuiz(mq([match]), [[0, 1, 2, 3]]), { percent: 100, passed: true });
assert.deepEqual(scoreLessonQuiz(mq([match]), [[0, 1, 3, 2]]), { percent: 50, passed: false });

// subjective_short ตรวจจากคำสำคัญ, essay ไม่นับคะแนน, ข้อที่ไม่มีเฉลยไม่นับ
const short = { id: "s", question: "?", type: "subjective_short", keywords: ["redis"], explanation: "" };
const essay = { id: "e", question: "?", type: "subjective_essay", explanation: "" };
const noKey = { id: "n", question: "?", type: "subjective_short", explanation: "" };
assert.deepEqual(scoreLessonQuiz(mq([short, essay]), ["ใช้ Redis", "ยาวมาก"]), { percent: 100, passed: true });
assert.deepEqual(scoreLessonQuiz(mq([short, noKey]), ["ไม่รู้", "x"]), { percent: 0, passed: false });
assert.deepEqual(scoreLessonQuiz(mq([noKey]), ["x"]), { percent: 100, passed: true });

// cleanQuiz: matching ตัดคู่ว่าง, subjective คงโจทย์
const cleanedNew = cleanQuiz(mq([
  { id: "m2", question: "จับคู่", type: "matching", explanation: "", matchPairs: [{ left: "a", right: "" }, { left: " b ", right: "2" }, { left: "c", right: "3" }] },
  { id: "m3", question: "จับคู่", type: "matching", explanation: "", matchPairs: [{ left: "a", right: "1" }] },
  { id: "s2", question: " อธิบาย ", type: "subjective_essay", explanation: "", rubricGuide: " เกณฑ์ " },
]));
assert.equal(cleanedNew.questions.length, 2);
assert.deepEqual(cleanedNew.questions[0].matchPairs, [{ left: "b", right: "2" }, { left: "c", right: "3" }]);
assert.equal(cleanedNew.questions[1].question, "อธิบาย");
assert.equal(cleanedNew.questions[1].rubricGuide, "เกณฑ์");

console.log("lesson-quizzes tests passed");
