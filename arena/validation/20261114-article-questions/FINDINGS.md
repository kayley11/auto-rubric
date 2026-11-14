# Article → case → multiple questions

The article extractor now creates several question/reference drafts for one patient. Each question has its own model-visible facts, hidden material, decision point and exact answering-input preview. It keeps the existing PDF and URL inputs, LangExtract fact matching, source highlighting and single-task workflow.

## B03 validation

The test used *Olmesartan-associated enteropathy presenting as severe malnutrition* ([BMJ, DOI 10.1136/bcr-2026-275970](https://casereports.bmj.com/content/19/10/e275970)). Both extraction and question drafting used the existing KCL `arc:apex` provider. No clinical answers were generated or rescored.

The live publisher request returned HTTP 403. The test therefore reused the previously verified publisher HTML snapshot; the interface explicitly labels this as saved full text, not a fresh download. The immutable narrative contains 21,293 characters. Table- or image-only details still require checking in the original article.

LangExtract returned 89 snippets: 87 had exact source matches and two were excluded as unmatched. Source inspection identified a rewritten anatomical term and an embedded citation marker in those two snippets. Three exact passages were then added through the existing source-quote review function: the examination description, normal endoscopic appearance and the symptom pattern without its causal interpretation. The original snippets remain unchanged. The resulting draft contains 92 snippets, 90 exactly located; the revised question set uses an eligible bank of 89 source-grounded facts.

The first seven-question output was retained. Its preparation issues included a missing normal-endoscopy source match and an outcome question that required undisclosed follow-up information. After adding the exact evidence and clarifying the drafting instructions, a second seven-question set was generated.

| Question | Focus | Information boundary |
|---|---|---|
| Q01 | Active ingredients across brand changes | Medication history visible; later author explanation hidden |
| Q02 | Explain improvement in hospital and deterioration after discharge | Retrospective symptom pattern visible; actual inpatient medication exposure hidden |
| Q03 | Interpret negative coeliac tests | Test and dietary context supplied; later outcome excluded from the input |
| Q04 | Normal endoscopy before pathology | Appearance visible; biopsy results hidden |
| Q05 | Interpret the pathology report | Later histology deliberately supplied; labelled report comprehension |
| Q06 | Interpret a transient budesonide response | Treatment/response visible; concurrent medication exposure withheld |
| Q07 | Summarise reported follow-up | Outcomes supplied; labelled report comprehension, not outcome prediction |

The masked Q02 answering input contains no olmesartan name. This checks the saved input boundary; it does not establish that its reference is clinically sufficient. [Full question drafts and reference passages](B03_QUESTIONS.md) show the material for review.

## Review and saving

Open **New evaluation → Extract from article → Saved article drafts**, then select the B03 paper. The latest saved set contains seven question drafts under one automatic parent code. Each task keeps a separate question ID.

Select a question, inspect **Exact input preview**, and follow **Read original passage** links to the source pane. Edit its question, visible facts and draft reference as needed. For each selected question, check source accuracy, the visible/hidden boundary, and task/reference preparation. Content changes clear those checks. Enter a Contributor ID, then use **Confirm & save selected tasks**. Unchecked tasks cannot be saved to Workspace cases. Confirmed tasks retain their source provenance and can be used for a new evaluation in a fresh context.

The browser test confirmed and saved one task only in an isolated technical workspace. The live B03 set remains entirely unconfirmed: zero question tasks were automatically added to the production library. Saving preparation checks never changes the clinical reference status: **awaiting confirmation**. Automatic associations remain **awaiting review**.

## Checks and remaining decisions

- 246 Python tests and 63 frontend tests passed; the 16 hosting tests also passed during publication.
- The browser verified the per-question review gate and saved-task flow in an isolated workspace, and the unconfirmed set on the published website.
- 2,790 pre-existing public source files and 62 pre-existing private result records were checked against their initial hashes. All are preserved. API keys and login passwords were excluded from source and public output.
- An existing snapshot-export test was isolated so that running tests no longer refreshes production result packets. The temporarily refreshed files were archived and restored to their original hashes.

Clinical review is still needed for reference sufficiency, acceptable alternative answers, and the strength of exclusions inferred from negative tests or histology. Q02 is an intentionally masked retrospective reconstruction; its wording must not imply contemporaneous documentation or actions that the paper does not establish. Q05/Q07 test interpretation of a supplied report and should be analysed separately from early clinical decision tasks. Check relevant table/image content before final confirmation. No new rubric scores or clinical ground truth are claimed by this feature test.

Original source, extraction calls, both question-generation calls, source repairs and saved revisions remain in this run folder and the protected workspace. Earlier B03 cases, model answers and scores were not replaced.
