import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowDownToLine,
  BookOpen,
  ChevronDown,
  MessageSquare,
} from "lucide-react";

const itemNames = { D5c: "Information seeking", D3a: "Problem representation" };
const statusLabels = {
  returned: "Returned",
  known_at_start: "Given at start",
  not_returned_no_targeted_request_identified: "Not requested",
  explicitly_unavailable_in_snapshot: "Unavailable in source",
  additional_report_not_requested: "Additional report not requested",
  final_question_only: "Asked only at the end",
  symptom_request_not_examination_record:
    "Symptoms asked; record not requested",
  different_admission_requested: "Different admission requested",
  different_modality_requested: "Different scan requested",
  broad_request_not_fulfilled: "Broad request not fulfilled",
  available_record_blocked_by_context_matching:
    "Asked; simulator did not return it",
  different_test_requested: "Different test requested",
  different_named_test_with_broad_alternative_request:
    "Alternative request needs review",
};
const available = (f) => ["returned", "known_at_start"].includes(f.status);
const fileUrl = (name) => `/api/study/files/${name}`;
async function get(path) {
  const response = await fetch(path);
  const value = await response.json();
  if (!response.ok)
    throw new Error(value.error || "Could not load the saved study.");
  return value;
}
function readSelection() {
  const match = window.location.hash.match(/^#study\/([A-Z0-9_]+)\/([a-z-]+)$/);
  return match ? { caseId: match[1], model: match[2] } : null;
}
function text(value) {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}
function SavedAnswer({ value }) {
  return (
    <div className="saved-answer">
      {value.split(/\n\s*\n/).map((block, index) => {
        if (/^#{1,6}\s/.test(block) && !block.includes("\n"))
          return <h4 key={index}>{block.replace(/^#{1,6}\s+/, "")}</h4>;
        if (/^\*\*[^*\n]+\*\*$/.test(block))
          return <h4 key={index}>{block.slice(2, -2)}</h4>;
        return (
          <p key={index}>
            {block
              .split(/(\*\*[^*]+\*\*)/g)
              .map((part, n) =>
                part.startsWith("**") && part.endsWith("**") ? (
                  <strong key={n}>{part.slice(2, -2)}</strong>
                ) : (
                  part
                ),
              )}
          </p>
        );
      })}
    </div>
  );
}
function Download({ name, children, className = "secondary" }) {
  return (
    <a className={className} href={fileUrl(name)} download>
      <ArrowDownToLine size={14} />
      {children}
    </a>
  );
}
function Rule({ item, data, version }) {
  const rules =
    version === "revised"
      ? data.revised_rules[item]
      : data.original_rules[item];
  return (
    <details className="study-disclosure">
      <summary>
        <BookOpen size={15} />
        {item} · {itemNames[item]}
        <ChevronDown size={15} />
      </summary>
      {rules.definition && <p>{rules.definition}</p>}
      <dl className="study-anchors">
        {Object.entries(rules.anchors).map(([score, words]) => (
          <div key={score}>
            <dt>{score}</dt>
            <dd>{words}</dd>
          </div>
        ))}
      </dl>
      {version === "original" && rules.missing_anchors?.length > 0 && (
        <p>
          Original grades {rules.missing_anchors.join(" and ")} have no supplied
          descriptor.
        </p>
      )}
      {Object.entries(rules)
        .filter(
          ([key]) =>
            ![
              "name",
              "definition",
              "anchors",
              "page",
              "table",
              "id",
              "missing_anchors",
            ].includes(key),
        )
        .map(([key, value]) => (
          <div className="rule-detail" key={key}>
            <strong>{key.replaceAll("_", " ")}</strong>
            {Array.isArray(value) ? (
              <ul>
                {value.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : (
              <p>{value}</p>
            )}
          </div>
        ))}
    </details>
  );
}

export function Study({ onUseInterview }) {
  const [data, setData] = useState(null);
  const [selection, setSelection] = useState(readSelection);
  const [record, setRecord] = useState(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState("revised");
  const [tab, setTab] = useState("evidence");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [hideScores, setHideScores] = useState(false);
  const [focusTurn, setFocusTurn] = useState(null);

  useEffect(() => {
    let current = true;
    get("/api/study")
      .then((value) => current && setData(value))
      .catch((e) => current && setError(e.message));
    const update = () => setSelection(readSelection());
    window.addEventListener("hashchange", update);
    return () => {
      current = false;
      window.removeEventListener("hashchange", update);
    };
  }, []);
  useEffect(() => {
    if (!selection) {
      setRecord(null);
      return;
    }
    let current = true;
    setRecord(null);
    setError("");
    setFocusTurn(null);
    get(`/api/study/interviews/${selection.caseId}/${selection.model}`)
      .then((value) => current && setRecord(value))
      .catch((e) => current && setError(e.message));
    return () => {
      current = false;
    };
  }, [selection?.caseId, selection?.model]);
  useEffect(() => {
    if (tab === "interview" && focusTurn)
      document
        .getElementById(`interview-turn-${focusTurn}`)
        ?.scrollIntoView({ behavior: "auto", block: "center" });
  }, [tab, focusTurn]);

  function open(caseId, model) {
    if (!selection) setTab("evidence");
    window.location.hash = `study/${caseId}/${model.replace(":", "-")}`;
    window.scrollTo({ top: 0 });
  }
  function showTurn(n) {
    setFocusTurn(n);
    setTab("interview");
  }
  if (error)
    return (
      <main className="study">
        <p role="alert" className="error-banner">
          {error}
        </p>
        <button
          className="secondary"
          onClick={() => {
            window.location.hash = "study";
            setError("");
          }}
        >
          Back to comparison
        </button>
      </main>
    );
  if (!data)
    return (
      <main className="study">
        <p role="status">Loading saved interviews…</p>
      </main>
    );
  const selectedCase = data.cases.find((c) => c.id === selection?.caseId);
  const currentRules = selection
    ? "Original + proposed revision"
    : version === "revised"
      ? "Josh’s proposed revision · 24 Oct 2026"
      : "Original rubric";
  return (
    <main className="study">
      {selection && (
        <button
          className="back-link"
          onClick={() => {
            window.location.hash = "study";
          }}
        >
          <ArrowLeft size={15} />
          All eight cases
        </button>
      )}
      <div className="page-heading study-heading">
        <span className="eyebrow">SAVED INTERVIEWS · 23–24 OCTOBER 2026</span>
        <h1>
          {selectedCase
            ? `${selectedCase.id.replace("_INITIAL", "")} — ${selectedCase.name}`
            : "Eight cases. Three models."}
        </h1>
        <p>
          {selectedCase
            ? `${selectedCase.audience} · Interactive history and record review`
            : "Compare what each model asked, what it received and how its answer was scored."}
        </p>
      </div>
      <div className="study-meta">
        <span>24 saved interviews</span>
        <span>Up to 6 questions</span>
        <span>Judge: {data.judge}</span>
        <span className="version-tag">
          <BookOpen size={13} />
          {currentRules}
        </span>
      </div>
      <p className="study-note">
        Candidate essentials for the revision await Josh’s review. Interviews
        and answers are unchanged; these are saved results.
      </p>

      {!selection ? (
        <>
          <div className="study-toolbar">
            <div className="segmented" aria-label="Scoring rule version">
              <button
                aria-pressed={version === "revised"}
                className={version === "revised" ? "selected" : ""}
                onClick={() => setVersion("revised")}
              >
                Proposed revision
              </button>
              <button
                aria-pressed={version === "original"}
                className={version === "original" ? "selected" : ""}
                onClick={() => setVersion("original")}
              >
                Original rubric
              </button>
            </div>
            <div className="result-actions">
              <Download name="scores.csv">Scores CSV</Download>
              <Download name="all-output.txt">Full plain text</Download>
            </div>
          </div>
          <p className="comparison-legend">
            <b>D5c</b> Information seeking <span>·</span> <b>D3a</b> Problem
            representation
          </p>
          <div
            className="comparison-wrap"
            tabIndex={0}
            role="region"
            aria-label="Cross-model scores; scroll horizontally on small screens"
          >
            <table className="comparison-table">
              <caption className="sr-only">
                Saved scores for all eight cases, by answering model. D5c is
                information seeking; D3a is problem representation.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Case & audience</th>
                  {data.models.map((model) => (
                    <th scope="col" key={model}>
                      {model}
                      <span>D5c · D3a</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.cases.map((c) => (
                  <tr key={c.id}>
                    <th scope="row">
                      <b>{c.id.replace("_INITIAL", "")}</b>
                      <span>{c.name}</span>
                      <small>{c.audience}</small>
                    </th>
                    {data.models.map((model) => {
                      const interview = data.interviews.find(
                        (r) => r.case_id === c.id && r.model === model,
                      );
                      const key =
                        version === "revised" ? "new_score" : "old_score";
                      return (
                        <td key={model}>
                          <button
                            className="compare-cell"
                            aria-label={`Open ${c.id.replace("_INITIAL", "")} ${model} interview. D5c ${interview.scores.D5c[key]}, D3a ${interview.scores.D3a[key]}. ${interview.request_observation}.`}
                            onClick={() => open(c.id, model)}
                          >
                            <span className="compare-observation">
                              {interview.request_observation}
                            </span>
                            <span className="compare-grades">
                              {["D5c", "D3a"].map((item) => (
                                <span key={item}>
                                  <small>{item}</small>
                                  <strong>
                                    {interview.scores[item][key] ?? "—"}
                                  </strong>
                                </span>
                              ))}
                            </span>
                            <span className="compare-open">
                              {interview.question_count} questions
                              <ArrowRight size={14} />
                            </span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="comparison-hint">
            Scroll sideways to see all three models.
          </p>
          <p className="study-note">{data.comparison_note}</p>
          <section
            className="study-highlights"
            aria-label="Examples worth checking"
          >
            <h2>Three differences to inspect</h2>
            <div>
              <button onClick={() => open("N02", "arc:lite")}>
                <b>N02 · A missed request</b>
                <p>
                  Lite and chat did not request glucose; apex did at question 6.
                  Revised D5c: 2 / 2 / 5. D3a: 5 / 5 / 5.
                </p>
                <span>
                  Compare requests and uncertainty
                  <ArrowRight size={14} />
                </span>
              </button>
              <button onClick={() => open("C05", "arc:chat")}>
                <b>C05 · A claim without a reply</b>
                <p>
                  Chat asked about provocation but received no details, then
                  wrote “unprovoked”. Revised D5c: 5; D3a: 4.
                </p>
                <span>
                  Read the answer and its evidence
                  <ArrowRight size={14} />
                </span>
              </button>
              <button onClick={() => open("N04_INITIAL", "arc:apex")}>
                <b>N04 · A simulator mismatch</b>
                <p>
                  Apex asked about infection results; the simulator did not
                  return them. That request was credited in regrading.
                </p>
                <span>
                  Separate requests from returned records
                  <ArrowRight size={14} />
                </span>
              </button>
            </div>
          </section>
          <details className="study-disclosure">
            <summary>
              <BookOpen size={15} />
              Scoring rules and evidence windows
              <ChevronDown size={15} />
            </summary>
            <p>{data.conditions}</p>
            {["D5c", "D3a"].map((item) => (
              <div key={item}>
                <p>
                  <b>{item} sees:</b> {data.evidence_windows[item]}
                </p>
                <Rule item={item} data={data} version={version} />
              </div>
            ))}
          </details>
        </>
      ) : !record ? (
        <p role="status">Loading interview…</p>
      ) : (
        <>
          <div className="study-toolbar detail-toolbar">
            <label>
              Case
              <select
                aria-label="Study case"
                value={record.case_id}
                onChange={(e) => open(e.target.value, record.model)}
              >
                {data.cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id.replace("_INITIAL", "")} — {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Answering model
              <select
                aria-label="Study answering model"
                value={record.model}
                onChange={(e) => open(record.case_id, e.target.value)}
              >
                {data.models.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
            <Download name={`case-${record.case_id}.txt`}>
              Full case output
            </Download>
            <button
              className="primary"
              onClick={() =>
                onUseInterview(`${record.case_id}/${record.model_slug}`)
              }
            >
              Use in new evaluation
            </button>
          </div>
          <section className="study-opening">
            <span className="mini-label">
              PATIENT OPENING · GIVEN TO THE MODEL
            </span>
            <p>{record.opening}</p>
            <details>
              <summary>
                Full initial context and task
                <ChevronDown size={14} />
              </summary>
              <h3>Initial context</h3>
              <pre>{record.common_information}</pre>
              <h3>Task</h3>
              <pre>{record.final_task}</pre>
            </details>
          </section>
          <nav className="study-tabs" aria-label="Interview sections">
            {[
              ["evidence", "Evidence check"],
              ["interview", "Full interview"],
              ["answer", "Answer & scores"],
              ["rules", "Requirements & rules"],
            ].map(([id, name]) => (
              <button
                key={id}
                className={tab === id ? "active" : ""}
                aria-current={tab === id ? "page" : undefined}
                onClick={() => setTab(id)}
              >
                {name}
              </button>
            ))}
          </nav>

          {tab === "evidence" && (
            <section className="study-section">
              <div className="study-section-heading">
                <div>
                  <h2>What reached the model?</h2>
                  <p>
                    Reviewer’s case inventory, including hidden records. Status
                    shows what actually reached this model; unobtained facts are
                    not automatically clinical errors.
                  </p>
                </div>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={onlyMissing}
                    onChange={(e) => setOnlyMissing(e.target.checked)}
                  />
                  Only not obtained
                </label>
              </div>
              <div className="evidence-table-wrap">
                <table className="evidence-table">
                  <thead>
                    <tr>
                      <th scope="col">Case information</th>
                      <th scope="col">Request / availability check</th>
                      <th scope="col">Turn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.fact_checks
                      .filter((f) => !onlyMissing || !available(f))
                      .map((f) => (
                        <tr key={f.fact_id}>
                          <td>
                            {f.fact}
                            <small>
                              {f.channel}
                              {f.record_period !== "any"
                                ? ` · ${f.record_period}`
                                : ""}
                            </small>
                          </td>
                          <td>
                            <span
                              className={`evidence-status ${available(f) ? "received" : ""}`}
                            >
                              {statusLabels[f.status] || f.status}
                            </span>
                            <details>
                              <summary>
                                Check detail
                                <ChevronDown size={12} />
                              </summary>
                              <p>{f.observation}</p>
                              {f.partially_in_opening && (
                                <p>{f.partially_in_opening}</p>
                              )}
                            </details>
                          </td>
                          <td>
                            {f.question_numbers
                              ? f.question_numbers
                                  .split(/[;,]/)
                                  .filter(Boolean)
                                  .map((n) => (
                                    <button
                                      className="turn-link"
                                      key={n}
                                      onClick={() => showTurn(Number(n))}
                                    >
                                      Q{n}
                                    </button>
                                  ))
                              : "—"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="study-review-question">
                <b>For clinical review</b>
                <p>{selectedCase.review_question}</p>
                <button className="text-button" onClick={() => setTab("rules")}>
                  See candidate requirements and deadlines
                  <ArrowRight size={14} />
                </button>
              </div>
              {record.case_id === "N04_INITIAL" &&
                record.model === "arc:apex" && (
                  <details className="study-disclosure">
                    <summary>
                      Saved N04 simulator check
                      <ChevronDown size={15} />
                    </summary>
                    <pre>{text(data.n04_offline_check)}</pre>
                    <p>
                      The offline replay was not added to the model’s original
                      evidence.
                    </p>
                  </details>
                )}
            </section>
          )}

          {tab === "interview" && (
            <section className="study-section">
              <div className="study-section-heading">
                <div>
                  <h2>{record.turns.length} saved questions and replies</h2>
                  <p>
                    Unchanged wording. Records and patient replies are shown
                    separately.
                  </p>
                </div>
                <a className="secondary" href={record.source_download} download>
                  <ArrowDownToLine size={14} />
                  Source JSON
                </a>
              </div>
              <div className="interview-turns">
                {record.turns.map((turn) => (
                  <article
                    id={`interview-turn-${turn.number}`}
                    key={turn.number}
                    className={`interview-turn ${focusTurn === turn.number ? "focused" : ""}`}
                  >
                    <div className="turn-heading">
                      <span>QUESTION {turn.number}</span>
                      <small>
                        {turn.requested_period !== "any"
                          ? turn.requested_period
                          : ""}
                      </small>
                    </div>
                    <h3>
                      <MessageSquare size={15} />
                      {record.model} asked
                    </h3>
                    <p className="saved-text">{turn.question}</p>
                    <div className="turn-reply">
                      <h3>Patient reply</h3>
                      <p className="saved-text">
                        {turn.patient_reply || "No patient reply recorded."}
                      </p>
                      {turn.fixed_records.map((r) => (
                        <div className="returned-record" key={r.id}>
                          <span>
                            RETURNED {r.channel.toUpperCase()}
                            {r.context ? ` · ${r.context}` : ""}
                          </span>
                          <p className="saved-text">{r.text}</p>
                        </div>
                      ))}
                      {turn.feedback && (
                        <p className="simulator-feedback">
                          <b>Simulator feedback:</b> {turn.feedback}
                        </p>
                      )}
                      {!turn.released_fact_ids.length && (
                        <p className="simulator-feedback">
                          No new case facts returned in this turn.
                        </p>
                      )}
                    </div>
                    <details className="assessment-note">
                      <summary>
                        Saved assessment note before the reply
                        <ChevronDown size={13} />
                      </summary>
                      <pre>{text(turn.doctor_output.assessment || {})}</pre>
                    </details>
                  </article>
                ))}
              </div>
              <details className="study-disclosure">
                <summary>
                  Closing assessment note
                  <ChevronDown size={14} />
                </summary>
                <pre>{text(record.closing_assessment)}</pre>
              </details>
              <button
                className="primary"
                onClick={() => {
                  setTab("answer");
                  window.scrollTo({ top: 0 });
                }}
              >
                Read final answer and scores
                <ArrowRight size={15} />
              </button>
            </section>
          )}

          {tab === "answer" && (
            <section className="study-section">
              <div className="study-section-heading">
                <div>
                  <h2>Same answer, two scoring conditions</h2>
                  <p>
                    New grades use Josh’s proposed anchors and the frozen
                    candidate requirements.
                  </p>
                </div>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={hideScores}
                    onChange={(e) => setHideScores(e.target.checked)}
                  />
                  Hide scores & reasons
                </label>
              </div>
              <div className="study-answer-grid">
                <article className="study-answer">
                  <h3>Final answer · {record.model}</h3>
                  <SavedAnswer value={record.final_answer} />
                  <details className="assessment-note">
                    <summary>
                      Final-question timing note
                      <ChevronDown size={13} />
                    </summary>
                    <p>{record.final_question_note}</p>
                  </details>
                </article>
                <div className="study-scores">
                  {["D5c", "D3a"].map((item) => (
                    <article className="study-score-card" key={item}>
                      <h3>
                        <span>{item}</span>
                        {itemNames[item]}
                      </h3>
                      {!hideScores ? (
                        <>
                          <div className="old-new-grades">
                            <div>
                              <small>Original</small>
                              <b>
                                {record.scores[item].old_score}
                                <span>/5</span>
                              </b>
                              {record.scores[item].old_unanchored && (
                                <small>Unanchored intermediate grade</small>
                              )}
                            </div>
                            <ArrowRight size={16} />
                            <div>
                              <small>Proposed revision</small>
                              <b>
                                {record.scores[item].new_score}
                                <span>/5</span>
                              </b>
                            </div>
                          </div>
                          <details className="judge-explanation">
                            <summary>
                              Revised judge explanation
                              <ChevronDown size={13} />
                            </summary>
                            <p className="saved-text">
                              {record.scores[item].new_reason}
                            </p>
                          </details>
                          <details className="judge-explanation">
                            <summary>
                              Original judge explanation
                              <ChevronDown size={13} />
                            </summary>
                            <p className="saved-text">
                              {record.scores[item].old_reason}
                            </p>
                          </details>
                        </>
                      ) : (
                        <p className="study-note">
                          Machine grades and explanations hidden. Previously
                          viewed results remain previously viewed.
                        </p>
                      )}
                      <details className="assessment-note">
                        <summary>
                          Evidence used for {item}
                          <ChevronDown size={13} />
                        </summary>
                        <p>{data.evidence_windows[item]}</p>
                      </details>
                    </article>
                  ))}
                </div>
              </div>
              <p className="study-note">{data.comparison_note}</p>
              <div className="study-review-question">
                <b>For clinical review</b>
                <p>{selectedCase.review_question}</p>
              </div>
            </section>
          )}

          {tab === "rules" && (
            <section className="study-section">
              <h2>
                Candidate requirements ·{" "}
                {record.case_id.replace("_INITIAL", "")}
              </h2>
              <p className="study-note">
                These requirements were fixed before exploratory regrading.
                Their clinical necessity and acceptable alternatives await
                Josh’s review.
              </p>
              <div className="requirement-list">
                {selectedCase.requirements.map((r) => (
                  <article key={r.id}>
                    <div>
                      <span className="version-tag">
                        {r.level === "essential"
                          ? "Candidate essential"
                          : "Helpful"}
                      </span>
                      <small>{r.deadline}</small>
                    </div>
                    <h3>{r.requirement}</h3>
                    <p>
                      <b>Why proposed:</b> {r.presentation_based_rationale}
                    </p>
                    <p>
                      <b>Acceptable requests / alternatives:</b>{" "}
                      {r.acceptable_requests_or_alternatives}
                    </p>
                  </article>
                ))}
              </div>
              <h2 className="study-subheading">
                Josh’s proposed rules · used for the new grades
              </h2>
              {["D5c", "D3a"].map((item) => (
                <Rule key={item} item={item} data={data} version="revised" />
              ))}
              <h2 className="study-subheading">
                Original rules · retained for comparison
              </h2>
              {["D5c", "D3a"].map((item) => (
                <Rule key={item} item={item} data={data} version="original" />
              ))}
              <details className="study-disclosure">
                <summary>
                  Saved conditional checks for this interview
                  <ChevronDown size={14} />
                </summary>
                <p>
                  Controls and alternatives below are separate calls, not
                  changes to the saved interview. C05’s clarified deadline
                  comparison is listed separately from the original timing
                  attempt.
                </p>
                <pre>
                  {text({
                    conditional: data.conditional_results.filter(
                      (r) =>
                        r.case === record.case_id && r.model === record.model,
                    ),
                    clarified_timing: data.clarified_timing.filter(
                      (r) =>
                        r.case === record.case_id && r.model === record.model,
                    ),
                  })}
                </pre>
              </details>
              <details className="study-disclosure">
                <summary>
                  Draft full-case reference · reviewer only
                  <ChevronDown size={14} />
                </summary>
                <pre>{text(record.draft_reference)}</pre>
                <p>
                  This full-case reference was not supplied to the revised D3a
                  judge.
                </p>
              </details>
            </section>
          )}
        </>
      )}
      <footer className="study-footer">
        <span>
          MELD is a separate source-text similarity check and is not included in
          these rubric scores.
        </span>
        <Download name="all-output.txt" className="text-button">
          All saved visible outputs
        </Download>
      </footer>
    </main>
  );
}
