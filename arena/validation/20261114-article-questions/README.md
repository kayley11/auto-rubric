# Article-to-multiple-questions: website and GitHub checks

The website now turns one article into multiple source-linked question/reference drafts for a selected patient. Each task has a separate visible/hidden boundary, exact input preview, reference evidence and explicit preparation checks before saving. Question tasks share a parent case code. Clinical references remain **awaiting confirmation**; automatic source associations remain **awaiting review**.

## Evidence

| Material | Purpose |
|---|---|
| [Findings and workflow](FINDINGS.md) | B03 extraction, two question sets, repairs and remaining clinical decisions |
| [Seven revised question drafts](B03_QUESTIONS.md) | Full tasks, visible facts, reference answers and exact source blocks/offsets |
| [Complete captured output and manifest](../../study-data/article-questions-b03-20261114/README.md) | All extraction/question calls, canonical source, immutable revisions and source repairs |
| [Published website receipt](DEPLOYMENT.json) | Successful Site version 49 and the exact website source commit |
| [Browser screenshot](B03_SOURCE_LINK.png) | A question reference locating the matching original passage on the right |
| [Original feature checks](PRESERVATION_AND_BOUNDARIES.json) | 246 backend checks, 63 frontend checks and preservation of prior public/private records |
| [Original Python results](pytest-results.xml) | Feature-validation run before this GitHub sync |
| [GitHub sync checks](GITHUB_VALIDATION.json) | Isolated-checkout tests, build, source preservation and optional-dependency CI coverage |
| [Upload check](UPLOAD_SECURITY_CHECK.json) | Selected files and every archived member checked for configured credentials and forbidden upload paths |

The published B03 drafts remain unconfirmed. The isolated browser test saved one task only in a technical workspace; no production question task was added automatically. No new clinical answers or rubric scores were generated for this feature validation.

This sync includes the LangExtract/source adapters required by the question tool because those prerequisites were not present in the previous GitHub version. Core grading keeps its existing dependency lock. Extraction packages remain optional, with a dedicated CI job that installs and tests them. Fixture providers avoid live model calls in CI. Explicit UTF-8 reads preserve source offsets across platforms.

All previously tracked cases, model answers, numerical grades and research archives are retained. Private member records, credentials, API keys, account configuration and Site deployment bundles are excluded. The local working checkout and live website accounts are not migrated by this sync.
