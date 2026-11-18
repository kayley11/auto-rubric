import test from "node:test";
import assert from "node:assert/strict";
import { prepareClinicalText, rawSelectorsToDisplay, displaySelectorsToRaw } from "../src/clinicalTextProjection.mjs";
import { locateQuote, suggestedEvidence, evidenceContext } from "../src/evidenceLinks.mjs";

test("reading view formats headings, list labels and malformed summary labels", () => {
  const raw = "## 4. Information to Obtain\n\n- **LDH and urate:** from the same draw.\n\n**Summary:* No potassium value is available.";
  const document = prepareClinicalText(raw);
  assert.equal(document.raw, raw);
  assert.equal(document.text, "4. Information to Obtain\n\n• LDH and urate:\nfrom the same draw.\n\nSummary:\nNo potassium value is available.");
  assert.ok(document.runs.some(r => r.heading && r.strong && r.text === "4. Information to Obtain"));
  assert.ok(document.runs.some(r => r.strong && r.text === "Summary:"));
  assert.equal(prepareClinicalText("**Summary**: Unconfirmed.\n\n**One possible cause.** Evidence remains limited.").text, "Summary:\nUnconfirmed.\n\nOne possible cause.\nEvidence remains limited.");
  assert.equal(prepareClinicalText("2. **Another possibility.** Not confirmed.").text,"2. Another possibility.\nNot confirmed.");
});

test("page controls, rules and excess blank lines become ordinary paragraph breaks", () => {
  const raw = "First.\f\n\n\n---\n\n## Next\u2028No result.";
  assert.equal(prepareClinicalText(raw).text, "First.\n\nNext\nNo result.");
});

test("selection across formatting and an emoji maps back to the exact unchanged raw answer", () => {
  const raw = "🙂\r\n## Result\r\n**Potassium:** not 6.0 mmol/L; no value was supplied.";
  const document = prepareClinicalText(raw);
  const quote = "Potassium:\nnot 6.0 mmol/L";
  const start = document.text.indexOf(quote), end = start + quote.length;
  const [saved] = displaySelectorsToRaw(document, [{start, end, quote}]);
  assert.equal(saved.quote, raw.slice(saved.start, saved.end));
  assert.equal(saved.quote, "Potassium:** not 6.0 mmol/L");
  assert.deepEqual(rawSelectorsToDisplay(document, [saved]), [{start, end, quote}]);
  assert.deepEqual(displaySelectorsToRaw(document, [{start:0, end:2}]), [{start:0, end:2, quote:"🙂"}]);
});

test("old raw annotations remain locatable, including a whole bold span", () => {
  const raw = "## Findings\n\nThe **glucose result** remains unknown.";
  const start = raw.indexOf("**glucose"), end = raw.indexOf(" remains");
  const [reading] = rawSelectorsToDisplay(prepareClinicalText(raw), [{start, end, quote:raw.slice(start,end)}]);
  assert.equal(reading.quote, "glucose result");
  assert.deepEqual(displaySelectorsToRaw(prepareClinicalText(raw), [{start:-1,end:4}]), []);
});

test("format-only links are explicit and keep raw offsets; paraphrases remain unlinked", () => {
  const raw = "The **glucose result** remains unknown.";
  const [located] = locateQuote(raw, "The glucose result remains unknown.");
  assert.equal(located.match_method, "formatting_only");
  assert.equal(located.quote, raw);
  for (const quote of ["The glucose result is normal.", "The glucose result remains known.", "No glucose measurement is available."])
    assert.equal(locateQuote(raw, quote).length, 0);
  const short = suggestedEvidence(raw, 'The word “glucose” appears.')[0];
  assert.equal(short.status,"too_short");
});

test("formatting preserves clinical numbers, negation, standalone symbols and raw fingerprints", async () => {
  const raw = "**Summary:** Not confirmed; K ≥6.0 mmol/L, 15 mg, 1–2 days. A * B. <script>alert(1)</script>";
  const document = prepareClinicalText(raw);
  assert.match(document.text, /Not confirmed; K ≥6\.0 mmol\/L, 15 mg, 1–2 days\. A \* B\./);
  const input = {caseId:"BN01",answerKey:"saved",answer:raw,reason:"Saved",criterion:{id:"D1"},version:"v1"};
  assert.equal((await evidenceContext(input)).id, (await evidenceContext({...input,answer:document.raw})).id);
  assert.notEqual((await evidenceContext(input)).id, (await evidenceContext({...input,answer:document.text})).id);
});

test("possessive apostrophes inside a quotation do not create truncated quote links", () => {
  const quote="The patient's needs and agreement remain unknown.";
  const links=suggestedEvidence(quote, `The answer states '${quote}' but gives no source.`);
  assert.equal(links.length,1);
  assert.equal(links[0].original_quote,quote);
  assert.equal(links[0].status,"located");
  assert.deepEqual(suggestedEvidence("One answer.", "The patient's symptoms and the doctor's notes are discussed."),[]);
});

test("scientific notation is readable and still maps to unchanged UTF-16 source spans", () => {
  const raw = String.raw`🙂 Creatinine 311 $\mu$mol/L; $\beta$-hCG; $\ge$ 40; $DO_2$; $10^{9}$; \(\mathrm{mmol/L}\).`;
  const document = prepareClinicalText(raw);
  assert.equal(document.text, "🙂 Creatinine 311 μmol/L; β-hCG; ≥ 40; DO₂; 10⁹; mmol/L.");
  for (const quote of ["311 μmol/L", "DO₂", "10⁹", "β-hCG"]) {
    const start = document.text.indexOf(quote), end = start + quote.length;
    const [source] = displaySelectorsToRaw(document, [{start,end}]);
    assert.equal(source.quote, raw.slice(source.start,source.end));
    assert.equal(rawSelectorsToDisplay(document, [source])[0].quote, quote);
  }
  const [located] = locateQuote(raw, "Creatinine 311 μmol/L;");
  assert.equal(located.match_method,"formatting_only");
  assert.equal(document.raw, raw);
  assert.equal(document.notationWarnings.length,0);
});

test("notation parsing preserves prices and flags unknown formula syntax rather than guessing", () => {
  const raw = String.raw`Costs $5 and $10. Unknown $\invented{x}$ and malformed 1$$minor.`;
  const document = prepareClinicalText(raw);
  assert.equal(document.text, raw);
  assert.equal(document.notationWarnings.length,2);
});

test("only the source-verified legacy rubric formula restores its missing multiplication signs", () => {
  const raw = "Evidence Score = max(0, 5 $-$ 1$$minor $-$ 3$$major unsupported claims)";
  const document = prepareClinicalText(raw);
  assert.equal(document.text,"Evidence Score = max(0, 5 - 1×minor - 3×major unsupported claims)");
  assert.equal(document.notationWarnings.length,0);
  assert.equal(document.raw,raw);
  assert.equal(prepareClinicalText("Unverified 1$$minor").text,"Unverified 1$$minor");
});

test("clipped quote formatting is hidden without dropping clinical wording or numeric operators", () => {
  const raw="Treatment Gap:** The records end before the decision.\nDifferential Mechanisms 1. **Drug-Induced Capillary Leak Syndrome (CLS)...\n2**3 and A * B";
  assert.equal(prepareClinicalText(raw).text,"Treatment Gap: The records end before the decision.\nDifferential Mechanisms 1. Drug-Induced Capillary Leak Syndrome (CLS)...\n2**3 and A * B");
  assert.equal(prepareClinicalText("** Required urgent actions.").text,"Required urgent actions.");
});
