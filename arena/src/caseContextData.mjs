// Explicit display fields keep source descriptions and hidden references out of blind review.
export function caseContextData(data, blind = false) {
  const record = data.interview || {};
  return {
    title: blind || data.title === data.case_code ? "" : data.title || "",
    description: blind ? "" : data.description || data.summary || "",
    audience:
      data.audience || data.task?.match(/Audience:\s*([^\n.]+)/i)?.[1] || "",
    task_type: data.task_type || "",
    facts: data.facts || "",
    history: data.history || "",
    task: data.task || "",
    answer: data.answer || "",
    decision_point: record.decision_point || data.decision_point || "",
    source: blind ? "" : data.source || data.source_url || "",
    source_location: blind ? "" : data.source_location || "",
    source_note: blind ? "" : data.source_note || "",
    reference: blind ? "" : data.reference || "",
    requirements: blind ? [] : data.requirements || [],
    turns: (record.turns || data.turns || []).map((turn) => ({
      question: turn.question || "",
      reply: turn.reply || turn.patient_reply || "",
      records:
        turn.records ||
        (turn.returned || turn.fixed_records || [])
          .map((r) =>
            [r.context, r.period, r.patient_text || r.text]
              .filter(Boolean)
              .join("\n"),
          )
          .join("\n\n"),
      feedback: turn.feedback || "",
    })),
  };
}
