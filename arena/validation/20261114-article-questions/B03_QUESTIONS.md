# B03: seven source-linked question drafts

Clinical references: **awaiting confirmation**. Automatic source associations: **awaiting review**. These are adapted questions for one patient, not seven independent cases.

[Original paper](https://casereports.bmj.com/content/19/10/e275970). Parent code: `CASE-ECFDA9DAB9`. Original extraction, first question set and revised set are retained.

## Q01 — Combination antihypertensive ingredients

**Task type:** clinical interpretation. **Reference basis:** reported.

**Decision point (reviewer only):** Component-level medication review of brand-name combination products during a chronic diarrhoea work-up

**Model-visible context:** The patient was evaluated for 14 months of watery, non-bloody diarrhoea (up to 10 times daily), abdominal cramping, fatigue, profound anorexia and 32% weight loss, across multiple encounters.

**Model-visible source facts:**

- `F001`: A woman in her late 70s with hypertension, hyperlipidaemia and primary hyperparathyroidism status post partial parathyroidectomy presented with 14 months of watery, non-bloody diarrhoea (up to 10 times daily, including nocturnal episodes), abdominal cramping, fatigue and profound anorexia, with a weight of 56.1 kg representing a 32% loss from her baseline of 82.6 kg.
- `F002`: Her antihypertensive regimen was amlodipine/olmesartan (Azor), transitioned from amlodipine/olmesartan/hydrochlorothiazide (Tribenzor) when hydrochlorothiazide was discontinued for hypercalcaemia management approximately 14 months before admission; she had been taking a combination antihypertensive for approximately 3 years.

**Question:** A woman in her late 70s with chronic watery diarrhoea and 32% weight loss has taken a combination antihypertensive for approximately 3 years. Her regimen was amlodipine/olmesartan (Azor), transitioned from amlodipine/olmesartan/hydrochlorothiazide (Tribenzor) when hydrochlorothiazide was discontinued approximately 14 months before admission. List the active ingredients contained in each of these brand-name products, and explain why documentation by brand name rather than by ingredient could hinder recognition of a shared drug exposure across encounters.

**Draft reference answer — awaiting confirmation:** Azor contains amlodipine and olmesartan; Tribenzor contains amlodipine, olmesartan and hydrochlorothiazide. Both products contain olmesartan, so the patient's olmesartan exposure persisted across the regimen change even though the documentation changed brand names. Because the record shows different brand names at different times, a clinician reviewing the medication list by brand may not appreciate that the same active ingredient (olmesartan) was continued throughout, reducing continuity in recognising the shared exposure across encounters. A defensible provisional step is to review every component of combination products by ingredient name. [Reviewer-only later confirmation: the authors report that olmesartan was formally discontinued and the patient counselled that olmesartan appears under Benicar, Benicar HCT, Azor and Tribenzor, and that brand-name documentation reduced continuity in recognising the shared exposure.]

**Hidden material:** All source facts outside this question’s visible list remain excluded from its answering input.

**Reference source passages:**

- `F002` — Case presentation, block p-7, characters 3309–3635: Her antihypertensive regimen was amlodipine/olmesartan (Azor), transitioned from amlodipine/olmesartan/hydrochlorothiazide (Tribenzor) when hydrochlorothiazide was discontinued for hypercalcaemia management approximately 14 months before admission; she had been taking a combination antihypertensive for approximately 3 years.
- `F053` — Treatment, block p-26, characters 12858–13022: She was transitioned to amlodipine monotherapy and counselled that olmesartan appears under multiple brand names including Benicar, Benicar HCT, Azor and Tribenzor.
- `F065` — Discussion, block p-29, characters 14736–14890: Both products contained olmesartan, but documentation under different brand names reduced continuity in recognising the shared exposure across encounters.
- `F084` — Learning points, block p-41, characters 20376–20574: Olmesartan can cause a sprue-like enteropathy severe enough to produce life-threatening malnutrition and may be overlooked when included in a fixed-dose combination product documented by brand name.

**Boundary to review:** The question withholds the final diagnosis and the retrospective author explanation; the reference answer's provisional interpretation is drawn from visible facts, with later confirmation (F053, F065, F084) labelled as reviewer-only.

## Q02 — Unexplained admission-improvement pattern

**Task type:** clinical interpretation. **Reference basis:** proposed information request.

**Decision point (reviewer only):** Recognising and investigating a reproducible admission-improvement/discharge-worsening pattern when inpatient medication exposure is unknown

**Model-visible context:** The pattern is a retrospective observation, not a contemporaneous clinical note, and should be treated as a hypothesis-generating clue rather than established evidence.

**Model-visible source facts:**

- `F004`: Over 14 months, the patient was evaluated by her primary care provider, hospitalists and gastroenterologists across 6 encounters.
- `F012`: During two hospitalisations at our institution (approximately 2 months before admission, encounter 4 and 1 month before admission, encounter 5), gastroenterology was consulted on both occasions.
- `FF4E6A98D37`: She had consistently felt better during each admission and worse after discharge

**Question:** A patient with 14 months of chronic diarrhoea was hospitalised twice at your institution (approximately 2 months and 1 month before the current admission), with gastroenterology consultation on both occasions. It was recognised only in retrospect, after the current admission, that she had consistently felt better during each admission and worse after discharge; this pattern was not prospectively recorded or acted on at the time. Inpatient medication administration records from those admissions are not available to you. What information would you seek, and what kinds of explanations could account for a patient reliably improving in hospital and deteriorating again shortly after discharge? Outline a practical approach to investigating this pattern.

**Draft reference answer — awaiting confirmation:** A defensible approach: (1) obtain the inpatient medication administration records and discharge prescriptions for both admissions and compare them with the outpatient regimen, looking for any drug withheld in hospital and resumed at discharge; (2) review diet, fluid/electrolyte management and activity differences between settings; (3) consider natural fluctuation of the underlying illness, hospital-based supportive care, and any empiric therapies started during admission. Multiple explanations are possible, including setting-related supportive care and disease fluctuation, so no single cause should be assumed. If a medication is found to have been withheld in hospital for independent reasons and resumed on discharge, the pattern would constitute an unintentional dechallenge-rechallenge, which is a recognised clue to an adverse drug reaction and would justify a structured adverse drug reaction review of the complete medication list. [Reviewer-only later confirmation: in this case olmesartan was not administered during either admission because of formulary unavailability and normotension and was resumed on discharge, and the authors interpreted the pattern as two unintentional rechallenges supporting the diagnosis.]

**Hidden material:** All source facts outside this question’s visible list remain excluded from its answering input.

**Reference source passages:**

- `F013` — Case presentation, block p-11, characters 5184–5326: Olmesartan was not administered during either admission because of formulary unavailability and normotension, and it was resumed on discharge.
- `F015` — Case presentation, block p-11, characters 5400–5524: She had consistently felt better during each admission and worse after discharge, reflecting two unintentional rechallenges.
- `F067` — Discussion, block p-33, characters 16376–16639: The hospitalisation pattern provided additional evidence: olmesartan was not administered for independent reasons, with symptomatic improvement followed by recurrence after discharge and readministration, constituting an unintentional dechallenge and rechallenge.
- `F088` — Learning points, block p-44, characters 21014–21197: Improvement during hospitalisation when a drug is not administered, followed by recurrence after discharge, is an unintentional rechallenge and can be the first clue to the diagnosis.

**Boundary to review:** Intentionally masked task: the admission-improvement/discharge-worsening pattern is shown without its causal interpretation, and all inpatient medication exposure (F013) is withheld from the model. The question does not name medication as the only possible cause; the hidden explanation is disclosed only in the reviewer-only portion of the reference.

## Q03 — Interpreting negative coeliac serologies

**Task type:** clinical interpretation. **Reference basis:** synthesis.

**Decision point (reviewer only):** Weighting of two negative coeliac panels with different gluten-exposure timing

**Model-visible context:** Encounter 2 occurred 13 months before the index admission; the gluten-free diet was started at encounter 2 and continued through encounters 3 and 4.

**Model-visible source facts:**

- `F006`: At an outside hospital admission 13 months before the index admission (encounter 2), while she was consuming an unrestricted gluten-containing diet, a coeliac panel was negative and duodenal biopsy demonstrated villous blunting with a sprue-like pattern.
- `F009`: She was empirically started on a gluten-free diet.
- `F011`: During outpatient gastroenterology evaluation at a second outside institution approximately 9 to 11 months before admission (encounter 3), rifaximin given for a positive small intestinal bacterial overgrowth breath test provided no benefit, and an empiric gluten-free diet was similarly ineffective.
- `F027`: Coeliac serologies (tissue transglutaminase IgA, tissue transglutaminase IgG and deamidated gliadin peptide IgG) were negative, and total IgA was 642 mg/dL, excluding IgA deficiency.

**Question:** A patient with 14 months of chronic diarrhoea and severe malabsorption has had two negative coeliac serology panels. Panel 1 (encounter 2, 13 months before the index admission) was obtained while she was consuming an unrestricted gluten-containing diet; an empiric gluten-free diet was started at that encounter and was later reported ineffective during outpatient evaluation (encounter 3). Panel 2 (tissue transglutaminase IgA and IgG, deamidated gliadin peptide IgG) was obtained at encounter 4; total IgA was 642 mg/dL, excluding IgA deficiency. How should each panel be interpreted in light of its dietary timing, and can coeliac disease be excluded on this evidence alone?

**Draft reference answer — awaiting confirmation:** Panel 1 is the more informative result: it was obtained while the patient was on an unrestricted gluten-containing diet, so a negative panel (with normal total IgA) provides meaningful evidence against coeliac disease, though an outside-institution result and seronegative coeliac disease remain caveats. Panel 2 was obtained at encounter 4, by which time the patient had been following a gluten-free diet for several months (started at encounter 2 and still followed during encounter 3); a negative result on a gluten-free diet cannot by itself exclude coeliac disease because serologies may normalise with gluten avoidance. On the visible evidence, coeliac disease is unlikely but not definitively excluded by serology alone; the failure to respond to an empiric gluten-free diet provides additional, though not conclusive, evidence against it. [Reviewer-only later confirmation: the authors excluded coeliac disease on the basis of the encounter 2 panel obtained on a gluten-containing diet, failure to respond to an adequate gluten-free diet trial, and later complete symptom resolution after drug withdrawal while consuming gluten.]

**Hidden material:** All source facts outside this question’s visible list remain excluded from its answering input.

**Reference source passages:**

- `F028` — Investigations, block p-14, characters 7092–7314: Notably, the coeliac serologies were obtained at encounter 4, by which time the patient had been following a gluten-free diet for several months, so a negative result at that point cannot by itself exclude coeliac disease.
- `F029` — Investigations, block p-14, characters 7315–7479: The earlier panel obtained at encounter 2, while she was consuming an unrestricted gluten-containing diet, was also negative and obtained at an outside institution.
- `F045` — Differential diagnosis, block p-25, characters 10865–11280: Coeliac disease was excluded on the basis of a negative coeliac serology panel obtained at encounter 2 while the patient was consuming an unrestricted gluten-containing diet, failure to respond to an adequate trial of a gluten-free diet, which she had abandoned before the index admission and complete resolution of symptoms after drug withdrawal alone while she was consuming gluten (from index admission onwards).

**Boundary to review:** The dietary-timing interpretation of the encounter 4 panel (F028) and the formal exclusion rationale (F045) are withheld from the model; the model must synthesise timing from F006, F009, F011 and F027. Later confirmation is reviewer-only.

## Q04 — Normal endoscopy in malabsorptive disease

**Task type:** clinical interpretation. **Reference basis:** reported.

**Decision point (reviewer only):** Whether to biopsy a macroscopically normal small bowel and colon in suspected malabsorption

**Model-visible context:** Admission investigations showed severe hypoalbuminaemia (2.3 g/dL), hypokalaemia, hypomagnesaemia, hypophosphataemia, hypocalcaemia, hyponatraemia, and vitamin D, A, K and zinc deficiencies, consistent with high-output diarrhoea and malabsorption.

**Model-visible source facts:**

- `F023`: Admission investigations demonstrated severe hypoalbuminaemia (2.3 g/dL), total protein 5.1 g/dL, hypokalaemia (2.8 mEq/L), hypomagnesaemia (0.7 mg/dL), hypophosphataemia (1.9 mg/dL), hypocalcaemia (ionised calcium 0.71 mmol/L) and hyponatraemia (133 mEq/L), consistent with high-output diarrhoea and malabsorption.
- `F025`: Fat-soluble vitamin deficiencies included vitamin D (11 ng/mL), vitamin A (<5 µg/dL) and vitamin K (<50 pg/mL); zinc was low.
- `F033`: Push enteroscopy and colonoscopy were performed on hospital day 2.
- `F6EC783722F`: Endoscopic inspection was macroscopically normal throughout

**Question:** A patient with 14 months of high-output diarrhoea, severe hypoalbuminaemia and multiple electrolyte and fat-soluble vitamin deficiencies undergoes push enteroscopy and colonoscopy on hospital day 2. Endoscopic inspection is macroscopically normal throughout. What is the appropriate next step, and what is the rationale?

**Draft reference answer — awaiting confirmation:** Normal macroscopic appearance does not exclude mucosal disease, particularly in malabsorptive syndromes where the mucosa can appear endoscopically normal while harbouring diagnostic histology. The appropriate next step is to take biopsies from the small bowel and from multiple colonic segments despite the normal appearance, because conditions such as microscopic (collagenous or lymphocytic) colitis and various sprue-like enteropathies are diagnosed histologically. [Reviewer-only later confirmation: in this case, biopsies from the ascending, descending and sigmoid colon showed normal colonic mucosa, excluding collagenous and lymphocytic colitis, while small bowel biopsies demonstrated a malabsorptive pattern of injury despite the normal endoscopic appearance.]

**Hidden material:** All source facts outside this question’s visible list remain excluded from its answering input.

**Reference source passages:**

- `F035` — Investigations, block p-18, characters 8220–8393: The colonoscopy reached the cecum, and biopsies from the ascending, descending and sigmoid colon showed normal colonic mucosa, excluding collagenous and lymphocytic colitis.
- `F036` — Investigations, block p-19, characters 8395–8533: Histopathology demonstrated a malabsorptive pattern confined to the small bowel, consistent with medication-associated small bowel injury.
- `F073` — Discussion, block p-34, characters 17890–17955: Both push enteroscopy and colonoscopy were macroscopically normal
- `F074` — Discussion, block p-34, characters 17957–18001: yet biopsies demonstrated small bowel injury
- `F087` — Learning points, block p-43, characters 20911–21012: If endoscopy is performed, take small bowel and colonic biopsies even when the mucosa appears normal.

**Boundary to review:** The pathology results (F035, F036) are withheld from the question; the reference gives the defensible provisional answer from visible evidence, with the actual biopsy findings labelled as reviewer-only confirmation.

## Q05 — Pathology report interpretation

**Task type:** report comprehension. **Reference basis:** reported.

**Decision point (reviewer only):** Interpretation of the small bowel and colonic pathology in the diagnostic reasoning

**Model-visible context:** This is a report-comprehension task: the pathology findings are disclosed and the model is asked to interpret them.

**Model-visible source facts:**

- `F033`: Push enteroscopy and colonoscopy were performed on hospital day 2.
- `F6EC783722F`: Endoscopic inspection was macroscopically normal throughout
- `F035`: The colonoscopy reached the cecum, and biopsies from the ascending, descending and sigmoid colon showed normal colonic mucosa, excluding collagenous and lymphocytic colitis.
- `F036`: Histopathology demonstrated a malabsorptive pattern confined to the small bowel, consistent with medication-associated small bowel injury.
- `F037`: The jejunum and duodenum showed villous attenuation, mildly increased intraepithelial lymphocytes, an irregular subepithelial collagen table and paucity of goblet and Paneth cells; the duodenum additionally showed focal acute inflammation.
- `F038`: The stomach demonstrated a reactive chemical gastritis pattern, which can be associated with bile reflux.
- `F039`: No recent non-steroidal anti-inflammatory drug exposure was reported, and Helicobacter pylori was negative.
- `F040`: Periodic acid-Schiff and Congo red stains and Tropheryma whipplei immunohistochemistry were negative.

**Question:** The following histopathology findings are reported for this patient's endoscopic biopsies (obtained on hospital day 2, when endoscopic inspection was macroscopically normal): the jejunum and duodenum showed villous attenuation, mildly increased intraepithelial lymphocytes, an irregular subepithelial collagen table and paucity of goblet and Paneth cells, with focal acute inflammation in the duodenum; the stomach showed a reactive chemical gastritis pattern, which can be associated with bile reflux; no recent non-steroidal anti-inflammatory drug exposure was reported and Helicobacter pylori was negative; periodic acid-Schiff and Congo red stains and Tropheryma whipplei immunohistochemistry were negative. The overall pattern was reported as a malabsorptive pattern confined to the small bowel, consistent with medication-associated small bowel injury. Summarise and interpret this pathology report: what diagnoses are supported, weakened or excluded by these findings?

**Draft reference answer — awaiting confirmation:** The report shows a malabsorptive small bowel injury pattern: villous attenuation with mildly increased intraepithelial lymphocytes is compatible with a sprue-like pattern; the irregular subepithelial collagen table raises the possibility of evolving collagenous sprue; the paucity of goblet and Paneth cells raises the possibility of autoimmune enteropathy, though in this case the loss was patchy rather than diffuse, which the authors later used to argue against autoimmune enteropathy. Normal colonic biopsies from three segments exclude collagenous and lymphocytic colitis despite the normal colonoscopy. Negative PAS and Congo red stains and negative Tropheryma whipplei immunohistochemistry exclude Whipple disease and amyloidosis-related causes; negative H. pylori and no NSAID exposure contextualise the reactive gastritis. The overall reported interpretation is a medication-associated small bowel injury confined to the small bowel. These findings remain a draft interpretation awaiting confirmation against the full clinical course.

**Hidden material:** All source facts outside this question’s visible list remain excluded from its answering input.

**Reference source passages:**

- `F035` — Investigations, block p-18, characters 8220–8393: The colonoscopy reached the cecum, and biopsies from the ascending, descending and sigmoid colon showed normal colonic mucosa, excluding collagenous and lymphocytic colitis.
- `F036` — Investigations, block p-19, characters 8395–8533: Histopathology demonstrated a malabsorptive pattern confined to the small bowel, consistent with medication-associated small bowel injury.
- `F037` — Investigations, block p-19, characters 8537–8776: The jejunum and duodenum showed villous attenuation, mildly increased intraepithelial lymphocytes, an irregular subepithelial collagen table and paucity of goblet and Paneth cells; the duodenum additionally showed focal acute inflammation.
- `F038` — Investigations, block p-19, characters 8777–8882: The stomach demonstrated a reactive chemical gastritis pattern, which can be associated with bile reflux.
- `F039` — Investigations, block p-19, characters 8883–8990: No recent non-steroidal anti-inflammatory drug exposure was reported, and Helicobacter pylori was negative.
- `F040` — Investigations, block p-19, characters 8991–9092: Periodic acid-Schiff and Congo red stains and Tropheryma whipplei immunohistochemistry were negative.
- `F046` — Differential diagnosis, block p-25, characters 11679–11849: Microscopic colitis, both collagenous and lymphocytic, was excluded by normal biopsies from three colonic segments, obtained despite a macroscopically normal colonoscopy.
- `F047` — Differential diagnosis, block p-25, characters 11850–11961: Infectious aetiologies including Tropheryma whipplei were excluded by negative stains and immunohistochemistry.
- `F048` — Differential diagnosis, block p-25, characters 11962–12190: Autoimmune enteropathy was considered unlikely because goblet and Paneth cell loss was patchy rather than diffuse, there was no hypogammaglobulinaemia, and symptoms resolved after olmesartan withdrawal without immunosuppression.
- `F070` — Discussion, block p-34, characters 17326–17460: The irregular subepithelial collagen table points towards evolving collagenous sprue, a variant present in roughly one-third of cases.
- `F071` — Discussion, block p-34, characters 17469–17557: The paucity of goblet and Paneth cells raised the possibility of autoimmune enteropathy.

**Boundary to review:** Report-comprehension task: later pathology results are deliberately disclosed as visible report passages; the reference may additionally draw on the authors' differential-diagnosis reasoning (F046, F047, F048, F070, F071), which is not required to be visible for this task type.

## Q06 — Transient budesonide response

**Task type:** clinical interpretation. **Reference basis:** proposed information request.

**Decision point (reviewer only):** Interpreting a transient response to empiric budesonide without knowledge of concurrent medication exposure changes

**Model-visible context:** The improvement began during the admission and the recurrence followed discharge; no inpatient medication administration data are available to you.

**Model-visible source facts:**

- `F016`: During encounter 5, empiric budesonide 9 mg daily was initiated for presumed small bowel disease.
- `F017`: Symptoms improved for approximately 2 weeks before recurring, leading to the index admission.

**Question:** A patient with chronic small-bowel-suspected disease was started on empiric budesonide 9 mg daily during a hospital admission (encounter 5). Her symptoms improved for approximately 2 weeks but then recurred, leading to the current admission. You do not have access to records of what other medications were administered or withheld during that admission or after discharge. What can and cannot be concluded from this transient improvement about budesonide's efficacy and the cause of her disease, and what specific evidence would you need to interpret the response correctly?

**Draft reference answer — awaiting confirmation:** A transient improvement of about 2 weeks followed by recurrence does not establish that budesonide was effective or identify the cause of the disease. Without knowing what other exposures changed during the admission and after discharge, the improvement could reflect a natural fluctuation, hospital-based supportive care, or the effect of another intervention or withheld exposure; the timing (improvement beginning during the admission, recurrence after discharge) means any inpatient change is a candidate explanation. To interpret the response, one would need the inpatient medication administration record and discharge prescriptions for encounter 5, to determine whether any drug was withheld in hospital and resumed at discharge, and whether budesonide was continued after discharge. If another exposure was concurrently withdrawn and later resumed, the apparent budesonide response would be confounded. [Reviewer-only later confirmation: the authors state the apparent budesonide response was likely confounded by concurrent olmesartan withdrawal, since olmesartan was not administered during the admission and was resumed on discharge.]

**Hidden material:** All source facts outside this question’s visible list remain excluded from its answering input.

**Reference source passages:**

- `F013` — Case presentation, block p-11, characters 5184–5326: Olmesartan was not administered during either admission because of formulary unavailability and normotension, and it was resumed on discharge.
- `F066` — Discussion, block p-33, characters 16644–16785: The apparent budesonide response during encounter 5 began during the admission and was likely confounded by concurrent olmesartan withdrawal.
- `F067` — Discussion, block p-33, characters 16376–16639: The hospitalisation pattern provided additional evidence: olmesartan was not administered for independent reasons, with symptomatic improvement followed by recurrence after discharge and readministration, constituting an unintentional dechallenge and rechallenge.

**Boundary to review:** Intentionally masked task: the concurrent olmesartan withdrawal (F013) and the authors' confounding explanation (F066, F067) are withheld; the question does not require or reveal the hidden explanation, which appears only in the reviewer-only portion of the reference.

## Q07 — Reported outcome and follow-up

**Task type:** report comprehension. **Reference basis:** reported.

**Decision point (reviewer only):** Comprehension of the reported treatment, dechallenge outcome and follow-up passages

**Model-visible context:** This is a report-comprehension task: the outcome and follow-up passages are disclosed verbatim in the question.

**Model-visible source facts:**

- `F051`: At the index admission, olmesartan was again not administered because of normotension and formulary unavailability.
- `F052`: Once olmesartan was suspected as the cause, the primary team instructed the patient to continue avoiding it as an outpatient.
- `F053`: She was transitioned to amlodipine monotherapy and counselled that olmesartan appears under multiple brand names including Benicar, Benicar HCT, Azor and Tribenzor.
- `F057`: Biopsy results returned approximately 1 week after discharge and were consistent with olmesartan-associated enteropathy, at which point olmesartan was formally and permanently discontinued.
- `F058`: Within approximately 2 weeks of stopping olmesartan, the patient reported marked improvement in diarrhoea and appetite.
- `F059`: At 2-month cardiology follow-up, she had gained 4.8 kg from her nadir (56.1 to 60.9 kg, BMI 23.8), with complete symptom resolution and the adverse event was formally documented.
- `F060`: A prescheduled capsule endoscopy was cancelled by the patient after her symptoms resolved.

**Question:** The following outcome passages are reported for this patient after the index admission: olmesartan was again not administered during the index admission because of normotension and formulary unavailability; once olmesartan was suspected as the cause, the primary team instructed the patient to continue avoiding it as an outpatient, and she was transitioned to amlodipine monotherapy and counselled that olmesartan appears under multiple brand names including Benicar, Benicar HCT, Azor and Tribenzor; biopsy results returned approximately 1 week after discharge and were consistent with olmesartan-associated enteropathy, at which point olmesartan was formally and permanently discontinued; within approximately 2 weeks of stopping olmesartan, the patient reported marked improvement in diarrhoea and appetite; at 2-month cardiology follow-up she had gained 4.8 kg from her nadir (56.1 to 60.9 kg, BMI 23.8) with complete symptom resolution, and the adverse event was formally documented; a prescheduled capsule endoscopy was cancelled by the patient after her symptoms resolved. Summarise the reported clinical course and outcome, and state what the report supports about the relationship between olmesartan discontinuation and recovery.

**Draft reference answer — awaiting confirmation:** The report describes: olmesartan was withheld during the index admission for independent reasons (normotension, formulary unavailability); after biopsy results returned approximately 1 week post-discharge and were consistent with olmesartan-associated enteropathy, olmesartan was formally and permanently discontinued and the patient was transitioned to amlodipine monotherapy with counselling about the multiple brand names containing olmesartan. Within approximately 2 weeks of stopping olmesartan she reported marked improvement in diarrhoea and appetite; at 2-month follow-up she had gained 4.8 kg (56.1 to 60.9 kg, BMI 23.8) with complete symptom resolution, the adverse event was formally documented, and a prescheduled capsule endoscopy was cancelled after symptom resolution. The report supports a temporal association between olmesartan discontinuation and recovery, with the authors additionally noting that recovery without enteral or parenteral support was consistent with prior reports of rapid improvement after drug withdrawal and assigning a Naranjo score of +9 (definite). This is a summary of the reported course; the causal attribution reflects the authors' reported assessment.

**Hidden material:** All source facts outside this question’s visible list remain excluded from its answering input.

**Reference source passages:**

- `F051` — Treatment, block p-26, characters 12616–12731: At the index admission, olmesartan was again not administered because of normotension and formulary unavailability.
- `F052` — Treatment, block p-26, characters 12732–12857: Once olmesartan was suspected as the cause, the primary team instructed the patient to continue avoiding it as an outpatient.
- `F053` — Treatment, block p-26, characters 12858–13022: She was transitioned to amlodipine monotherapy and counselled that olmesartan appears under multiple brand names including Benicar, Benicar HCT, Azor and Tribenzor.
- `F057` — Treatment, block p-26, characters 13517–13706: Biopsy results returned approximately 1 week after discharge and were consistent with olmesartan-associated enteropathy, at which point olmesartan was formally and permanently discontinued.
- `F058` — Outcome and follow-up, block p-27, characters 13731–13850: Within approximately 2 weeks of stopping olmesartan, the patient reported marked improvement in diarrhoea and appetite.
- `F059` — Outcome and follow-up, block p-27, characters 13851–14029: At 2-month cardiology follow-up, she had gained 4.8 kg from her nadir (56.1 to 60.9 kg, BMI 23.8), with complete symptom resolution and the adverse event was formally documented.
- `F060` — Outcome and follow-up, block p-27, characters 14030–14120: A prescheduled capsule endoscopy was cancelled by the patient after her symptoms resolved.
- `F061` — Outcome and follow-up, block p-27, characters 14121–14249: Recovery without enteral or parenteral support was consistent with prior reports of rapid improvement following drug withdrawal.
- `F068` — Discussion, block p-33, characters 16790–17091: The Naranjo Adverse Drug Reaction Probability Scale score was +9 (definite): previous reports (+1), onset after exposure (+2), improvement after withdrawal (+1), recurrence after readministration (+2), absence of an alternative cause (+2) and objective confirmation (+1); the remaining items scored 0.

**Boundary to review:** Report-comprehension task: the follow-up outcome passages are deliberately disclosed in the question, as required for this task type; the reference may additionally cite the authors' interpretive statements (F061, F068) beyond the visible passages.
