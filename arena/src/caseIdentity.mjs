export function newCaseCode() {
  return `CASE-${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}

export function caseCode(data) {
  return data?.case_code || data?.case_id || data?.case_number || "Saved case";
}

export function writtenCriteria(config) {
  // Actual information acquisition needs a question record. Other items retain their definitions.
  return (config?.presets?.["Clinical reasoning"] || []).filter(
    (id) => id !== "D5c",
  );
}

export function currentStudyVersion(config, rubricId = "clinical-reasoning") {
  const catalogue = config?.rubric_catalogue?.find((r) => r.id === rubricId);
  const versions = (config?.rule_versions || [{ id: "original" }]).filter(
    (v) => !catalogue || catalogue.versions.includes(v.id),
  );
  return (
    [
      catalogue?.current_version,
      config?.current_rules_version,
      "overleaf-20261024-read-20261028",
      "josh-proposed-20261024",
      "original",
    ].find((id) => versions.some((v) => v.id === id)) ||
    versions.at(-1)?.id ||
    "original"
  );
}

export function initialScoringVersion(config, draft) {
  const content =
    draft?.facts?.trim() || draft?.answer?.trim() || draft?.history?.trim();
  return (content || draft?._version_explicit) && draft?.rules_version
    ? draft.rules_version
    : currentStudyVersion(config, draft?.rubric_id);
}

export function scoringVersionSummary(id, config) {
  const version = (config?.rule_versions || []).find((v) => v.id === id) || {
    id,
    label: id,
  };
  if (id === "overleaf-20261024-read-20261028") return "24 Oct 2026";
  return scoringVersionLabel(version);
}

export function scoringVersionLabel(version) {
  return (
    {
      original: "Original definitions",
      "josh-proposed-20261024":
        "Revised problem representation & information seeking",
      "overleaf-20261024-read-20261028": "Manuscript rubric · 24 Oct 2026",
      "overleaf-20261024-retrieved-20261104-full22": "Full manuscript rubric · reviewed 4 Nov 2026",
    }[version.id] || version.label
  );
}

export function scoringVersionDescription(id) {
  return (
    {
      original: "Uses the original definitions for each rubric item.",
      "josh-proposed-20261024":
        "Updates problem representation (D3a) and information seeking (D5c). Other items keep their original definitions.",
      "overleaf-20261024-read-20261028":
        "Uses the saved manuscript definitions from 24 October, including revised D3a and D5c.",
    }[id] || "Uses the definitions saved with this scoring version."
  );
}
