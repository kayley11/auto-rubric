import { useEffect, useState } from "react";
import { BookOpen, ChevronDown, Download } from "lucide-react";

export async function request(path, body) {
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
  const value = await response.json();
  if (!response.ok)
    throw new Error(value.error || "The request could not be completed.");
  return value;
}

export function exposure(id, kind) {
  try {
    const values = JSON.parse(
      localStorage.getItem("autorubric-review-exposure") || "{}",
    );
    if (kind) {
      values[id] = { ...values[id], [kind]: true };
      localStorage.setItem(
        "autorubric-review-exposure",
        JSON.stringify(values),
      );
    }
    return values[id] || {};
  } catch {
    return {};
  }
}

export function RuleView({ cid, rule }) {
  if (!rule) return null;
  const missing = [1, 2, 3, 4, 5].filter((n) => !rule.anchors[String(n)]);
  return (
    <details className="study-disclosure">
      <summary>
        <BookOpen size={15} />
        {cid} · {rule.name}
        <ChevronDown size={15} />
      </summary>
      <p>{rule.definition}</p>
      <dl className="study-anchors">
        {[1, 2, 3, 4, 5].map((score) => (
          <div key={score}>
            <dt>{score}</dt>
            <dd>
              {rule.anchors[String(score)] ||
                "No original descriptor supplied."}
            </dd>
          </div>
        ))}
      </dl>
      {missing.length > 0 && (
        <p>Original descriptors were not supplied for {missing.join(", ")}.</p>
      )}
      {[
        rule.applicability,
        rule.notes_vs_patient_directed_explanations,
        ...(rule.essential_scoring_rules || []),
        ...(rule.relationship_to_D5c || []),
      ]
        .filter(Boolean)
        .map((line, n) => (
          <p className="rule-definition" key={n}>
            {line}
          </p>
        ))}
    </details>
  );
}

export function VersionLine({
  rules = "Josh’s proposal · 24 Oct",
  evidence = "Cleaned inputs · 25 Oct",
  batch,
}) {
  return (
    <div className="study-meta version-line">
      <span>
        <b>Rules</b> {rules}
      </span>
      <span>
        <b>Evidence</b> {evidence}
      </span>
      {batch && (
        <span>
          <b>Interview</b> {batch}
        </span>
      )}
    </div>
  );
}

export function EvidenceTrail({ requirements, turns, grades, onTurn }) {
  const [requirement, setRequirement] = useState(0),
    [question, setQuestion] = useState(0);
  const req = requirements?.[requirement],
    turn = turns?.[question];
  if (!req) return null;
  return (
    <details className="study-disclosure evidence-trail">
      <summary>
        Trace a requirement to the actual evidence and D5c explanation
      </summary>
      <p>
        Select a requirement and inspect the recorded requests. Whether a
        request is a clinically acceptable alternative remains a review
        question.
      </p>
      <label className="field">
        Candidate requirement
        <select
          value={requirement}
          onChange={(e) => setRequirement(Number(e.target.value))}
        >
          {requirements.map((r, n) => (
            <option key={r.id} value={n}>
              {r.id} · {r.requirement}
            </option>
          ))}
        </select>
      </label>
      <p>
        <b>Acceptable requests:</b> {req.acceptable_requests_or_alternatives}
      </p>
      <p>
        <b>Deadline:</b> {req.deadline}
      </p>
      {turn ? (
        <>
          <label className="field">
            Actual request
            <select
              value={question}
              onChange={(e) => setQuestion(Number(e.target.value))}
            >
              {turns.map((t, n) => (
                <option key={n} value={n}>
                  Q{n + 1} · {t.question}
                </option>
              ))}
            </select>
          </label>
          <p>
            <b>Q{question + 1}:</b> {turn.question}
          </p>
          <h3>What was returned</h3>
          <pre>{turn.reply || turn.patient_reply || ""}</pre>
          <pre>
            {turn.records ||
              (turn.fixed_records || [])
                .map((f) => `[${f.context}; ${f.period}]\n${f.text}`)
                .join("\n\n")}
          </pre>
          {turn.feedback && <p className="study-note">{turn.feedback}</p>}
          {onTurn && (
            <button
              className="text-button"
              onClick={() => onTurn(question + 1)}
            >
              Open Q{question + 1} in the full interview
            </button>
          )}
        </>
      ) : (
        <p>No interview requests were recorded.</p>
      )}
      <h3>Saved D5c judgement</h3>
      {(grades || []).map((g, n) => (
        <p key={n}>
          <b>
            {g.label || g.new_score || g.score || "—"} · repeat{" "}
            {g.repeat || n + 1}
          </b>
          <br />
          {g.reason || g.new_reason || g.error}
        </p>
      ))}
    </details>
  );
}

export function TurnView({
  turns,
  prefix = "case-turn",
  showNotes = false,
  focus,
}) {
  return (
    <div className="interview-turns">
      {turns.map((turn, index) => (
        <article
          className={`interview-turn ${focus === index + 1 ? "focused" : ""}`}
          id={`${prefix}-${index + 1}`}
          key={index}
        >
          <h3>Q{index + 1} · Clinician</h3>
          <p>{turn.question}</p>
          {turn.reply && (
            <div className="fixed-evidence">
              <b>Patient / family</b>
              <p>{turn.reply}</p>
            </div>
          )}
          {turn.records && (
            <div className="fixed-evidence">
              <b>Records actually returned</b>
              <pre>{turn.records}</pre>
            </div>
          )}
          {!turn.reply && !turn.records && (
            <p className="study-note">
              No additional information returned. This is not a negative result.
            </p>
          )}
          {turn.feedback && (
            <details>
              <summary>Return context</summary>
              <p>{turn.feedback}</p>
            </details>
          )}
          {showNotes && turn.notes && (
            <details>
              <summary>Public assessment note · before this reply</summary>
              <pre>{turn.notes}</pre>
            </details>
          )}
        </article>
      ))}
    </div>
  );
}

export function ExportLinks({ id, raw }) {
  const mark = () => {
    exposure(id, "machine");
    exposure(id, "identity");
  };
  return (
    <div className="result-actions">
      <a
        className="secondary"
        href={`/api/evidence/${id}/summary`}
        onClick={mark}
        download
      >
        <Download size={14} />
        Review summary
      </a>
      <a className="secondary" href={`/api/evidence/${id}/blind`} download>
        Blank review sheet
      </a>
      {raw && (
        <a className="secondary" href={raw} onClick={mark} download>
          Full raw output
        </a>
      )}
    </div>
  );
}

export function Decisions({ id, onUseData }) {
  const [data, setData] = useState(null),
    [form, setForm] = useState(null);
  const [error, setError] = useState(""),
    [saved, setSaved] = useState(false),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let current = true;
    setData(null);
    setError("");
    setSaved(false);
    request(`/api/requirements/${id}`)
      .then((value) => {
        if (!current) return;
        setData(value);
        const previous = value.review;
        setForm({
          reviewer: previous?.reviewer || "",
          reference_note: previous?.reference_note || "",
          reference_status: previous?.reference_status || "pending",
          decisions: Object.fromEntries(
            value.profile.requirements.map((r) => [
              r.id,
              previous?.decisions?.[r.id] || {
                level: r.level,
                status: "pending",
                alternatives: r.acceptable_requests_or_alternatives,
                deadline: r.deadline,
                reason: "",
              },
            ]),
          ),
        });
      })
      .catch((e) => current && setError(e.message));
    return () => {
      current = false;
    };
  }, [id]);
  const edit = (rid, key, value) => {
    setSaved(false);
    setForm((f) => ({
      ...f,
      decisions: {
        ...f.decisions,
        [rid]: { ...f.decisions[rid], [key]: value },
      },
    }));
  };
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const record = await request(`/api/requirements/${id}`, form);
      setData((d) => ({ ...d, review: record }));
      setSaved(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function copy() {
    setBusy(true);
    setError("");
    try {
      onUseData(await request(`/api/evidence/${id}/reviewed-input`));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!form || !data)
    return error ? (
      <p role="alert">{error}</p>
    ) : (
      <p role="status">Loading candidate requirements…</p>
    );
  return (
    <section className="clinical-decisions">
      <h2>Clinical decisions</h2>
      <p>
        Record which information is needed, acceptable alternatives and the
        latest useful request point. Saved decisions do not change historical
        inputs or grades.
      </p>
      {data.review && (
        <p className="review-receipt">
          Saved by {data.review.reviewer} ·{" "}
          {new Date(data.review.saved_at).toLocaleString("en-GB")}
        </p>
      )}
      <form onSubmit={save}>
        <label className="field">
          Reviewer
          <input
            value={form.reviewer}
            onChange={(e) => {
              setSaved(false);
              setForm({ ...form, reviewer: e.target.value });
            }}
            required
            placeholder="Name or initials"
          />
        </label>
        {data.profile.requirements.map((req) => {
          const row = form.decisions[req.id];
          return (
            <fieldset className="decision-card" key={req.id}>
              <legend>
                {req.id} · {req.requirement}
              </legend>
              <p className="study-note">
                Why proposed: {req.presentation_based_rationale}
              </p>
              <div className="decision-grid">
                <label className="field">
                  Information requirement
                  <select
                    value={row.level}
                    onChange={(e) => edit(req.id, "level", e.target.value)}
                  >
                    <option value="essential">Essential</option>
                    <option value="helpful">Helpful</option>
                    <option value="not_needed">Not needed</option>
                  </select>
                </label>
                <label className="field">
                  Review status
                  <select
                    value={row.status}
                    onChange={(e) => edit(req.id, "status", e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed by reviewer</option>
                    <option value="needs_changes">Needs changes</option>
                  </select>
                </label>
              </div>
              <label className="field">
                Acceptable requests or alternatives
                <textarea
                  value={row.alternatives}
                  onChange={(e) => edit(req.id, "alternatives", e.target.value)}
                  rows={2}
                />
              </label>
              <label className="field">
                Latest useful request point
                <input
                  value={row.deadline}
                  onChange={(e) => edit(req.id, "deadline", e.target.value)}
                />
              </label>
              <label className="field">
                Reason for this decision
                <textarea
                  value={row.reason}
                  onChange={(e) => edit(req.id, "reason", e.target.value)}
                  rows={2}
                  placeholder="Explain the clinical requirement or proposed correction."
                />
              </label>
            </fieldset>
          );
        })}
        <details className="study-disclosure">
          <summary>Provisional reference and selected case records</summary>
          <pre>{data.profile.reference}</pre>
          {data.profile.inventory.map((f) => (
            <p key={f.id}>
              <b>{f.context}</b>
              <br />
              {f.text}
            </p>
          ))}
        </details>
        <label className="field">
          Reference review
          <select
            value={form.reference_status}
            onChange={(e) => {
              setSaved(false);
              setForm({ ...form, reference_status: e.target.value });
            }}
          >
            <option value="pending">Pending</option>
            <option value="checked">Checked by reviewer</option>
            <option value="needs_changes">Needs changes</option>
          </select>
        </label>
        <label className="field">
          Reference corrections or required safety points
          <textarea
            rows={3}
            value={form.reference_note}
            onChange={(e) => {
              setSaved(false);
              setForm({ ...form, reference_note: e.target.value });
            }}
          />
        </label>
        {error && (
          <p className="error-banner" role="alert">
            {error}
          </p>
        )}
        <div className="study-toolbar">
          <button className="primary" disabled={busy}>
            {saved ? "Decision saved" : "Save clinical decisions"}
          </button>
          {onUseData &&
            data.review &&
            Object.values(data.review.decisions).some(
              (r) => r.status === "confirmed",
            ) && (
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={copy}
              >
                Copy reviewed checklist to new evaluation
              </button>
            )}
        </div>
      </form>
    </section>
  );
}
