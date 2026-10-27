import { useState } from "react";
import { ChevronDown, Plus, X } from "lucide-react";

export const revisedId = "josh-proposed-20261024";
export const blankInterview = () => ({
  turns: [],
  max_questions: 6,
  complete: false,
  notes_allowed: false,
  decision_point: "Final answer after the supplied interview",
  synthesis_scope:
    "Use the stated task to determine whether synthesis is in scope.",
  closing_notes: "",
  reviewer_context: "",
  availability_context: "",
});

export function EvaluationEvidence({
  form,
  change,
  frozen,
  choices,
  onImport,
  pending,
  revised,
}) {
  const [selection, setSelection] = useState("");
  const record = { ...blankInterview(), ...form.interview };
  const requirements = form.requirements || [];
  const update = (key, value) =>
    change("interview", { ...record, [key]: value });
  const editTurn = (index, key, value) =>
    update(
      "turns",
      record.turns.map((t, i) => (i === index ? { ...t, [key]: value } : t)),
    );
  const editRequirement = (index, key, value) =>
    change(
      "requirements",
      requirements.map((r, i) => (i === index ? { ...r, [key]: value } : r)),
    );
  const addRequirement = () => {
    let n = 1;
    while (requirements.some((r) => r.id === `candidate.${n}`)) n += 1;
    change("requirements", [
      ...requirements,
      {
        id: `candidate.${n}`,
        level: "essential",
        requirement: "",
        presentation_based_rationale: "",
        acceptable_requests_or_alternatives: "",
        deadline: "Before the final assessment",
      },
    ]);
  };
  return (
    <section className="panel evaluation-evidence">
      <div className="panel-heading">
        <h2>Interview evidence & candidate requirements</h2>
        <span className="pending-tag">
          Requirements are awaiting confirmation
        </span>
      </div>
      <p className="evidence-intro">
        {revised
          ? "Proposed D3a uses the information actually received and the final answer. Proposed D5c uses actual requests, replies and the candidate checklist. Notes can explain a request; they do not count as asking."
          : "The original rules use the actual transcript and any supplied reference points. The candidate checklist and reviewer-only notes are retained here for switching to the proposed version; they are not applied by the original rules."}
      </p>
      {!frozen && (
        <div className="interview-import">
          <label className="field">
            Reuse a saved interview
            <select
              aria-label="Saved interview to reuse"
              value={selection}
              disabled={pending}
              onChange={(e) => setSelection(e.target.value)}
            >
              <option value="">Choose a case and answering model</option>
              {(choices || []).map((r) => (
                <option
                  key={`${r.case_id}/${r.model_slug}`}
                  value={`${r.case_id}/${r.model_slug}`}
                >
                  {r.case_id.replace("_INITIAL", "")} — {r.name} · {r.model}
                </option>
              ))}
            </select>
          </label>
          <button
            className="secondary"
            disabled={!selection || pending}
            onClick={() =>
              onImport(selection, form.rules_version || "original")
            }
          >
            Load interview & answer
          </button>
          <small>
            Copies the actual input, transcript, answer and candidate
            requirements. Historical scores stay in the study.
          </small>
        </div>
      )}
      {form.interview_source?.source_sha256 && (
        <p className="evidence-provenance">
          Source: {form.interview_source.case_id} ·{" "}
          {form.interview_source.model}. This evaluation is saved separately.
        </p>
      )}
      <div className="evidence-settings">
        <label className="field">
          Decision point
          <input
            disabled={frozen}
            value={record.decision_point}
            onChange={(e) => update("decision_point", e.target.value)}
          />
        </label>
        <label className="field">
          Clinical synthesis requirement
          <textarea
            rows={2}
            disabled={frozen}
            value={record.synthesis_scope}
            onChange={(e) => update("synthesis_scope", e.target.value)}
          />
        </label>
      </div>
      <div className="evidence-checks">
        <label className="checkbox-label">
          <input
            type="checkbox"
            disabled={frozen}
            checked={record.complete}
            onChange={(e) => update("complete", e.target.checked)}
          />
          This is the complete transcript at this decision point, including if
          no questions were asked.
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            disabled={frozen}
            checked={record.notes_allowed}
            onChange={(e) => update("notes_allowed", e.target.checked)}
          />
          Assessment notes were specified as part of the task and can explain
          requests.
        </label>
      </div>
      <details className="evidence-group" open={record.turns.length === 0}>
        <summary>
          Actual questions & replies{" "}
          <span>
            {record.turns.length} recorded · {record.max_questions} allowed
          </span>
          <ChevronDown size={14} />
        </summary>
        <p className="helper">
          Keep each request with its actual reply. Preserve record dates and
          admission context. Do not insert hidden results or imagined replies.
        </p>
        <label className="field short-field">
          Allowed question limit
          <input
            type="number"
            min="1"
            max="50"
            disabled={frozen}
            value={record.max_questions}
            onChange={(e) => update("max_questions", Number(e.target.value))}
          />
        </label>
        {record.turns.map((turn, i) => (
          <details className="evidence-entry" key={i}>
            <summary>
              <b>Q{i + 1}</b>
              <span>{turn.question || "New request"}</span>
              <ChevronDown size={14} />
            </summary>
            <label className="field">
              Actual request
              <textarea
                disabled={frozen}
                value={turn.question}
                onChange={(e) => editTurn(i, "question", e.target.value)}
              />
            </label>
            <label className="field">
              Assessment note saved before the reply
              <textarea
                disabled={frozen}
                value={turn.notes}
                onChange={(e) => editTurn(i, "notes", e.target.value)}
                placeholder="An explicit saved justification; not a patient-directed request."
              />
            </label>
            <label className="field">
              Patient or family reply
              <textarea
                disabled={frozen}
                value={turn.reply}
                onChange={(e) => editTurn(i, "reply", e.target.value)}
              />
            </label>
            <label className="field">
              Records actually returned, including time and context
              <textarea
                disabled={frozen}
                value={turn.records}
                onChange={(e) => editTurn(i, "records", e.target.value)}
              />
            </label>
            <label className="field">
              Environment feedback actually returned
              <textarea
                disabled={frozen}
                value={turn.feedback}
                onChange={(e) => editTurn(i, "feedback", e.target.value)}
              />
            </label>
            {!frozen && (
              <button
                className="text-button"
                onClick={() =>
                  update(
                    "turns",
                    record.turns.filter((_, n) => n !== i),
                  )
                }
              >
                <X size={13} /> Remove turn
              </button>
            )}
          </details>
        ))}
        {!frozen && (
          <button
            className="secondary"
            disabled={record.turns.length >= record.max_questions}
            onClick={() =>
              update("turns", [
                ...record.turns,
                {
                  question: "",
                  reply: "",
                  records: "",
                  notes: "",
                  feedback: "",
                },
              ])
            }
          >
            <Plus size={14} /> Add actual request
          </button>
        )}
        <label className="field closing-notes">
          Closing assessment note, if saved
          <textarea
            disabled={frozen}
            value={record.closing_notes}
            onChange={(e) => update("closing_notes", e.target.value)}
          />
        </label>
      </details>
      <details className="evidence-group" open={requirements.length === 0}>
        <summary>
          Candidate information checklist{" "}
          <span>
            {requirements.filter((r) => r.level === "essential").length}{" "}
            essential ·{" "}
            {requirements.filter((r) => r.level === "helpful").length} helpful
          </span>
          <ChevronDown size={14} />
        </summary>
        <p className="helper">
          Under the proposed rules, an unmet essential requirement caps D5c at 2
          under this candidate checklist. Explain necessity from the
          presentation and task, acceptable alternatives and the latest useful
          time to ask. The list is frozen with the run.
        </p>
        {requirements.map((r, i) => (
          <details className="evidence-entry" key={r.id}>
            <summary>
              <span className="requirement-level">{r.level}</span>
              <span>{r.requirement || "New candidate requirement"}</span>
              <ChevronDown size={14} />
            </summary>
            <label className="field">
              Classification
              <select
                disabled={frozen}
                value={r.level}
                onChange={(e) => editRequirement(i, "level", e.target.value)}
              >
                <option value="essential">Essential — candidate</option>
                <option value="helpful">Helpful — candidate</option>
              </select>
            </label>
            <label className="field">
              What information should be sought?
              <textarea
                disabled={frozen}
                value={r.requirement}
                onChange={(e) =>
                  editRequirement(i, "requirement", e.target.value)
                }
              />
            </label>
            <label className="field">
              Why is it needed at this point?
              <textarea
                disabled={frozen}
                value={r.presentation_based_rationale}
                onChange={(e) =>
                  editRequirement(
                    i,
                    "presentation_based_rationale",
                    e.target.value,
                  )
                }
              />
            </label>
            <label className="field">
              Acceptable requests or alternatives
              <textarea
                disabled={frozen}
                value={r.acceptable_requests_or_alternatives}
                onChange={(e) =>
                  editRequirement(
                    i,
                    "acceptable_requests_or_alternatives",
                    e.target.value,
                  )
                }
              />
            </label>
            <label className="field">
              Latest acceptable time
              <input
                disabled={frozen}
                value={r.deadline}
                onChange={(e) => editRequirement(i, "deadline", e.target.value)}
              />
            </label>
            <p className="helper">
              Requirement ID: {r.id} · awaiting confirmation
            </p>
            {!frozen && (
              <button
                className="text-button"
                onClick={() =>
                  change(
                    "requirements",
                    requirements.filter((_, n) => n !== i),
                  )
                }
              >
                <X size={13} /> Remove requirement
              </button>
            )}
          </details>
        ))}
        {!frozen && (
          <button className="secondary" onClick={addRequirement}>
            <Plus size={14} /> Add candidate requirement
          </button>
        )}
      </details>
      <details className="evidence-group">
        <summary>
          Record availability <span>Proposed D5c only</span>
          <ChevronDown size={14} />
        </summary>
        <label className="field">
          Selected records and factual simulator observations
          <textarea
            className="reviewer-context"
            disabled={frozen}
            value={record.availability_context}
            onChange={(e) => update("availability_context", e.target.value)}
            placeholder="List available or unavailable records and what was actually returned. Exclude model names, previous scores and audit verdicts. This information is sent only to D5c."
          />
        </label>
        <p className="muted">
          D5c uses the executed questions and eligible assessment notes.
          Numbered final questions count only when their deadline permits;
          general final recommendations do not count as requests. Model identity
          and previous audit verdicts are excluded from imported grading inputs.
        </p>
        {record.reviewer_context && (
          <label className="field">
            Historical reviewer notes (kept for reference; excluded from new
            grading)
            <textarea disabled value={record.reviewer_context} readOnly />
          </label>
        )}
      </details>
    </section>
  );
}
