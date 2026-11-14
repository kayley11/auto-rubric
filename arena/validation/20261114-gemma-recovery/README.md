# Gemma recovery: website and GitHub checks

All 135 tasks have a complete Gemma 4 31B answer and a saved 22-item automated assessment. There are 2,553 numerical grades, 247 not-applicable positions, 162 applicability decisions awaiting confirmation and 8 indeterminate assessments. No Gemma generation or scoring operation remains unfinished.

## Saved evidence

| File | What it verifies |
|---|---|
| [GitHub checks](GITHUB_VALIDATION.json) | Build, 1,085 Python tests, 60 frontend tests, result counts, preservation and credential scan |
| [Python test results](pytest-results.xml) | Complete offline regression results |
| [Upload security check](UPLOAD_SECURITY_CHECK.json) | Changed files, ZIP members and built assets checked for configured secrets and key patterns |
| [Published website](LATEST_SITE_PUBLICATION.json) | Successful public version 47 and its source commit |
| [Public data verification](PUBLIC_VERIFICATION.json) | Deployed case packets match the verified recovery data |
| [Browser CSV](BN52-browser-export.csv) | 132 item rows: 22 positions for each of six model/service configurations, including Gemma’s batch and transport |
| [Results screenshot](published-gemma-results-20261114.jpg) | Published BN52 comparison and Gemma item scores |
| [Evidence screenshot](published-gemma-evidence-20261114.jpg) | Saved answer, rubric and judge reason in the evidence view |
| [Recovery archive](../../study-data/gemma-free-recovery-135-20261114/README.md) | Complete inputs, visible outputs, attempts, original BN52 return and append-only repair |
| [Previous website packets](../../study-data/gemma-recovery-before-20261114/MANIFEST.json) | Byte-for-byte copies of the 137 replaced files, with previous and current hashes |

The GitHub update includes the recovery packets, per-model export provenance, compact model selection, explicit assessment statuses and quote-link guidance from the published case-results interface. It also corrects the sidebar label to “Saved cases · Model results”. Unrelated article-extraction and private backend changes are outside this sync.

All five other model configurations are unchanged across the 135 packets. Earlier study archives remain intact. The complete ZIP has 3,811 files; its internal manifest verifies 3,810 captured files. No new model requests are made by these verification checks. Existing accounts and access settings are unchanged. API keys, login passwords, private workspace records and deployment bundles are excluded.

Clinical references and candidate information requirements remain **awaiting confirmation**. Automatic quotation associations remain **awaiting review**.
