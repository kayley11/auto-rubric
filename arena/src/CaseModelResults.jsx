import { backendName } from "./modelIdentity.mjs";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ChevronDown } from "lucide-react";
import { ExportMenu, exposure } from "./StudyTools";
import { EvidenceDialog } from "./EvidenceDialog";
import { CaseContext } from "./CaseContext";
import { ClinicalText } from "./ClinicalText";
import { ScoringEvidence } from "./ScoringEvidence.jsx";
import { displayData } from "./presentation.mjs";
import { scoringVersionLabel } from "./caseIdentity.mjs";
import { itemResultText } from "./resultStatus.mjs";

const statusNames = {
  complete: "Answer saved",
  queued: "Not started",
  partial: "Interview in progress",
  rate_limited: "Rate limited",
  needs_retry: "Needs retry",
  pending: "Answer not started",
  not_applicable: "Not applicable",
  indeterminate: "Cannot assess",
  no_complete_answer: "No complete answer",
  provider_unavailable: "Provider unavailable",
};

function cellText(model, score) {
  return itemResultText(score, model.answer_status);
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
        "service",
        "saved_batch",
        "provider_transports",
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
          m.service || m.id,
          m.study_id || data.study_id,
          (m.provider_transports || []).join("; "),
          data.judge,
          data.rule_version,
          m.scoring_condition || data.scoring_condition || "retained",
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
        `Service: ${m.service || m.id}\nSaved batch: ${m.study_id || data.study_id}\nScoring condition: ${m.scoring_condition || data.scoring_condition || "retained"}`,
      );
      if (m.provider_transports?.length)
        parts.push(`Google transport: ${m.provider_transports.join("; ")}`);
      if (m.comparison_note) parts.push(m.comparison_note);
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
        data={tab === "evaluation" ? null : {
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
        {tab === "evaluation" && criterion && (
          <>
            <ScoringEvidence
              caseId={data.id}
              answerKey={`${data.study_id || data.scoring_condition || "saved"}/${model.id || model.model_id}`}
              answer={model.answer || ""}
              criterion={criterion}
              grade={score || {label: "Not assessed", reason: "No completed evaluation is saved for this item."}}
              version={model.rule_version || data.rule_version}
              facts={[data.initial_facts, data.opening && !data.initial_facts?.includes(data.opening) ? data.opening : ""].filter(Boolean).join("\n\n")}
              task={data.task}
              turns={model.turns || []}
              reference={data.reference}
              requirements={data.requirements}
              items={data.criteria}
              onItemChange={setItem}
            />
            {!!score?.review_flags?.length && <div className="notice" role="note"><strong>Output needs review · original score retained</strong><ul>{score.review_flags.map((flag,n) => <li key={n}>{flag.type === "quote_not_literal" ? "The judge's excerpt could not be matched word for word. Check it against the saved evidence; this does not by itself establish a clinical error." : flag.detail}</li>)}</ul></div>}
            {score?.requirement_checks?.length > 0 && <details className="study-disclosure"><summary>Information requirements: request-by-request checks</summary>{score.requirement_checks.map((check,n) => <section key={n}><h4>{check.id} · {check.status.replaceAll("_", " ")}</h4>{check.request_quote && <ClinicalText as="blockquote" text={check.request_quote} />}<ClinicalText as="p" text={check.reason} /></section>)}</details>}
          </>
        )}
        {tab === "answer" && (
          <>
            <h3>Case information supplied at the start</h3>
            <ClinicalText text={[data.initial_facts, !data.initial_facts?.includes(data.opening) ? data.opening : ""].filter(Boolean).join("\n\n")} />
            <h3>Task</h3>
            <ClinicalText text={data.task} />
            <h3>Saved final answer</h3>
            {model.word_count && (
              <p className="field-help">
                {model.word_count.words} words
                {model.word_count.within_range === false
                  ? " · outside the requested range"
                  : ""}
              </p>
            )}
            <ClinicalText className="evidence-answer" text={model.answer || `No final answer saved. ${statusNames[model.answer_status] || "Pending"}.`} />
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
  const [data, setData] = useState(null);
  const [selection, setSelection] = useState(null);
  const [allOutput, setAllOutput] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [visibleModels, setVisibleModels] = useState(null);
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
    const directory = caseInfo?.group === "complex-bmj"
      ? "complex-cases"
      : "full-rubric-review";
    fetch(`/${directory}/${caseId}.json`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Full-rubric results could not be loaded. Please retry.");
        return response.json();
      })
      .then((record) => {
        if (record.criteria?.length !== 22)
          throw new Error("The full 22-item assessment is unavailable for this case.");
        setData(displayData(record));
        setError("");
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [caseId, caseInfo?.group, refresh]);
  if (!data)
    return (
      <section className="case-model-results" aria-label="Model results">
        <h3>Scores by answering model</h3>
        <p role={error ? "alert" : "status"}>
          {error || "Loading full-rubric results…"}
        </p>
        {error && (
          <button className="secondary" onClick={reload} disabled={loading}>
            <RefreshCw size={14} /> Retry loading results
          </button>
        )}
      </section>
    );
  const model = selection && data.models.find((m) => m.id === selection.model);
  const shownModels = data.models.filter(
    (m) => !visibleModels || visibleModels.includes(m.id),
  );
  return (
    <section className="case-model-results" aria-label="Model results">
      <p className="case-review-label">Full rubric · {data.criteria.length} items</p>
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
        · {data.criteria.length} items checked ·{" "}
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
        <div className="model-choice-toolbar">
          <span>Select one or more answering models.</span>
          <button className="text-button" disabled={shownModels.length === data.models.length} onClick={() => setVisibleModels(null)}>
            Show all models
          </button>
        </div>
        <div className="model-choice-grid" role="group" aria-label="Answering models to compare">
          {data.models.map((m) => {
            const checked = !visibleModels || visibleModels.includes(m.id);
            const isGroq = m.service?.startsWith("groq") || m.id.startsWith("qwen38-groq");
            const title = isGroq ? m.name.replace(/\s*·\s*Groq$/i, "") : m.name;
            const backend = backendName(m.model_id, m.backend_model);
            const normalise = (text) => text.toLowerCase().replace(/[^a-z0-9]/g, "");
            const subtitle = isGroq
              ? "Groq"
              : normalise(backend) === normalise(m.name) ? "" : backend;
            return (
            <div key={m.id} className={`model-choice-row${checked ? " is-selected" : ""}`}>
              <label className="model-choice-label">
                <input
                  type="checkbox"
                  checked={checked}
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
                <span className="model-choice-name">
                  <strong>{title}</strong>
                  {subtitle && <small>{subtitle}</small>}
                </span>
              </label>
              <button
                className="text-button"
                aria-label={`Show only ${m.name}`}
                onClick={() => setVisibleModels([m.id])}
              >
                Only
              </button>
            </div>
          );})}
        </div>
      </details>
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
                  {m.scores.some(s => s.status === "applicability_pending") && <small>{m.scores.filter(s => s.status === "applicability_pending").length} awaiting confirmation</small>}
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
      <p className="field-help">Awaiting confirmation = this item's applicability needs a reviewer decision. Not yet scored = no assessment is saved. No answer = no complete model answer is saved. Click a status for its reason.</p>
      <p className="field-help">† = judge output needs checking; its original score is retained. Clinical references and candidate requirements are awaiting confirmation.</p>
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
      {data.condition_note && (
        <details className="model-identity-note">
          <summary>Scoring record</summary>
          <p>{data.condition_note}</p>
        </details>
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
