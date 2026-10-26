"""Prevent report-routing regressions without generating clinical facts or API calls."""

# ruff: noqa: E402 -- Standalone local application.

import sys
from copy import deepcopy
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import patient_matching as matching
import study


def case(case_id, model="arc-apex"):
    row = study.interview(case_id, model)
    return {"case_id": case_id, "facts": row["examiner_only_inventory"]}, row


def no_records(*args):
    return [], [], []


def test_original_n04_question_resolves_admission_and_preserves_source_context():
    c, row = case("N04_INITIAL")
    turn = row["turns"][2]
    original = deepcopy(turn)
    _, records, _ = matching.select_with_context(
        c,
        turn["doctor_output"],
        set(turn["visible_fact_ids_before_question"]),
        no_records,
        row["turns"][:2],
    )
    assert [f["id"] for f in records] == ["N04_INITIAL_F05"]
    assert records[0]["period"] == "initial"
    assert records[0] == next(f for f in c["facts"] if f["id"] == "N04_INITIAL_F05")
    assert turn == original


def test_broad_imaging_can_return_only_the_selected_first_admission_modality():
    c, row = case("N04_INITIAL")
    turn = row["turns"][1]
    _, records, _ = matching.select_with_context(
        c, turn["doctor_output"], set(turn["visible_fact_ids_before_question"]), no_records
    )
    assert {f["id"] for f in records} == {"N04_INITIAL_F04", "N04_INITIAL_F03b"}
    assert all(f["period"] == "initial" for f in records)


def test_ambiguous_admission_is_not_guessed_and_absent_mri_is_not_substituted():
    c, _ = case("N04_INITIAL")
    d = {"question": "What did infection tests on that admission show?", "topics": []}
    history = [{"question": "How did the first admission and readmission differ?"}]
    assert matching.select_with_context(c, d, set(), no_records, history)[1] == []
    d = {"question": "May I see the first admission brain MRI?", "topics": []}
    assert matching.select_with_context(c, d, set(), no_records)[1] == []


def test_named_unavailable_report_is_not_described_as_a_broad_request():
    c, row = case("N02", "arc-lite")
    d = row["turns"][4]["doctor_output"]

    def unavailable(*args):
        return [], [], ["A broad tests request releases no results."]

    patient, records, feedback = matching.select_with_context(c, d, set(), unavailable)
    assert not patient and not records
    assert not any("broad tests request" in text for text in feedback)
    assert any("not available in the selected materials" in text for text in feedback)


def test_repeating_the_same_record_request_does_not_release_a_new_batch():
    c, row = case("N04_INITIAL")
    d = row["turns"][2]["doctor_output"]
    result = matching.select_with_context(c, d, {"N04_INITIAL_F05"}, no_records, row["turns"][:2])
    assert result[1] == []


def test_discharge_medication_request_does_not_receive_inpatient_steroid_record():
    c, _ = case("N04_INITIAL")
    question = (
        "Were any new medications started at discharge or since returning home "
        "that could explain the tremor?"
    )
    d = {"question": question, "topics": ["medications"], "action": "ask"}
    patient, records, feedback = matching.select_with_context(c, d, set(), no_records)
    assert not patient and not records
    assert any("Inpatient treatment is not substituted" in note for note in feedback)


def test_treatment_response_question_does_not_release_unasked_initial_symptoms():
    c, _ = case("N04_INITIAL")
    d = {
        "question": (
            "What treatment or medicines were you given during the first admission, "
            "and did they help at all before the headache came back?"
        ),
        "topics": ["medications", "timecourse"],
        "action": "ask",
    }
    patient, records, _ = matching.select_with_context(c, d, set(), no_records)
    assert not patient
    assert {f["id"] for f in records} == {"N04_INITIAL_F06", "N04_INITIAL_F08"}


def test_relative_to_discharge_is_a_time_question_not_a_family_question():
    c, _ = case("N04_INITIAL")
    d = {
        "question": (
            "When did this new headache start relative to your discharge, and does "
            "it improve when you lie flat? Do you also have neck stiffness, visual "
            "changes, or tinnitus?"
        ),
        "topics": ["timecourse", "presenting_symptoms"],
        "action": "ask",
    }
    patient, _, _ = matching.select_with_context(c, d, set(), no_records)
    assert {f["id"] for f in patient} == {"N04_INITIAL_F09", "N04_INITIAL_F10"}
    assert matching.own_clauses("Have any of your relatives had a similar headache?") == []


def test_question_about_what_patient_was_admitted_for_returns_initial_history():
    c, _ = case("N04_INITIAL")
    d = {
        "question": (
            "Could you tell me what you were admitted for in early March and what "
            "procedures or treatments you had during that stay?"
        ),
        "topics": ["medical_history", "medications"],
        "action": "ask",
    }
    patient, _, _ = matching.select_with_context(c, d, set(), no_records)
    assert [f["id"] for f in patient] == ["N04_INITIAL_F01"]


def test_earlier_episode_request_does_not_release_current_readmission_symptoms():
    c, _ = case("N04_INITIAL")
    d = {
        "question": (
            "Before the admission in February/March 2026, have you ever had a "
            "similar episode of severe headache with fever or neck stiffness?"
        ),
        "topics": ["previous_episodes"],
        "action": "ask",
    }
    patient, records, _ = matching.select_with_context(c, d, {"N04_INITIAL_F01"}, no_records)
    assert not patient and not records


def test_positional_onset_question_does_not_release_unasked_discharge_outcome():
    c, _ = case("N04_INITIAL")
    d = {
        "question": (
            "During your first admission, was your headache also worse when you "
            "were upright, or is this orthostatic pattern new since you were discharged?"
        ),
        "topics": ["timecourse"],
        "action": "ask",
    }
    patient, records, _ = matching.select_with_context(c, d, {"N04_INITIAL_F01"}, no_records)
    assert not patient and not records


def test_mri_for_low_csf_pressure_does_not_request_csf_laboratory_results():
    c, _ = case("N04_INITIAL")
    d = {
        "question": (
            "Has an MRI of your brain been performed during this current admission "
            "to look for signs of low CSF pressure?"
        ),
        "topics": ["mri_imaging"],
        "action": "ask",
    }
    _, records, _ = matching.select_with_context(c, d, set(), no_records)
    assert [f["id"] for f in records] == ["N04_INITIAL_F12"]
    d["question"] = "Can I review the current brain MRI and lumbar puncture cell count results?"
    _, records, _ = matching.select_with_context(c, d, set(), no_records)
    assert {f["id"] for f in records} == {"N04_INITIAL_F12", "N04_INITIAL_F14"}
