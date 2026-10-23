# New case source register

Prepared 22 October 2026. Three cases have been added to the UI and run once each, producing three answers and 28 item results. [Results and analysis](RESULTS.md) and [plain-text output](SCORE_OUTPUT.txt) are saved. References remain draft. A separate [MELD-inspired continuation screen](meld_20261022/RESULTS.md) is now complete: neither backend produced a near-exact continuation in its three probes. The cases remain **recently published candidates**; training cutoff and prior exposure remain unverified.

Read the [case inputs](CASES.md) and [draft references](REFERENCES.md). The saved source files, retrieval times and SHA-256 hashes are recorded in [download_manifest.json](evidence/download_manifest.json). Source IDs identify papers; case IDs identify the newly written tasks.

## 1. Josh’s suggested method

<a id="m01"></a>
**M01 — Nori et al., _Capabilities of GPT-4 on Medical Challenge Problems_.** [arXiv record](https://arxiv.org/abs/2303.13375) · [saved PDF](https://arxiv.org/abs/2303.13375). First submitted 20 March 2023; revised 12 April 2023. Section 6.2 and Appendix B, physical PDF pp. 13–14 and 29–30, describe MELD, a text-continuation probe for possible memorisation. This is the paper Josh linked in the meeting; it is a **method source**, not a source of new clinical cases.

Josh’s second suggestion was to find reports first public after a verified model-training cutoff. His May/June 2026 dates were an example. This register checks publication evidence and model information separately, rather than assuming that example is the actual cutoff. The PACES pilot remains a separate historical set.

## 2. Selected reports

| Source → case | Report | Publisher online date | Access and adaptation |
|---|---|---|---|
| S02 → N01 | Ohkuma et al., chemotherapy-associated hyponatraemia during germinoma treatment | 11 October 2026 | Full publisher text and 14-page PDF read; CC BY 4.0 |
| S04 → N02 | Dai et al., sleep-related behaviour and neuroglycopenia | 1 October 2026 | Full publisher text, including clinical details, read; CC BY 4.0 |
| S05 → N03 | Chen et al., acute hypermagnesaemia after an exposure at a spa | 14 October 2026 | Full publisher text, tables and timeline read; CC BY 4.0 |

The selected papers carry [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) permissions. The three summaries and task instructions are adaptations prepared for this study; they are not original author questions or unchanged textbook cases. Attribution is retained below. No patient images are included in the case inputs.

<a id="s02"></a>
### S02 — Chemotherapy-associated hyponatraemia

Ryotaro Ohkuma and colleagues. _Chemotherapy-associated hyponatremia during curative-intent salvage therapy for very late relapse of central nervous system germinoma: a case-based review._ Journal of Cancer Research and Clinical Oncology. DOI: [10.1007/s00432-026-06637-z](https://doi.org/10.1007/s00432-026-06637-z). [Publisher](https://link.springer.com/article/10.1007/s00432-026-06637-z) · [PDF snapshot](https://doi.org/10.1007/s00432-026-06637-z) · [text snapshot](https://doi.org/10.1007/s00432-026-06637-z) · [Crossref metadata](evidence/S02_crossref.json).

- Received 11 August; accepted 27 September; published online 11 October 2026. The PDF is an **Article in Press**, subject to further editing; the saved version fixes what was used.
- Case presentation, physical PDF pp. 3 and 5, supplies the relative-day laboratory and urine-output records used in [N01](CASES.md#n01). No exact sampling/availability clock times are supplied.
- The interpretation remains mixed and uncertain in the paper; it does not establish one sodium–water mechanism. The adapted task therefore asks for evidence-based interpretation and missing information, not a definitive single-cause label.
- Crossref agrees on the online date. Its DOI record was created at 22:25 UTC on 10 October; that registration timestamp is recorded separately and is not evidence that the complete case was public then.

<a id="s04"></a>
### S04 — Sleep-related behaviour and low glucose

Xin Dai, Lingchun Liu, Xueye Mao, Shan Li, Yixin Su and Qiang Meng. _Pancreatic hamartoma presenting with sleep-related behavioral abnormalities due to neuroglycopenia: a case report._ Frontiers in Oncology 16:1959029. DOI: [10.3389/fonc.2026.1959029](https://doi.org/10.3389/fonc.2026.1959029). [Publisher](https://www.frontiersin.org/journals/oncology/articles/10.3389/fonc.2026.1959029/full) · [text snapshot](https://doi.org/10.3389/fonc.2026.1959029) · [Crossref metadata](evidence/S04_crossref.json).

- Received 5 August; revised 28 August; accepted 2 September; published online 1 October 2026. Crossref agrees on the online date; its record was created on 1 October.
- The opening Case description provides the presentation, recorded glucose and EEG result. [N02](CASES.md#n02) uses those observations and withholds the later imaging, pathology and outcome.
- The author’s final diagnosis is not an answer requirement. The source is a single case, and its discussion acknowledges that a direct causal mechanism was not proved. We also do not copy its glucose-tolerance interpretation into the reference.

<a id="s05"></a>
### S05 — Acute hypermagnesaemia

Chien-Chou Chen, Jun-Nan Chen, Tzu-Hsien Yang and Shih-Hua Lin. _Case Report: Severe acute hypermagnesemia following inadvertent bath agent ingestion rapidly resolved by emergent hemodialysis._ Frontiers in Toxicology 8:1961156. DOI: [10.3389/ftox.2026.1961156](https://doi.org/10.3389/ftox.2026.1961156). [Publisher](https://www.frontiersin.org/journals/toxicology/articles/10.3389/ftox.2026.1961156/full) · [text snapshot](https://doi.org/10.3389/ftox.2026.1961156) · [Crossref metadata](evidence/S05_crossref.json).

- Received 7 August; revised 21 September; accepted 23 September; published online 14 October 2026. Crossref agrees on the online date. Its record was created at 22:10 UTC on 13 October; that is not substituted for the article’s public date.
- The first two Case description paragraphs supply [N03](CASES.md#n03), stopping at the initial result-availability point. Exposure history and treatment response appear later and are withheld.
- Initial creatinine is retained as an initial observation, not a claim that renal function stayed normal. The article’s AI-ECG percentile is not used as a probability or as a scoring target.

## 3. Other candidates retained in the list

| Source | Public date and accessible material | Decision for this first batch |
|---|---|---|
| S01 — Prasad et al., [semaglutide-associated proximal tubular dysfunction](https://link.springer.com/article/10.1186/s12882-026-05405-y) | 30 September 2026; publisher page and full text checked; [page snapshot](https://doi.org/10.1186/s12882-026-05405-y) | Reserve. CC BY-NC-ND 4.0 does not itself authorise distributing adapted article text; selected CC BY alternatives make this unnecessary for the shareable case pack. |
| S03 — Dalfardi et al., [bronchial blood clot casts in a nail technician](https://link.springer.com/article/10.1186/s12890-026-04862-3) | 21 October 2026; abstract/metadata checked; full case PDF not obtained; [page snapshot](https://doi.org/10.1186/s12890-026-04862-3) | Reserve. Full case details remain unchecked and the page uses CC BY-NC-ND 4.0. Its 2025 received date is not a public-case date. |
| S06 — Niknam and Niknam, [euglycaemic ketoacidosis after semaglutide-associated poor intake](https://doi.org/10.2147/IMCRJ.S650090) | 6 October 2026 reported in publisher metadata; full-text retrieval returned 403 | Reserve. No clinical case input has been written from an inaccessible body. |

These choices concern the material included in this adapted pack; they are not a claim that every reuse of a clinical fact requires permission.

<a id="exposure-checks"></a>
## 4. Publication checks and model exposure

For all three selected reports, publisher dates were compared with DOI metadata. Exact-title/DOI searches and distinctive case-detail searches did not identify an earlier matching public case in the results reviewed on 22 October. Crossref lists no registered earlier-version relationship. These are bounded checks, not proof that no preprint, conference version or other earlier exposure exists.

| Source | Search terms used to look for earlier versions |
|---|---|
| S02 | `"Chemotherapy-associated hyponatremia" "Ohkuma" preprint`; `"Chemotherapy-associated hyponatremia" "06637"`; `"germinoma" "118.4" Ohkuma`; `site:researchsquare.com "germinoma" "hyponatremia"` |
| S04 | `"Pancreatic hamartoma" "1959029" preprint`; `"pancreatic hamartoma" "58-year-old" hypoglycemia` |
| S05 | `"Severe acute hypermagnesemia" "1961156" preprint`; `"hypermagnesemia" "15.8" "bath"` |

The current KCL `/models` response was checked at **12:04 UTC on 22 October 2026**. [Saved provider response](evidence/P00_kcl_models.json).

| Configured role and alias | Provider-reported backend | What is known about training dates |
|---|---|---|
| Answering: `arc:lite` | `Qwen/Qwen3.8-27B`, NVFP4 | No explicit pretraining/post-training cutoff found in the inspected [official card](https://huggingface.co/Qwen/Qwen3.8-27B). |
| Judging: `arc:apex` | `GLM-5.3`, NVFP4 | No explicit pretraining/post-training cutoff found in the inspected [official card](https://huggingface.co/zai-org/GLM-5.3). |

The API does not identify an exact deployed weights revision. Hugging Face main-branch revisions were saved with the [Qwen metadata](evidence/P01_qwen_model_metadata.json) and [GLM metadata](evidence/P02_glm_model_metadata.json), but they do not pin KCL’s deployment. Alias creation times and model-card update times are not training cutoffs. Earlier pilot runs must retain their own metadata rather than inheriting today’s backend description.

**Current eligibility:** all three cases are prepared as recent-publication candidates. None is yet labelled “verified post-training” or “unseen”. The next evidence needed is a documented cutoff for the actual deployed model version, including relevant post-training, and any further earlier-publication checks required by the team. Clinical-answer requests did not include source papers or retrieval tools. Separate MELD requests subsequently supplied only the frozen original prefixes, as recorded below; they were not added to the clinical-answer history.

## 5. MELD procedure and completed screen

M01 tests whether a model can continue source text unusually closely. The original case prose should be probed in separate conversations, not only our paraphrases. A correct medical answer is not itself a positive memorisation result; a negative continuation result does not rule out prior exposure.

The six-probe run was completed under a [procedure frozen before generation](meld_20261022/PROTOCOL.md). Its [original excerpts and exact splits](meld_20261022/protocol.json), [complete continuations](meld_20261022/CONTINUATIONS.txt), [similarities](meld_20261022/similarities.csv) and [analysis](meld_20261022/RESULTS.md) are saved separately from rubric scoring. The procedure followed these choices:

1. Freeze the original case passage, its source locator and its prefix/suffix split. Keep boilerplate and reference lists out. Do not put the held-out suffix in the prompt.
2. Probe the actual answering backend and, if checking judge exposure, the judge backend separately, at temperature 0. Record the exact alias, returned model metadata, token limit and completion.
3. Fix the calculation and denominator before looking at results: character-normalised Levenshtein similarity `1 − edit_distance / max(lengths)`, threshold `≥ 0.95`, and three planned passages per model. The primary comparison uses the first L normalised output characters, where L is the suffix length; whole-output similarity is also saved.
4. Preserve individual outputs for inspection. Test these three cases as a small pilot, not a contamination prevalence estimate.

The paper’s prose and pseudocode differ in their stated similarity/aggregation details (Appendix B, pp. 29–30). This run therefore records its choices and is labelled MELD-inspired rather than an exact reproduction. All six probes returned usable visible text; primary similarities were 23.37%–28.81%, below 95%. Five continuations were shorter than their target character horizon. No “unseen” or “contamination-free” label is assigned, and the clinical answers, grades and draft references are unchanged.

## 6. Supporting clinical sources and next use

- **G01:** [NICE NG217, diagnosis and assessment](https://www.nice.org.uk/guidance/ng217/chapter/1-Diagnosis-and-assessment-of-epilepsy), recommendations 1.2.3 and 1.2.6, supports checking the interpretation of hypoglycaemia and EEG in N02. [Saved text](https://www.nice.org.uk/guidance/ng217/chapter/1-Diagnosis-and-assessment-of-epilepsy).
- **G02:** [NHS, Low blood sugar (hypoglycaemia)](https://www.nhs.uk/conditions/low-blood-sugar-hypoglycaemia/), supports conditional severe-episode advice in N02. The page displays last reviewed 3 August 2023, with a review due date of 3 August 2026; the retrieval date is not an updated-guidance date. [Saved page](https://www.nhs.uk/conditions/low-blood-sugar-hypoglycaemia/).

The first generation/scoring run is complete: **three base cases, three answers and 28 item results**, all with draft references. Its [results](RESULTS.md), [before](runs/ui_batch_20261022/provider_models_before.json) and [after](runs/ui_batch_20261022/provider_models_after.json) provider snapshots are saved separately from the preparation evidence. The separate continuation screen is also complete; clinical/reference review and actual model-version/cutoff evidence remain outstanding. The [pre-run input snapshot](runs/ui_batch_20261022/prepared_inputs.json) retains the original preparation state.
