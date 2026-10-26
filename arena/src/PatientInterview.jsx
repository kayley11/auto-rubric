import { useEffect, useState } from "react";
import { LoaderCircle, Square } from "lucide-react";
import {
  Decisions,
  EvidenceTrail,
  RuleView,
  TurnView,
  VersionLine,
  exposure,
  request,
} from "./StudyTools";
import { revisedId } from "./EvaluationEvidence";

const active = (run) =>
  run && ["interviewing", "scoring", "generating"].includes(run.status);

export function PatientInterview({ config, initialRun, onSaved, onUseData }) {
  const [caseId, setCaseId] = useState("C02"),
    [model, setModel] = useState("arc:lite");
  const [judge, setJudge] = useState("arc:apex"),
    [version, setVersion] = useState(revisedId);
  const [run, setRun] = useState(initialRun || null),
    [pending, setPending] = useState(false),
    [error, setError] = useState("");
  const [tab, setTab] = useState("interview");
  useEffect(() => {
    if (initialRun) {
      setRun(initialRun);
      setTab("interview");
    }
  }, [initialRun?.id]);
  useEffect(() => {
    if (!config) return;
    setCaseId((c) =>
      config.patient_cases.some((x) => x.id === c)
        ? c
        : config.patient_cases[0]?.id,
    );
  }, [config]);
  useEffect(() => {
    if (!active(run)) return;
    const timer = setInterval(async () => {
      try {
        const next = await request(`/api/runs/${run.id}`);
        setRun(next);
        if (!active(next)) onSaved();
      } catch (e) {
        setError(e.message);
      }
    }, 1800);
    return () => clearInterval(timer);
  }, [run?.id, run?.status]);
  useEffect(() => {
    if (run?.review_id) {
      exposure(run.review_id, "identity");
      if (tab === "scores") exposure(run.review_id, "machine");
    }
  }, [run?.review_id, tab]);
  async function action(kind) {
    setPending(true);
    setError("");
    try {
      const next =
        kind === "interview"
          ? await request("/api/runs", {
              action: "interview",
              case_id: caseId,
              answer_model: model,
              judge_model: judge,
              rules_version: version,
            })
          : await request(
              `/api/runs/${run.id}/${kind}`,
              kind === "evaluate" ? run.input : {},
            );
      setRun(next);
      onSaved();
      if (kind === "evaluate") setTab("scores");
    } catch (e) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }
  const cases = config?.patient_cases || [];
  const selected = cases.find((c) => c.id === (run?.input.case_id || caseId));
  const data = run?.input,
    busy = pending || active(run);
  const proposed = (run?.rubric_version?.id || version) !== "original";
  const turns = data?.interview?.turns || [];
  return (
    <main className="study patient-interview">
      <div className="page-heading study-heading">
        <span className="eyebrow">PATIENT INTERVIEW</span>
        <h1>{selected?.name || "Ask, then assess."}</h1>
        <p>
          The clinician model chooses what to ask. The patient replies using
          fixed case facts; clinical records are returned separately when
          requested. Up to six questions.
        </p>
      </div>
      <VersionLine
        rules={
          (run?.rubric_version?.id || version) === "original"
            ? "Original rubric"
            : "Josh’s proposal · 24 Oct"
        }
        evidence="Corrected fixed-fact routing · 25 Oct"
        batch={run ? "New saved interview" : "Eight prepared cases"}
      />
      <p className="study-note">
        References and information requirements await Josh’s confirmation. This
        mode tests information seeking; it does not establish whether a model
        has seen a source case before.
      </p>
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      {run?.error && (
        <p className="error-banner" role="alert">
          {run.error}
        </p>
      )}
      {!run && (
        <section className="patient-setup">
          <div className="decision-grid">
            <label className="field">
              Case
              <select
                value={caseId}
                disabled={!config || busy}
                onChange={(e) => setCaseId(e.target.value)}
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id.replace("_INITIAL", "")} · {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Scoring rules
              <select
                value={version}
                disabled={busy}
                onChange={(e) => setVersion(e.target.value)}
              >
                <option value="original">Original rubric</option>
                <option value={revisedId}>
                  Josh’s proposed D3a / D5c · 24 Oct
                </option>
              </select>
            </label>
            <label className="field">
              Clinician model
              <select
                value={model}
                disabled={busy}
                onChange={(e) => setModel(e.target.value)}
              >
                {["arc:lite", "arc:chat", "arc:apex"].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Judge model
              <select
                value={judge}
                disabled={busy}
                onChange={(e) => setJudge(e.target.value)}
              >
                {["arc:apex", "arc:chat", "arc:lite"].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
          </div>
          <section className="study-opening">
            <h2>What the clinician sees at the start</h2>
            <pre>{selected?.common_information}</pre>
            <p>{selected?.opening}</p>
            <details>
              <summary>Task for the final answer</summary>
              <pre>{selected?.task}</pre>
            </details>
          </section>
          <button
            className="primary"
            disabled={busy || !config}
            onClick={() => action("interview")}
          >
            Start patient interview
          </button>
        </section>
      )}
      {run && (
        <>
          {run.purpose && <p className="study-note">{run.purpose}</p>}
          <div className="study-toolbar">
            <span>
              {data.answer_model} · judge {data.judge_model} · {turns.length}/6
              questions
            </span>
            {!busy && (
              <button
                className="secondary"
                onClick={() => {
                  setRun(null);
                  setError("");
                  setTab("interview");
                }}
              >
                New interview
              </button>
            )}
          </div>
          {active(run) && (
            <div className="patient-progress" role="status">
              <LoaderCircle className="spin" size={17} />
              <span>{run.message}</span>
              <button
                className="text-button"
                onClick={() => action("stop")}
                disabled={pending}
              >
                <Square size={12} />
                Stop after current request
              </button>
            </div>
          )}
          {["stopped", "interrupted", "error", "partial"].includes(
            run.status,
          ) && (
            <div className="patient-progress">
              <span>{run.message}</span>
              <button
                className="secondary"
                disabled={busy}
                onClick={() => action("retry")}
              >
                Resume saved run
              </button>
            </div>
          )}
          {data.answer && !Object.keys(run.grades).length && !busy && (
            <div className="patient-progress">
              <span>
                {proposed
                  ? "Interview and answer saved. Scoring uses the actual questions, returned evidence and candidate requirements."
                  : "Interview and answer saved. Original scoring uses the transcript and draft reference; candidate requirements are not applied."}
              </span>
              <button className="primary" onClick={() => action("evaluate")}>
                Score D3a and D5c
              </button>
            </div>
          )}
          {data.answer && (
            <div className="result-actions patient-exports">
              {run.review_id && (
                <a className="secondary" href={`#review/${run.review_id}`}>
                  Review before seeing scores
                </a>
              )}
              <a
                className="secondary"
                href={`/api/runs/${run.id}/summary`}
                onClick={() => {
                  exposure(run.review_id, "machine");
                  exposure(run.review_id, "identity");
                }}
                download
              >
                Review summary
              </a>
              <a
                className="secondary"
                href={`/api/runs/${run.id}/blind`}
                download
              >
                Blank review sheet
              </a>
              <a
                className="secondary"
                href={`/api/runs/${run.id}/raw`}
                onClick={() => {
                  exposure(run.review_id, "machine");
                  exposure(run.review_id, "identity");
                }}
                download
              >
                Full raw output
              </a>
            </div>
          )}
          <nav className="study-tabs" aria-label="Patient interview sections">
            {[
              ["interview", "Interview & answer"],
              ["scores", "Scores & evidence"],
              ["decisions", "Clinical decisions"],
            ].map(([key, label]) => (
              <button
                key={key}
                disabled={key !== "interview" && !data.answer}
                className={tab === key ? "active" : ""}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </nav>
          {tab === "interview" && (
            <>
              <section className="study-opening">
                <h2>Initial information</h2>
                <pre>{data.facts}</pre>
                <details>
                  <summary>Final-answer task</summary>
                  <pre>{data.task}</pre>
                </details>
              </section>
              <TurnView turns={turns} prefix="live-turn" showNotes />
              {!turns.length && (
                <p className="study-note">
                  The clinician’s first question will appear here.
                </p>
              )}
              {data.answer && (
                <section className="study-answer">
                  <h2>Final answer · unchanged saved output</h2>
                  <pre>{data.answer}</pre>
                </section>
              )}
              {run.fact_coverage?.length > 0 && (
                <details className="study-disclosure">
                  <summary>
                    Obtained and missing information · examiner inventory
                  </summary>
                  <p>
                    “Not obtained” does not by itself mean the model failed to
                    ask. Compare each question, reply and candidate requirement.
                  </p>
                  <div className="evidence-table-wrap">
                    <table className="evidence-table">
                      <thead>
                        <tr>
                          <th>Selected case information</th>
                          <th>Return status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {run.fact_coverage.map((f) => (
                          <tr key={f.id}>
                            <td>
                              {f.text}
                              <small>{f.context}</small>
                            </td>
                            <td>
                              {f.status}
                              {f.questions.map((n) => (
                                <button
                                  className="text-button"
                                  key={n}
                                  onClick={() =>
                                    document
                                      .getElementById(`live-turn-${n}`)
                                      ?.scrollIntoView({ block: "center" })
                                  }
                                >
                                  Q{n}
                                </button>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </>
          )}
          {tab === "scores" && (
            <section className="study-section">
              <h2>Item scores and their evidence</h2>
              <EvidenceTrail
                requirements={data.requirements}
                turns={turns}
                grades={run.grades.D5c ? [run.grades.D5c] : []}
                onTurn={(n) => {
                  setTab("interview");
                  setTimeout(
                    () =>
                      document
                        .getElementById(`live-turn-${n}`)
                        ?.scrollIntoView({ block: "center" }),
                    0,
                  );
                }}
              />
              {data.criteria.map((cid) => {
                const grade = run.grades[cid],
                  rule = run.rubric.criteria.find((r) => r.id === cid);
                const qs = [
                  ...new Set(
                    [...(grade?.reason || "").matchAll(/\bQ([1-6])\b/g)].map(
                      (m) => Number(m[1]),
                    ),
                  ),
                ];
                return (
                  <article className="decision-card" key={cid}>
                    <h3>
                      {cid} ·{" "}
                      {cid === "D3a"
                        ? "Problem representation"
                        : "Information seeking"}{" "}
                      · {grade?.label || "Not scored yet"}
                    </h3>
                    <RuleView cid={cid} rule={rule} />
                    <p>{grade?.reason || grade?.error}</p>
                    {grade?.unanchored && (
                      <p className="study-note">
                        This intermediate grade has no original descriptor and
                        remains provisional.
                      </p>
                    )}
                    {qs.length > 0 && (
                      <div className="citation-links">
                        {qs.map((n) => (
                          <button
                            className="text-button"
                            key={n}
                            onClick={() => {
                              setTab("interview");
                              setTimeout(
                                () =>
                                  document
                                    .getElementById(`live-turn-${n}`)
                                    ?.scrollIntoView({ block: "center" }),
                                0,
                              );
                            }}
                          >
                            Check Q{n}
                          </button>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
              <details className="study-disclosure">
                <summary>
                  Candidate requirements · D5c examiner material
                </summary>
                {data.requirements.map((req) => (
                  <article className="decision-card" key={req.id}>
                    <h3>
                      {req.id} · candidate {req.level}
                    </h3>
                    <p>{req.requirement}</p>
                    <p>
                      <b>Acceptable requests:</b>{" "}
                      {req.acceptable_requests_or_alternatives}
                    </p>
                    <p>
                      <b>Deadline:</b> {req.deadline}
                    </p>
                  </article>
                ))}
                <h3>Availability and returned evidence</h3>
                <pre>{data.interview.availability_context}</pre>
              </details>
              <p className="study-note">
                {proposed
                  ? "D3a uses received evidence; D5c distinguishes requests from their fulfilment. Candidate essentials determine which omissions limit the score."
                  : "These are original-rule grades. The judge receives the transcript and draft reference; the proposed candidate requirements are retained for a separate evaluation."}
              </p>
            </section>
          )}
          {tab === "decisions" && run.review_id && (
            <Decisions id={run.review_id} onUseData={onUseData} />
          )}
          <footer className="study-footer">
            <span>
              All completed turns, public notes, visible API outputs and errors
              are saved in this run.
            </span>
            <span>
              {run.usage?.total_tokens?.toLocaleString() || "—"} reported tokens
              · {run.usage?.elapsed_seconds || 0}s in API requests
            </span>
          </footer>
        </>
      )}
    </main>
  );
}
