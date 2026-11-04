import test from "node:test";
import assert from "node:assert/strict";
import {
  writtenCriteria,
  currentStudyVersion,
  initialScoringVersion,
} from "../src/caseIdentity.mjs";
import { caseContextData } from "../src/caseContextData.mjs";
import {
  filterEvaluations,
  isTechnicalCheck,
  savedEvaluationLabel,
  savedComparisonGroups,
} from "../src/evaluationHistory.mjs";
import {
  caseErrors,
  evaluateRow,
  evaluationInput,
  parseCases,
  PROVIDED_ANSWER,
  comparisonColumns,
  comparisonCSV,
  modelsForCase,
  restoreComparison,
  resultSummary,
  savedComparison,
  runComparisonQueue,
  answerColumn,
} from "../src/caseImport.mjs";

test("Explicit duplicate case codes are rejected instead of silently merging inputs", () => {
  assert.throws(
    () =>
      parseCases(
        '[{"case_code":"SAME","facts":"A","task":"B"},{"case_code":"SAME","facts":"C","task":"D"}]',
      ),
    /repeats case code/i,
  );
});
test("Saved comparisons reopen the actual case–model records with their original rules", () => {
  const input = {
    comparison_id: "group",
    case_code: "CASE-A",
    case_number: "source-1",
    facts: "A",
    task: "B",
    history: "",
    source: "citation",
    reference: "pending",
    rules_version: "original",
    criteria: ["D1"],
    judge_model: "judge",
    answer: "Actual answer",
    answer_model: "m1",
  };
  const runs = [
    {
      id: "r1",
      status: "complete",
      answer_source: "generated",
      input,
      grades: { D1: { status: "scored", score: 4 } },
    },
    {
      id: "r2",
      status: "complete",
      answer_source: "generated",
      input: {
        ...input,
        case_code: "CASE-B",
        case_number: "source-2",
        answer_model: "m2",
      },
      grades: { D1: { status: "scored", score: 5 } },
    },
  ];
  const reopened = savedComparison(runs);
  assert.equal(reopened.readOnly, true);
  assert.equal(reopened.rows[0].number, "source-1");
  assert.equal(reopened.rows[0].results.m1.runId, "r1");
  assert.deepEqual(modelsForCase(reopened.rows[0], reopened.defaults), ["m1"]);
  assert.equal(reopened.defaults.rules_version, "original");
  assert.equal(reopened.rows[0].data.reference, "pending");
  assert.throws(
    () =>
      savedComparison([
        runs[0],
        { ...runs[1], input: { ...runs[1].input, judge_model: "other" } },
      ]),
    /different scoring/,
  );
  assert.throws(
    () => savedComparison([runs[0], runs[0]]),
    /same case and model/,
  );
  assert.equal(
    answerColumn({ ...runs[0], answer_source: "pasted" }),
    PROVIDED_ANSWER,
  );
});
test("Comparison groups retain source records and distinct cases without losing model labels", () => {
  const records = [
    {
      id: "a",
      comparison_id: "g",
      case_code: "C1",
      answer_model: "m1",
      status: "complete",
    },
    {
      id: "b",
      comparison_id: "g",
      case_code: "C1",
      answer_model: "m2",
      status: "error",
    },
    {
      id: "c",
      comparison_id: "g",
      case_code: "C2",
      answer_model: "m1",
      status: "complete",
    },
  ];
  const [group] = savedComparisonGroups(records);
  assert.equal(group.cases, 2);
  assert.equal(group.complete, 2);
  assert.deepEqual(group.models, ["m1", "m2"]);
});
test("Timeouts move to the queue tail while untouched cases finish first", async () => {
  const order = [],
    attempts = {};
  const result = await runComparisonQueue(
    ["A", "B", "C"],
    async (task) => {
      order.push(task);
      attempts[task] = (attempts[task] || 0) + 1;
      if (task === "A" && attempts.A === 1) throw Error("Request timed out");
    },
    { wait: async () => {} },
  );
  assert.deepEqual(order, ["A", "B", "C", "A"]);
  assert.equal(result.completed, 3);
  assert.equal(result.failures.length, 0);
});
test("Queue retries are bounded and permanent errors do not block the next case", async () => {
  const order = [];
  const result = await runComparisonQueue(
    ["timeout", "bad-key", "good"],
    async (task) => {
      order.push(task);
      if (task === "timeout") throw Error("HTTP 503 temporarily unavailable");
      if (task === "bad-key") throw Error("HTTP 401 invalid key");
    },
    { wait: async () => {} },
  );
  assert.equal(order.filter((v) => v === "timeout").length, 3);
  assert.equal(order.filter((v) => v === "bad-key").length, 1);
  assert.equal(result.completed, 1);
  assert.equal(result.failures.length, 2);
});

test("CSV preserves quoted commas, line breaks and escaped quotes", () => {
  const [row] = parseCases(
    'title,facts,task,answer\r\nCase,"A, B\nPatient says ""dizzy""",Explain,Existing response',
  );
  assert.equal(row.data.facts, 'A, B\nPatient says "dizzy"');
  assert.equal(row.data.answer, "Existing response");
});
test("Malformed CSV and non-text fields are rejected before a run", () => {
  for (const text of [
    'facts,task\n"Unclosed,Explain',
    "facts,task\nA,B,C",
    "facts,facts\nA,B",
  ])
    assert.throws(() => parseCases(text));
  assert.throws(() => parseCases('[{"facts":{"a":1}}]'), /facts must be text/);
});
test("JSON, wrapped JSON and JSONL use the same fields", () => {
  for (const [text, name] of [
    ['[{"case_text":"A","question":"B"}]', "a.json"],
    ['{"cases":[{"facts":"A","task":"B"}]}', "a.json"],
    ['{"facts":"A","task":"B"}\n{"facts":"C","task":"D"}', "a.jsonl"],
  ]) {
    const rows = parseCases(text, name);
    assert.equal(rows[0].data.facts, "A");
    assert.equal(rows[0].data.task, "B");
  }
});
test("Preview checks required text, common task, server limits and revised D5c evidence", () => {
  const [row] = parseCases('[{"facts":"A"}]');
  assert.equal(caseErrors(row.data, "Shared task").length, 0);
  assert.match(caseErrors(row.data, "")[0], /task/);
  assert.match(
    caseErrors({ ...row.data, answer: "x".repeat(50001) }, "B")[0],
    /answer is too long/,
  );
  assert.equal(
    caseErrors(row.data, "B", { rules_version: "proposed", criteria: ["D5c"] })
      .length,
    2,
  );
});
test("An imported case never inherits another case's reference or interview", () => {
  const [row] = parseCases('[{"facts":"A","task":"B"}]');
  const input = evaluationInput(row.data, {
    reference: "Other case",
    case_id: "C01",
    interview: {
      turns: [{ question: "Other question" }],
      closing_notes: "Other answer",
      availability_context: "Other findings",
    },
    requirements: [{ id: "Other" }],
  });
  assert.equal(input.reference, "");
  assert.equal(input.case_id, "");
  assert.deepEqual(input.interview.turns, []);
  assert.equal(input.interview.availability_context, undefined);
  assert.equal(input.interview.closing_notes, undefined);
  assert.deepEqual(input.requirements, []);
  assert.equal(input.reference_status, "draft");
});

function harness(sequence) {
  const calls = [],
    updates = [];
  return {
    calls,
    updates,
    options: {
      wait: async () => {},
      update: (v) => updates.push(v),
      api: async (path, body) => {
        calls.push({ path, body });
        const value = sequence.shift();
        if (!value) throw Error("Unexpected request");
        if (value instanceof Error) throw value;
        return value;
      },
    },
  };
}
test("A generated answer is scored only after generation finishes", async () => {
  const h = harness([
    { id: "a", status: "generating" },
    { id: "a", status: "answer_ready", input: { answer: "Saved answer" } },
    { id: "a", status: "scoring" },
    { id: "a", status: "complete", grades: { D1: {} } },
  ]);
  await evaluateRow({ runId: "" }, { facts: "A", answer: "" }, h.options);
  assert.equal(h.calls[0].body.action, "generate");
  assert.equal(h.calls[2].path, "/api/runs/a/evaluate");
  assert.equal(h.calls[2].body.answer, "Saved answer");
  assert.equal(h.updates.at(-1).scored, 1);
});
test("Pasted answers go directly to scoring", async () => {
  const h = harness([{ id: "a", status: "complete", grades: {} }]);
  await evaluateRow({ runId: "" }, { answer: "Pasted" }, h.options);
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].body.action, "evaluate");
});
test("Resuming a partial saved run retries it without creating a duplicate", async () => {
  const h = harness([
    { id: "a", status: "partial", input: { answer: "Saved" } },
    { id: "a", status: "complete", grades: { D1: {} } },
  ]);
  await evaluateRow({ runId: "a" }, {}, h.options);
  assert.deepEqual(
    h.calls.map((c) => c.path),
    ["/api/runs/a", "/api/runs/a/retry"],
  );
});
test("A failed case retains its run ID for a later retry", async () => {
  const h = harness([
    { id: "a", status: "scoring" },
    { id: "a", status: "partial", error: "Rate limit" },
  ]);
  await assert.rejects(
    evaluateRow({ runId: "" }, { answer: "Saved" }, h.options),
    /Rate limit/,
  );
  assert.equal(h.updates.at(-1).runId, "a");
});

test("A batch compares each generated case across selected models but scores a supplied answer once", () => {
  const rows = parseCases(
    '[{"case_id":"X01","facts":"A","task":"B"},{"case_id":"X02","facts":"C","task":"D","answer":"Saved response"}]',
  );
  const settings = { answer_models: ["arc:lite", "arc:chat", "arc:lite"] };
  assert.deepEqual(comparisonColumns(rows, settings), [
    "arc:lite",
    "arc:chat",
    PROVIDED_ANSWER,
  ]);
  assert.deepEqual(modelsForCase(rows[0], settings), ["arc:lite", "arc:chat"]);
  assert.deepEqual(modelsForCase(rows[1], settings), [PROVIDED_ANSWER]);
  assert.deepEqual(
    rows.map((r) => r.number),
    ["X01", "X02"],
  );
  assert.deepEqual(modelsForCase(rows[0], { answer_models: [] }), []);
});

test("Legacy single-model batches keep their saved run IDs when opened as a comparison", () => {
  const rows = restoreComparison({
    defaults: { answer_model: "arc:chat" },
    rows: [
      {
        id: "row-1",
        data: { answer: "" },
        runId: "preserved",
        status: "complete",
      },
    ],
  });
  assert.equal(rows[0].results["arc:chat"].runId, "preserved");
  assert.equal(rows[0].number, "1");
});

test("Matrix findings quote an assessed item rather than inventing a total score", () => {
  const summary = resultSummary({
    grades: {
      D1: { status: "scored", score: 5, explanation: "Accurate." },
      D3a: {
        status: "scored",
        score: 2,
        explanation: "Commitment is not supported.",
      },
      D5c: { status: "indeterminate", score: null },
    },
  });
  assert.equal(summary.scored, 3);
  assert.equal(summary.summary, "D3a: Commitment is not supported.");
  assert.equal(summary.grades.D5c.score, null);
  assert.equal(summary.total_score, undefined);
});

test("Comparison CSV preserves case numbers, item grades, model columns and quoted explanations", () => {
  const [row] = parseCases('[{"case_number":"R-7","facts":"A","task":"B"}]');
  row.results = {
    "arc:lite": {
      status: "complete",
      grades: { D1: { score: 4, status: "scored" } },
      summary: 'Check "A", then B.',
    },
  };
  const csv = comparisonCSV([row], { answer_models: ["arc:lite", "arc:apex"] });
  assert.match(
    csv,
    /"Case code","Source row","Optional label","Scoring version","arc:lite scores"/,
  );
  assert.match(csv, /"R-7"/);
  assert.match(csv, /"D1=4"/);
  assert.match(csv, /"Check ""A"", then B\."/);
  assert.match(csv, /"ready"/);
});

test("Unnamed cases receive distinct codes which survive model expansion and resume", () => {
  const rows = parseCases(
    '[{"facts":"A","task":"B"},{"facts":"A","task":"B"}]',
  );
  assert.match(rows[0].data.case_code, /^CASE-[A-F0-9]{10}$/);
  assert.notEqual(rows[0].data.case_code, rows[1].data.case_code);
  assert.equal(rows[0].data.title, rows[0].data.case_code);
  const inputs = ["arc:lite", "arc:apex"].map((answer_model) =>
    evaluationInput(rows[0].data, { answer_model }),
  );
  assert.equal(inputs[0].case_code, inputs[1].case_code);
  const restored = restoreComparison(JSON.parse(JSON.stringify({ rows })));
  assert.equal(restored[0].data.case_code, inputs[0].case_code);
  assert.equal(
    parseCases(JSON.stringify([rows[0].data]))[0].data.case_code,
    inputs[0].case_code,
  );
});

test("Written-case defaults leave actual acquisition optional without changing saved presets", () => {
  const config = {
    presets: { "Clinical reasoning": ["D1", "D3a", "D5c", "D6b"] },
  };
  assert.deepEqual(writtenCriteria(config), ["D1", "D3a", "D6b"]);
  assert.ok(config.presets["Clinical reasoning"].includes("D5c"));
});

test("Current study defaults apply to empty forms while populated or explicitly configured drafts keep their version", () => {
  const current = "overleaf-20261024-read-20261028";
  const config = {
    rule_versions: [{ id: "original" }, { id: current }],
    rubric_catalogue: [
      { id: "clinical-reasoning", versions: ["original", current] },
      { id: "other", versions: ["original"] },
    ],
  };
  assert.equal(currentStudyVersion(config), current);
  assert.equal(currentStudyVersion(config, "other"), "original");
  assert.equal(
    initialScoringVersion(config, { facts: "", rules_version: "original" }),
    current,
  );
  assert.equal(
    initialScoringVersion(config, {
      facts: "Saved input",
      rules_version: "original",
    }),
    "original",
  );
  assert.equal(
    initialScoringVersion(config, {
      facts: "",
      rules_version: "original",
      _version_explicit: true,
    }),
    "original",
  );
});

test("The full case context preserves returned records and source details without adding hidden evidence to blind review", () => {
  const data = {
    case_code: "CASE-A",
    title: "Source title",
    description: "Broader source summary",
    facts: "Only supplied facts",
    task: "Audience: a clinician. Assess.",
    history: "Earlier input",
    answer: "Saved answer",
    source: "https://example.org/paper",
    source_location: "Case presentation, paragraph 3",
    reference: "HIDDEN_REFERENCE",
    requirements: [{ id: "HIDDEN_CHECKLIST" }],
    turns: [
      {
        question: "What happened on readmission?",
        returned: [{ text: "Actual record", context: "Readmission 14 March" }],
        assessment: { note: "ASSESSMENT_NOT_RECEIVED" },
      },
    ],
  };
  const full = caseContextData(data);
  assert.equal(full.description, data.description);
  assert.equal(full.source_location, data.source_location);
  assert.match(full.turns[0].records, /Readmission 14 March\nActual record/);
  const blind = caseContextData(data, true);
  assert.equal(blind.facts, data.facts);
  assert.equal(blind.history, data.history);
  assert.equal(blind.answer, data.answer);
  assert.deepEqual(blind.turns, full.turns);
  for (const hidden of [
    data.title,
    data.description,
    data.source,
    data.source_location,
    data.reference,
    "HIDDEN_CHECKLIST",
    "ASSESSMENT_NOT_RECEIVED",
  ])
    assert.ok(!JSON.stringify(blind).includes(hidden));
});

test("Deployment checks stay accessible separately without changing clinical records or scores", () => {
  const records = [
    {
      id: "11111111",
      title: "Deployment check — synthetic headache",
      graded: 1,
      total: 1,
    },
    {
      id: "22222222",
      title: "Deployment check — saved N02 interview",
      graded: 2,
      total: 2,
    },
    {
      id: "33333333",
      title: "Deployment of a stent",
      purpose: "clinical-validation",
      graded: 3,
      total: 3,
    },
    {
      id: "44444444",
      case_code: "CASE-A",
      title: "Ordinary case",
      graded: 0,
      total: 3,
    },
  ];
  const before = JSON.stringify(records);
  assert.deepEqual(
    filterEvaluations(records).map((r) => r.id),
    ["33333333", "44444444"],
  );
  assert.deepEqual(
    filterEvaluations(records, "technical").map((r) => r.id),
    ["11111111", "22222222"],
  );
  assert.equal(
    filterEvaluations(records, "technical", "N02")[0].id,
    "22222222",
  );
  assert.equal(
    filterEvaluations(records, "evaluations", "case-a")[0].id,
    "44444444",
  );
  assert.equal(isTechnicalCheck({ purpose: "ui_validation" }), true);
  assert.equal(savedEvaluationLabel(records[2]), "Evaluation 33333333");
  assert.equal(savedEvaluationLabel(records[3]), "CASE-A");
  assert.equal(JSON.stringify(records), before);
});
