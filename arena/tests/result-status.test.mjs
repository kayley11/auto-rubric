import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { itemResultText } from "../src/resultStatus.mjs";

test("a saved applicability decision is not displayed as an unfinished scoring job", () => {
  const packet = JSON.parse(fs.readFileSync("public/complex-cases/BN01.json", "utf8"));
  const model = packet.models.find(m => m.id === "kcl-lite");
  const item = model.scores.find(s => s.item === "D5b");
  assert.equal(item.status, "applicability_pending");
  assert.equal(itemResultText(item, model.answer_status), "Awaiting confirmation");
  assert.ok(item.reason.includes("Decision needed:"));
});
test("missing assessment, unavailable answer, scope and numeric grades remain distinct", () => {
  assert.equal(itemResultText({status:"pending"},"complete"),"Not yet scored");
  assert.equal(itemResultText({},"no_complete_answer"),"No complete answer");
  assert.equal(itemResultText({status:"not_applicable"},"complete"),"Not applicable");
  assert.equal(itemResultText({status:"indeterminate"},"complete"),"Cannot assess");
  assert.equal(itemResultText({status:"complete",label:"",score:0}),"0");
  assert.equal(itemResultText({status:"scored",score:4}),"4");
  assert.equal(itemResultText({status:"unexpected_state"},"complete"),"Assessment status unavailable");
});
