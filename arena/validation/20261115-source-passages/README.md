# Saved source passages: implementation and checks

Case review now offers a collapsed **Source evidence** panel. The same read-only panel is available for Workspace cases. It shows the saved source version, matched passages, original paragraph text and adaptation notes. Passage clicks and source highlights navigate in both directions.

## Saved-archive result

| Status | Cases |
| --- | ---: |
| Newly linked full-text candidates | 90 |
| Newly linked partial excerpts | 5 |
| No usable saved full text or matching excerpt | 36 |
| Earlier mappings retained | 4 |

There are **99 available source mappings out of 135 cases**, including five partial excerpts. [All cases](ALL_CASES.md), [exceptions](EXCEPTIONS.md) and [manual review](MANUAL_REVIEW.md) identify the affected cases. No case, answer or score was regenerated.

## How the links were made

The offline run used already saved BMJ, Frontiers, JAMA and supplied-PDF archives. It made no publisher requests and no model calls. Each saved source carries a text hash, original block IDs and character intervals. `source_backfill.py` creates three kinds of candidate links:

1. A complete case-input phrase occurs literally in the source.
2. A previously saved source locator identifies an actual paragraph ID.
3. Weighted lexical overlap proposes a paragraph for manual comparison.

The 1,223 new records comprise 160 literal matches, 634 saved-locator matches and 429 lexical candidates. All source intervals, paragraph IDs and Python/UTF-16 positions passed technical validation. An exact source position establishes where a quotation occurs; it does not confirm that the paragraph supports every adapted case claim. Selected patient, clinical meaning and availability at the task's decision point remain **awaiting confirmation**.

Source-only links are stored separately from model extraction drafts. The endpoint binds automatic links to a case ID and case-facts hash, checks the source hash and verifies each interval. Invalid positions have no clickable source match. Incomplete block metadata falls back to the complete saved text without inventing PDF page locations.

The protected endpoint is `GET /api/literature/cases/{case_id}/source-evidence`; an optional `draft_id` selects a saved source version. Existing workspace authentication protects it. The panel does not alter extraction drafts or attach hidden source text to an answering prompt.

## Evidence included here

- [Findings](FINDINGS.md) and [position checks](POSITION_VALIDATION.json).
- [Local UI checks](BROWSER_CHECKS.json), [production UI checks](LIVE_BROWSER_CHECKS.json) and [135 production API checks](LIVE_API_CHECKS.json).
- [Published version 53](DEPLOYMENT.json) and [preservation checks](PRESERVATION_AFTER.json).
- `GITHUB_BUILD.txt`, `GITHUB_FRONTEND_TESTS.txt`, `GITHUB_HOSTING_TESTS.txt` and `GITHUB_BACKEND_TESTS.txt`: checks rerun from the isolated GitHub worktree.
- `GITHUB_SYNC_VALIDATION.json`: the synchronized base, scope, test totals and unchanged historical-data checks.
- `LOCAL_OUTPUT_ARCHIVE.json`: hash and size of the full local output archive, without uploading its contents.

The published-site checks and the GitHub-worktree checks are separate records. The deployed source includes other existing UI work; the GitHub patch includes only the source-review feature and required text-display components. Test totals are reported for their respective source trees.

Full archived papers, protected API responses, source/draft records and the 1,223 paired quotations in `MANUAL_REVIEW.csv` remain in the local protected run and workspace. They are not copied into this public repository. The original offline run script is retained there unchanged; the reusable linking and read-only validation functions are included in `arena/source_backfill.py` and `arena/source_evidence.py`.

## Repeat the software checks

```sh
PYTHONPATH=arena LITELLM_LOCAL_MODEL_COST_MAP=True .venv/bin/python -m pytest arena/tests -q
cd arena
npm ci
npm run build
npm run test:sites
node --test tests/*.test.mjs
```

The tests use synthetic or already saved fixtures. No provider generation or scoring calls are needed. Source offsets, stale-version rejection, read-only behaviour, protected access, Markdown display and browser-position projection have dedicated checks. Existing cases, scores and full outputs remain unchanged; clinical references and candidate associations remain **awaiting confirmation**.
