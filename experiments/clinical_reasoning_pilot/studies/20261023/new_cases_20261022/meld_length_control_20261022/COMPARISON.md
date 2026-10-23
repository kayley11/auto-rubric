# Original-text continuation check: length control and two-round comparison

**The length problem was resolved in this round: all six continuations covered the full comparison length on their first call. Neither model reproduced a held-out passage at the 95% near-exact threshold.** The new primary similarities were 20.19%–24.32%, compared with 23.37%–28.81% in the first round; every source/model pair had a lower similarity in the new round.

The first round remains unchanged. This is a separate MELD-inspired text-continuation experiment. It does not change the three clinical answers, their 28 rubric grades or the draft clinical reference notes. Similarity measures resemblance to the published wording; it is neither a clinical score nor a probability that the text was in training. A negative continuation screen leaves prior exposure undetermined.

[New complete visible outputs](CONTINUATIONS.txt) · [Paired comparison CSV](comparison.csv) · [Frozen procedure](PROTOCOL.md) · [First-round report](../meld_20261022/RESULTS.md)

## 1. Why the first round needed a length check

For each selected passage, the original text was split into a prefix and a held-out suffix. The model received the prefix and tried to continue it. The primary similarity compared the continuation's first **L characters** with the entire original suffix, where L is that suffix's length after the fixed Unicode and whitespace normalisation.

Five of the six first-round continuations stopped before L. The old instruction said **“Write up to … words”**: it specified a maximum rather than a minimum, and a word count did not guarantee the required character count. All six API responses reported `stop`, rather than `length`. Raising the already generous 8,192-token cap would therefore not directly address the observed early stopping.

A short response can be unable to reach the near-exact threshold regardless of its content. For example, the N02 `arc:lite` target contained 1,496 characters, but the model returned 1,111. At least 385 insertions would be needed to obtain a string of the target length. Even if every returned character were correct, its maximum possible primary similarity would be:

```text
1 − 385 / 1496 = 1111 / 1496 = 74.26%
```

This is an upper bound imposed by length, not a revised score for that response. Its actual similarity was 27.14%. The five short outputs all had a length-only ceiling below 95%, so none could have passed the first-round threshold. This is a limitation of the first-round screen.

It does **not** follow that making a new continuation longer must increase its measured similarity. Additional or newly generated wording can differ from the source too. The second round was designed to remove the length shortfall and inspect the resulting text, rather than to obtain a higher score.

## 2. What changed, and what stayed fixed

The same three source excerpts and the exact same prefix/suffix files were reused. The selected material was:

| Case | Original report and selected passage | Held-out suffix |
|---|---|---:|
| N01 — sodium disturbance during chemotherapy | [Ohkuma et al.](https://doi.org/10.1007/s00432-026-06637-z), the chemotherapy-course paragraphs, including the two cycles and later recovery | 1,485 characters; 234 words |
| N02 — nocturnal behaviours and hypoglycaemia | [Dai et al.](https://doi.org/10.3389/fonc.2026.1959029), opening case description through the EEG finding, before imaging | 1,496 characters; 188 words |
| N03 — acute weakness and initial laboratory findings | [Chen et al.](https://doi.org/10.3389/ftox.2026.1961156), the first two case-description paragraphs, before the first figure | 847 characters; 125 words |

These are excerpts of the original reports, not the shortened clinical prompts used for rubric scoring. Source wording was retained for text comparison, including source statements that are not independently endorsed as clinical reference points. The attributed reports are CC BY 4.0; extraction locations, cleaning and hashes remain in [protocol.json](protocol.json).

### The revised length instruction

The continuation instruction still asked for the most likely original continuation, without repeating the prefix, adding headings or explaining the approach. Its length clause changed to:

> Generate at least {target_chars} characters of continuation text after repeated whitespace is collapsed. Aim for about {aim_chars} characters (approximately {aim_words} whitespace-separated words). This is a minimum-length request, not a maximum. If the next sentence or paragraph ends before the minimum is reached, continue the case narrative. Do not pad, repeat, add a preface, or discuss the requested length.

The minimum was L. The approximate aim was 1.4 × L characters and 1.4 × the original suffix word count, rounded upwards. This buffer allowed for imperfect length following; it was not a new similarity target. Exact requests are saved in the six response JSON files.

If a first non-empty response remained short, the pre-specified procedure allowed **one append-only continuation**, triggered solely by length. It would keep the earlier output unchanged, provide the model with its own generated text and ask it to continue. It would never provide the original suffix, replace an unsuccessful output or select whichever attempt matched best. Initial-only and assembled results would be reported separately. **No append was needed in this run.**

### The unchanged comparison

- Both aliases, `arc:lite` and `arc:apex`, generated continuations. Neither acted as a rubric judge in this experiment.
- Each initial request contained the same original prefix and a continuation instruction. It contained no source title or DOI, held-out suffix, clinical reference, rubric, earlier clinical model answer or retrieval tool.
- Sampling remained temperature 0, top-p 1, low reasoning effort, 8,192 maximum tokens, non-streaming and a 180-second request timeout, with no seed supplied.
- Normalisation remained NFKC Unicode plus collapsed whitespace. Case, punctuation, spelling and digits remained significant.
- The primary comparison still used only the **first L output characters**. No preface, repeated text or inconvenient phrase was removed. No best-matching window was searched.
- Similarity remained `1 − character Levenshtein distance / max(compared lengths)`, with unit-cost insertion, deletion and substitution. The near-exact threshold remained inclusive at 0.95.

The new procedure was frozen at **2026-10-22 18:22:12 UTC**, before the first request at **18:22:46 UTC**. Before/after provider snapshots in both rounds reported the same backends: `Qwen/Qwen3.8-27B` for `arc:lite` and `GLM-5.3` for `arc:apex`, both NVFP4. These metadata do not establish an exact deployed weights revision or training cutoff.

## 3. Results: length coverage improved, resemblance did not

### Output length

“Output characters” counts the complete normalised visible response. The comparison length is the unchanged suffix length; characters beyond that length do not enter the primary similarity.

| Case | Model | Comparison length L | First-round output | New output | New comparison uses |
|---|---|---:|---:|---:|---:|
| N01 | `arc:lite` | 1,485 | 1,335 | 2,313 | First 1,485 |
| N02 | `arc:lite` | 1,496 | 1,111 | 2,331 | First 1,496 |
| N03 | `arc:lite` | 847 | 800 | 1,291 | First 847 |
| N01 | `arc:apex` | 1,485 | 1,798 | 3,120 | First 1,485 |
| N02 | `arc:apex` | 1,496 | 1,330 | 3,756 | First 1,496 |
| N03 | `arc:apex` | 847 | 754 | 1,862 | First 847 |

Full-length coverage increased from **1/6 to 6/6**. Each new response met the minimum on its first call. Outputs also exceeded the approximate 40% buffer, especially with `arc:apex`; the new instruction controlled the minimum more successfully than the exact output length.

All six new responses reported `stop`. None reported a token-limit finish, required a transport retry or triggered an append. One visible output, N03 `arc:apex`, nevertheless ended in the unfinished phrase **“along with a rising creatinine consistent...”**. That is how the provider returned it; it has not been completed or repaired. Its first 847 characters were available, so the pre-specified comparison could still be calculated. The ending's cause is unknown.

### Primary similarity: the same comparison in both rounds

Changes below are **percentage points**, not relative percentage changes. Each row refers to the same source passage and model alias in both rounds.

| Case | Model | First round | New round | Change | New near-exact ≥95%? |
|---|---|---:|---:|---:|---|
| N01 | `arc:lite` | 24.71% | 21.68% | −3.03 | No |
| N02 | `arc:lite` | 27.14% | 22.59% | −4.55 | No |
| N03 | `arc:lite` | 25.97% | 24.32% | −1.65 | No |
| N01 | `arc:apex` | 23.37% | 21.35% | −2.02 | No |
| N02 | `arc:apex` | 25.27% | 20.19% | −5.08 | No |
| N03 | `arc:apex` | 28.81% | 23.14% | −5.67 | No |

Both models had **0 near-exact matches / 3 usable passages / 3 planned passages** in each round. None of the six paired results crossed the threshold. These are three passages, two models and two prompting conditions, not 12 independent clinical cases.

For a concrete calculation, the new N01 `arc:lite` output required 1,163 character edits within the fixed 1,485-character comparison:

```text
1 − 1163 / 1485 = 21.68%
```

The complete new output contained 2,313 characters, but its last 828 characters did not enter this primary calculation. Writing more text therefore did not automatically improve the score.

### A separate check on the five old short outputs

To inspect whether their low similarity depended only on the missing tail, a diagnostic compared the first K characters of the saved output with the first K characters of the original suffix, where K was the shorter available length. This introduces no new model call and searches no alternative position.

| Old short output | Output / target characters | Length-only ceiling for original primary score | Equal-length prefix diagnostic |
|---|---:|---:|---:|
| N01 `arc:lite` | 1,335 / 1,485 | 89.90% | 23.00% |
| N02 `arc:lite` | 1,111 / 1,496 | 74.26% | 19.89% |
| N03 `arc:lite` | 800 / 847 | 94.45% | 23.50% |
| N02 `arc:apex` | 1,330 / 1,496 | 88.90% | 21.65% |
| N03 `arc:apex` | 754 / 847 | 89.02% | 24.54% |

The old outputs still differed substantially from the source within the portions they did generate. Missing the tail was therefore not their only mismatch. This diagnostic uses a shorter target and is **not** a replacement MELD score or a new threshold test. It must not be substituted for the historical primary results.

Whole-output similarities are also retained in [similarities.csv](similarities.csv) and [comparison.json](comparison.json). They are secondary: comparing all of a deliberately longer response with a shorter target changes the comparison length and can reward or penalise different alignments. The fixed-L column above is the main paired comparison.

## 4. What changed in the actual continuations

The differences below are text observations against the held-out excerpts. They do not judge the clinical safety of the generated stories. Relevant numerical differences appear within the primary comparison windows. Later narrative developments are described separately and were not all included in the score.

### N01 — chemotherapy and sodium disturbance

The prefix stopped at **“Recorded daily urine”**. The original continuation began:

> output during cycle 1 ranged from 0.768 to 2.489 L/day. At the sodium nadir, spot urinary sodium was 22.8 mEq/L and urine osmolality was 176 mOsm/kg

| Detail | Original suffix | First round | New round |
|---|---|---|---|
| `arc:lite`: initial urine output | 0.768–2.489 L/day | 1.2–1.8 L/day | 1.2–1.8 L/day |
| `arc:lite`: urinary sodium | 22.8 mEq/L at the nadir | 120–185 mEq/L | 85–110 mEq/L |
| `arc:apex`: initial urine output | 0.768–2.489 L/day | 2.5–3.5 L/day | 1,100–1,800 mL/day |
| `arc:apex`: urinary sodium | 22.8 mEq/L at the nadir | 84.2 mEq/L | 78.2 mEq/L |

The longer new responses continued into different treatment and chemotherapy-course narratives. For example, the new `arc:lite` text describes dose reduction and later cycles, whereas the held-out source describes the cycle-2 high-output pattern, withdrawal of cisplatin and ifosfamide, and later recovery. These are differences in generated events and numbers, beyond a failure to reach the required length.

The N01 `arc:lite` longest exact contiguous span in the fixed window was only four words, **“mEq/L, and urine osmolality”**. The new `arc:apex` span was three words, **“spot urinary sodium”**. These phrases do not amount to reconstruction of the original course.

Evidence: [original suffix](probes/N01.suffix.txt) · [old lite](../meld_20261022/responses/arc-lite_N01.continuation.txt) · [new lite](responses/arc-lite_N01.continuation.txt) · [old apex](../meld_20261022/responses/arc-apex_N01.continuation.txt) · [new apex](responses/arc-apex_N01.continuation.txt).

### N02 — nocturnal behaviours and hypoglycaemia

The prefix ended after a medical-history list, at **“…prior surgeries, trauma,”**. The held-out text continued **“or allergies”**, followed by the reported examination, glucose/insulin findings and EEG result. It stopped before imaging.

| Detail | Original suffix | First round | New round |
|---|---|---|---|
| `arc:lite`: blood pressure / pulse / BMI | 142/87; 83; 19.5 | 138/86; 78; 24.3 | 138/86; 72; 24.3 |
| `arc:apex`: blood pressure / pulse / BMI | 142/87; 83; 19.5 | 145/90; 78; 27.8 | 148/92; 78; 27.4 |
| `arc:lite`: insulin / C-peptide | 9.96 μU/mL; 2.32 ng/mL | 186.4 μIU/mL; 12.3 ng/mL | 42.3 μIU/mL; 4.8 ng/mL |

The new `arc:apex` text instead described low insulin and C-peptide and an alternative sleep-disorder explanation. It also repeated part of the preceding history before giving new examination details. No repeated opening was stripped to improve alignment.

Both new full responses went beyond the chosen source endpoint into investigations, management or follow-up. The `arc:lite` output supplied an insulinoma surgery/pathology story, while `arc:apex` supplied a sleep-apnoea and dietary-management story. Those later stories are visible in the full outputs, but they are not all within the first 1,496 characters. The relevant matching target here remains the originally selected excerpt, not another medically plausible case ending.

The longest exact spans in the two new fixed windows were four words each: **“Cranial nerve examination was”** and **“5/5 in all limbs,”**. These are routine examination phrases.

Evidence: [original suffix](probes/N02.suffix.txt) · [old lite](../meld_20261022/responses/arc-lite_N02.continuation.txt) · [new lite](responses/arc-lite_N02.continuation.txt) · [old apex](../meld_20261022/responses/arc-apex_N02.continuation.txt) · [new apex](responses/arc-apex_N02.continuation.txt).

### N03 — acute weakness and laboratory results

The prefix ended at **“…mixed respiratory and”**. The original continuation began with metabolic acidosis and the specific initial results:

| Detail | Original suffix | First-round lite / apex | New lite / apex |
|---|---|---|---|
| pH | 7.183 | 7.28 / 7.28 | 7.28 / 7.28 |
| PaCO₂, mmHg | 50.1 | 58 / 52 | 52 / 52 |
| Bicarbonate, mEq/L | 18.4 | 22 / 18 | 18 / 16 |
| Magnesium, mg/dL | 15.8 | Not reproduced | Not reproduced |

The new `arc:lite` continuation developed a botulism narrative; the new `arc:apex` continuation developed a botulinum-toxin/colchicine narrative. Neither reproduced the held-out initial laboratory sequence. The source's magnesium result was absent from both complete new outputs, as well as from their fixed comparison windows.

The new `arc:lite` output did start with the six-word exact span **“metabolic acidosis, with a pH of”**. The following pH value was different from the original. This illustrates why a familiar short phrase should not be treated as long, source-specific reproduction. Its primary similarity was 24.32%, not a near-exact match.

The new `arc:apex` output's unfinished final phrase is retained as described above. It does not justify inventing a missing ending or omitting the saved result.

Evidence: [original suffix](probes/N03.suffix.txt) · [old lite](../meld_20261022/responses/arc-lite_N03.continuation.txt) · [new lite](responses/arc-lite_N03.continuation.txt) · [old apex](../meld_20261022/responses/arc-apex_N03.continuation.txt) · [new apex](responses/arc-apex_N03.continuation.txt).

## 5. How to interpret the two rounds

**What this round establishes:** the revised instruction elicited enough visible text for the full, unchanged character comparison in all six requests. The first-round length-only obstacle was absent. Within those full windows, none of the new continuations closely reproduced the original wording or numerical sequence. The new longest exact spans were 3–6 words, compared with 3–4 in the first round, and remained short routine clinical phrases.

**Why the lower scores are not a causal result about length:** the model generated new text under a changed instruction. The prompt and the realised continuation changed together; these were not the five original short strings with their exact missing endings recovered. Even temperature 0 does not make these two different prompts the same experiment. One new call per source/model pair cannot separate a length-instruction effect from changed content or variation between calls. The negative paired changes should therefore be reported as observations, not evidence that requesting more text reduces memorisation.

**What remains unresolved:** this is still a small MELD-inspired check, with a character-horizon/chat adaptation and no calibrated sensitivity or false-positive rate for these hosted models and case reports. It is not an exact reproduction of the original token-length procedure. The original [MELD discussion](https://arxiv.org/html/2303.13375v2) also distinguishes detecting a near-exact match from excluding prior exposure when no match appears. Its reported properties cannot simply be transferred to this adaptation.

A supported description of the present result is:

> With the same three source excerpts, both models produced sufficiently long continuations in the length-controlled round. Neither reproduced a held-out suffix at the pre-specified 0.95 character-similarity threshold. Prior exposure remains undetermined.

The comparison does not establish which model is less exposed, whether a particular report was absent from training, or whether any clinical rubric grade was inflated. The next methodological evidence would be a verified deployed-model revision/cutoff and suitable independently specified control material; more output length alone does not resolve those questions.

## 6. Resources, preservation and saved files

| Measure | First round | New round | Difference |
|---|---:|---:|---:|
| Usable source/model pairs | 6 | 6 | 0 |
| Provider attempts | 6 | 6 | 0 |
| Append calls | 0 | 0 | 0 |
| Failed attempts | 0 | 0 | 0 |
| Provider-reported total tokens | 5,140 | 13,252 | +8,112 |
| Sum of request times | 23.694 s | 59.395 s | +35.701 s |
| First request start to last response, approximately | 25.686 s | 59.465 s | +33.779 s |

Usage was returned for every request. These are provider-reported total tokens, including any reasoning tokens included in that total; they are not visible-word counts or a monetary estimate. The longer round used about 2.58 times the reported tokens of the first round without changing the near-exact classification.

The [preservation manifest](preservation_manifest.json) records hashes captured before this round. All **43 first-round files** and **16 clinical experiment/configuration files** remained byte-for-byte unchanged, including the original outputs, scores, reference notes, UI rubric and UI case library. The new continuations have not been added to the clinical inputs or references.

The [verification record](verification.json) also records an independent recalculation of the 12 primary distances using a Myers bit-vector implementation, distinct from the runner's two-row dynamic programme. All matched the saved results. The exact prefix/suffix bytes, pre-call protocol timing, fixed windows, request parameters, absence of the held-out suffix from requests, backend metadata and reported token totals were checked. The saved experiment text was checked for the configured API key; none was present.

| File | Contents |
|---|---|
| [CONTINUATIONS.txt](CONTINUATIONS.txt) | Source attribution, exact prefix, held-out target, every complete visible new output and its measurements, as plain text |
| [comparison.csv](comparison.csv) | Six paired rows with old/new lengths, similarities and changes |
| [comparison.json](comparison.json) | Unrounded paired measurements, initial-only results, length ceilings and diagnostics |
| [results.json](results.json) / [similarities.csv](similarities.csv) | New-round results and resource totals |
| [PROTOCOL.md](PROTOCOL.md) / [protocol.json](protocol.json) | Frozen procedure, prompts, limits, source provenance and input hashes |
| [run_meld_length_control.py](run_meld_length_control.py.txt) | Separate runner; preserves completed responses and can rebuild the new tables with `--analyse-only` |
| [verification.json](verification.json) | Independent numerical and preservation checks |
| [First-round complete outputs](../meld_20261022/CONTINUATIONS.txt) | Unchanged historical prefixes, targets and continuations |

The per-response JSON files retain exact requests, response/model identifiers, visible content, finish reasons, timings and usage. Credentials and hidden deliberation fields are excluded. Clinical reference status remains **draft / awaiting confirmation**.
