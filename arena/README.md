# AutoRubric clinical workspace

A local interface for entering a case, generating or pasting an answer, and evaluating it with Josh’s original rubric or his proposed D3a/D5c revision.

From the repository root:

```bash
./run-ui.sh
```

Open **http://127.0.0.1:8765**. The launcher builds the interface and starts the Python server. It uses the existing `.venv` and repository `.env`; on a fresh checkout, run `./setup.sh` first. Node.js and npm are needed to build the interface. `./run-ui.sh --port 8766` selects another port.

1. Enter case facts and task instructions, or use **Load a prepared case** for N01–N06. N04 includes an initial task and two follow-ups; N05 reviews multisystem investigations, and N06 audits a treatment timeline. The earlier pilot example is also available. Prepared cases load their own rubric selection and a reference marked **Draft — awaiting clinical review**.
2. Generate an answer, or select **Paste answer**. Generated answers can be edited before evaluation.
3. Select the relevant rubric items and evaluate. Each item makes one sequential model request.
4. Open **Human review** to add grades and comments. **Plain text** shows the saved output; **Export** downloads TXT, JSON or CSV.

Default models are `arc:lite` for answers and `arc:apex` for judging, through the existing OpenAI-compatible endpoint. Choose another configured model in **Model settings**. Optional server overrides: `ARENA_ANSWER_MODEL`, `ARENA_JUDGE_MODEL`, `ARENA_TIMEOUT` (120 seconds) and `ARENA_MAX_TOKENS` (8192).

The answer model receives case facts, the task and any actual conversation supplied. It does not receive the candidate checklist, reviewer-only inventory or reference points. The original judge receives the saved answer, one original rubric item and any reference points; the proposed items use the separate evidence windows described below. Requests, visible responses, available token usage, timings, rubric snapshot and reviews are retained in `arena/.data/runs/`, which Git ignores. Credentials remain on the server.

Original rubric anchors are preserved in `rubric.json`. Missing intermediate anchors remain missing. Selected intermediate grades are marked provisional when their descriptor is absent. Unselected items are unassessed. A judge’s **Cannot assess** is separate from a failed request. D6a or D6b scores of 1 or 2 trigger the original Safety Fail flag; incomplete safety assessment is displayed separately. No overall clinical score is calculated.

The recent-report inputs and draft references are stored together in `case-library.json`; each includes its DOI, publication date and adaptation note. Later diagnoses and outcomes are excluded from the answering payload. They remain recent-publication candidates: model training cutoffs and source exposure have not been established.

N04’s prepared evidence and neutral follow-ups reuse one fixed saved initial input and its unchanged answer. Their **Earlier conversation** fields contain identical labelled User/Assistant text; neither includes the other follow-up or any judge result. The initial run ID is retained in each saved follow-up. A follow-up with required but empty history cannot run. To study a newly generated initial answer, replace the earlier conversation in both branches with that same new input and answer; the prepared follow-ups do not automatically switch parents.

Failed or interrupted scoring resumes without regenerating the answer or replacing completed grades. Input changes after scoring require a new evaluation. Human grades are saved separately; the record notes whether machine scores had already been shown. Hiding previously viewed results does not make a review independent.

This version runs on this computer and binds only to `127.0.0.1`. It does not include public hosting or shared accounts. Clinical reference points and author-dependent rubric choices can be checked in the review fields. The static Sites scaffold is unused by the Python backend; publishing the frontend alone would not enable model calls.

### Saved interview study

Open **Interview study** in the sidebar to compare the eight cases and three answering models. The 24 interviews, 131 question–reply turns and final answers are the saved, corrected records from 23 October. The comparison can display either original grades or the exploratory D3a/D5c regrades from 24 October. A score change reflects the scoring conditions, not a new answer. **Use in new evaluation** copies an interview for a separate run; it never replaces these historical scores.

### New evaluations with the proposed rules

Choose **Scoring rules → Josh’s proposed D3a / D5c**. Only these two items change; all other items retain their original anchors. Both revised items include all five score descriptions, so 2 and 4 are no longer unanchored grades. **Not applicable** and **Indeterminate** remain distinct from numeric scores and transport errors.

Use **Reuse a saved interview → Load interview & answer** to load any of the 24 records, or enter your own actual requests and replies. Keep patient replies, returned records, pre-reply assessment notes and simulator feedback separate. Mark whether the transcript is complete and whether assessment notes were specified by the task. An incomplete transcript is not silently treated as a model failure.

- **D3a** receives the starting information, actual conversation, stated task, decision point and final answer. It does not receive hidden inventory, draft references, the candidate checklist or assessment notes. Missing an unasked fact does not automatically lower the synthesis score.
- **D5c** receives the executed requests and replies, eligible saved notes and the frozen candidate checklist. Each candidate states its rationale, acceptable alternatives and deadline. A note can explain a request but cannot make one; unavailable information and simulator failures do not invalidate an adequate request. Explicit final questions are separate from earlier requests and have no imagined replies.

Clinical references and candidate requirements remain **awaiting Josh’s confirmation**. The proposed scoring is exploratory under the declared checklist. The version, rubric snapshot, candidate list, input fingerprint and actual grading payloads are saved with the run and included in exports. Changing the version or interview evidence requires a new evaluation; retries use the saved rubric snapshot. Existing files are not migrated or rescored automatically.

The [24 October validation](validation/20261024/README.md) includes the actual N02 scoring run, full inputs and visible outputs, technical checks and interface screenshots. It is separate from the preserved study results.

Each interview has an evidence check, the full conversation, the unchanged answer with old/new explanations, and the candidate requirements and scoring guides. “Not requested”, “unavailable in source” and “asked but not returned” are separate observations, not automatic clinical errors. The case inventory includes reviewer-only facts; revised D3a used only the evidence actually received. Candidate essentials, alternatives and deadlines remain subject to Josh’s review.

**Full plain text**, **Full case output**, **Source JSON** and **Scores CSV** download the saved outputs. Their bytes are checked against the import manifest. Raw files retain their original wording and pre-run metadata, including the author-rule snapshot’s preparation status. Browsing this study makes no model calls and does not write to the original runs.

The study is self-contained in `arena/study-data/`; the running website does not depend on neighbouring research folders. To refresh that copy from the frozen research files, explicitly supply their location:

```bash
python3 arena/scripts/import-interviews.py --source /absolute/path/to/Josh_AutoRubric_Pilot
```

Word limits use a deterministic count: retain heading text, remove Markdown heading/list markers and emphasis/backtick symbols, then split on whitespace. Hyphenated terms count once. JSON is excluded only when the task explicitly excludes it. No extra tolerance is added. The UI displays this count, generation states the rule, and instruction-following scoring receives the computed count instead of estimating it. Historical results are not rewritten.

Checks:

```bash
.venv/bin/python -m pytest arena/tests -q
cd arena && npm run build
```
