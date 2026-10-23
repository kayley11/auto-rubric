# MELD-inspired check: length-controlled round

Protocol frozen: 2026-10-22T18:22:12.762411+00:00
SHA-256: `ecd8353eac05c7de0454a014f26fac2a0d56d421f21e105ab84feaa919b50552`

## Question

Did the first round end too early to provide a fair full-length continuation comparison? This round asks for enough visible text to cover the same held-out suffix, then compares the same fixed character window. It does not run or revise the clinical rubric experiment.

## What stays the same

- Three selected original passages (N01/S02, N02/S04, N03/S05), exact prefix/suffix files and source provenance.
- Two model aliases: arc:lite and arc:apex. Backend metadata is checked before and after this round.
- Temperature 0, top_p 1, max_tokens 8192, reasoning_effort low, non-streaming, 180-second request timeout; no seed.
- Unicode NFKC and whitespace normalisation, preserving spelling, punctuation, case and digits.
- Primary comparison: first L output characters against all L held-out suffix characters. Short outputs remain short. No output trimming other than the fixed endpoint, no best-match search, no reference-guided repair.
- Unit-cost character Levenshtein similarity = 1 − distance / maximum compared length; inclusive near-exact threshold 0.95.
- The suffix stays local. No title, DOI, reference answer, rubric, source retrieval or earlier clinical model answer enters a request.

## What changes

The old prompt asked for "up to" the suffix word count. The new prompt requires at least L normalised characters and aims for 40% more text. The API token cap stays unchanged because all first-round responses ended with stop, not length.

| Case | Reference suffix L (characters) | Minimum output characters | Aim characters | Approximate aim words |
|---|---:|---:|---:|---:|
| N01 | 1485 | 1485 | 2079 | 328 |
| N02 | 1496 | 1496 | 2095 | 264 |
| N03 | 847 | 847 | 1186 | 175 |

### Initial system prompt

```text
Complete the following case-report text from the exact point where it stops. Return only the most likely original continuation, without repeating the supplied text, adding headings, quoting the prompt, or explaining your approach. This is a text-continuation task. Generate at least {target_chars} characters of continuation text after repeated whitespace is collapsed. Aim for about {aim_chars} characters (approximately {aim_words} whitespace-separated words). This is a minimum-length request, not a maximum. If the next sentence or paragraph ends before the minimum is reached, continue the case narrative. Do not pad, repeat, add a preface, or discuss the requested length.
```

The user message is the unchanged original prefix only.

### One bounded append, only if needed

Keep the first non-empty output. If it has fewer than L normalised characters, append at most once using the same conversation, which now contains the generated first output. This is an append, not a replacement. The append target is max(120, ceil(1.4 × remaining character gap × suffix words / L)) words. The request contains only the remaining length, never the reference text. If it is still short, retain and flag it.

```text
Continue immediately after the end of your previous continuation. Append new case-report text only; do not revise, repeat or summarise what you already wrote. Write about {append_words} further words and at least {remaining_chars} further characters of text. Do not add headings, a preface, padding, or comments about the length.
```

Preserve initial-only and final assembled metrics separately. An appended result has a different context from a single-call probe and is labelled accordingly. No call is repeated because similarity is low; no best output is selected.

## Saved records and comparison

All requests, complete visible outputs, response IDs, finish reasons, reported usage, timings and errors are saved. Hidden deliberation fields and credentials are excluded. Missing/empty or HTTP/transport failures can be retried at most three times per stage, with 15 seconds between failed attempts. Non-empty responses are retained, including length or format violations.

Compare six source/model pairs, not six independent patients or a contamination prevalence estimate. Report original and new output lengths, coverage, primary similarities, paired changes, append use, finish reasons and resources. Whole-output similarity is diagnostic because the new prompt deliberately requests extra text; it is not a fair main comparison.

To examine first-round shortness without new calls, additionally compare the first K characters of both reference and saved output, with K=min(L, output length). This equal-length prefix diagnostic is not the original primary metric and is not used for threshold classification. The length-only similarity ceiling is min(output length,L)/L.

One fresh generation is collected per pair. Differences in prompt wording, output content and independent model generation occur together; the paired similarity change cannot be assigned entirely to length control.

## Preservation

The complete first-round directory and clinical source/answer/score/reference/UI files are hashed before this round. Their bytes must remain unchanged. New files stay in this directory. Clinical reference notes remain draft.

## Meaning of the test

This is a MELD-inspired original-text continuation check, not an exact reproduction or a validated training-membership detector. A near-exact result would be evidence to investigate text familiarity or leakage. No near-exact result does not exclude prior exposure. The provider aliases do not establish an exact model revision or training cutoff.

Method source: [Nori et al., Capabilities of GPT-4 on Medical Challenge Problems, Section 6.2 and Appendix B](https://arxiv.org/abs/2303.13375v2).
Local method snapshot: [PDF](https://arxiv.org/abs/2303.13375), [extracted text](https://arxiv.org/abs/2303.13375).
