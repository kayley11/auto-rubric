import { useEffect, useMemo, useRef, useState } from "react";
import { createTextAnnotator } from "@recogito/text-annotator";
import "@recogito/text-annotator/text-annotator.css";
import {
  BookOpen,
  Highlighter,
  MessageSquare,
  Quote,
  Save,
} from "lucide-react";
import { evidenceContext, suggestedEvidence } from "./evidenceLinks.mjs";
import { useContributor } from "./ContributorFields";
import "./scoring-evidence.css";

export function ScoringEvidence({
  caseId,
  answerKey,
  answer = "",
  criterion,
  grade = {},
  version,
  facts,
  task,
  turns = [],
  reference,
  requirements,
  onItemChange,
  items,
}) {
  const reason =
    grade.reason ||
    grade.explanation ||
    grade.error ||
    "No saved explanation for this item.";
  const criterionText = JSON.stringify(criterion);
  const label = grade.label ?? grade.score ?? "Not assessed";
  const suggestions = useMemo(
    () => suggestedEvidence(answer, reason, grade.evidence_quote),
    [answer, reason, grade.evidence_quote],
  );
  const textRef = useRef(null),
    annoRef = useRef(null),
    selectingRef = useRef(false);
  const [snapshot, setSnapshot] = useState(null),
    [records, setRecords] = useState([]);
  const [selected, setSelected] = useState(null),
    [tab, setTab] = useState("evidence");
  const [note, setNote] = useState(""),
    [status, setStatus] = useState("awaiting_review");
  const [contributor, setContributor] = useContributor();
  const [access, setAccess] = useState(true),
    [message, setMessage] = useState(""),
    [saving, setSaving] = useState(false);
  const located = suggestions.filter((s) => s.status === "located");
  const anchors = criterion?.anchors || {};
  const selectedAnchor = anchors[String(label)];
  const rules = [
    criterion?.decision_point_rule,
    criterion?.equivalence_rule,
    ...(criterion?.essential_scoring_rules || []),
    ...(criterion?.relationship_to_D5c || []),
    criterion?.notes_vs_patient_directed_explanations,
    criterion?.applicability,
  ].filter(Boolean);

  useEffect(() => {
    let active = true;
    setSnapshot(null);
    setRecords([]);
    setSelected(null);
    setNote("");
    setStatus("awaiting_review");
    setMessage("");
    setTab("evidence");
    evidenceContext({ caseId, answerKey, answer, reason, criterion, version })
      .then(async (value) => {
        if (!active) return;
        setSnapshot(value);
        const r = await fetch(`/api/evidence-annotations/${value.id}`, {
          cache: "no-store",
        });
        if (!active) return;
          if (r.status === 401 || r.status === 403 || r.status === 404) {
          setAccess(false);
          return;
        }
        if (!r.ok)
          throw new Error(
            "Saved notes could not be loaded. The original answer and grades are still available.",
          );
        setAccess(true);
        setRecords((await r.json()).annotations || []);
      })
      .catch((e) => {
        if (active) setMessage(e.message);
      });
    return () => {
      active = false;
    };
  }, [caseId, answerKey, answer, reason, criterionText, version]);

  function selectAnnotation(annotation) {
    if (!annotation) return;
    const record = records.find((r) => r.annotation_id === annotation.id);
    setSelected({
      id: annotation.id,
      selectors: annotation.target.selector,
      origin:
        record?.origin ||
        (String(annotation.id).startsWith("auto-") ? "automatic" : "manual"),
    });
    setNote(record?.note || "");
    setStatus(record?.status || "awaiting_review");
    setTab("evidence");
    setMessage("");
  }

  const selectedHandler = useRef(selectAnnotation);
  selectedHandler.current = selectAnnotation;
  useEffect(() => {
    if (!textRef.current || !answer) return;
    const anno = createTextAnnotator(textRef.current, {
      annotatingEnabled: true,
      style: (annotation) => {
        const type = annotation.bodies?.[0]?.value;
        return {
          fill: type === "manual" ? "#a7d9c0" : "#b7d5fb",
          fillOpacity: 0.4,
          underlineColor: "#2866ad",
          underlineThickness: 1,
        };
      },
    });
    annoRef.current = anno;
    anno.on("createAnnotation", (annotation) =>
      selectedHandler.current(annotation),
    );
    anno.on("selectionChanged", (annotations) => {
      if (!selectingRef.current && annotations.length)
        selectedHandler.current(annotations[0]);
    });
    return () => {
      annoRef.current = null;
      anno.destroy();
    };
  }, [answer]);

  useEffect(() => {
    const anno = annoRef.current;
    if (!anno) return;
    const annotations = new Map(
      located.map((s) => [
        s.id,
        {
          id: s.id,
          bodies: [{ purpose: "tagging", value: "automatic" }],
          target: { selector: s.selectors },
        },
      ]),
    );
    for (const record of records)
      annotations.set(record.annotation_id, {
        id: record.annotation_id,
        bodies: [{ purpose: "tagging", value: record.origin }],
        target: { selector: record.selectors },
      });
    selectingRef.current = true;
    anno.setAnnotations([...annotations.values()]);
    selectingRef.current = false;
  }, [suggestions, records, answer]);

  function focusQuote(suggestion) {
    const anno = annoRef.current;
    const annotation = anno?.getAnnotationById(suggestion.id);
    if (annotation) {
      anno.setSelected(suggestion.id);
      anno.scrollIntoView(suggestion.id);
      selectAnnotation(annotation);
    }
  }

  async function saveNote() {
    if (!selected || !snapshot || saving) return;
    setSaving(true);
    setMessage("");
    try {
      const r = await fetch("/api/evidence-annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: snapshot.context,
          answer,
          reason,
          rubric_text: snapshot.rubricText,
          annotation_id: selected.id,
          selectors: selected.selectors,
          origin: selected.origin,
          reviewer: contributor,
          note,
          status,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "The note could not be saved.");
      setRecords(data.annotations || []);
      setMessage(
        "Note saved to this workspace. Original score and output retained.",
      );
    } catch (e) {
      setMessage(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="trace-layout" aria-label="Linked scoring evidence">
      <div className="trace-main">
        <div className="trace-score-heading">
          <button
            type="button"
            className="trace-score"
            onClick={() => setTab("rubric")}
            aria-label={`View rubric basis for ${criterion.id} score ${label}`}
          >
            {label}
          </button>
          <div>
            <span className="eyebrow">SAVED ASSESSMENT</span>
            <h3>
              {criterion.id} · {criterion.name}
            </h3>
            <p className="field-help">
              Click the score for its rubric basis, or the reason for evidence
              links.
            </p>
          </div>
        </div>
        {items?.length > 1 && (
          <label className="field">
            Assessment item
            <select
              aria-label="Linked assessment item"
              value={criterion.id}
              onChange={(e) => onItemChange?.(e.target.value)}
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id} · {item.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          className="trace-reason"
          type="button"
          onClick={() => {
            setTab("evidence");
            if (located.length) focusQuote(located[0]);
          }}
        >
          <span className="trace-label">
            <MessageSquare size={15} /> Saved scoring reason{" "}
            <span>View evidence →</span>
          </span>
          <span className="case-prewrap">{reason}</span>
        </button>
        <div className="trace-legend">
          <span>
            <span className="trace-dot auto" /> Suggested quote link
          </span>
          <span>
            <span className="trace-dot manual" /> Reviewer selection
          </span>
        </div>
        <h3>Answer being evaluated</h3>
        <p className="field-help">
          <Highlighter size={14} /> Select a passage to add a note. Blue
          highlights locate quoted text; automatic links are awaiting review.
        </p>
        <div
          ref={textRef}
          className="trace-answer"
          aria-label="Annotatable saved answer"
        >
          {answer || "No saved answer is available."}
        </div>
      </div>
      <aside
        className="trace-basis"
        aria-label="Scoring basis alongside the answer"
      >
        <header>
          <BookOpen size={17} />
          <div>
            <strong>Scoring evidence</strong>
            <small>
              {caseId} · {criterion.id}
            </small>
          </div>
        </header>
        <nav aria-label="Evidence panel">
          <button
            type="button"
            aria-pressed={tab === "evidence"}
            onClick={() => setTab("evidence")}
          >
            Evidence
          </button>
          <button
            type="button"
            aria-pressed={tab === "rubric"}
            onClick={() => setTab("rubric")}
          >
            Rubric
          </button>
          <button
            type="button"
            aria-pressed={tab === "case"}
            onClick={() => setTab("case")}
          >
            Case
          </button>
        </nav>
        <div className="trace-basis-scroll">
          {tab === "evidence" && (
            <>
              <p className="trace-pending">Automatic links · awaiting review</p>
              <p className="field-help">
                A text match locates a quote. It does not confirm the reasoning
                or the grade.
              </p>
              {selectedAnchor && (
                <details className="trace-anchor-summary">
                  <summary>Saved grade {label} · rubric anchor</summary>
                  <p>{selectedAnchor}</p>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setTab("rubric")}
                  >
                    View definition and all levels
                  </button>
                </details>
              )}
              <h4>Quoted passages</h4>
              {!suggestions.length && (
                <p>
                  No explicit quotation was saved in the reason. Select the
                  relevant answer text for a manual link. No supporting passage
                  has been inferred automatically.
                </p>
              )}
              {suggestions.map((s) => (
                <div className="trace-quote" key={s.id}>
                  <blockquote>{s.original_quote}</blockquote>
                  {s.status === "located" ? (
                    <button type="button" onClick={() => focusQuote(s)}>
                      Locate in answer · awaiting review
                    </button>
                  ) : (
                    <p className="trace-warning">
                      {s.status === "ambiguous"
                        ? `Appears ${s.count} times. Select the intended passage manually.`
                        : "Not located verbatim in this answer. It may be a paraphrase, refer to other evidence or need correction."}
                    </p>
                  )}
                </div>
              ))}
              <details className="trace-omission">
                <summary>When the reason describes an omission</summary>
                <p>
                  An omission has no passage to highlight. Check the stated
                  requirement, task and complete answer. An unmatched quote does
                  not establish an omission.
                </p>
              </details>
              <h4>Review notes</h4>
              {!access && (
                <p className="trace-warning">
                  Sign in with workspace access to load and save notes.
                </p>
              )}
              {selected ? (
                <div className="trace-note-editor">
                  <span className="trace-label">
                    <Quote size={14} /> Selected answer passage
                  </span>
                  <blockquote>
                    {selected.selectors.map((s) => s.quote).join(" … ")}
                  </blockquote>
                  <label className="field">
                    Reviewer ID
                    <input
                      aria-label="Evidence reviewer ID"
                      value={contributor}
                      onChange={(e) => setContributor(e.target.value)}
                      maxLength={80}
                      placeholder="e.g. R01"
                    />
                  </label>
                  <label className="field">
                    Evidence-link status
                    <select
                      aria-label="Evidence-link status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="awaiting_review">Awaiting review</option>
                      <option value="checked">Link checked by reviewer</option>
                      <option value="rejected">
                        Link rejected by reviewer
                      </option>
                    </select>
                  </label>
                  <label className="field">
                    Note
                    <textarea
                      aria-label="Evidence annotation note"
                      rows={4}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Explain how this passage relates to the rubric, or identify a problem."
                      maxLength={6000}
                    />
                  </label>
                  <button
                    className="primary trace-save"
                    type="button"
                    disabled={
                      !access ||
                      !snapshot ||
                      saving ||
                      !note.trim() ||
                      !contributor.trim()
                    }
                    onClick={saveNote}
                  >
                    <Save size={14} />
                    {saving ? "Saving…" : "Save evidence note"}
                  </button>
                  <p className="field-help">
                    Checks this link only. It does not change the score or
                    confirm the clinical reference.
                  </p>
                </div>
              ) : (
                <p>
                  Select a highlighted or new passage in the answer to add a
                  note.
                </p>
              )}
              {message && (
                <p className="trace-message" role="status">
                  {message}
                </p>
              )}
              {records.map((record) => (
                <button
                  key={record.annotation_id}
                  type="button"
                  className="trace-saved-note"
                  onClick={() => focusQuote({ id: record.annotation_id })}
                >
                  <strong>
                    {record.reviewer} ·{" "}
                    {record.status === "checked"
                      ? "Link checked"
                      : record.status === "rejected"
                        ? "Link rejected"
                        : "Awaiting review"}
                  </strong>
                  <span>{record.note}</span>
                  <small>
                    {record.revision_count} saved revision
                    {record.revision_count === 1 ? "" : "s"}
                  </small>
                </button>
              ))}
            </>
          )}
          {tab === "rubric" && (
            <>
              <p className="trace-version">
                Saved rubric version
                <br />
                <code>{version || "Not recorded"}</code>
              </p>
              <h4>
                {criterion.id} · {criterion.name}
              </h4>
              <p>
                {criterion.definition ||
                  "No definition is saved for this item."}
              </p>
              <dl className="trace-levels">
                {Object.entries(anchors).map(([level, text]) => (
                  <div
                    key={level}
                    className={String(label) === level ? "selected" : ""}
                  >
                    <dt>
                      {level}
                      {String(label) === level && <small>Saved grade</small>}
                    </dt>
                    <dd>{text}</dd>
                  </div>
                ))}
              </dl>
              {!selectedAnchor && (
                <p className="trace-warning">
                  No numerical anchor is selected for this saved result.
                </p>
              )}
              {rules.map((rule, i) => (
                <p key={i} className="rule-definition">
                  {typeof rule === "string" ? rule : JSON.stringify(rule)}
                </p>
              ))}
              {criterion.context && (
                <details>
                  <summary>Additional scoring guidance</summary>
                  <p className="case-prewrap">{criterion.context}</p>
                </details>
              )}
            </>
          )}
          {tab === "case" && (
            <>
              <h4>Information supplied to the answering model</h4>
              <p className="case-prewrap">
                {facts ||
                  "See the saved case record for the complete supplied information."}
              </p>
              <h4>Original task</h4>
              <p className="case-prewrap">{task || "Not recorded."}</p>
              {turns.length > 0 && <details><summary>Saved questions and information received</summary>{turns.map((turn, i) => <section key={i}><h4>Question {turn.number || i + 1}</h4><p className="case-prewrap">{turn.question}</p>{turn.reply && <p className="case-prewrap">{turn.reply}</p>}{typeof turn.records === "string" && <p className="case-prewrap">{turn.records}</p>}{(turn.returned || []).map((fact,n) => <p className="case-prewrap" key={n}>{fact.patient_text || fact.text}{fact.context ? ` [${fact.context}]` : ""}</p>)}{turn.feedback && <p className="case-prewrap">{turn.feedback}</p>}</section>)}</details>}
              {(reference || requirements?.length > 0) && (
                <details>
                  <summary>Scoring references · awaiting confirmation</summary>
                  <p className="field-help">
                    Judge-only material. Do not treat it as information received
                    by the answering model.
                  </p>
                  <p className="case-prewrap">{reference}</p>
                  {requirements?.length > 0 && (
                    <pre>{JSON.stringify(requirements, null, 2)}</pre>
                  )}
                </details>
              )}
            </>
          )}
        </div>
        <footer>
          Clinical reference · awaiting confirmation
          <br />
          Saved answer and original output retained.
        </footer>
      </aside>
    </section>
  );
}
