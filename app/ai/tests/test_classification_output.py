import unittest
import json
from datetime import datetime, timezone
from unittest.mock import AsyncMock, Mock, patch

import httpx
from pydantic import ValidationError

from src.agentic.llm import GroqClassificationClient
from src.agentic.output_schema import ClassificationRecommendations
from src.agentic.workflow import process_classification_request
from src.config.setting import Settings
from src.content.file_probe import ContentProcessingError
from src.content.text_extractors import ExtractedContent
from src.contract.classification_event import ClassificationRequestedEvent
from src.contract.classification_event import ClassificationCompletedEvent


class ClassificationOutputTests(unittest.TestCase):
    def test_accepts_bounded_recommendations_for_current_taxonomy(self) -> None:
        output = ClassificationRecommendations.model_validate(
            {
                "collection_suggestions": [
                    {"slug": "cloud-computing", "confidence": 0.92},
                ],
                "tag_suggestions": [
                    {"slug": "java", "confidence": 0.81},
                ],
            }
        )

        output.validate_taxonomy(
            collection_slugs={"cloud-computing", "security"},
            tag_slugs={"java", "python"},
        )

        self.assertEqual(output.collection_suggestions[0].slug, "cloud-computing")

    def test_rejects_unknown_taxonomy_slug(self) -> None:
        output = ClassificationRecommendations.model_validate(
            {
                "collection_suggestions": [
                    {"slug": "made-up-category", "confidence": 0.9},
                ],
                "tag_suggestions": [],
            }
        )

        with self.assertRaises(ValueError):
            output.validate_taxonomy(collection_slugs={"cloud-computing"}, tag_slugs=set())

    def test_rejects_confidence_outside_zero_to_one(self) -> None:
        for confidence in (-0.01, 1.01, float("inf")):
            with self.subTest(confidence=confidence), self.assertRaises(ValidationError):
                ClassificationRecommendations.model_validate(
                    {
                        "collection_suggestions": [],
                        "tag_suggestions": [{"slug": "java", "confidence": confidence}],
                    }
                )

    def test_rejects_duplicate_suggestion_and_oversized_ocr_text(self) -> None:
        with self.assertRaises(ValidationError):
            ClassificationRecommendations.model_validate(
                {
                    "collection_suggestions": [],
                    "tag_suggestions": [
                        {"slug": "java", "confidence": 0.8},
                        {"slug": "java", "confidence": 0.7},
                    ],
                }
            )

        with self.assertRaises(ValidationError):
            ClassificationCompletedEvent.model_validate(
                {
                    "schemaVersion": "v1",
                    "eventId": "00000000-0000-0000-0000-000000000001",
                    "classificationRunId": "run_1",
                    "documentId": "00000000-0000-0000-0000-000000000002",
                    "submissionId": "00000000-0000-0000-0000-000000000003",
                    "mediaId": "00000000-0000-0000-0000-000000000004",
                    "modelId": "model-v1",
                    "ocrText": "x" * 200_001,
                    "ocrNeeded": False,
                    "collectionSuggestions": [],
                    "tagSuggestions": [],
                    "attempt": 1,
                    "occurredAt": datetime.now(timezone.utc).isoformat(),
                }
            )


class ClassificationWorkflowOutputTests(unittest.IsolatedAsyncioTestCase):
    async def test_emits_canonical_event_with_trusted_identity_ocr_and_model_provenance(self) -> None:
        request = ClassificationRequestedEvent.model_validate(
            {
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
                    "value": "https://files.internal/private/notes?sig=secret",
                    "expiresAt": "2099-11-27T12:00:00Z",
                },
                "taxonomy": {
                    "version": "v1",
                    "collectionSlugs": ["cloud-computing"],
                    "tagSlugs": ["java"],
                },
                "attempt": 2,
                "occurredAt": "2026-11-27T11:00:00Z",
            }
        )
        recommendations = ClassificationRecommendations.model_validate(
            {
                "collection_suggestions": [{"slug": "cloud-computing", "confidence": 0.91}],
                "tag_suggestions": [{"slug": "java", "confidence": 0.82}],
            }
        )
        llm_client = Mock(recommend=AsyncMock(return_value=recommendations))
        settings = Settings(
            _env_file=None,
            llm_provider="groq",
            llm_model="openai/gpt-oss-20b",
            kafka_completed_topic="document.classification.completed.v1",
        )
        extracted = ExtractedContent("recognized full text", "ocr", True, 2)

        with patch(
            "src.agentic.workflow.extract_request_content",
            new=AsyncMock(return_value=extracted),
        ):
            topic, payload = await process_classification_request(
                request,
                settings,
                llm_client=llm_client,
            )

        output = ClassificationCompletedEvent.model_validate_json(payload)
        self.assertEqual(topic, "document.classification.completed.v1")
        self.assertEqual(output.classification_run_id, request.classification_run_id)
        self.assertEqual(output.document_id, request.document_id)
        self.assertEqual(output.submission_id, request.submission_id)
        self.assertEqual(output.media_id, request.media_id)
        self.assertEqual(output.attempt, 2)
        self.assertEqual(output.model_id, "groq/openai/gpt-oss-20b")
        self.assertEqual(output.ocr_text, "recognized full text")
        self.assertTrue(output.ocr_needed)
        self.assertEqual(output.collection_suggestions, recommendations.collection_suggestions)
        llm_client.recommend.assert_awaited_once()

    async def test_groq_client_requests_json_and_rejects_non_taxonomy_output(self) -> None:
        response_body = {
            "choices": [
                {
                    "message": {
                        "content": json.dumps(
                            {
                                "collection_suggestions": [
                                    {"slug": "made-up-category", "confidence": 0.9},
                                ],
                                "tag_suggestions": [],
                            }
                        ),
                    }
                }
            ]
        }
        requests: list[httpx.Request] = []

        async def handler(request: httpx.Request) -> httpx.Response:
            requests.append(request)
            return httpx.Response(200, json=response_body)

        transport_client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        classifier = GroqClassificationClient(
            Settings(_env_file=None, groq_api_key="test-key", llm_model="test-model"),
            http_client=transport_client,
        )
        try:
            with self.assertRaises(ContentProcessingError) as raised:
                await classifier.recommend(
                    "document text",
                    ["cloud-computing"],
                    ["java"],
                )
        finally:
            await transport_client.aclose()

        self.assertEqual(raised.exception.code, "INVALID_CLASSIFICATION_OUTPUT")
        request_body = json.loads(requests[0].content)
        self.assertEqual(request_body["response_format"], {"type": "json_object"})
        self.assertEqual(request_body["model"], "test-model")
