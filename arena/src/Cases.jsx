import { useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, Search } from "lucide-react";
import { displayData } from "./presentation.mjs";
import { CaseModelResults } from "./CaseModelResults";
import { SavedDocument } from "./EvidenceDialog";
import { SubmittedCases } from "./SubmittedCases";

function selectedCase() {
  return window.location.hash.match(/^#cases\/([A-Z0-9]+)$/)?.[1] || "";
}
async function getFile(name) {
  const response = await fetch(`/cases/${name}`);
  if (!response.ok) throw new Error("The case library could not be loaded.");
  return displayData(await response.json());
}

export function Cases({ onUseCase, canLoad, access }) {
  const overview = useRef(null);
  const [data, setData] = useState(null);
  const [id, setId] = useState(selectedCase);
  const [group, setGroup] = useState("all");
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState("");
  const [document, setDocument] = useState(null);
  const [fullReview, setFullReview] = useState(null);
  useEffect(() => {
    getFile("index.json")
      .then(setData)
      .catch((e) => setError(e.message));
    fetch("/full-rubric-review/index.json")
      .then((response) => response.ok ? response.json() : null)
      .then(setFullReview)
      .catch(() => {});
    const update = () => setId(selectedCase());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    if (!id || id.startsWith("CAND")) {
      setSaved(null);
      return;
    }
    let active = true;
    setSaved(null);
    getFile(`${id}.json`)
      .then((value) => {
        if (active) setSaved(value);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id]);
  if (!data)
    return (
      <main>
        <p role={error ? "alert" : undefined}>{error || "Loading cases…"}</p>
      </main>
    );
  const rows = data.cases.filter(
    (c) =>
      (group === "all" || c.group === group) &&
      `${c.id} ${c.title} ${c.summary} ${c.audience}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const record = data.cases.find((c) => c.id === id);
  function choose(value) {
    setError("");
    window.location.hash = `cases/${value}`;
    if (window.matchMedia("(max-width: 1000px)").matches)
      setTimeout(
        () =>
          overview.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        50,
      );
  }
  function filter(value) {
    setGroup(value);
    setSearch("");
    if (value !== "all" && record?.group !== value)
      window.location.hash = "cases";
  }
  return (
    <main className="study case-catalogue">
      <div className="study-heading">
        <p className="eyebrow">SAVED CASES AND RESULTS</p>
        <h1>Case review.</h1>
        <p>
          <strong>{data.base_case_count} saved cases and tasks.</strong> Select
          a case to compare models. Click a score for its answer, rubric and
          evaluation. Your added cases are in Workspace cases; full batch tables
          are in{" "}
          <button
            className="inline-link"
            onClick={() =>
              window.dispatchEvent(new Event("arena-saved-evaluations"))
            }
          >
            Saved evaluations
          </button>
          . Add a case in <a href="#evaluate">New evaluation</a>.
        </p>
        <p className="study-note">
          References and candidate information requirements are{" "}
          <strong>awaiting confirmation</strong>. Historical runs retain their
          original tasks and scoring rules.
        </p>
        {fullReview && (
          <div className="full-review-update">
            <strong>Full rubric · 4 Nov 2026</strong>
            <p>All 22 items checked for {fullReview.complete_answers} saved answers: {fullReview.item_statuses.scored.toLocaleString("en-GB")} numerical ratings. Every unscored item has a reason. Select a case below.</p>
            <button className="text-button" onClick={() => setDocument({ label: "Full-rubric review: findings and limits", url: "/full-rubric-review/SUMMARY.md" })}>Read findings</button>
            <a className="text-button" href="/full-rubric-review/ALL_ITEM_RESULTS.csv" download>Download all item results</a>
          </div>
        )}
        <p>
          <a href="/result-comparison/">Rubric &amp; zero-shot comparison — 78 cases</a>
          <span className="field-help"> · Workspace sign-in required</span>
        </p>
        <div className="case-groups" aria-label="Filter case sources">
          <button
            className={group === "workspace" ? "active" : ""}
            aria-pressed={group === "workspace"}
            onClick={() => filter("workspace")}
          >
            Workspace cases
          </button>
          <button
            className={group === "all" ? "active" : ""}
            aria-pressed={group === "all"}
            onClick={() => filter("all")}
          >
            All {data.base_case_count}
          </button>
          {data.groups.map((g) => (
            <button
              key={g.id}
              className={group === g.id ? "active" : ""}
              aria-pressed={group === g.id}
              onClick={() => filter(g.id)}
            >
              {g.label} {g.count}
            </button>
          ))}
          <button
            onClick={() =>
              setDocument({ label: "Case index", url: "/cases/ALL_CASES.md" })
            }
          >
            <BookOpen size={15} /> Read case index
          </button>
        </div>
      </div>
      {group === "workspace" ? (
        <SubmittedCases access={access} />
      ) : (
        <div className="case-browser">
          <section className="case-picker" aria-label="Find a case">
            <label className="search">
              <Search size={16} />
              <input
                aria-label="Search case library"
                placeholder="Search cases or symptoms"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <p className="case-count">
              {rows.length} {rows.length === 1 ? "case" : "cases"}
            </p>
            <nav className="case-list" aria-label="Case list">
              {rows.map((c) => (
                <button
                  key={c.id}
                  aria-current={c.id === id ? "true" : undefined}
                  className={c.id === id ? "active" : ""}
                  onClick={() => choose(c.id)}
                >
                  <span className="case-code">{c.id}</span>
                  <span>
                    <strong>{c.title}</strong>
                    <small>{c.audience}</small>
                  </span>
                  <ArrowRight size={15} />
                </button>
              ))}
              {!rows.length && <p>No cases match this search.</p>}
            </nav>
          </section>
          <section
            ref={overview}
            className="panel case-overview"
            aria-label="Selected case"
          >
            {error && (
              <p className="notice" role="alert">
                {error}
              </p>
            )}
            {!record ? (
              <div className="case-empty">
                <BookOpen size={30} />
                <h2>Choose a case</h2>
                <p>
                  Compare per-item scores across models, including saved Qwen
                  results. Open any score to read the full answer and
                  evaluation. Historical material can also be read here.
                </p>
              </div>
            ) : (
              <>
                <p className="eyebrow">
                  {data.groups.find((g) => g.id === record.group)?.label} ·{" "}
                  {record.id}
                </p>
                <h2>{record.title}</h2>
                <p className="case-metadata">
                  <strong>Audience:</strong> {record.audience}
                  <br />
                  <strong>Task:</strong> {record.task_type}
                </p>
                <h3>Case</h3>
                <p>{record.summary}</p>
                <CaseModelResults
                  key={record.id}
                  caseId={record.id}
                  caseInfo={record}
                />
                <details className="study-disclosure">
                  <summary>Case source and selection</summary>
                  <h3>Why it was selected</h3>
                  <p>{record.purpose}</p>
                  <a
                    className="case-source"
                    href={record.source}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <BookOpen size={15} /> {record.source_label}
                  </a>
                  <details className="study-disclosure">
                    <summary>Source location and adaptation</summary>
                    <p>{record.source_location}</p>
                    <p>{record.source_note}</p>
                  </details>
                </details>
                <details className="study-disclosure">
                  <summary>Start a new evaluation with this case</summary>
                  <div className="case-template-actions">
                    {record.templates.map((t) => (
                      <button
                        key={t.id}
                        className="primary"
                        disabled={!canLoad}
                        onClick={() => onUseCase(t.id)}
                      >
                        {t.label}
                        <ArrowRight size={15} />
                      </button>
                    ))}
                  </div>
                  <p className="study-note">
                    Loads the case and task for a new answer. The saved output
                    stays unchanged. {record.notes}
                  </p>
                </details>
                <h3>Read saved materials and historical results</h3>
                {false &&
                  [
                    "C01",
                    "C02",
                    "C03",
                    "C04",
                    "C05",
                    "N02",
                    "N04",
                    "N05",
                  ].includes(record.id) && (
                    <p>
                      <a
                        className="case-source"
                        href={`#study/${record.id}/kcl-lite`}
                      >
                        <ArrowRight size={15} /> Earlier three-model interviews
                        and revised scores
                      </a>
                    </p>
                  )}
                <ul className="case-evidence-links">
                  {record.evidence.map((e) => (
                    <li key={e.url}>
                      {e.download ? (
                        <button
                          className="text-button"
                          onClick={() => setDocument(e)}
                        >
                          <BookOpen size={15} /> Read{" "}
                          {e.label.charAt(0).toLowerCase() + e.label.slice(1)}
                        </button>
                      ) : (
                        <a href={e.url}>
                          <ArrowRight size={15} /> {e.label}
                        </a>
                      )}
                      {e.detail && <small>{e.detail}</small>}
                    </li>
                  ))}
                </ul>
                <details className="study-disclosure">
                  <summary>Rubric items used in the saved study</summary>
                  <ul>
                    {record.criteria.map((c) => (
                      <li key={c.id}>
                        {c.name} ({c.id})
                      </li>
                    ))}
                  </ul>
                </details>
                {saved &&
                  saved.id === record.id &&
                  saved.conditions.length > 0 && (
                    <details className="study-disclosure case-original-evidence">
                      <summary>
                        Read the original written input, answer and item results
                      </summary>
                      {saved.conditions.map((c) => (
                        <section key={c.label}>
                          <h3>{c.label}</h3>
                          <p className="study-note">{c.rules}</p>
                          <h4>Case facts supplied</h4>
                          <div className="case-prewrap">{c.facts}</div>
                          <h4>Task supplied</h4>
                          <div className="case-prewrap">{c.task}</div>
                          {c.history && (
                            <details>
                              <summary>Conversation supplied</summary>
                              <div className="case-prewrap">{c.history}</div>
                            </details>
                          )}
                          <h4>Saved answer — unchanged</h4>
                          <div className="case-prewrap">{c.answer}</div>
                          <h4>Saved item scores and explanations</h4>
                          {c.scores.map((s) => (
                            <details className="case-item-result" key={s.item}>
                              <summary>
                                <strong>{s.score}</strong> {s.name} ({s.item})
                              </summary>
                              <p>{s.reason}</p>
                              <details>
                                <summary>Anchors used</summary>
                                {Object.entries(s.anchors).map(([n, v]) => (
                                  <p key={n}>
                                    <b>{n}:</b> {v}
                                  </p>
                                ))}
                              </details>
                            </details>
                          ))}
                          <details>
                            <summary>Provisional scoring reference</summary>
                            <div className="case-prewrap">{c.reference}</div>
                          </details>
                        </section>
                      ))}
                    </details>
                  )}
              </>
            )}
          </section>
        </div>
      )}
      {document && (
        <SavedDocument
          key={document.url}
          document={document}
          onClose={() => setDocument(null)}
        />
      )}
    </main>
  );
}
