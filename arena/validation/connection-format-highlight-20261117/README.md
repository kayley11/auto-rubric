# Backend recovery, readable evidence and confirmed highlights

Repair verified: 17 November 2026. GitHub synchronization: 18 November 2026.

Public website: https://auto-rubric.kayley1026lzt.chatgpt.site
Deployed frontend: Sites version 56, source `f04402adf1ec9d5fda64874497bf8f50c3a1b91e`.

## Changes

- Explicitly close SQLite connections after transactions in membership, jobs, batches, reviews and personal API connections. Serialize short local database transactions, including open/close; model calls remain outside this lock.
- Bound HTTP request handling at 64 threads, return retryable overload responses, and apply a socket inactivity timeout.
- Recover an owned, unresponsive backend after repeated failed checks; recreate a live but expired Quick Tunnel and renew its signed public connection.
- Explain an unreachable evaluation server without assuming the computer is off; offer Check connection.
- Render saved scientific notation and clipped Markdown in reading views. Preserve original answers, exports, scores, evidence fingerprints and UTF-16 offsets. Restore the legacy formula's missing multiplication signs only after verification against archived rubric source.
- Ordinary text selection offers Highlight / Cancel. Only explicit Highlight creates a green draft. Save evidence note persists a note separately from a clinical rating. Automatic quote links remain awaiting review.

The existing deployed individual-account, personal API connection and persistent-queue modules were not yet in GitHub main. Their required runtime modules and matching UI are included so the repaired deployment can run from this checkout. No accounts, passwords, API connections or private records are copied. No model experiments were run for this synchronization.

## Cause and limits of the diagnosis

The original live process had 6,144 threads: 6,141 were waiting for Python RLocks; database opening and cleanup threads were waiting in SQLite native mutex operations. A concurrent database read test reproduced native open/close blocking. Connection contexts previously ended transactions without explicitly closing the handle. Unbounded request threads and a process-existence-only recovery check amplified the stall.

This identifies observed waits and application defects. It does not establish a particular SQLite library defect or a universal macOS limit of 6,144 threads. Tunnel-not-found errors were observed separately; they are not attributed to the database stall.

## Validation in the isolated GitHub checkout

| Check | Result |
|---|---|
| All Python arena tests | 293 passed; local fixtures, no live inference |
| All JavaScript tests | 88 passed, including the retained repository-specific worker checks |
| Production frontend build | Passed |
| `npm run test:sites` | Passed |
| Current and archived public format scan | 505 JSON files, 456,209 string fields; 658 notation fields formatted; no unresolved clinical notation or checked Markdown artifacts |
| Historical data preservation | 4,780 tracked files under public data, study data and the original clinical pilot unchanged; no files deleted |
| Secret scan | No known private values or high-confidence key patterns in proposed files; private runtime files excluded |

The deployed checkout has one additional generated public route manifest, giving 506 JSON files in its original scan. Both scans are retained separately. The historical source data is unchanged. The deployed checkout and the GitHub checkout use different worker import paths; the first test attempt and the corrected repository-specific result are both retained.

## Evidence

- [Original Chinese repair report](REPORT_CN.md)
- [Original backend checks](backend-tests.txt) and [original frontend checks](frontend-tests.txt)
- [GitHub Python checks](github-python-tests.txt)
- [GitHub frontend build and checks](github-frontend-tests.txt)
- [Initial frontend test attempt](github-frontend-first-attempt.txt)
- [Original format scan](format-audit.json), [GitHub format scan](github-format-audit.json) and [scan command output](github-format-check.txt)
- [Pre-repair notation examples](format-before.json) and [clipped Markdown examples](markdown-before.json)
- [Source-verified formula repair](verified-reading-repair.json)
- [Published-site verification](live-verification.json) and [highlight confirmation screenshot](highlight-confirmation-public.jpg)
- [Data preservation check](preservation-check.json)
- [Secret-scan result](secret-scan.json); values are neither printed nor recorded

Raw private process logs and account/database configuration remain local. Previous research cases, grades and complete outputs remain in their existing repository archives.

Clinical references and candidate information requirements remain **awaiting confirmation**. A text-link check or a confirmed highlight does not change a clinical grade.
