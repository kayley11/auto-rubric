import test from "node:test";
import assert from "node:assert/strict";
import {sourceSegments, draftCounts, visibleDraft, sourceMatchLabel} from "../src/articleEvidence.mjs";

test("layout repairs and source restorations are never labelled verbatim model quotes", () => {
  assert.equal(sourceMatchLabel({grounding:"exact",grounding_method:"unique_pdf_layout_match"}),"Source match · PDF layout aligned");
  assert.equal(sourceMatchLabel({grounding:"exact",grounding_method:"verified_source_quote_restoration"}),"Original source quote restored · citation markers retained");
  assert.match(sourceMatchLabel({grounding:"unmatched"}),/review before use/);
});

test("overlapping source highlights preserve text and UTF-16 positions", () => {
  const block = {text: "🧪 normal value; later result", start_utf16: 8, end_utf16: 37};
  block.end_utf16 = block.start_utf16 + block.text.length;
  const items = [
    {id:"F1",grounding:"exact",position:{start_utf16:11,end_utf16:23}},
    {id:"F2",grounding:"exact",position:{start_utf16:18,end_utf16:30}},
    {id:"unmatched",grounding:"unmatched",position:{start_utf16:8,end_utf16:37}},
  ];
  const parts=sourceSegments(block,items);
  assert.equal(parts.map(p=>p.text).join(""),block.text);
  assert(parts.some(p=>p.ids.length===2));
  assert(!parts.some(p=>p.ids.includes("unmatched")));
  assert.equal(parts[0].text,"🧪 ");
});

test("case preview excludes hidden outcomes, unresolved facts and source metadata", () => {
  const draft={visible_context:"Initial consultation",title:"Hidden diagnosis",decision_point:"Before secret result",items:[
    {visibility:"visible",text:"Initial symptom"},{visibility:"hidden",text:"Final diagnosis"},
    {visibility:"uncertain",text:"Unclear timing"},{visibility:"exclude",text:"Not in source"},
  ]};
  assert.equal(visibleDraft(draft),"Initial consultation\n\nInitial symptom");
  assert.deepEqual(draftCounts(draft.items),{visible:1,hidden:1,uncertain:1,exclude:1});
});
