// File parsing and the existing single-case evaluation flow; no model calls on import.
import { newCaseCode } from "./caseIdentity.mjs";
export const BATCH_STORAGE = "autorubric-batch-v1";
export const MAX_CASES = 200;
const text = (v) => (v == null ? "" : String(v)).trim();
const aliases = {
  case_code: ["case_code"],
  title: ["title", "name", "case_name", "case_id", "id"],
  facts: ["facts", "case", "case_text", "case_facts", "vignette"],
  task: ["task", "question", "instruction", "instructions"],
  answer: ["answer", "response", "model_answer", "model_response"],
  reference: ["reference", "reference_points"],
  source: ["source", "source_url"],
  history: ["history", "conversation"],
};

export function parseCSV(input) {
  const rows = [];
  let row = [],
    cell = "",
    quoted = false;
  const value = input.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (quoted) {
      if (c === '"' && value[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"' && !cell) quoted = true;
    else if (c === "," || c === "\n") {
      row.push(cell);
      cell = "";
      if (c === "\n") {
        if (row.some((s) => s.trim())) rows.push(row);
        row = [];
      }
    } else cell += c;
  }
  if (quoted)
    throw new Error(
      "A quoted CSV field is not closed. Check the file, then import it again.",
    );
  row.push(cell);
  if (row.some((s) => s.trim())) rows.push(row);
  if (rows.length < 2)
    throw new Error(
      "Include a header row and at least one case. Download the example to see the format.",
    );
  const headers = rows
    .shift()
    .map((s) => s.trim().toLowerCase().replace(/[ -]+/g, "_"));
  if (new Set(headers).size !== headers.length)
    throw new Error("CSV column names must be unique.");
  return rows.map((cells, i) => {
    if (cells.length !== headers.length)
      throw new Error(
        `CSV row ${i + 2} has ${cells.length} fields; the header has ${headers.length}. Put commas and line breaks inside quoted fields.`,
      );
    return Object.fromEntries(headers.map((h, n) => [h, cells[n]]));
  });
}

export function parseCases(input, filename = "") {
  const content = input.replace(/^\uFEFF/, "").trim();
  if (!content) throw new Error("Choose a file or paste case data first.");
  let source;
  if (/\.jsonl$/i.test(filename)) {
    source = content
      .split(/\r?\n/)
      .filter((s) => s.trim())
      .map((line, i) => {
        try {
          return JSON.parse(line);
        } catch {
          throw new Error(`JSONL line ${i + 1} is not valid JSON.`);
        }
      });
  } else if (/^[\[{]/.test(content) || /\.json$/i.test(filename)) {
    try {
      source = JSON.parse(content);
    } catch {
      throw new Error(
        "This JSON is not valid. Use an array of cases, or an object with a cases array.",
      );
    }
    source = Array.isArray(source) ? source : source?.cases;
  } else source = parseCSV(content);
  if (!Array.isArray(source) || !source.length)
    throw new Error("The file must contain a non-empty list of cases.");
  if (source.length > MAX_CASES)
    throw new Error(
      `Import up to ${MAX_CASES} cases at a time. Split this file into smaller batches.`,
    );
  const codes = new Set();
  return source.map((item, i) => {
    if (!item || typeof item !== "object" || Array.isArray(item))
      throw new Error(`Case ${i + 1} must be an object with a facts field.`);
    const fields = Object.fromEntries(
      Object.entries(item).map(([k, v]) => [
        k.toLowerCase().replace(/[ -]+/g, "_"),
        v,
      ]),
    );
    const data = Object.fromEntries(
      Object.entries(aliases).map(([key, names]) => {
        const value = names.map((n) => fields[n]).find((v) => v != null);
        if (value != null && typeof value !== "string")
          throw new Error(`Case ${i + 1}: ${key} must be text.`);
        return [key, text(value)];
      }),
    );
    data.case_code ||= newCaseCode();
    if (codes.has(data.case_code))
      throw new Error(
        `Case ${i + 1} repeats case code ${data.case_code}. Give each case a unique code, or omit case_code to create one automatically.`,
      );
    codes.add(data.case_code);
    data.title ||= data.case_code;
    for (const key of ["interview", "requirements"])
      if (fields[key] != null) data[key] = fields[key];
    return {
      id: `row-${i + 1}`,
      number:
        text(fields.case_number ?? fields.case_id ?? fields.id) ||
        String(i + 1),
      data,
      selected: true,
      status: "ready",
      runId: "",
      error: "",
    };
  });
}

export const PROVIDED_ANSWER = "provided-answer";
export function answerColumn(run) {
  return run.answer_source === "pasted" && !run.input?.interview_source
    ? PROVIDED_ANSWER
    : run.input.answer_model;
}
export function selectedModels(settings) {
  return [
    ...new Set(
      Array.isArray(settings.answer_models)
        ? settings.answer_models
        : [settings.answer_model],
    ),
  ].filter(Boolean);
}
export function modelsForCase(row, settings) {
  if (row.saved_models) return row.saved_models;
  return row.data.answer ? [PROVIDED_ANSWER] : selectedModels(settings);
}
export function comparisonColumns(rows, settings) {
  const models = rows.some((r) => !r.data.answer)
    ? selectedModels(settings)
    : [];
  return rows.some((r) => r.data.answer)
    ? [...models, PROVIDED_ANSWER]
    : models;
}
export function restoreComparison(saved) {
  return (saved.rows || []).map((row, i) => ({
    ...row,
    number: row.number || String(i + 1),
    results:
      row.results ||
      (row.runId
        ? {
            [row.data.answer
              ? PROVIDED_ANSWER
              : saved.defaults?.answer_model || "arc:lite"]: {
              runId: row.runId,
              status: row.status,
              error: row.error || "",
              scored: row.scored,
            },
          }
        : {}),
  }));
}
export function resultSummary(run) {
  const grades = Object.entries(run.grades || {});
  const assessed = grades.filter(([, g]) =>
    ["scored", "cannot_assess", "not_applicable", "indeterminate"].includes(
      g.status,
    ),
  );
  const numeric = assessed
    .filter(([, g]) => typeof g.score === "number")
    .sort((a, b) => a[1].score - b[1].score);
  const focus = numeric[0] || assessed[0];
  return {
    reviewId: run.review_id || "",
    focusItem: focus?.[0] || "",
    focusName: focus
      ? (run.rubric?.criteria || []).find((c) => c.id === focus[0])?.name ||
        focus[0]
      : "",
    grades: Object.fromEntries(
      grades.map(([id, g]) => [id, { score: g.score, status: g.status }]),
    ),
    scored: assessed.length,
    summary: focus
      ? `${focus[0]}: ${String(focus[1].explanation || focus[1].reason || "No explanation supplied.").slice(0, 180)}`
      : "No assessed items returned.",
    safety: run.safety || "",
    currentItem: run.current_item || "",
    currentItemName:
      (run.rubric?.criteria || []).find((c) => c.id === run.current_item)
        ?.name ||
      run.current_item ||
      "",
    total: run.input?.criteria?.length || 0,
  };
}

// Reopen only records that were actually saved; this does not create or rescore answers.
export function savedComparison(runs) {
  if (!runs.length)
    throw new Error("No saved results were found for this comparison.");
  runs = [...runs].sort((a, b) =>
    (a.created_at || "").localeCompare(b.created_at || ""),
  );
  const first = runs[0].input;
  if (
    !first.comparison_id ||
    runs.some(
      (r) =>
        r.input.comparison_id !== first.comparison_id ||
        r.input.rules_version !== first.rules_version ||
        r.input.judge_model !== first.judge_model ||
        JSON.stringify(r.input.criteria) !== JSON.stringify(first.criteria),
    )
  )
    throw new Error(
      "These results use different scoring conditions. Open the evaluations individually.",
    );
  const rows = new Map();
  for (const run of runs) {
    const d = run.input;
    const key = d.case_code || d.case_number || run.id;
    let row = rows.get(key);
    if (!row) {
      row = {
        id: `saved-${rows.size + 1}`,
        number: d.case_number || String(rows.size + 1),
        selected: true,
        data: {
          ...d,
          answer: answerColumn(run) === PROVIDED_ANSWER ? d.answer : "",
        },
        results: {},
      };
      rows.set(key, row);
    } else if (
      ["facts", "task", "history", "reference", "source"].some(
        (k) => row.data[k] !== d[k],
      )
    ) {
      throw new Error(
        "A case code refers to different inputs. Open those evaluations individually.",
      );
    }
    const model = answerColumn(run);
    if (row.results[model])
      throw new Error(
        "More than one run exists for the same case and model. Open the evaluations individually.",
      );
    row.results[model] = {
      ...resultSummary(run),
      runId: run.id,
      status: run.status,
      error: run.error || "",
    };
    row.saved_models = Object.keys(row.results);
  }
  return {
    rows: [...rows.values()],
    defaults: {
      ...first,
      case_submission: runs[0].case_submission || null,
      answer_models: [
        ...new Set(runs.map(answerColumn).filter((m) => m !== PROVIDED_ANSWER)),
      ],
    },
    origin: "import",
    readOnly: true,
  };
}
export function comparisonCSV(rows, settings) {
  const columns = comparisonColumns(rows, settings);
  const quote = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const label = (id) => (id === PROVIDED_ANSWER ? "Provided answer" : id);
  return [
    [
      "Case code",
      "Source row",
      "Optional label",
      "Scoring version",
      ...columns.flatMap((id) => [
        `${label(id)} scores`,
        `${label(id)} analysis`,
        `${label(id)} status`,
      ]),
    ],
    ...rows.map((r) => [
      r.data.case_code || r.number,
      r.number,
      r.data.title === r.data.case_code ? "" : r.data.title,
      settings.rules_version || "original",
      ...columns.flatMap((id) => {
        if (!modelsForCase(r, settings).includes(id))
          return ["Not applicable", "", "not_applicable"];
        const c = r.results?.[id] || {};
        return [
          Object.entries(c.grades || {})
            .map(([item, g]) => `${item}=${g.score ?? g.status}`)
            .join("; "),
          c.summary || c.error || "",
          c.status || "ready",
        ];
      }),
    ]),
  ]
    .map((r) => r.map(quote).join(","))
    .join("\r\n");
}

export function caseErrors(data, task, defaults = {}) {
  const errors = [];
  if (!data.facts.trim()) errors.push("Add case facts.");
  if (data.case_code && !/^[A-Za-z0-9_-]{1,60}$/.test(data.case_code))
    errors.push(
      "Case code must use up to 60 letters, numbers, hyphens or underscores.",
    );
  if (!(data.task || task || "").trim())
    errors.push("Add a task or set a common task.");
  for (const [field, max] of [
    ["title", 160],
    ["case_code", 60],
    ["facts", 50000],
    ["task", 20000],
    ["history", 40000],
    ["reference", 40000],
    ["answer", 50000],
    ["source", 1000],
  ])
    if ((data[field] || "").length > max)
      errors.push(
        `${field} is too long (maximum ${max.toLocaleString()} characters).`,
      );
  if (
    defaults.rules_version &&
    defaults.rules_version !== "original" &&
    defaults.criteria?.includes("D5c")
  ) {
    if (!Array.isArray(data.requirements) || !data.requirements.length)
      errors.push(
        "Revised D5c needs a candidate checklist. Include requirements in JSON, or deselect D5c.",
      );
    if (
      !Array.isArray(data.interview?.turns) ||
      (!data.interview.turns.length && !data.interview.complete)
    )
      errors.push(
        "Revised D5c needs an actual interview record in JSON, including a confirmed empty record when no questions were asked.",
      );
  }
  return errors;
}

export function evaluationInput(data, defaults) {
  return {
    ...defaults,
    ...data,
    task: data.task || defaults.task,
    case_id: "",
    base_case_id: "",
    case_code: data.case_code || "",
    case_number: defaults.case_number || "",
    evaluation_mode: "written",
    reference_status: "draft",
    requirements_review: {},
    interview_source: {},
    history_required: false,
    reused_initial_run_id: "",
    interview: data.interview || {
      turns: [],
      complete: false,
      max_questions: 6,
      notes_allowed: false,
      decision_point: "Answer to the supplied written case",
    },
    requirements: data.requirements || [],
  };
}

// A retry always continues a saved run instead of creating another answer.
export async function evaluateRow(
  row,
  input,
  { api, update, wait = (ms) => new Promise((r) => setTimeout(r, ms)) },
) {
  let result;
  const save = (run) => {
    result = run;
    const failed = Object.values(run.grades || {}).find(
      (g) => g.status === "error",
    );
    update({
      ...resultSummary(run),
      runId: run.id,
      status: run.status,
      error: run.error || failed?.error || "",
    });
  };
  if (row.runId) {
    save(await api(`/api/runs/${row.runId}`));
    if (["partial", "error", "stopped", "interrupted"].includes(result.status))
      save(await api(`/api/runs/${row.runId}/retry`, result.input));
  } else
    save(
      await api("/api/runs", {
        ...input,
        action: input.answer ? "evaluate" : "generate",
      }),
    );
  while (true) {
    if (["generating", "scoring", "interviewing"].includes(result.status)) {
      await wait(1600);
      save(await api(`/api/runs/${result.id}`));
    } else if (result.status === "answer_ready") {
      save(
        await api(`/api/runs/${result.id}/evaluate`, {
          ...result.input,
          action: "evaluate",
        }),
      );
    } else if (result.status === "complete") {
      update({
        status: "complete",
        error: "",
        scored: Object.keys(result.grades || {}).length,
      });
      return result;
    } else if (["partial", "error"].includes(result.status)) {
      const failed = Object.entries(result.grades || {}).find(
        ([, g]) => g.status === "error",
      );
      const error = result.error || failed?.[1]?.error || "";
      throw new Error(
        error ||
          result.message ||
          `Evaluation ${result.status}. Retry this saved result.`,
      );
    } else
      throw new Error(
        result.error ||
          result.message ||
          `Evaluation ${result.status}. Resume this saved case to retry.`,
      );
  }
}

// Temporary failures go behind untouched tasks. A bounded retry prevents an
// unavailable provider from keeping a comparison running indefinitely.
export async function runComparisonQueue(
  tasks,
  execute,
  {
    stopped = () => false,
    onDeferred = () => {},
    wait = (ms) => new Promise((r) => setTimeout(r, ms)),
    maxRetries = 2,
  } = {},
) {
  const queue = tasks.map((task) => ({ task, retries: 0 }));
  const failures = [];
  let completed = 0;
  while (queue.length && !stopped()) {
    const current = queue.shift();
    try {
      if (current.retries) await wait(2000 * current.retries);
      await execute(current.task);
      completed++;
    } catch (error) {
      const transient =
        /timed out|timeout|temporarily unavailable|HTTP (?:429|500|502|503|504)\b/i.test(
          error.message,
        );
      if (transient && current.retries < maxRetries) {
        current.retries++;
        queue.push(current);
        onDeferred(current.task, error.message, current.retries);
      } else failures.push({ task: current.task, error: error.message });
    }
  }
  return { completed, failures, paused: stopped(), remaining: queue.length };
}

export const exampleCSV =
  'title,facts,task,answer,reference,source\n"Synthetic example 1","An adult reports two days of a mild cough. No other history or examination is supplied.","Audience: a clinician. Summarise the available information, uncertainty and questions needed next. Do not invent findings.",,,"Synthetic example"\n"Synthetic example 2","An adult reports intermittent dizziness. No vital signs or investigation results are supplied.","Audience: a clinician. Distinguish known facts from missing information and suggest the next assessment.","The information is insufficient to establish a cause. Clarify timing, triggers, medicines and associated symptoms, and obtain appropriate observations.",,"Synthetic example"\n';
