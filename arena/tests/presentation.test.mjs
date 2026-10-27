import assert from "node:assert/strict";
import test from "node:test";
import { displayData, displayText } from "../src/presentation.mjs";

test("pending labels use generic confirmation wording", () => {
  for (const text of [
    "awaiting Josh’s confirmation",
    "await Josh's review",
    "subject to Josh’s review",
  ])
    assert.equal(displayText(text), "awaiting confirmation");
  assert.equal(
    displayText("Josh’s proposed D3a / D5c"),
    "Proposed D3a / D5c · awaiting confirmation",
  );
});

test("display copies retain clinical facts, scores, IDs and the untouched source", () => {
  const source = {
    id: "josh-proposed-20261024",
    rules_version: "josh-proposed-20261024",
    label: "Josh’s proposed D3a / D5c",
    facts: "Glucose 2.0 mmol/L at 04:00.",
    score: 2,
  };
  const shown = displayData(source);
  assert.equal(shown.id, source.id);
  assert.equal(shown.rules_version, source.rules_version);
  assert.equal(shown.facts, source.facts);
  assert.equal(shown.score, source.score);
  assert.doesNotMatch(shown.label, /josh/i);
  assert.equal(source.label, "Josh’s proposed D3a / D5c");
});

test("reviewer IDs remain usable without displaying personal names", () => {
  assert.equal(displayData({ reviewer: "R01" }).reviewer, "R01");
  assert.equal(
    displayData({ reviewer: "Example Person" }).reviewer,
    "Reviewer",
  );
  assert.equal(displayData({ reviewer: "" }).reviewer, "");
});

test("source notes retain their DOI, date and licence", () => {
  assert.equal(
    displayText(
      "Adapted from Example et al., Journal; https://doi.org/example; CC BY 4.0.",
    ),
    "Adapted from the source report, Journal; https://doi.org/example; CC BY 4.0.",
  );
});

test("displayed JSON and plain-text previews remove the old named version label", () => {
  assert.doesNotMatch(
    displayText(
      '{"rules_version":"josh-proposed-20261024","label":"Josh’s rubric"}',
    ),
    /josh/i,
  );
});
