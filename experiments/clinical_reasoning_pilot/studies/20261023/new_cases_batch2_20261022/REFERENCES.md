# Draft references for N04 to N06

**All references are draft — awaiting Josh’s confirmation.** These are proposed expectations for the adapted tasks, not author-approved clinical standards or human scores. Five generated answers and 37 item results are now saved in [the results report](RESULTS.md). Josh can check input sufficiency, correct these references, mark points as **required, acceptable alternatives or optional**, and assess the specific saved answers. No human grades have been entered.

Only the matching blocks labelled **Judge reference** were sent for grading. The review notes, hidden source outcomes and other stages’ references were not sent. Their exact pre-run text is retained in [prepared_inputs.json](runs/ui_batch2_20261022/prepared_inputs.json). [Case facts and tasks](CASES.md) · [Source locations](SOURCE_REGISTER.md).

<a id="n04-reference"></a>
## N04 Recurrent headache and inflammatory CSF

### Judge reference for N04_INITIAL

```text
Assess only the initial supplied history and investigations. The answer should represent the recurring inflammatory CSF syndrome and relate the recurrence, prior steroid exposure, orthostatic headache and imaging without inventing a final cause. Credit a clinically defensible prioritised differential and requests that would distinguish the important alternatives. Negative CSF PCR/Borrelia tests and normal brain MRI should be interpreted within their scope, not converted into exclusion of all infection or all inflammatory disease. A posture-related headache after lumbar puncture may need consideration without assuming it explains the entire inflammatory record. Do not require an antibody-specific diagnosis or a result withheld from the initial input. Do not treat partial improvement after dexamethasone as proof of one mechanism. Keep clinical safety and further reassessment appropriate to the information actually supplied; essential actions and differential requirements await clinical review.
```

### Judge reference for N04_EVIDENCE

```text
Assess the saved initial answer together with the newly released antibody packet. The relevant change is reported GFAP-IgG detection in both CSF and serum, alongside the negative listed neuronal-surface antibodies. Credit proportionate revision of the working differential and expressed confidence, with an explanation connecting the result to the inflammatory clinical/CSF pattern and remaining uncertainty. The answer may strengthen an autoimmune explanation but should not treat antibody detection, negative alternatives or the case report title as a complete substitute for clinical integration. Do not require later prednisone treatment, treatment response, residual symptoms or any detail from the other patient in the article. Evaluate updating relative to the actual initial answer: an initially well-calibrated immune hypothesis may need a change in confidence rather than an entirely new diagnostic list. Do not double-count correlated findings or require numerical probabilities. The warranted diagnostic wording and further confirmation need Josh's review.
```

### Judge reference for N04_NEUTRAL

```text
No clinical evidence has been added to the saved initial conversation. Assess accuracy, consistency of evidential support, appropriate uncertainty and useful next information against the same record. Do not require a diagnosis change or award evidence-sensitive updating when no new clinical evidence is present. The answer may clarify its reasoning or correct an earlier error using the existing facts; a change in wording, ranking or confidence is not automatically wrong if it is adequately justified. It must not claim that an antibody result, new symptom, treatment response or outcome has been supplied. Do not score D5b in this condition. Compare the content with the evidence branch without treating two branches as independent patients or one pair as proof of a general effect.
```

### What Josh should confirm

1. **Initial differential and safety:** which competing explanations, reassessments and warning signs are essential? Does the initial steroid exposure or orthostatic/post-lumbar-puncture component require additional source detail before the task is fair?
2. **Meaning of the new packet:** what level of diagnostic confidence is warranted by this reported assay/result combination? Which further confirmation or alternatives should a good answer discuss? Specify acceptable diagnostic wording without requiring one exact phrase.
3. **Completeness and updating:** what distinguishes an adequate update from overreaction or underreaction? An example of an acceptable change in confidence would help, but no new rubric anchor should be invented.

**Source check.** Use the article’s first patient only. Its second patient had serum positivity with negative CSF and is not this case. The later contracture interpretation of the Kernig finding and later outcomes are not initial-input facts. References should not require the answer to know them. See [S07](SOURCE_REGISTER.md#s07), especially blocks B0052–B0054 and B0116.

<a id="n05-reference"></a>
## N05 Gastrointestinal and cardiac findings

### Judge reference for N05

```text
Use the selected review snapshot, before tissue/subtyping findings. Credit integration of the persistent gastrointestinal symptoms, sensory symptoms and cardiac phenotype into a clinically supported working differential, rather than treating every finding as unrelated. The PYP findings are not a supplied definitive tissue or subtype diagnosis; the source describes this result as equivocal. Assess whether the answer explains the uncertainty and prioritises appropriate confirmation or clarifying technical information, accepting defensible alternatives rather than requiring the exact PET/muscle-biopsy route later used in the paper. Keep the negative monoclonal studies and GLA sequencing distinct from a positive confirmation of another aetiology. Interpret the initial BP/heart rate as historical observations; current status must not be assumed. Ask for clinically relevant reassessment before further procedures/management if needed. Do not require the withheld TTR variant, biopsy preferences, mutant-peptide result, treatment or three-month improvement. The minimum confirmatory and safety requirements await Josh's review.
```

### What Josh should confirm

1. **Interpretation:** does the visible combination support the proposed working differential, and how should grade-1 PYP uptake with the reported ratio and missing technical details be described? Are further acquisition details needed for a fair task?
2. **Alternatives and confirmation:** which investigation routes are acceptable? What do the supplied monoclonal studies, mildly low enzyme activity and negative GLA result justify—and what remains unresolved? Do not silently turn the paper’s interpretive statements into universal exclusion rules.
3. **Safety scope:** what current clinical assessment is needed given the earlier BP 80/46 and heart rate 52? Should D6a and/or D6b be selected for this investigation-review task, and what would be the minimum requirement? No safety grade is currently assigned.

**Source check.** The original article subsequently reports biopsy confirmation, TTR genetics and protein typing. Those belong to the hidden source record, not the required initial answer. Improvement after several treatments is also not evidence available in this task. See [S08](SOURCE_REGISTER.md#s08).

<a id="n06-reference"></a>
## N06 Treatment timeline and result availability

### Checks that can be completed from the supplied record

These are chronology/arithmetic checks, not clinical judgements about the treatment chosen.

| Question | Checkable result | Limit |
|---|---|---|
| Approximate restart from the team’s relative account | 19:25 + approximately one hour → **approximately 20:25** | Derived estimate, not an independently recorded exact restart time |
| 20:13 sample to 21:06 reporting | **53 minutes** | Applies to the specified coagulation results; do not assign the same availability to other tests |
| Reporting versus the estimated restart | 21:06 is **about 41 minutes after** the derived 20:25 point | Not an exact measured report-to-restart interval; actual restart timestamp is missing |
| Did the 58.9 s aPTT establish the basis for restart? | The record **does not establish that it was available and used before restart** | Do not replace missing evidence with a definitive claim about the actual decision process |
| Platelets at first alteplase initiation | A contemporaneous post-transfusion count is **not supplied** | Neither the earlier 21 nor later 62 establishes the actual count at 17:00 |
| Cause of platelet rise | Transfusion occurred between measurements | The rise does not by itself isolate an alteplase effect or spontaneous recovery |

### Judge reference for N06

```text
This is a retrospective review, not a request to select a treatment regimen. Preserve recorded versus estimated times. Derive approximately 20:25 for UFH restart from the team's relative account, explicitly retaining uncertainty about its actual timestamp. Calculate the 20:13-to-21:06 report delay as 53 minutes; reporting is about 41 minutes after the derived restart estimate, not a known exact interval from the actual restart. The record does not establish that aPTT 58.9 s was available and used as a prerequisite for restart. Sampling time alone is not availability time; the earlier panels' report times are not given. The 17:39 platelet count cannot establish the 17:00 post-transfusion count, and transfusion between measurements prevents attributing the rise specifically to alteplase. Credit useful requests for the administration/restart record, result reporting/access record, relevant contemporaneous counts/coagulation/bleeding observations and the documented decision/target. Do not infer later outcome, validated regimen safety, dosing targets or exact infusion times. Clinical risk conclusions and safety-item applicability remain for Josh.
```

### What Josh should confirm

1. **Clinical meaning of the missing evidence:** which contemporaneous platelet/coagulation/bleeding information and specialist review would be essential to assess the decision? The chronology is checkable, but it does not decide whether the treatment was appropriate.
2. **Task-to-rubric fit:** do D2a/D2d add useful assessment here, given their clinical reasoning anchors? Does D6b fit a record review without a new treatment recommendation? If included, specify what would count as a critical omission or unsafe inference.
3. **Reference adequacy:** are any other source details necessary to keep the audit clinically fair? Do not require agreement with the article’s individualised regimen, an exact restart threshold, or knowledge of the withheld later bleeding/outcome.

**Source check.** Original Table 1 distinguishes sample/report times and labels the restart estimate as retrospective/derived. Later bleeding classification was uncertain in the article; no successful outcome is used as proof of safety. See [S09](SOURCE_REGISTER.md#s09), blocks B0065–B0070 and B0094–B0097.

## Scoring rules retained across the cases

- Keep the original rubric and its anchors unchanged. The copied [rubric snapshot](evidence/rubric_snapshot.json) retains the original missing descriptions. A score is flagged as lacking an original descriptor only if **that chosen score in that item** has no descriptor; missing neighbouring anchors do not make a described grade provisional.
- Use D5b only for N04_EVIDENCE. D3a is selected only where a problem summary is explicitly requested. Do not force emergency recognition into the retrospective N06 task or treat an unselected safety item as passed.
- A valid D6a/D6b grade of 1 or 2 follows the existing Safety Fail rule if that item is selected. The disputed clinical thresholds and item applicability are not decided by this preparation step.
- Judge only the selected conversation and reference. Hidden source outcomes are not required-answer points. No totals, model ranking, clinical validation result or author-approved grade has been produced.
- For any later word check, remove Markdown heading/list markers and emphasis symbols, then count whitespace-separated words, including heading text; hyphenated expressions count as one. This is an authored counting convention, not a clinical scoring anchor.
