import test from "node:test";
import assert from "node:assert/strict";
import {
  locateQuote,
  suggestedEvidence,
  evidenceContext,
} from "../src/evidenceLinks.mjs";

test("links only a literal span and preserves exact answer wording", () => {
  const answer =
    "🙂 A result is not confirmed.\nThe patient’s renal function remains unknown.";
  const spans = locateQuote(
    answer,
    "The patient's renal function remains unknown.",
  );
  assert.equal(spans.length, 1);
  assert.equal(answer.slice(spans[0].start, spans[0].end), spans[0].quote);
  assert.equal(spans[0].quote, "The patient’s renal function remains unknown.");
});
test("does not silently link changed negation, numbers, ellipses or paraphrases", () => {
  const answer =
    "The patient did not receive 15 mg of the medication during the first admission.";
  for (const quote of [
    "The patient did receive 15 mg",
    "receive 50 mg of the medication",
    "The patient...during the first admission",
    "Medication was withheld in hospital",
  ])
    assert.equal(locateQuote(answer, quote).length, 0);
});
test("repeated excerpts are ambiguous and receive no automatic annotation", () => {
  const text =
    "An important result remains unknown. An important result remains unknown.";
  const row = suggestedEvidence(
    text,
    "",
    "An important result remains unknown.",
  )[0];
  assert.equal(row.status, "ambiguous");
  assert.equal(row.selectors.length, 0);
  assert.equal(row.count, 2);
});
test("unquoted omission does not invent a supporting quotation", () => {
  assert.deepEqual(
    suggestedEvidence("A clinical answer.", "No glucose request was made."),
    [],
  );
});
test("a short saved excerpt is distinguished from text absent from the answer", () => {
  const [link] = suggestedEvidence("Two unprovoked episodes.", "", "unprovoked");
  assert.equal(link.status, "too_short");
  assert.deepEqual(link.selectors, []);
});
test("context fingerprints change with answer, reason and rubric version", async () => {
  const input = {
    caseId: "B03",
    answerKey: "saved/apex",
    answer: "Fixed answer text",
    reason: "Saved reason",
    criterion: {
      id: "D1",
      definition: "Definition",
      anchors: { 1: "Low", 5: "High" },
    },
    version: "v1",
  };
  const base = await evidenceContext(input);
  for (const change of [
    { answer: "Different answer" },
    { reason: "New reason" },
    { version: "v2" },
    { criterion: { ...input.criterion, definition: "New definition" } },
  ])
    assert.notEqual(
      (await evidenceContext({ ...input, ...change })).id,
      base.id,
    );
  assert.equal((await evidenceContext({ ...input })).id, base.id);
});
