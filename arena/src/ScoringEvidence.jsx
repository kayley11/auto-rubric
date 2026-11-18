import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import { itemResultText } from "./resultStatus.mjs";
import { ClinicalText } from "./ClinicalText";
import { prepareClinicalText, rawSelectorsToDisplay, displaySelectorsToRaw } from "./clinicalTextProjection.mjs";
import { pendingHighlight } from "./highlightSelection.mjs";
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
  const readingAnswer = useMemo(() => prepareClinicalText(answer || "No saved answer is available."), [answer]);
  const label = itemResultText(grade);
  const hasNumericGrade = label !== "" && Number.isFinite(Number(label));
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
  const [pending, setPending] = useState(null),
    [manualDrafts, setManualDrafts] = useState([]);
  const [note, setNote] = useState(""),
    [status, setStatus] = useState("awaiting_review");
  const [contributor, setContributor] = useContributor();
  const [access, setAccess] = useState(true),
    [message, setMessage] = useState(""),
    [saving, setSaving] = useState(false);
  const located = suggestions.filter((s) => s.status === "located");
  const manualIds = new Set(records.filter(r => r.origin === "manual").map(r => r.annotation_id));
  manualDrafts.forEach(annotation => manualIds.add(annotation.id));
  const automaticIds = new Set(located.map(s => s.id));
  records.filter(r => r.origin === "automatic" && rawSelectorsToDisplay(readingAnswer, r.selectors).length).forEach(r => automaticIds.add(r.annotation_id));
  const blueCount = automaticIds.size;
  const firstAutomatic = located[0] || (blueCount ? {id: [...automaticIds][0]} : null);
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
    setPending(null);
    setManualDrafts([]);
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
      selectors: record?.selectors || displaySelectorsToRaw(readingAnswer, annotation.target.selector),
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
      // Ordinary copy/selection must never silently create a reviewer mark.
      annotatingEnabled: false,
      style: (annotation) => {
        const type = annotation.bodies?.[0]?.value ||
          (String(annotation.id).startsWith("auto-") ? "automatic" : "manual");
        return {
          fill: type === "manual" ? "#a7d9c0" : "#b7d5fb",
          fillOpacity: 0.4,
          underlineColor: "#2866ad",
          underlineThickness: 1,
        };
      },
    });
    annoRef.current = anno;
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
          target: { selector: rawSelectorsToDisplay(readingAnswer, s.selectors) },
        },
      ]),
    );
    for (const record of records)
      annotations.set(record.annotation_id, {
        id: record.annotation_id,
        bodies: [{ purpose: "tagging", value: record.origin }],
        target: { selector: rawSelectorsToDisplay(readingAnswer, record.selectors) },
      });
    for (const annotation of manualDrafts)
      if (!annotations.has(annotation.id)) annotations.set(annotation.id, annotation);
    selectingRef.current = true;
    anno.setAnnotations([...annotations.values()]);
    selectingRef.current = false;
  }, [suggestions, records, answer, manualDrafts]);

  useEffect(() => {
    if (!pending) return;
    const dismiss = (event) => {
      if (event.type === "keydown" && event.key !== "Escape") return;
      if (event.type === "pointerdown" && event.target.closest?.(".trace-highlight-prompt")) return;
      setPending(null);
    };
    window.addEventListener("keydown", dismiss);
    window.addEventListener("pointerdown", dismiss);
    window.addEventListener("scroll", dismiss, true);
    return () => {
      window.removeEventListener("keydown", dismiss);
      window.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("scroll", dismiss, true);
    };
  }, [pending]);

  function offerHighlight() {
    setPending(pendingHighlight(textRef.current, window.getSelection(), readingAnswer));
  }

  function confirmHighlight() {
    if (!pending) return;
    const annotation = {
      id: `manual-${crypto.randomUUID()}`,
      bodies: [{purpose: "tagging", value: "manual"}],
      target: {selector: pending.displaySelectors},
    };
    setManualDrafts(old => [...old, annotation]);
    setSelected({id: annotation.id, selectors: pending.selectors, origin: "manual"});
    setNote("");
    setStatus("awaiting_review");
    setTab("evidence");
    setMessage("Highlight added in this view. Save an evidence note to keep it in the workspace. No rating has been submitted.");
    setPending(null);
    window.getSelection()?.removeAllRanges();
  }

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
            className={`trace-score${hasNumericGrade ? "" : " is-status"}`}
            onClick={() => setTab("rubric")}
            aria-label={`View rubric basis for ${criterion.id}: ${label}`}
          >
            {label}
          </button>
          <div>
            <span className="eyebrow">SAVED ASSESSMENT</span>
            <h3>
              {criterion.id} · {criterion.name}
            </h3>
            <p className="field-help">
              {grade.status === "applicability_pending"
                ? "A reviewer needs to decide whether this item can be assessed in this task. Read the saved reason below."
                : "Open the rubric basis or read the saved reason and its evidence links."}
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
            if (firstAutomatic) focusQuote(firstAutomatic);
          }}
        >
          <span className="trace-label">
            <MessageSquare size={15} /> Saved scoring reason{" "}
            <span>View evidence →</span>
          </span>
          <ClinicalText as="span" text={reason} />
        </button>
        <div className="trace-legend">
          <span className={blueCount ? "" : "is-empty"}>
            <span className="trace-dot auto" /> Blue · {blueCount} matched quotation{blueCount === 1 ? "" : "s"}
          </span>
          <span className={manualIds.size ? "" : "is-empty"}>
            <span className="trace-dot manual" /> Green · {manualIds.size} reviewer highlight{manualIds.size === 1 ? "" : "s"}{!access && <small> · saved notes require sign-in</small>}
          </span>
        </div>
        <div className="trace-link-summary" role="note">
          {firstAutomatic ? (
            <>
              <p>{blueCount} quotation link{blueCount === 1 ? "" : "s"} found for this item. The highlighted text may be further down the answer.</p>
              <button type="button" className="text-button" onClick={() => focusQuote(firstAutomatic)}>Go to first highlight</button>
              {suggestions.some(s => s.status !== "located") && <p>Other excerpts could not be linked automatically. See Quoted passages in the evidence panel.</p>}
            </>
          ) : (
            <p>{suggestions.length
              ? "No automatic highlight: the saved excerpts could not be linked to a unique passage. The evidence panel explains why."
              : "No automatic highlight: no answer quotation was saved for this item. You can still read the reason and the complete answer."}</p>
          )}
          <p className="field-help">Links apply to the selected assessment item. Green marks a confirmed highlight, not a submitted rating. Saved notes require workspace access. Colours do not indicate clinical correctness.</p>
        </div>
        <h3>Answer being evaluated</h3>
        <p className="field-help">
          <Highlighter size={14} /> Select text, then choose Highlight to mark it. Selecting or copying alone saves nothing. Blue links are awaiting review.
        </p>
        <div
          ref={textRef}
          className="trace-answer"
          aria-label="Annotatable saved answer"
          onMouseUp={offerHighlight}
          onKeyUp={(event) => { if (event.key !== "Escape") offerHighlight(); }}
        >
          <ClinicalText document={readingAnswer} text={answer || "No saved answer is available."} />
        </div>
        {pending && createPortal(
          <section className="trace-highlight-prompt" role="dialog" aria-label="Confirm passage highlight"
            style={{left: Math.max(12, Math.min(pending.rect.left, window.innerWidth - 382)), top: Math.max(12, Math.min(pending.rect.bottom + 8, window.innerHeight - 190))}}
            onMouseDown={(event) => event.preventDefault()}>
            <strong>Highlight this passage?</strong>
            <p>{pending.displaySelectors.map(s => s.quote).join(" … ")}</p>
            <small>This adds a highlight only. It does not submit a review.</small>
            <div><button type="button" className="secondary" onClick={() => setPending(null)}>Cancel</button><button type="button" className="primary" onClick={confirmHighlight}>Highlight</button></div>
          </section>, document.body
        )}
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
              <p className="trace-pending">{located.length ? "Automatic links · awaiting review" : "No automatic quote link for this item"}</p>
              <p className="field-help">
                A text match locates a quote. It does not confirm the reasoning
                or the grade.
              </p>
              {selectedAnchor && (
                <details className="trace-anchor-summary">
                  <summary>Saved grade {label} · rubric anchor</summary>
                  <ClinicalText as="p" text={selectedAnchor} />
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
                  <ClinicalText as="blockquote" text={s.original_quote} />
                  {s.status === "located" ? (
                    <div><button type="button" onClick={() => focusQuote(s)}>
                      Locate in answer · awaiting review
                    </button>{s.selectors.some(p => p.match_method === "formatting_only") && <p className="field-help">Same words after hiding formatting markers. No paraphrase matching was used.</p>}</div>
                  ) : (
                    <p className="trace-warning">
                      {s.status === "too_short"
                        ? "This excerpt is too short for automatic linking. Select the intended passage manually."
                        : s.status === "ambiguous"
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
                    <ClinicalText as="span" text={selected.selectors.map((s) => s.quote).join(" … ")} />
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
                  Select an existing highlight, or select new text and confirm Highlight to add a note.
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
                  <ClinicalText as="span" text={record.note} />
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
              <ClinicalText as="p" text={criterion.definition || "No definition is saved for this item."} />
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
                    <ClinicalText as="dd" text={text} />
                  </div>
                ))}
              </dl>
              {!selectedAnchor && (
                <p className="trace-warning">
                  No numerical anchor is selected for this saved result.
                </p>
              )}
              {rules.map((rule, i) => (
                <ClinicalText as="p" key={i} className="rule-definition" text={typeof rule === "string" ? rule : JSON.stringify(rule)} />
              ))}
              {criterion.context && (
                <details>
                  <summary>Additional scoring guidance</summary>
                  <ClinicalText as="p" text={criterion.context} />
                </details>
              )}
            </>
          )}
          {tab === "case" && (
            <>
              <h4>Information supplied to the answering model</h4>
              <ClinicalText as="p" text={facts || "See the saved case record for the complete supplied information."} />
              <h4>Original task</h4>
              <ClinicalText as="p" text={task || "Not recorded."} />
              {turns.length > 0 && <details><summary>Saved questions and information received</summary>{turns.map((turn, i) => <section key={i}><h4>Question {turn.number || i + 1}</h4><ClinicalText as="p" text={turn.question} />{turn.reply && <ClinicalText as="p" text={turn.reply} />}{typeof turn.records === "string" && <ClinicalText as="p" text={turn.records} />}{(turn.returned || []).map((fact,n) => <ClinicalText as="p" key={n} text={`${fact.patient_text || fact.text}${fact.context ? ` [${fact.context}]` : ""}`} />)}{turn.feedback && <ClinicalText as="p" text={turn.feedback} />}</section>)}</details>}
              {(reference || requirements?.length > 0) && (
                <details>
                  <summary>Scoring references · awaiting confirmation</summary>
                  <p className="field-help">
                    Judge-only material. Do not treat it as information received
                    by the answering model.
                  </p>
                  <ClinicalText as="p" text={reference} />
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
