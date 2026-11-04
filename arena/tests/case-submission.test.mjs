import test from "node:test";
import assert from "node:assert/strict";
import {
  contributorError,
  filterWorkspaceCases,
  workspaceOptions,
  UNKNOWN_CONTRIBUTOR,
} from "../src/caseSubmission.mjs";

const rows = [
  {
    id: "a",
    code: "CASE-A",
    input: { facts: "Swelling", source: "DOI:original" },
    submissions: [
      { contributor_id: "R01", batch_id: "one", batch_name: "Renal cases" },
      { contributor_id: "R02", batch_id: "two", batch_name: "November cases" },
    ],
  },
  {
    id: "b",
    code: "CASE-B",
    input: { facts: "Headache" },
    submissions: [
      { contributor_id: "R02", batch_id: "two", batch_name: "November cases" },
    ],
  },
  { id: "old", code: "CASE-OLD", input: { facts: "Earlier case" } },
];

test("contributor and batch filters match the same submission, not unrelated events", () => {
  assert.deepEqual(
    filterWorkspaceCases(rows, { contributor: "R01", batch: "one" }).map(
      (r) => r.id,
    ),
    ["a"],
  );
  assert.equal(
    filterWorkspaceCases(rows, { contributor: "R01", batch: "two" }).length,
    0,
  );
  assert.deepEqual(
    filterWorkspaceCases(rows, { mine: true, contributorId: "R02" }).map(
      (r) => r.id,
    ),
    ["a", "b"],
  );
  assert.equal(
    filterWorkspaceCases(rows, { mine: true, contributorId: "" }).length,
    0,
  );
});

test("source search, legacy records and filter options remain available", () => {
  assert.deepEqual(
    filterWorkspaceCases(rows, { query: "DOI:original" }).map((r) => r.id),
    ["a"],
  );
  assert.deepEqual(
    filterWorkspaceCases(rows, { contributor: UNKNOWN_CONTRIBUTOR }).map(
      (r) => r.id,
    ),
    ["old"],
  );
  const options = workspaceOptions(rows);
  assert.equal(options.batches.length, 3);
  assert.ok(options.contributors.includes(UNKNOWN_CONTRIBUTOR));
  assert.equal(filterWorkspaceCases(rows).length, 3);
});

test("contributor IDs accept stable short identifiers and reject empty or invalid values", () => {
  assert.equal(contributorError("R01"), "");
  assert.equal(contributorError(" researcher.01 "), "");
  assert.ok(contributorError(""));
  assert.ok(contributorError("<name>"));
});
