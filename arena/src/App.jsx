import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Columns3,
  BookOpen,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  Clipboard,
  FileText,
  FlaskConical,
  History,
  LoaderCircle,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Settings2,
  ShieldAlert,
  Square,
  X,
} from "lucide-react";
import "./app.css";
import { Study } from "./Study";
import { Review } from "./Review";
import { PatientInterview } from "./PatientInterview";
import { ExportMenu, exposure } from "./StudyTools";
import {
  EvaluationEvidence,
  blankInterview,
  revisedId,
} from "./EvaluationEvidence";

const running = (r) =>
  r && ["generating", "scoring", "interviewing"].includes(r.status);
const currentView = () =>
  ["study", "review", "patient"].find((v) =>
    window.location.hash.startsWith(`#${v}`),
  ) || "evaluation";
function answerWordCount(answer, task) {
  const narrative = task.includes("JSON is outside the narrative word limit")
    ? answer.split("NUMERIC_SUMMARY:", 1)[0]
    : answer;
  const text = narrative
    .replace(/^[ \t]*(?:[-*+]|\d+[.)])[ \t]+/gm, "")
    .replace(/^[ \t]*#{1,6}[ \t]+/gm, "")
    .replace(/[*_`]/g, "")
    .trim();
  return text ? text.split(/\s+/).length : 0;
}
const empty = {
  title: "",
  facts: "",
  task: "",
  history: "",
  reference: "",
  source: "",
  answer: "",
  criteria: [],
  answer_model: "arc:lite",
  judge_model: "arc:apex",
  reference_status: "draft",
  rules_version: "original",
  interview: blankInterview(),
  requirements: [],
};
const sample = {
  title: "Gait imbalance after a hot bath",
  facts:
    "Young adult. Recent gait imbalance. The imbalance worsened after a hot bath.",
  source:
    "Pilot example E01_INITIAL — adapted case summary; no textbook answer supplied.",
  reference:
    "Provisional points: explain the relevance of heat-related worsening without treating it as diagnostic. Consider alternative explanations for imbalance. Distinguish known facts from missing neurological history and examination. Request information that would help discriminate the possibilities. Do not assume unreported history is normal.",
};
const labels = {
  interviewing: "Interviewing",
  generating: "Generating",
  answer_ready: "Answer ready",
  scoring: "Scoring",
  complete: "Complete",
  partial: "Needs retry",
  error: "Needs retry",
  stopped: "Stopped",
  interrupted: "Interrupted",
};
async function api(path, body) {
  const r = await fetch(
    path,
    body === undefined
      ? {}
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "The request failed.");
  return data;
}
function IconButton({ label, children, ...props }) {
  return (
    <button className="icon-button" aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}
function Anchors({ item }) {
  return (
    <details className="anchors">
      <summary>
        {item.rule_version === revisedId
          ? "Proposed scoring guide"
          : "Original scoring guide"}{" "}
        <ChevronDown size={13} />
      </summary>
      <div>
        {item.definition && (
          <p className="rule-definition">{item.definition}</p>
        )}
        {[1, 2, 3, 4, 5].map((n) => (
          <p key={n}>
            <b>{n}</b>
            <span>
              {item.anchors[String(n)] || "No original descriptor supplied."}
            </span>
          </p>
        ))}
        {item.rule_version === revisedId && (
          <p className="rule-definition">
            {item.applicability || item.notes_vs_patient_directed_explanations}
          </p>
        )}
        {[
          ...(item.essential_scoring_rules || []),
          ...(item.relationship_to_D5c || []),
        ].map((rule) => (
          <p className="rule-definition" key={rule}>
            {rule}
          </p>
        ))}
      </div>
    </details>
  );
}

export function App() {
  const [view, setView] = useState(currentView);
  const [patientRun, setPatientRun] = useState(null);
  const [config, setConfig] = useState(null),
    [form, setForm] = useState(empty),
    [run, setRun] = useState(null);
  const [history, setHistory] = useState([]),
    [search, setSearch] = useState(""),
    [mode, setMode] = useState("generate");
  const [preset, setPreset] = useState("Clinical reasoning"),
    [error, setError] = useState(""),
    [pending, setPending] = useState(false);
  const [selectedCase, setSelectedCase] = useState("");
  const [dialog, setDialog] = useState(null),
    [plain, setPlain] = useState("");
  const [review, setReview] = useState({ reviewer: "", items: {} }),
    [reviewMode, setReviewMode] = useState(false);
  const [hideScores, setHideScores] = useState(false),
    [saved, setSaved] = useState(false),
    [sidebar, setSidebar] = useState(false);
  const seen = useRef(new Set()),
    resultRef = useRef(null);
  const busy = pending || running(run),
    frozen = !!run,
    hasGrades = !!Object.keys(run?.grades || {}).length;
  const scored = Object.values(run?.grades || {}).filter((g) =>
    ["scored", "cannot_assess", "not_applicable", "indeterminate"].includes(
      g.status,
    ),
  ).length;
  const revised = (run?.rubric_version?.id || form.rules_version) === revisedId;
  const activeVersion =
    run?.rubric_version ||
    config?.rule_versions?.find(
      (v) => v.id === (form.rules_version || "original"),
    );
  const criteria =
      run?.rubric?.criteria ||
      (revised ? config?.revised_rubric?.criteria : config?.rubric?.criteria) ||
      [],
    valid =
      form.facts.trim() &&
      form.task.trim() &&
      form.criteria.length &&
      (!form.history_required || form.history.trim());

  useEffect(() => {
    const update = () => setView(currentView());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  function navigate(next) {
    setView(next);
    setSidebar(false);
    window.location.hash = next === "evaluation" ? "evaluate" : next;
    window.scrollTo({ top: 0 });
  }

  useEffect(() => {
    Promise.all([api("/api/config"), api("/api/runs")])
      .then(([c, h]) => {
        setConfig(c);
        setHistory(h);
        let draft;
        try {
          draft = JSON.parse(
            localStorage.getItem("autorubric-draft") || "null",
          );
        } catch {
          /* Start clean. */
        }
        setForm({
          ...empty,
          task: c.default_task,
          criteria: c.presets["Clinical reasoning"],
          answer_model: c.settings.answer_model,
          judge_model: c.settings.judge_model,
          ...(draft || {}),
        });
        setSelectedCase(draft?.case_id || "");
        if (c.active_run && currentView() !== "review") openRun(c.active_run);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (config && !run)
      localStorage.setItem("autorubric-draft", JSON.stringify(form));
  }, [form, config, run]);
  useEffect(() => {
    if (!running(run)) return;
    const timer = setInterval(async () => {
      try {
        const next = await api(`/api/runs/${run.id}`);
        setRun(next);
        if (!running(next)) {
          setForm(next.input);
          setHistory(await api("/api/runs"));
        }
      } catch (e) {
        setError(e.message);
      }
    }, 1600);
    return () => clearInterval(timer);
  }, [run?.id, run?.status]);
  useEffect(() => {
    if (hasGrades)
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [run?.id, hasGrades]);
  useEffect(() => {
    if (!hideScores && run)
      Object.keys(run.grades || {}).forEach((id) => seen.current.add(id));
    if (run?.review_id && view === "evaluation") {
      exposure(run.review_id, "identity");
      if (!hideScores && hasGrades) exposure(run.review_id, "machine");
    }
  }, [hideScores, run, view]);
  useEffect(() => {
    const esc = (e) => {
      if (e.key === "Escape") {
        setDialog(null);
        setSidebar(false);
      }
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);
  function change(key, value) {
    setForm((f) => ({
      ...f,
      [key]: value,
      ...(key === "history" && value !== f.history
        ? { reused_initial_run_id: "" }
        : {}),
    }));
  }
  function loadCase(id) {
    const prepared =
      id === "pilot" ? sample : config.cases.find((c) => c.case_id === id);
    if (!prepared) return;
    setForm({
      ...empty,
      task: config.default_task,
      criteria: config.presets["Clinical reasoning"],
      answer_model: config.settings.answer_model,
      judge_model: config.settings.judge_model,
      ...prepared,
      rules_version: form.rules_version || "original",
      answer: "",
      reference_status: "draft",
    });
    setSelectedCase(id);
    setPreset(id === "pilot" ? "Clinical reasoning" : "Custom");
    setMode("generate");
    setError("");
  }
  function newCase(copy = false) {
    navigate("evaluation");
    setRun(null);
    setError("");
    setSaved(false);
    setReview({ reviewer: "", items: {} });
    seen.current = new Set();
    setReviewMode(false);
    setSidebar(false);
    setSelectedCase("");
    if (!copy) {
      setForm({
        ...empty,
        task: config.default_task,
        criteria: config.presets["Clinical reasoning"],
        answer_model: config.settings.answer_model,
        judge_model: config.settings.judge_model,
      });
      setMode("generate");
      setPreset("Clinical reasoning");
    } else {
      setMode("paste");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function openRun(id) {
    try {
      const next = await api(`/api/runs/${id}`);
      if (next.input.evaluation_mode === "patient") {
        setPatientRun(next);
        navigate("patient");
        return;
      }
      navigate("evaluation");
      setRun(next);
      setForm({ ...empty, ...next.input });
      setReview(next.review || { reviewer: "", items: {} });
      setMode(next.answer_source === "pasted" ? "paste" : "generate");
      setError("");
      setSaved(false);
      seen.current = new Set();
      setSidebar(false);
    } catch (e) {
      setError(e.message);
    }
  }
  function useData(data) {
    newCase(false);
    setForm({ ...empty, ...data, evaluation_mode: "written" });
    setMode("paste");
    setPreset("Custom");
  }
  async function refreshHistory() {
    try {
      setHistory(await api("/api/runs"));
    } catch (e) {
      setError(e.message);
    }
  }
  async function importInterview(selection, version = revisedId) {
    setPending(true);
    setError("");
    try {
      const data = await api(`/api/study/evaluation-input/${selection}`);
      newCase(false);
      setForm({ ...empty, ...data, rules_version: version });
      setMode("paste");
      setPreset("Custom");
    } catch (e) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }
  async function start(action) {
    setPending(true);
    setError("");
    setSaved(false);
    try {
      const path =
        action === "retry"
          ? `/api/runs/${run.id}/retry`
          : run && action === "evaluate"
            ? `/api/runs/${run.id}/evaluate`
            : "/api/runs";
      const next = await api(path, { ...form, action });
      setRun(next);
      setForm(next.input);
      setHistory(await api("/api/runs"));
      localStorage.removeItem("autorubric-draft");
      if (action !== "generate")
        setTimeout(
          () =>
            resultRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            }),
          50,
        );
    } catch (e) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }
  function setRating(cid, key, value) {
    setSaved(false);
    setReview((r) => ({
      ...r,
      items: { ...r.items, [cid]: { ...r.items[cid], [key]: value } },
    }));
  }
  async function saveReview() {
    setPending(true);
    setError("");
    try {
      const items = Object.fromEntries(
        form.criteria.map((cid) => [
          cid,
          {
            score: review.items[cid]?.score || "",
            note: review.items[cid]?.note || "",
            machine_scores_seen:
              !!review.items[cid]?.machine_scores_seen || seen.current.has(cid),
          },
        ]),
      );
      const next = await api(`/api/runs/${run.id}/review`, {
        ...review,
        items,
      });
      setReview(next.review);
      setRun(next);
      setSaved(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }
  async function plainText() {
    try {
      Object.keys(run.grades || {}).forEach((cid) => seen.current.add(cid));
      const r = await fetch(`/api/runs/${run.id}/txt`);
      if (!r.ok) throw new Error("Could not load the saved output.");
      setPlain(await r.text());
      setDialog("plain");
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="app-shell">
      {sidebar && (
        <div className="sidebar-scrim" onClick={() => setSidebar(false)} />
      )}
      <aside
        inert={dialog ? true : undefined}
        className={`sidebar ${sidebar ? "visible" : ""}`}
      >
        <a
          className="brand"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            if (config && !busy) newCase();
          }}
        >
          <span className="brand-icon">
            <FlaskConical size={20} strokeWidth={1.7} />
          </span>
          <span>
            AutoRubric<span className="brand-subtitle">Clinical workspace</span>
          </span>
        </a>
        <button
          className="new-case"
          onClick={() => newCase()}
          disabled={busy || !config}
        >
          <Plus size={17} /> New evaluation
        </button>
        <button
          className={`study-nav ${view === "study" ? "active" : ""}`}
          aria-current={view === "study" ? "page" : undefined}
          onClick={() => navigate("study")}
        >
          <Columns3 size={17} />
          <span>
            Interview study<small>Latest & historical results</small>
          </span>
        </button>
        <button
          className={`study-nav ${view === "review" ? "active" : ""}`}
          aria-current={view === "review" ? "page" : undefined}
          onClick={() => navigate("review")}
        >
          <CheckCheck size={17} />
          <span>
            Review first<small>Results hidden until rated</small>
          </span>
        </button>
        <button
          className={`study-nav ${view === "patient" ? "active" : ""}`}
          aria-current={view === "patient" ? "page" : undefined}
          onClick={() => {
            setPatientRun(null);
            navigate("patient");
          }}
        >
          <MessageSquare size={17} />
          <span>
            Patient interview<small>Ask up to six questions</small>
          </span>
        </button>
        {view !== "review" && (
          <>
            <div className="history-heading">
              <History size={14} /> Recent evaluations
            </div>
            <label className="search">
              <Search size={15} />
              <input
                aria-label="Search evaluations"
                placeholder="Search cases"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <div className="history-list">
              {history
                .filter((h) =>
                  h.title.toLowerCase().includes(search.toLowerCase()),
                )
                .map((h) => (
                  <button
                    key={h.id}
                    disabled={busy}
                    onClick={() => openRun(h.id)}
                    className={`history-item ${view === "evaluation" && run?.id === h.id ? "active" : ""}`}
                  >
                    <MessageSquare size={15} />
                    <span>
                      <strong>{h.title}</strong>
                      <small>
                        {h.purpose ? "UI validation · " : ""}
                        {labels[h.status] || h.status} · {h.graded}/{h.total}{" "}
                        items
                      </small>
                    </span>
                  </button>
                ))}
              {!history.length && (
                <p className="history-empty">
                  Your saved evaluations
                  <br />
                  will appear here.
                </p>
              )}
            </div>
            <div className="sidebar-bottom">
              <button onClick={() => setDialog("rubric")}>
                <BookOpen size={16} /> Josh’s rubric <span>22 items</span>
              </button>
              <button onClick={() => setDialog("settings")}>
                <Settings2 size={16} /> Model settings
              </button>
              <p>
                <span
                  className={`status-dot ${config?.settings.configured ? "ok" : ""}`}
                />
                {config?.settings.configured
                  ? "API configured"
                  : "Checking configuration"}
              </p>
              <small>Runs saved on this computer</small>
            </div>
          </>
        )}
      </aside>
      <div className="workspace" inert={dialog ? true : undefined}>
        <header className="topbar">
          <div>
            <IconButton
              label="Open navigation"
              className="mobile-menu icon-button"
              onClick={() => setSidebar(true)}
            >
              <Menu size={19} />
            </IconButton>
            <span>
              {view === "study"
                ? "Saved interview study"
                : view === "review"
                  ? "Independent review"
                  : view === "patient"
                    ? "Patient interview"
                    : "Clinical reasoning evaluation"}
            </span>
          </div>
          <button className="subtle-button" onClick={() => setDialog("about")}>
            <CircleHelp size={16} /> How it works
          </button>
        </header>
        {view === "study" ? (
          <Study onUseInterview={importInterview} onUseData={useData} />
        ) : view === "review" ? (
          <Review />
        ) : view === "patient" ? (
          <PatientInterview
            config={config}
            initialRun={patientRun}
            onSaved={refreshHistory}
            onUseData={useData}
          />
        ) : (
          <main className={`evaluation-page ${run ? "saved-evaluation" : ""}`}>
            <div className="page-heading">
              <span className="eyebrow">JOSH’S RUBRIC · AUTORUBRIC</span>
              <h1>{run ? form.title : "Evaluate a clinical case."}</h1>
              <p>
                {run
                  ? "Case, saved answer and item-by-item assessment."
                  : "Choose a case or paste your own. Then generate or paste an answer."}
              </p>
              {!run && (
                <div
                  className="mode-switch intake-switch"
                  aria-label="Evaluation mode"
                >
                  <button className="active">Written case</button>
                  <button
                    onClick={() => {
                      setPatientRun(null);
                      navigate("patient");
                    }}
                  >
                    Patient interview
                  </button>
                </div>
              )}
              {form.requirements_review?.reviewer && (
                <p className="review-receipt">
                  Checklist copied from decisions recorded by{" "}
                  {form.requirements_review.reviewer}. Unconfirmed requirements
                  remain candidates. This is a new evaluation.
                </p>
              )}
            </div>
            <nav className="steps" aria-label="Evaluation steps">
              <span className="current">
                <b>{run?.input.answer ? <Check size={13} /> : "1"}</b> Case &
                task
              </span>
              <i />
              <span
                className={
                  form.answer || run?.status === "generating" ? "current" : ""
                }
              >
                <b>{hasGrades ? <Check size={13} /> : "2"}</b> Model answer
              </span>
              <i />
              <span className={hasGrades ? "current" : ""}>
                <b>3</b> Score & review
              </span>
            </nav>
            {error && (
              <div className="error-banner" role="alert">
                <ShieldAlert size={18} />
                <span>{error}</span>
                <IconButton
                  label="Dismiss message"
                  onClick={() => setError("")}
                >
                  <X size={16} />
                </IconButton>
              </div>
            )}
            {config && !config.settings.configured && (
              <div className="notice">
                Add your API key to the existing repository .env file, then
                restart the app.
              </div>
            )}
            <div
              className={`input-layout ${form.answer || run || mode === "paste" ? "with-answer" : ""}`}
            >
              <section className="panel case-panel">
                <div className="panel-heading">
                  <h2>
                    <FileText size={17} /> Case & task
                  </h2>
                  {run && <span className="pill">Saved input</span>}
                </div>
                {!run && (
                  <label className="field case-library">
                    Load a prepared case
                    <select
                      aria-label="Load a prepared case"
                      disabled={busy || !config}
                      value={selectedCase}
                      onChange={(e) => loadCase(e.target.value)}
                    >
                      <option value="">
                        Choose a case, or enter your own below
                      </option>
                      {(config?.cases || []).map((c) => (
                        <option key={c.case_id} value={c.case_id}>
                          {c.title}
                        </option>
                      ))}
                      <option value="pilot">
                        Earlier pilot — Gait imbalance after a hot bath
                      </option>
                    </select>
                  </label>
                )}
                {form.history_required && (
                  <p className="notice">
                    {!form.history
                      ? "This N04 follow-up needs the saved initial answer. Load that conversation before generating."
                      : form.reused_initial_run_id
                        ? "This N04 follow-up reuses the saved initial answer. Both branches use the same earlier conversation, shown below."
                        : "This follow-up uses the earlier conversation entered below. Use the same initial input and answer in both N04 branches."}
                  </p>
                )}
                <label className="field">
                  {revised
                    ? "Information actually available at the start"
                    : "Case facts"}
                  <textarea
                    disabled={frozen}
                    className="case-text"
                    value={form.facts}
                    placeholder="Paste a synthetic clinical case or a selected case summary…"
                    onChange={(e) => change("facts", e.target.value)}
                  />
                </label>
                <details className="extra-context">
                  <summary>
                    <span>
                      Task & reference <small>{form.task.split(". ")[0]}</small>
                    </span>
                    <ChevronDown size={14} />
                  </summary>
                  <label className="field">
                    What should the model do?
                    <textarea
                      disabled={frozen}
                      className="task-text"
                      value={form.task}
                      onChange={(e) => change("task", e.target.value)}
                      placeholder="Specify the audience, question and response format."
                    />
                  </label>
                  <label className="field">
                    Case name <span className="optional">optional</span>
                    <input
                      disabled={frozen}
                      value={form.title}
                      placeholder="A short name for this evaluation"
                      onChange={(e) => change("title", e.target.value)}
                      maxLength={160}
                    />
                  </label>
                  <label className="field">
                    Earlier conversation{" "}
                    <span className="optional">optional</span>
                    <textarea
                      disabled={frozen}
                      value={form.history}
                      placeholder="Earlier user turns and answers for a follow-up task."
                      onChange={(e) => change("history", e.target.value)}
                    />
                  </label>
                  <label className="field">
                    Source note <span className="optional">optional</span>
                    <input
                      disabled={frozen}
                      value={form.source}
                      placeholder="Source, case ID or adaptation note"
                      onChange={(e) => change("source", e.target.value)}
                    />
                  </label>
                  <label className="field">
                    Reference points{" "}
                    <span className="judge-only">Judge only</span>
                    <textarea
                      disabled={hasGrades || busy}
                      value={form.reference}
                      placeholder="Known facts, expected points, acceptable alternatives and essential safety points. Not sent to the answering model."
                      onChange={(e) => change("reference", e.target.value)}
                    />
                  </label>
                  <label className="field">
                    Reference status
                    <select
                      disabled={hasGrades || busy || revised}
                      value={form.reference_status}
                      onChange={(e) =>
                        change("reference_status", e.target.value)
                      }
                    >
                      <option value="draft">
                        Draft — awaiting Josh’s confirmation
                      </option>
                      <option value="clinician_checked">
                        Clinician checked
                      </option>
                      <option value="none">No reference supplied</option>
                    </select>
                  </label>
                </details>
              </section>
              {(form.answer || run || mode === "paste") && (
                <section className="panel answer-panel">
                  <div className="panel-heading">
                    <h2>
                      <MessageSquare size={17} /> Model answer
                    </h2>
                    {form.answer && (
                      <span className="pill">
                        {run?.answer_source?.startsWith("generated")
                          ? form.answer === run.generated_answer
                            ? "Generated"
                            : "Edited answer"
                          : "Pasted"}
                      </span>
                    )}
                  </div>
                  {run?.status === "generating" ? (
                    <div className="answer-loading">
                      <LoaderCircle className="spin" size={25} />
                      <h3>Generating an answer</h3>
                      <p>
                        {form.answer_model} receives the case, task and any
                        earlier conversation.
                      </p>
                      <span>
                        Reference points and rubric are kept separate.
                      </span>
                    </div>
                  ) : (
                    <>
                      <textarea
                        aria-label="Model answer"
                        className="answer-text"
                        disabled={hasGrades || busy}
                        placeholder="Paste the model’s complete answer here…"
                        value={form.answer}
                        onChange={(e) => change("answer", e.target.value)}
                      />
                      <div className="answer-footer">
                        <span title="Includes heading text; removes formatting. Hyphenated terms count once. No extra word-limit tolerance.">
                          {answerWordCount(form.answer, form.task)} words ·
                          formatting removed
                        </span>
                        {run?.generated_answer && !hasGrades && (
                          <span>Editable before scoring</span>
                        )}
                      </div>
                    </>
                  )}
                  {run && !hasGrades && !busy && form.answer && (
                    <div className="answer-ready">
                      <CheckCheck size={16} /> Answer saved. Choose the rubric
                      items below, then evaluate.
                    </div>
                  )}
                </section>
              )}
            </div>
            {(revised ||
              form.interview?.turns?.length > 0 ||
              form.requirements?.length > 0) && (
              <EvaluationEvidence
                form={form}
                change={change}
                frozen={frozen}
                choices={config?.saved_interviews}
                onImport={importInterview}
                pending={busy}
                revised={revised}
              />
            )}
            <section className="action-panel">
              <details className="evaluation-options">
                <summary>
                  <Settings2 size={15} /> Settings
                  <span>
                    {activeVersion?.label || "Original rubric"} ·{" "}
                    {form.criteria.length} items · {form.answer_model} /{" "}
                    {form.judge_model}
                  </span>
                  <ChevronDown size={15} />
                </summary>
                <div className="evaluation-options-body">
                  <section
                    className="rule-selection"
                    aria-label="Scoring rule version"
                  >
                    <label className="field">
                      Scoring rules
                      <select
                        aria-label="Scoring rules"
                        disabled={frozen || busy}
                        value={form.rules_version || "original"}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            rules_version: e.target.value,
                            ...(e.target.value === revisedId
                              ? {
                                  reference_status: f.reference
                                    ? "draft"
                                    : "none",
                                }
                              : {}),
                          }))
                        }
                      >
                        {(
                          config?.rule_versions || [
                            { id: "original", label: "Original rubric" },
                          ]
                        ).map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p>
                      {revised
                        ? "New D3a assesses the received evidence and final synthesis. New D5c assesses actual information requests against a frozen candidate checklist. Clinical references and requirements await Josh’s confirmation."
                        : "Uses the original anchors. Choose Josh’s proposed version to assess D3a and D5c with the revised evidence rules."}
                    </p>
                  </section>
                  <div className="action-top">
                    <div>
                      <h2>Evaluation settings</h2>
                      <p>
                        Choose the items that this task can actually
                        demonstrate.
                      </p>
                    </div>
                    <button
                      className="subtle-button"
                      onClick={() => setDialog("criteria")}
                      disabled={hasGrades || busy}
                    >
                      <BookOpen size={15} />
                      {form.criteria.length}{" "}
                      {form.criteria.length === 1
                        ? "rubric item"
                        : "rubric items"}{" "}
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  <div className="model-summary">
                    <span>
                      Answer <b>{form.answer_model}</b>
                    </span>
                    <span>
                      Judge <b>{form.judge_model}</b>
                    </span>
                    <button
                      aria-label="Change model settings"
                      disabled={hasGrades || busy}
                      onClick={() => setDialog("settings")}
                    >
                      <Settings2 size={15} />
                    </button>
                  </div>
                </div>
              </details>
              <div className="controls-row">
                {!run && (
                  <div className="segmented" aria-label="Answer source">
                    <button
                      className={mode === "generate" ? "selected" : ""}
                      onClick={() => setMode("generate")}
                    >
                      <FlaskConical size={15} /> Generate answer
                    </button>
                    <button
                      className={mode === "paste" ? "selected" : ""}
                      onClick={() => setMode("paste")}
                    >
                      <Clipboard size={15} /> Paste answer
                    </button>
                  </div>
                )}
                <div className="primary-action">
                  {busy ? (
                    <button className="primary" disabled>
                      <LoaderCircle className="spin" size={16} />
                      {run?.status === "scoring"
                        ? "Evaluating…"
                        : run?.status === "generating"
                          ? "Generating…"
                          : "Working…"}
                    </button>
                  ) : run &&
                    ["partial", "error", "stopped", "interrupted"].includes(
                      run.status,
                    ) ? (
                    <button className="primary" onClick={() => start("retry")}>
                      {run.input.answer
                        ? "Retry remaining items"
                        : "Retry generation"}{" "}
                      <ArrowRight size={16} />
                    </button>
                  ) : hasGrades ? (
                    <button className="secondary" onClick={() => newCase(true)}>
                      <Plus size={16} /> Use as new evaluation
                    </button>
                  ) : mode === "paste" || (run && form.answer.trim()) ? (
                    <button
                      className="primary"
                      disabled={!valid || !form.answer.trim()}
                      onClick={() => start("evaluate")}
                    >
                      Evaluate answer <ArrowRight size={17} />
                    </button>
                  ) : (
                    <button
                      className="primary"
                      disabled={!valid || mode === "paste"}
                      onClick={() => start("generate")}
                    >
                      Generate answer <ArrowRight size={17} />
                    </button>
                  )}
                </div>
              </div>
              {!hasGrades && (
                <label className="checkbox-label pre-review">
                  <input
                    type="checkbox"
                    checked={hideScores}
                    onChange={(e) => setHideScores(e.target.checked)}
                  />{" "}
                  Hide machine results when scores arrive
                </label>
              )}
              {running(run) && (
                <div className="progress-row" role="status">
                  <LoaderCircle size={15} className="spin" />
                  <span>{run?.message || "Starting…"}</span>
                  <span className="progress-count">
                    {run?.status === "scoring"
                      ? `${scored} / ${form.criteria.length} items`
                      : "One request at a time"}
                  </span>
                  <button
                    className="text-button"
                    onClick={async () => {
                      try {
                        const r = await api(`/api/runs/${run.id}/stop`, {});
                        setError(r.message);
                      } catch (e) {
                        setError(e.message);
                      }
                    }}
                  >
                    <Square size={11} /> Stop after request
                  </button>
                </div>
              )}
            </section>
            {hasGrades && (
              <section className="results-section" ref={resultRef}>
                <div className="results-heading">
                  <div>
                    <span className="eyebrow">ITEM-BY-ITEM ASSESSMENT</span>
                    <h2>Scores & reasons</h2>
                    <p>
                      {scored} of {form.criteria.length} selected items
                      assessed. Scores remain separate.
                    </p>
                  </div>
                  <div className="result-actions">
                    <ExportMenu>
                      <button type="button" onClick={plainText}>
                        Open plain text
                      </button>
                      <a href={`/api/runs/${run.id}/summary`} download>
                        Review summary
                      </a>
                      <a href={`/api/runs/${run.id}/blind`} download>
                        Blank review sheet
                      </a>
                      <a href={`/api/runs/${run.id}/raw`} download>
                        Full raw output
                      </a>
                      {["txt", "json", "csv"].map((t) => (
                        <a key={t} href={`/api/runs/${run.id}/${t}`} download>
                          Download{" "}
                          {t === "txt" ? "plain text" : t.toUpperCase()}
                        </a>
                      ))}
                    </ExportMenu>
                  </div>
                </div>
                <div className="result-meta">
                  <span
                    className={`safety-note ${run.safety === "Safety Fail flagged" ? "flagged" : ""}`}
                  >
                    <ShieldAlert size={14} />
                    {run.safety}
                  </span>
                  <span>
                    {run.usage?.total_tokens != null
                      ? `${run.usage.total_tokens.toLocaleString()} tokens reported`
                      : "Token usage unavailable"}{" "}
                    · {run.usage?.elapsed_seconds || 0}s in API requests
                  </span>
                </div>
                <div className="review-toolbar">
                  {run.review_id && (
                    <a className="primary" href={`#review/${run.review_id}`}>
                      Review this answer
                    </a>
                  )}
                  <button
                    className={`${run.review_id ? "review-toggle" : "primary"} ${reviewMode ? "active" : ""}`}
                    onClick={() => setReviewMode(!reviewMode)}
                  >
                    <CheckCheck size={16} />{" "}
                    {run.review_id
                      ? "Rate alongside results"
                      : "Review this answer"}
                  </button>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={hideScores}
                      onChange={(e) => setHideScores(e.target.checked)}
                    />{" "}
                    Hide machine scores & reasons
                  </label>
                </div>
                {reviewMode && (
                  <div className="review-intro">
                    <label className="field">
                      Reviewer
                      <input
                        value={review.reviewer || ""}
                        placeholder="Name or initials"
                        onChange={(e) => {
                          setReview({ ...review, reviewer: e.target.value });
                          setSaved(false);
                        }}
                      />
                    </label>
                    <p>
                      Read the answer and the saved scoring guide. Record your
                      own grade and a short reason. The saved rating records
                      whether machine results were shown in this browser session
                      or a prior saved review.
                    </p>
                  </div>
                )}
                <div className="grade-list">
                  {form.criteria.map((cid) => {
                    const item = criteria.find((c) => c.id === cid);
                    if (!item) return null;
                    const grade = run.grades[cid];
                    return (
                      <article
                        className={`grade-item ${grade?.status === "error" ? "grade-error" : ""}`}
                        key={cid}
                      >
                        <div className="grade-heading">
                          <span className="criterion-id">{cid}</span>
                          <h3>{item.name}</h3>
                          {(!hideScores || grade?.status === "error") && (
                            <span
                              className={`score ${grade?.score <= 2 && grade?.score != null ? "low" : ""}`}
                            >
                              {grade?.score != null ? (
                                <>
                                  {grade.score}
                                  <small>/ 5</small>
                                </>
                              ) : [
                                  "cannot_assess",
                                  "not_applicable",
                                  "indeterminate",
                                ].includes(grade?.status) ? (
                                grade.label || "Cannot assess"
                              ) : grade?.status === "error" ? (
                                "Request failed"
                              ) : (
                                "Not assessed"
                              )}
                            </span>
                          )}
                        </div>
                        {(!hideScores || grade?.status === "error") && (
                          <div className="machine-reason">
                            <span className="mini-label">
                              {grade?.status === "error"
                                ? "Request status"
                                : "Machine judgement"}
                            </span>
                            <p>
                              {grade?.reason ||
                                grade?.error ||
                                "No result yet."}
                            </p>
                            {grade?.unanchored && (
                              <p className="unanchored">
                                This intermediate grade has no original
                                author-supplied descriptor.
                              </p>
                            )}
                          </div>
                        )}
                        <Anchors item={item} />
                        {reviewMode && (
                          <div className="human-rating">
                            <label className="field">
                              Your grade
                              <select
                                aria-label={`Your grade for ${cid}`}
                                disabled={busy}
                                value={review.items[cid]?.score || ""}
                                onChange={(e) =>
                                  setRating(cid, "score", e.target.value)
                                }
                              >
                                <option value="">Not rated</option>
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <option key={n} value={n}>
                                    {n}
                                  </option>
                                ))}
                                <option value="N/A">N/A</option>
                                <option value="Indeterminate">
                                  Indeterminate
                                </option>
                              </select>
                            </label>
                            <label className="field">
                              Your reason / reference correction
                              <textarea
                                aria-label={`Your reason for ${cid}`}
                                disabled={busy}
                                rows={2}
                                value={review.items[cid]?.note || ""}
                                onChange={(e) =>
                                  setRating(cid, "note", e.target.value)
                                }
                                placeholder="Explain the grade, clarify a rule or correct a reference point."
                              />
                            </label>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
                {reviewMode && (
                  <div className="review-save">
                    <span>
                      {saved
                        ? "Review saved on this computer."
                        : review.saved_at
                          ? "Previously saved review — save any changes."
                          : "Human ratings do not replace the machine results."}
                    </span>
                    <button
                      className="primary"
                      disabled={busy}
                      onClick={saveReview}
                    >
                      {saved ? <Check size={16} /> : <CheckCheck size={16} />}{" "}
                      {saved ? "Saved" : "Save review"}
                    </button>
                  </div>
                )}
                <p className="scope-note">
                  Draft reference points and author-dependent scoring choices
                  can be checked in human review. A completed run records model
                  judgements; it is not a clinical validation.
                </p>
              </section>
            )}
            {!run && (
              <footer className="page-footer">
                Reference points stay with the judge. API keys stay on the
                server.
              </footer>
            )}
          </main>
        )}
      </div>
      {dialog && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDialog(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={
              dialog === "plain"
                ? "Plain-text output"
                : dialog === "criteria"
                  ? "Choose rubric items"
                  : dialog === "settings"
                    ? "Model settings"
                    : dialog === "rubric"
                      ? "Josh’s rubric"
                      : "How it works"
            }
            className={`modal ${dialog === "plain" || dialog === "rubric" ? "wide" : ""}`}
          >
            <div className="modal-heading">
              <h2>
                {dialog === "plain"
                  ? "Plain-text output"
                  : dialog === "criteria"
                    ? "Choose rubric items"
                    : dialog === "settings"
                      ? "Model settings"
                      : dialog === "rubric"
                        ? "Josh’s clinical reasoning rubric"
                        : "How it works"}
              </h2>
              <IconButton
                label="Close dialog"
                autoFocus
                onClick={() => setDialog(null)}
              >
                <X size={19} />
              </IconButton>
            </div>
            {dialog === "about" && (
              <div className="about-content">
                <ol>
                  <li>
                    <b>Enter a case and a task.</b> Say who the answer is for
                    and what it should contain.
                  </li>
                  <li>
                    <b>Generate or paste an answer.</b> The answering model
                    receives only the case, task and optional conversation
                    history.
                  </li>
                  <li>
                    <b>Evaluate with Josh’s rubric.</b> AutoRubric asks the
                    judge to assess each selected item separately with the saved
                    rule version. Proposed D3a uses received evidence; proposed
                    D5c uses actual requests and candidate requirements.
                  </li>
                  <li>
                    <b>Review and export.</b> Read the reasons, add human
                    ratings and export the saved case, answer and results.
                  </li>
                </ol>
                <p>
                  Reference points are not shown to the answering model. Each
                  selected item uses one API request. Failed requests can be
                  retried without regenerating the answer.
                </p>
              </div>
            )}
            {dialog === "settings" && (
              <div className="settings-content">
                <p className="dialog-intro">
                  Models use the existing server-side API configuration.
                </p>
                <label className="field">
                  Answer model
                  <select
                    disabled={frozen || busy}
                    value={form.answer_model}
                    onChange={(e) => change("answer_model", e.target.value)}
                  >
                    {config?.settings.models.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Judge model
                  <select
                    disabled={hasGrades || busy}
                    value={form.judge_model}
                    onChange={(e) => change("judge_model", e.target.value)}
                  >
                    {config?.settings.models.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </label>
                <dl>
                  <dt>API endpoint</dt>
                  <dd>{config?.settings.base_url}</dd>
                  <dt>API key</dt>
                  <dd>
                    {config?.settings.configured
                      ? "Configured in .env · never sent to this page"
                      : "Not configured"}
                  </dd>
                  <dt>Answer settings</dt>
                  <dd>Temperature 0</dd>
                  <dt>Judge settings</dt>
                  <dd>Temperature 0.7 · top-p 0.8 · fixed ascending options</dd>
                  <dt>Requests</dt>
                  <dd>
                    Sequential · {config?.settings.timeout_seconds}s timeout ·{" "}
                    {config?.settings.max_tokens.toLocaleString()} max output
                    tokens
                  </dd>
                </dl>
                <button className="primary" onClick={() => setDialog(null)}>
                  Done <Check size={16} />
                </button>
              </div>
            )}
            {dialog === "criteria" && (
              <>
                <p className="dialog-intro">
                  Start with a task preset, then adjust the items. Unselected
                  items are unassessed.
                </p>
                <label className="field">
                  Task preset
                  <select
                    value={preset}
                    onChange={(e) => {
                      setPreset(e.target.value);
                      if (config.presets[e.target.value])
                        change("criteria", config.presets[e.target.value]);
                    }}
                  >
                    <option value="Custom">Case-specific selection</option>
                    {Object.keys(config?.presets || {}).map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </label>
                <div className="criteria-tools">
                  <span>Include items relevant to this task.</span>
                  <button
                    className="text-button"
                    onClick={() => change("criteria", [])}
                  >
                    Clear selection
                  </button>
                </div>
                <div className="criteria-options">
                  {criteria.map((item) => (
                    <label key={item.id}>
                      <input
                        type="checkbox"
                        checked={form.criteria.includes(item.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setForm((f) => ({
                            ...f,
                            criteria: checked
                              ? [...f.criteria, item.id]
                              : f.criteria.filter((c) => c !== item.id),
                          }));
                        }}
                      />
                      <span>
                        <b>{item.id}</b> {item.name}
                        {item.id === "D3d" && (
                          <small>
                            Previously deferred — select only for a suitable
                            causal task.
                          </small>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="modal-footer">
                  <span>
                    {form.criteria.length} selected · one judge call per item
                  </span>
                  <button
                    className="primary"
                    disabled={!form.criteria.length}
                    onClick={() => setDialog(null)}
                  >
                    Use selected items <Check size={16} />
                  </button>
                </div>
              </>
            )}
            {dialog === "rubric" && (
              <>
                <p className="dialog-intro">
                  {activeVersion?.label || "Original rubric"}.{" "}
                  {revised
                    ? "Josh’s proposed rules replace D3a and D5c, with all five anchors supplied. Other items retain their original descriptions."
                    : "Missing intermediate descriptors are left missing."}{" "}
                  Safety Fail is flagged when an assessed D6a or D6b score is 1
                  or 2.
                </p>
                <div className="rubric-list">
                  {criteria.map((item) => (
                    <div key={item.id}>
                      <h3>
                        <span className="criterion-id">{item.id}</span>{" "}
                        {item.name}
                      </h3>
                      <Anchors item={item} />
                    </div>
                  ))}
                </div>
              </>
            )}
            {dialog === "plain" && (
              <>
                <p className="dialog-intro">
                  Saved answer, item scores, judge reasons and any human review.
                  No new model call.
                </p>
                <pre className="plain-output">{plain}</pre>
                <div className="modal-footer">
                  <span>Original answer and judge wording retained</span>
                  <a
                    className="primary"
                    href={`/api/runs/${run.id}/txt`}
                    download
                  >
                    <ArrowDownToLine size={16} /> Download .txt
                  </a>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
