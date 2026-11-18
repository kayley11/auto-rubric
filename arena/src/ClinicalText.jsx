import { useMemo } from "react";
import { prepareClinicalText } from "./clinicalTextProjection.mjs";
import "./clinical-text.css";

// No generated HTML is trusted. Every displayed character is a React text node.
// Keep textContent equal to document.text so Recogito offsets remain reproducible.
export function ClinicalText({ text, document: prepared, as: Element = "div", className = "", ...props }) {
  const parsed = useMemo(() => prepared || prepareClinicalText(text), [prepared, text]);
  return <Element {...props} data-notation-warning={parsed.notationWarnings?.length ? "Saved notation needs source verification" : undefined} title={parsed.notationWarnings?.length ? "Some notation in the saved text needs source verification. Original wording is retained." : props.title} className={`clinical-reading ${className}`.trim()}>{parsed.runs.map((run, i) => run.strong
    ? <strong className={run.heading ? "clinical-heading" : undefined} key={i}>{run.text}</strong>
    : <span key={i}>{run.text}</span>)}</Element>;
}
