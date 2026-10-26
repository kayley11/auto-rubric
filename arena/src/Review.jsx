import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { RuleView, TurnView, exposure, request } from "./StudyTools";

const selectedId = () =>
  window.location.hash.startsWith("#review/")
    ? window.location.hash.split("/")[1]
    : "";

export function Review() {
  const [catalogue, setCatalogue] = useState([]),
    [id, setId] = useState(selectedId);
  const [packet, setPacket] = useState(null),
    [reviewer, setReviewer] = useState("");
  const [score, setScore] = useState(""),
    [note, setNote] = useState("");
  const [seen, setSeen] = useState({}),
    [revealed, setRevealed] = useState(null);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [complete, setComplete] = useState(false);
  useEffect(() => {
    request("/api/review")
      .then(setCatalogue)
      .catch((e) => setError(e.message));
    const update = () => setId(selectedId());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  async function load(identifier, criterion) {
    const value = await request(
      `/api/review/${identifier}${criterion ? "/" + criterion : ""}`,
    );
    setPacket(value);
    setReviewer(value.review?.reviewer || "");
    const previous = value.review?.items?.[value.criterion];
    setScore(previous?.score || "");
    setNote(previous?.note || "");
    const prior = exposure(identifier);
    setSeen({
      machine: !!(
        prior.machine ||
        value.review?.machine_scores_seen ||
        value.review?.revealed
      ),
      identity: !!(prior.identity || value.review?.model_identity_seen),
    });
    setComplete(
      value.available_items.every((cid) => value.review?.items?.[cid]),
    );
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
      const rating = await request(`/api/review/${id}/rating`, {
        reviewer,
        items: { [packet.criterion]: { score, note } },
        machine_scores_seen: !!(seen.machine || latest.machine),
        model_identity_seen: !!(seen.identity || latest.identity),
      });
      if (packet.criterion === "D3a" && packet.available_items.includes("D5c"))
        await load(id, "D5c");
      else {
        setPacket((p) => ({ ...p, review: rating }));
        setComplete(true);
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
      setRevealed(await request(`/api/review/${id}/reveal`, {}));
      exposure(id, "machine");
      exposure(id, "identity");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const open = (key) => {
    window.location.hash = key ? `review/${key}` : "review";
    window.scrollTo(0, 0);
  };
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
        <h1>{packet?.name || "Rate before revealing results."}</h1>
        <p>
          Machine scores, judge explanations and model names are hidden until
          your ratings are saved. Prior exposure to scores or model identity is
          recorded.
        </p>
      </div>
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      {!id ? (
        <>
          <p className="study-note">
            Choose an answer. Labels A/B/C do not identify the model. Related
            N04 trajectories are not additional patients.
          </p>
          {[...new Set(catalogue.map((r) => r.batch))].map((batch) => (
            <section className="review-queue" key={batch}>
              <h2>{batch}</h2>
              <div>
                {catalogue
                  .filter((r) => r.batch === batch)
                  .map((r) => (
                    <button
                      className="review-queue-item"
                      key={r.id}
                      onClick={() => open(r.id)}
                    >
                      <b>
                        {r.case_id.replace("_INITIAL", "")} · {r.name}
                      </b>
                      <span>
                        {r.response} · {r.items.join(" / ")}
                      </span>
                    </button>
                  ))}
              </div>
            </section>
          ))}
        </>
      ) : !packet ? (
        <p role="status">Loading anonymous evidence…</p>
      ) : (
        <>
          <div className="study-meta">
            <span>{packet.batch}</span>
            <span>{packet.audience}</span>
            <span>{packet.decision_point}</span>
          </div>
          {packet.review?.revealed && (
            <p className="verified-note">
              Machine results were revealed after an earlier saved review. This
              record cannot be treated as a fresh unseen rating.
            </p>
          )}
          <div className="review-progress">
            <b>{packet.criterion}</b>
            <span>
              {packet.criterion === "D3a"
                ? "Synthesis: use only information received"
                : "Information seeking: inspect requests and examiner material"}
            </span>
          </div>
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
          <details className="study-disclosure">
            <summary>
              Actual interview · {packet.turns.length} questions
            </summary>
            <TurnView
              turns={packet.turns}
              showNotes={packet.criterion === "D5c"}
              prefix="review-turn"
            />
          </details>
          <section className="study-answer">
            <h2>Answer being assessed</h2>
            <pre>{packet.answer}</pre>
          </section>
          <RuleView cid={packet.criterion} rule={packet.rule} />
          {packet.criterion === "D5c" && (
            <section className="study-section">
              <h2>Examiner information · D5c only</h2>
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
                <summary>Selected inventory and factual availability</summary>
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
          {!complete && !packet.review?.items?.D5c && (
            <form className="blind-rating" onSubmit={save}>
              <h2>Your {packet.criterion} rating</h2>
              <label className="field">
                Reviewer
                <input
                  required
                  value={reviewer}
                  onChange={(e) => setReviewer(e.target.value)}
                  placeholder="Name or initials"
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
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={!!seen.machine}
                  onChange={(e) =>
                    setSeen({ ...seen, machine: e.target.checked })
                  }
                />
                I have already seen machine results for this answer, here or
                elsewhere.
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={!!seen.identity}
                  onChange={(e) =>
                    setSeen({ ...seen, identity: e.target.checked })
                  }
                />
                I already know which model wrote this answer.
              </label>
              <button className="primary" disabled={busy}>
                {packet.criterion === "D3a" &&
                packet.available_items.includes("D5c")
                  ? "Save D3a and open D5c evidence"
                  : "Save independent rating"}
              </button>
            </form>
          )}
          {packet.criterion === "D3a" &&
            packet.review?.items?.D3a &&
            !packet.review?.items?.D5c &&
            !complete && (
              <button
                className="secondary"
                onClick={() =>
                  load(id, "D5c").catch((e) => setError(e.message))
                }
              >
                Continue with D5c
              </button>
            )}
          {complete && (
            <section className="blind-rating">
              <h2>Ratings saved</h2>
              {Object.entries(packet.review.items).map(([cid, r]) => (
                <p key={cid}>
                  <b>
                    {cid}: {r.score}
                  </b>{" "}
                  · {r.note}
                </p>
              ))}
              {!revealed && (
                <button className="primary" disabled={busy} onClick={reveal}>
                  Reveal machine results and model
                </button>
              )}
            </section>
          )}
          {revealed && (
            <section className="study-section">
              <h2>Comparison · {revealed.model}</h2>
              {revealed.score_context && (
                <p className="study-note">{revealed.score_context}</p>
              )}
              {Object.entries(revealed.scores).map(([cid, grades]) => (
                <article className="decision-card" key={cid}>
                  <h3>
                    {cid} · machine{" "}
                    {grades.map((g) => g.label ?? g.score ?? "—").join(", ")}
                  </h3>
                  <p>Your saved rating: {revealed.rating.items[cid]?.score}</p>
                  {grades.map((g, n) => (
                    <p key={n}>
                      Repeat {g.repeat || n + 1}: {g.reason || g.error}
                    </p>
                  ))}
                </article>
              ))}
            </section>
          )}
          <a className="secondary" href={`/api/evidence/${id}/blind`} download>
            Download blank review sheet
          </a>
        </>
      )}
    </main>
  );
}
