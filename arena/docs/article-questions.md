# Create several questions from one article

Open **New evaluation → Extract from article**. Upload a text-based PDF or enter an article URL. Check the article body and specify the patient, decision point and later material that should stay hidden. LangExtract proposes locatable source facts before questions are generated. A saved full-text read is labelled as archived retrieval, not a new publisher download.

In **Questions & reference answers**, select a patient/record group, choose up to 12 questions and optionally describe a focus. The service drafts distinct tasks using matched source facts. It can return fewer questions when the evidence does not support the requested number. Original extraction calls, question-generation calls, errors and saved revisions are retained.

For each question:

1. Check its wording, task type and decision point. Identify retrospective reconstructions explicitly. A question about a supplied follow-up report is report comprehension, not prediction of an undisclosed outcome.
2. Choose the facts the answering model may see. All remaining source facts stay hidden for that question. **Exact input preview** shows the candidate case and task; it excludes the article title, source metadata and reference answer.
3. Check the draft reference and its evidence. **Read original passage** locates the exact quotation in the right-hand source pane. An exact match verifies where words came from, not whether the clinical conclusion is correct.
4. Complete the three preparation checks for each selected question. Editing its content or evidence clears those checks. Enter a Contributor ID, then **Confirm & save selected tasks**. Unchecked questions cannot enter Workspace cases.

Saved tasks share a parent case code and have separate question IDs. Workspace cases distinguishes them from independent patients. Each question should be answered in a fresh context, so another question's results do not leak into its input. Confirmed question tasks are immutable; a revised set creates new records. The earlier single-task extraction workflow remains under **Source facts & single-task draft**.

Clinical references remain **awaiting confirmation**, including after preparation checks are saved. Automatic source associations remain **awaiting review**. Generated questions are adapted evaluation tasks, not questions claimed to have been written by the article authors. Table- and image-only findings require checking in the original. No old cases, answers or numerical grades are rewritten.

## Installation and checks

The existing model provider and protected workspace handle extraction. Credentials stay on the server. Install optional extraction dependencies in the project environment:

```bash
uv sync --locked
uv pip install -r arena/requirements-extraction.txt
uv run --no-sync pytest arena/tests
```

Core grading does not require these optional packages. Tests that execute LangExtract, PDF or HTML adapters skip with an installation reason when the dependency is absent; the dedicated GitHub extraction job installs all four packages and runs the workspace tests without model calls. The extraction tests use fixture providers.

## B03 demonstration

[B03 findings](../validation/20261114-article-questions/FINDINGS.md) describe two seven-question drafts, exact source repairs and the isolated browser confirmation. [Complete research output](../study-data/article-questions-b03-20261114/README.md) includes immutable source text, four extraction calls, two question calls, revisions and integrity hashes. The published B03 set remains unconfirmed. [The deployment receipt](../validation/20261114-article-questions/DEPLOYMENT.json) identifies the verified website version.
