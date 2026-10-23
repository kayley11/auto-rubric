# MELD-style continuation check: frozen procedure

Frozen before generation: **2026-10-22T14:31:18.863717+00:00**. Protocol SHA-256: `462fbddf16c4fcaa15e79fd8a19de8834dfdfe3462c57021e5461f5cc900f1c7`. The machine-readable choices are in [protocol.json](protocol.json).

## Purpose and scope

Check whether the two KCL backends used in the clinical pilot can reproduce the withheld continuation of the **original published case prose**. Each source supplies one preselected passage; each model receives one independent prefix. This gives **three passages × two models = six planned probes**. This check is separate from clinical-answer generation and Josh’s rubric scoring.

The method follows the idea in [Nori et al., Capabilities of GPT-4 on Medical Challenge Problems](https://arxiv.org/abs/2303.13375v2), section 6.2 and Appendix B. It is labelled **MELD-inspired**, because the hosted tokenizer/build cannot be pinned, the API has a reasoning budget, and the paper’s prose and pseudocode do not fully agree on the similarity/aggregation formula. All implementation choices below are fixed before seeing continuations.

## Original material

| Case / source | Excerpt words | Prefix / suffix characters | Target words | Files |
|---|---|---|---|---|
| N01 / S02 | 440 | 1482 / 1485 | 234 | [Original excerpt](probes/N01.source.txt) · [Prefix](probes/N01.prefix.txt) · [Held-out suffix](probes/N01.suffix.txt) |
| N02 / S04 | 408 | 1501 / 1496 | 188 | [Original excerpt](probes/N02.source.txt) · [Prefix](probes/N02.prefix.txt) · [Held-out suffix](probes/N02.suffix.txt) |
| N03 / S05 | 250 | 843 / 847 | 125 | [Original excerpt](probes/N03.source.txt) · [Prefix](probes/N03.prefix.txt) · [Held-out suffix](probes/N03.suffix.txt) |

- **N01 / S02:** Ohkuma et al., [germinoma chemotherapy report](https://doi.org/10.1007/s00432-026-06637-z), Case presentation, physical PDF pp. 3 and 5, three chemotherapy-course paragraphs. Remove intervening figure captions/page furniture. Join wrapped lines and the split unit `µg/day`; retain `urine-output`, join `chemo-` + `therapy-associated`. No medical rewriting.
- **N02 / S04:** Dai et al., [night-time behaviour report](https://doi.org/10.3389/fonc.2026.1959029), opening Case description through Neurophysiological Examination, stopping before Imaging Studies.
- **N03 / S05:** Chen et al., [hypermagnesaemia report](https://doi.org/10.3389/ftox.2026.1961156), first two Case description paragraphs, stopping before FIGURE 1.

All three are attributed CC BY 4.0 sources. Saved source-file hashes, exact extraction offsets and cleaning notes are in `protocol.json`. These are original case-report passages with typography normalisation, not the rewritten clinical task inputs. Medical statements in the source are preserved for a text-matching experiment and are not endorsed as clinical references.

## Input, generation and comparison

1. Apply NFKC Unicode normalisation, collapse whitespace and strip outer whitespace. Keep case, punctuation, numbers and spelling. Split at the nearest space to the character midpoint, with a fixed earlier-position tie break. Save both halves before requesting a completion.
2. Send only the prefix plus the fixed continuation instruction. Do not send the suffix, paper title/DOI, earlier clinical answer, reference, rubric or history. Use separate stateless requests for `arc:lite` and `arc:apex`, temperature 0, top-p 1 and low reasoning effort. The API cap is 8192 tokens with a 180-second timeout. No retrieval/tool definition is supplied.
3. Ask for at most the held-out suffix’s word count. Preserve the complete visible response. The **primary comparison** uses the first L normalised characters, where L is the suffix length; short responses remain short. Do not strip a prefix echo or explanatory preface, search for the best matching window, or choose among multiple successful completions.
4. Compute unit-cost character Levenshtein similarity: `1 − distance / max(reference length, comparison length)`. A result **≥ 0.95** is a near-exact continuation. Also report similarity to the entire visible output and its length, so the effect of the fixed comparison horizon is inspectable. A longest exact word span is only an illustration, not another success rule.
5. Preserve all technical attempts. Retry only transport/empty-response failures, up to three attempts with 15-second gaps. A short, prefaced or token-limited non-empty answer is recorded as the observed completion and is not retried to obtain a higher score. Unusable probes are shown separately rather than counted as evidence of non-exposure.

## Interpretation fixed before results

A long near-verbatim continuation warrants investigation of source familiarity, shared text and possible leakage. It does not establish which training stage or data source caused it, or that the clinical rubric scores were inflated. A result below threshold means this probe did not elicit near-verbatim continuation; it does not prove the model never encountered the case. Medical plausibility is a different question from textual similarity. Three passages do not establish a population contamination rate or validate the sensitivity of this adapted test.

The clinical-run files and draft references remain unchanged. The MELD results, continuations and similarity table will be saved in this folder.
