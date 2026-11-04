import { BookOpen, ChevronDown } from "lucide-react";
import { backendName, modelOption } from "./modelIdentity.mjs";
import {
  scoringVersionDescription,
  scoringVersionLabel,
  scoringVersionSummary,
  currentStudyVersion,
} from "./caseIdentity.mjs";

// The server supplies the catalogue. A rubric and its scoring revision are separate choices.
export const clinicalRubricId = "clinical-reasoning";
export function rubricCatalogue(config) {
  return (
    config?.rubric_catalogue || [
      {
        id: clinicalRubricId,
        name: "Clinical reasoning rubric",
        description:
          "Clinical reasoning, evidence use, communication and safety.",
        versions: (
          config?.rule_versions || [
            { id: "original", label: "Original rubric" },
          ]
        ).map((v) => v.id),
      },
    ]
  );
}

export function EvaluationSetup({
  config,
  form,
  change,
  multiple = false,
  disabled = false,
  pasted = false,
  onCriteria,
  onViewCriteria,
  scored = false,
  onResults,
}) {
  const catalogue = rubricCatalogue(config);
  const selected =
    catalogue.find((r) => r.id === (form.rubric_id || clinicalRubricId)) ||
    catalogue[0];
  const models = (config?.settings.models || []).map((m) =>
    typeof m === "string" ? m : m.id,
  );
  const chosen = Array.isArray(form.answer_models)
    ? form.answer_models
    : [form.answer_model];
  const versions = (
    config?.rule_versions || [{ id: "original", label: "Original rubric" }]
  ).filter((v) => selected.versions.includes(v.id));
  return (
    <section
      className="panel evaluation-setup"
      aria-labelledby="evaluation-setup-title"
    >
      <div className="panel-heading">
        <h2 id="evaluation-setup-title">Rubric & models</h2>
        <button
          className="text-button"
          type="button"
          disabled={!config}
          onClick={onViewCriteria || onCriteria}
        >
          <BookOpen size={15} /> View definitions
        </button>
      </div>
      <div className="setup-fields">
        <label className="field">
          Rubric
          <select
            aria-label="Rubric"
            value={selected.id}
            disabled={disabled || !config}
            onChange={(e) => change("rubric_id", e.target.value)}
          >
            {catalogue.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Scoring model
          <select
            aria-label="Scoring model"
            value={form.judge_model}
            disabled={disabled || !config}
            onChange={(e) => change("judge_model", e.target.value)}
          >
            {models.map((id) => (
              <option key={id} value={id}>
                {modelOption(id)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="scoring-version-summary">
        {form.rules_version === currentStudyVersion(config, selected.id)
          ? "Current study version"
          : "Selected scoring version"}{" "}
        · {scoringVersionSummary(form.rules_version || "original", config)}
        {form.rules_version !== "original" && (
          <span> · awaiting confirmation</span>
        )}
      </p>
      <div className="assessment-items-row">
        <div>
          <b>Assessment items</b>
          <span>
            {form.criteria.length} selected ·{" "}
            {scored
              ? "Saved item scores and reasons"
              : "Choose which rubric items to score"}
          </span>
        </div>
        <button
          type="button"
          className="assessment-items-button"
          disabled={(!scored && disabled) || !config}
          onClick={scored ? onResults : onCriteria}
        >
          <BookOpen size={17} /> {scored ? "View item results" : "Choose items"}
          <span className="assessment-items-count">{form.criteria.length}</span>
          <ChevronDown size={15} />
        </button>
      </div>
      {multiple ? (
        <fieldset
          className="answer-model-choices"
          disabled={disabled || pasted || !config}
        >
          <legend>
            Answer models <span>Select one or more to compare</span>
          </legend>
          <div className="model-choice-list">
            {models.map((id) => (
              <label
                key={id}
                className={`model-choice ${chosen.includes(id) ? "selected" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={chosen.includes(id)}
                  onChange={(e) =>
                    change(
                      "answer_models",
                      e.target.checked
                        ? [...chosen, id]
                        : chosen.filter((m) => m !== id),
                    )
                  }
                />
                <span>
                  <b>{id}</b>
                  {backendName(id) && <small>{backendName(id)}</small>}
                </span>
              </label>
            ))}
          </div>
          {pasted && (
            <p className="field-help">
              The supplied answer is scored once. No answer model is called.
            </p>
          )}
          {!pasted && (
            <p className="field-help">
              {chosen.length} selected. Each model generates its own answer; the
              scoring model evaluates each answer with the same selected rubric.
            </p>
          )}
        </fieldset>
      ) : (
        <label className="field single-answer-model">
          Answer model
          <select
            aria-label="Answer model"
            value={form.answer_model}
            disabled={disabled || pasted || !config}
            onChange={(e) => change("answer_model", e.target.value)}
          >
            {models.map((id) => (
              <option key={id} value={id}>
                {modelOption(id)}
              </option>
            ))}
          </select>
          {pasted && (
            <small className="field-help">
              Your pasted answer is scored as supplied; no answer model is
              called.
            </small>
          )}
        </label>
      )}
      <details className="setup-advanced">
        <summary>
          Advanced settings <ChevronDown size={14} />
        </summary>
        <label className="field">
          Scoring version
          <select
            aria-label="Scoring version"
            value={form.rules_version || "original"}
            disabled={disabled || !config}
            onChange={(e) => change("rules_version", e.target.value)}
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {scoringVersionLabel(v)}
              </option>
            ))}
          </select>
        </label>
        <p className="field-help">
          {scoringVersionDescription(form.rules_version || "original")} Use a
          historical version to repeat or compare earlier scoring. Saved results
          keep their original version.
        </p>
      </details>
      <p className="setup-note">
        {selected.description} References and candidate information requirements
        are awaiting confirmation.
      </p>
    </section>
  );
}
