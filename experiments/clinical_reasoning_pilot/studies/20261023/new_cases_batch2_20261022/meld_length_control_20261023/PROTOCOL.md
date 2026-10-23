# N04–N06 original-text MELD check: frozen protocol

Prepared 23 October 2026. Clinical references and rubric scores are outside this experiment.

The previous length-controlled method is reused: one original source passage per case, half supplied as a prefix and half withheld locally. Two model aliases receive independent requests; no clinical conversation is replayed.

| Case | Source location | Prefix chars | Suffix chars L | Minimum / aim chars | Aim words |
|---|---|---:|---:|---:|---:|
| N04 | Case descriptions, 2.1 Case 1: first three prose paragraphs, before Table 1; first patient only. | 1399 | 1392 | 1392 / 1949 | 262 |
| N05 | Methods and results, Clinical presentation and imaging findings: opening three prose paragraphs, before Figure 1. | 1003 | 998 | 998 / 1398 | 168 |
| N06 | Case description, Therapeutic intervention: five consecutive prose paragraphs from initial 20-mg dose rationale through the UFH restart/transition account, before Follow-up and outcomes. | 1415 | 1417 | 1417 / 1984 | 292 |

## Source and length rules

Use only the selected original paragraphs, not the adapted UI summaries. Blocks, HTML/text hashes, raw joined prose, normalised source and both halves are saved before generation. Only Unicode NFKC and whitespace are normalised. Preserve punctuation, digits, citations and source medical wording. NFKC can flatten superscript characters; this is unchanged from the previous round.

Split at the whitespace nearest the halfway character position; the earlier position wins a tie. Ask for at least L normalised output characters and aim for 1.4 × L. If the first non-empty output is short, append once using the first output as conversation history; the append request supplies a remaining character count, never reference text. Keep initial and final metrics separately. If still short, retain and flag it. Never regenerate because similarity is low.

## Models and scoring

arc:lite and arc:apex; temperature 0; top_p 1; max_tokens 8192; reasoning_effort low; stream false; timeout 180 seconds; no seed. Up to three saved attempts per stage for technical/empty-response failures only.

Primary similarity: 1 − unit-cost character Levenshtein distance / L, comparing the first L normalised output characters with the complete L-character suffix. A shorter output stays short. Near-exact means similarity ≥ 0.95, checked before rounding. There is no best-window search, echo removal or reference-guided output correction. Whole-output similarity, equal-length-prefix similarity and longest exact word span are diagnostics, not alternative positive rules.

## Exact initial system prompt

```text
Complete the following case-report text from the exact point where it stops. Return only the most likely original continuation, without repeating the supplied text, adding headings, quoting the prompt, or explaining your approach. This is a text-continuation task. Generate at least {target_chars} characters of continuation text after repeated whitespace is collapsed. Aim for about {aim_chars} characters (approximately {aim_words} whitespace-separated words). This is a minimum-length request, not a maximum. If the next sentence or paragraph ends before the minimum is reached, continue the case narrative. Do not pad, repeat, add a preface, or discuss the requested length.
```

## Exact optional append prompt

```text
Continue immediately after the end of your previous continuation. Append new case-report text only; do not revise, repeat or summarise what you already wrote. Write about {append_words} further words and at least {remaining_chars} further characters of text. Do not add headings, a preface, padding, or comments about the length.
```

## Interpretation and separation

A high near-exact continuation is a signal to investigate text familiarity or leakage; it does not identify the path of exposure. Below-threshold continuations do not prove the paper is absent from training. These six pairs are not a contamination prevalence estimate. Clinical quality and rubric validity are not measured by this check. The source-reports' dates do not establish model cutoffs or earliest public versions.

[Nori et al., Section 6.2 and Appendix B](https://arxiv.org/abs/2303.13375v2). The local method paper and previous frozen protocol remain unchanged. Exact implementation settings and source locations: [protocol.json](protocol.json).
