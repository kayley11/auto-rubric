import { useEffect, useState } from "react";
import {
  CONTRIBUTOR_STORAGE,
  rememberedContributor,
} from "./caseSubmission.mjs";

export const individualAccount = access => access?.authenticated && access.member_id !== "workspace" ? access.member_id || "" : "";

export function useContributor(access) {
  const account = individualAccount(access);
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
    if (account) return;
    setValue(next);
    try {
      localStorage.setItem(CONTRIBUTOR_STORAGE, next);
    } catch {
      /* Memory-only when storage is unavailable. */
    }
    window.dispatchEvent(new Event("arena-contributor-changed"));
  }
  return [account || value, change];
}

export function ContributorField({ value, onChange, disabled = false, accountId = "" }) {
  return (
    <label className="field">
      Contributor ID
      <input
        aria-label="Contributor ID"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={80}
        disabled={disabled}
        readOnly={!!accountId && accountId !== "workspace"}
        placeholder="e.g. R01"
        autoComplete="off"
      />
      <small className="field-help">
        {accountId && accountId !== "workspace" ? "Recorded automatically from your signed-in account." : "Use the same contributor ID with this shared login. Remembered on this browser."}
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
  accountId = "",
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
          accountId={accountId}
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
        {accountId && accountId !== "workspace" ? "New submissions are attributed to your account. Cases remain visible to all workspace members." : "Contributor IDs are self-declared under the shared login. Cases remain visible to all workspace members."}
      </p>
    </section>
  );
}
