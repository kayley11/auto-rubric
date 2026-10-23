# Original-text continuation check: results and meaning

**Neither backend produced a near-exact continuation of any of the three selected source passages in this round.** `arc:lite` had 0 near-exact matches out of 3 usable probes; `arc:apex` also had 0 out of 3. All six calls returned visible continuations. This is a result of a small **MELD-inspired screen**; prior exposure remains undetermined.

[Frozen procedure](PROTOCOL.md) · [Full prefixes, withheld targets and continuations](CONTINUATIONS.txt) · [Similarity table](similarities.csv) · [Machine-readable results](results.json)

## 1. What was tested

The question was whether the models could reproduce the **wording of the original published reports** from their first halves. The test did not ask for a clinical answer and did not use Josh’s rubric.

Each report supplied one case-narrative excerpt, chosen before any continuation was requested:

- **N01:** 440 words from the chemotherapy-course paragraphs in Ohkuma et al.’s report, including both cycles and the later sodium recovery. PDF page furniture and figure captions were removed; clinical prose was not rewritten. [Original excerpt](probes/N01.source.txt).
- **N02:** 408 words from Dai et al.’s opening case description through the EEG finding, stopping before imaging. [Original excerpt](probes/N02.source.txt).
- **N03:** 250 words from Chen et al.’s initial presentation and laboratory findings, stopping before the first figure. [Original excerpt](probes/N03.source.txt).

The source citations, extraction offsets, cleaning changes and hashes are recorded in [protocol.json](protocol.json). All are attributed CC BY 4.0 reports. These excerpts are different from the shortened clinical task inputs. Source statements were preserved for text comparison, including statements that would still need clinical checking if used as a scoring reference.

The two aliases were tested separately in six independent requests, with temperature 0, top-p 1 and low reasoning effort. Each request contained only a fixed continuation instruction and that passage’s prefix. The held-out suffix, source title/DOI, previous answer, clinical reference and rubric were absent. No retrieval or other tool was supplied. Provider metadata reported `Qwen/Qwen3.8-27B` behind `arc:lite` and `GLM-5.3` behind `arc:apex`, both NVFP4, in the [before](provider_models_before.json) and [after](provider_models_after.json) snapshots. An exact deployed weights revision and its training cutoffs remain unverified.

Here `arc:apex` also generates a continuation; it does not judge the text. The similarities are calculated locally by the saved Python script.

## 2. Similarities

The **primary** similarity is character Levenshtein similarity after NFKC/whitespace normalisation, comparing the target with the first L output characters, where L is the target length. Short outputs remain short. Case, punctuation, spelling and digits are retained. No preface is stripped and no best-matching window is searched. The full-output column uses the entire continuation as a separate diagnostic.

| Case | Model alias | Primary similarity | Whole-output similarity | Output / target characters | Near-exact ≥95%? |
|---|---|---|---|---|---|
| N01 | `arc:lite` | 24.71% | 24.71% | 1335 / 1485 | No |
| N02 | `arc:lite` | 27.14% | 27.14% | 1111 / 1496 | No |
| N03 | `arc:lite` | 25.97% | 25.97% | 800 / 847 | No |
| N01 | `arc:apex` | 23.37% | 28.25% | 1798 / 1485 | No |
| N02 | `arc:apex` | 25.27% | 25.27% | 1330 / 1496 | No |
| N03 | `arc:apex` | 28.81% | 28.81% | 754 / 847 | No |

For example, `arc:lite` N01 required **1118 character edits** to match a 1485-character target: `1 − 1118/1485 = 24.71%`. Its length shortfall was 150 characters, so the edit count is much greater than that shortfall alone. This percentage describes this text-distance calculation. It is **not** a probability of training exposure, a percentage of correct medical content, or a clinical rubric score.

Five outputs ended before the target character horizon; all six finished with API reason `stop`, not `length`. Shortness reduces the primary similarity, and all five short outputs were too short to reach 95% even if every generated character had matched. For N01 `arc:apex`, the complete output was longer than the target; its primary comparison used the predeclared first 1485 characters. The full-output score is shown rather than substituted for the primary score.

Thus the negative screen has a length-related sensitivity limitation. It is also accompanied by clear content differences, as the examples below show; low similarity is not explained by typography alone.

## 3. What the continuations actually did

| Case | Withheld source text contains | `arc:lite` continuation | `arc:apex` continuation |
|---|---|---|---|
| N01 | Cycle-1 urine output 0.768–2.489 L/day; subsequent cycle-2 details and later recovery | Writes urine output 1.2–1.8 L/day, different urinary results and a new treatment/delay story | Writes urine output 2.5–3.5 L/day, different results and a four-cycle course |
| N02 | BP 142/87, pulse 83, BMI 19.5, then the reported nocturnal glucose, insulin/C-peptide and EEG findings | Writes BP 138/86, pulse 78, BMI 24.3 and different investigations and pathology | Writes BP 145/90, pulse 78, BMI 27.8 and different investigations and pathology |
| N03 | pH 7.183, PaCO2 50.1, magnesium 15.8 mg/dL and the other initial findings | Writes pH 7.28 and PaCO2 58, then a botulism narrative | Writes pH 7.28 and pCO2 52, then an herbal-tea/toxicology narrative |

The longest exact contiguous word spans were only **3–4 words**, such as “with a pH of” or “within normal limits.” These ordinary clinical phrases are not long source-specific reproductions. This word-span diagnostic was specified in advance and does not determine the threshold result.

The continuations contain newly generated clinical details. They are predictions in a text-completion experiment, **not additional patient facts, clinical recommendations or new case references**. They have not been copied into the UI cases or used to change any rubric grade. Their medical accuracy is not measured by the MELD similarity.

## 4. What this supports, and what it does not establish

The supported statement is:

> In a pre-specified six-probe original-text continuation screen, neither provider-reported backend reproduced a selected held-out passage at character similarity ≥0.95. The observed continuations differed substantially in wording and case details. Prior exposure remains undetermined.

This follows the distinction in [Nori et al.’s MELD discussion](https://arxiv.org/abs/2303.13375v2): failure to elicit a match does not establish absence from training. The current character-horizon/chat adaptation has not itself been calibrated for sensitivity or false-positive rate on clinical reports.

- **It does not show that the cases were never seen.** Exposure may exist without verbatim recall; a model may paraphrase, fail on this prefix, stop early or express remembered information differently. One passage and one successful call per source/model do not test all those possibilities.
- **It does not certify post-training publication.** That requires evidence about the actual deployed model’s pretraining/post-training cutoff and the case’s earliest public version. The six completions do not supply those dates.
- **It does not validate or invalidate the clinical rubric scores.** Textual reproduction and clinical reasoning are different measurements. The previous 28 grades, answers and draft references were left unchanged.
- **It does not rank the models for contamination.** Differences such as 25% versus 29% on these three passages are not calibrated probabilities. Generic medical language and output length influence edit similarity.

Had a model produced a long near-exact continuation, that would have justified checking source familiarity and possible leakage. It still would not, by itself, identify a training stage, prove membership in a particular corpus, or establish that clinical scores were inflated. Shared public versions, prompt leakage and distinctive versus boilerplate matches would need inspection.

The current case status is therefore **“recent-publication candidate; no near-exact continuation detected in this screen; exposure unverified.”** It is not a contamination-free label or an automatic exclusion decision.

## 5. Execution record and next checks

The procedure was frozen at **2026-10-22T14:31:18.863717+00:00**, before the first request. The fixed protocol, exact halves, complete visible outputs and API metadata are saved. All six probes succeeded on their first attempt: **5,140 reported tokens**, **23.694 seconds summed request time**, approximately **25.7 seconds** from first request start to last completion. There were no failed calls, retries, API length truncations or unusable probes.

The [environment record](environment.json) stores pre-run hashes of the clinical output files, input/reference JSON, rubric and UI case library. Those hashes were checked again after the probes and were unchanged. Clinical reference status remains draft.

Useful next checks are to obtain the actual model-version/cutoff evidence and, if a stronger recall study is needed, predefine additional original passages, a length-control condition and suitable known-positive controls. Those would be new conditions with separate outputs; none has been silently added to this round. The present result can be reported alongside the clinical pilot as an exposure screen, without modifying its grades or claiming that all contamination has been ruled out.
