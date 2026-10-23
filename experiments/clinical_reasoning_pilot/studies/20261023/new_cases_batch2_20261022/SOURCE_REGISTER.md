# Sources and original locations for N04 to N06

Three reports supply three patients. The English tasks, word limits, release conditions and selected review points are authored adaptations. They are not questions or dialogues taken from the articles. Clinical references remain **draft — awaiting Josh**.

The publisher pages and Crossref records were retrieved on 22 October 2026. Both give the dates below and CC BY 4.0 licensing. Retain author/journal/DOI attribution when sharing the adapted materials. The exact retrieved files, times and SHA-256 hashes are in [download_manifest.json](evidence/download_manifest.json).

| Source | Case | Publisher publication date | Scope |
|---|---|---|---|
| [S07](#s07) Trojan et al. | N04 | 16 October 2026 | First patient only; initial information and a later antibody packet |
| [S08](#s08) Cai et al. | N05 | 14 October 2026 | Clinical/imaging/PYP review before tissue and subtype confirmation |
| [S09](#s09) Kang et al. | N06 | 8 October 2026 | Selected Day-0 records for retrospective chronology/risk review |

These are publisher publication dates, not verified earliest-public dates or training cutoffs. Clinical event dates are not publication dates. Crossref reports no registered version relation in the retrieved records; that does not exclude an earlier abstract, accepted manuscript or preprint. The deployed model cutoffs remain unverified. N04–N06 now have five saved answers and 37 item results in the [clinical run](RESULTS.md). A later MELD-inspired check is now complete; see the [continuation results](meld_length_control_20261023/RESULTS.md).

## How to find the original text

Each locator below gives the publisher section and a saved block ID. IDs such as **S07-B0052** identify blocks in the fixed local HTML extraction; they are not publisher paragraph numbers. The [source excerpts](evidence/SOURCE_EXCERPTS.md) provide direct anchors to those blocks. Raw HTML and complete extracted text remain available alongside them. Extractions collapse whitespace and omit scripts/styles; they do not correct clinical statements. These source files include hidden results and are **not answering inputs**.

<a id="s07"></a>
## S07 Trojan and colleagues

*When encephalitis is not an infection: two cases of autoimmune GFAP astrocytopathy mimicking infectious encephalitis.* **Frontiers in Immunology**, 2026;17:1960742. [Publisher article](https://www.frontiersin.org/journals/immunology/articles/10.3389/fimmu.2026.1960742/full) · DOI 10.3389/fimmu.2026.1960742 · [Crossref record](evidence/S07_crossref.json).

**Original location:** section 2, Case descriptions; subsection **2.1 Case 1**, Table 1; Discussion for the distinction between the two patients’ antibody evidence.

| Material | Saved original location | Use in N04 |
|---|---|---|
| Opening beginning “A 36-year-old woman…”; first CSF, PCR/Borrelia tests, dexamethasone, repeat CSF, first discharge | [S07-B0052](evidence/SOURCE_EXCERPTS.md#s07-b0052) | Initial visible history; dose details shortened |
| Paragraph beginning “After discharge…”; orthostatic recurrence, MRI/spinal findings, repeat CSF | [S07-B0053](evidence/SOURCE_EXCERPTS.md#s07-b0053) | Initial visible readmission information |
| Paragraph beginning “Samples were sent…”; assay method, negative neuronal antibodies, positive CSF/serum GFAP-IgG | [S07-B0054](evidence/SOURCE_EXCERPTS.md#s07-b0054) | EVIDENCE packet only; withheld from INITIAL and NEUTRAL |
| Table 1 | S07-B0056–B0068 in [complete text](https://doi.org/10.3389/fimmu.2026.1960742) | Cross-check only; a dash is not changed into a negative culture result |
| Later contracture interpretation, discharge, prednisone and follow-up | [S07-B0070](evidence/SOURCE_EXCERPTS.md#s07-b0070), [B0071](evidence/SOURCE_EXCERPTS.md#s07-b0071), [B0072](evidence/SOURCE_EXCERPTS.md#s07-b0072) | Hidden from all answering conditions |
| Different interpretation of the two patients’ antibody findings | [S07-B0116](evidence/SOURCE_EXCERPTS.md#s07-b0116) | Reviewer context; prevents mixing Case 2 into Case 1 |

**Adaptation boundary:** the antibody result is released in an authored second information packet; no exact return timestamp is reconstructed. The initial record preserves orthostatic pain and prior treatment rather than reducing the case to an autoimmune clue. Only data from Case 1 enter the patient input.

[Full HTML](https://doi.org/10.3389/fimmu.2026.1960742) · [Complete extracted blocks](evidence/S07_GFAP_blocks.json) · [Case](CASES.md#n04) · [Draft references](REFERENCES.md#n04-reference).

<a id="s08"></a>
## S08 Cai and colleagues

*Gastrointestinal-onset hereditary transthyretin amyloidosis with cardiomyopathy and equivocal 99mTc-PYP scintigraphy: diagnosis by florbetapir PET-guided skeletal muscle biopsy and genetic testing.* **Frontiers in Cardiovascular Medicine**, 2026;13:1928392. [Publisher article](https://www.frontiersin.org/journals/cardiovascular-medicine/articles/10.3389/fcvm.2026.1928392/full) · DOI 10.3389/fcvm.2026.1928392 · [Crossref record](evidence/S08_crossref.json).

**Original location:** Methods and results; Clinical presentation and imaging findings; opening of Biopsy and histological confirmation. Subsequent molecular diagnosis and follow-up are outside the visible decision point.

| Material | Saved original location | Use in N05 |
|---|---|---|
| Paragraph beginning “A 52-year-old man…”; gastrointestinal/sensory symptoms, prior findings and symptom progression | [S08-B0062](evidence/SOURCE_EXCERPTS.md#s08-b0062) | Visible shortened history |
| Initial vital signs, biomarkers and renal measurements | [S08-B0063](evidence/SOURCE_EXCERPTS.md#s08-b0063) | Visible and explicitly labelled initial, not current |
| Echocardiography and cardiac MRI | [S08-B0064](evidence/SOURCE_EXCERPTS.md#s08-b0064) | Visible reported observations; no independent image reading required |
| Enzyme result, GLA sequencing and unmeasured lyso-Gb3 | [S08-B0068](evidence/SOURCE_EXCERPTS.md#s08-b0068) | Visible alternative-cause investigations |
| Monoclonal screen and PYP findings | [S08-B0070](evidence/SOURCE_EXCERPTS.md#s08-b0070) | Visible observations; author’s exclusion/interpretation wording is not supplied as the model’s conclusion |
| Biopsy findings, preference/refusal and PET target | [S08-B0071](evidence/SOURCE_EXCERPTS.md#s08-b0071) | Hidden |
| TTR variant and tissue protein identification | [S08-B0079](evidence/SOURCE_EXCERPTS.md#s08-b0079) | Hidden |
| Treatment and three-month clinical/measurement changes | [S08-B0084](evidence/SOURCE_EXCERPTS.md#s08-b0084) | Hidden |
| Limitations of outcome attribution and diagnostic work-up | [S08-B0093](evidence/SOURCE_EXCERPTS.md#s08-b0093) | Reviewer context, not a required answer about unseen follow-up |

**Adaptation boundary:** the task stops after the reported PYP findings and before subsequent tissue/subtype results. The PYP ratio remains **>1.42**, not an invented exact 1.42. Negative **GLA** sequencing is visible; later **TTR** sequencing is not. These must not be collapsed into one “genetic test” result.

[Full HTML](https://doi.org/10.3389/fcvm.2026.1928392) · [Complete extracted text](https://doi.org/10.3389/fcvm.2026.1928392) · [Case](CASES.md#n05) · [Draft reference](REFERENCES.md#n05-reference).

<a id="s09"></a>
## S09 Kang and colleagues

*Staged alteplase administration under VA-ECMO support for high-risk pulmonary embolism with severe thrombocytopenia.* **Frontiers in Cardiovascular Medicine**, 2026;13:1977983. [Publisher article](https://www.frontiersin.org/journals/cardiovascular-medicine/articles/10.3389/fcvm.2026.1977983/full) · DOI 10.3389/fcvm.2026.1977983 · [Crossref record](evidence/S09_crossref.json).

**Original location:** Case description, including initial presentation, diagnostic assessment, treatment sequence, and **Table 1 with its interpretive boundaries**. Later outcome paragraphs are withheld from the task.

| Material | Saved original location | Use in N06 |
|---|---|---|
| Initial shock and subsequent diagnostic/ECMO events | [S09-B0050](evidence/SOURCE_EXCERPTS.md#s09-b0050), [B0082](evidence/SOURCE_EXCERPTS.md#s09-b0082) | Visible short clinical context |
| 11:55 laboratory values | [S09-B0086](evidence/SOURCE_EXCERPTS.md#s09-b0086) | Visible; no unreported availability time added |
| Platelet transfusion 14:50–15:10, other haemostatic support and missing pre-infusion count | [S09-B0063](evidence/SOURCE_EXCERPTS.md#s09-b0063), [B0094](evidence/SOURCE_EXCERPTS.md#s09-b0094) | Visible; preserve the intervention between measurements |
| First infusion and cannulation bleeding | [S09-B0095](evidence/SOURCE_EXCERPTS.md#s09-b0095) | Visible; dose/pump quantities omitted from the audit task |
| Interval sample and ongoing support | [S09-B0065](evidence/SOURCE_EXCERPTS.md#s09-b0065), [B0066](evidence/SOURCE_EXCERPTS.md#s09-b0066) | Visible; sample time is not silently made a report time |
| 19:03 reassessment/order and 19:25 second-infusion start | [S09-B0067](evidence/SOURCE_EXCERPTS.md#s09-b0067) | Visible order/start distinction |
| 20:13 sample, 21:06 coagulation reporting | [S09-B0068](evidence/SOURCE_EXCERPTS.md#s09-b0068) | Visible audit evidence, not information presumed available earlier |
| Relative restart account and its limitations | [S09-B0070](evidence/SOURCE_EXCERPTS.md#s09-b0070), [B0097](evidence/SOURCE_EXCERPTS.md#s09-b0097) | Visible relative timing; approximate 20:25 must remain derived |
| Later safety/outcome assessment | [S09-B0075](evidence/SOURCE_EXCERPTS.md#s09-b0075), [B0076](evidence/SOURCE_EXCERPTS.md#s09-b0076), [B0099](evidence/SOURCE_EXCERPTS.md#s09-b0099), [B0100](evidence/SOURCE_EXCERPTS.md#s09-b0100) | Hidden; do not reward copying later success or a final safety claim |

**Adaptation boundary:** the model is a retrospective reviewer, so it may see the later reporting timestamp while being required to distinguish what was known earlier. An exact restart/completion time, a pre-infusion platelet count and a standard safe regimen are not invented. The 53-minute reporting delay is independently calculable; the approximately 41-minute comparison uses an estimated restart, not an observed execution time.

[Full HTML](https://doi.org/10.3389/fcvm.2026.1977983) · [Complete extracted text](https://doi.org/10.3389/fcvm.2026.1977983) · [Case](CASES.md#n06) · [Draft reference](REFERENCES.md#n06-reference).

## What remains outside this preparation

The files record sources and proposed tasks, not clinical validation or model performance. Josh’s [reference questions](REFERENCES.md) concern required clinical reasoning, acceptable alternatives and rubric applicability. Earliest-public-version and actual training-cutoff verification require separate evidence. The completed original-text MELD requests are saved separately from answering and grading in [meld_length_control_20261023](meld_length_control_20261023/RESULTS.md).
