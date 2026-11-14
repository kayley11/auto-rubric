// Display saved states explicitly; never turn an unresolved scope decision into a job.
const itemStates = {
  applicability_pending: "Awaiting confirmation",
  not_applicable: "Not applicable",
  indeterminate: "Cannot assess",
  no_complete_answer: "No complete answer",
  pending: "Not yet scored",
  queued: "Not yet scored",
  needs_retry: "Scoring needs retry",
  error: "Scoring needs retry",
  failed: "Scoring needs retry",
};
const answerStates = {
  provider_unavailable: "Provider unavailable",
  queued: "Answer not started",
  partial: "Incomplete answer",
  rate_limited: "Rate limited",
  needs_retry: "Answer needs retry",
  no_complete_answer: "No complete answer",
};

export function itemResultText(result = {}, answerStatus) {
  if (itemStates[result.status]) return itemStates[result.status];
  const value = result.label !== undefined && result.label !== null && result.label !== ""
    ? result.label
    : result.score;
  if (result.status === "complete" || result.status === "scored")
    return value === undefined || value === null ? "Score not recorded" : String(value);
  if (result.status) return "Assessment status unavailable";
  if (value !== undefined && value !== null && value !== "") return String(value);
  return answerStates[answerStatus] || "Not yet scored";
}
