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
