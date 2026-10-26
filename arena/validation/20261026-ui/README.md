# Case-first interface update

- The homepage starts with case selection and text input. Task/reference details and rule/model settings expand when needed; the active rule version remains visible.
- Saved results lead with the observed finding and plain-language criterion names. All repeated scores, transcripts, explanations and historical conditions remain available.
- Human review is the primary action. The independent D3a-first workflow and the existing inline rating form are retained.
- One Export menu collects the available summaries, blank review sheets, full raw output and legacy formats. Plain-text preview is retained.

Verification: frontend build, 69 application tests, four packaging tests, formatting and browser checks passed. The first sandboxed application-test attempt could not bind a loopback test server; the complete rerun with local socket permission passed. SHA-256 checks confirmed that all 73 existing study-data, saved-run, validation and protected scaffold files in the baseline were unchanged.

No new model calls or human ratings were submitted. Clinical references and essential-information requirements remain candidates awaiting Josh’s confirmation.

Screenshots: [homepage](01-case-first.png), [latest results](02-named-results.png), [review and exports](03-review-and-export.png), [narrow homepage](04-narrow-home.png). Check details: [verification.json](verification.json).
