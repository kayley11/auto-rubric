import { useEffect, useId, useState } from "react";
import { ChevronDown, FileText, Pencil } from "lucide-react";
import { caseCode } from "./caseIdentity.mjs";
import { caseContextData } from "./caseContextData.mjs";
import { ClinicalText } from "./ClinicalText";

export function CaseContext({ data, children, onEdit, blind = false }) {
  const [open, setOpen] = useState(
    () => window.matchMedia("(min-width: 1100px)").matches,
  );
  const [tab, setTab] = useState("facts");
  const id = useId();
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1100px)");
    const resize = () => setOpen(media.matches);
    media.addEventListener("change", resize);
    return () => media.removeEventListener("change", resize);
  }, []);
  useEffect(() => setTab("facts"), [data?.case_code, data?.case_id]);
  if (!data?.facts) return children;
  const content = caseContextData(data, blind);
  const tabs = [
    ["facts", "Case"],
    ["task", "Task"],
    ...(data.answer ? [["answer", "Answer"]] : []),
  ];
  return (
    <div className="analysis-with-case">
      <div className="analysis-main">{children}</div>
      <aside
        className={`case-context-panel ${open ? "is-open" : ""}`}
        aria-label="Case details alongside analysis"
      >
        <button
          type="button"
          className="case-context-heading"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((value) => !value)}
        >
          <FileText size={17} />
          <span>
            <b>Case details</b>
            <code>{caseCode(data)}</code>
          </span>
          <ChevronDown size={16} />
        </button>
        {open && (
          <div id={id} className="case-context-content">
            <nav aria-label="Pinned case content">
              {tabs.map(([key, label]) => (
                <button
                  type="button"
                  key={key}
                  aria-pressed={tab === key}
                  className={tab === key ? "selected" : ""}
                  onClick={() => setTab(key)}
                >
                  {label}
                </button>
              ))}
            </nav>
            <div className="case-context-scroll">
              {tab === "facts" && (
                <>
                  {content.title && (
                    <p className="case-context-title">{content.title}</p>
                  )}
                  {content.description && (
                    <section>
                      <h4>Description</h4>
                      <ClinicalText as="p" text={content.description} />
                    </section>
                  )}
                  {(content.audience || content.task_type) && (
                    <dl className="case-context-metadata">
                      {content.audience && (
                        <div>
                          <dt>Audience</dt>
                          <dd>{content.audience}</dd>
                        </div>
                      )}
                      {content.task_type && (
                        <div>
                          <dt>Task type</dt>
                          <dd>{content.task_type}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                  <section>
                    <h4>Case facts supplied</h4>
                    <ClinicalText as="p" text={content.facts} />
                  </section>
                  {content.history && (
                    <section>
                      <h4>Earlier conversation supplied</h4>
                      <ClinicalText as="p" text={content.history} />
                    </section>
                  )}
                  {content.turns.length > 0 && (
                    <section>
                      <h4>Questions & information received</h4>
                      {content.turns.map((turn, i) => (
                        <details className="case-context-record" key={i}>
                          <summary>Question {i + 1}</summary>
                          <ClinicalText as="p" text={turn.question} />
                          {turn.reply && (
                            <>
                              <h5>Reply</h5>
                              <ClinicalText as="p" text={turn.reply} />
                            </>
                          )}
                          {turn.records && (
                            <>
                              <h5>Records returned</h5>
                              <ClinicalText as="p" text={turn.records} />
                            </>
                          )}
                          {turn.feedback && (
                            <>
                              <h5>Environment feedback</h5>
                              <ClinicalText as="p" text={turn.feedback} />
                            </>
                          )}
                        </details>
                      ))}
                    </section>
                  )}
                  {!blind &&
                    (content.source ||
                      content.source_location ||
                      content.source_note) && (
                      <section className="case-context-source">
                        <h4>Original source</h4>
                        {[
                          content.source,
                          content.source_location,
                          content.source_note,
                        ]
                          .filter(Boolean)
                          .map((text, i) => (
                            <ClinicalText as="p" key={i} text={text} />
                          ))}
                      </section>
                    )}
                </>
              )}
              {tab === "task" && (
                <>
                  <ClinicalText as="p" text={content.task} />
                  {content.decision_point && (
                    <section>
                      <h4>Decision point</h4>
                      <ClinicalText as="p" text={content.decision_point} />
                    </section>
                  )}
                  {!blind &&
                    (content.reference || content.requirements.length > 0) && (
                      <details className="case-context-record">
                        <summary>
                          Scoring references · awaiting confirmation
                        </summary>
                        <p className="field-help">
                          For scoring only. Not information supplied to the
                          answering model.
                        </p>
                        {content.reference && (
                          <ClinicalText as="p" text={content.reference} />
                        )}
                        {content.requirements.map((r, i) => (
                          <section key={r.id || i}>
                            <h5>
                              {r.id} · {r.level}
                            </h5>
                            {[
                              r.requirement,
                              r.presentation_based_rationale,
                              r.acceptable_requests_or_alternatives,
                              r.deadline,
                            ]
                              .filter(Boolean)
                              .map((text, n) => (
                                <ClinicalText as="p" key={n} text={text} />
                              ))}
                          </section>
                        ))}
                      </details>
                    )}
                </>
              )}
              {tab === "answer" && (
                <ClinicalText as="p" text={content.answer} />
              )}
            </div>
            {onEdit ? (
              <button
                type="button"
                className="text-button case-context-edit"
                onClick={onEdit}
              >
                <Pencil size={14} /> Edit as a new evaluation
              </button>
            ) : (
              <p className="case-context-note">
                Saved case information; original wording retained.
              </p>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
