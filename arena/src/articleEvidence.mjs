// Browser offsets are UTF-16; Python code-point offsets are kept for audit only.
export function sourceMatchLabel(item) {
  if (item.grounding !== "exact") return "Not a verbatim source match · review before use";
  const labels = {
    archived_exact_passage: "Saved source paragraph · exact position",
    unique_whitespace_match: "Source match · whitespace aligned",
    unique_pdf_layout_match: "Source match · PDF layout aligned",
    unique_typography_match: "Source match · typography aligned",
    verified_source_quote_restoration: "Original source quote restored · citation markers retained",
    auditor_added_exact_quote: "Source supplement · exact quotation",
  };
  return labels[item.grounding_method] || "Exact source match";
}

export function sourceSegments(block, items) {
  const matches = items.filter(
    (i) =>
      i.grounding === "exact" &&
      i.position &&
      i.position.start_utf16 < block.end_utf16 &&
      i.position.end_utf16 > block.start_utf16,
  );
  const cuts = new Set([0, block.text.length]);
  for (const item of matches) {
    cuts.add(Math.max(0, item.position.start_utf16 - block.start_utf16));
    cuts.add(
      Math.min(block.text.length, item.position.end_utf16 - block.start_utf16),
    );
  }
  const points = [...cuts].sort((a, b) => a - b);
  return points.slice(0, -1).map((start, index) => {
    const end = points[index + 1];
    return {
      text: block.text.slice(start, end),
      start,
      ids: matches
        .filter(
          (i) =>
            i.position.start_utf16 < block.start_utf16 + end &&
            i.position.end_utf16 > block.start_utf16 + start,
        )
        .map((i) => i.id),
    };
  });
}

export function draftCounts(items = []) {
  return items.reduce(
    (counts, item) => ({
      ...counts,
      [item.visibility]: counts[item.visibility] + 1,
    }),
    { visible: 0, hidden: 0, uncertain: 0, exclude: 0 },
  );
}

export function visibleDraft(draft) {
  return [
    draft?.visible_context,
    ...(draft?.items || [])
      .filter((i) => i.visibility === "visible")
      .map((i) => i.text),
  ]
    .filter(Boolean)
    .join("\n\n");
}
