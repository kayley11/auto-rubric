export function isTechnicalCheck(record) {
  return (
    /^(?:ui[-_\s]?validation|deployment[-_\s]?(?:check|validation)|interface[-_\s]?check)$/i.test(
      record.purpose || "",
    ) || /^Deployment check(?:\s|[—–:-])/i.test(record.title || "")
  );
}

export function savedEvaluationLabel(record) {
  return (
    record.case_code || `Evaluation ${record.id.slice(0, 8).toUpperCase()}`
  );
}

export function filterEvaluations(records, group = "evaluations", search = "") {
  const query = search.trim().toLowerCase();
  return records.filter(
    (record) =>
      isTechnicalCheck(record) === (group === "technical") &&
      `${record.case_code || ""} ${record.case_number || ""} ${record.id} ${record.title || ""} ${record.answer_model || ""}`
        .toLowerCase()
        .includes(query),
  );
}

export function savedComparisonGroups(records) {
  const groups = new Map();
  for (const record of records) {
    if (!record.comparison_id) continue;
    const members = groups.get(record.comparison_id) || [];
    members.push(record);
    groups.set(record.comparison_id, members);
  }
  return [...groups].map(([id, members]) => ({
    id,
    records: members,
    cases: new Set(members.map((r) => r.case_code || r.case_number || r.id))
      .size,
    models: [...new Set(members.map((r) => r.answer_model).filter(Boolean))],
    complete: members.filter((r) => r.status === "complete").length,
    created_at: members[0]?.created_at,
  }));
}
