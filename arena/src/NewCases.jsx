import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowRight, BookOpen } from "lucide-react";

const root = "/case-study";
const conditionNames = {
  baseline_assertion: "Added false measured-baseline claim",
  causal_assertion: "Added definite drug-causation claim",
  systemic_essential: "Systemic history treated as essential",
};
async function read(name) {
  const response = await fetch(`${root}/${name}`);
  if (!response.ok) throw new Error("The saved case could not be loaded.");
  return response.json();
}
function selection() {
  return window.location.hash.match(/^#study\/cases\/(CAND\d{2})$/)?.[1] || "";
}
function Paragraphs({ children }) {
  return (
    <div className="saved-answer">
      {children.split(/\n\s*\n/).map((p, i) => (
        <p key={i}>{p.replace(/\*\*|^#{1,6}\s/gm, "")}</p>
      ))}
    </div>
  );
}

export function NewCases({ onUseData }) {
  const [data, setData] = useState(null);
  const [id, setId] = useState(selection);
  const [record, setRecord] = useState(null);
  const [error, setError] = useState("");
  const [hideScores, setHideScores] = useState(false);
  useEffect(() => {
    read("index.json")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    const update = () => setId(selection());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    if (!data) return;
    const selected = id || data.cases[0]?.id;
    if (!selected) return;
    let active = true;
    setRecord(null);
    setError("");
    read(`${selected}.json`)
      .then((value) => {
        if (active) setRecord(value);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [data, id]);
  if (error)
    return (
      <p className="notice" role="alert">
        {error}
      </p>
    );
  if (!data) return <p>Loading the new cases…</p>;
  return (
    <main className="study new-case-study">
      <div className="study-heading">
        <p className="eyebrow">SOURCE-BASED CASES · 28–29 OCT</p>
        <h1>New cases and saved rubric results</h1>
        {!data.complete && (
          <p className="notice">
            Local preview: scoring is still running. The complete results have
            not been published.
          </p>
        )}
        <p>
          {data.cases.length} cases from published reports. One answering model
          and one judge; six questions allowed per case. Clinical references and
          information requirements are <strong>awaiting confirmation</strong>.
        </p>
        <p>
          Saved scores use the selected manuscript anchors dated 24 Oct. The
          evaluation form offers Original or Revised D3a / D5c rules; other
          items there retain their original anchors. Copying a case does not
          change its saved results.
        </p>
        {data.complete && (
          <div className="button-row">
            <a className="secondary" href={`${root}/FINDINGS.md`} download>
              <ArrowDownToLine size={15} /> Findings
            </a>
            <a className="secondary" href={`${root}/RAW_OUTPUT.txt`} download>
              <ArrowDownToLine size={15} /> Complete raw output
            </a>
          </div>
        )}
      </div>
      <label className="field">
        Choose a case
        <select
          value={id || data.cases[0]?.id}
          onChange={(e) => {
            window.location.hash = `study/cases/${e.target.value}`;
          }}
        >
          {data.cases.map((c) => (
            <option value={c.id} key={c.id}>
              {c.id} — {c.title}
            </option>
          ))}
        </select>
      </label>
      {!record ? (
        <p>Loading the case…</p>
      ) : (
        <>
          <div className="panel">
            <div className="panel-heading">
              <h2>
                {record.id} — {record.title}
              </h2>
              <span className="pill">awaiting confirmation</span>
            </div>
            <p>
              <strong>Purpose:</strong> {record.purpose}
            </p>
            <p>
              <strong>Information source:</strong> {record.role}.{" "}
              <strong>Final audience:</strong> clinician.
            </p>
            <p>
              <strong>Decision point:</strong> {record.decision_point}
            </p>
            <p>
              <strong>Opening:</strong> {record.opening}
            </p>
            <div className="button-row">
              <a
                className="secondary"
                href={record.source}
                target="_blank"
                rel="noreferrer"
              >
                <BookOpen size={15} /> Original report
              </a>
              <a
                className="secondary"
                href={`${root}/${record.id}.md`}
                download
              >
                <ArrowDownToLine size={15} /> Full case and results
              </a>
              <a
                className="secondary"
                href={`${root}/${record.id}.unscored.md`}
                download
              >
                <ArrowDownToLine size={15} /> Unscored review copy
              </a>
              <button
                className="secondary"
                onClick={() => onUseData(record.evaluation_input)}
              >
                Use saved answer in a new evaluation <ArrowRight size={15} />
              </button>
            </div>
          </div>
          <section className="panel">
            <div className="panel-heading">
              <h2>Answer and item results</h2>
              <label>
                <input
                  type="checkbox"
                  checked={hideScores}
                  onChange={(e) => setHideScores(e.target.checked)}
                />{" "}
                Hide machine results
              </label>
            </div>
            <p>
              {record.question_count} question turns · {record.word_count.words}{" "}
              words · {record.received_fact_ids.length}/{record.facts.length}{" "}
              stored fact groups returned
            </p>
            <Paragraphs>{record.answer}</Paragraphs>
            {!hideScores && (
              <>
                {!record.scoring_complete && (
                  <p>
                    Scoring is in progress; only completed item results are
                    shown.
                  </p>
                )}
                <p>
                  Answering model: {record.answer_model} · Judge:{" "}
                  {record.judge_model} · Saved rules:{" "}
                  {record.rule_version === "overleaf-20261024-read-20261028"
                    ? "Manuscript · 24 Oct 2026"
                    : record.rule_version}
                </p>
                {record.scores.map((g) => (
                  <details className="study-disclosure" key={g.item}>
                    <summary>
                      <strong>
                        {g.name} ({g.item})
                      </strong>{" "}
                      <span className="pill">{g.label}</span>
                      {g.repeats.length > 1 && (
                        <span>Repeats: {g.repeats.join(", ")}</span>
                      )}
                    </summary>
                    <p>{g.reason}</p>
                    {g.repeat_records?.map((x, i) => (
                      <p key={i}>
                        <strong>
                          Repeat {x.repeat}: {x.label}.
                        </strong>{" "}
                        {x.reason}
                      </p>
                    ))}
                    <details>
                      <summary>Scoring anchors used</summary>
                      {record.rules[g.item].definition && (
                        <p>{record.rules[g.item].definition}</p>
                      )}
                      {Object.entries(record.rules[g.item].anchors).map(
                        ([n, words]) => (
                          <p key={n}>
                            <strong>{n}.</strong> {words}
                          </p>
                        ),
                      )}
                      {[
                        ...(record.rules[g.item].essential_scoring_rules || []),
                        ...(record.rules[g.item].relationship_to_D5c || []),
                      ].map((rule, index) => (
                        <p key={index}>{rule}</p>
                      ))}
                    </details>
                  </details>
                ))}
                {record.controls.length > 0 && (
                  <details className="study-disclosure">
                    <summary>Constructed or changed-condition checks</summary>
                    <p>
                      These are separate checks. Constructed text was not
                      generated by the answering model; changed requirements are
                      exploratory assumptions.
                    </p>
                    {record.controls.map((g, i) => (
                      <p key={i}>
                        <strong>
                          {conditionNames[g.condition] || g.condition} ·{" "}
                          {g.item} · repeat {g.repeat}: {g.label}.
                        </strong>{" "}
                        {g.reason}
                      </p>
                    ))}
                  </details>
                )}
              </>
            )}
          </section>
          <section className="panel">
            <h2>What was asked and returned</h2>
            <p>
              Not returned does not automatically mean not requested. The
              questions and environment feedback below show the distinction.
            </p>
            {record.turns.map((t) => (
              <details className="study-disclosure" key={t.number}>
                <summary>
                  Question {t.number}: {t.question}
                </summary>
                <p>
                  <strong>Saved assessment note:</strong> {t.assessment}
                </p>
                {t.returned.map((f) => (
                  <p key={f.id}>
                    <strong>
                      {f.channel} · {f.id}:
                    </strong>{" "}
                    {f.text}
                  </p>
                ))}
                <p>
                  <strong>Environment feedback:</strong>{" "}
                  {t.feedback || "No additional feedback."}
                </p>
              </details>
            ))}
            <details className="study-disclosure">
              <summary>
                Stored facts, source positions and return status
              </summary>
              {record.facts.map((f) => (
                <p key={f.id}>
                  <strong>
                    {record.received_fact_ids.includes(f.id)
                      ? "Returned"
                      : "Not returned"}{" "}
                    · {f.id} · {f.source_location}.
                  </strong>{" "}
                  {f.text}
                </p>
              ))}
            </details>
          </section>
          <section className="panel">
            <h2>Reference and decisions needed</h2>
            <p>{record.reference}</p>
            {record.requirements.map((r) => (
              <details className="study-disclosure" key={r.id}>
                <summary>
                  {r.id}: {r.requirement}{" "}
                  <span className="pill">Candidate {r.level}</span>
                </summary>
                <p>
                  <strong>Why:</strong> {r.presentation_based_rationale}
                </p>
                <p>
                  <strong>Acceptable requests or alternatives:</strong>{" "}
                  {r.acceptable_requests_or_alternatives}
                </p>
                <p>
                  <strong>Deadline:</strong> {r.deadline}
                </p>
                <p>
                  Confirm essential / helpful / unnecessary, acceptable
                  alternatives and timing.
                </p>
              </details>
            ))}
            <details className="study-disclosure">
              <summary>Task, adaptation and withheld information</summary>
              <p>{record.task}</p>
              <p>{record.adaptation}</p>
              <p>
                <strong>Withheld:</strong> {record.hidden}
              </p>
            </details>
          </section>
        </>
      )}
    </main>
  );
}
