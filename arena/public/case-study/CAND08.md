# CAND08 — Seizure, behavioural change and kidney allograft dysfunction

Clinical reference and information requirements: awaiting confirmation.

Source: https://doi.org/10.3389/fmed.2026.1981467

Decision point: Transfer admission, designated Day 0 in the report. Only the presenting history, examination and clearly identified initial/admission findings are requestable; subsequent viral confirmation, complement investigation and biopsy are outside this decision point.

Opening: A 23-year-old kidney-transplant recipient is transferred with a recent tonic-clonic seizure, worsening agitation and abnormal behaviour, severe anaemia and acute allograft dysfunction. The patient is delirious; use caregiver observations and clinical records.

Task: Audience: a clinician. Use 180-260 words in English. Summarise the clinical problem, give up to three prioritised explanations with brief evidence and uncertainty, and state proportionate next information/actions. Use only information actually supplied. Do not invent findings, measured values, doses or probabilities. Assess the acute neurological and systemic risk, construct a provisional problem representation and prioritised differential, and identify the next information or specialist assessment needed. Do not assume a single cause explains every abnormality. After up to six question turns, give a clinician-facing final assessment of 180–260 words. Urgent care must not wait for completion of the questions. Word-count rule: count the answer body and heading text after removing Markdown heading/list markers and emphasis/backtick symbols; split on whitespace. Hyphenated expressions count as one word. Exclude JSON only if the task explicitly excludes it. No extra tolerance is added to the stated word range.

## Actual questions and replies

### Question 1
Could you tell me: (1) What is the current immunosuppression regimen, and have there been any recent changes or missed doses? (2) Regarding the anaemia, is there any evidence of haemolysis — for example, raised LDH, elevated bilirubin, low haptoglobin, or schistocytes on blood film?

Saved assessment note: The combination of seizure, severe anaemia, and acute allograft dysfunction in a transplant recipient raises thrombotic microangiopathy (TTP/HUS) as a leading concern. I need to know the immunosuppression (calcineurin inhibitors are a known trigger for TMA) and whether the anaemia is haemolytic, which would strongly support TMA over other causes.

Returned 08.transplant_medication (record, presentation): She received a deceased-donor kidney transplant six years earlier for end-stage renal disease. The reported maintenance regimen before presentation was tacrolimus 1.5 mg twice daily, mycophenolate mofetil 360 mg twice daily and prednisone 8 mg daily.

Returned 08.haematology (record, presentation): The initial work-up described anaemia, thrombocytopenia and schistocytes. Table 1's admission column gives haemoglobin 52 g/L, platelets 92 × 10^9/L, schistocytes 0.8%, haptoglobin 0.126 g/L and LDH 262 U/L.

Environment feedback: Recent immunosuppression changes, missed doses and bilirubin results are not documented in the frozen requestable packet; do not infer that there were no changes or missed doses, or that bilirubin was normal. Use the stored haemolysis measurements without adopting every example qualifier in the question. No directly responsive stored group is deferred by the two-group cap.

### Question 2
Could you tell me: (1) What is the tacrolimus trough level on admission? (2) Has any neuroimaging (CT or MRI brain) been performed, and if so, what were the findings?

Saved assessment note: Tacrolimus level is critical to assess for calcineurin-inhibitor toxicity as a driver of both TMA and posterior reversible encephalopathy syndrome. Neuroimaging is essential to distinguish PRES from structural or infectious causes of the seizure and delirium in this immunosuppressed patient.

Returned 08.allograft_function (record, presentation): The local work-up had identified acute allograft dysfunction. The admission column of Table 1 reports creatinine 589 μmol/L and a tacrolimus trough of 7.30 ng/mL. A measured pre-illness creatinine is not given in this packet.

Environment feedback: The admission tacrolimus trough is in the selected group. Neuroimaging findings are not supplied within the frozen Day 0 packet: the report does not precisely date its MRI description, so it cannot be assigned to Day 0. This is an evidence-boundary limitation, not a statement that imaging was unperformed or normal. No further directly responsive group is deferred by the two-group cap.

### Question 3
Could you tell me: (1) Is there any evidence of active infection — fever, recent illness, or positive viral screen (e.g. CMV, EBV) — in the admission records? (2) What is the patient's blood pressure on admission, and are there any urine findings (proteinuria, haematuria, dysmorphic red cells) documented?

Saved assessment note: Infection and blood pressure/urine findings help distinguish infection-triggered TMA from primary TTP or CNI-associated TMA, and characterise the renal injury pattern at this decision point.

Returned 08.admission_examination (record, presentation): On Day 0 she was delirious and appeared pale. Temperature was 36.8 °C, pulse 91/min, respiratory rate 19/min and blood pressure 141/85 mmHg.

Returned 08.prodrome (caregiver, presentation): About two weeks before this admission she developed throat discomfort and a productive cough. The symptoms did not improve with levofloxacin.

Environment feedback: The first requested item, fever/admission observations, matches the examination group; the recent-illness item then matches the prodrome group. Day 0 CMV/EBV screening results and the requested urine/proteinuria/haematuria/microscopy findings are not supplied in the frozen requestable packet. Do not infer a negative viral screen, normal urine, or that testing was not performed. No additional directly responsive stored group is deferred by the two-group cap; later viral findings remain outside this decision point.

### Question 4
Could you tell me: (1) Was ADAMTS13 activity or inhibitor testing performed as part of the admission work-up? (2) Is there any prior history of thrombotic microangiopathy — before or after the transplant — or any known autoimmune condition?

Saved assessment note: ADAMTS13 results would help distinguish TTP from other causes of TMA, and prior TMA or autoimmune history would inform whether this is de novo or recurrent disease, both critical for management.

Environment feedback: The frozen Day 0 packet does not supply ADAMTS13 activity/inhibitor findings or establish whether that testing was performed as part of the Day 0 work-up. Later ADAMTS13/complement evidence is outside the decision point and must not be retrospectively assigned to admission. Prior thrombotic-microangiopathy or autoimmune history is not documented in any requestable group; do not infer a negative history or that testing was not performed. No directly responsive group is deferred by the two-group cap.

### Question 5
Could you tell me: (1) Regarding the seizure — was it witnessed, how long did it last, and are there any focal neurological signs or a prior history of seizures? (2) During the two-week prodrome of throat discomfort and productive cough, were there any other symptoms such as fever, rash, lymphadenopathy, weight loss, or joint pain?

Saved assessment note: Characterising the seizure (focal vs generalised, duration, recurrence) and expanding the prodrome history will help distinguish CNS TMA, encephalitis, or other causes of the delirium, and will refine the infection versus non-infection differential.

Environment feedback: Witness status, seizure duration, focal neurological findings and any earlier seizure history are not supplied in the frozen requestable packet. The stored neurological-course group gives the known event type/timing and subsequent behaviour but does not answer these additional descriptors. Associated fever, rash, lymphadenopathy, weight loss or joint pain DURING the two-week prodrome are also not documented; the stored prodrome group does not establish their absence. The Day 0 temperature must not be substituted for a prodromal fever history. No directly responsive group is deferred by the two-group cap, and no absence or nonperformance is inferred.

## Final answer, unchanged

**Clinical Problem**

A 23-year-old immunosuppressed kidney-transplant recipient (deceased-donor graft, six years) presents with acute encephalopathy (tonic-clonic seizure, delirium, worsening agitation), microangiopathic haemolytic anaemia (Hb 52 g/L, platelets 92 × 10⁹/L, schistocytes 0.8%, haptoglobin 0.126 g/L, LDH 262 U/L), and acute allograft dysfunction (creatinine 589 μmol/L; no pre-illness baseline documented). Tacrolimus trough 7.30 ng/mL. A two-week prodrome of throat discomfort and productive cough, unresponsive to levofloxacin, preceded admission. Day 0 observations: afebrile, BP 141/85 mmHg.

**Prioritised Differential**

1. Thrombotic microangiopathy: schistocytes, thrombocytopenia, anaemia, and allograft dysfunction are consistent. Aetiology is uncertain—calcineurin-inhibitor related, de novo, or infection-triggered. ADAMTS13 activity is unavailable at this decision point, so TTP cannot be excluded.
2. CNS infection (viral encephalitis): prodromal respiratory symptoms, delirium, and seizure raise this possibility. Day 0 viral screen results are not documented; absence cannot be inferred.
3. Acute allograft pathology (rejection or other): creatinine 589 without a baseline; contribution to systemic derangement is unclear.

These entities are not mutually exclusive and may coexist.

**Urgent Next Steps**

Neuroimaging (CT or MRI), ADAMTS13 activity and inhibitor, viral PCR panel (CMV, EBV, HSV), urinalysis with microscopy, and urgent haematology and transplant-nephrology review. Do not delay stabilisation pending results.

## Provisional reference

Represent an acutely encephalopathic, immunosuppressed transplant recipient with allograft dysfunction and haematological abnormalities. Use received evidence to consider neurological infection, metabolic/uraemic or medication-related processes and a systemic microangiopathic or graft process without demanding one unifying diagnosis. Severe anaemia, thrombocytopenia and schistocytes support further assessment but do not identify a specific subtype by themselves. Recommend timely coordinated acute neurological and transplant/nephrology review. Do not use later virology, complement studies or tissue findings to demand a Day 0 diagnosis or a particular immunosuppression change. The candidate requests, prioritisation and exact escalation pathway await clinical confirmation.

## Candidate information requirements

- 08.R1 — candidate essential: Request a current neurological and physiological severity assessment or request an equivalent urgent assessment. Why: A recent seizure with worsening behaviour and current delirium creates an immediate neurological risk independent of the eventual cause. Acceptable alternatives: Current mental state/neurological examination, vital signs and acute seizure/encephalopathy assessment, or a clearly specified urgent neurological/emergency review. An unavailable detailed examination does not invalidate an adequate request. Deadline: Before the final assessment, within the six question turns; initiate urgent assessment promptly.
- 08.R2 — candidate essential: Seek the transplant and immunosuppressive medication history, including relevant exposure or drug-level context. Why: Transplantation changes the interpretation of neurological deterioration and graft dysfunction and affects the risks of subsequent management. Acceptable alternatives: A general transplant/medication review with current regimen and timing, with a relevant request for drug concentrations or equivalent transplant-team record review. Exact drug names need not be guessed. Deadline: Before the final assessment, within the six question turns.
- 08.R3 — candidate essential: Request the renal-function and haematological evidence underlying the reported allograft dysfunction and anaemia. Why: The opening explicitly identifies two additional acute organ-system problems; neither can be safely reduced to an unexplained behavioural presentation. Acceptable alternatives: Renal function plus blood count and haemolysis/smear review, or a clinically equivalent integrated acute transplant/TMA work-up. Requests for previous renal measurements receive credit even when no measured baseline is supplied. Deadline: Before the final assessment, within the six question turns.

## Saved scores and explanations

### D1 — primary, repeat 1: 5
All factual claims in the submission match the supplied Day 0 evidence exactly: immunosuppression history and tacrolimus trough 7.30 ng/mL (Q2), haemolysis parameters (Hb 52 g/L, platelets 92 × 10⁹/L, schistocytes 0.8%, haptoglobin 0.126 g/L, LDH 262 U/L, Q1), creatinine 589 μmol/L (Q2), afebrile admission temperature and BP 141/85 mmHg (Q3), and the two-week prodrome unresponsive to levofloxacin (Q3). No invented findings, doses, or probabilities appear. The submission explicitly acknowledges uncertainty where evidence is unavailable — noting ADAMTS13 is unavailable at this decision point so TTP cannot be excluded (Q4), that Day 0 viral screen results are undocumented and absence cannot be inferred (Q3), that no pre-illness creatinine baseline exists (Q2), and that neuroimaging findings are not established at Day 0 (Q2). It correctly avoids assuming a single unifying cause and frames the differential as potentially coexisting. This meets the Score 5 anchor: accurate throughout and explicitly acknowledging where evidence is uncertain or evolving.

### D3a — primary, repeat 1: 5
The submission synthesises the actually available Day 0 evidence into a focused, clinically meaningful representation: it correctly combines the transplant context (six-year deceased-donor graft, tacrolimus/MMF/prednisone), acute encephalopathy (seizure, delirium), the haematological picture (Hb 52, platelets 92, schistocytes 0.8%, low haptoglobin), and allograft dysfunction (creatinine 589) with the tacrolimus trough of 7.30 ng/mL. It appropriately qualifies consequential unresolved gaps rather than closing them: it does not infer a negative viral screen, notes ADAMTS13 is unavailable at this decision point so TTP cannot be excluded, flags the absent pre-illness creatinine baseline, and explicitly states the entities may coexist — matching the task instruction not to assume a single cause. The differential is prioritised with brief evidence and uncertainty (Q1–Q3 findings), and next steps (neuroimaging, ADAMTS13, viral PCR, urinalysis, specialist review) are proportionate and urgent. No available defining feature is omitted or distorted, and no unjustified diagnostic commitment is made on the undisclosed results (later viral, complement, biopsy data are correctly not assumed). Minor limitations, such as listing LDH 262 U/L within the MAHA description without commenting on its non-elevated value, do not change the clinical framing. This meets the Score 5 anchor: discriminating features supported by available evidence, guidance for hypothesis generation, and clear statement of unresolved gaps.

### D3b — primary, repeat 1: 4
The submission prioritises a breadth-appropriate differential using only Day 0 evidence: thrombotic microangiopathy (supported by schistocytes, thrombocytopenia, anaemia, allograft dysfunction from Q1/Q2), CNS infection (supported by the Q3 prodrome and seizure/delirium), and acute allograft pathology. It explicitly acknowledges uncertainty (ADAMTS13 unavailable per Q4 feedback, viral screen not documented per Q3), avoids inferring absent findings, and notes entities may coexist, matching the instruction not to assume a single cause. It also flags the dangerous mimic TTP. However, discriminating findings are not fully explicit for each diagnosis (e.g., no discussion of tacrolimus level 7.30 ng/mL arguing against CNI toxicity, or how the afebrile Day 0 temperature and BP inform the differential), and prior plausibility is not discussed in depth. This meets Score 4 — prioritises a breadth-appropriate differential using available evidence and considers important alternatives — but falls short of Score 5's requirement for explicit discriminating findings and proportionate prior-plausibility reasoning throughout.

### D4c — primary, repeat 1: 5
The submission presents events in correct sequence with explicit temporal anchors: it establishes the six-year transplant history, then the 'two-week prodrome of throat discomfort and productive cough... preceded admission,' followed by 'Day 0 observations: afebrile, BP 141/85 mmHg' and admission laboratory data. It also correctly keeps later evidence (ADAMTS13, viral screens) flagged as unavailable at this decision point rather than misplacing it in the timeline. Chronology is accurate and explicitly anchored, matching the Score 5 anchor ('Day 0' is used as a temporal anchor). No sequencing errors are present.

### D5c — primary, repeat 1: 5
All three frozen essential requirements are met by targeted, timely interactive requests. R2 (transplant/immunosuppression) is satisfied by Q1 (regimen, changes, missed doses) and Q2 (tacrolimus trough, answered as 7.30 ng/mL). R3 (renal and haematological evidence) is satisfied by Q1 (haemolysis markers, answered with Hb, platelets, schistocytes, haptoglobin, LDH) and Q3 (urine findings and BP, with creatinine supplied via the allograft group). R1 (current neurological/physiological severity) is addressed by Q3 (admission vitals and examination, answered with temperature 36.8 °C, BP 141/85, delirium noted), Q2 (neuroimaging request — unavailability is an environment limitation, not a model failure), and Q5 (seizure characterisation, focal signs). Requests are proportionate and discriminating, each with a prospectively allowed note clearly linking the information to the clinical uncertainty (e.g. CNI toxicity/TMA/PRES in Q2, infection-triggered vs primary TMA in Q3, TTP vs other TMA in Q4). The sequence is well prioritised — immediately dangerous TMA/CNI questions first, then infection, then discriminating tests and history. No unnecessary information gathering is evident across the five turns. This matches the Score 5 anchor.

### D5u — primary, repeat 1: 5
The submission separates established facts (admission labs, tacrolimus trough, prodrome) from unresolved aetiologies: TMA is supported but its subtype/trigger is explicitly uncertain, CNS infection is framed as a possibility with viral screening noted as undocumented, and allograft pathology is flagged as unclear without a baseline. It names the specific sources of uncertainty (ADAMTS13 unavailable at this decision point, no Day 0 viral results, no pre-illness creatinine), avoids inferring absence of findings, states the entities may coexist, and identifies concrete next steps (ADAMTS13, viral PCR, urinalysis, imaging, specialist review) that would reduce each uncertainty. This matches the Score 5 anchor: distinguishing established, probable, possible and unresolved conclusions, explaining the source of uncertainty, and specifying the next step needed to resolve it.

### D6a — primary, repeat 1: 4
The submission clearly recognises a time-critical presentation (acute encephalopathy with seizure, severe anaemia Hb 52 g/L, thrombocytopenia with schistocytes, creatinine 589 μmol/L) and gives a timely, correct escalation pathway: urgent haematology and transplant-nephrology review plus urgent diagnostics (neuroimaging, ADAMTS13, viral PCR, urinalysis), with an explicit statement 'Do not delay stabilisation pending results.' This satisfies Score 4 (clear, timely escalation with correct pathway). It falls short of Score 5 because the specific care level (e.g., ICU/HDU admission, emergency-team activation) is not specified and the escalation, while present, is not the prominent headline of the output. It exceeds Score 3 because urgency and timing are stated clearly and no clinically material delay is introduced.

## All stored source facts and original locations

- 08.transplant_medication (record, BK_overlap-B0051, opening maintenance-treatment sentences): She received a deceased-donor kidney transplant six years earlier for end-stage renal disease. The reported maintenance regimen before presentation was tacrolimus 1.5 mg twice daily, mycophenolate mofetil 360 mg twice daily and prednisone 8 mg daily.
- 08.prodrome (caregiver, BK_overlap-B0051, two-weeks-before-admission history): About two weeks before this admission she developed throat discomfort and a productive cough. The symptoms did not improve with levofloxacin.
- 08.neurological_course (caregiver, BK_overlap-B0051, one-week-before-admission and transfer sentences): A tonic-clonic seizure occurred about one week before admission, followed by progressively agitated and abnormal behaviour. Neurological symptoms worsened despite symptomatic treatment at the local hospital, leading to transfer.
- 08.admission_examination (record, BK_overlap-B0051, Day 0 vital-sign and examination sentences): On Day 0 she was delirious and appeared pale. Temperature was 36.8 °C, pulse 91/min, respiratory rate 19/min and blood pressure 141/85 mmHg.
- 08.haematology (record, BK_overlap-B0051, initial-work-up sentence; BK_overlap-B0056, B0059-B0060, B0063, B0066, B0068): The initial work-up described anaemia, thrombocytopenia and schistocytes. Table 1's admission column gives haemoglobin 52 g/L, platelets 92 × 10^9/L, schistocytes 0.8%, haptoglobin 0.126 g/L and LDH 262 U/L.
- 08.allograft_function (record, BK_overlap-B0051, local-hospital-work-up sentence; BK_overlap-B0056, B0067, B0069): The local work-up had identified acute allograft dysfunction. The admission column of Table 1 reports creatinine 589 μmol/L and a tacrolimus trough of 7.30 ng/mL. A measured pre-illness creatinine is not given in this packet.
- 08.initial_immune_status (record, BK_overlap-B0051, initial-work-up sentence; BK_overlap-B0056, B0079-B0082): Profound CD4 T-cell lymphopenia was described in the initial work-up. Table 1's admission values include CD3 58 cells/μL, CD4 20 cells/μL, CD8 37 cells/μL and CD4/CD8 ratio 0.53.
- 08.initial_csf (record, BK_overlap-B0051, initial lumbar-puncture sentence; BK_overlap-B0083-B0086): The initial lumbar-puncture account describes raised intracranial pressure without pleocytosis. The table records an opening pressure above 320 mmH2O. CSF protein is not reproduced because the narrative and table do not agree on the biochemical description.

Adaptation: Published clinical facts are paraphrased into caregiver/record replies; the caregiver voice is a researcher-designed delivery channel, not a documented interview. Opening, six-turn task, requirements and release rules are authored adaptations. Initial findings are withheld until requested for the experiment; this does not imply they were unavailable to the real treating team. Day-5 virology, subsequent complement testing and Day-21 biopsy retain their actual later chronology. Table 1's broad 'Admission' heading is not used to move explicitly later viral or immune findings to Day 0. Disputed CSF protein and undated MRI/EEG/ultrasound findings are omitted rather than assigned an invented value or date.
Withheld: Day-5 BK viremia confirmation and viral quantities, later CSF sequencing, complement/ADAMTS13 findings, Day-21 renal biopsy, later diagnostic labels, treatment changes, discharge improvement and one-year graft failure. No later result is a compulsory Day 0 diagnosis.
