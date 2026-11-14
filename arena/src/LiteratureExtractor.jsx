import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ExternalLink,
  FileText,
  Link,
  LoaderCircle,
  RefreshCw,
  Save,
  Upload,
} from "lucide-react";
import { requestSignIn } from "./AccessControl";
import { SubmissionFields, useContributor } from "./ContributorFields";
import { contributorError, newSubmission } from "./caseSubmission.mjs";
import { backendName } from "./modelIdentity.mjs";
import {
  draftCounts,
  sourceSegments,
  sourceMatchLabel,
  visibleDraft,
} from "./articleEvidence.mjs";

const labels = {
  visible: "Model-visible",
  hidden: "Hidden results",
  uncertain: "Needs review",
  exclude: "Excluded",
};
const statuses = {
  extracting: "Extracting source facts",
  ready: "Draft ready for review",
  edited: "Draft changes saved",
  confirmed: "Confirmed case saved",
  error: "Extraction needs retry",
  interrupted: "Extraction interrupted",
};
const LAST_DRAFT = "autorubric-article-draft";
const ArticleQuestions = lazy(() =>
  import("./ArticleQuestions.jsx").then((module) => ({
    default: module.ArticleQuestions,
  })),
);

// Article text must never pass through presentation/name substitutions: those
// would invalidate the saved source intervals.
async function articleRequest(path, body) {
  const response = await fetch(
    path,
    body === undefined
      ? {}
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  requestSignIn(response);
  const value = await response.json();
  if (!response.ok)
    throw new Error(value.error || "The article request failed.");
  return value;
}

function pdfPayload(file) {
  return new Promise((resolve, reject) => {
    if (
      !file ||
      file.size > 8 * 1024 * 1024 ||
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      reject(new Error("Select a PDF of at most 8 MB."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () =>
      reject(new Error("This PDF could not be read. Select it again."));
    reader.onload = () =>
      resolve({
        kind: "pdf",
        filename: file.name,
        content_base64: String(reader.result).split(",")[1],
      });
    reader.readAsDataURL(file);
  });
}

export function LiteratureExtractor({ access, onBusy, initialDraftId = "" }) {
  const [method, setMethod] = useState("pdf"),
    [url, setUrl] = useState("");
  const [file, setFile] = useState(null),
    [reuse, setReuse] = useState(true);
  const [source, setSource] = useState(null),
    [draft, setDraft] = useState(null);
  const [decision, setDecision] = useState(""),
    [audience, setAudience] = useState("clinician"),
    [model, setModel] = useState("arc:apex");
  const [sourceChecked, setSourceChecked] = useState(false),
    [visibilityChecked, setVisibilityChecked] = useState(false),
    [factsChecked, setFactsChecked] = useState(false);
  const [pending, setPending] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all"),
    [active, setActive] = useState("");
  const [recent, setRecent] = useState([]),
    [raw, setRaw] = useState(null);
  const [manualQuote, setManualQuote] = useState("");
  const [questionsBusy, setQuestionsBusy] = useState(false);
  const [questionFacts, setQuestionFacts] = useState(null);
  const [questionSourceFocus, setQuestionSourceFocus] = useState(null);
  const [factsExpanded, setFactsExpanded] = useState(false);
  const [contributor, setContributor] = useContributor();
  const [submission, setSubmission] = useState(() =>
    newSubmission("Article extraction"),
  );
  const sourceRef = useRef(null),
    cards = useRef({});
  const canRead = !access?.hosted || access.authenticated;
  const canEdit = !access?.hosted || access.can_evaluate;
  const extracting = draft?.status === "extracting";
  const editable =
    canEdit && !questionsBusy && ["ready", "edited"].includes(draft?.status);
  const counts = draftCounts(draft?.items);
  const items = (draft?.items || []).filter(
    (i) => filter === "all" || i.visibility === filter,
  );
  const sourceItems = (!factsExpanded && questionFacts) || draft?.items || [];

  async function reloadRecent() {
    const result = await articleRequest("/api/literature");
    setRecent(result.drafts);
  }
  async function openDraft(id) {
    setPending("open");
    setError("");
    setRaw(null);
    try {
      const next = await articleRequest(`/api/literature/drafts/${id}`);
      const article = await articleRequest(
        `/api/literature/sources/${next.source_id}`,
      );
      setDraft(next);
      setSource(article);
      setDecision(next.decision_point);
      setAudience(next.audience);
      setModel(next.model_id);
      setSourceChecked(true);
      setVisibilityChecked(false);
      setFactsChecked(false);
      setFilter("all");
      setActive("");
      setQuestionFacts(null);
      setFactsExpanded(false);
      sessionStorage.setItem(LAST_DRAFT, id);
    } catch (e) {
      setError(e.message);
    } finally {
      setPending("");
    }
  }
  useEffect(() => {
    if (!canRead) return;
    reloadRecent().catch((e) => setError(e.message));
    const id = initialDraftId || sessionStorage.getItem(LAST_DRAFT);
    if (id) openDraft(id);
  }, [canRead, initialDraftId]);
  useEffect(() => {
    onBusy?.(!!pending || extracting || questionsBusy);
    return () => onBusy?.(false);
  }, [pending, extracting, questionsBusy]);
  useEffect(() => {
    if (!extracting) return;
    let mounted = true;
    const timer = setInterval(async () => {
      try {
        const next = await articleRequest(`/api/literature/drafts/${draft.id}`);
        if (mounted) {
          setDraft(next);
          if (next.status !== "extracting") reloadRecent().catch(() => {});
        }
      } catch (e) {
        if (mounted)
          setError(
            `${e.message} The extraction stays saved; reopen this draft to check its status.`,
          );
      }
    }, 2500);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [draft?.id, extracting]);

  function reset() {
    setSource(null);
    setDraft(null);
    setError("");
    setMessage("");
    setRaw(null);
    setDecision("");
    setSourceChecked(false);
    setVisibilityChecked(false);
    setFactsChecked(false);
    setActive("");
    sessionStorage.removeItem(LAST_DRAFT);
    setSubmission(newSubmission("Article extraction"));
  }
  async function read() {
    setPending("read");
    setError("");
    setMessage("");
    try {
      const body =
        method === "pdf"
          ? await pdfPayload(file)
          : { kind: "url", url: url.trim(), use_saved_source: reuse };
      setSource(await articleRequest("/api/literature/sources", body));
      setDraft(null);
      setSourceChecked(false);
      setRaw(null);
      sessionStorage.removeItem(LAST_DRAFT);
    } catch (e) {
      setError(e.message);
    } finally {
      setPending("");
    }
  }
  async function extract() {
    setPending("extract");
    setError("");
    setMessage("");
    try {
      const next = await articleRequest("/api/literature/drafts", {
        source_id: source.id,
        decision_point: decision,
        audience,
        model_id: model,
        source_checked: sourceChecked,
      });
      setDraft(next);
      setQuestionFacts(null);
      setFactsExpanded(false);
      sessionStorage.setItem(LAST_DRAFT, next.id);
      setRaw(null);
      setVisibilityChecked(false);
      setFactsChecked(false);
      reloadRecent().catch(() => {});
    } catch (e) {
      setError(e.message);
    } finally {
      setPending("");
    }
  }
  function edit(key, value) {
    setDraft((d) => ({ ...d, [key]: value }));
    setMessage("");
    setVisibilityChecked(false);
    setFactsChecked(false);
  }
  function editItem(id, key, value) {
    setDraft((d) => ({
      ...d,
      items: d.items.map((i) =>
        i.id === id
          ? {
              ...i,
              [key]: value,
              edited_from_source:
                key === "text"
                  ? value !== i.source_quote
                  : i.edited_from_source,
            }
          : i,
      ),
    }));
    setMessage("");
    setVisibilityChecked(false);
    setFactsChecked(false);
  }
  function choose(id, fromSource = false) {
    setActive(id);
    if (fromSource) {
      if (questionFacts && !factsExpanded) {
        setQuestionSourceFocus({ id, selectedAt: Date.now() });
        return;
      }
      setFilter("all");
      setTimeout(
        () =>
          cards.current[id]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          }),
        20,
      );
    } else {
      const match = sourceRef.current?.querySelector(`[data-fact-id="${id}"]`);
      if (match) {
        const pane = sourceRef.current;
        pane.scrollTo({
          top:
            pane.scrollTop +
            match.getBoundingClientRect().top -
            pane.getBoundingClientRect().top -
            pane.clientHeight / 3,
          behavior: "smooth",
        });
        if (window.matchMedia("(max-width: 760px)").matches)
          pane
            .closest(".article-source-column")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }
  async function save(confirm = false) {
    if (confirm && contributorError(contributor)) {
      setError(contributorError(contributor));
      return;
    }
    setPending(confirm ? "confirm" : "save");
    setError("");
    setMessage("");
    try {
      const result = await articleRequest(
        `/api/literature/drafts/${draft.id}/${confirm ? "confirm" : "save"}`,
        {
          revision: draft.revision,
          items: draft.items.map(({ id, text, visibility }) => ({
            id,
            text,
            visibility,
          })),
          title: draft.title,
          task: draft.task,
          visible_context: draft.visible_context,
          reference: draft.reference,
          visibility_checked: visibilityChecked,
          facts_task_checked: factsChecked,
          case_submission: {
            ...submission,
            contributor_id: contributor.trim(),
            filename: (source.filename || source.url || "").slice(0, 255),
          },
        },
      );
      setDraft(result.draft);
      setMessage(
        confirm
          ? `${result.case.case_code} is now in Workspace cases. Clinical references remain awaiting confirmation.`
          : "Draft saved. It has not been added to the case library.",
      );
      reloadRecent().catch(() => {});
      if (confirm) window.dispatchEvent(new Event("arena-cases-saved"));
      return result.draft;
    } catch (e) {
      setError(e.message);
    } finally {
      setPending("");
    }
  }
  async function readRaw() {
    try {
      setPending("raw");
      setRaw(await articleRequest(`/api/literature/drafts/${draft.id}/output`));
    } catch (e) {
      setError(e.message);
    } finally {
      setPending("");
    }
  }

  async function addQuote() {
    setPending("add-quote");
    setError("");
    try {
      const result = await articleRequest(
        `/api/literature/drafts/${draft.id}/add-quote`,
        {
          revision: draft.revision,
          items: draft.items.map(({ id, text, visibility }) => ({
            id,
            text,
            visibility,
          })),
          title: draft.title,
          task: draft.task,
          visible_context: draft.visible_context,
          reference: draft.reference,
          quote: manualQuote,
        },
      );
      setDraft(result.draft);
      setManualQuote("");
      setFilter("uncertain");
      setVisibilityChecked(false);
      setFactsChecked(false);
      setMessage(
        "Source passage added as Needs review. Check its patient, timing and visibility.",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setPending("");
    }
  }

  if (!canRead)
    return (
      <section className="article-intake card">
        <h2>Extract a case from an article</h2>
        <p>
          Sign in to upload a PDF or read an article, review its source-backed
          draft and save a case to the shared workspace.
        </p>
        <button
          className="primary"
          onClick={() => window.dispatchEvent(new Event("arena-sign-in"))}
        >
          Sign in
        </button>
      </section>
    );
  return (
    <section className="literature-tool" aria-label="Article to case">
      <div className="article-intro">
        <div>
          <h2>Article → case & questions → your confirmation</h2>
          <p>
            Extract source facts, generate several questions for the same case,
            then check each question’s input and reference before saving.
          </p>
        </div>
        {source && (
          <button
            className="secondary"
            disabled={!!pending || extracting || questionsBusy}
            onClick={reset}
          >
            New article
          </button>
        )}
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      {message && (
        <p className="article-success" role="status">
          <Check size={17} />
          {message}
        </p>
      )}
      {!source && (
        <section className="article-intake card">
          <h3>1. Add the full article</h3>
          <div
            className="segmented article-method"
            aria-label="Article input method"
          >
            {[
              ["pdf", Upload, "Upload PDF"],
              ["url", Link, "Article URL"],
            ].map(([id, Icon, label]) => (
              <button
                key={id}
                className={method === id ? "selected" : ""}
                onClick={() => setMethod(id)}
                disabled={!!pending || !canEdit}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
          {method === "pdf" ? (
            <label className="field article-upload">
              Text-based PDF · up to 8 MB
              <input
                aria-label="Article PDF"
                type="file"
                accept="application/pdf,.pdf"
                disabled={!!pending || !canEdit}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <small>
                Scanned PDFs need OCR first. Tables and image-only findings need
                a check in the original.
              </small>
            </label>
          ) : (
            <>
              <label className="field">
                Article URL
                <input
                  type="url"
                  aria-label="Article URL"
                  value={url}
                  disabled={!!pending || !canEdit}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://casereports.bmj.com/content/…"
                />
                <small>
                  If the publisher requires institutional access, upload the
                  full-text PDF.
                </small>
              </label>
              <label className="article-check">
                <input
                  type="checkbox"
                  checked={reuse}
                  onChange={(e) => setReuse(e.target.checked)}
                />
                Reuse the workspace’s saved full text when available. Its
                retrieval method will be shown.
              </label>
            </>
          )}
          <button
            className="primary"
            disabled={
              !!pending || !canEdit || (method === "pdf" ? !file : !url.trim())
            }
            onClick={read}
          >
            {pending === "read" ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <BookOpen size={17} />
            )}
            Read article
          </button>
        </section>
      )}
      {!source && recent.length > 0 && (
        <section className="article-recent card">
          <div className="panel-heading">
            <h3>Saved article drafts</h3>
            <button
              className="text-button"
              onClick={() => reloadRecent().catch((e) => setError(e.message))}
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
          {recent.map((row) => (
            <button
              className="article-recent-row"
              key={row.id}
              disabled={!!pending}
              onClick={() => openDraft(row.id)}
            >
              <span>
                <b>{row.article_title}</b>
                <small>
                  {statuses[row.status] || row.status} ·{" "}
                  {row.source_format ? `${row.source_format} · ` : ""}
                  {row.reprocessed_from ? "Alignment recheck · " : ""}
                  {new Date(row.created_at).toLocaleDateString("en-GB")}
                  {row.confirmed_case_code
                    ? ` · ${row.confirmed_case_code}`
                    : ""}
                </small>
              </span>
              <ArrowRight size={17} />
            </button>
          ))}
        </section>
      )}
      {source && (
        <>
          <div className="article-source-meta">
            <FileText size={18} />
            <div>
              <b>{source.title}</b>
              <small>
                {source.loaded_from_saved_source ||
                source.retrieval_method === "saved_full_text"
                  ? "Saved full text · earlier workspace read, not a fresh download"
                  : source.kind === "pdf"
                    ? `PDF · ${source.page_count} pages`
                    : "Publisher full text"}{" "}
                · {source.text.length.toLocaleString("en-GB")} characters
              </small>
              {source.url && (
                <a href={source.url} target="_blank" rel="noreferrer">
                  Original article <ExternalLink size={12} />
                </a>
              )}
              {!source.url && source.doi && (
                <a
                  href={`https://doi.org/${source.doi}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  DOI: {source.doi}
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
          <div className="article-workspace">
            <div className="article-draft-column">
              {!draft && (
                <section className="card article-extract-setup">
                  <h3>2. Set the evidence boundary</h3>
                  <label className="field">
                    Review boundary · for extraction only
                    <textarea
                      aria-label="Review boundary"
                      value={decision}
                      onChange={(e) => setDecision(e.target.value)}
                      rows={4}
                      maxLength={1500}
                      placeholder="e.g. Initial assessment before the biopsy result. Keep later treatment response hidden."
                    />
                    <small>
                      Specify the consultation stage and later results to hide.
                      This instruction is not copied into the model’s case.
                    </small>
                  </label>
                  <div className="article-setup-row">
                    <label className="field">
                      Audience
                      <select
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                      >
                        <option value="clinician">Clinician</option>
                        <option value="patient">Patient</option>
                        <option value="caregiver">
                          Family member / caregiver
                        </option>
                      </select>
                    </label>
                    <label className="field">
                      Extraction model
                      <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                      >
                        {["arc:apex", "arc:lite", "arc:chat"].map((id) => (
                          <option key={id} value={id}>
                            {backendName(id)} · {id}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="article-check">
                    <input
                      type="checkbox"
                      checked={sourceChecked}
                      onChange={(e) => setSourceChecked(e.target.checked)}
                    />
                    I checked that the full case text and relevant tables are
                    present.
                  </label>
                  <button
                    className="primary"
                    disabled={
                      !!pending ||
                      !canEdit ||
                      !sourceChecked ||
                      decision.trim().length < 12
                    }
                    onClick={extract}
                  >
                    <BookOpen size={17} />
                    Extract case draft
                  </button>
                </section>
              )}
              {draft && (
                <>
                  <div className="article-draft-heading">
                    <div>
                      <h3>{draft.case_code}</h3>
                      <p>
                        {statuses[draft.status] || draft.status} · LangExtract{" "}
                        {draft.langextract_version}
                      </p>
                    </div>
                    <span className="status-pill">
                      Reference · awaiting confirmation
                    </span>
                  </div>
                  <div className="article-boundary">
                    <b>Review boundary</b>
                    <p>{draft.decision_point}</p>
                    <small>
                      Audience:{" "}
                      {draft.audience === "caregiver"
                        ? "family member / caregiver"
                        : draft.audience}
                      . This extraction instruction is kept outside the answer
                      model’s input.
                    </small>
                  </div>
                  {extracting && (
                    <div className="notice article-progress">
                      <LoaderCircle className="spin" size={18} />
                      <div>
                        Extracting source-backed facts…
                        <p>
                          This runs on the server. The source, prompts and
                          responses are saved; reopen this draft if you leave.
                        </p>
                      </div>
                    </div>
                  )}
                  {["error", "interrupted"].includes(draft.status) && (
                    <div className="notice">
                      <p>{draft.error}</p>
                      <button
                        className="secondary"
                        disabled={!!pending || !canEdit}
                        onClick={extract}
                      >
                        Retry as a new draft
                      </button>
                    </div>
                  )}
                  {draft.items.length > 0 && !extracting && (
                    <Suspense
                      fallback={
                        <p className="field-help">Loading question tools…</p>
                      }
                    >
                      <ArticleQuestions
                        key={draft.id}
                        draft={draft}
                        source={source}
                        request={articleRequest}
                        canEdit={canEdit}
                        disabled={!!pending}
                        beforeGenerate={() =>
                          draft.status === "confirmed"
                            ? Promise.resolve(draft)
                            : save(false)
                        }
                        contributor={contributor}
                        onContributor={setContributor}
                        submission={submission}
                        onSubmission={setSubmission}
                        onBusy={setQuestionsBusy}
                        onEvidence={setQuestionFacts}
                        onLocate={choose}
                        activeFact={active}
                        sourceFocus={questionSourceFocus}
                      />
                    </Suspense>
                  )}
                  {draft.items.length > 0 && (
                    <details
                      className="article-facts-section"
                      open={factsExpanded}
                      onToggle={(e) => setFactsExpanded(e.currentTarget.open)}
                    >
                      <summary>
                        Source facts & single-task draft · {draft.items.length}{" "}
                        facts
                      </summary>
                      {draft.reprocessing && (
                        <p className="article-instruction">
                          Alignment recheck:{" "}
                          {draft.reprocessing.recovered_matches} source
                          locations recovered without a new model call. Original
                          PDF, source text and model output are retained in the
                          earlier draft.
                          {draft.reprocessing.additional_source_fact_ids
                            ?.length > 0 &&
                            ` ${draft.reprocessing.additional_source_fact_ids.length} complete source passages added separately.`}{" "}
                          This draft still needs source and visibility
                          confirmation.
                        </p>
                      )}
                      {draft.items.some((i) => i.grounding !== "exact") && (
                        <p className="article-review-needed">
                          {
                            draft.items.filter((i) => i.grounding !== "exact")
                              .length
                          }{" "}
                          excerpts do not have a verbatim source match and stay
                          Excluded. Some may be rewritten or table-derived; this
                          count does not measure missing clinical facts. Check
                          their source evidence before use.
                        </p>
                      )}
                      <p className="article-instruction">
                        Click a fact to find it in the source on the right.
                        Click a highlighted passage to return to its draft fact.
                        Check time, patient and visibility before saving.
                      </p>
                      <div
                        className="article-filters"
                        aria-label="Filter draft facts"
                      >
                        {[
                          ["all", "All facts", draft.items.length],
                          ...Object.entries(labels).map(([id, label]) => [
                            id,
                            label,
                            counts[id],
                          ]),
                        ].map(([id, label, count]) => (
                          <button
                            key={id}
                            aria-pressed={filter === id}
                            className={filter === id ? "selected" : ""}
                            onClick={() => setFilter(id)}
                          >
                            {label}
                            <b>{count}</b>
                          </button>
                        ))}
                      </div>
                      {editable && (
                        <details className="article-add-quote">
                          <summary>Add a missing fact from the source</summary>
                          <p>
                            Copy a distinct, exact passage from the saved text
                            on the right. It will keep its source location and
                            start as Needs review.
                          </p>
                          <textarea
                            aria-label="Missing fact source quote"
                            rows={3}
                            value={manualQuote}
                            onChange={(e) => setManualQuote(e.target.value)}
                            placeholder="Paste the exact source passage, including its original line breaks"
                          />
                          <button
                            className="secondary"
                            disabled={!!pending || !manualQuote.trim()}
                            onClick={addQuote}
                          >
                            Add exact source quote
                          </button>
                        </details>
                      )}
                      <div className="article-fact-list">
                        {items.map((item) => (
                          <article
                            key={item.id}
                            ref={(node) => {
                              cards.current[item.id] = node;
                            }}
                            className={`article-fact ${item.visibility} ${active === item.id ? "active" : ""}`}
                          >
                            <div className="article-fact-top">
                              <button
                                className="article-source-link"
                                disabled={!item.position}
                                onClick={() => choose(item.id)}
                              >
                                {item.position?.page
                                  ? `PDF p. ${item.position.page}`
                                  : item.position?.section || "No source match"}
                                <ArrowRight size={13} />
                              </button>
                              <span>
                                {item.id} · {item.category.replaceAll("_", " ")}
                              </span>
                            </div>
                            <label className="field article-fact-text">
                              <span className="sr-only">Fact {item.id}</span>
                              <textarea
                                aria-label={`Fact ${item.id}`}
                                rows={Math.max(
                                  2,
                                  Math.min(7, Math.ceil(item.text.length / 70)),
                                )}
                                value={item.text}
                                disabled={!editable || !!pending}
                                onFocus={() => setActive(item.id)}
                                onChange={(e) =>
                                  editItem(item.id, "text", e.target.value)
                                }
                              />
                            </label>
                            <div className="article-fact-controls">
                              <label>
                                Use in case
                                <select
                                  aria-label={`Visibility ${item.id}`}
                                  value={item.visibility}
                                  disabled={!editable || !!pending}
                                  onChange={(e) =>
                                    editItem(
                                      item.id,
                                      "visibility",
                                      e.target.value,
                                    )
                                  }
                                >
                                  {Object.entries(labels).map(
                                    ([value, label]) => (
                                      <option
                                        key={value}
                                        value={value}
                                        disabled={
                                          item.grounding !== "exact" &&
                                          value !== "exclude"
                                        }
                                      >
                                        {label}
                                      </option>
                                    ),
                                  )}
                                </select>
                              </label>
                              <small>
                                {sourceMatchLabel(item)}
                                {item.edited_from_source
                                  ? item.layout_cleaned &&
                                    item.text === item.readable_quote
                                    ? " · readable layout"
                                    : " · text edited"
                                  : ""}
                                {item.duplicate_of
                                  ? ` · duplicate of ${item.duplicate_of}`
                                  : ""}
                              </small>
                            </div>
                            <details>
                              <summary>Source quote & extraction note</summary>
                              <blockquote>
                                {item.source_quote ||
                                  item.model_extraction_text}
                              </blockquote>
                              <p>{item.visibility_reason}</p>
                              {item.alignment_changes?.length > 0 && (
                                <p>
                                  Alignment only:{" "}
                                  {item.alignment_changes.join(", ")}. Source
                                  wording above is unchanged.
                                </p>
                              )}
                              {item.model_extraction_text &&
                                item.model_extraction_text !==
                                  item.source_quote &&
                                item.source_quote && (
                                  <details>
                                    <summary>Original model wording</summary>
                                    <blockquote>
                                      {item.model_extraction_text}
                                    </blockquote>
                                  </details>
                                )}
                              {item.grounding_review && (
                                <p>{item.grounding_review}</p>
                              )}
                              {item.supporting_evidence?.map(
                                (evidence, index) => (
                                  <div key={index}>
                                    <small>
                                      {evidence.label} · PDF p.{" "}
                                      {evidence.position.page}
                                    </small>
                                    <blockquote>
                                      {evidence.source_quote}
                                    </blockquote>
                                  </div>
                                ),
                              )}
                              <small>
                                {item.time_label} · {item.patient_group}
                                {item.position
                                  ? ` · characters ${item.position.start}–${item.position.end}`
                                  : ""}
                              </small>
                            </details>
                          </article>
                        ))}
                      </div>
                      {!items.length && (
                        <p className="notice">No facts in this group.</p>
                      )}
                      <section className="card article-final-draft">
                        <h3>Save one general task instead</h3>
                        <p className="field-help">
                          The article title, hidden results and extraction notes
                          stay outside the answer model’s input.
                        </p>
                        <label className="field">
                          Model-visible consultation context
                          <textarea
                            aria-label="Model-visible consultation context"
                            value={draft.visible_context || ""}
                            disabled={!editable || !!pending}
                            maxLength={1500}
                            rows={2}
                            onChange={(e) =>
                              edit("visible_context", e.target.value)
                            }
                          />
                        </label>
                        <details>
                          <summary>
                            Preview model-visible case · {counts.visible} facts
                          </summary>
                          <pre className="article-case-preview">
                            {visibleDraft(draft) ||
                              "No model-visible facts selected."}
                          </pre>
                        </details>
                        <label className="field">
                          Task prompt
                          <textarea
                            aria-label="Extracted case task"
                            value={draft.task}
                            disabled={!editable || !!pending}
                            rows={9}
                            onChange={(e) => edit("task", e.target.value)}
                          />
                          <small>
                            Starts from an editable audience template. Check
                            that the task fits this case.
                          </small>
                        </label>
                        <details>
                          <summary>
                            Scoring reference · awaiting confirmation
                          </summary>
                          <p className="field-help">
                            For the judge only. This tool does not establish a
                            clinical reference.
                          </p>
                          <textarea
                            aria-label="Article case scoring reference"
                            value={draft.reference}
                            disabled={!editable || !!pending}
                            rows={4}
                            placeholder="Optional clinical reference notes for later confirmation"
                            onChange={(e) => edit("reference", e.target.value)}
                          />
                        </details>
                        {editable && (
                          <>
                            <SubmissionFields
                              contributor={contributor}
                              onContributor={setContributor}
                              submission={submission}
                              onChange={setSubmission}
                              disabled={!!pending}
                            />
                            <label className="article-check">
                              <input
                                type="checkbox"
                                checked={visibilityChecked}
                                onChange={(e) =>
                                  setVisibilityChecked(e.target.checked)
                                }
                              />
                              I checked every fact’s patient, timing and
                              visibility. Later results stay hidden.
                            </label>
                            <label className="article-check">
                              <input
                                type="checkbox"
                                checked={factsChecked}
                                onChange={(e) =>
                                  setFactsChecked(e.target.checked)
                                }
                              />
                              I checked the visible case and task against the
                              original, including tables and important
                              omissions. Clinical references remain awaiting
                              confirmation.
                            </label>
                            {counts.uncertain > 0 && (
                              <p className="article-review-needed">
                                Resolve {counts.uncertain} Needs review{" "}
                                {counts.uncertain === 1 ? "fact" : "facts"}{" "}
                                before adding this case to the library.
                              </p>
                            )}
                            <div className="article-save-actions">
                              <button
                                className="secondary"
                                disabled={!!pending}
                                onClick={() => save(false)}
                              >
                                <Save size={16} />
                                Save draft only
                              </button>
                              <button
                                className="primary"
                                disabled={
                                  !!pending ||
                                  !counts.visible ||
                                  counts.uncertain > 0 ||
                                  !visibilityChecked ||
                                  !factsChecked ||
                                  !!contributorError(contributor)
                                }
                                onClick={() => save(true)}
                              >
                                {pending === "confirm" ? (
                                  <LoaderCircle size={17} className="spin" />
                                ) : (
                                  <Check size={17} />
                                )}
                                Confirm & save case
                              </button>
                            </div>
                          </>
                        )}
                        {draft.status === "confirmed" && (
                          <div className="article-save-actions">
                            <button
                              className="primary"
                              onClick={() =>
                                window.dispatchEvent(
                                  new CustomEvent("arena-use-workspace-case", {
                                    detail: { data: draft.confirmed_case },
                                  }),
                                )
                              }
                            >
                              Use confirmed case
                              <ArrowRight size={16} />
                            </button>
                            <button
                              className="secondary"
                              onClick={() => {
                                window.location.hash = "cases/workspace";
                              }}
                            >
                              Open Workspace cases
                            </button>
                          </div>
                        )}
                      </section>
                    </details>
                  )}
                  {!extracting && (
                    <details className="card article-raw">
                      <summary>Extraction prompts & full output</summary>
                      <p>
                        Saved source text, source positions, draft, visible
                        model responses and call metadata. No API keys.
                      </p>
                      <button
                        className="secondary"
                        disabled={!!pending}
                        onClick={readRaw}
                      >
                        Read saved output
                      </button>
                      <a
                        className="text-button"
                        href={`/api/literature/drafts/${draft.id}/output`}
                        download
                      >
                        Download JSON
                      </a>
                      {raw && <pre>{JSON.stringify(raw, null, 2)}</pre>}
                    </details>
                  )}
                </>
              )}
            </div>
            <aside
              className="article-source-column"
              aria-label="Original article text"
            >
              <div className="article-source-heading">
                <div>
                  <BookOpen size={18} />
                  <h3>Original article text</h3>
                </div>
                <span>Click highlights to inspect facts</span>
              </div>
              <div className="article-source-notes">
                {source.quality_notes.map((note, i) => (
                  <p key={i}>{note}</p>
                ))}
                {source.kind === "pdf" && (
                  <a href={`/api/literature/sources/${source.id}/pdf`} download>
                    Download original PDF
                  </a>
                )}
              </div>
              <div className="article-highlight-legend">
                <span className="visible">Model-visible</span>
                <span className="hidden">Hidden</span>
                <span className="uncertain">Needs review</span>
              </div>
              <div className="article-source-scroll" ref={sourceRef}>
                {source.blocks.map((block) => (
                  <section
                    className="article-source-block"
                    key={block.id + block.start}
                  >
                    <small>
                      {block.page ? `PDF page ${block.page}` : block.section} ·
                      paragraph {source.blocks.indexOf(block) + 1}
                    </small>
                    <p>
                      {sourceSegments(block, sourceItems).map((segment) =>
                        segment.ids.length ? (
                          <button
                            key={segment.start}
                            data-fact-id={
                              segment.ids.includes(active)
                                ? active
                                : segment.ids[0]
                            }
                            className={`article-highlight ${sourceItems.find((i) => i.id === segment.ids[0])?.visibility || "uncertain"} ${segment.ids.includes(active) ? "active" : ""}`}
                            title="Show this source passage in the case draft"
                            onClick={() => choose(segment.ids[0], true)}
                          >
                            {segment.text}
                          </button>
                        ) : (
                          <span key={segment.start}>{segment.text}</span>
                        ),
                      )}
                    </p>
                  </section>
                ))}
              </div>
              <small className="article-source-fingerprint">
                Saved text: {source.text_sha256.slice(0, 16)}… · exact positions
                retained
              </small>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
