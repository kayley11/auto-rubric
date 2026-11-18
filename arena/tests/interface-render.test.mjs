import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { build } from "esbuild";
import { mkdtemp, mkdir, rm, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

test("a saved batch renders while the configuration request is still pending", {timeout:10000}, async () => {
  await mkdir(".data", {recursive:true});
  const directory = await mkdtemp(path.resolve(".data/render-test-"));
  const output = path.join(directory,"batch.mjs");
  await build({entryPoints:["src/BatchImport.jsx"],outfile:output,bundle:true,platform:"node",format:"esm",packages:"external",jsx:"automatic"});
  const previous = globalThis.sessionStorage;
  const saved = {defaults:{answer_models:["arc:lite"],criteria:["D1"],rules_version:"original",judge_model:"arc:apex"},readOnly:true,rows:[{id:"one",number:"1",selected:true,data:{case_code:"CASE-A",title:"CASE-A",facts:"Supplied case",task:"Summarise",answer:"",reference:"",source:"",history:""},results:{"arc:lite":{runId:"saved",status:"complete",scored:1,grades:{D1:{status:"scored",score:4}}}}}]};
  globalThis.sessionStorage = {getItem:()=>JSON.stringify(saved)};
  try {
    const {BatchImport} = await import(pathToFileURL(output));
    const html = renderToString(createElement(BatchImport,{config:null,defaults:{criteria:[]},api:()=>{},change:()=>{},onBusy:()=>{},onSaved:()=>{},onOpen:()=>{}}));
    assert.match(html,/Saved comparison/);
    assert.match(html,/CASE-A/);
    assert.match(html,/Comparison summary/);
  } finally {globalThis.sessionStorage=previous;await rm(directory,{recursive:true,force:true});}
});

test("reading text renders escaped content and bold headings without Markdown delimiters", {timeout:10000}, async () => {
  await mkdir(".data", {recursive:true});
  const directory=await mkdtemp(path.resolve(".data/reading-render-test-"));
  const output=path.join(directory,"reading.mjs");
  try {
    await build({entryPoints:["src/ClinicalText.jsx"],outfile:output,bundle:true,platform:"node",format:"esm",packages:"external",jsx:"automatic",loader:{".css":"empty"}});
    const {ClinicalText}=await import(pathToFileURL(output));
    const html=renderToString(createElement(ClinicalText,{text:"## Assessment\n\n**Summary:* Not confirmed. <script>alert(1)</script>"}));
    assert.match(html,/<strong class="clinical-heading">Assessment<\/strong>/);
    assert.match(html,/<strong>Summary:<\/strong>/);
    assert.match(html,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.doesNotMatch(html,/<script>|\*\*|##/);
  } finally {await rm(directory,{recursive:true,force:true});}
});

test("case source review starts collapsed and keeps full article text behind workspace access", {timeout:10000}, async () => {
  await mkdir(".data", {recursive:true});
  const directory=await mkdtemp(path.resolve(".data/source-render-test-"));
  const output=path.join(directory,"source.mjs");
  try {
    await build({entryPoints:["src/SourceEvidence.jsx"],outfile:output,bundle:true,platform:"node",format:"esm",packages:"external",jsx:"automatic",loader:{".css":"empty"}});
    const {SourceEvidence}=await import(pathToFileURL(output));
    const html=renderToString(createElement(SourceEvidence,{caseId:"B03",caseInfo:{source:"https://example.org/article",source_location:"Case presentation"},access:{hosted:true,authenticated:false}}));
    assert.match(html,/Source evidence/);
    assert.match(html,/Sign in to view source evidence/);
    assert.match(html,/https:\/\/example.org\/article/);
    assert.doesNotMatch(html,/<details[^>]*\bopen(?:=|>)/);
    assert.doesNotMatch(html,/Saved original article alongside the case/);
  } finally {await rm(directory,{recursive:true,force:true});}
});

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

test("personal account attribution is read-only while legacy shared attribution stays editable", {timeout:10000}, async () => {
  await mkdir(".data",{recursive:true});
  const directory=await mkdtemp(path.resolve(".data/contributor-render-test-"));
  try {
    const output=path.join(directory,"contributor.mjs");
    await build({entryPoints:["src/ContributorFields.jsx"],outfile:output,bundle:true,platform:"node",format:"esm",packages:"external",jsx:"automatic"});
    const {SubmissionFields,individualAccount}=await import(pathToFileURL(output));
    const props={contributor:"reviewer_01",submission:{batch_name:"Batch"},onContributor:()=>{},onChange:()=>{}};
    const personal=renderToString(createElement(SubmissionFields,{...props,accountId:"reviewer_01"}));
    assert.match(personal,/readOnly=""/);
    assert.match(personal,/Recorded automatically/);
    assert.doesNotMatch(personal,/self-declared/);
    const legacy=renderToString(createElement(SubmissionFields,{...props,accountId:"workspace"}));
    assert.doesNotMatch(legacy,/readOnly=""/);
    assert.match(legacy,/self-declared/);
    assert.equal(individualAccount({authenticated:true,member_id:"reviewer_01"}),"reviewer_01");
    assert.equal(individualAccount({authenticated:true,member_id:"workspace"}),"");
  } finally {await rm(directory,{recursive:true,force:true});}
});

test("an unfinished saved batch can replace its API connections without reopening clinical settings", {timeout:10000}, async () => {
  await mkdir(".data",{recursive:true});
  const directory=await mkdtemp(path.resolve(".data/batch-connection-test-"));
  const previous=globalThis.sessionStorage;
  const settings={answer_models:["arc:lite"],answer_model:"arc:lite",criteria:["D1"],rules_version:"original",judge_model:"arc:apex"};
  globalThis.sessionStorage={getItem:()=>JSON.stringify({defaults:settings,rows:[{id:"one",number:"1",selected:true,data:{case_code:"CASE-A",title:"CASE-A",facts:"Saved facts",task:"Summarise",answer:"",reference:"",source:"",history:""},results:{"arc:lite":{runId:"saved",status:"connection_required",grades:{}}}}]})};
  try {
    const output=path.join(directory,"batch.mjs");
    await build({entryPoints:["src/BatchImport.jsx"],outfile:output,bundle:true,platform:"node",format:"esm",packages:"external",jsx:"automatic",loader:{".css":"empty"}});
    const {BatchImport}=await import(pathToFileURL(output));
    const config={access:{authenticated:true,member_id:"member",hosted:true,can_evaluate:true,personal_connections:true,durable_queue:true},settings:{models:["arc:lite","arc:apex"],...settings},rubric:{criteria:[{id:"D1",name:"Accuracy"}]}};
    const html=renderToString(createElement(BatchImport,{config,defaults:settings,api:()=>{},change:()=>{},onBusy:()=>{},onSaved:()=>{},onOpen:()=>{}}));
    assert.match(html,/Replace API connections for unfinished tasks/);
    assert.match(html,/Case text, answers, model IDs and scoring rules stay fixed/);
    assert.match(html,/Generation connection/);
    assert.match(html,/Scoring connection/);
    assert.match(html,/Connection required/);
    assert.doesNotMatch(html,/Keep this tab open/);
  } finally {globalThis.sessionStorage=previous;await rm(directory,{recursive:true,force:true});}
});
