import test from "node:test";
import assert from "node:assert/strict";
import {backgroundJobs,applyBackgroundSnapshot,restoreBackgroundBatch} from "../src/backgroundBatch.mjs";

test("reopening a batch preserves each model and accepts a replacement connection without relabelling answers", () => {
  const snapshot={id:"a".repeat(32),tasks:["provider/model-A","provider/model-B"].map((model,i)=>({
    row_id:"one",model,key:JSON.stringify(["one",model]),input:{case_code:"CASE-1",case_number:"1",
    facts:"Supplied facts",task:"Summarise",answer:"",reference:"Pending reference",criteria:["D1"],
    answer_model:model,judge_model:"judge",answer_connection_id:"old-connection",judge_connection_id:"judge-connection"}})),
    cells:[{row_id:"one",model:"provider/model-A",run_id:"saved-A",status:"complete",run:{id:"saved-A",input:{answer_model:"provider/model-A"},grades:{D1:{status:"scored",score:4}},rubric:{criteria:[{id:"D1",name:"Accuracy"}]}}},
      {row_id:"one",model:"provider/model-B",run_id:"saved-B",status:"connection_required",run:{id:"saved-B",input:{answer_model:"provider/model-B"},grades:{},rubric:{criteria:[]}}}]};
  const restored=restoreBackgroundBatch(snapshot);
  assert.equal(restored.rows.length,1);
  assert.equal(restored.rows[0].results["provider/model-A"].grades.D1.score,4);
  const jobs=backgroundJobs([{row:restored.rows[0],model:"provider/model-B"}],{...restored.defaults,answer_connection_id:"replacement"});
  assert.equal(jobs[0].input.answer_model,"provider/model-B");
  assert.equal(jobs[0].input.answer_connection_id,"replacement");
  assert.equal(jobs[0].input.judge_connection_id,"judge-connection");
  assert.equal(jobs[0].run_id,"saved-B");
  assert.equal(jobs[0].input.facts,"Supplied facts");
  assert.equal(jobs[0].input.reference,"Pending reference");
});

test("batch polling retains earlier completed results while later cells queue or fail", () => {
  const rows=[{id:"one",data:{facts:"Original"},results:{done:{runId:"saved",status:"complete",scored:1}}}];
  const next=applyBackgroundSnapshot(rows,{cells:[{row_id:"one",model:"late",status:"retry_wait",run_id:"late-run",run:{id:"late-run",input:{},grades:{D1:{status:"error",error:"Temporary failure"}},rubric:{criteria:[]}}}]});
  assert.equal(next[0].results.done.status,"complete");
  assert.equal(next[0].results.late.status,"retry_wait");
  assert.equal(next[0].results.late.error,"Temporary failure");
  assert.equal(next[0].data.facts,"Original");
});
