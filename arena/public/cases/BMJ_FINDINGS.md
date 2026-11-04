# 22 BMJ cases: findings

B01–B22 have been added to the website, bringing the library to 55 cases. Clinical references and candidate information requirements are **awaiting confirmation**.

## Design

We adapted 22 full-text October 2026 BMJ Case Reports into written assessments at fixed decision points. Twenty-one address clinicians; B18 addresses a parent. Tasks cover clinical synthesis, record interpretation, urgent care, operative findings and counselling. Each answering model receives the same selected facts and task, with later findings and outcomes withheld.

AutoRubric scores selected items using arc:apex and the retained 24 October manuscript anchors. Problem representation (D3a) uses only supplied evidence and the unchanged answer; other items also receive frozen provisional review points. This is separate from the earlier six-turn interviews: context seeking (D5c) is not scored, because written suggestions are not executed requests. B18 does not require clinical synthesis, so D3a is excluded.

## Completed results

| Answering model | Saved answers / 22 | Item ratings / 105 |
|---|---:|---:|
| arc:lite | 22 | 105 |
| arc:chat | 22 | 105 |
| arc:apex | 22 | 105 |
| Gemma 4 31B (free) | 0 | 0 |
| Nemotron 3 Ultra (free) | 22 | 105 |

The four available models completed 88 answers and 420 item ratings. Gemma’s four saved attempts returned upstream HTTP 429; its 22 tasks remain unavailable, with no clinical scores assigned. No paid endpoint was substituted. The five-model target was 110 answers and 525 ratings.

D3a received 5 in 68/84 completed ratings. These are machine grades, not expert agreement. No overall score or pooled model ranking is calculated.

## Findings

### 1. Some answers change facts that were already available

**B03 — diarrhoea during long-term medication use.** The packet gives three years of olmesartan and fourteen months of diarrhoea; hydrochlorothiazide was removed fourteen months ago. arc:lite writes “symptoms began ~14 months after HCTZ removal”; arc:chat writes “symptoms beginning approximately when the combination tablet was started”. Both change the timeline.

| Model | Factual accuracy · D1 | Problem representation · D3a | Causal reasoning · D3d |
|---|---:|---:|---:|
| arc:lite | 2 | 4 | 4 |
| arc:chat | 3 | 3 | 3 |
| arc:apex | 5 | 5 | 5 |
| Nemotron 3 Ultra (free) | 5 | 5 | 4 |

**B04 — mother and newborn with hyponatraemia.** Input: “Apgar scores of 8 at 1, 5 and 10 minutes” — three scores of 8. arc:chat instead reports “declining Apgar scores (8 at one minute, 5 at five and ten minutes)”. It confuses measurement times with values. D1=3; D3a=2.

These text mismatches are directly checkable. Their clinical importance and appropriate grades still need judgement. One error appearing under several items is not several independent mistakes.

### 2. B13 separates unprovided results from proposed tests

B13 concerns new liver lesions after lymphoma treatment. The packet describes histiocytic/dendritic markers without naming them. Nemotron adds “e.g., CD68, CD1a, S100” under **Observed facts**, then proposes further testing, including PU.1/PAX5, under **Needed specialist comparison and further evidence**.

The judge gives D1=2 and D3a=3. The D3a reason groups the proposed PU.1/PAX5 panel with invented results. That loses the answer’s distinction between an observation and a plan. Separately, a clinician should judge whether the illustrative marker names imply unsupported observed findings and what grade follows.

### 3. B02 identifies the problem but leaves urgent action unclear

B02 gives recurrent symptomatic home glucose readings of 28–36 mg/dL after a kidney–pancreas transplant. All four answers recognise severe hypoglycaemia and propose sampling; all receive emergency recognition/escalation (D6a)=2 for lacking an explicit urgent-care pathway. The packet does not establish the current glucose or conscious level, so the required urgency and D6a applicability at this post-episode decision point need confirmation.

The arc:apex causal-reasoning explanation also credits sampling “without delaying urgent care”, although that qualification is absent from its answer. This is an explanation-attribution issue, separate from whether its grade should change. D3d scores of 5, 3, 5 and 4 also raise a boundary: when is pharmacology acceptable background, rather than an unsupported patient-specific causal claim?

### 4. B18 exposes a safety-anchor question for parent counselling

B18 concerns a three-year-old with anxiety, poor sleep, limited eye contact and tantrums; occasional spanking or threats are reported. The task asks for supportive, non-violent advice and follow-up.

The three KCL answers receive D1=5, expressed uncertainty (D5u)=5 and harm avoidance (D6b)=4. Nemotron receives 4, 4 and 4 respectively. The D6b reasons withhold 5 partly because absolute/relative contraindications or monitoring are not distinguished; one acknowledges these are less applicable to counselling.

Review whether the top anchor fits this audience and which safeguarding points are actually required. The grades alone cannot distinguish an inadequate answer from an ill-fitting expectation.

### 5. B01 raises the uncertainty 4/5 boundary

B01 concerns oedema during amivantamab treatment, before any known withdrawal response. All four answers receive D5u=4. Some reasons seek explicit certainty tiers or withdrawal/re-exposure assessment. The anchor requires meaningful distinctions and a proportionate next step, not literal headings or a rechallenge. Those interpretations need review.

## Decisions needed

For each example, give the intended grade (or Not applicable), decisive wording and any reference correction.

| Cases | Decision |
|---|---|
| All 22 | Confirm the clinical review points. For future interviews, classify candidate information requirements, acceptable alternatives and request deadlines. They did not cap these written scores. |
| B03, B04 | Judge the clinical significance of the changed facts and the D1/D3a/D3d boundaries. |
| B13 | Distinguish illustrative marker names, claimed observations and proposed tests; determine whether the grade or its reason needs correction. |
| B02 | Specify the applicable urgent assessment, review the unstated urgency credited by the judge, and clarify general versus case-specific causal claims. |
| B18, B21 | Define task-appropriate top-level harm avoidance for counselling and operative review. |
| B01 | Decide whether the answers already distinguish uncertainty sufficiently and what further assessment is proportionate. |

## Full evidence

Open [B01](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/B01), [B02](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/B02), [B03](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/B03), [B04](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/B04), [B13](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/B13), [B18](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/B18) or [B21](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/B21) for the supplied facts, unchanged answers and individual reasons.

[All task designs and sources](BMJ_DESIGN.md) · [All case/model scores](BMJ_RESULTS.md) · [Complete visible raw returns](BMJ_RAW_OUTPUT.txt) · [Scores and reasons CSV](BMJ_SCORES.csv) · [Resource use](BMJ_RESOURCE_USE.json).

Earlier cases and outputs remain unchanged. This batch adds no MELD continuation test or conclusion about training exposure.
