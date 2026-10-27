// Display wording only: saved source files and internal version IDs stay intact.
export function displayText(value) {
  return String(value)
    .replace(/_pending_Josh\b/gi, "_awaiting_confirmation")
    .replace(/josh-proposed-/gi, "proposed-")
    .replace(
      /(?:awaiting|await|pending|subject to)\s+Josh['’]s\s+(?:confirmation|review)/gi,
      "awaiting confirmation",
    )
    .replace(
      /Josh['’]s proposed D3a\s*\/\s*D5c/gi,
      "Proposed D3a / D5c · awaiting confirmation",
    )
    .replace(
      /Josh['’]s (?:clinical reasoning )?rubric/gi,
      "Clinical reasoning rubric",
    )
    .replace(
      /Josh['’]s proposed (rules|anchors|revision|version)/gi,
      "proposed $1",
    )
    .replace(/Josh['’]s proposal/gi, "proposed rules")
    .replace(
      /(?:need|needs|requires?) Josh['’]s review/gi,
      "awaiting confirmation",
    )
    .replace(/(?:remain|remains) for Josh\b/gi, "are awaiting confirmation")
    .replace(/Josh['’]s review/gi, "confirmation")
    .replace(/\bJosh(?:['’]s)?\b/gi, "awaiting confirmation")
    .replace(
      /Adapted from [^,;\n]+ et al\.,/g,
      "Adapted from the source report,",
    )
    .replace(/Josh/gi, "confirmation");
}

export function displayData(value, key = "") {
  if (typeof value === "string") {
    if (key === "reviewer" && value)
      return /^(?:R\d+|reviewer[-_][a-z0-9_-]+)$/i.test(value)
        ? value
        : "Reviewer";
    if (/^(?:author|authors|prepared_by|confirmed_by)$/i.test(key) && value)
      return "Not displayed";
    // These values connect requests to immutable historical records.
    if (key === "id" || key.endsWith("_id") || key.endsWith("_version"))
      return value;
    return displayText(value);
  }
  if (Array.isArray(value)) return value.map((v) => displayData(v, key));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        displayText(k),
        displayData(v, k),
      ]),
    );
  return value;
}
