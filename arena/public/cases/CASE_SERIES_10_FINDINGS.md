# Ten case-series papers: model findings and rubric questions

**Four models completed all ten tasks. Gemma returned HTTP 429 and has no completed answers.** Clinical references and information requirements remain **awaiting confirmation**.

There are **40 saved answers and 192 completed item ratings**: ten answers and 48 ratings each for arc:lite, arc:chat, arc:apex and Nemotron. Gemma's ten answer slots and 48 ratings remain unavailable, not zero. Two actual Gemma requests returned 429; further calls were deferred. No paid fallback was used.

## What was tested

The ten readable research papers were converted into five clinician patient assessments, one explanation for parents and four reviews of series-level evidence. Group results were not turned into fictional individual patients. The aim was to test clinical synthesis, causal restraint, interpretation of response rates and communication of uncertainty.

All models received the same selected facts and task, with later findings and outcomes withheld. They did not receive the article title, full paper or provisional scoring reference. The judge was always arc:apex, using the retained manuscript rubric snapshot and one AutoRubric call per item. Revised D3a was used only where patient synthesis was explicitly requested; D5c was not scored because these were written tasks without an executed interview. D3a did not receive the reference. Other items received separate provisional review points.

These are first-run observations, with one answer per available model and task. Scores are compared within a task and criterion; there is no pooled clinical score or model ranking. [Full scores and reasons](CASE_SERIES_10_RESULTS.md) · [Design](CASE_SERIES_10_DESIGN.md).

Using the fixed word-count rule, 39 answers met their requested range. Nemotron's SR07 answer had 179 words against 180–240; it was retained rather than regenerated. Instruction following was not a selected grading item in this batch.

## The ten tasks and findings

| Task and source | Material used | Main observation |
|---|---|---|
| **SR01** · [PLAAT4 and spinal-predominant white-matter disease](https://jamanetwork.com/journals/jamaneurology/fullarticle/2855735) | Index patient P1, before genetic findings | Nemotron prioritised three inflammatory categories and omitted an inherited/metabolic white-matter category. D3b was **2**, versus **5** for each KCL model. Its D3a was still **5**: accurate synthesis and a sufficiently broad differential are different judgements. |
| **SR02** · [Tofersen in ALS autopsy tissue](https://jamanetwork.com/journals/jamaneurology/fullarticle/2850993) | Eight-donor study; reduction measurements in three recent donors | All four answers separated tissue target engagement from proof of functional or survival benefit. The three-donor subset must remain distinct from the eight-donor series. |
| **SR03** · [IL-6 blockade in acute MOGAD/NMOSD attacks](https://jamanetwork.com/journals/jamaneurology/fullarticle/2850382) | 18 attacks in 17 people; change before and after treatment | All four answers rejected a proven rescue effect and noted improvement already underway. However, apex added an unsupported safety claim while receiving high scores. See below. |
| **SR04** · [Respiratory illness during long-term ocrelizumab](https://jamanetwork.com/journals/jamaneurology/fullarticle/2847194) | Table patient 1, before biopsy and later response | All four retained infectious and inflammatory/drug-related explanations. All received **D6b=4**. The reasons repeatedly invoked the highest anchor's contraindication/monitoring requirements; their relevance to this bounded assessment needs checking. |
| **SR05** · [Progressive impairment after childhood growth-hormone exposure](https://jamanetwork.com/journals/jamaneurology/fullarticle/2847009) | Index patient at about age 55, before later pathology | Lite wrote **“variant Creutzfeldt-Jakob disease”**; D1 was **3**. The judge identified a distinction from iatrogenic CJD that needs clinical review. The withheld pathology was not required as the answer. |
| **SR06** · [Early treatment and cord-blood transplant for MPS](https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2848564) | Infant ID 3; explanation to parents before transplant | All four explained different delivery routes and avoided guaranteeing development; all received **D7b=5**. D2a was **4, 5, 4, 4** for lite, chat, apex and Nemotron. Several 4-point reasons required competing-hypothesis testing in a family explanation. |
| **SR07** · [Vitamin D for treatment-related skin toxicity](https://jamanetwork.com/journals/jamadermatology/fullarticle/2851627) | Aggregate outcomes, not an invented patient | All four calculated the requested percentages with the supplied denominators. Lite then reversed the direction of a denominator change in its explanation, despite **D1=5**. |
| **SR08** · [Neoadjuvant capecitabine for cutaneous SCC](https://jamanetwork.com/journals/jamadermatology/fullarticle/2849570) | 15 participants; 12 surgical assessments | All four used 10/15, 5/12 and 7/12 correctly and distinguished clinical disappearance, pathological response and durable cure. Lite received **D2a=4**; its explanation again invoked the top anchor's competing-hypothesis requirement. |
| **SR09** · [Intralesional IL-2 for cutaneous SCC](https://jamanetwork.com/journals/jamadermatology/fullarticle/2845994) | Patient 16: an individual nonresponder, before later treatment | All four rejected using the series-level 81% response rate to justify continuing unchanged treatment. D2a was **5, 3, 3, 3** for lite, chat, apex and Nemotron. Some reasons question proposed investigations as well as unsupported claims; those need separate judgement. |
| **SR10** · [Early generalised acanthosis nigricans and EGFR](https://jamanetwork.com/journals/jamadermatology/fullarticle/2843769) | Patient 2, before molecular results | Nemotron turned normal glucose into **“absence of hyperinsulinaemia”**, although no insulin result was supplied. Its **D1 and D2a were both 3**. Apex explicitly left insulin resistance unproven. |

## Examples that need a scoring decision

### SR07: correct arithmetic, incorrect explanation

All four answers reported approximately **86.7% (26/30)** symptom relief and **72.7% (24/33)** uninterrupted anticancer treatment. Nemotron rounded these to 87% and 73%, which is arithmetically consistent.

Lite then wrote:

> using the full cohort would overstate the measured-outcome rate

But 26/33 is **78.8%**, lower than 26/30. The direction is wrong. Lite received **5 on D1, D2a, D3d and D5u**; the explanations did not flag it. No clinical judgement is needed to verify the arithmetic. The author decision is how this incorrect interpretation should affect the relevant grades, without treating one sentence as several independent errors.

### SR03: a safety statement without supplied safety outcomes

Apex wrote:

> The data support feasibility and apparent safety signals worth prospective testing

The supplied task contained disability trajectories, treatment intentions and design limitations, but no adverse-event data. Apex received **D1=5 and D3d=5**. The evidence gap can be identified directly; the remaining judgement is whether this added statement materially weakens factual grounding or causal interpretation, and which grade is justified.

### SR01 and SR05: clinically important distinctions

In SR01, Nemotron's three prioritised categories were NMOSD, MOGAD and primary progressive MS. The judge assigned **D3b=2**, citing the omitted inherited/metabolic category. It also questioned the proposed spinal cord biopsy under D3c (**3**). Confirm which broad diagnostic categories and investigations are proportionate from the disclosed evidence alone. Identifying PLAAT4 from hidden genetic results is not required.

In SR05, lite named variant CJD, while the judge distinguished it from growth-hormone-associated iatrogenic CJD. Confirm the clinical terminology and whether **D1=3** adequately reflects its effect on the assessment. This is one linked terminology issue, not several independently counted failures.

### SR04, SR06 and SR08: what earns the highest grade in this task?

For the parent explanation in SR06, lite's D2a reason said its inferences were supported, but it lacked systematic testing of competing hypotheses; it received **4**. The same top-anchor requirement appears in several clinician and evidence-review judgements. SR04 safety reasons similarly required explicit absolute/relative contraindications or monitoring for **5**, even though no regimen was requested.

Confirm whether these highest-grade requirements fit each task. If they do not, specify whether to adapt the anchor, select a different item or mark an item out of scope. Do not infer a correct replacement score from the reason alone.

### SR09 and SR10: unprovided evidence must remain unknown

SR09 supplies nonresponse, not its biological mechanism. Lite's **“biological resistance”** therefore needs review alongside its suggestion to check treatment delivery. Apex's claim that the series **“lacks independent pathological confirmation”** is also stronger than saying the packet does not provide that information.

The SR09 D2a reasons also question requests to reassess staging and pathology because those details were not supplied. Requesting missing evidence is different from inventing its result. Confirm which proposed investigations are proportionate, and separate that decision from the genuinely unsupported assertions. Apex's D2a reason caught the pathology claim, while its D1 remained **5**.

SR10 supplies normal glucose but no insulin result. Nemotron's statement that hyperinsulinaemia is absent is unsupported by this input; D1 and D2a were **3**. Its D1 explanation itself says insulin was **“never measured”**: the packet establishes only that the result was not supplied. Confirm how materially the answer changes the framing, which genetic/systemic assessment is proportionate, and the appropriate grades. The article's molecular result was deliberately withheld; the model is not required to guess it.

## What to confirm next

| Cases | Specific feedback needed |
|---|---|
| SR01, SR05, SR10 | Confirm the clinical distinctions, proportionate next investigations and the impact of the quoted statements on the relevant grades. |
| SR04, SR06 | Confirm the necessary safety points at this decision point; distinguish a useful caveat from a requirement to provide a management plan. Check the parent explanation's treatment-route wording. |
| SR02, SR03, SR07, SR08 | Confirm the task fit of D2a/D3d and how much causal explanation is needed for the highest grade. Keep numerical checks separate from clinical judgement. |
| SR07, SR09, SR10 | Decide how unsupported or incorrect explanatory claims affect scores, using the exact answer and saved judge reason. |

The original inputs, answers and grades are retained. No score has been manually corrected. The new tasks are under **Cases → Case-series tasks** on the website; select a task to compare all five model slots, open individual reasons and export the saved output.

[Complete results](CASE_SERIES_10_RESULTS.md) · [All saved visible requests, returns and errors](CASE_SERIES_10_RAW_OUTPUT.txt) · [Scores and reasons](CASE_SERIES_10_SCORES.csv) · [Source positions](CASE_SERIES_10_SOURCES.json).
