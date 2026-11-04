import { useEffect, useState } from "react";
import { LockKeyhole, Save } from "lucide-react";
import { Decisions, RuleView, request } from "./StudyTools";
import { scoringVersionLabel } from "./caseIdentity.mjs";

export function HigherDecisions({ access, onUseData, onUpdated }) {
  const allowed = !access?.hosted || access.can_manage_rubric;
  const [catalogue, setCatalogue] = useState(null),
    [cases, setCases] = useState([]);
  const [tab, setTab] = useState("rules"),
    [id, setId] = useState("");
  const [version, setVersion] = useState(""),
    [item, setItem] = useState("D3a");
  const [draft, setDraft] = useState(null),
    [label, setLabel] = useState(""),
    [reason, setReason] = useState("");
  const [makeDefault, setMakeDefault] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function load() {
    const data = await request("/api/rubrics/manage");
    setCatalogue(data);
    setVersion(data.active);
    setCases(await request("/api/decisions"));
  }
  useEffect(() => {
    if (allowed) load().catch((e) => setMessage(e.message));
  }, [allowed]);
  useEffect(() => {
    setDraft(
      catalogue?.snapshots?.[version]?.criteria.find((c) => c.id === item) ||
        null,
    );
  }, [catalogue, version, item]);
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = await request("/api/rubrics/manage", {
        base_version: version,
        label,
        reason,
        make_default: makeDefault,
        changes: { [item]: draft },
      });
      setMessage(
        `New version saved: ${result.label}. Existing inputs, scores and rubric snapshots are unchanged.`,
      );
      setLabel("");
      setReason("");
      setMakeDefault(false);
      await load();
      onUpdated?.();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="study higher-decisions">
      <p className="eyebrow">HIGHER-LEVEL DECISIONS</p>
      <h1>Rubric and scoring decisions.</h1>
      <p>
        Authorised editors can save a new rubric version or confirm
        case-specific scoring requirements. Ordinary review records a grade; it
        does not change the rubric.
      </p>
      {!allowed ? (
        <div className="panel restricted-panel">
          <LockKeyhole />
          <h2>Authorised editor access required</h2>
          <p>
            Your current account can evaluate and review answers. Only the
            rubric editor account can change scoring rules or confirm
            requirements.
          </p>
          <p>
            Use Sign out, then sign in with the rubric editor account to open
            these controls.
          </p>
        </div>
      ) : (
        <>
          <nav className="saved-evaluation-tabs">
            <button
              className={tab === "rules" ? "selected" : ""}
              onClick={() => setTab("rules")}
            >
              Rubric versions
            </button>
            <button
              className={tab === "requirements" ? "selected" : ""}
              onClick={() => setTab("requirements")}
            >
              Case requirements & references
            </button>
          </nav>
          {message && (
            <p className="notice" role="status">
              {message}
            </p>
          )}
          {tab === "rules" && catalogue && draft && (
            <form className="panel rubric-editor" onSubmit={save}>
              <h2>Save a revised rubric</h2>
              <p>
                Edits create a separate version. Making it the default affects
                new evaluations only. Clinical references remain awaiting
                confirmation.
              </p>
              <div className="decision-grid">
                <label className="field">
                  Base version
                  <select
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                  >
                    {catalogue.versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {scoringVersionLabel(v)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Rubric item
                  <select
                    value={item}
                    onChange={(e) => setItem(e.target.value)}
                  >
                    {catalogue.snapshots[version].criteria.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.id})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <RuleView
                cid={item}
                rule={catalogue.snapshots[version].criteria.find(
                  (c) => c.id === item,
                )}
              />
              <label className="field">
                Definition
                <textarea
                  value={draft.definition}
                  onChange={(e) =>
                    setDraft({ ...draft, definition: e.target.value })
                  }
                  required
                  rows={4}
                />
              </label>
              <div className="rubric-anchor-editor">
                {["1", "2", "3", "4", "5"].map((n) => (
                  <label className="field" key={n}>
                    Score {n}
                    <textarea
                      value={draft.anchors[n] || ""}
                      placeholder="Leave blank if this grade has no defined anchor"
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          anchors: { ...draft.anchors, [n]: e.target.value },
                        })
                      }
                      rows={2}
                    />
                  </label>
                ))}
              </div>
              <label className="field">
                Applicability
                <textarea
                  value={draft.applicability || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, applicability: e.target.value })
                  }
                />
              </label>
              {draft.notes_vs_patient_directed_explanations && (
                <label className="field">
                  Where explanations may appear
                  <textarea
                    value={draft.notes_vs_patient_directed_explanations}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        notes_vs_patient_directed_explanations: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </label>
              )}
              {["essential_scoring_rules", "relationship_to_D5c"]
                .filter((k) => draft[k])
                .map((k) => (
                  <label className="field" key={k}>
                    {k === "essential_scoring_rules"
                      ? "Essential scoring rules · one per line"
                      : "Relationship to information seeking · one per line"}
                    <textarea
                      value={draft[k].join("\n")}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          [k]: e.target.value.split("\n").filter(Boolean),
                        })
                      }
                      rows={4}
                    />
                  </label>
                ))}
              <label className="field">
                New version label
                <input
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Clinical rubric · reviewed revision"
                  maxLength={150}
                />
              </label>
              <label className="field">
                Reason for the change
                <textarea
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                />
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={makeDefault}
                  onChange={(e) => setMakeDefault(e.target.checked)}
                />{" "}
                Use this version by default for future evaluations
              </label>
              <button className="primary" disabled={busy}>
                <Save size={15} />
                {busy ? "Saving…" : "Save as a new version"}
              </button>
            </form>
          )}
          {tab === "requirements" && (
            <section className="panel">
              <label className="field">
                Case and saved evidence
                <select value={id} onChange={(e) => setId(e.target.value)}>
                  <option value="">Choose a case</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.case_id} · {c.name} · {c.response}
                    </option>
                  ))}
                </select>
              </label>
              {id && <Decisions key={id} id={id} onUseData={onUseData} />}
            </section>
          )}
        </>
      )}
    </main>
  );
}
