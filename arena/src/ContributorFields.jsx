import { useEffect, useState } from "react";
import {
  CONTRIBUTOR_STORAGE,
  rememberedContributor,
} from "./caseSubmission.mjs";

export function useContributor() {
  const [value, setValue] = useState(rememberedContributor);
  useEffect(() => {
    const update = () => setValue(rememberedContributor());
    window.addEventListener("arena-contributor-changed", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("arena-contributor-changed", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  function change(next) {
    setValue(next);
    try {
      localStorage.setItem(CONTRIBUTOR_STORAGE, next);
    } catch {
      /* Memory-only when storage is unavailable. */
    }
    window.dispatchEvent(new Event("arena-contributor-changed"));
  }
  return [value, change];
}

export function ContributorField({ value, onChange, disabled = false }) {
  return (
    <label className="field">
      Contributor ID
      <input
        aria-label="Contributor ID"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={80}
        disabled={disabled}
        placeholder="e.g. R01"
        autoComplete="off"
      />
      <small className="field-help">
        Use the same ID each time. Remembered on this browser; no registration
        required.
      </small>
    </label>
  );
}

export function SubmissionFields({
  contributor,
  onContributor,
  submission,
  onChange,
  disabled = false,
}) {
  return (
    <section
      className="case-submission-fields"
      aria-label="Case contributor and batch"
    >
      <div className="case-identity-fields">
        <ContributorField
          value={contributor}
          onChange={onContributor}
          disabled={disabled}
        />
        <label className="field">
          Batch name <span className="optional">optional</span>
          <input
            aria-label="Batch name"
            value={submission.batch_name || ""}
            maxLength={160}
            disabled={disabled}
            onChange={(e) =>
              onChange({ ...submission, batch_name: e.target.value })
            }
            placeholder="e.g. November case reports"
          />
          <small className="field-help">
            Groups these cases in Workspace cases.
          </small>
        </label>
      </div>
      <p className="field-help">
        Contributor IDs are self-declared under the shared login. Cases remain
        visible to all workspace members.
      </p>
    </section>
  );
}
