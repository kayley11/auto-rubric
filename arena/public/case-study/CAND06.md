# CAND06 — Persistent proteinuria with a monoclonal light-chain abnormality

Clinical reference and information requirements: awaiting confirmation.

Source: https://doi.org/10.3389/fmed.2026.1963349

Decision point: Researcher-defined pretreatment diagnostic review of Case 1 after admission renal/urine and monoclonal-protein data, with tissue biopsy and detailed haematological staging withheld. The source does not timestamp each result.

Opening: A 55-year-old man is admitted on 17 February 2019 after two years of abnormal urinalysis. Persistent proteinuria requires a diagnostic assessment; relevant renal and haematological records can be requested.

Task: Audience: a clinician. Use 180-260 words in English. Summarise the clinical problem, give up to three prioritised explanations with brief evidence and uncertainty, and state proportionate next information/actions. Use only information actually supplied. Do not invent findings, measured values, doses or probabilities. After at most six information-request turns, write a clinician-facing final assessment of 180–260 words. The record system is the information source; the clinical team is the audience. Characterise the renal problem, assess whether monoclonal-protein evidence changes the differential and propose the next discriminating investigations. Do not require a renal pathological subtype before biopsy evidence is released. Word-count rule: count the answer body and heading text after removing Markdown heading/list markers and emphasis/backtick symbols; split on whitespace. Hyphenated expressions count as one word. Exclude JSON only if the task explicitly excludes it. No extra tolerance is added to the stated word range.

## Actual questions and replies

### Question 1
Please provide the renal function results (serum creatinine, eGFR, electrolytes) and the urinalysis/proteinuria data (dipstick, protein:creatinine ratio or 24-hour urine protein, presence of casts or dysmorphic red cells) available at admission.

Saved assessment note: These data define the severity and pattern of the renal problem (nephrotic vs. nephritic range, presence of active sediment) and are essential before considering the differential.

Returned 06.renal_severity (record, presentation): Case 1 admission creatinine was 114 micromol/L and eGFR 61.6 mL/min/1.73 m². Twenty-four-hour urine protein was 1,259 mg and serum albumin 43 g/L. The report describes a two-year history of abnormal urinalysis but supplies no serial pretreatment creatinine trajectory.

Returned 06.electrolytes (record, presentation): Serum calcium was 2.38 mmol/L, phosphate 1.36 mmol/L, potassium 3.7 mmol/L, bicarbonate 22.7 mmol/L and uric acid 300 micromol/L.

Environment feedback: After the two-group reply limit, 06.tubular_markers (the stored urine glucose, pH and low-molecular-weight protein markers) is deferred rather than unavailable. The released renal group already includes the stored 24-hour protein quantity. A total-protein dipstick grade, spot protein:creatinine ratio and urinary-sediment report describing casts or dysmorphic red cells are not supplied in the frozen admission packet; their absence here is not a negative finding or proof that testing was not done. Hidden renal-biopsy cast observations are not urine microscopy and are not released.

### Question 2
Please provide the monoclonal-protein and haematological staging data available at admission: serum protein electrophoresis (SPEP) with any identified M-spike, serum free light chains (kappa, lambda, ratio), serum immunoglobulins (IgG, IgA, IgM), and any haematological markers (full blood count, peripheral smear, beta-2 microglobulin, LDH).

Saved assessment note: The decision point specifies that monoclonal-protein data are part of the pretreatment review. Establishing whether a monoclonal gammopathy is present is critical to distinguishing a plasma-cell or lymphoproliferative-related renal process from a primary glomerular or tubular cause.

Returned 06.immunofixation (record, presentation): Serum immunofixation showed a monoclonal IgG-kappa peak. Detailed marrow, skeletal and renal tissue findings are withheld in this adaptation, rather than being negative.

Returned 06.free_light_chains (record, presentation): Serum free kappa was 427.5 mg/L and free lambda 8.47 mg/L, with kappa/lambda ratio 50.47. Serum IgG was 15.80 g/L. These are Case 1 values.

Environment feedback: The stored monoclonal peak is an immunofixation result, not a supplied quantified SPEP M-spike; no SPEP concentration is provided. After the two-group limit, 06.blood_counts (stored haemoglobin, platelets and LDH) is deferred rather than unavailable. Serum IgA/IgM, a complete blood count, peripheral smear and serum beta-2-microglobulin are not supplied in the frozen packet; missing results do not establish that tests were not performed. The stored urinary beta-2-microglobulin is a different specimen/test and is not substituted for the requested haematological marker. Detailed marrow/cytogenetic and skeletal staging remain deliberately withheld at this decision point.

### Question 3
Please provide the urine protein characterisation data (urine immunofixation or urine protein electrophoresis identifying the protein species in the 24-hour sample) and the stored tubular-function markers (urine glucose, urine pH, and any low-molecular-weight protein measurement such as urinary beta-2-microglobulin or retinol-binding protein).

Saved assessment note: The markedly elevated free kappa (427.5 mg/L, ratio 50.47) with a monoclonal IgG-kappa peak and sub-nephrotic proteinuria (~1.26 g/24 h) with preserved serum albumin (43 g/L) raises the possibility of a tubular rather than glomerular protein-losing mechanism. Urine protein species identification and tubular markers would discriminate between light-chain proximal tubulopathy, light-chain deposition disease, and other glomerular or tubular causes, and would guide whether the renal biopsy is most likely to show tubular versus glomerular pathology.

Returned 06.tubular_markers (record, presentation): Urine glucose was ++ and urine pH 7.5. Urinary beta-2-microglobulin was 30.7 mg/L and alpha-1-microglobulin 110.9 mg/L. The source does not give a simultaneous serum glucose value for interpreting the glycosuria.

Environment feedback: Urine immunofixation or urine protein electrophoresis identifying species in the 24-hour sample is not supplied in the frozen packet. The stored immunofixation result is serum, so it is not substituted for this explicitly urine-specific request. The stored tubular markers are supplied; urinary retinol-binding protein is not reported here. Missing result fields do not establish that those tests were not performed. No additional directly requested stored group is deferred by the two-group limit, and no renal-biopsy result is released.

## Final answer, unchanged

Diagnostic Review – Case 1, Admission 17 Feb 2019

Clinical problem: A 55-year-old man with two years of abnormal urinalysis now has mildly reduced eGFR (61.6), sub-nephrotic proteinuria (1,259 mg/24 h), and preserved serum albumin (43 g/L). Elevated urinary beta-2-microglobulin (30.7 mg/L) and alpha-1-microglobulin (110.9 mg/L) indicate a tubular proteinuric component. Glycosuria (++) without a supplied serum glucose and an alkaline urine pH (7.5) raise the possibility of proximal tubular dysfunction.

Monoclonal-protein evidence: Serum immunofixation identifies an IgG-kappa monoclonal peak; free kappa is 427.5 mg/L (ratio 50.47). This shifts the differential toward a light-chain-mediated renal process.

Prioritised explanations:

1. Monoclonal gammopathy of renal significance (light-chain proximal tubulopathy or deposition disease). Supported by the tubular marker profile and possible proximal dysfunction; uncertain without urine protein electrophoresis or biopsy.

2. Multiple myeloma with renal involvement. Supported by the monoclonal peak and elevated free light chains; uncertain without marrow, skeletal imaging, serum beta-2-microglobulin, or full blood count.

3. Incidental monoclonal gammopathy coexisting with a separate primary renal disease. Cannot be excluded without tissue or urine sediment data.

Next discriminating steps: urine protein electrophoresis/immunofixation; serum beta-2-microglobulin, IgA, IgM, and full blood count; skeletal imaging; and renal biopsy for definitive histological and immunofluorescence characterisation.

## Provisional reference

Represent Case 1 as persistent proteinuria with modestly reduced filtration and strong kappa-restricted monoclonal evidence. Glycosuria and low-molecular-weight protein markers support investigating proximal tubular involvement but do not prove its cause or a complete Fanconi syndrome; simultaneous serum glucose and amino-acid testing are not supplied. A paraprotein-associated renal process is a working concern, while renal biopsy and systemic clonal assessment discriminate among possibilities. Do not import Case 2’s lambda excess, severe renal failure, cast findings or death. Do not require the hidden crystalline subtype, marrow percentage, bone lesions or staging. Exact essentiality and diagnostic recommendations await clinical confirmation.

## Candidate information requirements

- 06.R1 — candidate essential: Request renal function and quantify/characterise the urine abnormality. Why: Persistent abnormal urinalysis and proteinuria require establishing renal severity and whether the pattern suggests glomerular or tubular involvement. Acceptable alternatives: Creatinine/eGFR plus protein quantification and urinalysis or appropriate tubular-protein assessment. Clinically equivalent urine/renal work-up counts; exhaustive tubular testing is not required. Deadline: Before the final assessment, within the six question turns.
- 06.R2 — candidate essential: Request monoclonal-protein testing or an equivalent haematological evaluation. Why: The task explicitly asks whether haematological evidence changes the renal differential; a defensible assessment needs the relevant protein evidence. Acceptable alternatives: Serum/urine electrophoresis with immunofixation and/or serum free light chains, or an appropriate paraprotein work-up. No need to name a hidden renal lesion. Deadline: Before the final assessment, within the six question turns.
- 06.R3 — candidate helpful: Seek evidence of systemic clonal disease and a discriminating tissue/tubular assessment. Why: Monoclonal-protein findings do not by themselves identify the renal lesion or establish the full systemic disease category. Acceptable alternatives: Marrow or skeletal assessment, renal biopsy planning, simultaneous glucose or clinically equivalent proximal-tubular studies. Adequate requests count even when their results are withheld. Deadline: Before the final assessment, within the six question turns.

## Saved scores and explanations

### D1 — primary, repeat 1: 5
All numeric claims match the supplied record exactly (creatinine 114 µmol/L implied via eGFR 61.6, 24-h protein 1,259 mg, albumin 43 g/L, urinary β2-microglobulin 30.7 mg/L, α1-microglobulin 110.9 mg/L, urine glucose ++, pH 7.5, IgG-kappa on immunofixation, free kappa 427.5 mg/L, ratio 50.47). The response correctly avoids inventing an SPEP M-spike quantity, marrow, skeletal, or biopsy findings, and does not import Case 2 features. It explicitly flags uncertainty for each differential (e.g., 'uncertain without urine protein electrophoresis or biopsy', 'uncertain without marrow, skeletal imaging...'), notes glycosuria lacks a simultaneous serum glucose, and correctly frames MGRS/myeloma/incidental MGUS as the working differential consistent with the provisional reference points. Next steps (urine protein electrophoresis/immunofixation, serum β2-microglobulin, CBC, skeletal imaging, renal biopsy) are appropriate and grounded. No factual errors or fabrications identified; uncertainty is explicitly acknowledged, matching the Score 5 anchor.

### D3a — primary, repeat 1: 5
The submission provides a focused, accurate synthesis of the evidence actually released at the decision point: mildly reduced eGFR (61.6) with sub-nephrotic 24-hour proteinuria (1,259 mg) and preserved albumin (43 g/L), a tubular proteinuric component supported by urinary beta-2-microglobulin (30.7 mg/L) and alpha-1-microglobulin (110.9 mg/L), glycosuria and alkaline urine pH flagged as possible proximal tubular dysfunction, and the IgG-kappa monoclonal peak with a kappa/lambda ratio of 50.47 appropriately shifting the differential toward light-chain-mediated renal disease. It does not distort withheld data: it correctly treats marrow, skeletal, biopsy and haematological staging as unavailable rather than negative, avoids committing to a renal pathological subtype before biopsy, and qualifies each of the three prioritised explanations with the specific missing discriminating evidence. The proposed next steps (urine protein electrophoresis/immunofixation, beta-2-microglobulin, IgA/IgM, FBC, skeletal imaging, renal biopsy) directly target the unresolved gaps. Minor limitations, such as not citing the IgG value (15.80 g/L) or electrolytes explicitly, do not change the clinical framing. This meets the Score 5 anchor: discriminating features are highlighted, hypothesis generation is guided, and unresolved gaps are clearly stated.

### D3b — primary, repeat 1: 5
The submission prioritises a breadth-appropriate, evidence-grounded differential: (1) MGRS with light-chain proximal tubulopathy/deposition disease, supported by the actual tubular markers (urinary beta-2-microglobulin 30.7 mg/L, alpha-1-microglobulin 110.9 mg/L, glycosuria ++, urine pH 7.5) and the IgG-kappa peak with kappa/lambda ratio 50.47 from Q1–Q2; (2) multiple myeloma with renal involvement, appropriately flagged as uncertain given withheld marrow/skeletal staging; (3) incidental monoclonal gammopathy with separate primary renal disease as an important alternative. It explicitly states how the monoclonal-protein evidence changes the differential, uses discriminating findings (preserved albumin, sub-nephrotic proteinuria, tubular markers), attends to dangerous mimics (myeloma), and gives proportionate next investigations (urine protein electrophoresis/immunofixation, haematological markers, skeletal imaging, renal biopsy) without demanding unrevealed biopsy or staging facts. Prior plausibility is handled proportionately and no findings are invented, matching the Score 5 anchor.

### D5c — primary, repeat 1: 5
All essential requirements are met through well-timed, targeted requests. Q1 covers renal function and proteinuria quantification (06.R1); Q2 covers monoclonal-protein and haematological evaluation (06.R2); Q3 adds discriminating tubular/urine-protein-species assessment (06.R3). Each request is accompanied by a prospectively allowed note explaining how the information affects interpretation (e.g., Q3's note linking the kappa excess and sub-nephrotic proteinuria to tubular vs glomerular discrimination). Requests are proportionate and prioritised — three turns out of six, escalating from severity to monoclonal evidence to mechanism-discriminating tests, without unnecessary gathering. Unfulfilled items (SPEP M-spike, urine immunofixation, CBC) reflect frozen-packet limitations, not acquisition failures, and the model's requests remain adequate. This matches the Score 5 anchor: essential requirements met with proportionate, discriminating requests and clear task-appropriate explanation.

### D5u — primary, repeat 1: 5
The submission clearly separates what is established (IgG-kappa monoclonal peak, kappa/lambda ratio 50.47, tubular proteinuria markers, sub-nephrotic proteinuria with preserved albumin) from what is only possible or unresolved. For each of the three prioritised explanations it names the specific missing evidence that creates uncertainty (urine protein electrophoresis, biopsy, marrow, skeletal imaging, beta-2-microglobulin, blood count, urine sediment), rather than hedging generically. It also flags interpretive limits such as glycosuria without a simultaneous serum glucose. It closes with concrete next discriminating investigations that map directly onto the named uncertainties, satisfying the score-5 anchor: distinguishing established, probable, possible and unresolved conclusions, explaining the source of uncertainty, and identifying the next step needed to reduce it.

## All stored source facts and original locations

- 06.renal_severity (record, B0053; B0069-B0072): Case 1 admission creatinine was 114 micromol/L and eGFR 61.6 mL/min/1.73 m². Twenty-four-hour urine protein was 1,259 mg and serum albumin 43 g/L. The report describes a two-year history of abnormal urinalysis but supplies no serial pretreatment creatinine trajectory.
- 06.free_light_chains (record, B0053; B0065-B0068): Serum free kappa was 427.5 mg/L and free lambda 8.47 mg/L, with kappa/lambda ratio 50.47. Serum IgG was 15.80 g/L. These are Case 1 values.
- 06.immunofixation (record, B0089-B0090): Serum immunofixation showed a monoclonal IgG-kappa peak. Detailed marrow, skeletal and renal tissue findings are withheld in this adaptation, rather than being negative.
- 06.tubular_markers (record, B0079-B0081; B0093): Urine glucose was ++ and urine pH 7.5. Urinary beta-2-microglobulin was 30.7 mg/L and alpha-1-microglobulin 110.9 mg/L. The source does not give a simultaneous serum glucose value for interpreting the glycosuria.
- 06.electrolytes (record, B0053; B0073-B0077): Serum calcium was 2.38 mmol/L, phosphate 1.36 mmol/L, potassium 3.7 mmol/L, bicarbonate 22.7 mmol/L and uric acid 300 micromol/L.
- 06.blood_counts (record, B0053; B0063-B0064; B0078): Haemoglobin was 131 g/L, platelets 191 ×10^9/L and LDH 143 U/L. These values belong to Case 1, not the second patient in the report.
- 06.tubular_limits (record, B0082; B0093): Urinary amino-acid analysis was not performed. The authors did not establish a formal diagnosis of Fanconi syndrome. Case 1 urinary phosphate was 20.3 mmol per 24 hours, urinary potassium 39.2 mmol per 24 hours and urinary calcium 0.53 mmol per 24 hours; fractional excretion values are not supplied.

Adaptation: Only published Case 1 is used. Renal/urine, free-light-chain and immunofixation data are released as a researcher-defined pretreatment packet; the article does not supply exact collection/reporting times. PET-CT, marrow/cytogenetic and renal-biopsy results are experimentally withheld even though they are included in the source’s baseline work-up. Urinary tubular markers are provided without inventing their timing. No normal serum glucose, absent systemic features, full Fanconi syndrome or drug history is invented. Opening, task, release rules and requirements are researcher-designed.
Withheld: Case 1 lytic skeletal lesions, marrow and cytogenetic staging, renal light/electron/immunoelectron microscopy, the final pathological subtype, treatment and outcomes. All Case 2 findings are excluded, not alternative facts for this patient.
