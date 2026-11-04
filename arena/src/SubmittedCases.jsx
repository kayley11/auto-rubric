import { useEffect, useState } from "react";
import { ArrowRight, RefreshCw, Search } from "lucide-react";
import { request } from "./StudyTools";
import { savedComparisonGroups } from "./evaluationHistory.mjs";
import { scoringVersionLabel } from "./caseIdentity.mjs";
import { ContributorField, useContributor } from "./ContributorFields";
import {
  caseSubmissions,
  filterWorkspaceCases,
  UNKNOWN_CONTRIBUTOR,
  workspaceOptions,
} from "./caseSubmission.mjs";

export function SubmittedCases({ access }) {
  const [contributorId, setContributorId] = useContributor();
  const [contributor, setContributor] = useState("");
  const [batch, setBatch] = useState("");
  const [mine, setMine] = useState(false);
  const [rows, setRows] = useState([]),
    [selected, setSelected] = useState("");
  const [search, setSearch] = useState(""),
    [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function reload() {
    if (access?.hosted && !access.authenticated) {
      setRows([]);
      setError("");
      return;
    }
    setLoading(true);
    try {
      setRows(await request("/api/cases/submitted"));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    reload();
    window.addEventListener("arena-cases-saved", reload);
    window.addEventListener("arena-evaluations-saved", reload);
    window.addEventListener("focus", reload);
    const storage = (e) => {
      if (e.key === "autorubric-evaluations-updated") reload();
    };
    window.addEventListener("storage", storage);
    return () => {
      window.removeEventListener("arena-cases-saved", reload);
      window.removeEventListener("arena-evaluations-saved", reload);
      window.removeEventListener("focus", reload);
      window.removeEventListener("storage", storage);
    };
  }, [access?.authenticated]);
  const options = workspaceOptions(rows);
  const matching = filterWorkspaceCases(rows, {
    query: search,
    contributor,
    batch,
    mine,
    contributorId,
  });
  const record = matching.find((r) => r.id === selected);
  function clearFilters() {
    setSearch("");
    setContributor("");
    setBatch("");
    setMine(false);
  }
  function openRun(id) {
    window.dispatchEvent(
      new CustomEvent("arena-open-evaluation", { detail: { id } }),
    );
  }
  return (
    <section className="submitted-cases">
      <div className="panel-heading">
        <div>
          <h2>Workspace cases</h2>
          <p>
            Imported and submitted cases are saved on the backend with their
            source, input and evaluation history. Filter by contributor or
            batch. All signed-in workspace members can view these cases.
          </p>
        </div>
        <button className="secondary" disabled={loading} onClick={reload}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>
      {error && <p className="error-banner">{error}</p>}
      {access?.hosted && !access.authenticated ? (
        <div className="notice">
          Sign in to view or add workspace cases. The published case library
          remains public.{" "}
          <button
            className="text-button"
            onClick={() => window.dispatchEvent(new Event("arena-sign-in"))}
          >
            Sign in
          </button>
        </div>
      ) : (
        <>
          <div className="workspace-case-filters">
            <ContributorField
              value={contributorId}
              onChange={setContributorId}
            />
            <label className="field">
              Added by
              <select
                aria-label="Filter cases by contributor"
                value={contributor}
                onChange={(e) => {
                  setContributor(e.target.value);
                  setMine(false);
                }}
              >
                <option value="">All contributors</option>
                {options.contributors.map((id) => (
                  <option key={id} value={id}>
                    {id === UNKNOWN_CONTRIBUTOR
                      ? "Not recorded (earlier cases)"
                      : id}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Import batch
              <select
                aria-label="Filter cases by batch"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
              >
                <option value="">All batches</option>
                {options.batches.map((entry) => (
                  <option key={entry.batch_id} value={entry.batch_id}>
                    {entry.batch_name}
                    {entry.submitted_at
                      ? ` · ${new Date(entry.submitted_at).toLocaleDateString("en-GB")}`
                      : ""}
                    {entry.batch_id !== "earlier-records"
                      ? ` · ${entry.batch_id.slice(-6)}`
                      : ""}
                  </option>
                ))}
              </select>
            </label>
            <div className="workspace-filter-actions">
              <button
                className={mine ? "primary" : "secondary"}
                disabled={!contributorId.trim()}
                aria-pressed={mine}
                onClick={() => {
                  setMine(!mine);
                  setContributor("");
                }}
              >
                My added cases
              </button>
              <button className="text-button" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
            <p className="field-help workspace-sharing-note">
              Contributor IDs are self-declared under the shared login. Earlier
              cases keep their original records; missing attribution is shown as
              Not recorded.
            </p>
          </div>
          <div className="case-browser">
            <section className="case-picker">
              <label className="search">
                <Search size={16} />
                <input
                  aria-label="Search workspace cases"
                  placeholder="Case code, source row or symptoms"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <p className="case-count">
                {loading
                  ? "Loading workspace cases…"
                  : `${matching.length} of ${rows.length} saved cases`}
              </p>
              <div className="case-list">
                {matching.map((r) => (
                  <button
                    key={r.id}
                    className={`case-option ${r.id === selected ? "selected" : ""}`}
                    onClick={() => setSelected(r.id)}
                  >
                    <small>{r.code || r.input.case_code || "Saved case"}</small>
                    <b>
                      {r.input.title !== r.input.case_code
                        ? r.input.title
                        : r.input.facts.slice(0, 90)}
                    </b>
                    <small>{r.runs.length} saved evaluations</small>
                    <small className="case-provenance">
                      Added by{" "}
                      {[
                        ...new Set(
                          caseSubmissions(r).map(
                            (s) => s.contributor_id || "Not recorded",
                          ),
                        ),
                      ].join(", ")}
                    </small>
                    <small>
                      {[
                        ...new Set(caseSubmissions(r).map((s) => s.batch_name)),
                      ].join(" · ")}
                    </small>
                  </button>
                ))}
                {!loading && !matching.length && (
                  <p>No cases match these filters. Try Clear filters.</p>
                )}
              </div>
            </section>
            <section className="panel submitted-case-detail">
              {!record ? (
                <>
                  <h2>Choose a workspace case</h2>
                  <p>
                    Select a case to read its original input, source and saved
                    model evaluations. Save an import without running models, or
                    run it from New evaluation.
                  </p>
                </>
              ) : (
                <>
                  <p className="eyebrow">
                    {record.code || record.input.case_code}{" "}
                    {record.input.case_number
                      ? `· Source row ${record.input.case_number}`
                      : ""}
                  </p>
                  <h2>
                    {record.input.title !== record.input.case_code
                      ? record.input.title
                      : "Submitted case"}
                  </h2>
                  <section className="case-submission-history">
                    <h3>Contributor & batch</h3>
                    {caseSubmissions(record).map((entry) => (
                      <div key={`${entry.batch_id}/${entry.contributor_id}`}>
                        <b>{entry.contributor_id || "Not recorded"}</b>
                        <span>{entry.batch_name}</span>
                        {entry.filename && (
                          <small>File: {entry.filename}</small>
                        )}
                        {entry.submitted_at && (
                          <small>
                            {new Date(entry.submitted_at).toLocaleString(
                              "en-GB",
                            )}
                          </small>
                        )}
                        <code title="Batch ID">{entry.batch_id}</code>
                      </div>
                    ))}
                  </section>
                  {[
                    ["Case facts", record.input.facts],
                    ["Task", record.input.task],
                    ["Source", record.input.source],
                    ["Earlier context", record.input.history],
                    [
                      "Reference · awaiting confirmation",
                      record.input.reference,
                    ],
                  ]
                    .filter(([, v]) => v)
                    .map(([name, value]) => (
                      <section key={name}>
                        <h3>{name}</h3>
                        <p className="case-prewrap">{value}</p>
                      </section>
                    ))}
                  <h3>Model evaluations</h3>
                  <button
                    className="primary"
                    disabled={access?.hosted && !access.can_evaluate}
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent("arena-use-workspace-case", {
                          detail: { data: record.input },
                        }),
                      )
                    }
                  >
                    Evaluate this case <ArrowRight size={14} />
                  </button>
                  {!record.runs.length && (
                    <p>
                      No answers have been generated or scored for this saved
                      case.
                    </p>
                  )}
                  {savedComparisonGroups(record.runs).map((g) => (
                    <button
                      key={g.id}
                      className="secondary"
                      onClick={() =>
                        window.dispatchEvent(
                          new CustomEvent("arena-open-comparison", {
                            detail: { records: g.records },
                          }),
                        )
                      }
                    >
                      Open this case’s comparison <ArrowRight size={14} />
                    </button>
                  ))}
                  <div className="submitted-run-list">
                    {record.runs.map((r) => (
                      <button
                        key={r.id}
                        className="secondary"
                        onClick={() => openRun(r.id)}
                      >
                        <b>
                          {r.answer_model === "provided-answer"
                            ? "Provided answer"
                            : r.answer_model}
                        </b>
                        <span>
                          {r.graded}/{r.total} items · {r.status}
                        </span>
                        <small>
                          {scoringVersionLabel(
                            r.rubric_version || { id: "original" },
                          )}{" "}
                          · {new Date(r.created_at).toLocaleDateString("en-GB")}
                        </small>
                        <ArrowRight size={14} />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        </>
      )}
    </section>
  );
}
