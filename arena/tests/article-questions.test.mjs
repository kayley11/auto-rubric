import test from "node:test";
import assert from "node:assert/strict";
import {
  editedQuestion,
  questionCounts,
  questionPayload,
  questionPreview,
} from "../src/articleQuestions.mjs";

function fixture() {
  const question = {
    id: "Q01",
    title: "Initial assessment",
    question: "What remains uncertain?",
    context: "",
    decision_point: "REVIEWER_ONLY",
    reference_answer: "REFERENCE_ONLY",
    visible_fact_ids: ["F1"],
    reference_fact_ids: ["F2"],
    include: true,
    review: {
      source_checked: true,
      visibility_checked: true,
      question_checked: true,
    },
    task_type: "clinical_interpretation",
    answer_basis: "synthesis",
    visibility_note: "HIDDEN_NOTE",
  };
  return {
    revision: 0,
    case_code: "CASE-ONE",
    task_prefix: "Answer using the supplied evidence.",
    source: "https://example.org/hidden-diagnosis",
    facts: [
      { id: "F1", text: "Initial symptoms." },
      { id: "F2", text: "HIDDEN_FOLLOWUP" },
    ],
    confirmed_cases: {},
    questions: [question, { ...question, id: "Q02", include: false }],
  };
}
test("question preview contains only that question's visible case and task", () => {
  const set = fixture(),
    preview = JSON.stringify(questionPreview(set, set.questions[0]));
  assert.match(preview, /Initial symptoms/);
  for (const hidden of [
    "HIDDEN_FOLLOWUP",
    "REFERENCE_ONLY",
    "REVIEWER_ONLY",
    "HIDDEN_NOTE",
    "https://",
  ])
    assert.ok(!preview.includes(hidden));
});
test("selection and confirmation count tasks under one parent case", () => {
  const set = fixture();
  assert.deepEqual(questionCounts(set), {
    total: 2,
    selected: 1,
    reviewed: 1,
    confirmed: 0,
  });
  set.confirmed_cases.Q01 = {};
  assert.deepEqual(questionCounts(set), {
    total: 2,
    selected: 0,
    reviewed: 0,
    confirmed: 1,
  });
});
test("editing evidence or reference clears review checks; selecting a task does not", () => {
  const q = fixture().questions[0];
  assert.ok(
    Object.values(
      editedQuestion(q, "reference_answer", "Changed").review,
    ).every((value) => value === false),
  );
  assert.ok(
    Object.values(editedQuestion(q, "visible_fact_ids", ["F2"]).review).every(
      (value) => value === false,
    ),
  );
  assert.deepEqual(editedQuestion(q, "include", false).review, q.review);
});
test("save payload preserves question IDs without accepting source snapshots from the client", () => {
  const set = fixture();
  set.questions[0].prepared_input = { facts: "stale preview" };
  const payload = questionPayload(set);
  assert.equal(payload.questions[0].id, "Q01");
  assert.equal(payload.questions[0].prepared_input, undefined);
  assert.equal(payload.source, undefined);
  assert.equal(payload.facts, undefined);
});
