import unittest

from src.content.ocr_policy import needs_ocr


class OcrPolicyTests(unittest.TestCase):
    def test_skips_ocr_for_readable_text_layer(self) -> None:
        text = "This page contains enough searchable text to identify the document and its subject matter."

        self.assertFalse(needs_ocr(text, min_alnum_chars=30, min_alnum_ratio=0.5))

    def test_requests_ocr_for_empty_or_low_quality_text_layer(self) -> None:
        self.assertTrue(needs_ocr("", min_alnum_chars=30, min_alnum_ratio=0.5))
        self.assertTrue(needs_ocr("### --- !!!", min_alnum_chars=30, min_alnum_ratio=0.5))

