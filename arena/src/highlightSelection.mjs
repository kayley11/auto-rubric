import { displaySelectorsToRaw } from "./clinicalTextProjection.mjs";

// Reading a browser selection does not create or save an annotation.
export function pendingHighlight(container, selection, document) {
  if (!container || !selection || selection.isCollapsed || selection.rangeCount !== 1) return null;
  const range = selection.getRangeAt(0);
  if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) return null;
  const before = range.cloneRange();
  before.selectNodeContents(container);
  before.setEnd(range.startContainer, range.startOffset);
  const selected = range.toString();
  const leading = selected.length - selected.trimStart().length;
  const trailing = selected.length - selected.trimEnd().length;
  const start = before.toString().length + leading;
  const end = start + selected.length - leading - trailing;
  if (end <= start) return null;
  const displaySelectors = [{start, end, quote: document.text.slice(start, end)}];
  const selectors = displaySelectorsToRaw(document, displaySelectors);
  if (!selectors.length || displaySelectors[0].quote !== selected.trim()) return null;
  const rect = range.getBoundingClientRect();
  return {selectors, displaySelectors, rect: {left: rect.left, bottom: rect.bottom}};
}
