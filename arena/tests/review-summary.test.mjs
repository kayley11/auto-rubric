import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { build } from "esbuild";
import { mkdtemp, mkdir, rm, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

test("filtered case history renders the current index, legacy counts and missing counts without crashing", {timeout:10000}, async () => {
  await mkdir(".data", {recursive:true});
  const directory=await mkdtemp(path.resolve(".data/review-summary-test-"));
  const output=path.join(directory,"summary.mjs");
  try {
    await build({entryPoints:["src/ReviewSummary.jsx"],outfile:output,bundle:true,platform:"node",format:"esm",packages:"external",jsx:"automatic"});
    const {FullReviewSummary,numericalRatingCount}=await import(pathToFileURL(output));
    const index=JSON.parse(await readFile("public/full-rubric-review/index.json","utf8"));
    const html=renderToString(createElement(FullReviewSummary,{index,earlierCaseCount:78,complexCaseCount:57}));
    assert.equal(numericalRatingCount(index),index.item_statuses.complete);
    assert.ok(html.includes(index.item_statuses.complete.toLocaleString("en-GB")+" numerical ratings"));
    assert.equal(numericalRatingCount({item_statuses:{scored:24}}),24);
    assert.equal(numericalRatingCount({item_statuses:{complete:25,scored:24}}),25);
    assert.equal(numericalRatingCount({item_statuses:{complete:0}}),0);
    for(const value of [undefined,{}, {item_statuses:null}, {item_statuses:{complete:"25"}}, {item_statuses:{complete:-1}}]) {
      assert.equal(numericalRatingCount(value),null);
      const missing=renderToString(createElement(FullReviewSummary,{index:value,earlierCaseCount:78,complexCaseCount:57}));
      assert.match(missing,/count is not recorded/);
      assert.doesNotMatch(missing,/undefined|NaN|0 numerical ratings/);
    }
  } finally {await rm(directory,{recursive:true,force:true});}
});
