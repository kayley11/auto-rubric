# N04–N06: original-text MELD check

23 October 2026

**None of the six continuations reproduced its held-out source passage nearly verbatim.** Primary similarities were **16.83%–21.04%**, below the pre-set 95% threshold. All six first responses were long enough for the complete comparison; no append, retry or token-limit recovery was needed. This is a negative result for these particular text-continuation probes, not proof that the reports were absent from model training.

## Why this was run

The clinical experiment asked models to answer adapted cases and used Josh’s rubric to assess those answers. This separate check asks a different question: **when given the first half of a published case passage, does the model reproduce the actual second half?** Strong reproduction could justify investigating text familiarity or leakage. A plausible clinical answer, or a high rubric score, does not answer that question.

The method follows the preceding length-controlled round for N01–N03. It is **MELD-inspired**, rather than an exact replication of [Nori et al., Section 6.2 and Appendix B](https://arxiv.org/abs/2303.13375v2): the hosted tokenizer/model build is not pinned, and the fixed character horizon and minimum-length prompts are explicit implementation choices. These are new source passages; this is not a before/after experiment on the same N04–N06 text.

## What text was tested

The passages below were selected and frozen before any continuation was generated. They are original publisher prose, **not the adapted UI case summaries or clinical model answers**. Only Unicode NFKC and repeated whitespace were normalised. Source wording, numbers, citations and punctuation were otherwise retained. NFKC can flatten superscripts, as in the previous method; the original extracted paragraphs are saved alongside the normalised text.

| Case | Published passage selected | Original locations | Prefix / held-out suffix characters |
|---|---|---|---:|
| N04 | First patient’s initial admission, recurrence and antibody-work-up account | Trojan et al., Case descriptions, **2.1 Case 1**, first three prose paragraphs; S07-B0052–B0054, before Table 1 | 1,399 / 1,392 |
| N05 | Opening history, initial measurements and cardiac imaging | Cai et al., Methods and results, **Clinical presentation and imaging findings**, first three paragraphs; S08-B0062–B0064, before Figure 1 | 1,003 / 998 |
| N06 | Dose rationale, transfusion, staged infusions and the restart account | Kang et al., Case description, **Therapeutic intervention**; five consecutive paragraphs S09-B0093–B0097, before Follow-up and outcomes | 1,415 / 1,417 |

N04 has three clinical answer conditions but only **one original patient/source passage** in this check. Its second patient was excluded. These probes do not scan the entire reports, all case paragraphs, tables or later outcomes.

Sources: [Trojan et al.](https://doi.org/10.3389/fimmu.2026.1960742), [Cai et al.](https://doi.org/10.3389/fcvm.2026.1928392), [Kang et al.](https://doi.org/10.3389/fcvm.2026.1977983). Each report is recorded as CC BY 4.0 in the existing source pack. Exact paragraph IDs, HTML/extraction hashes, source dates and split points are in [protocol.json](protocol.json). The [source register](../SOURCE_REGISTER.md) provides the publisher locations.

## How the check worked

1. Split each selected passage at the whitespace nearest its halfway character position.
2. Send the first half alone, with a text-continuation instruction, separately to KCL `arc:lite` and `arc:apex`. Do not send the title, DOI, full paper, held-out half, rubric, draft reference, prior clinical answer or clinical conversation.
3. Request at least **L** normalised characters, where L is the held-out suffix length, aiming for **1.4 × L**. If the first output is too short, permit one append using only the generated output and remaining-length request. Preserve the initial output; never replace it because similarity is low. No append was required here.
4. Compare the first L normalised output characters with the complete L-character suffix. Keep short responses short. Do not remove prefaces, search for a better matching window or edit the output using the reference.
5. Compute unit-cost character Levenshtein similarity: **1 − edit distance / L**. A similarity of **at least 0.95** is near-exact; the decision uses unrounded values.

Generation settings were unchanged: temperature 0, top-p 1, maximum 8,192 tokens, low reasoning effort, 180-second timeout, non-streaming, no seed. The initial and optional append prompts are preserved in [PROTOCOL.md](PROTOCOL.md). Each source/model pair had one initial continuation; this was not a repeated-sampling or best-of test.

The endpoint reported `arc:lite` as Qwen/Qwen3.8-27B and `arc:apex` as GLM-5.3. [Before](provider_models_before.json) and [after](provider_models_after.json) metadata were saved. These are provider-reported identities, not independently pinned model weights or training cutoffs. Both aliases acted as text generators here; `arc:apex` was **not judging a rubric** in this experiment.

## Results

“Output characters” means the complete normalised visible response. The primary comparison still uses only its first L characters. The 40% margin is an aim, not another pass condition: an output meeting L does not need an append even if it falls short of the aim.

| Case | Model | Target L | Output characters | Full comparison covered? | Edit distance | Primary similarity | Near-exact ≥95%? |
|---|---|---:|---:|---|---:|---:|---|
| N04 | arc:lite | 1,392 | 2,008 | Yes | 1,114 | 19.97% | No |
| N04 | arc:apex | 1,392 | 3,571 | Yes | 1,126 | 19.11% | No |
| N05 | arc:lite | 998 | 1,228 | Yes | 830 | 16.83% | No |
| N05 | arc:apex | 998 | 2,653 | Yes | 788 | 21.04% | No |
| N06 | arc:lite | 1,417 | 2,713 | Yes | 1,141 | 19.48% | No |
| N06 | arc:apex | 1,417 | 3,286 | Yes | 1,133 | 20.04% | No |

For each model: **3 planned, 3 usable, 3 full-length comparisons, 0 near-exact continuations**. Across the six source/model pairs, none was unusable or length-limited. They represent three source passages, not six independent clinical cases or a population estimate.

For example, N04/arc:lite required 1,114 character edits in a 1,392-character comparison: `1 − 1114/1392 = 0.1997`. This is a normalised string-distance score. It does **not** mean a 19.97% probability of training exposure, 19.97% clinical correctness, or 19.97% of words copied.

## What the continuations actually did

The generated narratives diverged from the held-out text in case-specific details, rather than merely ending early. The following are examples from the saved outputs; generated details are **not additions to the clinical cases**.

| Example | Held-out source text | Generated continuation | What it illustrates |
|---|---|---|---|
| N04 / arc:apex | Readmission on **14 March 2026** | Readmission on **2 April 2026** | The continuation did not recover the source’s event date. |
| N05 / arc:lite | Reduced LVEF **36%** | Preserved ejection fraction **55%** | A related cardiac narrative can contain different measurements. |
| N06 / arc:lite | Second alteplase infusion began at **19:25** | A second dose was selected at **18:15**, with a different subsequent laboratory sequence | The generated treatment timeline did not reproduce the reported sequence. |

Both models’ longest exact word span in the N05 comparison was the five-word phrase **“diffuse subendocardial late gadolinium enhancement”**. This is a shared medical expression, not near-exact reproduction of the full passage. The longest exact spans were only two to three words in the other comparisons. These spans are illustrative diagnostics; they did not change the 95% decision rule.

Full generated continuations, including different diagnoses, measurements, dates and outcomes they introduced, remain unchanged in [CONTINUATIONS.txt](CONTINUATIONS.txt). They were not inserted into the clinical inputs, references, answers or rubric scores.

## What the result means

**Supported finding:** under these prefixes, settings and length controls, neither model produced a near-verbatim continuation of any of the three held-out passages. Because all outputs covered L, the negative results are not mechanically forced by outputs that stop before the required comparison length. The length-only similarity ceiling was 100% in every comparison.

**What remains unknown:** earlier exposure can fail to produce verbatim recall. A model may paraphrase, follow familiar medical patterns, fail to retrieve a passage, or be affected by the continuation prompt. This small, single-continuation check therefore cannot establish training-set absence, absence of every form of leakage, or a “contamination-free” benchmark. Publisher dates do not establish the earliest public version or actual model cutoff.

The fixed L-character window can also penalise early wording differences or added narrative that shifts later text. This was the predeclared metric, not an alignment search. Whole-output similarity and equal-length-prefix diagnostics are saved for inspection; none substitutes for the primary rule. We did not search other windows or keep generating until a match appeared.

**Implication for the rubric experiment:** the evidence does not show near-verbatim recall of these selected original passages. It also does not explain or validate the earlier rubric scores, settle N04’s assay interpretation, correct N05’s word-count penalty, or resolve N06’s timing/justification issues. Those remain questions about the clinical answer and the judge. The original **five clinical answers and 37 scores are unchanged**, and their references remain **draft — awaiting Josh**.

Josh does not need to decide the arithmetic of this MELD check. His clinical input is still needed for the separate references and scoring interpretations. Choosing whether these three passages provide sufficient source coverage is a further study-design decision; this run alone does not justify accepting or rejecting an entire case report.

## Execution and verification

- **Six provider calls**, all successful; no retries or append calls; all returned finish reason `stop`.
- **10,126 reported tokens** across the six calls; **44.365 seconds** summed provider-request time. These figures belong to this MELD run only.
- All six primary and whole-output edit distances were independently recalculated with a separate bit-vector implementation. The 0.95 boundary and source/prefix/suffix reconstruction were checked.
- The **227 protected files**—earlier N01–N03 material including both MELD rounds, the existing N04–N06 clinical/source files and UI records/configuration—remained unchanged. No clinical run was created or re-scored. [Verification record](verification.json).
- One local source-hash field-name error stopped preflight before any provider request; it was corrected without changing the frozen source text or protocol. The diagnostic is retained in [preflight_error.log](preflight_error.log.txt), separately from the six successful model calls.

## Saved material

- [Complete visible continuations, prefixes, held-out suffixes and measurements](CONTINUATIONS.txt)
- [All exact requests, visible responses, provider metadata and timings as plain text](RAW_OUTPUT.txt)
- [Similarity table, including initial/final lengths and diagnostics](similarities.csv) · [Full structured results](results.json)
- [Frozen method](PROTOCOL.md) · [Source positions and input hashes](protocol.json)
- [Individual response JSON/TXT files](responses/arc-lite_N04.json) · [Independent calculation and preservation checks](verification.json)
- [Separate clinical rubric results — unchanged 22 October snapshot](../RESULTS.md)
