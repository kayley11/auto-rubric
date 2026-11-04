import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ChevronDown,
  LoaderCircle,
  Pause,
  Upload,
} from "lucide-react";
import { backendName } from "./modelIdentity.mjs";
import { EvaluationSetup } from "./EvaluationSetup";
import { EvidenceDialog } from "./EvidenceDialog";
import { CaseContext } from "./CaseContext";
import { caseCode } from "./caseIdentity.mjs";
import { SubmissionFields, useContributor } from "./ContributorFields";
import { contributorError, newSubmission } from "./caseSubmission.mjs";
import { displayText } from "./presentation.mjs";
import { exposure } from "./StudyTools";
import { scoringVersionLabel } from "./caseIdentity.mjs";
import {
  BATCH_STORAGE,
  PROVIDED_ANSWER,
  caseErrors,
  comparisonColumns,
  comparisonCSV,
  evaluateRow,
  evaluationInput,
  exampleCSV,
  modelsForCase,
  parseCases,
  restoreComparison,
  resultSummary,
  selectedModels,
  runComparisonQueue,
} from "./caseImport.mjs";

function restore() {
  try {
    return JSON.parse(sessionStorage.getItem(BATCH_STORAGE)) || {};
  } catch {
    return {};
  }
}
function download(name, text, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const modelLabel = (id) => (id === PROVIDED_ANSWER ? "Provided answer" : id);
const statusLabel = (s) =>
  ({
    ready: "Ready",
    generating: "Generating…",
    scoring: "Scoring…",
    answer_ready: "Answer saved",
    complete: "Complete",
    error: "Needs retry",
    partial: "Needs retry",
    interrupted: "Interrupted",
    deferred: "Queued for retry",
    stopped: "Paused",
  })[s] || s;

function BatchResult({ selection, api, onClose, onOpen, busy, refreshKey }) {
  const [run, setRun] = useState(null),
    [error, setError] = useState("");
  const [tab, setTab] = useState("scores"),
    [plain, setPlain] = useState("");
  useEffect(() => {
    let active = true;
    setPlain("");
    api(`/api/runs/${selection.runId}`)
      .then((r) => {
        if (active) setRun(r);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [selection.runId, refreshKey]);
  useEffect(() => {
    if (tab !== "plain" || plain) return;
    const controller = new AbortController();
    fetch(`/api/runs/${selection.runId}/txt`, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error("Could not load the complete output.");
        const value = displayText(await r.text());
        if (!controller.signal.aborted) setPlain(value);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [tab, selection.runId, plain]);
  return (
    <EvidenceDialog
      title={`${selection.title} · ${modelLabel(selection.model)}`}
      onClose={onClose}
      actions={
        run && (
          <button
            className="text-button"
            disabled={busy}
            onClick={() => onOpen(run.id)}
          >
            {busy
              ? "Human review available after the batch pauses or finishes"
              : "Open saved evaluation & human review"}{" "}
            <ArrowRight size={14} />
          </button>
        )
      }
    >
      <CaseContext data={run?.input}>
        <nav className="batch-result-tabs" aria-label="Result details">
          {[
            ["scores", "Scores & reasons"],
            ["answer", "Answer"],
            ["input", "Case & task"],
            ["plain", "Full plain text"],
            ["raw", "Raw JSON"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={tab === id ? "selected" : ""}
              aria-pressed={tab === id}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        {error && (
          <p className="error-banner" role="alert">
            {error}
          </p>
        )}
        {!run ? (
          <p role="status">Loading saved result…</p>
        ) : (
          <>
            <p className="field-help">
              {run.rubric_version?.label || run.input.rules_version} · Scoring
              model: {run.input.judge_model}. References and candidate
              requirements are awaiting confirmation.
            </p>
            {tab === "scores" && (
              <div className="batch-full-grades">
                {Object.entries(run.grades || {}).map(([id, grade]) => (
                  <article className="batch-full-grade" key={id}>
                    <h3>
                      {id} ·{" "}
                      {run.rubric?.criteria?.find((c) => c.id === id)?.name ||
                        "Rubric item"}
                      <span
                        className={`score ${grade.score != null && grade.score <= 2 ? "low" : ""}`}
                      >
                        {grade.score ?? grade.status}
                      </span>
                    </h3>
                    <p className="case-prewrap">
                      {grade.explanation ||
                        grade.reason ||
                        grade.error ||
                        "No explanation returned."}
                    </p>
                    <details>
                      <summary>Scoring guide used</summary>
                      <pre className="saved-output-text">
                        {JSON.stringify(
                          run.rubric?.criteria?.find((c) => c.id === id) || {},
                          null,
                          2,
                        )}
                      </pre>
                    </details>
                  </article>
                ))}
              </div>
            )}
            {tab === "answer" && (
              <pre className="saved-output-text">
                {run.input.answer || run.generated_answer || "No answer saved."}
              </pre>
            )}
            {tab === "input" && (
              <>
                {[
                  ["Case facts", run.input.facts],
                  ["Task", run.input.task],
                  ["Earlier conversation", run.input.history],
                  [
                    "Reference points · judge only · awaiting confirmation",
                    run.input.reference,
                  ],
                  ["Source", run.input.source],
                ]
                  .filter(([, v]) => v)
                  .map(([title, value]) => (
                    <section key={title}>
                      <h3>{title}</h3>
                      <pre className="saved-output-text">{value}</pre>
                    </section>
                  ))}
              </>
            )}
            {tab === "plain" && (
              <pre className="saved-output-text">
                {plain || "Loading full output…"}
              </pre>
            )}
            {tab === "raw" && (
              <pre className="saved-output-text">
                {JSON.stringify(run, null, 2)}
              </pre>
            )}
          </>
        )}
      </CaseContext>
    </EvidenceDialog>
  );
}

export function BatchImport({
  config,
  defaults,
  change,
  api,
  onBusy,
  onSaved,
  onOpen,
  onCriteria,
  onViewCriteria,
  origin = "import",
  onReset,
  onReadOnlyChange,
}) {
  const [initial] = useState(restore);
  const [contributor, setContributor] = useContributor();
  const [submission, setSubmission] = useState(
    () =>
      initial.case_submission ||
      initial.defaults?.case_submission ||
      newSubmission("Imported cases"),
  );
  const [rows, setRows] = useState(() => restoreComparison(initial));
  const [locked, setLocked] = useState(initial.defaults || null);
  const [readOnly, setReadOnly] = useState(!!initial.readOnly);
  const [filename, setFilename] = useState(initial.filename || "");
  const [rowSearch, setRowSearch] = useState("");
  const [text, setText] = useState(""),
    [error, setError] = useState("");
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false),
    [selection, setSelection] = useState(null);
  const stop = useRef(false),
    alive = useRef(true);
  const settings = locked || defaults;
  const columns = comparisonColumns(rows, settings);
  const chosen = rows.filter((r) => r.selected);
  const remaining = chosen.flatMap((r) =>
    modelsForCase(r, settings)
      .filter((m) => r.results?.[m]?.status !== "complete")
      .map((model) => ({ row: r, model })),
  );
  const invalid = chosen.filter(
    (r) => caseErrors(r.data, settings.task, settings).length,
  );
  const total = rows.reduce((n, r) => n + modelsForCase(r, settings).length, 0);
  const completed = rows.reduce(
    (n, r) =>
      n +
      modelsForCase(r, settings).filter(
        (m) => r.results?.[m]?.status === "complete",
      ).length,
    0,
  );
  const canEvaluate = !config?.access?.hosted || config.access.can_evaluate;
  const needsModels =
    chosen.some((r) => !r.data.answer) && !selectedModels(settings).length;
  const hasResults = rows.some((r) =>
    Object.values(r.results || {}).some((c) => c.runId),
  );
  const valid =
    !readOnly &&
    remaining.length &&
    !invalid.length &&
    !needsModels &&
    settings.criteria.length;
  useEffect(() => {
    try {
      sessionStorage.setItem(
        BATCH_STORAGE,
        JSON.stringify({
          rows,
          defaults: locked,
          origin,
          readOnly,
          filename,
          case_submission: submission,
        }),
      );
    } catch {
      setError(
        "This batch exceeds this tab’s storage. Completed runs are saved on the server; keep the tab open or export the batch before leaving.",
      );
    }
  }, [rows, locked, readOnly, filename, submission]);
  useEffect(() => {
    for (const row of rows) {
      for (const [model, cell] of Object.entries(row.results || {})) {
        if (!cell.runId) continue;
        const key = `run/${cell.runId}`;
        if (Object.values(cell.grades || {}).some((g) => g.status !== "error"))
          exposure(key, "machine");
        if (model !== PROVIDED_ANSWER) exposure(key, "identity");
      }
    }
  }, [rows]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      stop.current = true;
      onBusy(false);
    };
  }, []);
  useEffect(() => {
    if (!busy) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);
  function updateRow(id, patch) {
    if (alive.current)
      setRows((current) =>
        current.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      );
  }
  function updateCell(id, model, patch) {
    if (alive.current)
      setRows((current) =>
        current.map((r) =>
          r.id === id
            ? {
                ...r,
                results: {
                  ...r.results,
                  [model]: { ...r.results?.[model], ...patch },
                },
              }
            : r,
        ),
      );
  }
  function preview(value, fileName) {
    try {
      setRows(parseCases(value, fileName).map((r) => ({ ...r, results: {} })));
      setLocked(null);
      setReadOnly(false);
      setFilename(fileName || "Pasted case data");
      setSubmission((previous) =>
        newSubmission(
          !previous.batch_name?.trim() ||
            ["Imported cases", "Pasted case data", filename].includes(
              previous.batch_name,
            )
            ? fileName || "Pasted case data"
            : previous.batch_name,
          fileName || "",
        ),
      );
      setError("");
      setMessage("");
    } catch (e) {
      setError(e.message);
    }
  }
  async function start() {
    if (!canEvaluate) {
      window.dispatchEvent(new Event("arena-sign-in"));
      return;
    }
    if (!valid) return;
    if (!locked?.case_submission && contributorError(contributor)) {
      setError(contributorError(contributor));
      return;
    }
    const fixed = {
      ...(locked || {
        ...structuredClone(defaults),
        comparison_id: crypto.randomUUID().replaceAll("-", ""),
      }),
      case_submission: locked?.case_submission || {
        ...submission,
        contributor_id: contributor.trim(),
      },
    };
    setLocked(fixed);
    setBusy(true);
    onBusy(true);
    stop.current = false;
    setError("");
    try {
      await api("/api/cases/submitted", {
        case_submission: fixed.case_submission,
        cases: chosen.map((r) => ({
          ...r.data,
          task: r.data.task || fixed.task,
          case_number: r.number,
        })),
      });
      window.dispatchEvent(new Event("arena-cases-saved"));
      const cells = new Map(
        remaining.map(({ row, model }) => [
          `${row.id}/${model}`,
          row.results?.[model] || {},
        ]),
      );
      const outcome = await runComparisonQueue(
        remaining,
        async ({ row, model }) => {
          setMessage(
            `Case ${row.number}: ${row.data.title} · ${modelLabel(model)}`,
          );
          const key = `${row.id}/${model}`;
          const cell = cells.get(key);
          const input = evaluationInput(row.data, {
            ...fixed,
            case_number: row.number,
            answer_model:
              model === PROVIDED_ANSWER ? fixed.answer_model : model,
          });
          try {
            const result = await evaluateRow(cell, input, {
              api,
              update: (patch) => {
                cells.set(key, { ...cells.get(key), ...patch });
                updateCell(row.id, model, patch);
              },
            });
            updateCell(row.id, model, {
              ...resultSummary(result),
              status: "complete",
              error: "",
            });
          } catch (e) {
            updateCell(row.id, model, { status: "error", error: e.message });
            if (
              /sign in|access password|not authorised|forbidden/i.test(
                e.message,
              )
            )
              stop.current = true;
            throw e;
          }
        },
        {
          stopped: () => stop.current || !alive.current,
          onDeferred: ({ row, model }, reason, retry) =>
            updateCell(row.id, model, {
              status: "deferred",
              error: `${reason} Queued at the end · retry ${retry}/2.`,
            }),
        },
      );
      if (outcome.failures.length)
        setError(
          `${outcome.failures.length} evaluations remain unfinished. Their errors are shown in the table; completed results are saved.`,
        );
      if (alive.current)
        setMessage(
          outcome.paused
            ? "Paused. Completed results are saved. Resume to continue the remaining case–model evaluations."
            : outcome.failures.length
              ? "Comparison finished with unfinished evaluations. Retry them later without regenerating completed answers."
              : "Comparison completed. Open any result to read the answer, item scores and explanations.",
        );
    } catch (e) {
      if (alive.current) setError(e.message);
    } finally {
      if (alive.current) setBusy(false);
      onBusy(false);
      onSaved();
    }
  }
  async function saveCasesOnly() {
    if (!canEvaluate) {
      window.dispatchEvent(new Event("arena-sign-in"));
      return;
    }
    if (contributorError(contributor)) {
      setError(contributorError(contributor));
      return;
    }
    setError("");
    try {
      await api("/api/cases/submitted", {
        case_submission: { ...submission, contributor_id: contributor.trim() },
        cases: chosen.map((r) => ({
          ...r.data,
          task: r.data.task || settings.task,
          case_number: r.number,
        })),
      });
      setMessage(
        "Cases saved in Case review → Workspace cases. No model calls were made.",
      );
      window.dispatchEvent(new Event("arena-cases-saved"));
    } catch (e) {
      setError(e.message);
    }
  }
  async function exportFull() {
    setExporting(true);
    setError("");
    try {
      const output = [];
      for (const row of rows) {
        const results = {};
        for (const model of modelsForCase(row, settings)) {
          const cell = row.results?.[model] || {};
          results[model] = {
            ...cell,
            ...(cell.runId
              ? { run: await api(`/api/runs/${cell.runId}`) }
              : {}),
          };
        }
        output.push({ number: row.number, input: row.data, results });
      }
      download(
        "autorubric-batch-results.json",
        JSON.stringify({ settings, cases: output }, null, 2),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setExporting(false);
    }
  }
  function openCell(row, model, cell) {
    setSelection({
      title: `Case ${row.number} · ${row.data.title}`,
      model,
      runId: cell.runId,
    });
  }
  const visibleRows = rows.filter((row) =>
    `${caseCode(row.data)} ${row.number} ${row.data.title} ${row.data.facts}`
      .toLowerCase()
      .includes(rowSearch.trim().toLowerCase()),
  );
  const allComplete = hasResults && completed === total;
  return (
    <section className="batch-import" aria-label="Import and evaluate cases">
      {locked ? (
        <div className="panel batch-saved-settings">
          <b>{readOnly ? "Saved comparison" : "Comparison settings"}</b>
          <p>
            {scoringVersionLabel(
              config?.rule_versions?.find(
                (v) => v.id === settings.rules_version,
              ) || {
                id: settings.rules_version,
                label: settings.rules_version,
              },
            )}{" "}
            · Scoring model: {settings.judge_model} · {settings.criteria.length}{" "}
            assessment items
          </p>
          <p className="field-help">
            {readOnly
              ? "Only saved evaluations are shown. Opening or exporting results makes no model calls."
              : "Settings are fixed for this comparison. Completed results remain available while other answers are being assessed."}
          </p>
        </div>
      ) : (
        <EvaluationSetup
          config={config}
          form={settings}
          change={change}
          multiple
          disabled={!!locked || busy}
          onCriteria={onCriteria}
          onViewCriteria={onViewCriteria}
        />
      )}
      {!locked && !readOnly && (
        <div className="panel">
          <SubmissionFields
            contributor={contributor}
            onContributor={setContributor}
            submission={submission}
            onChange={setSubmission}
            disabled={busy}
          />
        </div>
      )}
      {locked?.case_submission && (
        <p className="field-help">
          Added by {locked.case_submission.contributor_id} · Batch:{" "}
          {locked.case_submission.batch_name}
        </p>
      )}
      {origin !== "paste" && !locked && (
        <div className="panel batch-upload">
          <div className="panel-heading">
            <h2>
              <Upload size={18} /> Add your cases
            </h2>
            <button
              className="text-button"
              onClick={() =>
                download("autorubric-example.csv", exampleCSV, "text/csv")
              }
            >
              Example CSV <ArrowDownToLine size={14} />
            </button>
          </div>
          <p>
            Upload CSV, JSON or JSONL. Each row is one case. Include{" "}
            <code>facts</code> and <code>task</code>, or use the common task
            below. An optional <code>answer</code> is scored once as a provided
            answer.
          </p>
          <input
            className="batch-file"
            type="file"
            accept=".csv,.json,.jsonl"
            aria-label="Choose a case file"
            disabled={busy || !!locked}
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              if (file.size > 10 * 1024 * 1024) {
                setError("Choose a file smaller than 10 MB.");
                return;
              }
              try {
                preview(await file.text(), file.name);
              } catch (e) {
                setError(e.message);
              }
              e.target.value = "";
            }}
          />
          {filename && (
            <p className="field-help">
              Loaded: {filename} · {rows.length}{" "}
              {rows.length === 1 ? "case" : "cases"}
            </p>
          )}
          <details className="batch-paste">
            <summary>Or paste CSV / JSON</summary>
            <textarea
              aria-label="Case data to import"
              value={text}
              disabled={busy || !!locked}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                'case_number,title,facts,task\n1,"Case 1","Case information…","Summarise the available evidence."'
              }
            />
            <button
              className="secondary"
              disabled={!text.trim() || busy || !!locked}
              onClick={() => preview(text)}
            >
              Preview cases
            </button>
          </details>
          <details className="batch-common-task">
            <summary>Common task & import fields</summary>
            <label className="field">
              Task for rows without a task
              <textarea
                value={settings.task}
                disabled={!!locked || busy}
                onChange={(e) => change("task", e.target.value)}
              />
            </label>
            <p className="field-help">
              Optional fields: case_number, title, answer, reference, source and
              history. JSON also accepts actual interview and requirements
              records for revised D5c. Each row keeps its own task and
              reference. Up to 200 cases.
            </p>
          </details>
          <p className="field-help">
            Importing prepares a preview. No model calls are made until you
            start the batch.
          </p>
        </div>
      )}
      {rows.length > 0 && (
        <>
          <section
            className="panel batch-preview"
            aria-labelledby="batch-preview-title"
          >
            <div className="panel-heading">
              <div>
                <h2 id="batch-preview-title">Cases × models</h2>
                <p className="field-help">
                  {rows.length} {rows.length === 1 ? "case" : "cases"} ·{" "}
                  {completed}/{total} {readOnly ? "saved " : ""}evaluations
                  complete
                  {locked ? " · Settings fixed for this batch" : ""}
                </p>
              </div>
              <button
                className="text-button"
                disabled={busy}
                onClick={() => {
                  if (origin === "paste" && onReset) {
                    onReset();
                    return;
                  }
                  setRows([]);
                  setLocked(null);
                  setReadOnly(false);
                  onReadOnlyChange?.(false);
                  setFilename("");
                  setRowSearch("");
                  setError("");
                  setMessage("");
                  setText("");
                }}
              >
                {origin === "paste" ? "New case" : "Import another file"}
              </button>
            </div>
            <p className="batch-selection">
              Each row is one case; each column is one answering model. Select a
              saved result to read all scores and reasons. Scores are reported
              by item, without a total. Scroll sideways to see all models.
            </p>
            {locked && rows.length > 1 && (
              <label className="field batch-result-search">
                Find a case in this comparison
                <input
                  value={rowSearch}
                  onChange={(e) => setRowSearch(e.target.value)}
                  placeholder="Case code, source row or case text"
                />
              </label>
            )}
            {needsModels && (
              <p className="error-banner">
                Select at least one answer model above.
              </p>
            )}
            <div className="batch-table-scroll">
              <table className="batch-table batch-matrix">
                <thead>
                  <tr>
                    <th>Case code</th>
                    {columns.map((model) => (
                      <th key={model}>
                        {modelLabel(model)}
                        {backendName(model) && (
                          <small>{backendName(model)}</small>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => {
                    const errors = caseErrors(
                      row.data,
                      settings.task,
                      settings,
                    );
                    return (
                      <tr key={row.id}>
                        <th scope="row">
                          <label className="batch-row-selection">
                            {!locked && (
                              <input
                                type="checkbox"
                                aria-label={`Include ${row.data.title}`}
                                checked={row.selected}
                                disabled={busy || !!locked}
                                onChange={(e) =>
                                  updateRow(row.id, {
                                    selected: e.target.checked,
                                  })
                                }
                              />
                            )}
                            <b>{caseCode(row.data)}</b>
                          </label>
                          <span>
                            {row.data.title !== row.data.case_code
                              ? row.data.title
                              : ""}
                          </span>
                          <small className="batch-source-row">
                            Source row: {row.number}
                          </small>
                          <details className="batch-input-details">
                            <summary>
                              Case & task{!locked ? " / edit" : ""}
                            </summary>
                            {[
                              "facts",
                              "task",
                              "answer",
                              "reference",
                              "source",
                              "history",
                            ].map((key) => (
                              <label className="field" key={key}>
                                {
                                  {
                                    facts: "Case facts",
                                    task: "Task",
                                    answer: "Provided answer",
                                    reference:
                                      "Reference · awaiting confirmation",
                                    source: "Source",
                                    history: "Earlier conversation",
                                  }[key]
                                }
                                <textarea
                                  value={row.data[key]}
                                  disabled={!!locked || busy}
                                  placeholder={
                                    key === "task"
                                      ? "Use the common task"
                                      : "Optional"
                                  }
                                  onChange={(e) =>
                                    updateRow(row.id, {
                                      data: {
                                        ...row.data,
                                        [key]: e.target.value,
                                      },
                                    })
                                  }
                                />
                              </label>
                            ))}
                          </details>
                          {errors.length > 0 && (
                            <ul className="batch-errors">
                              {errors.map((e) => (
                                <li key={e}>{e}</li>
                              ))}
                            </ul>
                          )}
                        </th>
                        {columns.map((model) => {
                          if (!modelsForCase(row, settings).includes(model))
                            return (
                              <td key={model} className="batch-na">
                                {readOnly
                                  ? "No saved evaluation"
                                  : row.data.answer
                                    ? "Provided answer only"
                                    : "No provided answer"}
                              </td>
                            );
                          const cell = row.results?.[model] || {};
                          return (
                            <td key={model}>
                              <button
                                className={`matrix-result ${cell.status === "complete" ? "complete" : ""}`}
                                disabled={!cell.runId}
                                aria-label={`Open ${caseCode(row.data)} · ${modelLabel(model)} · ${statusLabel(cell.status || "ready")}`}
                                onClick={() => openCell(row, model, cell)}
                              >
                                <span className="matrix-cell-status">
                                  {statusLabel(cell.status || "ready")}
                                  {cell.runId && <ArrowRight size={13} />}
                                </span>
                                {cell.runId && (
                                  <span className="matrix-item-progress">
                                    {cell.scored || 0}/
                                    {cell.total || settings.criteria.length}{" "}
                                    items assessed
                                    {cell.status === "scoring" &&
                                    cell.currentItemName
                                      ? ` · ${cell.currentItemName}`
                                      : ""}
                                    {cell.retrying && cell.status !== "complete"
                                      ? " · Retrying a temporary error"
                                      : ""}
                                  </span>
                                )}
                                {cell.grades && (
                                  <span className="matrix-scores">
                                    {Object.entries(cell.grades).map(
                                      ([id, grade]) => (
                                        <span
                                          className={`matrix-score ${grade.score != null && grade.score <= 2 ? "low" : ""}`}
                                          key={id}
                                          title={
                                            config?.rubric?.criteria?.find(
                                              (c) => c.id === id,
                                            )?.name || id
                                          }
                                        >
                                          {id}{" "}
                                          <b>
                                            {grade.score ??
                                              {
                                                not_applicable: "N/A",
                                                indeterminate: "Indet.",
                                                cannot_assess: "Cannot assess",
                                              }[grade.status] ??
                                              grade.status}
                                          </b>
                                        </span>
                                      ),
                                    )}
                                  </span>
                                )}
                                {cell.summary && (
                                  <span className="matrix-finding">
                                    {cell.focusName && (
                                      <b>{cell.focusName}: </b>
                                    )}
                                    {cell.summary.replace(/^[^:]+:\s*/, "")}
                                  </span>
                                )}
                                {cell.runId && !cell.grades && (
                                  <span className="matrix-finding">
                                    Open saved scores and reasons
                                  </span>
                                )}
                              </button>
                              {cell.error && (
                                <p className="batch-errors">{cell.error}</p>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="field-help">
              The short finding quotes the judge explanation for the lowest
              numeric item. Full explanations and rubric anchors are available
              inside each result.
            </p>
          </section>
          {hasResults && (
            <section
              className="panel batch-summary"
              aria-label="Comparison summary"
            >
              <h2>Comparison summary</h2>
              <p className="field-help">
                Completion and flagged item counts across this file. These are
                not overall clinical scores.
              </p>
              <div className="batch-table-scroll">
                <table className="batch-summary-table">
                  <thead>
                    <tr>
                      <th>Answer model</th>
                      <th>Completed</th>
                      <th>Unfinished</th>
                      <th>Items scored 1–2</th>
                      <th>Not applicable / cannot assess</th>
                    </tr>
                  </thead>
                  <tbody>
                    {columns.map((model) => {
                      const cells = rows
                        .filter((r) =>
                          modelsForCase(r, settings).includes(model),
                        )
                        .map((r) => r.results?.[model] || {});
                      const grades = cells.flatMap((c) =>
                        Object.values(c.grades || {}),
                      );
                      return (
                        <tr key={model}>
                          <th>{modelLabel(model)}</th>
                          <td>
                            {
                              cells.filter((c) => c.status === "complete")
                                .length
                            }
                            /{cells.length}
                          </td>
                          <td>
                            {
                              cells.filter((c) => c.status !== "complete")
                                .length
                            }
                          </td>
                          <td>
                            {
                              grades.filter(
                                (g) =>
                                  typeof g.score === "number" && g.score <= 2,
                              ).length
                            }
                          </td>
                          <td>
                            {
                              grades.filter((g) =>
                                [
                                  "not_applicable",
                                  "indeterminate",
                                  "cannot_assess",
                                ].includes(g.status),
                              ).length
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          <div className="batch-actions">
            <div>
              <b>
                {readOnly
                  ? "Saved results"
                  : allComplete
                    ? "All results saved"
                    : `${remaining.length} ${remaining.length === 1 ? "evaluation" : "evaluations"} selected to run`}
              </b>
              <p>
                {readOnly || allComplete
                  ? "Open a result to read the answer and item explanations, or export this table."
                  : invalid.length
                    ? `${invalid.length} selected cases need attention.`
                    : "Keep this tab open. Temporary failures move to the end, with up to two retries; other cases continue. Saved answers are reused."}
              </p>
            </div>
            <div className="batch-action-buttons">
              {!locked && (
                <button
                  className="secondary"
                  disabled={
                    !chosen.length ||
                    chosen.some(
                      (r) => caseErrors(r.data, settings.task).length,
                    ) ||
                    busy
                  }
                  onClick={saveCasesOnly}
                >
                  Save cases without running
                </button>
              )}
              {hasResults && (
                <details className="batch-export">
                  <summary>
                    Download results & comparison <ChevronDown size={14} />
                  </summary>
                  <div>
                    <button
                      onClick={() =>
                        download(
                          "autorubric-model-comparison.csv",
                          comparisonCSV(rows, settings),
                          "text/csv",
                        )
                      }
                    >
                      Comparison table · CSV
                    </button>
                    <button
                      disabled={busy || exporting || !canEvaluate}
                      onClick={exportFull}
                    >
                      {exporting ? "Preparing…" : "Full outputs · JSON"}
                    </button>
                  </div>
                </details>
              )}
              {busy ? (
                <button
                  className="secondary"
                  onClick={() => {
                    stop.current = true;
                    setMessage(
                      "Pausing after the current evaluation finishes…",
                    );
                  }}
                >
                  <Pause size={15} /> Pause after this evaluation
                </button>
              ) : !readOnly && !allComplete ? (
                <button
                  className="primary"
                  disabled={
                    !valid ||
                    config?.access?.online === false ||
                    (!!config?.access?.authenticated && !canEvaluate)
                  }
                  onClick={start}
                >
                  {!canEvaluate
                    ? "Sign in to start"
                    : locked
                      ? "Retry remaining evaluations"
                      : origin === "paste"
                        ? "Generate & compare"
                        : total === 1
                          ? rows[0]?.data.answer
                            ? "Score answer"
                            : "Generate & score"
                          : "Start comparison"}
                  <ArrowRight size={15} />
                </button>
              ) : null}
            </div>
          </div>
          {message && (
            <p className={busy ? "batch-progress" : "notice"} role="status">
              {busy && <LoaderCircle size={16} className="spin" />}
              {message}
            </p>
          )}
          {locked && !readOnly && !busy && remaining.length > 0 && !message && (
            <p className="notice">
              This batch has saved progress. Resume continues existing runs
              before creating new ones.
            </p>
          )}
        </>
      )}
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      {selection && (
        <BatchResult
          selection={selection}
          busy={busy}
          refreshKey={rows
            .flatMap((r) => Object.values(r.results || {}))
            .filter((c) => c.runId === selection.runId)
            .map((c) => `${c.status}:${c.scored || 0}`)
            .join("")}
          api={api}
          onClose={() => setSelection(null)}
          onOpen={(id) => {
            setSelection(null);
            onOpen(id);
          }}
        />
      )}
    </section>
  );
}
