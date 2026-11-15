# Source passages restored from saved papers — 15 November 2026

The 131 previously unmapped cases have been checked against the saved article archives. No new publisher downloads, model calls, clinical answers or scores were needed.

| Result | Cases | Website behaviour |
| --- | ---: | --- |
| Full text restored and candidate paragraph links saved | 90 | Article text and linked source passages are available. |
| Only a saved publisher excerpt available | 5 | Linked excerpts are shown with a **Partial archive** warning. |
| No usable saved full text or matching excerpt found | 36 | **Saved full text not found**, with the source details retained. |
| Earlier mapped cases preserved | 4 | B03, BN02, BN13 and BN49 keep their original source versions. |

**99 of 135 cases now have source passages available.** Five of these use partial excerpts, so they must not be described as having complete archived papers.

## What was checked

The new records contain **1,223 source passages**: 160 literal input matches, 634 recorded source-locator matches and 429 lexical candidates. Every quoted passage was checked against its saved source hash, paragraph ID, character interval and UTF-16 browser interval. All 95 new case/source records passed these checks. No source was substituted across unrelated cases.

These numbers describe source navigation, not clinical accuracy. An exact source position does not establish that a paraphrased clinical statement is fully supported. All new case associations and clinical references remain **awaiting confirmation**.

The website distinguishes quoted input, later/interpretative source sections and passages needing review. Hidden or later source text stays in the protected source-review view and is not sent to answering models.

## What remains

- **Missing full text:** C01–C05, B01–B02, B04–B22 and SR01–SR10 (36 cases). Prior access checks or paragraph references do not supply the missing text itself.
- **Partial excerpts:** CAND18–CAND22. Obtain or restore the full papers before treating their source review as complete.
- **Clinical/adaptation review:** check the selected patient, meaning and decision-time availability of candidate passages. No automatic association is counted as an approved clinical reference.

[All cases](ALL_CASES.md) lists every case, source and status. [Outstanding sources](EXCEPTIONS.md) lists the exceptions separately. `POSITION_VALIDATION.json` records every technical position check; original source text and generated linkage records are retained in the protected workspace and this run’s staging packet.

[Manual association review](MANUAL_REVIEW.md) lists all 95 newly linked cases. `MANUAL_REVIEW.csv` contains the full 1,223 paired passages for protected review.

## Published checks

Website version 53 is live. All 135 signed-in source requests returned HTTP 200: 99 had source passages and 36 had an explicit missing-full-text record. Four production examples and nine local examples passed UI checks, including forward/reverse highlighting, the partial-archive warning, missing-text messaging and retained PDF versions. No browser errors were observed. The 70 backend tests, 73 frontend tests and 16 hosting tests passed; the production build passed. All 2,163 pre-existing published/protected files and the used publisher archives are unchanged.
