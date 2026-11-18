// Reading-only projection. Source text and persisted UTF-16 annotation offsets
// always refer to the unchanged saved answer, never to this formatted view.
export function prepareClinicalText(input = "") {
  const raw = String(input);
  const hidden = new Uint8Array(raw.length);
  const bold = new Uint8Array(raw.length);
  const headings = new Uint8Array(raw.length);
  const replacements = new Map();
  const notation = new Map();
  const insertions = new Map();
  const hide = (start, end) => hidden.fill(1, start, end);
  const emphasise = (start, end, heading = false) => {
    bold.fill(1, start, end);
    if (heading) headings.fill(1, start, end);
  };
  // Render common saved scientific notation without changing the source or
  // guessing an unknown command. Each displayed character retains its span.
  const symbols = {
    mu: "μ", beta: "β", alpha: "α", gamma: "γ", delta: "δ", Delta: "Δ",
    rightarrow: "→", leftarrow: "←", leftrightarrow: "↔",
    ge: "≥", geq: "≥", le: "≤", leq: "≤", neq: "≠", approx: "≈",
    times: "×", cdot: "·", pm: "±", degree: "°", circ: "°",
  };
  const replaceSpan = (start, end, text) => notation.set(start, { end, text });
  // The archived rubric's main.tex explicitly has 1$\times$minor and
  // 3$\times$major. Its saved display copy lost \times, leaving $$.
  // Repair only this verified fragment; do not infer operators in other text.
  const savedFormula = "Evidence Score = max(0, 5 $-$ 1$$minor $-$ 3$$major unsupported claims)";
  for (const match of raw.matchAll(new RegExp(savedFormula.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"))) {
    for (const operator of match[0].matchAll(/\$\$(?=(?:minor|major)\b)/g)) {
      const start = match.index + operator.index;
      replaceSpan(start, start + 2, "×");
    }
    for (const operator of match[0].matchAll(/\$-\$/g)) {
      const start = match.index + operator.index;
      replaceSpan(start, start + 3, "-");
    }
  }
  const mathRegions = [];
  for (const match of raw.matchAll(/(?<!\\)\$([^$\r\n]+)\$|\\\(([^\r\n]*?)\\\)|\\\[([\s\S]*?)\\\]/g)) {
    const content = match[1] ?? match[2] ?? match[3];
    // A price pair such as $5 and $10 is not an equation.
    if (match[1] !== undefined && !/\\[A-Za-z]+|[_^]/.test(content) && !/^(?:[A-Za-z]|[+−=<>-])$/.test(content.trim())) continue;
    const delimiter = match[1] !== undefined ? 1 : 2;
    const start = match.index + delimiter, end = match.index + match[0].length - delimiter;
    const unknown = [...content.matchAll(/\\([A-Za-z]+)/g)].some(m => !Object.hasOwn(symbols, m[1]) && !["mathrm", "text", "operatorname"].includes(m[1]));
    if (unknown) continue;
    hide(match.index, start);
    hide(end, match.index + match[0].length);
    mathRegions.push({start, end});
  }
  for (const match of raw.matchAll(/\\([A-Za-z]+)/g)) {
    if (Object.hasOwn(symbols, match[1])) replaceSpan(match.index, match.index + match[0].length, symbols[match[1]]);
  }
  const superscripts = {"0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹","+":"⁺","-":"⁻"};
  const subscripts = {"0":"₀","1":"₁","2":"₂","3":"₃","4":"₄","5":"₅","6":"₆","7":"₇","8":"₈","9":"₉","+":"₊","-":"₋"};
  for (const {start, end} of mathRegions) {
    const content = raw.slice(start, end);
    for (const match of content.matchAll(/([_^])(?:\{([0-9+-]+)\}|([0-9]))/g)) {
      const map = match[1] === "^" ? superscripts : subscripts;
      replaceSpan(start + match.index, start + match.index + match[0].length, [...(match[2] || match[3])].map(c => map[c]).join(""));
    }
    for (const match of content.matchAll(/\\(?:mathrm|text|operatorname)\{([^{}]*)\}/g)) {
      const from = start + match.index, body = from + match[0].indexOf("{") + 1;
      hide(from, body);
      hide(from + match[0].length - 1, from + match[0].length);
    }
  }
  const lines = /([^\r\n\f\v\u2028\u2029]*)(\r\n|[\r\n\f\v\u2028\u2029]|$)/g;
  for (const match of raw.matchAll(lines)) {
    if (!match[0]) continue;
    const line = match[1], offset = match.index;
    const clippedPrefix = line.match(/^([ \t]*)\*\*([ \t]+)(?=[A-Za-z])/);
    if (clippedPrefix) hide(offset + clippedPrefix[1].length, offset + clippedPrefix[0].length);
    const heading = line.match(/^([ \t]*#{1,6}[ \t]+)(.*?)([ \t]+#+[ \t]*)?$/);
    if (heading) {
      hide(offset, offset + heading[1].length);
      emphasise(offset + heading[1].length, offset + heading[1].length + heading[2].length, true);
      if (heading[3]) hide(offset + line.length - heading[3].length, offset + line.length);
    }
    // A rule or code fence is layout, rather than clinical wording.
    if (/^[ \t]*([-*_])(?:[ \t]*\1){2,}[ \t]*$/.test(line) || /^[ \t]*(?:`{3,}|~{3,})[^`~]*$/.test(line)) {
      hide(offset, offset + line.length);
      continue;
    }
    const bullet = line.match(/^([ \t]*)[-+*]([ \t]+)(?=[A-Za-z*_([])/);
    if (bullet) replacements.set(offset + bullet[1].length, "•");
    const quote = line.match(/^[ \t]*(>+)[ \t]+/);
    if (quote) hide(offset, offset + quote[0].length);
    for (const item of line.matchAll(/(\*\*|__)(.+?)\1/g)) {
      const start = offset + item.index, marker = item[1].length;
      hide(start, start + marker);
      hide(start + item[0].length - marker, start + item[0].length);
      emphasise(start + marker, start + item[0].length - marker);
    }
    // Saved judge excerpts can start/end inside a bold phrase. Hide the
    // clipped Markdown delimiter, while preserving arithmetic such as 2**3.
    for (const item of line.matchAll(/(?:^|\s)(\*\*)(?=[A-Za-z][A-Za-z -]{3,})|(?<=[A-Za-z:)])(\*\*)(?=\s|[.,;:!?)]|$)/g)) {
      const start = offset + item.index + item[0].indexOf("**");
      hide(start, start + 2);
    }
    // Also accept saved malformed labels such as **Summary:* without editing
    // the underlying model output. A labelled item starts its body on a new line.
    const label = line.match(/^([ \t]*(?:(?:[-+*]|\d+[.)])[ \t]+)?)(\*{1,2}|__)([^*\r\n]{1,150}?[:：])(\*{1,2}|__)([ \t]*)/);
    if (label) {
      const start = offset + label[1].length;
      const contentStart = start + label[2].length;
      const contentEnd = contentStart + label[3].length;
      hide(start, contentStart);
      hide(contentEnd, offset + label[0].length);
      emphasise(contentStart, contentEnd);
      if (line.slice(label[0].length).trim()) insertions.set(offset + label[0].length, "\n");
    } else {
      const title = line.match(/^([ \t]*(?:(?:[-+*]|\d+[.)])[ \t]+)?)(\*\*|__)([^*\r\n]{1,150}?)\2([:：]?)([ \t]*)/);
      if (title && (title[4] || /[:：.!?]$/.test(title[3])) && line.slice(title[0].length).trim()) {
        const from = offset + title[1].length + title[2].length + title[3].length + title[2].length + title[4].length;
        hide(from, offset + title[0].length);
        if (title[4]) emphasise(from - title[4].length, from);
        insertions.set(offset + title[0].length, "\n");
      }
    }
    // Inline code delimiters and paired emphasis. Unpaired clinical symbols
    // (for example multiplication or a footnote asterisk) are left intact.
    for (const item of line.matchAll(/`([^`]+)`/g)) {
      hide(offset + item.index, offset + item.index + 1);
      hide(offset + item.index + item[0].length - 1, offset + item.index + item[0].length);
    }
    for (const item of line.matchAll(/(^|[\s(])(\*|_)([^\s*_][^*_]*?)\2(?=$|[\s.,;:!?)])/g)) {
      const start = offset + item.index + item[1].length;
      hide(start, start + 1);
      hide(start + item[0].length - item[1].length - 1, start + item[0].length - item[1].length);
    }
  }
  const units = [];
  const append = (text, start, end, strong = false, heading = false) => {
    if (text === "\n") {
      if (!units.length || (units.at(-1)?.text === "\n" && units.at(-2)?.text === "\n")) return;
    }
    units.push({ text, start, end, strong, heading });
  };
  for (let i = 0; i < raw.length; i++) {
    if (insertions.has(i)) append(insertions.get(i), i, i);
    if (notation.has(i)) {
      const span = notation.get(i);
      for (let j = 0; j < span.text.length; j++) append(span.text[j], i, span.end, Boolean(bold[i]), Boolean(headings[i]));
      i = span.end - 1;
      continue;
    }
    if (hidden[i]) continue;
    const char = raw[i];
    if (char === "\r" && raw[i + 1] === "\n") continue;
    append(/[\r\n\f\v\u2028\u2029]/.test(char) ? "\n" : replacements.get(i) || char, i, i + 1, Boolean(bold[i]), Boolean(headings[i]));
  }
  while (units.at(-1)?.text === "\n") units.pop();
  const runs = [];
  for (const unit of units) {
    const last = runs.at(-1);
    if (last && last.strong === unit.strong && last.heading === unit.heading) last.text += unit.text;
    else runs.push({ text: unit.text, strong: unit.strong, heading: unit.heading });
  }
  const text = units.map(unit => unit.text).join("");
  const notationWarnings = [...text.matchAll(/\\[A-Za-z]+|\$\$/g)].map(match => ({offset: match.index, text: match[0]}));
  return { raw, text, positions: units.map(({start, end}) => ({start, end})), runs, notationWarnings };
}

export function displaySelectorsToRaw(document, selectors = []) {
  return selectors.flatMap(selector => {
    const start = Number(selector.start), end = Number(selector.end);
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end <= start || end > document.positions.length) return [];
    const positions = document.positions.slice(start, end).filter(p => p.end > p.start);
    if (!positions.length) return [];
    const from = positions[0].start, to = positions.at(-1).end;
    return [{start: from, end: to, quote: document.raw.slice(from, to)}];
  });
}

export function rawSelectorsToDisplay(document, selectors = []) {
  return selectors.flatMap(selector => {
    if (!Number.isInteger(selector.start) || !Number.isInteger(selector.end) || selector.start < 0 || selector.end <= selector.start || selector.end > document.raw.length) return [];
    const start = document.positions.findIndex(p => p.end > selector.start && p.start < selector.end && p.end > p.start);
    if (start < 0) return [];
    let end = start + 1;
    while (end < document.positions.length && document.positions[end].start < selector.end) end++;
    return [{start, end, quote: document.text.slice(start, end)}];
  });
}
