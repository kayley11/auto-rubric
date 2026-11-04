import { useEffect, useRef, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { RuleView, TurnView, exposure, request } from "./StudyTools";
import { backendName } from "./modelIdentity.mjs";
import { CaseContext } from "./CaseContext";
import { scoringVersionLabel } from "./caseIdentity.mjs";

const itemName = (id) =>
  ({ D3a: "Problem representation", D5c: "Information seeking" })[id] || id;

const selectedId = () =>
  window.location.hash.startsWith("#review/")
    ? window.location.hash.split("/")[1]
    : "";

export function Review({ access }) {
  const [catalogue, setCatalogue] = useState([]),
    [id, setId] = useState(selectedId);
  const [loadingQueue, setLoadingQueue] = useState(true),
    [search, setSearch] = useState("");
  const [chosen, setChosen] = useState([]),
    [reviewQueue, setReviewQueue] = useState([]);
  const [completedAnswers, setCompletedAnswers] = useState([]),
    [notice, setNotice] = useState("");
  const progressRef = useRef(null);
  const [packet, setPacket] = useState(null),
    [reviewer, setReviewer] = useState("");
  const [score, setScore] = useState(""),
    [note, setNote] = useState("");
  const [seen, setSeen] = useState({}),
    [revealed, setRevealed] = useState(null);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [complete, setComplete] = useState(false);
  async function reloadQueue() {
    setLoadingQueue(true);
    setError("");
    try {
      if (access?.online === false)
        throw Error(
          "Review forms need the host computer online. Published cases and saved scores remain available in Case review.",
        );
      const rows = await request("/api/review");
      if (!Array.isArray(rows))
        throw new Error("The review queue could not be read.");
      setCatalogue(rows);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingQueue(false);
    }
  }
  useEffect(() => {
    reloadQueue();
    const update = () => setId(selectedId());
    const refresh = () => {
      if (!selectedId()) reloadQueue();
    };
    const timer = setInterval(refresh, 30000);
    window.addEventListener("hashchange", update);
    window.addEventListener("focus", refresh);
    window.addEventListener("arena-evaluations-saved", refresh);
    const storageRefresh = (e) => {
      if (e.key === "autorubric-evaluations-updated") refresh();
    };
    window.addEventListener("storage", storageRefresh);
    return () => {
      window.removeEventListener("hashchange", update);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("arena-evaluations-saved", refresh);
      window.removeEventListener("storage", storageRefresh);
      clearInterval(timer);
    };
  }, []);
  async function load(identifier, criterion) {
    const value = await request(
      `/api/review/${identifier}${criterion ? "/" + criterion : ""}`,
    );
    setPacket(value);
    setReviewer((previous) => value.review?.reviewer || previous);
    const previous = value.review?.items?.[value.criterion];
    setScore(previous?.score || "");
    setNote(previous?.note || "");
    const prior = exposure(identifier);
    const sourcePrior = value.run_id ? exposure(`run/${value.run_id}`) : {};
    setSeen({
      machine: !!(
        prior.machine ||
        sourcePrior.machine ||
        value.review?.machine_scores_seen ||
        value.review?.revealed
      ),
      identity: !!(
        prior.identity ||
        sourcePrior.identity ||
        value.review?.model_identity_seen
      ),
    });
    const done = value.available_items.every(
      (cid) => value.review?.items?.[cid],
    );
    setComplete(done);
    if (done) setCompletedAnswers((ids) => [...new Set([...ids, identifier])]);
    return value;
  }
  useEffect(() => {
    setPacket(null);
    setError("");
    setRevealed(null);
    setComplete(false);
    if (id) load(id).catch((e) => setError(e.message));
  }, [id]);
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const latest = exposure(id);
      const sourceLatest = packet.run_id
        ? exposure(`run/${packet.run_id}`)
        : {};
      const rating = await request(`/api/review/${id}/rating`, {
        reviewer,
        items: { [packet.criterion]: { score, note } },
        machine_scores_seen: !!(
          seen.machine ||
          latest.machine ||
          sourceLatest.machine
        ),
        model_identity_seen: !!(
          seen.identity ||
          latest.identity ||
          sourceLatest.identity
        ),
      });
      const next = packet.available_items.find((cid) => !rating.items?.[cid]);
      if (next) {
        await load(id, next);
        setNotice(
          "Rating saved. Continue with the next selected rubric item for the same answer.",
        );
        progressRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } else {
        setPacket((p) => ({ ...p, review: rating }));
        setComplete(true);
        setCompletedAnswers((ids) => [...new Set([...ids, id])]);
        setNotice("Your ratings for this answer are saved.");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function reveal() {
    setBusy(true);
    setError("");
    try {
      const ids = reviewQueue.includes(id) ? reviewQueue : [id];
      const results = [];
      for (const identifier of ids) {
        results.push(await request(`/api/review/${identifier}/reveal`, {}));
        exposure(identifier, "machine");
        exposure(identifier, "identity");
      }
      setRevealed(results);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const open = (key) => {
    setNotice("");
    window.location.hash = key ? `review/${key}` : "review";
    window.scrollTo(0, 0);
    if (!key) reloadQueue();
  };
  const matching = catalogue.filter((r) =>
    `${r.case_id} ${r.name} ${r.batch} ${r.summary || ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  const [limit, setLimit] = useState(40);
  const inQueue = reviewQueue.includes(id);
  const nextAnswer = reviewQueue.find(
    (key) => key !== id && !completedAnswers.includes(key),
  );
  const allRated =
    !inQueue || reviewQueue.every((key) => completedAnswers.includes(key));
  useEffect(() => {
    const updateExposure = () => {
      if (!packet) return;
      const a = exposure(id),
        b = packet.run_id ? exposure(`run/${packet.run_id}`) : {};
      setSeen((v) => ({
        machine: !!(v.machine || a.machine || b.machine),
        identity: !!(v.identity || a.identity || b.identity),
      }));
    };
    window.addEventListener("storage", updateExposure);
    window.addEventListener("focus", updateExposure);
    return () => {
      window.removeEventListener("storage", updateExposure);
      window.removeEventListener("focus", updateExposure);
    };
  }, [id, packet?.run_id]);
  return (
    <main className="study independent-review">
      {id && (
        <button className="back-link" onClick={() => open("")}>
          <ArrowLeft size={15} />
          Review queue
        </button>
      )}
      <div className="page-heading study-heading">
        <span className="eyebrow">REVIEW FIRST</span>
        <h1>{packet?.name || "Review model answers."}</h1>
        <p>
          Rate the selected rubric items for each saved answer. Then compare
          with AutoRubric for the same answer and scoring version. Scores and
          model identities stay hidden until your selected reviews are saved.
        </p>
      </div>
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      {!id ? (
        <>
          <section className="review-scope">
            <div>
              <b>
                {loadingQueue
                  ? "Loading review answers…"
                  : `${catalogue.length} saved answers available for independent review`}
              </b>
              <p>
                Published cases and workspace answers use their saved rubric and
                selected items. Choose an answer, rate its items, then reveal
                the matching AutoRubric results. Browse inputs in{" "}
                <a href="#cases">Case review</a>.
              </p>
              <button
                className="text-button"
                disabled={loadingQueue}
                onClick={reloadQueue}
              >
                <RefreshCw size={14} /> Refresh review queue
              </button>
            </div>
            <label className="field">
              Find a review
              <input
                type="search"
                aria-label="Search review answers"
                placeholder="Case ID or symptoms"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </section>
          <p className="study-note">
            Choose one or more answers, then review them in sequence. A/B/C
            identify different answers to a case; model names are revealed with
            the comparison. Choose answering models in New evaluation before
            generating new answers.
          </p>
          {chosen.length > 0 && (
            <div className="review-selection-bar">
              <b>{chosen.length} answers selected</b>
              <button
                className="primary"
                onClick={() => {
                  setReviewQueue(chosen);
                  setCompletedAnswers([]);
                  open(chosen[0]);
                }}
              >
                Review selected answers
              </button>
              <button className="text-button" onClick={() => setChosen([])}>
                Clear selection
              </button>
            </div>
          )}
          {loadingQueue && (
            <p className="notice" role="status">
              Loading the saved review queue…
            </p>
          )}
          {!loadingQueue && error && (
            <button className="secondary" onClick={reloadQueue}>
              Reload review queue
            </button>
          )}
          {!loadingQueue && !error && !catalogue.length && (
            <p className="notice">
              No eligible review answers are available in this workspace yet.
              Open a saved case or complete an evaluation containing D3a or D5c.
            </p>
          )}
          {!loadingQueue && catalogue.length > 0 && !matching.length && (
            <p className="notice">No reviews match this search.</p>
          )}
          {[...new Set(matching.map((r) => r.batch))].map((batch) => (
            <section className="review-queue" key={batch}>
              <h2>{batch}</h2>
              <div>
                {matching
                  .filter((r) => r.batch === batch)
                  .slice(0, limit)
                  .map((r) => (
                    <div className="review-queue-choice" key={r.id}>
                      <label className="review-select">
                        <input
                          type="checkbox"
                          aria-label={`Select ${r.case_id} ${r.response}`}
                          checked={chosen.includes(r.id)}
                          onChange={(e) =>
                            setChosen((ids) =>
                              e.target.checked
                                ? [...ids, r.id]
                                : ids.filter((key) => key !== r.id),
                            )
                          }
                        />{" "}
                        Select
                      </label>
                      <button
                        className="review-queue-item"
                        onClick={() => {
                          setReviewQueue([r.id]);
                          setCompletedAnswers([]);
                          open(r.id);
                        }}
                      >
                        <b>
                          {r.name.startsWith("Submitted case ")
                            ? r.case_id
                            : `${r.case_id.replace("_INITIAL", "")} · ${r.name}`}
                        </b>
                        {r.summary && <small>{r.summary}</small>}
                        <span>
                          {r.response} · {r.items.length} selected items
                        </span>
                      </button>
                    </div>
                  ))}
              </div>
            </section>
          ))}
          {matching.length > limit && (
            <button
              className="secondary"
              onClick={() => setLimit((n) => n + 40)}
            >
              Show more answers
            </button>
          )}
        </>
      ) : !packet ? (
        error ? (
          <button
            className="secondary"
            onClick={() => {
              setError("");
              load(id).catch((e) => setError(e.message));
            }}
          >
            Try again
          </button>
        ) : (
          <p role="status">Loading anonymous evidence…</p>
        )
      ) : (
        <CaseContext
          blind
          data={{
            case_id: packet.case_id,
            audience: packet.audience,
            history: packet.history,
            turns: packet.turns,
            decision_point: packet.decision_point,
            facts: packet.facts,
            task: packet.task,
            answer: packet.answer,
          }}
        >
          <div className="study-meta">
            <span>
              Scoring version:{" "}
              {scoringVersionLabel({
                id: packet.rules_version,
                label: packet.rules_version,
              })}
            </span>
            <span>{packet.batch}</span>
            <span>{packet.audience}</span>
            <span>
              {!packet.turns.length &&
              packet.decision_point ===
                "Final answer after the supplied interview"
                ? "Saved answer to the written case"
                : packet.decision_point}
            </span>
          </div>
          {packet.review?.revealed && (
            <p className="verified-note">
              AutoRubric scores were revealed after an earlier saved review.
              This record cannot be treated as a fresh unseen rating.
            </p>
          )}
          <div className="review-progress" ref={progressRef}>
            <b>
              {inQueue
                ? `Answer ${reviewQueue.indexOf(id) + 1} of ${reviewQueue.length} · `
                : ""}
              Step {packet.available_items.indexOf(packet.criterion) + 1} of{" "}
              {packet.available_items.length} ·{" "}
              {packet.rule?.name || itemName(packet.criterion)} (
              {packet.criterion})
            </b>
            <span>
              {packet.criterion === "D3a"
                ? "Synthesis: use only information received"
                : "Use the saved answer and this item’s scoring guide"}
            </span>
          </div>
          {notice && (
            <p className="notice" role="status">
              {notice}
            </p>
          )}
          <section className="study-opening">
            <h2>Case and task</h2>
            <pre>{packet.facts}</pre>
            <pre>{packet.task}</pre>
            {packet.history && (
              <details>
                <summary>Earlier conversation</summary>
                <pre>{packet.history}</pre>
              </details>
            )}
          </section>
          <section className="study-answer">
            <h2>Answer being assessed</h2>
            <pre>{packet.answer}</pre>
          </section>
          <RuleView cid={packet.criterion} rule={packet.rule} />
          {!!packet.turns.length && (
            <details className="study-disclosure">
              <summary>Evidence supplied during this task</summary>
              <TurnView
                turns={packet.turns}
                showNotes={packet.criterion === "D5c"}
              />
            </details>
          )}
          {packet.reference && (
            <details className="study-disclosure">
              <summary>Scoring reference · awaiting confirmation</summary>
              <pre>{packet.reference}</pre>
            </details>
          )}
          {packet.criterion === "D5c" && (
            <section className="study-section">
              <h2>Case information for reviewing questions · D5c</h2>
              <p>
                Candidate requirements remain subject to clinical confirmation.
                A request is distinct from its result or a note recommending it.
              </p>
              {packet.requirements.map((r) => (
                <article className="decision-card" key={r.id}>
                  <h3>
                    {r.id} · candidate {r.level}
                  </h3>
                  <p>{r.requirement}</p>
                  <p>
                    <b>Why proposed:</b> {r.presentation_based_rationale}
                  </p>
                  <p>
                    <b>Alternatives:</b> {r.acceptable_requests_or_alternatives}
                  </p>
                  <p>
                    <b>Deadline:</b> {r.deadline}
                  </p>
                </article>
              ))}
              <details className="study-disclosure">
                <summary>Reference facts and available records</summary>
                {packet.inventory.map((f) => (
                  <p key={f.id}>
                    <b>{f.context}</b>
                    <br />
                    {f.text}
                  </p>
                ))}
                <pre>{packet.availability}</pre>
              </details>
              {packet.closing_notes && (
                <details className="study-disclosure">
                  <summary>Eligible closing assessment note</summary>
                  <pre>{packet.closing_notes}</pre>
                </details>
              )}
              {packet.final_questions && (
                <details className="study-disclosure">
                  <summary>Final questions · no collected replies</summary>
                  <pre>{packet.final_questions}</pre>
                </details>
              )}
            </section>
          )}
          {!complete && !packet.review?.items?.[packet.criterion] && (
            <form className="blind-rating" onSubmit={save}>
              <h2>
                Your rating · {packet.rule?.name || itemName(packet.criterion)}
              </h2>
              <label className="field">
                Reviewer
                <input
                  required
                  placeholder="e.g. CLINICIAN_A or R03"
                  value={reviewer}
                  onChange={(e) => setReviewer(e.target.value)}
                />
              </label>
              <label className="field">
                Grade
                <select
                  required
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                >
                  <option value="">Choose a grade</option>
                  {["1", "2", "3", "4", "5", "N/A", "Indeterminate"].map(
                    (x) => (
                      <option key={x}>{x}</option>
                    ),
                  )}
                </select>
              </label>
              <label className="field">
                Reason
                <textarea
                  required
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Link the grade to the supplied evidence and anchor."
                />
              </label>
              <div className="exposure-status">
                <b>Viewing history · recorded automatically</b>
                <p>
                  {seen.machine
                    ? "AutoRubric results were previously shown for this answer."
                    : "No prior display of AutoRubric results is recorded in this browser."}
                </p>
                <p>
                  {seen.identity
                    ? "The answering model was previously shown."
                    : "No prior display of the answering model is recorded."}
                </p>
                <small>
                  Views outside this website or in another browser cannot be
                  detected.
                </small>
              </div>
              <button className="primary" disabled={busy}>
                {packet.available_items.some(
                  (cid) =>
                    cid !== packet.criterion && !packet.review?.items?.[cid],
                )
                  ? "Save and continue to next item"
                  : "Save this answer’s ratings"}
              </button>
            </form>
          )}
          {packet.review?.items?.[packet.criterion] && !complete && (
            <button
              className="secondary"
              onClick={() =>
                load(
                  id,
                  packet.available_items.find(
                    (cid) => !packet.review.items[cid],
                  ),
                ).catch((e) => setError(e.message))
              }
            >
              Continue to next unrated item
            </button>
          )}
          {complete && (
            <section className="blind-rating">
              <h2>Your ratings for this answer</h2>
              {Object.entries(packet.review.items).map(([cid, r]) => (
                <p key={cid}>
                  <b>
                    {packet.item_names?.[cid] || itemName(cid)} ({cid}):{" "}
                    {r.score}
                  </b>{" "}
                  · {r.note}
                </p>
              ))}
              {!revealed && nextAnswer && (
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => open(nextAnswer)}
                >
                  Review next selected answer
                </button>
              )}
              {!revealed && allRated && (
                <button className="primary" disabled={busy} onClick={reveal}>
                  {inQueue && reviewQueue.length > 1
                    ? "Compare all reviewed answers"
                    : "Compare with AutoRubric"}
                </button>
              )}
            </section>
          )}
          {revealed && (
            <section className="study-section reviewer-comparison">
              <h2>Your ratings and AutoRubric scores</h2>
              <p>
                Each comparison below uses the same case, answer and scoring
                version. AutoRubric score means the score assigned by the
                scoring model.
              </p>
              {revealed.map((result, index) => (
                <article
                  className="review-answer-comparison"
                  key={`${result.model}-${index}`}
                >
                  <h3>
                    {result.case_id || result.name} · Answering model:{" "}
                    {result.model}
                    {backendName(result.model) &&
                      ` · ${backendName(result.model)}`}
                  </h3>
                  <p className="field-help">
                    Scoring model:{" "}
                    {result.judge_model || "See saved scoring record"}
                    {backendName(result.judge_model) &&
                      ` · ${backendName(result.judge_model)}`}{" "}
                    · Version:{" "}
                    {scoringVersionLabel({
                      id: result.rules_version,
                      label: result.rules_version || "Saved version",
                    })}
                  </p>
                  {result.score_context && (
                    <p className="study-note">
                      {result.score_context.replaceAll(
                        "machine grades",
                        "AutoRubric scores",
                      )}
                    </p>
                  )}
                  <div className="batch-table-scroll">
                    <table className="review-comparison-table">
                      <thead>
                        <tr>
                          <th>Rubric item</th>
                          <th>Your rating</th>
                          <th>AutoRubric score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(result.scores).map(([cid, grades]) => (
                          <tr key={cid}>
                            <th>
                              {result.criteria?.[cid] || itemName(cid)} ({cid})
                            </th>
                            <td>
                              {result.rating.items[cid]?.score || "Not rated"}
                            </td>
                            <td>
                              {grades
                                .map(
                                  (g) => g.label ?? g.score ?? "Not assessed",
                                )
                                .join(", ")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <details className="review-comparison-reasons">
                    <summary>Ratings and scoring reasons</summary>
                    {Object.entries(result.scores).map(([cid, grades]) => (
                      <section key={cid}>
                        <h4>
                          {itemName(cid)} ({cid})
                        </h4>
                        <p>
                          <b>Your reason:</b> {result.rating.items[cid]?.note}
                        </p>
                        {grades.map((g, n) => (
                          <p key={n}>
                            <b>
                              AutoRubric
                              {grades.length > 1
                                ? ` · repeat ${g.repeat || n + 1}`
                                : ""}
                              :
                            </b>{" "}
                            {g.explanation ||
                              g.reason ||
                              g.error ||
                              "No explanation saved."}
                          </p>
                        ))}
                      </section>
                    ))}
                  </details>
                </article>
              ))}
            </section>
          )}
          <a className="secondary" href={`/api/evidence/${id}/blind`} download>
            Download blank review sheet
          </a>
        </CaseContext>
      )}
    </main>
  );
}
