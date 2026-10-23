# Eight cases: comparison after matching repairs

The set is **C01–C05 (PACES), plus N02/N04/N05 (new reports)**. N04 uses its initial, pre-antibody snapshot. C05 addresses the patient, N02 the patient/family, and the others clinical teams.

arc:lite, arc:chat and arc:apex used identical facts, openings, release rules, final tasks and a six-turn maximum. Patient statements were fixed. **arc:apex graded all three through AutoRubric**, including itself; parameters and rubric descriptions stayed unchanged.

KCL reported backends: lite = Qwen3.8-27B; chat = Qwen3.8-Flash-Next; apex = GLM-5.3.

- **D5c — Context seeking:** the interview and assessment notes, with the full inventory available to the judge.
- **D3a — Problem representation:** the final answer using obtained information only; the complete-case reference was withheld.

## Matching repairs

| Case | Correction |
| --- | --- |
| C02 | Recognise personal past-history questions despite missing/wrong topic tags. |
| C03 | Separate family from personal history; recognise travel/antibiotics; avoid unrelated symptom releases from narrow questions. |
| N04 | Match report type, admission and dates; separate current medicines from earlier treatment; PCR requests do not automatically retrieve CSF cell counts. |
| N05 | Do not return GLA/enzyme results for TTR requests, or cardiac MRI for brain/spine requests. |

C03/N04 needed further technical reruns. The final comparison uses the latest revision for each case; all nine intermediate interviews are retained.

## Information returned: before → after

Cells count complete information groups returned, including opening facts; they are not a clinical checklist. “Before” is the preceding three-model round and includes its matching errors. A decrease can reflect correctly withheld information.

| Case · available groups | arc:lite | arc:chat | arc:apex |
| --- | --- | --- | --- |
| C01 — Swelling/arthritis · 4 | 4 → 4 | 4 → 4 | 4 → 4 |
| C02 — Gait imbalance · 5 | 5 → 5 | 2 → 5 | 5 → 5 |
| C03 — Bloody diarrhoea · 6 | 5 → 4 | 6 → 4 | 5 → 4 |
| C04 — Collapses · 5 | 4 → 4 | 2 → 2 | 2 → 2 |
| C05 — Seizure explanation · 4 | 1 → 2 | 1 → 4 | 3 → 3 |
| N02 — Night-time episodes · 10 | 5 → 7 | 8 → 8 | 9 → 9 |
| N04 — Recurrent headache · 10 | 8 → 5 | 7 → 6 | 6 → 6 |
| N05 — Gut/cardiac findings · 10 | 7 → 6 | 8 → 7 | 7 → 6 |

### What differs between cases/models

- **C02:** repaired replay confirms chat's old question was adequate; all three now obtained the past neurological history.
- **C03:** none obtained shin-lesion history. arc:chat/apex also missed back stiffness; arc:lite missed travel.
- **C04:** only arc:lite obtained previous infarction/pacemaker history; all missed living-alone information.
- **C05:** chat obtained all four groups; lite missed CT/occupation, apex occupation.
- **N02:** only arc:apex requested and obtained glucose. All missed the daytime examination; arc:lite also missed EEG. Earlier, all three had missed glucose.
- **N04:** only chat obtained readmission CSF. The initial examination/CT group remained incomplete. Apex's infection request “on that admission” received clarification: a matching limitation, not an unconsidered test.
- **N05:** all lost the previously unrequested GLA/enzyme group. All missed historical vital signs/cardiac MRI; arc:lite/apex also missed PYP. arc:chat did not request genetic testing.

## Final rubric scores

Each cell is **D5c / D3a**, not an overall score. C05/N02 remain patient-facing tasks without an explicit separate-summary requirement.

| Case | arc:lite | arc:chat | arc:apex |
| --- | --- | --- | --- |
| C01 | 5 / 5 | 5 / 5 | 5 / 5 |
| C02 | 5 / 5 | 5 / 5 | 5 / 5 |
| C03 | 4 / 5 | 5 / 5 | 4 / 5 |
| C04 | 5 / 5 | 5 / 5 | 5 / 5 |
| C05 | 4 / 4 | 5 / 5 | 4 / 4 |
| N02 | 4 / 5 | 4 / 4 | 4 / 5 |
| N04 | 5 / 5 | 5 / 5 | 5 / 5 |
| N05 | 5 / 5 | 5 / 5 | 5 / 5 |

Seven of 48 ratings changed: C02 lite D5c 4→5; C03 lite/apex D5c 5→4; C05 lite/apex D3a 5→4; C05 chat D5c/D3a 4→5. The final run saved 24 answers and 131 question–reply turns.

**An unresolved scoring rule:** C03 chat's D5c=5 credited explanations in saved assessment notes. Lite's D5c=4 explicitly rejected assessment-only explanations. Also, D5c has original descriptions for 1, 3 and 5 only; its grades of 4 are provisional.

These are single-run observations; untouched-case reruns also varied. C03 apex exceeded its 350-word limit at 356 and was retained; only D5c/D3a were scored.

[New case context](01_NEW_CASES.md) · [Interpretation and decisions needed](03_FINAL_FINDINGS.md)
