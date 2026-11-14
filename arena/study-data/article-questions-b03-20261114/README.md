# B03 article-to-multiple-questions output

One published patient, two saved sets of seven adapted question/reference drafts. The revised set has parent code `CASE-ECFDA9DAB9` and question IDs Q01–Q07. The set is still unconfirmed; it did not replace the existing B03 case or its model answers and scores. Clinical references remain **awaiting confirmation** and automatic evidence associations **awaiting review**.

Source: *Olmesartan-associated enteropathy presenting as severe malnutrition*, [BMJ Case Reports, DOI 10.1136/bcr-2026-275970](https://casereports.bmj.com/content/19/10/e275970).

- [Findings and workflow](../../validation/20261114-article-questions/FINDINGS.md)
- [All seven revised question drafts, visible facts, references and source positions](../../validation/20261114-article-questions/B03_QUESTIONS.md)
- [Complete saved output](complete-output.zip): immutable canonical article text; all four LangExtract request/response attempts; both question-generation requests and responses; original and repaired extraction drafts; saved revisions; exact source repairs; execution metadata and the failed live-fetch record.
- [Integrity manifest](MANIFEST.json): archive SHA-256, every member's SHA-256 and original byte count. Members preserve their saved bytes.

The live publisher request returned HTTP 403. The run used the earlier verified publisher HTML snapshot, retaining its original hash and canonical text; it did not bypass publisher access. Table/image-only material still requires source review. The original publisher HTML remains preserved in the local source archive; the ZIP contains its canonical text and provenance rather than publisher website scripts.

Read the ZIP without rerunning models: `python -m zipfile -e complete-output.zip extracted`. No API key is needed. Source intervals address the exact saved canonical text. A position match verifies location, not clinical correctness. All generated review checks are false. The isolated browser confirmation used for technical validation was not copied into the production library.

No credentials, private member records, login settings, production databases, Site write credentials or deployment bundles are included. The local originals remain intact.
