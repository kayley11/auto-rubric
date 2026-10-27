# Public website — 26 October 2026

Published: https://auto-rubric.kayley1026lzt.chatgpt.site

Sites version 1 is public. The existing Python AutoRubric engine runs on this computer behind a protected outbound tunnel. No paid service was opened.

## What is available

- Public browsing of the saved study, evidence, repeated grades and downloads: 264 read-only routes, including the 24 saved interviews.
- Account access for generation, original/proposed rubric scoring, exports and review saving. Evaluations and review records are stored locally per account.
- Generic interface wording and reviewer IDs. Pending clinical references and information requirements are marked **awaiting confirmation**.
- Public display copies remove historical name labels. The original study files and raw archives remain unchanged.

## What passed

The published HTTPS site was checked for public browsing, member sign-in and secure session cookies. A small synthetic answer was generated and scored using the original rubric. The saved N02 interview was also scored with proposed D3a and D5c. Its first D3a request timed out; retrying the same saved input completed both items. The timeout and complete outputs are retained separately under the ignored `arena/.data/public-access/deployment-*` files. These calls validate deployment and are excluded from clinical research results.

All six export formats returned successfully. A blank human rating with a deployment-check note was saved; no human clinical score was assigned. Anonymous model calls were denied, the review-only account could not start model jobs, and member runs were isolated.

## Complete outputs

The [outputs folder](outputs/) contains 13 complete files copied without content changes from the deployment checks. [manifest.json](outputs/manifest.json) records each file’s source name, size and SHA-256. Actual API keys, access passwords, password hashes and bridge/session secrets were checked before copying, with no matches. Local account configuration and general private evaluation records are excluded.

| Check | Saved material |
| --- | --- |
| Answer generation | [Generation record](outputs/deployment-generation.json) |
| Original rubric | [Complete raw output](outputs/deployment-original.raw.txt), [JSON](outputs/deployment-original.json), [TXT](outputs/deployment-original.txt), [CSV](outputs/deployment-original.csv) |
| Review exports | [Summary](outputs/deployment-original.summary.md), [blank review sheet](outputs/deployment-original.blind.md), [record after the blank-rating save](outputs/deployment-original-after-review.json) |
| First proposed-rule attempt | [Record](outputs/deployment-revised.json) and [raw output](outputs/deployment-revised.raw.txt), retaining the D3a timeout |
| Proposed-rule retry | [Complete record](outputs/deployment-revised-retry.json) and [raw output](outputs/deployment-revised-retry.raw.txt), including the previous failed attempt and completed D3a/D5c |
| Online access checks | [Check record](outputs/deployment-checks.json) |

These are deployment checks, not additional clinical experiment results. No model answers, grades or judge explanations were edited to improve their conclusions. Public API exports retain the name-free presentation used by the deployed website; local historical archives remain unchanged.

## Automated and preservation checks

Automated checks passed: 78 application tests, 10 presentation/gateway tests and 4 original Sites-scaffold tests. Compatible frontend build-tool updates left zero dependency-audit findings. The source and build were scanned for the actual API key, account passwords and bridge/session secrets, with no matches.

SHA-256 checks confirmed that 73 historical data and protected scaffold files were unchanged. The offline gateway tests confirmed that saved study browsing remains available while writes return a clear offline message. See [verification.json](verification.json).

## Hosting limit

Live evaluations and saving need this computer, the restricted backend and the tunnel to remain running. Restarting the quick tunnel changes its backend address and requires updating the Site secret and redeploying; the public website URL stays the same. Public saved results remain available during backend downtime.

Clinical references and candidate information requirements are still **awaiting confirmation**. Deployment checks do not change their status.
