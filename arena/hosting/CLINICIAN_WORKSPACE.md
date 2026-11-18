# Clinician accounts and background evaluations

Public website: https://auto-rubric.kayley1026lzt.chatgpt.site

## Invite a clinician

1. Sign in with the existing administrator account. Open **Account & API → Members & invitations**.
2. Enter a distinct account ID, such as `reviewer_01`. Choose **Reviewer** for independent scoring, or **Evaluator** for scoring and model calls.
3. Create the one-use invitation and share its link privately. It expires after seven days. The recipient sets a personal password of at least 16 characters.
4. The administrator can change reviewer/evaluator access, disable an account or create a password-reset invitation. These actions retain saved reviews. Invitations cannot grant administrator access.

Each invited account joins the administrator's shared workspace. Members can see shared cases, source materials and evaluation history. Independent review ratings belong to the signed-in account. Another member's ratings do not count as completing a review or unlock its automatic scores. Existing shared-login records keep their original attribution; they are not reassigned to new accounts.

## Review saved answers

Open **Review first / My reviews**, choose a saved answer, and score its selected rubric items. Filter the queue by pending or completed reviews. The evidence stages remain separate: synthesis is assessed using the model-visible material before examiner-only information is opened. Save all required ratings before revealing the automatic comparison. Previous exposure recorded on the site remains visible.

Reviewing saved answers uses no model API and does not require a personal key.

## Use a personal model connection

1. An evaluator opens **Account & API → API connections**.
2. Choose KCL, OpenRouter, Groq or NVIDIA NIM, add a label and the provider's API key, then save. The key is encrypted on the backend and is not returned to the browser or written into evaluation outputs.
3. Use **Test connection** to request the provider's model list. This test does not generate or score an answer. Some providers may restrict model listing independently of inference access.
4. In **New evaluation**, select the generation connection and scoring connection separately. Enter the provider's exact model IDs. The existing project connection remains available to authorised evaluators.

Connections expire after eight hours unless **Keep for future sessions** is selected. Removing a connection revokes it for future jobs. A waiting job with an expired or revoked connection stops with **Connection required**; select a replacement and retry the same saved run. Completed answers and item grades are reused. Provider quota and charges, if any, belong to the selected key.

## Run and reopen a batch

Import and validate the case file, select answering models, a scoring model and rubric items, then submit. The backend saves the whole batch before processing its case–model tasks. It continues after the browser closes. Reopen it from **Saved evaluations → Saved background batches**, or use the saved batch link.

Two background workers accept queued tasks by default. Ready tasks take turns between submitting accounts. Temporary provider failures retry after other ready work, up to three attempts in total. Completed generation and scoring steps are retained; failed attempts remain in the raw record. **Cancel unfinished tasks** affects that batch only and retains completed output.

AutoRubric's current grading adapter temporarily changes a process-wide transport hook. A separate lock serialises that grading section so two users' API connections cannot mix. Generation can overlap. Ten accepted requests therefore do not mean ten simultaneous scoring calls.

The queue uses leases. After a backend restart, interrupted tasks become eligible again. A provider request that completed remotely just before a crash may be repeated if its response was not saved locally. This is resumable execution, not a guarantee of exactly-once provider billing.

## Storage and hosting

The private records directory now also contains `_jobs.sqlite3`, `_identity/` and each workspace's `_batches.sqlite3` and review index. Back up the entire records directory, including the connection-encryption key. Existing JSON outputs and review revisions remain in place. Password hashes, encryption keys, API credentials and private records must not be published in the Site bundle or Git.

The public frontend remains on Sites. Until the backend is moved to an always-on host, generating, saving reviews and managing accounts still require the current computer to be online. A personal API key changes the inference connection; it does not host the backend or its database. Literature extraction retains its separate protected execution path and is not part of the new evaluation queue.

Clinical references and candidate information requirements remain **awaiting confirmation**.
