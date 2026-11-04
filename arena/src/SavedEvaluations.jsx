import { useState } from "react";
import { ArrowRight, RefreshCw, Search } from "lucide-react";
import { EvidenceDialog } from "./EvidenceDialog";
import {
  filterEvaluations,
  isTechnicalCheck,
  savedEvaluationLabel,
  savedComparisonGroups,
} from "./evaluationHistory.mjs";
import { scoringVersionLabel } from "./caseIdentity.mjs";
import { backendName } from "./modelIdentity.mjs";

const statuses = {
  generating: "Generating answer",
  answer_ready: "Answer ready",
  scoring: "Scoring",
  complete: "Complete",
  partial: "Needs retry",
  error: "Needs retry",
  stopped: "Paused",
  interrupted: "Interrupted",
  interviewing: "Interview in progress",
};
export function SavedEvaluations({
  records,
  busy,
  onOpen,
  onOpenComparison,
  onClose,
  onRefresh,
  needsSignIn,
  onSignIn,
}) {
  const [group, setGroup] = useState("evaluations");
  const [search, setSearch] = useState("");
  const technical = records.filter(isTechnicalCheck).length;
  const rows = filterEvaluations(records, group, search);
  const matchingIds = new Set(rows.map((r) => r.id));
  const comparisons = savedComparisonGroups(
    filterEvaluations(records, group),
  ).filter((g) => g.records.some((r) => matchingIds.has(r.id)));
  const RecordsContainer = comparisons.length ? "details" : "section";
  return (
    <EvidenceDialog
      title="Saved evaluations"
      onClose={onClose}
      actions={
        <button type="button" className="text-button" onClick={onRefresh}>
          <RefreshCw size={14} /> Refresh
        </button>
      }
    >
      <p className="saved-evaluations-intro">
        Reopen a comparison table or an individual answer. Results belong to
        this workspace; opening them does not call a model or change scores.
      </p>
      <nav
        className="saved-evaluation-tabs"
        aria-label="Saved evaluation groups"
      >
        <button
          type="button"
          aria-pressed={group === "evaluations"}
          className={group === "evaluations" ? "selected" : ""}
          onClick={() => setGroup("evaluations")}
        >
          Evaluations <span>{records.length - technical}</span>
        </button>
        <button
          type="button"
          aria-pressed={group === "technical"}
          className={group === "technical" ? "selected" : ""}
          onClick={() => setGroup("technical")}
        >
          Technical checks <span>{technical}</span>
        </button>
      </nav>
      {group === "technical" && (
        <p className="technical-check-note">
          Deployment checks verify the website’s connection, scoring and saving
          flow. They are retained separately from clinical experiment results.
        </p>
      )}
      <label className="search saved-evaluation-search">
        <Search size={16} />
        <input
          aria-label="Search saved evaluations"
          placeholder="Search case codes, evaluation IDs or titles"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      {comparisons.length > 0 && (
        <section
          className="saved-comparison-list"
          aria-label="Saved comparison tables"
        >
          <h3>Saved comparison tables</h3>
          {comparisons.map((g) => (
            <div className="saved-comparison-card" key={g.id}>
              <div>
                <b>
                  {g.cases} {g.cases === 1 ? "case" : "cases"} ·{" "}
                  {g.models.length}{" "}
                  {g.models.length === 1 ? "answer model" : "answer models"}
                </b>
                <p>
                  {g.models
                    .map((m) =>
                      m === "provided-answer"
                        ? "Provided answer"
                        : `${m}${backendName(m) ? ` · ${backendName(m)}` : ""}`,
                    )
                    .join("; ")}
                </p>
                <small>
                  {g.complete}/{g.records.length} saved evaluations complete ·{" "}
                  {g.created_at
                    ? new Date(g.created_at).toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "Saved comparison"}
                </small>
              </div>
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={() => onOpenComparison(g.records)}
              >
                Open comparison <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </section>
      )}
      {rows.length ? (
        <RecordsContainer className="saved-evaluations-scroll">
          {comparisons.length > 0 && (
            <summary>Individual evaluations · {rows.length}</summary>
          )}
          <table className="saved-evaluations-table">
            <thead>
              <tr>
                <th>Evaluation</th>
                <th>Status</th>
                <th>Items assessed</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((record) => (
                <tr key={record.id}>
                  <th scope="row">
                    <b>{savedEvaluationLabel(record)}</b>
                    {record.title && record.title !== record.case_code && (
                      <span>{record.title}</span>
                    )}
                    <small>
                      {scoringVersionLabel({
                        id: record.rubric_version?.id || "original",
                        label: record.rubric_version?.label || "Saved version",
                      })}
                    </small>
                    {record.answer_model && (
                      <small>
                        {record.answer_model === "provided-answer"
                          ? "Provided answer"
                          : `${record.answer_model}${backendName(record.answer_model) ? ` · ${backendName(record.answer_model)}` : ""}`}
                      </small>
                    )}
                  </th>
                  <td>{statuses[record.status] || record.status}</td>
                  <td>
                    {record.graded} / {record.total}
                  </td>
                  <td>
                    {record.created_at
                      ? new Date(record.created_at).toLocaleString("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "—"}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="secondary"
                      disabled={busy}
                      onClick={() => onOpen(record.id)}
                    >
                      Open <ArrowRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </RecordsContainer>
      ) : (
        <div className="saved-evaluations-empty">
          {needsSignIn ? (
            <>
              <p>Sign in to see this workspace’s saved evaluations.</p>
              <button type="button" className="primary" onClick={onSignIn}>
                Sign in
              </button>
            </>
          ) : (
            <p>
              {search
                ? "No saved evaluations match this search."
                : group === "technical"
                  ? "No technical checks are saved."
                  : "No evaluations are saved yet."}
            </p>
          )}
        </div>
      )}
      <p className="field-help">
        Answer ready means an answer is saved but scoring is unfinished. “Items
        assessed” shows progress, not a clinical score.
      </p>
    </EvidenceDialog>
  );
}
