import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  FileText,
  LoaderCircle,
  Plus,
  Save,
} from "lucide-react";
import { contributorError } from "./caseSubmission.mjs";
import { SubmissionFields } from "./ContributorFields";
import {
  editedQuestion,
  questionCounts,
  questionPayload,
  questionPreview,
} from "./articleQuestions.mjs";
import "./article-questions.css";

const statusText = {
  generating: "Generating question drafts",
  ready: "Ready for your review",
  edited: "Draft saved",
  partially_confirmed: "Some questions saved",
  confirmed: "All question tasks saved",
  error: "Generation needs retry",
  interrupted: "Generation interrupted",
};
const basisText = {
  reported: "Reported in the paper",
  synthesis: "Synthesis of paper evidence",
  proposed_information_request: "Proposed information request",
};

export function ArticleQuestions({
  accountId = "",
  draft,
  source,
  request,
  canEdit,
  disabled,
  beforeGenerate,
  contributor,
  onContributor,
  submission,
  onSubmission,
  onBusy,
  onEvidence,
  onLocate,
  activeFact,
  sourceFocus,
}) {
  const [sets, setSets] = useState([]),
    [set, setSet] = useState(null);
  const [active, setActive] = useState("");
  const [count, setCount] = useState(7),
    [focus, setFocus] = useState("");
  const groups = [
    ...new Set(
      draft.items
        .filter(
          (f) =>
            f.grounding === "exact" &&
            f.visibility !== "exclude" &&
            f.patient_group !== "Aggregate",
        )
        .map((f) => f.patient_group),
    ),
  ];
  const [group, setGroup] = useState(groups[0] || "Patient 1");
  const [pending, setPending] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [raw, setRaw] = useState(null);
  const evidenceRows = useRef({});
  const referenceRows = useRef({});
  const generating = set?.status === "generating";
  const question =
    set?.questions.find((q) => q.id === active) || set?.questions[0];
  const locked =
    !canEdit || !!(question && set?.confirmed_cases?.[question.id]);
  const counts = set ? questionCounts(set) : null;
  const preview = question && questionPreview(set, question);

  async function catalogue() {
    const response = await request(
      `/api/literature/drafts/${draft.id}/questions`,
    );
    setSets(response.sets);
    return response.sets;
  }
  async function open(id) {
    setPending("open");
    setError("");
    setRaw(null);
    setMessage("");
    try {
      const next = await request(`/api/literature/questions/${id}`);
      setSet(next);
      setActive(next.questions[0]?.id || "");
    } catch (e) {
      setError(e.message);
    } finally {
      setPending("");
    }
  }
  useEffect(() => {
    let live = true;
    setSet(null);
    setActive("");
    setError("");
    setRaw(null);
    catalogue()
      .then((rows) => {
        if (live && rows.length) open(rows[0].id);
      })
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [draft.id]);
  useEffect(() => {
    onBusy?.(!!pending || generating);
    return () => onBusy?.(false);
  }, [pending, generating]);
  useEffect(() => {
    if (!question || !set) {
      onEvidence?.(null);
      return;
    }
    const visible = new Set(question.visible_fact_ids);
    onEvidence?.(
      set.facts.map((f) => ({
        ...f,
        visibility: visible.has(f.id) ? "visible" : "hidden",
      })),
    );
    return () => onEvidence?.(null);
  }, [set, active]);
  useEffect(() => {
    // Only a click in the source pane should navigate the draft. Opening a
    // citation from the draft must not expand the entire hidden fact selector.
    const row =
      referenceRows.current[sourceFocus?.id] ||
      evidenceRows.current[sourceFocus?.id];
    if (row) {
      const details = row.closest("details");
      if (details) details.open = true;
      row.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [sourceFocus]);
  useEffect(() => {
    if (!generating) return;
    let live = true;
    const timer = setInterval(async () => {
      try {
        const next = await request(`/api/literature/questions/${set.id}`);
        if (!live) return;
        setSet(next);
        if (next.status !== "generating") {
          setActive(next.questions[0]?.id || "");
          catalogue().catch(() => {});
        }
      } catch (e) {
        if (live)
          setError(
            `${e.message} This set remains saved; reopen it to check progress.`,
          );
      }
    }, 2500);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [set?.id, generating]);

  async function generate() {
    setPending("generate");
    setError("");
    setMessage("");
    setRaw(null);
    try {
      const saved = await beforeGenerate();
      if (!saved) return;
      const next = await request(
        `/api/literature/drafts/${draft.id}/questions`,
        {
          revision: saved.revision,
          count,
          focus,
          patient_group: group,
          model_id: saved.model_id,
          audience: saved.audience,
        },
      );
      setSet(next);
      setActive("");
      catalogue().catch(() => {});
    } catch (e) {
      setError(e.message);
    } finally {
      setPending("");
    }
  }
  function edit(id, key, value) {
    setSet((current) => ({
      ...current,
      questions: current.questions.map((q) =>
        q.id === id ? editedQuestion(q, key, value) : q,
      ),
    }));
    setMessage("");
  }
  function check(key, value) {
    setSet((current) => ({
      ...current,
      questions: current.questions.map((q) =>
        q.id === question.id
          ? { ...q, review: { ...q.review, [key]: value } }
          : q,
      ),
    }));
    setMessage("");
  }
  function toggleFact(key, id) {
    const selected = question[key];
    edit(
      question.id,
      key,
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );
  }
  async function save(confirm) {
    if (confirm && contributorError(contributor)) {
      setError(contributorError(contributor));
      return;
    }
    setPending(confirm ? "confirm" : "save");
    setError("");
    setMessage("");
    try {
      const next = await request(
        `/api/literature/questions/${set.id}/${confirm ? "confirm" : "save"}`,
        {
          ...questionPayload(set),
          case_submission: {
            ...submission,
            contributor_id: contributor.trim(),
            filename: (source.filename || source.url || "").slice(0, 255),
          },
        },
      );
      setSet(next);
      catalogue().catch(() => {});
      setMessage(
        confirm
          ? `${next.confirmed_count} question tasks saved under ${next.case_code}. Clinical references remain awaiting confirmation.`
          : "Questions saved as drafts; no new tasks were added to the library.",
      );
      if (confirm) window.dispatchEvent(new Event("arena-cases-saved"));
    } catch (e) {
      setError(e.message);
    } finally {
      setPending("");
    }
  }
  async function readOutput() {
    setPending("output");
    setError("");
    try {
      setRaw(await request(`/api/literature/questions/${set.id}/output`));
    } catch (e) {
      setError(e.message);
    } finally {
      setPending("");
    }
  }

  return (
    <section
      className="article-questions card"
      aria-label="Questions and reference answers"
    >
      <div className="aq-heading">
        <div>
          <h3>3. Questions & reference answers</h3>
          <p>
            Create several tasks for the same patient. Review each input and
            reference before saving.
          </p>
        </div>
        <span className="status-pill">References · awaiting confirmation</span>
      </div>
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="article-success" role="status">
          {message}
        </p>
      )}
      <details
        className="aq-generation"
        open={
          !set || generating || ["error", "interrupted"].includes(set.status)
        }
      >
        <summary>
          {set
            ? "Generate a new question set"
            : "Generate questions from the extracted evidence"}
        </summary>
        <div className="aq-settings">
          <label className="field">
            Up to
            <input
              type="number"
              aria-label="Number of question drafts"
              min="1"
              max="12"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              disabled={!canEdit || disabled || !!pending || generating}
            />
          </label>
          <label className="field">
            Patient / record group
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              disabled={!canEdit || disabled || !!pending || generating}
            >
              {groups.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          Question focus <small>optional</small>
          <textarea
            rows={3}
            maxLength={2500}
            placeholder="For example: timeline, missing evidence, competing explanations and reported outcomes"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            disabled={!canEdit || disabled || !!pending || generating}
          />
        </label>
        <p className="field-help">
          Uses the selected extraction model and its matched source facts,
          including hidden evidence for reference drafting. Fewer questions may
          be returned if the paper does not support the requested number.
        </p>
        <button
          className="primary"
          onClick={generate}
          disabled={
            !canEdit ||
            disabled ||
            !!pending ||
            generating ||
            !groups.length ||
            count < 1 ||
            count > 12
          }
        >
          <Plus size={16} />
          {pending === "generate" ? "Starting…" : "Generate question drafts"}
        </button>
      </details>
      {!!sets.length && (
        <label className="field aq-versions">
          Saved sets
          <select
            aria-label="Saved article question sets"
            value={set?.id || ""}
            disabled={!!pending || generating}
            onChange={(e) => open(e.target.value)}
          >
            {!set && <option value="">Choose a saved set</option>}
            {sets.map((row) => (
              <option key={row.id} value={row.id}>
                {new Date(row.created_at).toLocaleString("en-GB")} ·{" "}
                {row.question_count || 0} questions · {row.confirmed_count || 0}{" "}
                saved · {statusText[row.status] || row.status}
              </option>
            ))}
          </select>
        </label>
      )}
      {generating && (
        <div className="notice article-progress">
          <LoaderCircle className="spin" size={18} />
          <div>
            Generating source-linked questions…
            <p>
              This runs on the server. The full request and responses are saved,
              and you can reopen this set.
            </p>
          </div>
        </div>
      )}
      {set?.error && (
        <p className="notice">
          {set.error} Earlier sets and cases are retained.
        </p>
      )}
      {question && (
        <>
          <p className="aq-summary">
            <b>{set.case_code}</b> · one patient / record · {counts.total}{" "}
            question tasks · {counts.confirmed} saved
          </p>
          <p className="field-help">
            Each question has a separate information boundary. The reference and
            source metadata stay with the reviewer and scoring model. Use a
            fresh answering context for each question.
          </p>
          <div className="aq-list" role="group" aria-label="Question drafts">
            {set.questions.map((q) => (
              <div
                key={q.id}
                className={`aq-list-row ${q.id === question.id ? "active" : ""}`}
              >
                <input
                  type="checkbox"
                  aria-label={`Include ${q.id}`}
                  checked={q.include}
                  disabled={
                    !canEdit || !!set.confirmed_cases[q.id] || !!pending
                  }
                  onChange={(e) => edit(q.id, "include", e.target.checked)}
                />
                <button
                  type="button"
                  aria-pressed={q.id === question.id}
                  onClick={() => setActive(q.id)}
                >
                  <b>{q.id}</b>
                  <span>{q.title}</span>
                  <small>
                    {set.confirmed_cases[q.id]
                      ? "Saved"
                      : Object.values(q.review).every(Boolean)
                        ? "Review checked"
                        : "Needs your review"}
                  </small>
                </button>
              </div>
            ))}
          </div>
          <section className="aq-editor" aria-label={`Review ${question.id}`}>
            <div className="aq-editor-heading">
              <h4>
                {question.id} ·{" "}
                {set.confirmed_cases[question.id]
                  ? "Saved task"
                  : "Review this question"}
              </h4>
              <span>{basisText[question.answer_basis]}</span>
            </div>
            <label className="field">
              Question title
              <input
                value={question.title}
                maxLength={160}
                disabled={locked || !!pending}
                onChange={(e) => edit(question.id, "title", e.target.value)}
              />
            </label>
            <div className="aq-settings">
              <label className="field">
                Task type
                <select
                  value={question.task_type}
                  disabled={locked || !!pending}
                  onChange={(e) =>
                    edit(question.id, "task_type", e.target.value)
                  }
                >
                  <option value="clinical_interpretation">
                    Clinical interpretation
                  </option>
                  <option value="report_comprehension">
                    Reported case / outcome comprehension
                  </option>
                </select>
              </label>
              <label className="field">
                Reference basis
                <select
                  value={question.answer_basis}
                  disabled={locked || !!pending}
                  onChange={(e) =>
                    edit(question.id, "answer_basis", e.target.value)
                  }
                >
                  {Object.entries(basisText).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              Decision point <small>reviewer only</small>
              <input
                value={question.decision_point}
                maxLength={1500}
                disabled={locked || !!pending}
                onChange={(e) =>
                  edit(question.id, "decision_point", e.target.value)
                }
              />
            </label>
            <label className="field">
              Question / task
              <textarea
                rows={4}
                value={question.question}
                maxLength={8000}
                disabled={locked || !!pending}
                onChange={(e) => edit(question.id, "question", e.target.value)}
              />
            </label>
            <details className="aq-fact-choice">
              <summary>
                Model-visible information · {question.visible_fact_ids.length}{" "}
                facts; all remaining facts hidden
              </summary>
              <p className="field-help">
                Tick only the facts this question allows the model to see. Use
                the source link to inspect the exact passage on the right.
              </p>
              {set.facts
                .filter((f) => f.patient_group === set.patient_group)
                .map((f) => (
                  <div
                    key={f.id}
                    ref={(el) => {
                      evidenceRows.current[f.id] = el;
                    }}
                    className={`aq-fact-row ${activeFact === f.id ? "is-active" : ""}`}
                  >
                    <input
                      type="checkbox"
                      aria-label={`Show ${f.id} to the answering model`}
                      checked={question.visible_fact_ids.includes(f.id)}
                      disabled={locked || !!pending}
                      onChange={() => toggleFact("visible_fact_ids", f.id)}
                    />
                    <div>
                      <button
                        className="text-button"
                        onClick={() => onLocate(f.id)}
                      >
                        {f.id} ·{" "}
                        {f.position?.page
                          ? `Page ${f.position.page}`
                          : f.position?.section || "Source"}
                      </button>
                      <p>{f.text}</p>
                      <small>
                        {f.time_label} ·{" "}
                        {question.visible_fact_ids.includes(f.id)
                          ? "Model-visible"
                          : "Hidden for this question"}
                      </small>
                    </div>
                  </div>
                ))}
            </details>
            <details>
              <summary>
                Model-visible context <small>optional</small>
              </summary>
              <textarea
                aria-label="Question model-visible context"
                rows={2}
                value={question.context}
                maxLength={1500}
                disabled={locked || !!pending}
                onChange={(e) => edit(question.id, "context", e.target.value)}
              />
            </details>
            <details className="aq-preview" open>
              <summary>Exact input preview · case and task only</summary>
              <h5>Case information</h5>
              <pre>{preview.facts || "Select at least one visible fact."}</pre>
              <h5>Task</h5>
              <pre>{preview.task}</pre>
            </details>
            <label className="field">
              Draft reference answer{" "}
              <small>for scoring only · awaiting confirmation</small>
              <textarea
                rows={5}
                value={question.reference_answer}
                maxLength={12000}
                disabled={locked || !!pending}
                onChange={(e) =>
                  edit(question.id, "reference_answer", e.target.value)
                }
              />
            </label>
            <details className="aq-fact-choice" open>
              <summary>
                Reference evidence · {question.reference_fact_ids.length} source
                passages
              </summary>
              <p className="field-help">
                These passages support the draft answer. They are not
                automatically added to the answering prompt. Links are awaiting
                review.
              </p>
              {set.facts
                .filter((f) => question.reference_fact_ids.includes(f.id))
                .map((f) => (
                  <div
                    className={`aq-reference ${activeFact === f.id ? "is-active" : ""}`}
                    key={f.id}
                    ref={(el) => {
                      referenceRows.current[f.id] = el;
                    }}
                  >
                    <button
                      className="text-button"
                      onClick={() => onLocate(f.id)}
                    >
                      {f.id} · Read original passage <ArrowRight size={13} />
                    </button>
                    <blockquote>{f.source_quote}</blockquote>
                  </div>
                ))}
              {!locked && (
                <details>
                  <summary>Change reference passages</summary>
                  {set.facts.map((f) => (
                    <label className="aq-reference-option" key={f.id}>
                      <input
                        type="checkbox"
                        checked={question.reference_fact_ids.includes(f.id)}
                        onChange={() => toggleFact("reference_fact_ids", f.id)}
                        disabled={!!pending}
                      />
                      <span>
                        <b>{f.id}</b> · {f.source_quote}
                      </span>
                    </label>
                  ))}
                </details>
              )}
            </details>
            {question.visibility_note && (
              <p className="aq-boundary-note">
                <b>Proposed boundary:</b> {question.visibility_note}
              </p>
            )}
            {!locked && (
              <div className="aq-review-checks">
                <h5>Confirm this question’s preparation</h5>
                {[
                  [
                    "source_checked",
                    "I checked the cited passages and the draft answer against the paper.",
                  ],
                  [
                    "visibility_checked",
                    "I checked this question’s time point and input; hidden results are not revealed by the facts or question.",
                  ],
                  [
                    "question_checked",
                    "I checked the question and reference, including acceptable uncertainty. The clinical reference remains awaiting confirmation.",
                  ],
                ].map(([key, label]) => (
                  <label className="article-check" key={key}>
                    <input
                      type="checkbox"
                      checked={question.review[key]}
                      onChange={(e) => check(key, e.target.checked)}
                      disabled={!!pending}
                    />
                    {label}
                  </label>
                ))}
                <p className="field-help">
                  Editing the question, input or reference clears these checks.
                </p>
              </div>
            )}
            {set.confirmed_cases[question.id] && (
              <button
                className="primary"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("arena-use-workspace-case", {
                      detail: { data: set.confirmed_cases[question.id] },
                    }),
                  )
                }
              >
                Use this question <ArrowRight size={16} />
              </button>
            )}
          </section>
          {canEdit && (
            <>
              <SubmissionFields
                accountId={accountId}
                contributor={contributor}
                onContributor={onContributor}
                submission={submission}
                onChange={onSubmission}
                disabled={!!pending}
              />
              <p className="aq-save-summary">
                {counts.selected} new tasks selected · {counts.reviewed}{" "}
                checked. Saving creates question tasks for this case; it does
                not confirm the clinical reference.
              </p>
              <div className="article-save-actions">
                <button
                  className="secondary"
                  disabled={!!pending}
                  onClick={() => save(false)}
                >
                  <Save size={16} />
                  Save question drafts
                </button>
                <button
                  className="primary"
                  disabled={
                    !!pending ||
                    !counts.selected ||
                    counts.reviewed !== counts.selected ||
                    !!contributorError(contributor)
                  }
                  onClick={() => save(true)}
                >
                  {pending === "confirm" ? (
                    <LoaderCircle className="spin" size={16} />
                  ) : (
                    <Check size={16} />
                  )}
                  Confirm & save selected tasks
                </button>
              </div>
            </>
          )}
          {counts.confirmed > 0 && (
            <button
              className="text-button"
              onClick={() => {
                window.location.hash = "cases/workspace";
              }}
            >
              Open Workspace cases <ArrowRight size={14} />
            </button>
          )}
          <details className="aq-output">
            <summary>Question prompts, references & full output</summary>
            <button
              className="secondary"
              onClick={readOutput}
              disabled={!!pending}
            >
              <FileText size={15} />
              Read saved output
            </button>
            <a href={`/api/literature/questions/${set.id}/output`} download>
              Download JSON
            </a>
            {raw && <pre>{JSON.stringify(raw, null, 2)}</pre>}
          </details>
        </>
      )}
    </section>
  );
}
