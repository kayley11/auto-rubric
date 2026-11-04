import { backendName } from "./modelIdentity.mjs";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ChevronDown } from "lucide-react";
import { ExportMenu, exposure } from "./StudyTools";
import { EvidenceDialog } from "./EvidenceDialog";
import { CaseContext } from "./CaseContext";
import { displayData } from "./presentation.mjs";
import { scoringVersionLabel } from "./caseIdentity.mjs";

const statusNames = {
  complete: "Answer saved",
  queued: "Not started",
  partial: "Interview in progress",
  rate_limited: "Rate limited",
  needs_retry: "Needs retry",
  pending: "Awaiting scoring",
  not_applicable: "Not applicable",
  indeterminate: "Cannot assess",
  no_complete_answer: "No complete answer",
};

async function load(path, fallback, signal) {
  try {
    const response = await fetch(path, { cache: "no-store", signal });
    if (!response.ok) throw new Error();
    return displayData(await response.json());
  } catch (error) {
    if (signal.aborted) throw error;
    const response = await fetch(fallback, { cache: "no-store", signal });
    if (!response.ok)
      throw new Error("The saved model comparison could not be loaded.");
    return displayData(await response.json());
  }
}

function cellText(model, score) {
  if (score.status === "complete") return score.label;
  if (["not_applicable", "indeterminate", "no_complete_answer"].includes(score.status))
    return statusNames[score.status];
  if (score.status === "needs_retry") return "Needs retry";
  if (model.answer_status === "complete") return "Awaiting scoring";
  return statusNames[model.answer_status];
}

function exportCase(data, format) {
  let content, type;
  const name = `${data.id}-model-results`;
  if (format === "json") {
    content = JSON.stringify(data, null, 2);
    type = "application/json";
  } else if (format === "csv") {
    const rows = [
      [
        "case",
        "answer_model",
        "judge",
        "rules",
        "scoring_condition",
        "item",
        "status",
        "score",
        "explanation",
          "evidence_excerpt",
          "review_flags",
      ],
    ];
    data.models.forEach((m) =>
      m.scores.forEach((s) =>
        rows.push([
          data.id,
          m.model_id,
          data.judge,
          data.rule_version,
          data.scoring_condition || "retained",
          s.item,
          s.status === "complete" ? "complete" : cellText(m, s),
          s.label ?? "",
          s.reason,
          s.evidence_quote || "",
          (s.review_flags || []).map((f) => f.type).join("; "),
        ]),
      ),
    );
    content = rows
      .map((r) =>
        r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    type = "text/csv";
  } else {
    const parts = [
      `${data.id} — ${data.title}`,
      `Study: ${data.study_id}`,
      `Updated: ${data.updated_at}`,
      `Judge: ${data.judge}`,
      `Rules: ${data.rule_version}`,
      `Scoring condition: ${data.scoring_condition || "retained"}`,
      "Clinical references and information requirements: awaiting confirmation",
      "Display copy of saved inputs and outputs. No hidden model reasoning or provider envelopes.",
      `\nTASK\n${data.task}`,
      `\nINITIAL INFORMATION\n${data.initial_facts}\n${data.opening}`,
    ];
    data.models.forEach((m) => {
      parts.push(
        `\n${"=".repeat(60)}\n${m.name} (${m.model_id})\n${statusNames[m.answer_status]}`,
      );
      m.turns.forEach((t) =>
        parts.push(
          `\nTurn ${t.number}\nQuestion: ${t.question}\nAssessment notes: ${JSON.stringify(t.assessment)}\nReturned:\n${t.returned.map((f) => `${f.channel}: ${f.patient_text || f.text}${f.context ? ` [${f.context}]` : ""}`).join("\n")}\nFeedback: ${t.feedback}`,
        ),
      );
      parts.push(`\nFINAL ANSWER\n${m.answer || "No final answer saved."}`);
      if (m.closing_note) parts.push(`\nSAVED CLOSING ASSESSMENT NOTE\n${JSON.stringify(m.closing_note, null, 2)}`);
      m.scores.forEach((s) =>
        parts.push(`\n${s.item} — ${cellText(m, s)}\n${s.reason}${s.evidence_quote ? `\nJudge evidence excerpt: ${s.evidence_quote}` : ""}${s.review_flags?.length ? `\nReview flags: ${JSON.stringify(s.review_flags)}` : ""}`),
      );
    });
    parts.push(
      `\nREFERENCE — awaiting confirmation\n${data.reference}`,
      `\nCANDIDATE REQUIREMENTS — awaiting confirmation\n${JSON.stringify(data.requirements, null, 2)}`,
      `\nRUBRIC ANCHORS\n${JSON.stringify(data.criteria, null, 2)}`,
    );
    content = parts.join("\n");
    type = "text/plain";
  }
  const url = URL.createObjectURL(
    new Blob([content], { type: `${type};charset=utf-8` }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${name}.${format}`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function savedEvidence(data, model) {
  return {
    case_id: data.id,
    title: data.title,
    task: data.task,
    initial_facts: data.initial_facts,
    opening: data.opening,
    judge: model.judge || data.judge,
    backend_model: model.backend_model || backendName(model.model_id),
    rule_version: model.rule_version || data.rule_version,
    scoring_condition: model.scoring_condition || data.scoring_condition,
    study_id: model.study_id || data.study_id,
    reference_status: "awaiting confirmation",
    reference: data.reference,
    requirements_status: "awaiting confirmation",
    requirements: data.requirements,
    rubric: data.criteria,
    model,
  };
}
function plainEvidence(data, model) {
  const parts = [
    `${data.id} — ${data.title}`,
    `Answer model: ${model.name} (${model.model_id})`,
    `Provider-reported backend: ${model.backend_model || backendName(model.model_id) || model.model_id}`,
    `Judge: ${model.judge || data.judge}`,
    `Rules: ${model.rule_version || data.rule_version}`,
    `Study: ${model.study_id || data.study_id}`,
    `Scoring condition: ${model.scoring_condition || data.scoring_condition || "retained"}`,
    `\nCASE INPUT\n${data.initial_facts || ""}\n${data.opening || ""}`,
    `\nTASK\n${data.task}`,
  ];
  model.turns.forEach((t) =>
    parts.push(
      `\nTURN ${t.number}\nQuestion: ${t.question}\nAssessment notes: ${JSON.stringify(t.assessment)}\nReturned information:\n${t.returned.map((f) => `${f.channel}: ${f.patient_text || f.text}${f.context ? ` [${f.context}]` : ""}`).join("\n")}\nFeedback: ${t.feedback}`,
    ),
  );
  parts.push(`\nSAVED ANSWER\n${model.answer || "No final answer saved."}`);
  if (model.closing_note) parts.push(`\nSAVED CLOSING ASSESSMENT NOTE\n${JSON.stringify(model.closing_note, null, 2)}`);
  model.scores.forEach((s) =>
    parts.push(
      `\n${s.item} — ${cellText(model, s)}\n${s.reason || "No completed evaluation saved."}${s.evidence_quote ? `\nJudge evidence excerpt: ${s.evidence_quote}` : ""}${s.review_flags?.length ? `\nReview flags: ${JSON.stringify(s.review_flags)}` : ""}${s.requirement_checks?.length ? `\nRequirement checks: ${JSON.stringify(s.requirement_checks, null, 2)}` : ""}`,
    ),
  );
  parts.push(
    `\nREFERENCE — awaiting confirmation\n${data.reference || "None supplied."}`,
    `\nCANDIDATE REQUIREMENTS — awaiting confirmation\n${JSON.stringify(data.requirements, null, 2)}`,
    `\nRUBRIC\n${JSON.stringify(data.criteria, null, 2)}`,
  );
  return parts.join("\n");
}
function ModelEvidence({ data, model, initialItem, onClose, caseInfo }) {
  const [tab, setTab] = useState(initialItem ? "evaluation" : "answer");
  const [item, setItem] = useState(initialItem || data.criteria[0]?.id || "");
  const criterion = data.criteria.find((c) => c.id === item);
  const score = model.scores.find((s) => s.item === item);
  return (
    <EvidenceDialog
      title={`${data.id} · ${model.name}`}
      onClose={onClose}
      actions={
        model.review_id && (
          <a
            className="text-button"
            href={`#review/${model.review_id}`}
            onClick={onClose}
          >
            Review this answer · {data.criteria.length} items
          </a>
        )
      }
    >
      <CaseContext
        data={{
          case_id: data.id,
          title: caseInfo?.title || data.title,
          description: caseInfo?.summary,
          audience: data.audience || caseInfo?.audience,
          task_type: data.task_type || caseInfo?.task_type,
          source: data.source_url || caseInfo?.source,
          source_location: data.source_location || caseInfo?.source_location,
          source_note: caseInfo?.source_note,
          turns: model.turns,
          reference: data.reference,
          requirements: data.requirements,
          decision_point: data.decision_point,
          facts: [
            data.initial_facts,
            data.opening && !data.initial_facts?.includes(data.opening)
              ? data.opening
              : "",
          ]
            .filter(Boolean)
            .join("\n\n"),
          task: data.task,
          answer: model.answer,
        }}
      >
        <p className="evidence-meta">
          {model.model_id}
          {backendName(model.model_id, model.backend_model)
            ? ` · ${backendName(model.model_id, model.backend_model)}`
            : ""}{" "}
          · Judge: {model.judge || data.judge} ·{" "}
          {scoringVersionLabel({
            id: model.rule_version || data.rule_version,
            label: model.rule_version || data.rule_version,
          })}
        </p>
        {model.study_id && (
          <p className="field-help">
            Saved batch: {model.study_id}. {model.comparison_note}
          </p>
        )}
        <nav className="evidence-tabs" aria-label="Model evidence sections">
          {[
            ["evaluation", "Rubric evaluation"],
            ["answer", "Case & answer"],
            ["plain", "Plain-text output"],
            ["json", "Saved data (JSON)"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              aria-pressed={tab === id}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        {tab === "evaluation" && (
          <>
            <label className="field">
              Rubric item
              <select value={item} onChange={(e) => setItem(e.target.value)}>
                {data.criteria.map((c) => {
                  const s = model.scores.find((s) => s.item === c.id);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id}) ·{" "}
                      {s ? cellText(model, s) : "Not assessed"}
                    </option>
                  );
                })}
              </select>
            </label>
            <div className="selected-evaluation">
              <div className="selected-score">
                {score?.status === "complete" ? score.label : "—"}
              </div>
              <div>
                <h3>
                  {criterion?.name} ({item})
                </h3>
                <p>
                  {score?.status === "complete"
                    ? "Saved judge explanation"
                    : cellText(model, score || {})}
                </p>
              </div>
            </div>
            <div className="case-prewrap judge-explanation">
              {score?.reason ||
                "No completed evaluation is saved for this item."}
            </div>
            {!!score?.review_flags?.length && (
              <div className="notice" role="note">
                <strong>Output needs review · original score retained</strong>
                <ul>
                  {score.review_flags.map((flag, n) => (
                    <li key={n}>{flag.type === "quote_not_literal"
                      ? "The judge's excerpt could not be matched word for word. Check it against the saved evidence; this does not by itself establish a clinical error."
                      : flag.detail}</li>
                  ))}
                </ul>
              </div>
            )}
            {score?.evidence_quote && (
              <>
                <h3>Judge-supplied evidence excerpt</h3>
                <blockquote className="case-prewrap">{score.evidence_quote}</blockquote>
              </>
            )}
            {score?.requirement_checks?.length > 0 && (
              <details className="study-disclosure">
                <summary>Information requirements: request-by-request checks</summary>
                {score.requirement_checks.map((check, n) => (
                  <section key={n}>
                    <h4>{check.id} · {check.status.replaceAll("_", " ")}</h4>
                    {check.request_quote && <blockquote>{check.request_quote}</blockquote>}
                    <p>{check.reason}</p>
                  </section>
                ))}
              </details>
            )}
            <h3>Rubric used for this evaluation</h3>
            {criterion?.definition && <p>{criterion.definition}</p>}
            <dl className="evidence-anchors">
              {Object.entries(criterion?.anchors || {}).map(([n, text]) => (
                <div
                  key={n}
                  className={String(score?.label) === n ? "selected" : ""}
                >
                  <dt>{n}</dt>
                  <dd>{text}</dd>
                </div>
              ))}
            </dl>
            {[
              criterion?.decision_point_rule,
              criterion?.equivalence_rule,
              ...(criterion?.essential_scoring_rules || []),
              ...(criterion?.relationship_to_D5c || []),
              criterion?.notes_vs_patient_directed_explanations,
              criterion?.applicability,
            ]
              .filter(Boolean)
              .map((rule, n) => (
                <p className="rule-definition" key={n}>
                  {typeof rule === "string" ? rule : JSON.stringify(rule)}
                </p>
              ))}
            {criterion?.context && <details className="study-disclosure"><summary>Additional scoring guidance</summary><p className="case-prewrap">{criterion.context}</p></details>}
            <h3>Answer being evaluated</h3>
            <div className="case-prewrap evidence-answer">
              {model.answer || "No final answer saved."}
            </div>
            <details className="study-disclosure">
              <summary>Task, reference and candidate requirements</summary>
              <p className="case-prewrap">{data.task}</p>
              <h4>Reference — awaiting confirmation</h4>
              <p className="case-prewrap">
                {data.reference || "None supplied."}
              </p>
              <h4>Candidate requirements — awaiting confirmation</h4>
              <pre className="saved-output-text">
                {JSON.stringify(data.requirements, null, 2)}
              </pre>
            </details>
          </>
        )}
        {tab === "answer" && (
          <>
            <h3>Case information supplied at the start</h3>
            <div className="case-prewrap">
              {data.initial_facts}
              <br />
              {!data.initial_facts?.includes(data.opening) ? data.opening : ""}
            </div>
            <h3>Task</h3>
            <div className="case-prewrap">{data.task}</div>
            <h3>Saved final answer</h3>
            {model.word_count && (
              <p className="field-help">
                {model.word_count.words} words
                {model.word_count.within_range === false
                  ? " · outside the requested range"
                  : ""}
              </p>
            )}
            <div className="case-prewrap evidence-answer">
              {model.answer ||
                `No final answer saved. ${statusNames[model.answer_status] || "Pending"}.`}
            </div>
          </>
        )}
        {tab === "interview" && (
          <>
            {!model.turns.length ? (
              <p>This condition has no saved interview turns.</p>
            ) : (
              model.turns.map((t) => (
                <section className="evidence-turn" key={t.number}>
                  <h3>Question {t.number}</h3>
                  <div className="case-prewrap">{t.question}</div>
                  <h4>Information returned</h4>
                  {t.returned.length ? (
                    t.returned.map((f, i) => (
                      <p className="case-prewrap" key={`${f.id}-${i}`}>
                        <small>
                          {f.channel} · {f.id}
                        </small>
                        <br />
                        {f.patient_text || f.text}
                        {f.context && (
                          <>
                            <br />
                            <small>{f.context}</small>
                          </>
                        )}
                      </p>
                    ))
                  ) : (
                    <p>No new case fact returned.</p>
                  )}
                  {t.feedback && <p>{t.feedback}</p>}
                  <details className="study-disclosure">
                    <summary>Saved assessment notes</summary>
                    <pre className="saved-output-text">
                      {JSON.stringify(t.assessment, null, 2)}
                    </pre>
                  </details>
                </section>
              ))
            )}
          </>
        )}
        {tab === "plain" && (
          <pre className="saved-output-text">{plainEvidence(data, model)}</pre>
        )}
        {tab === "json" && (
          <>
            <p className="field-help">
              Saved case evidence, answer and rubric evaluations. Credentials
              and provider transport metadata are excluded.
            </p>
            <pre className="saved-output-text">
              {JSON.stringify(savedEvidence(data, model), null, 2)}
            </pre>
          </>
        )}
      </CaseContext>
    </EvidenceDialog>
  );
}

export function CaseModelResults({ caseId, caseInfo }) {
  const [historical, setHistorical] = useState(null);
  const [fullReview, setFullReview] = useState(null);
  const [condition, setCondition] = useState("full");
  const [fullError, setFullError] = useState("");
  const [selection, setSelection] = useState(null);
  const [allOutput, setAllOutput] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [visibleModels, setVisibleModels] = useState(null);
  const data = condition === "full" && fullReview ? fullReview : historical;
  const reload = useCallback(() => setRefresh((n) => n + 1), []);
  useEffect(() => {
    if (!data) return;
    for (const m of data.models) {
      if (!m.review_id || (visibleModels && !visibleModels.includes(m.id)))
        continue;
      exposure(m.review_id, "identity");
      if (m.scores.some((s) => s.status === "complete"))
        exposure(m.review_id, "machine");
    }
  }, [data, visibleModels]);
  useEffect(() => {
    const timer = setInterval(reload, 30000);
    return () => clearInterval(timer);
  }, [reload]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    load(
      `/api/comparison/cases/${caseId}`,
      `/model-comparison/${caseId}.json`,
      controller.signal,
    )
      .then((record) => {
        setHistorical(record);
        setError("");
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [caseId, refresh]);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/full-rubric-review/${caseId}.json`, { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Full-rubric results could not be loaded. Earlier results remain available.");
        return response.json();
      })
      .then((record) => { setFullReview(displayData(record)); setFullError(""); })
      .catch((error) => { if (!controller.signal.aborted) setFullError(error.message); });
    return () => controller.abort();
  }, [caseId, refresh]);
  if (!data || (condition === "full" && !fullReview && !fullError))
    return (
      <section className="case-model-results" aria-label="Model results">
        <h3>Scores by answering model</h3>
        <p role={error ? "alert" : "status"}>
          {error || "Loading saved results…"}
        </p>
      </section>
    );
  const model = selection && data.models.find((m) => m.id === selection.model);
  const shownModels = data.models.filter(
    (m) => !visibleModels || visibleModels.includes(m.id),
  );
  return (
    <section className="case-model-results" aria-label="Model results">
      <div className="scoring-batch-tabs" aria-label="Saved scoring condition">
        <button className={condition === "full" ? "active" : ""} disabled={!fullReview}
          aria-pressed={condition === "full"} onClick={() => { setCondition("full"); setSelection(null); }}>
          Full rubric · 4 Nov 2026
        </button>
        <button className={condition === "earlier" ? "active" : ""} disabled={!historical}
          aria-pressed={condition === "earlier"} onClick={() => { setCondition("earlier"); setSelection(null); }}>
          Earlier selected items
        </button>
      </div>
      {data.condition_note && <p className="study-note">{data.condition_note}</p>}
      {fullError && <p className="notice">{fullError}</p>}
      <div className="case-results-heading">
        <div>
          <h3>Scores by answering model</h3>
          <p>
            Same judge: <b>{data.judge}</b> · {backendName(data.judge)} ·{" "}
            {data.models.length} model / service configurations
          </p>
        </div>
        <div className="case-results-tools">
          <button
            className="secondary"
            onClick={reload}
            disabled={loading}
            aria-label="Refresh model results"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <ExportMenu>
            <button onClick={() => exportCase(data, "txt")}>
              All models — plain text
            </button>
            <button onClick={() => exportCase(data, "csv")}>
              Item scores — CSV
            </button>
            <button onClick={() => exportCase(data, "json")}>
              Case and results — JSON
            </button>
          </ExportMenu>
        </div>
      </div>
      <p className="study-note">
        {data.mode === "written-record"
          ? data.task_type || "Written-record task"
          : `Patient interview · up to ${data.max_questions} questions`}{" "}
        · {data.criteria.length} {data.scoring_condition === "full-profile-review-20261104" ? "items checked" : "selected items"} ·{" "}
        {scoringVersionLabel({
          id: data.rule_version,
          label: data.rule_version,
        })}
        .
      </p>
      <details className="model-comparison-choice">
        <summary>
          Choose models · {shownModels.length} shown <ChevronDown size={14} />
        </summary>
        <button className="text-button" onClick={() => setVisibleModels(null)}>
          Show all models
        </button>
        <div>
          {data.models.map((m) => (
            <div key={m.id} className="model-choice-row">
              <label>
                <input
                  type="checkbox"
                  checked={!visibleModels || visibleModels.includes(m.id)}
                  disabled={
                    shownModels.length === 1 && shownModels[0].id === m.id
                  }
                  onChange={(e) =>
                    setVisibleModels(
                      e.target.checked
                        ? [
                            ...(visibleModels || data.models.map((v) => v.id)),
                            m.id,
                          ]
                        : (
                            visibleModels || data.models.map((v) => v.id)
                          ).filter((id) => id !== m.id),
                    )
                  }
                />
                {m.name}
                {backendName(m.model_id, m.backend_model)
                  ? ` · ${backendName(m.model_id, m.backend_model)}`
                  : ""}
              </label>
              <button
                className="text-button"
                onClick={() => setVisibleModels([m.id])}
              >
                Only this model
              </button>
            </div>
          ))}
        </div>
      </details>
      <p className="field-help">
        Choose one model for a focused view, or compare several side by side.
        Scroll sideways when showing all models.
      </p>
      <p className="matrix-instruction">
        Click a score to open the model’s answer, rubric anchors and judge
        explanation. Click a model name for its full saved output.
      </p>
      {data.additional_model_notice && (
        <p className="notice">{data.additional_model_notice}</p>
      )}
      <div
        className="case-score-scroll"
        tabIndex={0}
        role="region"
        aria-label="Model item scores; scroll horizontally on small screens"
      >
        <table
          className="case-score-table"
          style={{ minWidth: Math.max(360, 165 + shownModels.length * 112) }}
        >
          <caption className="sr-only">
            {data.id}: per-item grades from {data.judge}, grouped by answering
            model
          </caption>
          <thead>
            <tr>
              <th scope="col">Rubric item</th>
              {shownModels.map((m) => (
                <th scope="col" key={m.id}>
                  <button
                    onClick={() => setSelection({ model: m.id, item: "" })}
                    aria-label={`Open ${m.name} saved output`}
                  >
                    {m.name}
                  </button>
                  {backendName(m.model_id, m.backend_model) && (
                    <small className="model-backend">
                      {backendName(m.model_id, m.backend_model)}
                    </small>
                  )}
                  {m.service === "groq" && (
                    <small className="model-provider">Groq</small>
                  )}
                  <small>
                    {statusNames[m.answer_status] || m.answer_status}
                  </small>
                  <small>
                    {m.ratings_complete}/{data.criteria.length} scored
                  </small>
                  {m.not_applicable_count > 0 && <small>{m.not_applicable_count} not applicable</small>}
                  {m.indeterminate_count > 0 && <small>{m.indeterminate_count} cannot assess</small>}
                  {m.supplemental && <small>Additional run · 1 Nov</small>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.criteria.map((c) => (
              <tr key={c.id}>
                <th scope="row">
                  {c.name}
                  <small>{c.id}</small>
                </th>
                {shownModels.map((m) => {
                  const score = m.scores.find((s) => s.item === c.id) || {
                    status: "pending",
                  };
                  return (
                    <td key={m.id}>
                      {score.reason || score.status === "complete" ? (
                        <button
                          className={score.status === "complete" ? `case-grade${score.review_flags?.length ? " flagged-grade" : ""}` : "case-status-button"}
                          onClick={() =>
                            setSelection({ model: m.id, item: c.id })
                          }
                          aria-label={`${m.name}, ${c.name}: ${cellText(m, score)}. Open evaluation`}
                        >
                          {score.status === "complete" ? score.label : ({ not_applicable: "N/A", indeterminate: "Cannot assess", no_complete_answer: "No answer" }[score.status] || cellText(m, score))}
                          {!!score.review_flags?.length && <sup>†</sup>}
                        </button>
                      ) : (
                        <span className="case-pending">
                          {cellText(m, score)}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.scoring_condition === "full-profile-review-20261104" && (
        <p className="field-help">Click N/A or Cannot assess for the specific reason. † = judge output needs checking; its original score is retained. Clinical references and candidate requirements are awaiting confirmation.</p>
      )}
      {data.models.some((m) => m.id === "qwen38-groq") && (
        <p className="study-note">
          arc:lite and Groq Qwen use the same declared Qwen3.8-27B family. They
          are separate service configurations, not two model families.
        </p>
      )}
      <div className="case-output-actions">
        <button className="secondary" onClick={() => setAllOutput(true)}>
          Read all models’ saved output
        </button>
        <p className="field-help">
          Pending and rate-limited results have no score. Historical runs keep
          their original conditions.
        </p>
      </div>
      {data.scoring_condition === "evidence-only" && (
        <p className="study-note">
          Scores use the supplied facts and task. D3a does not receive the
          reference or hidden outcome.
        </p>
      )}
      <details className="model-identity-note">
        <summary>About model names</summary>
        <p>
          Provider-reported backend names use the saved catalogue where
          available, otherwise the catalogue checked on 2 November 2026.
          Historical deployment IDs are retained.
        </p>
      </details>
      {error && (
        <p className="notice" role="alert">
          Refresh failed; the last loaded results remain displayed. {error}
        </p>
      )}
      <p className="study-note">
        Last saved: {new Date(data.updated_at).toLocaleString("en-GB")}.
        Refreshes every 30 seconds while this case is open.
      </p>
      {model && (
        <ModelEvidence
          key={`${model.id}-${selection.item}`}
          data={data}
          model={model}
          initialItem={selection.item}
          caseInfo={caseInfo}
          onClose={() => setSelection(null)}
        />
      )}
      {allOutput && (
        <EvidenceDialog
          title={`${data.id} · All models’ saved output`}
          onClose={() => setAllOutput(false)}
        >
          <pre className="saved-output-text">
            {data.models
              .map((m) => plainEvidence(data, m))
              .join(`\n\n${"=".repeat(72)}\n\n`)}
          </pre>
        </EvidenceDialog>
      )}
    </section>
  );
}
