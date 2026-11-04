import { backendName, modelOption } from "./modelIdentity.mjs";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
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
  Settings2,
  ShieldAlert,
  Square,
  X,
  Upload,
} from "lucide-react";
import "./app.css";
import { AccessControl, requestSignIn } from "./AccessControl";
import { displayData, displayText } from "./presentation.mjs";
import { HigherDecisions } from "./HigherDecisions";
import { Review } from "./Review";
import { Cases } from "./Cases";
import { BatchImport } from "./BatchImport";
import { EvaluationSetup, clinicalRubricId } from "./EvaluationSetup";
import { CaseContext } from "./CaseContext";
import { SavedEvaluations } from "./SavedEvaluations";
import { SubmissionFields, useContributor } from "./ContributorFields";
import { contributorError, newSubmission } from "./caseSubmission.mjs";
import { isTechnicalCheck } from "./evaluationHistory.mjs";
import {
  caseCode,
  newCaseCode,
  writtenCriteria,
  currentStudyVersion,
  initialScoringVersion,
} from "./caseIdentity.mjs";
import {
  BATCH_STORAGE,
  parseCases,
  savedComparison,
  answerColumn,
  PROVIDED_ANSWER,
} from "./caseImport.mjs";
import { ExportMenu, exposure } from "./StudyTools";
import {
  AdditionalEvidence,
  ScoringReferences,
  blankInterview,
  revisedId,
} from "./EvaluationEvidence";

const running = (r) =>
  r && ["generating", "scoring", "interviewing"].includes(r.status);
const currentView = () =>
  ["cases", "decisions", "review"].find((v) =>
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
  case_code: "",
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
  rubric_id: clinicalRubricId,
  answer_models: ["arc:lite"],
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
  requestSignIn(r);
  if (!r.ok) throw new Error(displayText(data.error || "The request failed."));
  return displayData(data);
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
        {item.rule_version === "overleaf-20261024-read-20261028"
          ? "Manuscript scoring guide"
          : item.rule_version === revisedId
            ? "Proposed scoring guide"
            : "Original scoring guide"}{" "}
        <ChevronDown size={13} />
      </summary>
      <div>
        {item.definition && (
          <p className="rule-definition">{item.definition}</p>
        )}
        {(item.allowed_numeric_labels || [1, 2, 3, 4, 5]).map((n) => (
          <p key={n}>
            <b>{n}</b>
            <span>
              {item.anchors[String(n)] || "No original descriptor supplied."}
            </span>
          </p>
        ))}
        {[revisedId, "overleaf-20261024-read-20261028"].includes(
          item.rule_version,
        ) && (
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
  const [contributor, setContributor] = useContributor();
  const [submission, setSubmission] = useState(() => newSubmission());
  const [view, setView] = useState(currentView);
  const [config, setConfig] = useState(null),
    [form, setForm] = useState(empty),
    [run, setRun] = useState(null);
  const [history, setHistory] = useState([]),
    [mode, setMode] = useState("generate");
  const [preset, setPreset] = useState("Clinical reasoning"),
    [error, setError] = useState(""),
    [pending, setPending] = useState(false);
  const [selectedCase, setSelectedCase] = useState("");
  const [pasteComparison, setPasteComparison] = useState(() => {
    try {
      return (
        JSON.parse(sessionStorage.getItem(BATCH_STORAGE))?.origin === "paste"
      );
    } catch {
      return false;
    }
  });
  const [entryMode, setEntryMode] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(BATCH_STORAGE));
      return saved?.rows?.length && saved.origin !== "paste"
        ? "batch"
        : "paste";
    } catch {
      return "paste";
    }
  });
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchRevision, setBatchRevision] = useState(0);
  const [readingComparison, setReadingComparison] = useState(() => {
    try {
      return !!JSON.parse(sessionStorage.getItem(BATCH_STORAGE))?.readOnly;
    } catch {
      return false;
    }
  });
  const [dialog, setDialog] = useState(null),
    [plain, setPlain] = useState("");
  const [review, setReview] = useState({ reviewer: "", items: {} }),
    [reviewMode, setReviewMode] = useState(false);
  const [hideScores, setHideScores] = useState(false),
    [saved, setSaved] = useState(false),
    [sidebar, setSidebar] = useState(false);
  const seen = useRef(new Set()),
    resultRef = useRef(null);
  const busy = pending || running(run) || batchRunning,
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
      config?.workspace_rubrics?.[form.rules_version]?.criteria ||
      (form.rules_version === "overleaf-20261024-read-20261028"
        ? config?.manuscript_rubric?.criteria
        : revised
          ? config?.revised_rubric?.criteria
          : config?.rubric?.criteria) ||
      [],
    valid =
      form.facts.trim() &&
      form.task.trim() &&
      form.criteria.length &&
      (mode === "paste" ||
        !Array.isArray(form.answer_models) ||
        form.answer_models.length > 0) &&
      (!form.history_required || form.history.trim());

  useEffect(() => {
    const update = () => {
      if (
        window.location.hash.startsWith("#patient") ||
        window.location.hash.startsWith("#study")
      ) {
        window.location.hash = "cases";
        setView("cases");
      } else setView(currentView());
    };
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  function navigate(next) {
    if (batchRunning && next !== "evaluation") return;
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
          draft = displayData(
            JSON.parse(localStorage.getItem("autorubric-draft") || "null"),
          );
        } catch {
          /* Start clean. */
        }
        setForm({
          ...empty,
          task: c.default_task,
          answer_model: c.settings.answer_model,
          answer_models: draft?.answer_models || [
            draft?.answer_model || c.settings.answer_model,
          ],
          judge_model: c.settings.judge_model,
          ...(draft || {}),
          case_code: draft?.case_code || newCaseCode(),
          rules_version: initialScoringVersion(c, draft),
          criteria:
            draft?.facts?.trim() ||
            draft?.answer?.trim() ||
            draft?.history?.trim() ||
            draft?._criteria_explicit
              ? draft?.criteria || writtenCriteria(c)
              : writtenCriteria(c),
        });
        setSelectedCase(draft?.case_id || "");
        let batch;
        try {
          batch = JSON.parse(sessionStorage.getItem(BATCH_STORAGE));
        } catch {
          /* No saved batch. */
        }
        if (!batch?.rows?.length) {
          setEntryMode("paste");
          // Saved runs are opened explicitly from Recent evaluations. The root opens the evaluation form.
        }
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
      if (answerColumn(run) !== PROVIDED_ANSWER)
        exposure(run.review_id, "identity");
      if (!hideScores && hasGrades) exposure(run.review_id, "machine");
    }
  }, [hideScores, run, view]);
  useEffect(() => {
    const show = () => {
      setDialog("history");
      refreshHistory();
    };
    window.addEventListener("arena-saved-evaluations", show);
    return () => window.removeEventListener("arena-saved-evaluations", show);
  }, []);
  useEffect(() => {
    const open = (e) => openRun(e.detail.id);
    const compare = (e) => openComparison(e.detail.records);
    const useCase = (e) => {
      if (!config) return;
      useData({
        ...e.detail.data,
        _copied_case: true,
        criteria: writtenCriteria(config),
        rules_version: currentStudyVersion(config),
        answer_model: config.settings.answer_model,
        answer_models: [config.settings.answer_model],
        judge_model: config.settings.judge_model,
      });
      setMode("generate");
      setPreset("Clinical reasoning");
    };
    window.addEventListener("arena-open-evaluation", open);
    window.addEventListener("arena-open-comparison", compare);
    window.addEventListener("arena-use-workspace-case", useCase);
    return () => {
      window.removeEventListener("arena-open-evaluation", open);
      window.removeEventListener("arena-open-comparison", compare);
      window.removeEventListener("arena-use-workspace-case", useCase);
    };
  }, [config]);
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
      ...(["facts", "task", "history"].includes(key) &&
      f._copied_case &&
      value !== f[key]
        ? { case_code: newCaseCode(), _copied_case: false, title: "" }
        : {}),
      ...(key === "rules_version" ? { _version_explicit: true } : {}),
      ...(key === "criteria" ? { _criteria_explicit: true } : {}),
      ...(key === "rubric_id"
        ? {
            rules_version: currentStudyVersion(config, value),
            _version_explicit: false,
          }
        : {}),
      ...(key === "answer_model" ? { answer_models: [value] } : {}),
      ...(key === "answer_models" && value.length
        ? { answer_model: value[0] }
        : {}),
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
      case_code: prepared.case_code || prepared.case_id || newCaseCode(),
      rules_version: prepared.rules_version || form.rules_version || "original",
      answer: "",
      reference_status: "draft",
    });
    setSelectedCase(id);
    setEntryMode("paste");
    setPreset(id === "pilot" ? "Clinical reasoning" : "Custom");
    setMode("generate");
    setError("");
  }
  function newCase(copy = false) {
    setSubmission(newSubmission());
    setReadingComparison(false);
    navigate("evaluation");
    setRun(null);
    setError("");
    setSaved(false);
    setReview({ reviewer: "", items: {} });
    seen.current = new Set();
    setReviewMode(false);
    setSidebar(false);
    setSelectedCase("");
    setPasteComparison(false);
    try {
      if (JSON.parse(sessionStorage.getItem(BATCH_STORAGE))?.origin === "paste")
        sessionStorage.removeItem(BATCH_STORAGE);
    } catch {
      /* Ignore an invalid old preview. */
    }
    setEntryMode("paste");
    if (!copy) {
      setForm({
        ...empty,
        case_code: newCaseCode(),
        task: config.default_task,
        rules_version: currentStudyVersion(config),
        criteria: writtenCriteria(config),
        answer_model: config.settings.answer_model,
        answer_models: [config.settings.answer_model],
        judge_model: config.settings.judge_model,
      });
      setMode("generate");
      setPreset("Clinical reasoning");
    } else {
      setForm((f) => ({
        ...f,
        case_code: f.case_code || newCaseCode(),
        _copied_case: true,
      }));
      setMode("paste");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function openRun(id) {
    try {
      const next = await api(`/api/runs/${id}`);
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
  async function openComparison(records) {
    setPending(true);
    setError("");
    try {
      const runs = [];
      for (let i = 0; i < records.length; i += 4)
        runs.push(
          ...(await Promise.all(
            records.slice(i, i + 4).map((r) => api(`/api/runs/${r.id}`)),
          )),
        );
      const batch = savedComparison(runs);
      sessionStorage.setItem(BATCH_STORAGE, JSON.stringify(batch));
      setRun(null);
      setPasteComparison(false);
      setEntryMode("batch");
      setBatchRevision((n) => n + 1);
      setReadingComparison(true);
      setDialog(null);
      navigate("evaluation");
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }
  function useData(data) {
    newCase(false);
    setForm({
      ...empty,
      ...data,
      case_code: data.case_code || data.case_id || newCaseCode(),
      evaluation_mode: "written",
    });
    setEntryMode("paste");
    setMode("paste");
    setPreset("Custom");
  }
  async function refreshHistory() {
    try {
      setHistory(await api("/api/runs"));
      window.dispatchEvent(new Event("arena-evaluations-saved"));
      localStorage.setItem(
        "autorubric-evaluations-updated",
        String(Date.now()),
      );
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
      setForm({
        ...empty,
        ...data,
        case_code: data.case_code || data.case_id || newCaseCode(),
        rules_version: version,
      });
      setEntryMode("paste");
      setMode("paste");
      setPreset("Custom");
    } catch (e) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }
  async function start(action) {
    if (config?.access?.hosted && !config.access.can_evaluate) {
      if (!config.access.authenticated)
        window.dispatchEvent(new Event("arena-sign-in"));
      else setError("This account does not have evaluation access.");
      return;
    }
    if (!run && contributorError(contributor)) {
      setError(contributorError(contributor));
      return;
    }
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
      const next = await api(path, {
        ...form,
        action,
        case_submission: run?.case_submission || {
          ...submission,
          contributor_id: contributor.trim(),
        },
      });
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
  function prepareComparison() {
    if (contributorError(contributor)) {
      setError(contributorError(contributor));
      return;
    }
    const rows = parseCases(JSON.stringify([{ ...form, answer: "" }]));
    sessionStorage.setItem(
      BATCH_STORAGE,
      JSON.stringify({
        rows,
        defaults: null,
        origin: "paste",
        case_submission: { ...submission, contributor_id: contributor.trim() },
      }),
    );
    setPasteComparison(true);
    setError("");
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
      setPlain(displayText(await r.text()));
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
          disabled={batchRunning}
          className={`study-nav ${view === "cases" ? "active" : ""}`}
          aria-current={view === "cases" ? "page" : undefined}
          onClick={() => navigate("cases")}
        >
          <BookOpen size={17} />
          <span>
            Case review
            <small>{config?.case_count || "Saved cases"} · Model results</small>
          </span>
        </button>
        <button
          disabled={batchRunning}
          className={`study-nav ${view === "review" ? "active" : ""}`}
          aria-current={view === "review" ? "page" : undefined}
          onClick={() => navigate("review")}
        >
          <CheckCheck size={17} />
          <span>
            Review first<small>Results hidden until rated</small>
          </span>
        </button>
        {view !== "review" && (
          <>
            <button
              className="study-nav saved-evaluations-nav"
              onClick={() => {
                setDialog("history");
                refreshHistory();
              }}
            >
              <History size={17} />
              <span>
                Saved evaluations
                <small>
                  {history.filter((record) => !isTechnicalCheck(record)).length}{" "}
                  saved
                </small>
              </span>
            </button>
            <div className="sidebar-bottom">
              <button
                className={view === "decisions" ? "active" : ""}
                disabled={
                  !config ||
                  batchRunning ||
                  (!!config?.access?.hosted &&
                    !config?.access?.can_manage_rubric)
                }
                title="Only an authorised rubric editor can change scoring rules"
                onClick={() => navigate("decisions")}
              >
                <ShieldAlert size={16} /> Higher-level decisions{" "}
                <span>Editor only</span>
              </button>
              <button onClick={() => setDialog("rubric")}>
                <BookOpen size={16} /> Clinical rubric <span>22 items</span>
              </button>
              <button onClick={() => setDialog("settings")}>
                <Settings2 size={16} /> Model settings
              </button>
              <p>
                <span
                  className={`status-dot ${config?.settings.configured ? "ok" : ""}`}
                />
                {config?.access?.online === false
                  ? "Saved study available"
                  : config?.settings.configured
                    ? "API configured"
                    : "Checking configuration"}
              </p>
              <small>
                {config?.access?.hosted
                  ? "Shared workspace evaluations"
                  : "Runs saved on this computer"}
              </small>
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
              {view === "cases"
                ? "Case review"
                : view === "decisions"
                  ? "Higher-level decisions"
                  : view === "review"
                    ? "Independent review"
                    : "Clinical reasoning evaluation"}
            </span>
          </div>
          <div>
            <AccessControl access={config?.access} />
            <button
              className="subtle-button"
              onClick={() => setDialog("about")}
            >
              <CircleHelp size={16} /> How it works
            </button>
          </div>
        </header>
        {view === "cases" ? (
          <Cases
            access={config?.access}
            canLoad={!!config && !busy}
            onUseCase={(id) => {
              newCase(false);
              loadCase(id);
            }}
          />
        ) : view === "decisions" ? (
          <HigherDecisions
            access={config?.access || { hosted: !config }}
            onUseData={useData}
            onUpdated={() => api("/api/config").then(setConfig)}
          />
        ) : view === "review" ? (
          <Review access={config?.access} />
        ) : (
          <main className={`evaluation-page ${run ? "saved-evaluation" : ""}`}>
            <div className="page-heading">
              <span className="eyebrow">CLINICAL REASONING · AUTORUBRIC</span>
              <h1>
                {run
                  ? caseCode(form)
                  : readingComparison
                    ? "Saved model comparison."
                    : "Evaluate a clinical case."}
              </h1>
              <p>
                {run
                  ? "Case, saved answer and item-by-item assessment."
                  : readingComparison
                    ? "Saved case-by-model results. Open an answer, review its item scores or download the full comparison."
                    : "Add your own case or import a batch. Choose a rubric and models, then generate or score answers."}
              </p>
              {form.requirements_review?.reviewer && (
                <p className="review-receipt">
                  Checklist copied from decisions recorded by{" "}
                  {form.requirements_review.reviewer}. Unconfirmed requirements
                  remain candidates. This is a new evaluation.
                </p>
              )}
            </div>
            {!run && !readingComparison && (
              <div className="entry-methods" aria-label="How to add cases">
                {[
                  [
                    "paste",
                    Clipboard,
                    "Paste a case",
                    "Add one case and generate or paste an answer",
                  ],
                  [
                    "batch",
                    Upload,
                    "Import cases",
                    "Compare models across a CSV, JSON or JSONL file",
                  ],
                ].map(([id, Icon, title, description]) => (
                  <button
                    key={id}
                    className={`entry-method ${entryMode === id ? "selected" : ""}`}
                    aria-pressed={entryMode === id}
                    disabled={busy}
                    onClick={() => {
                      if (id === "paste" && entryMode !== "paste") {
                        newCase(false);
                        setEntryMode("paste");
                      } else {
                        setPasteComparison(false);
                        setEntryMode(id);
                        if (
                          id === "batch" &&
                          !sessionStorage.getItem(BATCH_STORAGE)
                        )
                          change("task", config?.default_task || "");
                      }
                      setError("");
                    }}
                  >
                    <Icon size={20} />
                    <span>
                      <b>{title}</b>
                      <small>{description}</small>
                    </span>
                    <ArrowRight size={16} />
                  </button>
                ))}
              </div>
            )}
            {!run && entryMode !== "batch" && !pasteComparison && (
              <>
                <EvaluationSetup
                  config={config}
                  form={form}
                  change={change}
                  multiple
                  disabled={busy}
                  pasted={mode === "paste"}
                  onCriteria={() => setDialog("criteria")}
                  onViewCriteria={() => setDialog("rubric")}
                />
                <div
                  className="segmented answer-source-choice"
                  aria-label="Answer source"
                >
                  <button
                    className={mode === "generate" ? "selected" : ""}
                    disabled={busy}
                    onClick={() => setMode("generate")}
                  >
                    <FlaskConical size={15} /> Generate an answer
                  </button>
                  <button
                    className={mode === "paste" ? "selected" : ""}
                    disabled={busy}
                    onClick={() => setMode("paste")}
                  >
                    <Clipboard size={15} /> Paste an existing answer
                  </button>
                </div>
              </>
            )}
            {!run && (entryMode === "batch" || pasteComparison) ? (
              <>
                {pasteComparison && (
                  <button
                    className="back-link"
                    disabled={batchRunning}
                    onClick={() => {
                      setPasteComparison(false);
                      sessionStorage.removeItem(BATCH_STORAGE);
                    }}
                  >
                    <ArrowRight size={14} /> Back to case input
                  </button>
                )}
                <BatchImport
                  key={batchRevision}
                  config={config}
                  defaults={form}
                  change={change}
                  api={api}
                  onBusy={setBatchRunning}
                  onSaved={refreshHistory}
                  onOpen={openRun}
                  onCriteria={() => setDialog("criteria")}
                  onViewCriteria={() => setDialog("rubric")}
                  origin={pasteComparison ? "paste" : "import"}
                  onReset={() => newCase()}
                  onReadOnlyChange={setReadingComparison}
                />
              </>
            ) : (
              <>
                <nav className="steps" aria-label="Evaluation steps">
                  <span className="current">
                    <b>{run?.input.answer ? <Check size={13} /> : "1"}</b> Case
                    & task
                  </span>
                  <i />
                  <span
                    className={
                      form.answer || run?.status === "generating"
                        ? "current"
                        : ""
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
                {config?.access?.online === false && (
                  <p className="error-banner">
                    The host computer is offline. Saved study results remain
                    available; new evaluations and review saving will resume
                    when it is online.
                  </p>
                )}
                {config &&
                  !config.settings.configured &&
                  !config.access?.hosted && (
                    <div className="notice">
                      Add your API key to the existing repository .env file,
                      then restart the app.
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
                      <SubmissionFields
                        contributor={contributor}
                        onContributor={setContributor}
                        submission={submission}
                        onChange={setSubmission}
                        disabled={busy}
                      />
                    )}
                    {run?.case_submission && (
                      <p className="field-help">
                        Added by {run.case_submission.contributor_id} ·{" "}
                        {run.case_submission.batch_name}
                      </p>
                    )}
                    <div className="case-identity-fields">
                      <label className="field">
                        Case code{" "}
                        <input
                          aria-label="Case code"
                          value={form.case_code || form.case_id || ""}
                          readOnly
                          placeholder="Created automatically"
                        />
                        <small className="field-help">
                          Created automatically; shared across this case’s model
                          results.
                        </small>
                      </label>
                      <label className="field">
                        Original source{" "}
                        <span className="optional">optional</span>
                        <input
                          disabled={frozen || busy}
                          value={form.source}
                          placeholder="Article URL, DOI or citation; leave blank for a synthetic case"
                          onChange={(e) => change("source", e.target.value)}
                          maxLength={1000}
                        />
                      </label>
                    </div>
                    {(run || entryMode === "paste" || selectedCase) && (
                      <>
                        {false && selectedCase.startsWith("CAND") && !run && (
                          <p className="notice">
                            This loads a written snapshot of the prepared facts.
                            The saved step-by-step interview and manuscript
                            scores are in{" "}
                            <a href={`#study/cases/${selectedCase}`}>
                              Saved study
                            </a>
                            .
                          </p>
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
                        <label className="field visible-task">
                          The model’s task
                          <textarea
                            disabled={frozen}
                            className="task-text"
                            value={form.task}
                            onChange={(e) => change("task", e.target.value)}
                            placeholder="Specify the audience, question and response format."
                          />
                        </label>
                        {false && (
                          <AdditionalEvidence
                            form={form}
                            change={change}
                            frozen={frozen}
                            pending={busy}
                          />
                        )}
                        <ScoringReferences
                          form={form}
                          change={change}
                          frozen={frozen}
                          pending={busy}
                          hasGrades={hasGrades}
                          revised={
                            revised ||
                            form.rules_version ===
                              "overleaf-20261024-read-20261028"
                          }
                        />
                      </>
                    )}
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
                          <CheckCheck size={16} /> Answer saved. Choose the
                          rubric items, then evaluate.
                        </div>
                      )}
                    </section>
                  )}
                </div>
                <section className="action-panel">
                  {run && (
                    <EvaluationSetup
                      config={config}
                      form={form}
                      change={change}
                      disabled={hasGrades || busy}
                      scored={hasGrades}
                      onResults={() =>
                        resultRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        })
                      }
                      pasted={run.answer_source === "pasted"}
                      onCriteria={() => setDialog("criteria")}
                      onViewCriteria={() => setDialog("rubric")}
                    />
                  )}
                  <div className="controls-row">
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
                        <button
                          className="primary"
                          onClick={() => start("retry")}
                        >
                          {run.input.answer
                            ? "Retry remaining items"
                            : "Retry generation"}{" "}
                          <ArrowRight size={16} />
                        </button>
                      ) : hasGrades ? (
                        <button
                          className="secondary"
                          onClick={() => newCase(true)}
                        >
                          <Plus size={16} /> Use as new evaluation
                        </button>
                      ) : mode === "paste" || (run && form.answer.trim()) ? (
                        <button
                          className="primary"
                          disabled={!valid || !form.answer.trim()}
                          onClick={() => start("evaluate")}
                        >
                          {config?.access?.hosted &&
                          !config.access.authenticated
                            ? "Sign in to score"
                            : "Evaluate answer"}{" "}
                          <ArrowRight size={17} />
                        </button>
                      ) : (
                        <button
                          className="primary"
                          disabled={!valid || mode === "paste"}
                          onClick={() =>
                            form.answer_models?.length > 1
                              ? prepareComparison()
                              : start("generate")
                          }
                        >
                          {config?.access?.hosted &&
                          !config.access.authenticated
                            ? "Sign in to generate"
                            : form.answer_models?.length > 1
                              ? "Compare selected models"
                              : "Generate answer"}{" "}
                          <ArrowRight size={17} />
                        </button>
                      )}
                    </div>
                  </div>
                  {!run && !busy && (
                    <p className="field-help action-guidance">
                      {!form.facts.trim()
                        ? "Add case text to continue."
                        : !form.task.trim()
                          ? "Add a task so the model knows what to produce."
                          : !form.criteria.length
                            ? "Choose at least one rubric item in Rubric & models."
                            : mode === "paste" && !form.answer.trim()
                              ? "Paste an answer above to score it."
                              : config?.access?.hosted &&
                                  !config.access.authenticated
                                ? "You can prepare a case here. Sign in with a workspace account to generate or score."
                                : "Generate an answer first, then evaluate it; or paste an existing answer to score directly."}
                    </p>
                  )}
                  {!hasGrades && (
                    <label className="checkbox-label pre-review">
                      <input
                        type="checkbox"
                        checked={hideScores}
                        onChange={(e) => setHideScores(e.target.checked)}
                      />{" "}
                      Hide AutoRubric scores until reviewed
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
                  <CaseContext data={form} onEdit={() => newCase(true)}>
                    <section className="results-section" ref={resultRef}>
                      <div className="results-heading">
                        <div>
                          <span className="eyebrow">
                            ITEM-BY-ITEM ASSESSMENT
                          </span>
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
                              <a
                                key={t}
                                href={`/api/runs/${run.id}/${t}`}
                                download
                              >
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
                          <a
                            className="primary review-main-link"
                            href={`#review/${run.review_id}`}
                          >
                            <CheckCheck size={16} /> Review this answer ·{" "}
                            {form.criteria.length} items
                          </a>
                        )}
                        <button
                          className={`review-toggle ${reviewMode ? "active" : ""}`}
                          onClick={() => setReviewMode(!reviewMode)}
                        >
                          <CheckCheck size={16} /> Review alongside results
                        </button>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={hideScores}
                            onChange={(e) => setHideScores(e.target.checked)}
                          />{" "}
                          Hide AutoRubric scores & reasons
                        </label>
                      </div>
                      {reviewMode && (
                        <div className="review-intro">
                          <label className="field">
                            Reviewer
                            <input
                              value={review.reviewer || ""}
                              placeholder="Reviewer ID, e.g. R01"
                              onChange={(e) => {
                                setReview({
                                  ...review,
                                  reviewer: e.target.value,
                                });
                                setSaved(false);
                              }}
                            />
                          </label>
                          <p>
                            Read the answer and the saved scoring guide. Record
                            your own grade and a short reason. The saved rating
                            records whether AutoRubric results were shown in
                            this browser session or a prior saved review.
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
                                      : "AutoRubric assessment"}
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
                                : "Your ratings are saved alongside the AutoRubric scores."}
                          </span>
                          <button
                            className="primary"
                            disabled={busy}
                            onClick={saveReview}
                          >
                            {saved ? (
                              <Check size={16} />
                            ) : (
                              <CheckCheck size={16} />
                            )}{" "}
                            {saved ? "Saved" : "Save review"}
                          </button>
                        </div>
                      )}
                      <p className="scope-note">
                        Draft reference points and author-dependent scoring
                        choices can be checked in human review. A completed run
                        records model judgements; it is not a clinical
                        validation.
                      </p>
                    </section>
                  </CaseContext>
                )}
                {!run && (
                  <footer className="page-footer">
                    Reference points stay with the judge. API keys stay on the
                    server.
                  </footer>
                )}
              </>
            )}
          </main>
        )}
      </div>
      {dialog === "history" && (
        <SavedEvaluations
          records={history}
          busy={busy}
          onClose={() => setDialog(null)}
          onRefresh={refreshHistory}
          onOpen={(id) => {
            setDialog(null);
            openRun(id);
          }}
          onOpenComparison={openComparison}
          needsSignIn={config?.access?.hosted && !config.access.authenticated}
          onSignIn={() => {
            setDialog(null);
            requestSignIn({ status: 401 });
          }}
        />
      )}
      {dialog && dialog !== "history" && (
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
                  ? "Choose assessment items"
                  : dialog === "settings"
                    ? "Model settings"
                    : dialog === "rubric"
                      ? "Clinical rubric"
                      : "How it works"
            }
            className={`modal ${dialog === "plain" || dialog === "rubric" ? "wide" : ""}`}
          >
            <div className="modal-heading">
              <h2>
                {dialog === "plain"
                  ? "Plain-text output"
                  : dialog === "criteria"
                    ? "Choose assessment items"
                    : dialog === "settings"
                      ? "Model settings"
                      : dialog === "rubric"
                        ? "Clinical reasoning rubric"
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
                    <b>Evaluate with the clinical rubric.</b> AutoRubric asks
                    the judge to assess each selected item separately with the
                    saved rule version. Proposed D3a uses received evidence;
                    proposed D5c uses actual requests and candidate
                    requirements.
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
                {config?.access?.hosted && (
                  <p>
                    Saved study results are public. Sign in to generate, score
                    or save a review. Public downloads remove historical name
                    labels; the original archives are retained locally.
                  </p>
                )}
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
                      <option key={m} value={m}>
                        {modelOption(m)}
                      </option>
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
                      <option key={m} value={m}>
                        {modelOption(m)}
                      </option>
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
                  Choose which items AutoRubric will score for this answer. Each
                  selected item returns its own score and reason; unselected
                  items are not assessed.
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
                  <span>
                    {form.criteria.length} of {criteria.length} selected
                  </span>
                  <div className="criteria-selection-actions">
                    <button
                      type="button"
                      className="secondary"
                      disabled={form.criteria.length === criteria.length}
                      onClick={() => {
                        setPreset("Custom");
                        change(
                          "criteria",
                          criteria.map((item) => item.id),
                        );
                      }}
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      disabled={!form.criteria.length}
                      onClick={() => {
                        setPreset("Custom");
                        change("criteria", []);
                      }}
                    >
                      Clear selection
                    </button>
                  </div>
                </div>
                <div className="criteria-options">
                  {criteria.map((item) => (
                    <label key={item.id}>
                      <input
                        type="checkbox"
                        checked={form.criteria.includes(item.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setPreset("Custom");
                          setForm((f) => ({
                            ...f,
                            _criteria_explicit: true,
                            criteria: checked
                              ? [...f.criteria, item.id]
                              : f.criteria.filter((c) => c !== item.id),
                          }));
                        }}
                      />
                      <span>
                        <b>{item.id}</b> {item.name}
                        {item.id === "D5c" && (
                          <small>
                            For actual information seeking. Revised scoring
                            needs recorded questions, replies and candidate
                            requirements.
                          </small>
                        )}
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
              <CaseContext
                data={form}
                onEdit={
                  run
                    ? () => {
                        setDialog(null);
                        newCase(true);
                      }
                    : undefined
                }
              >
                <p className="dialog-intro">
                  {activeVersion?.label || "Original rubric"}.{" "}
                  {form.rules_version === "overleaf-20261024-read-20261028"
                    ? "Uses the saved manuscript definitions. Other items retain their saved original anchors."
                    : revised
                      ? "Revised definitions replace D3a and D5c, with all five anchors supplied. Other items retain their original descriptions."
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
              </CaseContext>
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
