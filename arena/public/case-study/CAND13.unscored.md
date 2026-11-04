# CAND13 — Recurrent gastrointestinal bleeding four months after liver transplantation

Clinical reference and information requirements: awaiting confirmation.

Source: https://doi.org/10.3389/fmed.2026.1940000

Decision point: First bleeding episode four months after transplantation, after initial and repeat endoscopy but before the first angiogram or embolization. All available replies are records; the patient is not required to narrate an urgent bleeding episode.

Opening: A liver-transplant recipient has recurrent vomiting of blood, dark-red rectal bleeding and right upper abdominal pain four months after transplantation. Bleeding and progressive anaemia have persisted.

Task: Audience: a clinician. Use 180-260 words in English. Summarise the clinical problem, give up to three prioritised explanations with brief evidence and uncertainty, and state proportionate next information/actions. Use only information actually supplied. Do not invent findings, measured values, doses or probabilities. Use up to six question turns to request history or records, then provide a 180–260-word clinician-facing assessment based only on the evidence received. Prioritise immediate bleeding risk, seek operative and bleeding-localisation evidence, and explain which causes require further confirmation. A specific pseudoaneurysm or fistula is not established at this decision point. Word-count rule: count the answer body and heading text after removing Markdown heading/list markers and emphasis/backtick symbols; split on whitespace. Hyphenated expressions count as one word. Exclude JSON only if the task explicitly excludes it. No extra tolerance is added to the stated word range.

## Actual questions and replies

### Question 1
What were the findings of the initial and repeat endoscopies, and what was the operative course at transplantation (donor type, any intraoperative complications, biliary anastomosis type)?

Saved assessment note: Endoscopy results will clarify whether a mucosal source was identified or excluded, and operative details are essential to assess for vascular or biliary complications that could explain the right upper abdominal pain and persistent bleeding.

Returned 13.endoscopic_localisation (record, presentation): Initial upper endoscopy found a duodenal bulb ulcer without observed active bleeding; no endoscopic haemostasis was performed. Continued bleeding prompted repeat endoscopy: removing a clot at the major duodenal papilla revealed fresh blood oozing from the papillary orifice.

Returned 13.transplant_and_prior_bleeding (record, presentation): Orthotopic deceased-donor liver transplantation was performed in 2024 for end-stage alcohol-related cirrhosis. Before transplantation he had repeated decompensation and plasma exchange; oesophagogastric variceal bleeding was treated endoscopically in 2023.

Environment feedback: The initial/repeat endoscopic findings answer the first request; donor type/transplant history is the next responsive stored group. The biliary anastomosis and arterial reconstruction in 13.operative_anatomy are available but deferred solely because the two-group cap is reached. Specific intraoperative complications are not supplied in the permitted initial operative summary; do not convert that documentation gap into an assertion that none occurred. No DSA, later operation or outcome is requested or released.

### Question 2
What were the operative anatomy details at transplantation (biliary anastomosis type, arterial reconstruction), and has any imaging (ultrasound, CT) been performed since the bleeding began that might show a vascular or biliary abnormality?

Saved assessment note: The papillary oozing localises bleeding to the biliary tree, raising haemobilia from a vascular-biliary communication. Operative anatomy and any available imaging are needed to assess for pseudoaneurysm or fistula before angiography.

Returned 13.operative_anatomy (record, presentation): The donor right hepatic artery arose from the superior mesenteric artery. Reconstruction joined donor common hepatic artery to recipient right hepatic artery and donor right hepatic artery to recipient gastroduodenal artery. The portal vein and common bile duct had end-to-end reconstruction.

Environment feedback: The operative-anatomy group directly answers biliary and arterial reconstruction. Imaging during the current bleeding episode before the frozen first angiogram is not supplied in the permitted packet; this does not establish that ultrasound/CT was not performed. 13.surveillance describes earlier post-transplant surveillance and must not be presented as imaging since bleeding began. Later DSA, post-embolization CTA and later readmission ultrasound are outside this decision point. No other directly responsive available group is deferred by the cap.

### Question 3
Have there been any post-transplant biliary complications (bile leak, stricture, cholangitis) in the four months since transplantation, and what are the current laboratory values for haemoglobin, coagulation profile, and liver function tests?

Saved assessment note: The papillary oozing localises bleeding to the biliary tree, raising concern for haemobilia or a biliary-arterial fistula at the hepatic artery anastomosis. Post-transplant biliary complications would support a fistula mechanism, and current labs are needed to gauge severity and exclude coagulopathy as a contributing factor.

Returned 13.early_postoperative_course (record, presentation): On postoperative days 6–8 he had fever and Enterococcus faecium bacteraemia, with positive SARS-CoV-2 testing. Fever resolved by day 9 after treatment. Imaging showed fluid collections without definite bile leakage or a localised infectious focus; bile culture was negative.

Returned 13.current_severity_limit (record, presentation): Progressive anaemia during persistent bleeding is documented. A numerical blood pressure, pulse, coagulation panel and time-stamped haemoglobin specifically before the first angiogram are not supplied in this packet. Current severity measurements must be obtained rather than assumed normal.

Environment feedback: Return the documented early post-transplant complication/infection record, then the current pre-angiography severity-data limit. No definite bile leak was identified during the early episode, but the packet does not establish an entirely complication-free four months or separately exclude every stricture/cholangitis episode. Current numerical haemoglobin, coagulation and liver-function results at the frozen first-bleeding review are not supplied. Do not substitute the first-embolization haemoglobin or later postoperative liver/coagulation results. These are documentation limits, not tests established as unperformed. No directly responsive group is deferred by the cap.

### Question 4
Were any biliary interventions (ERCP, stent placement, sphincterotomy) performed in the four months since transplantation, and is there any documentation of the timing and sequence of the bleeding episodes relative to any procedures?

Saved assessment note: Biliary instrumentation is a key risk factor for haemobilia and would help distinguish iatrogenic from spontaneous vascular causes. Timing relative to procedures clarifies mechanism.

Returned 13.bleeding_course (record, presentation): The patient is a 23-year-old man. Repeated bright-red haematemesis, about 50 mL per episode, was followed by dark-red haematochezia. Dull right upper quadrant pain, regurgitation, fatigue, dizziness, blurred vision and sweating accompanied the bleeding.

Returned 13.endoscopic_localisation (record, presentation): Initial upper endoscopy found a duodenal bulb ulcer without observed active bleeding; no endoscopic haemostasis was performed. Continued bleeding prompted repeat endoscopy: removing a clot at the major duodenal papilla revealed fresh blood oozing from the papillary orifice.

Environment feedback: Prior ERCP, biliary stent placement or sphincterotomy in the interval before the first bleeding episode is not documented in the permitted packet; do not assert that none occurred. Return the documented first bleeding course, followed by the sequence of initial and repeat upper endoscopies. The bleeding preceded those endoscopies and continued after the first evaluation. Do not import later angiography/embolization, subsequent recurrent episodes or the later biliary-enteric reconstruction into this initial-review chronology. No further directly responsive permitted group is deferred by the cap. Previously returned fact groups: 13.endoscopic_localisation.

### Question 5
Is there operative or imaging documentation describing the spatial relationship between the donor right hepatic artery–recipient gastroduodenal artery anastomosis and the common bile duct anastomosis? Also, what is the patient's current anticoagulation or antiplatelet therapy status?

Saved assessment note: The papillary oozing pattern suggests haemobilia; knowing whether the arterial reconstruction lies adjacent to the biliary anastomosis is critical for assessing pseudoaneurysm or fistula risk. Anticoagulation status directly affects immediate bleeding management and procedural planning.

Returned 13.operative_anatomy (record, presentation): The donor right hepatic artery arose from the superior mesenteric artery. Reconstruction joined donor common hepatic artery to recipient right hepatic artery and donor right hepatic artery to recipient gastroduodenal artery. The portal vein and common bile duct had end-to-end reconstruction.

Returned 13.medication_record (record, presentation): Initial post-transplant immunosuppression comprised tacrolimus, enteric-coated mycophenolate sodium and corticosteroids, later adjusted. No antiplatelet or systemic anticoagulant treatment was documented in the immediate postoperative period; this does not establish the current medication list.

Environment feedback: Return the documented reconstructed connections first, then the medication-record limitation. The precise spatial relationship/distance between the arterial and bile-duct anastomoses is not supplied by the permitted operative/imaging record; the connection list is not a spatial measurement. Do not import the later lesion position or assume the fistula was at either anastomosis. No antiplatelet/systemic anticoagulant was documented in the immediate postoperative period, but current use at the bleeding presentation remains unknown. Do not turn an earlier documentation statement into current absence. No directly responsive group is deferred by the cap. Previously returned fact groups: 13.operative_anatomy.

### Question 6
What is the patient's current immunosuppression regimen, and are there any signs of active infection (fever, elevated white cell count, positive cultures) during the current bleeding episode?

Saved assessment note: Infection can compromise anastomotic integrity and worsen bleeding; the early post-op bacteraemia makes this relevant. Current immunosuppression also informs procedural risk if urgent intervention is needed.

Environment feedback: The current immunosuppression regimen and current-bleeding-episode temperature, white-cell count and cultures are not supplied. Earlier immediate-postoperative medicines were already returned as historical context and must not be treated as the current regimen. Earlier postoperative infection is a different episode; no current negative infection findings can be inferred.

## Final answer, unchanged

## Assessment

This 23-year-old man presents four months after deceased-donor liver transplantation with persistent upper gastrointestinal bleeding: recurrent haematemesis (~50 mL), dark-red haematochezia, right upper quadrant pain, and progressive anaemia. Repeat endoscopy localised active bleeding to the major duodenal papilla, with fresh blood oozing from the papillary orifice after clot removal. The initial endoscopy identified a duodenal bulb ulcer without active bleeding.

**Prioritised explanations:**

1. **Hepatic artery-biliary fistula (haemobilia).** The papillary localisation combined with the reconstructed arterial anatomy (donor right hepatic artery anastomosed to the recipient gastroduodenal artery, in proximity to the end-to-end common bile duct anastomosis) makes a vascular-biliary communication the leading hypothesis. This has not been confirmed; no angiogram or cross-sectional imaging has yet been performed.

2. **Duodenal bulb ulcer.** Documented on initial endoscopy but without observed active bleeding; less likely as the primary source given the papillary localisation on repeat examination, though it may contribute.

3. **Late biliary anastomotic complication with secondary vascular erosion.** Early post-operative fluid collections and bacteraemia raise the possibility of a subclinical anastomotic problem, though no definite bile leak was identified early. This remains unconfirmed.

**Uncertainties:** Current haemoglobin, coagulation, liver function, vital signs, infection status, and anticoagulation/antiplatelet use are not documented. No biliary interventions are recorded in the interval, but absence of documentation does not exclude them.

**Proportionate next actions:** Urgent hepatic angiography to confirm or exclude a vascular source and permit embolisation; obtain current haemoglobin, coagulation profile, liver function tests, and vital signs; review current medications; assess for active infection.

## Provisional reference

This is recurrent overt gastrointestinal bleeding with progressive anaemia in a recent liver-transplant recipient. Dizziness, sweating and ongoing blood loss require immediate senior assessment, haemodynamic monitoring and preparation for haemorrhage management; the absence of supplied vital signs must not imply stability. Obtain current blood count, coagulation studies, crossmatch and relevant renal and graft tests while engaging gastroenterology and the transplant team.

The initial differential includes recurrent portal-hypertensive bleeding, peptic ulcer bleeding and a hepatobiliary or transplant vascular source. Prior varices create a plausible competing explanation, but neither history nor an ulcer alone localises the current bleeding. If the repeat endoscopic record is received, fresh blood from the major papilla strongly supports haemobilia and should prompt urgent vascular localisation with interventional radiology and transplant surgery. The exact lesion and arterial-biliary communication remain unconfirmed before angiography.

Review the reconstruction, immunosuppression and postoperative infectious history. Earlier patent Doppler flow does not exclude a subsequently developing vascular lesion. Past bacteraemia raises a question about infection without proving an infected pseudoaneurysm. Further diagnostic and haemostatic decisions must account for graft arterial perfusion. Do not use later embolization, surgical findings, pathology, deterioration or death to justify the initial conclusion. The later death mechanism was never definitively established; it is not a required diagnostic target.

## Candidate information requirements

- 13.R1 — candidate essential: Seek current bleeding severity and a resuscitation assessment, including haemodynamics and haemoglobin/coagulation status. Why: Persistent overt bleeding with dizziness and progressive anaemia presents an immediate threat independently of its eventual cause. Acceptable alternatives: Current observations plus blood count/coagulation/crossmatch, or an explicit urgent haemorrhage-team assessment obtaining equivalent data. A request for unsupplied values receives credit; it need not produce a number. Deadline: Before the final assessment, within the six question turns. Emergency escalation must not be delayed to exhaust the question budget.
- 13.R2 — candidate essential: Seek the transplant operation, previous bleeding and relevant postoperative/medication history. Why: Recent transplantation and prior variceal bleeding change both plausible sources and procedural risk. Acceptable alternatives: Operative/transplant summary plus a focused previous bleeding/complication or antithrombotic/immunosuppressant review. Exact anastomotic terminology and a guessed rare lesion are unnecessary. Deadline: Before the final assessment, within the six question turns. Emergency escalation must not be delayed to exhaust the question budget.
- 13.R3 — candidate essential: Request the endoscopic bleeding-source findings and an appropriate further localisation route if those findings are insufficient. Why: Recurrent bleeding despite a presumed ulcer source requires checking that the lesion actually explains the bleeding. Acceptable alternatives: Review initial/repeat endoscopy and seek transplant vascular/angiographic assessment when indicated; CTA/DSA or urgent specialist localisation are acceptable. Withheld definitive angiography does not turn an adequate request into failure. Deadline: Before the final assessment, within the six question turns. Emergency escalation must not be delayed to exhaust the question budget.

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
| D4c Chronological precision | | |

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

### D4c Chronological precision
1: Events presented out of sequence
3: Minor sequencing errors
5: Correct chronology with explicit temporal anchors (e.g., “on Day 3 of admission…” ) [13]
