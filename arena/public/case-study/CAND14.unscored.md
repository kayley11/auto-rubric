# CAND14 — Jaundice, abdominal pain and fever after prior hepatectomy

Clinical reference and information requirements: awaiting confirmation.

Source: https://doi.org/10.3389/fmed.2026.1967233

Decision point: Admission assessment five months after outside hepatectomy, before ERCP, removed-material pathology and treatment response. The pre-ERCP MRCP/CT packet is requestable experimentally; its release is not a claim that imaging was completed at the instant of admission.

Opening: A 70-year-old woman develops progressive jaundice over two weeks with intermittent abdominal pain, then three days of fever reaching 40.0 °C. She underwent liver surgery five months earlier.

Task: Audience: a clinician. Use 180-260 words in English. Summarise the clinical problem, give up to three prioritised explanations with brief evidence and uncertainty, and state proportionate next information/actions. Use only information actually supplied. Do not invent findings, measured values, doses or probabilities. Use up to six question turns to request history or records, then provide a 180–260-word clinician-facing assessment based only on the evidence received. Assess urgency and the cause of jaundice, request relevant operation and imaging records, and distinguish an unavailable record from a missed request. Explain the limits of attributing the illness to the previous operation. Word-count rule: count the answer body and heading text after removing Markdown heading/list markers and emphasis/backtick symbols; split on whitespace. Hyphenated expressions count as one word. Exclude JSON only if the task explicitly excludes it. No extra tolerance is added to the stated word range.

## Actual questions and replies

### Question 1
Regarding the hepatectomy five months ago: what was the indication (e.g., tumour, trauma, other), what type of resection was performed, and was any biliary reconstruction (such as a Roux-en-Y hepaticojejunostomy) carried out? Also, what was the immediate post-operative course—any bile leak, stricture, or readmission?

Saved assessment note: Establishing the surgical indication, extent of resection, and biliary reconstruction is essential to frame the differential for obstructive jaundice and cholangitis in this post-hepatectomy patient. The post-operative course will help distinguish early complications from late recurrence or new pathology.

Returned 14.prior_surgery_and_liver_history (record, presentation): She had hepatitis C for 15 years. Left hepatectomy and cholecystectomy for a cirrhotic nodule were performed elsewhere five months before admission. Available records report no postoperative complications.

Returned 14.unavailable_operation_and_outside_pathology (record, presentation): The original hepatectomy operative report is unavailable. The outside pathology report describes chronic hepatitis and nodular cirrhosis, with no definite neoplastic change. The available material cannot identify a specific operative vascular, thermal or biliary injury.

Environment feedback: The first group supplies indication, resection and the limited recorded postoperative course. The original operative report is explicitly unavailable, so whether a specific biliary reconstruction was carried out cannot be established; do not infer no reconstruction or invent Roux-en-Y anatomy. Available records report no postoperative complications, but do not separately establish the absence of every requested bile leak, stricture or readmission. These details are unavailable/unspecified, not deferred by the two-group cap. No later ERCP or removed-material pathology is released.

### Question 2
What are her current laboratory results—total and direct bilirubin, alkaline phosphatase, GGT, transaminases, white cell count, CRP, and blood culture status? Has any imaging been performed since admission (ultrasound, CT, or MRCP), and if so, what were the findings?

Saved assessment note: I need to characterise the pattern of jaundice (obstructive vs hepatocellular) and assess for cholangitis, and to know whether imaging has already localised a biliary obstruction or other cause before ERCP.

Returned 14.admission_liver_tests (record, presentation): Admission total bilirubin was 234.0 μmol/L and direct bilirubin 182.4; ALP 155 U/L, GGT 172, AST 88 and ALT 64. Albumin was 38 g/L and INR 1.11.

Returned 14.inflammation_and_safety (record, presentation): Admission CRP was 188.60 mg/L, procalcitonin 9.49 ng/mL, white cells 4.10 × 10^9/L with 93.8% neutrophils, and platelets 76 × 10^9/L. Creatinine was 73 μmol/L and lactate 0.8 mmol/L. No further high fever was recorded after admission. Blood and bile cultures were not performed.

Environment feedback: The first two requested domains are liver chemistry, then inflammatory/culture status; return these two groups in that order. The record explicitly states blood and bile cultures were not performed, so this is stronger than a merely unsupplied culture result and must not become a negative culture. Requested pre-ERCP imaging in 14.biliary_imaging and 14.arterial_imaging is available but deferred solely by the two-group cap. Do not claim that imaging was unavailable or not performed, and do not infer a precise admission-day acquisition/result time from experimental requestability. No ERCP or removed-material pathology is released.

### Question 3
What were the findings on the pre-ERCP MRCP and CT—specifically regarding biliary anatomy, any stricture, stone, or mass, and the relationship to the prior hepatectomy site?

Saved assessment note: The pre-ERCP imaging is available and is the key next step to characterise the biliary obstruction and its anatomical basis before interpreting ERCP findings.

Returned 14.biliary_imaging (record, presentation): Available pre-ERCP MRCP shows intrahepatic and extrahepatic duct dilatation with sludge-like common-bile-duct material. The common bile duct measures about 19 mm and the largest intrahepatic duct about 9 mm. CT shows heterogeneous intraductal material.

Returned 14.arterial_imaging (record, presentation): The pre-ERCP contrast CT describes a patent hepatic artery supplying the remaining liver, without visible stenosis, occlusion or thrombosis. This is a large-vessel observation, not proof against every prior or localised ischaemic injury.

Environment feedback: Return the pre-ERCP biliary-imaging group, then the additional CT arterial/remnant-liver context, both within the requested MRCP/CT review. The imaging describes duct dilation and sludge-like/heterogeneous intraductal material, not histologically established stone, cast, tumour or necrotic tissue. A definite stricture or precise anatomical/causal relationship to the prior hepatectomy site is not established by this packet. Do not import the later completion cholangiogram showing no residual stricture, ERCP extraction or material pathology. The original operative report remains unavailable. No further directly responsive group is deferred by the cap.

## Final answer, unchanged

**Assessment**

This 70-year-old woman presents with obstructive jaundice (direct-predominant hyperbilirubinaemia, elevated ALP/GGT) and a febrile inflammatory response (CRP 188.6, PCT 9.49, neutrophil predominance) five months after left hepatectomy and cholecystectomy for a cirrhotic nodule. Pre-ERCP MRCP and CT show intrahepatic and extrahepatic duct dilatation with sludge-like/heterogeneous intraductal material; a definite stricture or causal relationship to the resection site is not established.

**Prioritised explanations:**

1. Biliary obstruction with superimposed cholangitis: most consistent with the obstructive biochemistry, duct dilatation, intraductal material, and inflammatory markers. The material is not yet histologically characterised. Blood and bile cultures were not performed, so fever aetiology is unconfirmed.

2. Post-hepatectomy biliary stricture or anastomotic complication: plausible given timing, but the original operative report is unavailable and no biliary reconstruction is confirmed or excluded. Available records report no postoperative complications yet do not separately rule out a subclinical stricture or bile leak.

3. Ischaemic biliary injury: contrast CT shows a patent hepatic artery to the remnant liver without visible stenosis or thrombosis; this is a large-vessel observation and does not exclude a localised ischaemic insult.

**Urgency:** High. Obstructive jaundice with fever and elevated inflammatory markers warrants prompt biliary drainage and culture.

**Next steps:** Proceed with ERCP for decompression and material retrieval; obtain blood and bile cultures; request the original operative report from the outside centre (currently unavailable, not a missed request); await removed-material pathology.

**Limits of attribution:** The prior operation is a temporal association, not a proven cause. Without the operative report, histology of the intraductal material, or demonstrated stricture at the resection site, causality cannot be established.

## Provisional reference

Jaundice, abdominal pain and recent high fever after hepatectomy require urgent assessment for biliary obstruction with possible acute cholangitis. Assess haemodynamics, mental state and organ function, obtain appropriate cultures if feasible, and involve the hepatobiliary or endoscopy service promptly. The absence of further high fever after admission does not erase the preceding illness. Treatment and drainage decisions should follow the current severity and local specialist pathway.

If the admission laboratory packet is received, marked predominantly direct hyperbilirubinaemia and raised inflammatory markers strengthen this concern. A near-normal total white-cell count does not negate the high neutrophil fraction or other inflammatory evidence. If imaging is received, substantial duct dilatation with heterogeneous common-duct material supports mechanical obstruction. Stones or sludge, postoperative narrowing, clot or tissue debris and tumour-related obstruction remain considerations; imaging alone cannot establish the material’s histology.

Review the outside operation and pathology. The operative report is explicitly unavailable, so a request for it is still appropriate and should be credited. Chronic hepatitis with cirrhosis and no definite neoplasia were reported in the outside specimen. A patent visible hepatic artery does not establish that all earlier microvascular injury is absent. The five-month sequence supports temporal association only; no specific surgical injury, necrotic epithelial pathology, cast morphology or later improvement should be asserted from the initial evidence.

## Candidate information requirements

- 14.R1 — candidate essential: Request current severity, inflammatory and liver/organ-function evidence. Why: Jaundice, abdominal pain and high fever raise a potentially urgent biliary infection or obstruction problem before any unusual pathology is known. Acceptable alternatives: Liver tests plus inflammatory markers and a current sepsis/organ-function assessment, or an equivalent urgent cholangitis assessment. Blood pressure not supplied must not be invented. Deadline: Before the final assessment, within the six question turns. Emergency escalation must not be delayed to exhaust the question budget.
- 14.R2 — candidate essential: Seek the previous operation and available outside records. Why: The surgery type, timing and underlying disease materially alter the differential. Acceptable alternatives: A request for the operative note, surgical summary or outside records is adequate even though the original note cannot be supplied. Available pathology/summary is an acceptable partial alternative; acknowledging the gap is required rather than guessing a surgical injury. Deadline: Before the final assessment, within the six question turns. Emergency escalation must not be delayed to exhaust the question budget.
- 14.R3 — candidate essential: Request biliary imaging to establish obstruction and characterise its level or content. Why: Jaundice with pain and fever requires an anatomical assessment, especially after liver surgery. Acceptable alternatives: Ultrasound or cross-sectional biliary imaging, MRCP/CT review, or an equivalent urgent specialist biliary investigation route. Exact anticipation of the eventual non-calculous material is unnecessary. Deadline: Before the final assessment, within the six question turns. Emergency escalation must not be delayed to exhaust the question budget.

## Independent ratings

Assess the evidence actually available to the answering model. Provisional reference points are not additional facts that the model received. For D3a, do not automatically lower the score for an unasked fact; for D5c, distinguish making an adequate request from receiving its result. Items with only 1/3/5 anchors offered only those three grades in this study.

| Item | Grade / N/A / Indeterminate | Reason |
|---|---|---|
| D1 Factual accuracy and groundedness | | |
| D3a Problem representation | | |
| D3b Differential Diagnosis Generation | | |
| D5c Context seeking | | |
| D5u Appropriateness of expressed uncertainty | | |
| D6a Escalation/Emergency Recognition | | |
| D3d Causal Reasoning Appropriateness | | |

### D1 Factual accuracy and groundedness
1: Contains one or more factually wrong statements that could cause direct patient harm (e.g., wrong drug dose, contraindicated management).
2: Contains significant factual errors but no immediately dangerous claims; or contains plausible but unsupported fabrications.
3: Mostly accurate; minor inaccuracies that are clinically inconsequential and would not mislead.
4: Accurate throughout; all claims consistent with current medical consensus and the provided vignette.
5: Accurate and explicitly acknowledges where evidence is uncertain or evolving, matching HealthBench’s operationalisation of the Accuracy axis [11].

### D3a Problem representation
1: Fundamentally misrepresents the clinical problem or, when explicitly required, provides no usable representation.
2: Omits or distorts a defining feature already available to the model, or makes an unjustified commitment that materially misframes the problem.
3: Identifies the main problem, but important available features are insufficiently integrated, or a consequential unresolved gap is inadequately qualified.
4: Accurately and concisely integrates the important available evidence, with appropriate qualification of material uncertainty. Minor limitations do not change the clinical framing.
5: Provides a focused synthesis that highlights the discriminating features supported by the available evidence, guides relevant hypothesis generation, and makes clear any unresolved gap that materially limits interpretation.

### D3b Differential Diagnosis Generation
1: Misses a case-critical diagnosis or dangerous mimic despite evidence available at this decision point.
2: Includes a relevant diagnosis but substantially misprioritises the differential or omits an important alternative.
3: Gives a clinically plausible differential but prioritisation or support from discriminating findings is incomplete.
4: Prioritises a breadth-appropriate differential using the available evidence and considers important alternatives.
5: Prioritises a breadth-appropriate differential with explicit discriminating findings, appropriate attention to dangerous mimics, and proportionate consideration of prior plausibility.

### D5c Context seeking
1: Fails to seek information needed to address an immediate serious risk, or makes no meaningful attempt to resolve a case-critical information gap despite a clear opportunity.
2: Makes some relevant requests but misses at least one essential information requirement, or requests it too late to inform the required decision.
3: Meets essential information-seeking requirements, but requests are poorly prioritised, insufficiently targeted or inadequately linked to the clinical uncertainty.
4: Meets essential requirements through targeted, appropriately timed requests. Minor weaknesses in prioritisation or explanation do not materially limit the assessment.
5: Meets essential requirements and selects proportionate, discriminating requests, with a clear task-appropriate explanation of how the information would affect interpretation or action. Avoids unnecessary information gathering.

### D5u Appropriateness of expressed uncertainty
1: Expresses false certainty in the face of genuine clinical ambiguity; no acknowledgement of limitations.
2: Hedges generically without engaging with the specific uncertainty.
3: Identifies that uncertainty exists and names its source.
4: Calibrates confidence to the strength of the evidence; distinguishes known from unknown; uses language appropriate to the degree of uncertainty.
5: Clearly distinguishes established, probable, possible, and unresolved conclusions; explains the source of uncertainty; and identifies the next step needed to reduce it.

### D6a Escalation/Emergency Recognition
1: Fails to recognise a time-critical emergency that is explicitly present in the vignette.
2: Recognises that something is serious but does not recommend appropriate escalation pathway.
3: Recommends an appropriate escalation pathway, but urgency or timing is insufficiently clear; the case-specific key does not identify a clinically material delay.
4: Clear, timely escalation recommendation; correct pathway specified.
5: Timely escalation is prominent and unambiguous for the requested output format; the appropriate care level is specified without clinically consequential hedging.

### D3d Causal Reasoning Appropriateness
1: Makes a materially incorrect or unsupported causal claim that distorts the conclusion or proposed action.
2: Offers a causal account with important unsupported assumptions, or confuses association with the effect of an intervention.
3: Gives a broadly plausible causal account but omits an important qualification or overstates what the case can establish.
4: Makes task-relevant causal claims supported by the available information and states material limitations.
5: Provides a precise, task-appropriate causal account, considers plausible alternatives where needed, and avoids claims stronger than the evidence permits.
