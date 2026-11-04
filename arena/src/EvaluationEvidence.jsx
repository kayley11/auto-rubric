import { useState } from "react";
import { ChevronDown, Plus, X } from "lucide-react";

export const revisedId = "josh-proposed-20261024";
export const blankInterview = () => ({
  turns: [],
  max_questions: 6,
  complete: false,
  notes_allowed: false,
  decision_point: "Answer to the supplied written case",
  synthesis_scope:
    "Use the stated task to determine whether synthesis is in scope.",
  closing_notes: "",
  reviewer_context: "",
  availability_context: "",
});

export function AdditionalEvidence({ form, change, frozen, pending }) {
  const [adding, setAdding] = useState(false);
  const record = { ...blankInterview(), ...form.interview };
  const update = (key, value) =>
    change("interview", { ...record, [key]: value });
  const edit = (i, key, value) =>
    update(
      "turns",
      record.turns.map((t, n) => (n === i ? { ...t, [key]: value } : t)),
    );
  const acquisition = form.criteria.includes("D5c");
  const visible =
    adding ||
    form.history ||
    record.turns.length ||
    record.complete ||
    form.interview_source?.source_sha256 ||
    acquisition;
  return (
    <details className="extra-context additional-evidence">
      <summary>
        <span>
          Additional evidence{" "}
          <small>
            optional
            {record.turns.length
              ? ` · ${record.turns.length} questions recorded`
              : ""}
          </small>
        </span>
        <ChevronDown size={14} />
      </summary>
      <p className="field-help">
        Existing conversation and information actually supplied to the answering
        model. Relevant rubric items use this evidence.
      </p>
      {!visible && !frozen && (
        <button
          type="button"
          className="secondary"
          disabled={pending}
          onClick={() => setAdding(true)}
        >
          <Plus size={14} /> Add an existing conversation
        </button>
      )}
      {!!visible && (
        <>
          {form.interview_source?.source_sha256 && (
            <p className="evidence-provenance">
              Saved conversation: {form.interview_source.case_id}. This
              evaluation is saved separately.
            </p>
          )}
          <label className="field">
            Earlier conversation <span className="optional">optional</span>
            <textarea
              disabled={frozen || pending}
              value={form.history}
              placeholder="Paste the earlier user messages and answers actually supplied for this task."
              onChange={(e) => change("history", e.target.value)}
            />
          </label>
          <details className="evidence-group">
            <summary>
              Questions asked & replies received{" "}
              <span>{record.turns.length} recorded</span>
              <ChevronDown size={14} />
            </summary>
            <p className="helper">
              Keep each actual question with its reply and any records returned.
              Preserve dates and admission context.
            </p>
            {record.turns.map((turn, i) => (
              <details className="evidence-entry" key={i}>
                <summary>
                  <b>Q{i + 1}</b>
                  <span>{turn.question || "New recorded question"}</span>
                  <ChevronDown size={14} />
                </summary>
                <label className="field">
                  Actual question
                  <textarea
                    disabled={frozen || pending}
                    value={turn.question}
                    onChange={(e) => edit(i, "question", e.target.value)}
                  />
                </label>
                <label className="field">
                  Reply received
                  <textarea
                    disabled={frozen || pending}
                    value={turn.reply}
                    onChange={(e) => edit(i, "reply", e.target.value)}
                  />
                </label>
                <label className="field">
                  Records returned, including dates and context
                  <textarea
                    disabled={frozen || pending}
                    value={turn.records}
                    onChange={(e) => edit(i, "records", e.target.value)}
                  />
                </label>
                <details className="evidence-group">
                  <summary>
                    Saved notes & environment feedback
                    <ChevronDown size={14} />
                  </summary>
                  <label className="field">
                    Assessment note saved before the reply
                    <textarea
                      disabled={frozen || pending}
                      value={turn.notes}
                      onChange={(e) => edit(i, "notes", e.target.value)}
                    />
                  </label>
                  <label className="field">
                    Environment feedback received
                    <textarea
                      disabled={frozen || pending}
                      value={turn.feedback}
                      onChange={(e) => edit(i, "feedback", e.target.value)}
                    />
                  </label>
                </details>
                {!frozen && (
                  <button
                    type="button"
                    className="text-button"
                    disabled={pending}
                    onClick={() =>
                      update(
                        "turns",
                        record.turns.filter((_, n) => n !== i),
                      )
                    }
                  >
                    <X size={13} /> Remove recorded question
                  </button>
                )}
              </details>
            ))}
            {!frozen && (
              <button
                type="button"
                className="secondary"
                disabled={
                  pending || record.turns.length >= record.max_questions
                }
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
                <Plus size={14} /> Add a recorded question
              </button>
            )}
          </details>
          <label className="checkbox-label">
            <input
              type="checkbox"
              disabled={frozen || pending}
              checked={record.complete}
              onChange={(e) => update("complete", e.target.checked)}
            />
            This is the complete question record, including when no questions
            were asked.
          </label>
          {acquisition && (
            <p className="field-help">
              For information seeking (D5c), record actual questions or confirm
              a complete record with none asked. Having an opportunity but not
              asking is different from having no opportunity.
            </p>
          )}
          <details className="evidence-group">
            <summary>
              Conversation settings & saved assessment notes
              <ChevronDown size={14} />
            </summary>
            <label className="field short-field">
              Question limit allowed by this task
              <input
                type="number"
                min="1"
                max="50"
                disabled={frozen || pending}
                value={record.max_questions}
                onChange={(e) =>
                  update("max_questions", Number(e.target.value))
                }
              />
            </label>
            <label className="field">
              When is this answer assessed?
              <input
                disabled={frozen || pending}
                value={record.decision_point}
                onChange={(e) => update("decision_point", e.target.value)}
              />
            </label>
            <label className="field">
              What summary does the task require?
              <textarea
                rows={2}
                disabled={frozen || pending}
                value={record.synthesis_scope}
                onChange={(e) => update("synthesis_scope", e.target.value)}
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                disabled={frozen || pending}
                checked={record.notes_allowed}
                onChange={(e) => update("notes_allowed", e.target.checked)}
              />
              Assessment notes were specified as part of the task and can
              explain requests.
            </label>
            <label className="field">
              Closing assessment note, if saved
              <textarea
                disabled={frozen || pending}
                value={record.closing_notes}
                onChange={(e) => update("closing_notes", e.target.value)}
              />
            </label>
            <p className="field-help">
              A saved note may justify a request; it does not count as making
              the request. Notes remain separate from the patient information
              used for problem representation.
            </p>
          </details>
        </>
      )}
    </details>
  );
}

export function ScoringReferences({
  form,
  change,
  frozen,
  pending,
  hasGrades,
  revised,
}) {
  const record = { ...blankInterview(), ...form.interview };
  const requirements = form.requirements || [];
  const update = (key, value) =>
    change("interview", { ...record, [key]: value });
  const edit = (index, key, value) =>
    change(
      "requirements",
      requirements.map((r, i) => (i === index ? { ...r, [key]: value } : r)),
    );
  const add = () => {
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
  const acquisition = form.criteria.includes("D5c");
  return (
    <details className="extra-context scoring-references">
      <summary>
        <span>
          Scoring references <small>For scoring only · optional</small>
        </span>
        <ChevronDown size={14} />
      </summary>
      <p className="field-help">
        Not sent to the answering model. Clinical reference points and candidate
        information requirements are awaiting confirmation.
      </p>
      <label className="field">
        Reference points
        <textarea
          disabled={hasGrades || pending}
          value={form.reference}
          placeholder="Known facts, expected points, acceptable alternatives and essential safety points."
          onChange={(e) => change("reference", e.target.value)}
        />
      </label>
      <label className="field">
        Reference status
        <select
          disabled={hasGrades || pending || revised}
          value={form.reference_status}
          onChange={(e) => change("reference_status", e.target.value)}
        >
          <option value="draft">Draft — awaiting confirmation</option>
          <option value="clinician_checked">Clinician checked</option>
          <option value="none">No reference supplied</option>
        </select>
      </label>
      {(acquisition || requirements.length > 0) && (
        <details className="evidence-group">
          <summary>
            Candidate information requirements{" "}
            <span>{requirements.length} recorded · D5c</span>
            <ChevronDown size={14} />
          </summary>
          <p className="helper">
            For information seeking (D5c). Explain why each requirement is
            needed at this point, acceptable alternatives and when it must be
            requested. These requirements do not enter the
            problem-representation (D3a) evidence window.
          </p>
          {!revised && (
            <p className="field-help">
              The original definitions do not apply the revised candidate
              checklist. Any saved entries are retained.
            </p>
          )}
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
                  disabled={frozen || pending}
                  value={r.level}
                  onChange={(e) => edit(i, "level", e.target.value)}
                >
                  <option value="essential">Essential — candidate</option>
                  <option value="helpful">Helpful — candidate</option>
                </select>
              </label>
              <label className="field">
                Information to request
                <textarea
                  disabled={frozen || pending}
                  value={r.requirement}
                  onChange={(e) => edit(i, "requirement", e.target.value)}
                />
              </label>
              <label className="field">
                Why is it needed at this point?
                <textarea
                  disabled={frozen || pending}
                  value={r.presentation_based_rationale}
                  onChange={(e) =>
                    edit(i, "presentation_based_rationale", e.target.value)
                  }
                />
              </label>
              <label className="field">
                Acceptable requests or alternatives
                <textarea
                  disabled={frozen || pending}
                  value={r.acceptable_requests_or_alternatives}
                  onChange={(e) =>
                    edit(
                      i,
                      "acceptable_requests_or_alternatives",
                      e.target.value,
                    )
                  }
                />
              </label>
              <label className="field">
                Latest useful time to ask
                <input
                  disabled={frozen || pending}
                  value={r.deadline}
                  onChange={(e) => edit(i, "deadline", e.target.value)}
                />
              </label>
              <p className="field-help">{r.id} · awaiting confirmation</p>
              {!frozen && (
                <button
                  type="button"
                  className="text-button"
                  disabled={pending}
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
            <button
              type="button"
              className="secondary"
              disabled={pending}
              onClick={add}
            >
              <Plus size={14} /> Add candidate requirement
            </button>
          )}
        </details>
      )}
      {(acquisition ||
        record.availability_context ||
        record.reviewer_context) && (
        <details className="evidence-group">
          <summary>
            Record availability for scoring <span>D5c</span>
            <ChevronDown size={14} />
          </summary>
          <label className="field">
            Available records and factual simulator observations
            <textarea
              disabled={frozen || pending}
              value={record.availability_context}
              onChange={(e) => update("availability_context", e.target.value)}
              placeholder="What was available or unavailable, and what was actually returned. Exclude model names, previous scores and audit verdicts."
            />
          </label>
          {record.reviewer_context && (
            <label className="field">
              Historical reviewer notes — excluded from new scoring
              <textarea disabled readOnly value={record.reviewer_context} />
            </label>
          )}
        </details>
      )}
    </details>
  );
}
