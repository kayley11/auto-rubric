import { useEffect, useId, useState } from "react";
import { ChevronDown, FileText, Pencil } from "lucide-react";
import { caseCode } from "./caseIdentity.mjs";
import { caseContextData } from "./caseContextData.mjs";

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
                      <p className="case-prewrap">{content.description}</p>
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
                    <p className="case-prewrap">{content.facts}</p>
                  </section>
                  {content.history && (
                    <section>
                      <h4>Earlier conversation supplied</h4>
                      <p className="case-prewrap">{content.history}</p>
                    </section>
                  )}
                  {content.turns.length > 0 && (
                    <section>
                      <h4>Questions & information received</h4>
                      {content.turns.map((turn, i) => (
                        <details className="case-context-record" key={i}>
                          <summary>Question {i + 1}</summary>
                          <p className="case-prewrap">{turn.question}</p>
                          {turn.reply && (
                            <>
                              <h5>Reply</h5>
                              <p className="case-prewrap">{turn.reply}</p>
                            </>
                          )}
                          {turn.records && (
                            <>
                              <h5>Records returned</h5>
                              <p className="case-prewrap">{turn.records}</p>
                            </>
                          )}
                          {turn.feedback && (
                            <>
                              <h5>Environment feedback</h5>
                              <p className="case-prewrap">{turn.feedback}</p>
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
                            <p className="case-prewrap" key={i}>
                              {text}
                            </p>
                          ))}
                      </section>
                    )}
                </>
              )}
              {tab === "task" && (
                <>
                  <p className="case-prewrap">{content.task}</p>
                  {content.decision_point && (
                    <section>
                      <h4>Decision point</h4>
                      <p className="case-prewrap">{content.decision_point}</p>
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
                          <p className="case-prewrap">{content.reference}</p>
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
                                <p className="case-prewrap" key={n}>
                                  {text}
                                </p>
                              ))}
                          </section>
                        ))}
                      </details>
                    )}
                </>
              )}
              {tab === "answer" && (
                <p className="case-prewrap">{content.answer}</p>
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
