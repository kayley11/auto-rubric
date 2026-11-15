import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { build } from "esbuild";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
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
