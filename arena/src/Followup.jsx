import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  Decisions,
  ExportLinks,
  ExportMenu,
  RuleView,
  TurnView,
  VersionLine,
  exposure,
  request,
} from "./StudyTools";

const items = { D5c: "Information seeking", D3a: "Problem representation" };
const repeats = (grades) =>
  grades.map((g) => g.label ?? g.score ?? "—").join(", ");

export function Followup({ onUseData }) {
  const [data, setData] = useState(null),
    [record, setRecord] = useState(null);
  const [selected, setSelected] = useState(
    () => window.location.hash.split("/")[2] || "",
  );
  const [tab, setTab] = useState("evidence"),
    [focus, setFocus] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    request("/api/followup")
      .then(setData)
      .catch((e) => setError(e.message));
    const update = () => setSelected(window.location.hash.split("/")[2] || "");
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    setRecord(null);
    setError("");
    setFocus(null);
    setTab("evidence");
    if (selected)
      request(`/api/evidence/${selected}`)
        .then(setRecord)
        .catch((e) => setError(e.message));
  }, [selected]);
  useEffect(() => {
    if (!data) return;
    if (!selected)
      data.records.forEach((r) => {
        exposure(r.id, "machine");
        exposure(r.id, "identity");
      });
    else {
      exposure(selected, "identity");
      if (tab === "scores") exposure(selected, "machine");
    }
  }, [data, selected, tab]);
  useEffect(() => {
    if (tab === "interview" && focus)
      document
        .getElementById(`case-turn-${focus}`)
        ?.scrollIntoView({ block: "center" });
  }, [tab, focus]);
  const open = (id) => {
    window.location.hash = id ? `study/followup/${id}` : "study/followup";
    window.scrollTo(0, 0);
  };
  const turn = (n) => {
    setFocus(n);
    setTab("interview");
  };
  async function copy() {
    try {
      onUseData(record.data);
    } catch (e) {
      setError(e.message);
    }
  }
  if (error)
    return (
      <main className="study">
        <p className="error-banner" role="alert">
          {error}
        </p>
        <button className="secondary" onClick={() => open("")}>
          N04 comparison
        </button>
      </main>
    );
  if (!data)
    return (
      <main className="study">
        <p role="status">Loading the corrected follow-up…</p>
      </main>
    );
  return (
    <main className="study followup-study">
      {selected && (
        <button className="back-link" onClick={() => open("")}>
          <ArrowLeft size={15} />
          N04 comparison
        </button>
      )}
      <div className="page-heading study-heading">
        <span className="eyebrow">N04 FOLLOW-UP · 25 OCTOBER 2026</span>
        <h1>
          {record
            ? `${record.model} · ${record.arm === "fresh" ? "Corrected interview" : "Saved interview"}`
            : "Recurrent headache: model comparison"}
        </h1>
        <p>
          A 36-year-old woman with recurrent headache after a recent admission.
          Same case, six-question limit and arc:apex judge.
        </p>
      </div>
      <details className="study-disclosure run-details">
        <summary>
          Scoring & run details <span>Josh’s proposed rules · 24 Oct</span>
        </summary>
        <VersionLine
          batch={record ? record.batch : "Saved and corrected N04"}
        />
      </details>
      <p className="study-note">
        References and essential requirements await Josh’s confirmation.
      </p>
      {!selected ? (
        <>
          <section className="study-section followup-finding">
            <span className="mini-label">MAIN FINDING</span>
            <h2>Information-seeking scores varied: 2, 2, 5.</h2>
            <p>
              Three calls to the same judge, using the same saved lite
              interview, disagreed on whether a general CSF-results request met
              the infection-information requirement. It returned cell count and
              protein, without PCR/culture/serology.
            </p>
            <p>
              Problem representation (D3a) received 5 in every repeat for all
              three models, before and after the return fixes.
            </p>
            <button
              className="secondary"
              onClick={() =>
                open(
                  data.records.find(
                    (r) => r.arm === "fresh" && r.model === "arc:lite",
                  ).id,
                )
              }
            >
              Read the exact question and replies
            </button>
          </section>
          <div className="study-toolbar">
            <p>
              Three repeated grades for each fixed answer and interview. These
              are related trajectories from one patient case.
            </p>
            <ExportMenu>
              <a href="/api/study/files/followup-output.txt" download>
                Full raw output
              </a>
            </ExportMenu>
          </div>
          <div
            className="comparison-wrap"
            tabIndex={0}
            role="region"
            aria-label="Saved and corrected N04 comparison"
          >
            <table className="comparison-table followup-table">
              <caption className="sr-only">
                Same three models, saved versus corrected N04 interviews; three
                grades per item
              </caption>
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Saved interview · rescored</th>
                  <th>Corrected interview</th>
                </tr>
              </thead>
              <tbody>
                {data.models.map((model) => (
                  <tr key={model}>
                    <th scope="row">{model}</th>
                    {["old", "fresh"].map((arm) => {
                      const row = data.records.find(
                        (r) => r.arm === arm && r.model === model,
                      );
                      return (
                        <td key={arm}>
                          <button
                            className="compare-cell"
                            onClick={() => open(row.id)}
                            aria-label={`Inspect ${model} ${arm === "fresh" ? "corrected" : "saved"} N04 interview`}
                          >
                            {["D5c", "D3a"].map((cid) => (
                              <span className="repeat-line" key={cid}>
                                <b>
                                  {items[cid]} <small>({cid})</small>
                                </b>
                                <strong>{repeats(row.scores[cid])}</strong>
                              </span>
                            ))}
                            <span className="compare-observation">
                              {row.observation}
                            </span>
                            <span className="compare-open">
                              Inspect evidence and reasons{" "}
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
          <section className="study-section">
            <h2>Separate availability checks</h2>
            <p>
              Saved requests were rescored with explicit source availability. An
              unavailable report is not automatically a simulator error.
            </p>
            {data.controls.map((control) => (
              <details className="study-disclosure" key={control.id}>
                <summary>
                  {control.name}
                  <b>{repeats(control.scores)}</b>
                </summary>
                {control.scores.map((g) => (
                  <div className="repeat-reason" key={g.repeat}>
                    <h3>
                      Repeat {g.repeat} · D5c {g.label}
                    </h3>
                    <p>{g.reason}</p>
                  </div>
                ))}
                {control.id === "N02_unavailable" && (
                  <p className="verified-note">
                    Verified wording issue: repeat 2 claims final-question
                    credit is permitted, but the frozen food/fasting requirement
                    says “Before the final assessment”. The grade and original
                    explanation are preserved.
                  </p>
                )}
              </details>
            ))}
          </section>
        </>
      ) : !record ? (
        <p role="status">Loading interview…</p>
      ) : (
        <>
          <p className="result-finding">
            <b>Interview finding</b>
            {record.observation}
          </p>
          <div className="study-toolbar review-actions">
            <a className="primary" href={`#review/${record.id}`}>
              Review this case
            </a>
            <button className="secondary" onClick={copy}>
              Use as new evaluation
            </button>
            <ExportLinks
              id={record.id}
              raw="/api/study/files/followup-output.txt"
            />
          </div>
          <details className="study-disclosure case-context">
            <summary>Case information & task</summary>
            <h3>Information at the start</h3>
            <pre>{record.data.facts}</pre>
            <h3>Original task</h3>
            <pre>{record.data.task}</pre>
          </details>
          <nav className="study-tabs" aria-label="Follow-up sections">
            {[
              ["evidence", "Evidence & requirements"],
              ["interview", "Full interview"],
              ["scores", "Answer & scores"],
              ["decisions", "Clinical decisions"],
            ].map(([key, label]) => (
              <button
                key={key}
                className={tab === key ? "active" : ""}
                aria-current={tab === key ? "page" : undefined}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </nav>
          {tab === "evidence" && (
            <section className="study-section">
              <h2>Requirement → question → return → judgement</h2>
              <p>
                Technical returns and clinical equivalence are separate. A
                generic CSF request is not automatically classified as a
                simulator fault or a satisfied clinical requirement.
              </p>
              {record.data.requirements.map((req) => {
                const trace = record.traces.find(
                  (t) => t.requirement_id === req.id,
                );
                return (
                  <article className="decision-card" key={req.id}>
                    <h3>
                      {req.id} · {req.requirement}
                    </h3>
                    <span className="pending-tag">Candidate {req.level}</span>
                    <p>{req.presentation_based_rationale}</p>
                    <p>
                      <b>Acceptable requests:</b>{" "}
                      {req.acceptable_requests_or_alternatives}
                    </p>
                    <p>
                      <b>Deadline:</b> {req.deadline}
                    </p>
                    <p className="verified-note">
                      {trace.technical_observation}
                    </p>
                    <p>{trace.clinical_equivalence}</p>
                    {trace.questions.map((n) => {
                      const t = record.data.interview.turns[n - 1];
                      return (
                        t && (
                          <div className="trace-request" key={n}>
                            <button
                              className="text-button"
                              onClick={() => turn(n)}
                            >
                              Q{n} · open actual reply
                            </button>
                            <p>{t.question}</p>
                            <p className="study-note">
                              {t.records
                                ? "A clinical record was returned; inspect its type and admission."
                                : t.reply
                                  ? "Patient/family information was returned."
                                  : "No additional reply or record returned; inspect the recorded context."}
                            </p>
                          </div>
                        )
                      );
                    })}
                    <button
                      className="secondary"
                      onClick={() => setTab("scores")}
                    >
                      Read all three D5c explanations
                    </button>
                  </article>
                );
              })}
              <button className="primary" onClick={() => setTab("decisions")}>
                Record clinical decisions
              </button>
              <details className="study-disclosure">
                <summary>
                  Selected inventory and factual availability · examiner only
                </summary>
                <pre>{record.data.interview.availability_context}</pre>
              </details>
            </section>
          )}
          {tab === "interview" && (
            <section className="study-section">
              <h2>
                Actual interview · {record.data.interview.turns.length}{" "}
                questions
              </h2>
              <TurnView
                turns={record.data.interview.turns}
                showNotes
                focus={focus}
              />
            </section>
          )}
          {tab === "scores" && (
            <section className="study-section">
              <h2>Answer and repeated judgements</h2>
              <div className="study-answer">
                <pre>{record.data.answer}</pre>
              </div>
              {Object.entries(record.scores).map(([cid, grades]) => (
                <section key={cid}>
                  <h2>
                    {items[cid]} ({cid}) · {repeats(grades)}
                  </h2>
                  <RuleView cid={cid} rule={record.rules[cid]} />
                  {grades.map((g) => {
                    const qs = [
                      ...new Set(
                        [...g.reason.matchAll(/\bQ([1-6])\b/g)].map((m) =>
                          Number(m[1]),
                        ),
                      ),
                    ];
                    return (
                      <article className="repeat-reason" key={g.repeat}>
                        <h3>
                          Repeat {g.repeat} · score {g.label}
                        </h3>
                        <p className="mini-label">SAVED JUDGE EXPLANATION</p>
                        <p>{g.reason}</p>
                        <div className="citation-links">
                          {qs.map((n) => (
                            <button
                              key={n}
                              className="text-button"
                              onClick={() => turn(n)}
                            >
                              Check Q{n}
                            </button>
                          ))}
                        </div>
                      </article>
                    );
                  })}
                </section>
              ))}
            </section>
          )}
          {tab === "decisions" && (
            <Decisions id={record.id} onUseData={onUseData} />
          )}
        </>
      )}
    </main>
  );
}
