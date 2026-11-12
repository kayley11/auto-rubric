// Literal links only. Locating text does not establish clinical support or a grade.
function canonical(text) {
  let value = "",
    positions = [];
  for (let i = 0; i < text.length; i++) {
    let char = text[i].replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
    if (/\s/.test(char)) {
      if (value.endsWith(" ")) continue;
      char = " ";
    }
    positions.push(i);
    value += char;
  }
  return { value, positions };
}

export function locateQuote(answer, quote) {
  const needle = canonical(quote.trim()).value;
  if (needle.length < 12) return [];
  const hay = canonical(answer),
    matches = [];
  let index = hay.value.indexOf(needle);
  while (index >= 0) {
    const start = hay.positions[index],
      end = hay.positions[index + needle.length - 1] + 1;
    matches.push({ start, end, quote: answer.slice(start, end) });
    index = hay.value.indexOf(needle, index + 1);
  }
  return matches;
}

export function suggestedEvidence(answer, reason = "", supplied = "") {
  const quotes = [];
  if (typeof supplied === "string" && supplied.trim())
    quotes.push(supplied.trim());
  if (Array.isArray(supplied))
    supplied.forEach((q) => {
      if (typeof q === "string") quotes.push(q.trim());
    });
  const regex =
    /“([^”\n]{12,2000})”|"([^"\n]{12,2000})"|‘([^’\n]{12,2000})’|'([^'\n]{12,2000})'/g;
  for (const match of reason.matchAll(regex))
    quotes.push(match.slice(1).find(Boolean).trim());
  return [...new Set(quotes)].slice(0, 16).map((quote, index) => {
    const matches = locateQuote(answer, quote);
    return {
      id:
        matches.length === 1
          ? `auto-${matches[0].start}-${matches[0].end}`
          : `unlocated-${index}`,
      original_quote: quote,
      selectors: matches.length === 1 ? matches : [],
      count: matches.length,
      status:
        matches.length === 1
          ? "located"
          : matches.length
            ? "ambiguous"
            : "not_found",
    };
  });
}

export async function sha256(text) {
  const data = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return [...new Uint8Array(data)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

export async function evidenceContext({
  caseId,
  answerKey,
  answer,
  reason,
  criterion,
  version,
}) {
  const rubricText = JSON.stringify(criterion);
  const context = {
    answer_key: String(answerKey),
    answer_sha256: await sha256(answer),
    case_id: String(caseId || "Saved answer"),
    item_id: criterion.id,
    reason_sha256: await sha256(reason),
    rubric_sha256: await sha256(rubricText),
    rubric_version: String(version || "Saved version not recorded"),
  };
  return { context, id: await sha256(JSON.stringify(context)), rubricText };
}
