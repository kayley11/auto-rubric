# Book cases navigation fix — 15 November 2026

Clicking **Book cases 5** rendered a blank page. The history summary read `item_statuses.scored`, but the current saved index uses `item_statuses.complete`. Formatting the missing value threw an exception during rendering, including when the history disclosure was collapsed. Refreshing returned to the default group and avoided that rendering branch.

The summary now accepts the current and historical count fields as aliases. Missing or invalid counts display an explicit unavailable message. They are never replaced with a zero clinical score. Optional historical audit metadata is also guarded.

## Verification

- The deployed website passed checks for nine case groups. C01–C05 each opened a 22-item result table. Switching groups and refreshing retained access to all five cases, with no new browser errors.
- This GitHub patch passes all 68 frontend tests, including the new current-index, legacy-index and missing-count regression test. The production build and all four Sites packaging tests pass.
- The earlier deployed-source check passed 73 frontend tests; its source also contains other UI work. `VALIDATION.json` preserves that original website verification. `GITHUB_VALIDATION.json` records the narrower patch against GitHub main.
- All 4,780 tracked dataset files covered by `PRESERVED_GITHUB_DATA_SHA256.json` remain byte-for-byte unchanged. No model generation or scoring calls were made.
- Clinical references and candidate information requirements remain **awaiting confirmation**.

## Evidence files

| File | Contents |
| --- | --- |
| `GITHUB_VALIDATION.json` | Checks for this GitHub patch and its base commit. |
| `VALIDATION.json`, `BROWSER_CHECKS.json`, `LIVE_CHECKS.json` | Original local and published-site checks. |
| `DEPLOYMENT.json` | Successful website version 52 deployment. |
| `BEFORE_BLANK.png`, `BOOK_CASES_LIVE_AFTER.png` | Before and after browser captures. |
| `frontend-tests.txt`, `sites-tests.txt`, `build.txt` | Complete successful command output for this checkout. |
| `frontend-before-build.txt` | Retained first check: the packaging test required the build files that had not yet been created. All tests passed after building. |
| `PRESERVED_GITHUB_DATA_SHA256.json` | Hashes for the existing tracked datasets. |
| `PUBLIC_BEFORE.json`, `GITHUB_DATA_CHECKS.json` | Website snapshot hashes and shared-file checks. Sites-generated `_public` cache files are not GitHub source files. |

The change is limited to the history summary, its regression test and these validation records. Existing cases, answers, grades, raw outputs, access settings and model configuration are retained. Runtime credentials and private workspace records are excluded.
