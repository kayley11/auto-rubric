// Reading-only projection. Source text and persisted UTF-16 annotation offsets
// always refer to the unchanged saved answer, never to this formatted view.
export function prepareClinicalText(input = "") {
  const raw = String(input);
  const hidden = new Uint8Array(raw.length);
  const bold = new Uint8Array(raw.length);
  const headings = new Uint8Array(raw.length);
  const replacements = new Map();
  const insertions = new Map();
  const hide = (start, end) => hidden.fill(1, start, end);
  const emphasise = (start, end, heading = false) => {
    bold.fill(1, start, end);
    if (heading) headings.fill(1, start, end);
  };
  const lines = /([^\r\n\f\v\u2028\u2029]*)(\r\n|[\r\n\f\v\u2028\u2029]|$)/g;
  for (const match of raw.matchAll(lines)) {
    if (!match[0]) continue;
    const line = match[1], offset = match.index;
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
  return { raw, text: units.map(unit => unit.text).join(""), positions: units.map(({start, end}) => ({start, end})), runs };
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
