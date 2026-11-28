import unittest

from rapidocr import ModelType, OCRVersion
from src.agentic.rapid_ocr_worker import create_ocr_engine


class RapidOcrWorkerTests(unittest.TestCase):
    def test_configures_pp_ocr_v6_small_for_vietnamese(self) -> None:
        engine = create_ocr_engine(cpu_threads=3)

        self.assertIs(engine.cfg.Det.ocr_version, OCRVersion.PPOCRV6)
        self.assertIs(engine.cfg.Det.model_type, ModelType.SMALL)
        self.assertEqual(engine.cfg.Det.lang_type, "vi")
        self.assertIs(engine.cfg.Rec.ocr_version, OCRVersion.PPOCRV6)
        self.assertIs(engine.cfg.Rec.model_type, ModelType.SMALL)
        self.assertEqual(engine.cfg.Rec.lang_type, "vi")
        self.assertEqual(engine.cfg.EngineConfig.onnxruntime.intra_op_num_threads, 3)
        self.assertEqual(engine.cfg.EngineConfig.onnxruntime.inter_op_num_threads, 1)
