import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from evidence_annotations import EvidenceAnnotations, digest


class EvidenceAnnotationTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.store = EvidenceAnnotations(Path(self.tmp.name))
        answer = "🙂 Fixed answer text. The result is unknown."
        quote = "The result is unknown."
        start = len(answer[: answer.index(quote)].encode("utf-16-le")) // 2
        self.body = {
            "context": {
                "answer_key": "saved/a",
                "answer_sha256": digest(answer),
                "case_id": "B03",
                "item_id": "D1",
                "reason_sha256": digest("Reason"),
                "rubric_sha256": digest("Rubric"),
                "rubric_version": "v1",
            },
            "answer": answer,
            "reason": "Reason",
            "rubric_text": "Rubric",
            "annotation_id": "manual-1",
            "reviewer": "R01",
            "note": "Check the uncertainty against the saved anchor.",
            "status": "awaiting_review",
            "origin": "manual",
            "selectors": [{"start": start, "end": start + len(quote), "quote": quote}],
        }

    def tearDown(self):
        self.tmp.cleanup()

    def test_utf16_source_and_reference_status(self):
        result = self.store.save(self.body, "workspace")
        note = result["annotations"][0]
        self.assertEqual(note["selectors"], self.body["selectors"])
        self.assertEqual(note["clinical_reference_status"], "awaiting confirmation")
        self.assertTrue(note["does_not_change_score"])

    def test_revisions_do_not_overwrite_earlier_notes(self):
        first = self.store.save(self.body)
        self.body.update(note="An amended review note.", status="checked")
        second = self.store.save(self.body)
        self.assertEqual(second["saved_revisions"], 2)
        self.assertEqual(second["annotations"][0]["revision_count"], 2)
        self.assertEqual(len(list(Path(self.tmp.name).rglob("*.json"))), 2)
        self.assertEqual(first["annotations"][0]["status"], "awaiting_review")

    def test_source_change_and_fabricated_quote_rejected(self):
        self.body["selectors"][0]["quote"] = "A fabricated source quotation."
        with self.assertRaises(ValueError):
            self.store.save(self.body)
        self.body["answer"] = "A different answer."
        with self.assertRaises(ValueError):
            self.store.save(self.body)

    def test_context_key_is_canonical(self):
        result = self.store.save(self.body)
        expected = digest(json.dumps(self.body["context"], sort_keys=True, separators=(",", ":")))
        self.assertEqual(result["context_id"], expected)
        self.assertEqual(self.store.read(expected)["saved_revisions"], 1)

    def test_invalid_context_and_reviewer_rejected(self):
        with self.assertRaises(ValueError):
            self.store.read("../other")
        self.body["reviewer"] = "Not a reviewer / id"
        with self.assertRaises(ValueError):
            self.store.save(self.body)


if __name__ == "__main__":
    unittest.main()
