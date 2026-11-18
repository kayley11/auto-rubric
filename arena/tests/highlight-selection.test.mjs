import test from "node:test";
import assert from "node:assert/strict";
import {pendingHighlight} from "../src/highlightSelection.mjs";
import {prepareClinicalText} from "../src/clinicalTextProjection.mjs";

function fixture(document, start, end, inside=true) {
  const range={startContainer:{},endContainer:{},startOffset:start,endOffset:end,
    toString:()=>document.text.slice(start,end),
    cloneRange:()=>({selectNodeContents(){},setEnd(){},toString:()=>document.text.slice(0,start)}),
    getBoundingClientRect:()=>({left:30,bottom:100})};
  return [{contains:()=>inside},{isCollapsed:start===end,rangeCount:1,getRangeAt:()=>range}];
}

test("selecting text prepares a prompt, with exact raw evidence and no annotation or save action",()=>{
  const document=prepareClinicalText(String.raw`Result: 311 $\mu$mol/L remains unknown.`);
  const start=document.text.indexOf("311"),end=document.text.indexOf(" remains");
  const pending=pendingHighlight(...fixture(document,start,end),document);
  assert.deepEqual(pending.displaySelectors,[{start,end,quote:"311 μmol/L"}]);
  assert.equal(pending.selectors[0].quote,String.raw`311 $\mu$mol/L`);
  assert.equal(pending.annotation_id,undefined);
  assert.equal(pending.status,undefined);
});

test("empty, external and whitespace-only selections do not offer a highlight",()=>{
  const document=prepareClinicalText("Known fact.   ");
  for(const args of [fixture(document,0,0),fixture(document,0,5,false),fixture(document,11,14)])
    assert.equal(pendingHighlight(...args,document),null);
});
