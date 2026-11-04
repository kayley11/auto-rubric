export const CONTRIBUTOR_STORAGE = "autorubric-contributor-id";
export const UNKNOWN_CONTRIBUTOR = "__not_recorded__";

export function contributorError(value) {
  return /^[A-Za-z0-9][A-Za-z0-9_.-]{0,79}$/.test((value || "").trim())
    ? ""
    : "Enter a Contributor ID using letters, digits, dots, underscores or hyphens.";
}

export function rememberedContributor() {
  try {
    return localStorage.getItem(CONTRIBUTOR_STORAGE) || "";
  } catch {
    return "";
  }
}

export function newSubmission(batchName = "Single case", filename = "") {
  return {
    contributor_id: rememberedContributor(),
    batch_id: crypto.randomUUID().replaceAll("-", ""),
    batch_name: batchName.slice(0, 160),
    filename: filename.slice(0, 255),
  };
}

export function caseSubmissions(record) {
  return record.submissions?.length
    ? record.submissions
    : [
        {
          contributor_id: "",
          batch_id: "earlier-records",
          batch_name: "Earlier records",
        },
      ];
}

export function workspaceOptions(rows) {
  const contributors = new Set(),
    batches = new Map();
  for (const row of rows)
    for (const entry of caseSubmissions(row)) {
      contributors.add(entry.contributor_id || UNKNOWN_CONTRIBUTOR);
      if (!batches.has(entry.batch_id)) batches.set(entry.batch_id, entry);
    }
  return {
    contributors: [...contributors].sort((a, b) => a.localeCompare(b)),
    batches: [...batches.values()].sort((a, b) =>
      (b.submitted_at || "").localeCompare(a.submitted_at || ""),
    ),
  };
}

export function filterWorkspaceCases(
  rows,
  {
    query = "",
    contributor = "",
    batch = "",
    mine = false,
    contributorId = "",
  } = {},
) {
  const q = query.trim().toLowerCase();
  return rows.filter((r) => {
    const entries = caseSubmissions(r);
    if (
      !entries.some(
        (s) =>
          (!contributor ||
            (s.contributor_id || UNKNOWN_CONTRIBUTOR) === contributor) &&
          (!batch || s.batch_id === batch) &&
          (!mine ||
            (!!contributorId.trim() &&
              s.contributor_id === contributorId.trim())),
      )
    )
      return false;
    return `${r.code} ${r.input.case_number || ""} ${r.input.title || ""} ${r.input.facts || ""} ${r.input.source || ""} ${entries.map((s) => `${s.contributor_id} ${s.batch_name} ${s.filename || ""}`).join(" ")}`
      .toLowerCase()
      .includes(q);
  });
}
