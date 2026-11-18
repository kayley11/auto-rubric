import { evaluationInput, resultSummary, PROVIDED_ANSWER } from "./caseImport.mjs";

export function backgroundJobs(remaining, fixed) {
  return remaining.map(({row, model}) => ({
    key: JSON.stringify([row.id,model]), row_id: row.id, model,
    run_id: row.results?.[model]?.runId || "",
    input: evaluationInput(row.data, {...fixed, case_number:row.number,
      answer_model:model === PROVIDED_ANSWER ? fixed.answer_model : model}),
  }));
}

export function applyBackgroundSnapshot(rows, snapshot) {
  const byRow = new Map();
  for (const cell of snapshot.cells || []) {
    if (!byRow.has(cell.row_id)) byRow.set(cell.row_id, []);
    byRow.get(cell.row_id).push(cell);
  }
  return rows.map(row => {
    const results = {...row.results};
    for (const cell of byRow.get(row.id) || []) {
      const failed = Object.values(cell.run?.grades || {}).find(g => g.status === "error");
      results[cell.model] = {...results[cell.model],
        ...(cell.run ? resultSummary(cell.run) : {}), runId:cell.run_id || "",
        status:cell.status, error:cell.error || cell.run?.error || failed?.error || ""};
    }
    return {...row,results};
  });
}

export function restoreBackgroundBatch(snapshot) {
  const rows = new Map();
  for (const task of snapshot.tasks || []) {
    const data = Object.fromEntries(["case_code","title","facts","task","history","reference","source","answer","interview","requirements","reference_status"].filter(key => key in task.input).map(key => [key,task.input[key]]));
    if (!rows.has(task.row_id)) rows.set(task.row_id, {id:task.row_id,
      number:task.input.case_number || String(rows.size+1), data,
      selected:true, results:{}, saved_models:[]});
    rows.get(task.row_id).saved_models.push(task.model);
  }
  const first = snapshot.tasks?.[0]?.input || {};
  const models = [...new Set((snapshot.tasks || []).map(t => t.model).filter(m => m !== PROVIDED_ANSWER))];
  return {rows:applyBackgroundSnapshot([...rows.values()],snapshot),
    defaults:{...first,answer_models:models,answer_model:models[0] || first.answer_model},
    filename:`Saved batch ${snapshot.id.slice(0,8)}`};
}
