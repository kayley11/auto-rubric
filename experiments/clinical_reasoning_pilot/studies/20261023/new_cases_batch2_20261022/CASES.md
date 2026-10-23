# Three additional clinical cases

**N04–N06 have been added to the UI and run.** They use three patients from the three [selected reports](SOURCE_REGISTER.md). Five answers and 37 selected item results are saved: three stages/branches for N04, one task for N05 and one for N06. Clinical references remain **draft — awaiting Josh’s confirmation**. See [results and analysis](RESULTS.md) and [complete plain-text output](SCORE_OUTPUT.txt).

[Draft references and review questions](REFERENCES.md) · [Sources and original locations](SOURCE_REGISTER.md) · [Prepared inputs](cases.json)

| Case | What the task tests | Answer conditions |
|---|---|---|
| [N04](#n04) Recurrent headache and inflammatory cerebrospinal fluid | Whether new evidence changes the differential and confidence appropriately | Initial answer; new-evidence follow-up; no-new-evidence control |
| [N05](#n05) Gastrointestinal symptoms and cardiac abnormalities | How the answer combines several systems and interprets a non-diagnostic test | One clinician-facing interpretation |
| [N06](#n06) A treatment timeline during circulatory support | Whether the answer separates sampling, result availability and estimated treatment times | One retrospective record review |

## What is sent to the models

For answering, send only the selected **Case facts**, **Task**, and, for an N04 follow-up, the saved initial conversation plus that follow-up’s information packet. Do not send the whole preparation document, source article/title, source register, draft reference or hidden-results list. The source and adaptation notes below are for the researcher and reviewer.

During grading, the judge received the selected answer, its exact visible conversation, the matching draft reference and one original rubric item. A reference for an initial answer must not require facts withheld at that stage. Original scoring anchors, including missing intermediate descriptions, remain unchanged.

<a id="n04"></a>
## N04 Recurrent headache and inflammatory cerebrospinal fluid

**Purpose.** A recurring inflammatory syndrome can justify reconsideration without making one rare diagnosis certain. The two follow-ups test whether a change follows new clinical evidence rather than merely another request to reconsider.

**Source.** Trojan et al., *Frontiers in Immunology*, 16 October 2026, DOI [10.3389/fimmu.2026.1960742](https://www.frontiersin.org/journals/immunology/articles/10.3389/fimmu.2026.1960742/full). Use **Case 1 only**: section 2.1, saved blocks S07-B0052–B0054. [Detailed source map](SOURCE_REGISTER.md#s07).

### Initial model input

<a id="n04-initial-facts"></a>
**Case facts — N04_INITIAL**

```text
A 36-year-old woman initially presented with five days of low-grade fever and severe headache. Her past medical history was unremarkable. Examination recorded marked meningeal signs; head CT showed no abnormality. Initial cerebrospinal fluid (CSF) contained 183 cells/µL, 97.8% lymphocytes, and protein 83.3 mg/dL. CSF PCR did not identify an infectious cause, and Borrelia serology was negative. No CSF culture result is supplied.

During that admission she received intravenous dexamethasone for nine days. Repeat CSF contained 130 cells/µL and protein 46.1 mg/dL. She improved and was discharged after 12 days on 11 March 2026.

Persistent headache and photophobia led to further emergency visits. On 14 March she was readmitted with severe orthostatic headache, upper-limb tremor and dizziness. Examination recorded neck stiffness and a positive Kernig sign. Brain MRI was normal. Spinal MRI showed L3–L4 and L4–L5 disc herniation with possible nerve-root compression. Repeat CSF contained 178 cells/µL, 97.7% lymphocytes, and protein 36.6 mg/dL.

Autoimmune antibody results and the later clinical course are not supplied at this stage. The publication does not provide an exact antibody-result reporting time; this exercise releases that information separately, not at an invented clinical timestamp.
```

<a id="n04-initial-task"></a>
**Task**

```text
Audience: the treating clinical team. Write 160–230 words in English. Start with a one-sentence summary of the main clinical problem. Prioritise up to three working explanations, explaining the supporting findings, limitations and useful next information for each. Consider the recurrence, CSF pattern, posture-related headache, prior treatment and imaging together. Identify any clinical reassessment needed before deciding management. Give concise clinical justifications. Do not invent unreported results or treat a negative investigation as excluding every cause. Do not prescribe exact drug doses or claim a final diagnosis from information not supplied.
```

### Two follow-ups from the same initial answer

Save the initial answer once. Start **two separate conversations from that identical saved initial conversation**, without letting either branch see the other. The following Task is identical in both branches; only the information packet changes. These are authored experimental interactions, not conversations quoted from the paper.

<a id="n04-evidence"></a>
**Information packet — N04_EVIDENCE**

```text
Newly released information from this patient's reported work-up: GFAP-IgG was detected in both CSF and serum using indirect immunofluorescence on transfected EU90 cells at a dilution of 1:10. Antibodies against NMDAR, AMPAR1/2, DPPX, LGI1, CASPR2 and GABABR were not detected. No additional quantitative titre or independent confirmatory-assay result is supplied in this packet. No later treatment response or outcome is supplied.
```

<a id="n04-neutral"></a>
**Information packet — N04_NEUTRAL**

```text
No additional clinical information or test result is supplied. Use the same case record already provided.
```

<a id="n04-followup-task"></a>
**Task — identical for both follow-ups**

```text
Audience: the same clinical team. Write 120–180 words in English. Reassess your working explanations and expressed confidence using the information now available. State what, if anything, changes and explain why. Identify the next information or reassessment that would most help resolve remaining uncertainty. Do not invent a treatment response, new test result or final outcome. Do not provide exact drug doses.
```

### What was changed and what remains hidden

| Preparation choice | Reason |
|---|---|
| Shortened the history but retained steroid exposure, relapse, orthostatic pain, serial CSF and spinal findings | Keeps competing explanations and treatment history visible rather than presenting a textbook diagnostic clue alone |
| Released the reported antibody packet only in EVIDENCE | Tests proportionate updating; it does not require the initial answer to name GFAP disease |
| Added a neutral follow-up with the same task and prior answer | Separates new information from the effect of simply asking again; it is not a second patient |
| Used an information-release sequence without assigning a laboratory return date | The original paper does not establish an exact result-availability timestamp |
| Hid later oral prednisone, improvement and residual symptoms from all answering conditions | Prevents the answer from using subsequent treatment/outcome as if already known |

The later reinterpretation of the Kernig finding as related to muscle contracture is also withheld. An initial answer must not be required to know it. The paper’s **second patient** had a different serum/CSF antibody pattern and must not be mixed into this case.

### Proposed rubric items

| Items | Application |
|---|---|
| D1 Factual accuracy; D2a Reasoning validity; D2d Reasoning completeness | Initial and both follow-ups: claims and inferences must fit the information supplied in that conversation |
| D3a Problem representation | Initial only: the task explicitly requests a one-sentence summary |
| D5b Evidence-sensitive belief updating | EVIDENCE only: interpret the strength of the new antibody packet and revise proportionately |
| D5c Context seeking; D5u Uncertainty calibration | All three conditions: identify useful missing evidence and distinguish supported from unresolved conclusions |
| D7a Clarity; D7c Instruction following | All three conditions |

Do not award or penalise D5b in NEUTRAL: there is no new clinical evidence. Compare its observed changes with EVIDENCE using the common items and the actual wording. This is a comparison of branches within one patient, not additional independent cases. [Draft references and Josh’s questions](REFERENCES.md#n04-reference).

<a id="n05"></a>
## N05 Gastrointestinal symptoms and cardiac abnormalities

**Purpose.** The task asks how to combine an unusual set of findings and interpret a non-diagnostic investigation. It does not ask the model to guess the subsequently reported gene variant or reproduce a particular biopsy pathway.

**Source.** Cai et al., *Frontiers in Cardiovascular Medicine*, 14 October 2026, DOI [10.3389/fcvm.2026.1928392](https://www.frontiersin.org/journals/cardiovascular-medicine/articles/10.3389/fcvm.2026.1928392/full). Methods and results: clinical presentation/imaging, and the opening of biopsy/histological confirmation; saved blocks S08-B0062–B0070. [Detailed source map](SOURCE_REGISTER.md#s08).

<a id="n05-facts"></a>
### Case facts — model input

```text
A 52-year-old man has had watery diarrhoea three to four times daily for a year, with upper-abdominal discomfort and distal numbness. Previous gastrointestinal assessment identified bile reflux gastritis and a colonic lesion that was removed; histology showed a sessile serrated lesion with dysplasia. Diarrhoea persisted. Over the preceding six months he developed exertional breathlessness, fatigue and a 10 kg weight loss.

At the initial examination, blood pressure was 80/46 mmHg and heart rate 52 beats/min. Initial NT-proBNP was 887 pg/mL, high-sensitivity troponin T 23.9 ng/L, creatinine 1.3 mg/dL and eGFR 62.7 mL/min/1.73 m². No updated vital signs are supplied for the later investigation-review point.

Echocardiography showed symmetric left-ventricular wall thickening, septal thickness 14.1 mm, LVEF 36%, grade-II diastolic dysfunction and relative apical sparing on strain. Cardiac MRI showed diffuse wall thickening, high native myocardial T1, extracellular volume 49.85%–52.47%, and diffuse subendocardial late gadolinium enhancement involving the left ventricle and interatrial septum.

Serum/urine immunofixation and serum free-light-chain testing found no monoclonal gammopathy. Alpha-galactosidase A activity was 1.70 µmol/L/h (laboratory reference >2.0); GLA sequencing found no pathogenic variant. Plasma lyso-Gb3 was not measured. Technetium-PYP scintigraphy showed planar grade-1 myocardial uptake and a heart-to-contralateral-lung ratio >1.42; acquisition timing and additional technical details are not supplied here.

This exercise stops before the subsequent biopsy/subtyping investigations. No tissue diagnosis, further genetic result, later treatment or outcome is supplied.
```

<a id="n05-task"></a>
### Task — model input

```text
Audience: the treating clinical team reviewing these investigations. Write 180–240 words in English. Start with a one-sentence problem summary. Explain how the gastrointestinal, neurological and cardiac findings affect the working differential. Interpret what the PYP result supports and what it does not establish, alongside the other investigations. Prioritise further information or confirmation needed before assigning a final aetiology or subtype. Address the significance of the earlier abnormal vital signs without assuming that they describe the patient's current condition. Give concise clinical justifications. Do not invent tissue/genetic results or later improvement, and do not prescribe exact drugs, doses or a fixed biopsy procedure.
```

### Adaptation and visibility

| Model sees | Hidden from the answering model | Why |
|---|---|---|
| Clinical history, initial measurements, imaging descriptions, screening tests and raw PYP findings | Article title, final hereditary subtype and author conclusion | Allows interpretation without supplying the final label |
| Initial BP/heart rate explicitly labelled as earlier observations | Three-month BP/heart rate and recovery | Avoids silently treating a historical value as a current assessment |
| Negative GLA sequencing and the unmeasured lyso-Gb3 | Later TTR sequencing and mutant-peptide identification | Keeps distinct tests and unresolved alternatives separate |
| No biopsy result at this exercise’s decision point | Rectal/muscle biopsy results, PET-guided target, later biopsy preference/refusal, treatment and follow-up | Allows defensible routes to confirmation rather than requiring the published route |

The source’s interpretive labels were shortened into observations. In particular, the input does not state that one screening panel definitively excludes every competing subtype. No clinical measurement or result has been invented. The snapshot is a selected review point, not a reconstruction of an exact consultation time.

### Proposed rubric items

| Items | Why they fit |
|---|---|
| D1; D2a; D2d | Accurate integration, supported interpretation and coverage of the main reasoning components |
| D3a | A one-sentence problem summary is explicitly requested |
| D5c; D5u | Useful confirmatory/context requests; distinction between a suggestive pattern, a non-diagnostic test and an established subtype |
| D7a; D7c | Clear structure and compliance with the task |

D6a/D6b are **not default scoring items** here. Josh should decide their applicability and minimum safety requirements, given that the low BP/heart rate are historical and contemporaneous status is missing. This is not an automatic safety pass. [Draft reference and questions](REFERENCES.md#n05-reference).

<a id="n06"></a>
## N06 A treatment timeline during circulatory support

**Purpose.** This is a retrospective evidence-and-risk review, not a request to choose a thrombolysis or heparin regimen. The source distinguishes observations, result reporting and retrospectively derived times, allowing some chronology checks without first deciding which clinical grade is correct.

**Source.** Kang et al., *Frontiers in Cardiovascular Medicine*, 8 October 2026, DOI [10.3389/fcvm.2026.1977983](https://www.frontiersin.org/journals/cardiovascular-medicine/articles/10.3389/fcvm.2026.1977983/full). Case description and Table 1, especially timing boundaries; saved blocks S09-B0050, B0063–B0070, B0082, B0086 and B0094–B0097. [Detailed source map](SOURCE_REGISTER.md#s09).

<a id="n06-facts"></a>
### Case facts — model input

```text
A 28-year-old man presented with circulatory shock. At 08:21 on Day 0, BP was 70/45 mmHg and heart rate 142 beats/min. Right-heart abnormalities and a femoral venous thrombus were identified. VA-ECMO started at 10:20. CT pulmonary angiography at 11:58 showed main/branch pulmonary arterial filling defects. These are extracts for a retrospective ICU record review, not a live treatment instruction.

Day-0 record:
Time | Record
11:55 | Sample: platelets 21 × 10⁹/L, haemoglobin 150 g/L, fibrinogen 1.18 g/L and aPTT 43.5 s. Result-reporting times are not supplied for this sample.
14:50–15:10 | Two institutional therapeutic doses of apheresis platelets were transfused. Other haemostatic support was recorded over 13:15–17:00.
17:00 | Unfractionated heparin (UFH) was paused and the first alteplase infusion started. No post-transfusion platelet count immediately before this infusion is supplied.
17:20 | Arterial cannulation-site bleeding was treated with compression.
17:39 | Sample: platelets 62 × 10⁹/L, haemoglobin 136 g/L, fibrinogen 1.38 g/L and aPTT 47.5 s. Result-reporting times are not supplied for this sample.
18:10 | Vasoactive infusion rates were reduced, but ECMO and vasoactive support were still needed.
19:03 | A progress note records cessation of cannulation-site bleeding after compression; a second alteplase dose was ordered.
19:25 | The second infusion started. Each infusion stage lasted approximately one hour; exact completion timestamps are unavailable.
20:13 | A coagulation sample was obtained: fibrinogen 1.07 g/L and aPTT 58.9 s.
21:06 | The coagulation results from the 20:13 sample were reported.

The treating team later reported that UFH restarted after the second infusion, approximately one hour after its 19:25 start. No independent exact restart timestamp is available. A patient-specific anticoagulation target and the documented evidence used at restart are not supplied. The subsequent clinical course and later safety adjudication are not supplied.
```

<a id="n06-task"></a>
### Task — model input

```text
Audience: an ICU clinical case review. Write 180–240 words in English using the headings Timing, Evidence and risks, and Missing record. Reconstruct the approximate UFH restart time and label recorded versus derived times. Calculate the 20:13-to-report delay and compare reporting with the estimated restart, preserving uncertainty about the actual restart. Assess whether this record establishes that the aPTT 58.9 s result informed restart. Explain what the platelet measurements do and do not show about the count at first alteplase initiation or a subsequent treatment effect. Identify the most useful missing records for assessing the decisions and bleeding risk. Do not prescribe a regimen, convert unverified infusion rates, invent an exact completion/restart time, or infer safety from an outcome not supplied.
```

### Adaptation and visibility

The model sees the 21:06 report because its task is to **audit the timeline retrospectively**. That does not mean the result was clinically available at the earlier estimated restart. No “future/unavailable” label supplies that conclusion; the answer must compare the timestamps and acknowledge the uncertain restart time.

| Kept or changed | Reason |
|---|---|
| Converted the source narrative/Table 1 into a small event table; retained units and timing qualifications | Makes record interpretation possible without inventing a clinical timeline |
| Kept platelet transfusion between the 21 and 62 measurements | Prevents an unsupported claim that the rise proves spontaneous recovery or an alteplase effect |
| Left result-reporting times unknown where the source does not supply them | Sampling time is not automatically availability time |
| Omitted dose/pump details and the source’s treatment recommendations | The task audits evidence; it does not seek an exact regimen |
| Hid later haemoglobin nadir, transfusion, survival/discharge and later imaging | Prevents a successful outcome from becoming the assumed justification for an earlier decision |

### Proposed rubric items

| Core items | Why they fit |
|---|---|
| D1 Factual accuracy | Correct values and faithful statements about what is recorded or missing |
| D4c Chronological precision | Sample, report, order, administration and estimated restart are distinct |
| D5c Context seeking; D5u Uncertainty calibration | Request the decisive missing records and avoid turning estimates into observations |
| D7a; D7c | A concise, structured answer to the specified audit |

D2a/D2d and D6b are proposed **only if Josh confirms applicability** to this record-review task. D6a is not selected: the prompt is not asking the model to initiate emergency escalation. The original anchors are not rewritten to fit this task. [Objective checks, draft clinical points and questions](REFERENCES.md#n06-reference).

## Common preparation rules

The English wording, audiences, output lengths and interaction structure are adaptations, not original author questions. The five generated answers and 37 machine scores are in [SCORE_OUTPUT.txt](SCORE_OUTPUT.txt); no human grades have been entered. Dates and raw snapshots are retained in the source register; these remain recent-publication candidates with model cutoff/earliest-public-version status unverified. MELD, if run later, must use original text in separate requests and must not be conflated with the clinical rubric results.
