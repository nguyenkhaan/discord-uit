import unittest
from uuid import UUID

from pydantic import ValidationError

from src.contract.classification_event import (
    ClassificationCompletedEvent,
    ClassificationRequestedEvent,
    Suggestion,
)


def requested_payload() -> dict[str, object]:
    return {
        "schemaVersion": "v1",
        "eventId": "00000000-0000-0000-0000-000000000001",
        "classificationRunId": "run_1",
        "documentId": "00000000-0000-0000-0000-000000000002",
        "submissionId": "00000000-0000-0000-0000-000000000003",
        "mediaId": "00000000-0000-0000-0000-000000000004",
        "file": {
            "fileName": "notes.txt",
            "mimeType": "text/plain",
            "sizeBytes": 5,
            "verifiedEtag": "etag-1",
        },
        "signedGetUrl": {
            "value": "http://localhost:9000/private/notes.txt?token=secret",
            "expiresAt": "2026-11-27T12:00:00Z",
        },
        "taxonomy": {
            "version": "v1",
            "collectionSlugs": ["cloud-computing"],
            "tagSlugs": ["java"],
        },
        "attempt": 1,
        "occurredAt": "2026-11-27T11:00:00Z",
    }


class ClassificationEventContractTests(unittest.TestCase):
    def test_parses_backend_camel_case_request_and_keeps_signed_url_private(self) -> None:
        event = ClassificationRequestedEvent.model_validate(requested_payload())

        self.assertEqual(event.classification_run_id, "run_1")
        self.assertEqual(event.file.size_bytes, 5)
        self.assertIn("secret", str(event.signed_get_url.value))

    def test_rejects_unknown_fields_and_non_positive_attempt(self) -> None:
        payload = requested_payload()
        payload["unexpected"] = True
        payload["attempt"] = 0

        with self.assertRaises(ValidationError):
            ClassificationRequestedEvent.model_validate(payload)

    def test_serializes_output_using_backend_camel_case_contract(self) -> None:
        output = ClassificationCompletedEvent(
            classification_run_id="run_1",
            document_id=UUID("00000000-0000-0000-0000-000000000002"),
            submission_id=UUID("00000000-0000-0000-0000-000000000003"),
            media_id=UUID("00000000-0000-0000-0000-000000000004"),
            model_id="model-v1",
            ocr_text="plain text",
            ocr_needed=False,
            collection_suggestions=[],
            tag_suggestions=[],
            attempt=1,
        )

        payload = output.model_dump(by_alias=True)

        self.assertIn("classificationRunId", payload)
        self.assertIn("ocrText", payload)
        self.assertNotIn("classification_run_id", payload)

    def test_rejects_non_finite_or_out_of_range_confidence(self) -> None:
        for confidence in (float("nan"), float("inf"), -0.01, 1.01):
            with self.subTest(confidence=confidence):
                with self.assertRaises(ValidationError):
                    Suggestion(slug="cloud-computing", confidence=confidence)

