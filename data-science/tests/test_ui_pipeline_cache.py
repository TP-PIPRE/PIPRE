from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.application.services.pipeline_service import PipelineIA


MODEL_NAMES = ("ria1", "ria2", "ria3", "ria4", "ria8", "ria11", "ria12")


class FakeModel:
    def __init__(self, version="v1"):
        self.model_version = version
        self.train_calls = 0

    def train(self, df):
        self.train_calls += 1


class FakeRepository:
    def __init__(self, model=None):
        self.model = model
        self.saved = None

    def exists(self):
        return self.model is not None

    def load(self):
        return self.model

    def save(self, model):
        self.saved = model
        self.model = model


class UIPipelineCacheTest(unittest.TestCase):
    def create_pipeline(self):
        models = {name: FakeModel() for name in MODEL_NAMES}
        return PipelineIA(
            ria1=models["ria1"],
            ria2=models["ria2"],
            ria3=models["ria3"],
            ria4=models["ria4"],
            ria8=models["ria8"],
            ria11=models["ria11"],
            ria12=models["ria12"],
        )

    def test_all_compatible_models_are_loaded_without_training(self):
        pipeline = self.create_pipeline()
        repositories = {
            name: FakeRepository(FakeModel("v1")) for name in MODEL_NAMES
        }

        status = pipeline.load_or_train(
            object(),
            repositories,
            {name: "v1" for name in MODEL_NAMES},
        )

        self.assertEqual(set(status.values()), {"loaded"})
        self.assertTrue(pipeline._trained)
        self.assertFalse(pipeline.load_errors)
        self.assertTrue(
            all(getattr(pipeline, name).train_calls == 0 for name in MODEL_NAMES)
        )

    def test_only_missing_or_incompatible_models_are_trained(self):
        pipeline = self.create_pipeline()
        repositories = {
            name: FakeRepository(FakeModel("v1")) for name in MODEL_NAMES
        }
        repositories["ria4"] = FakeRepository()
        repositories["ria12"] = FakeRepository(FakeModel("old"))

        status = pipeline.load_or_train(
            object(),
            repositories,
            {name: "v1" for name in MODEL_NAMES},
        )

        self.assertEqual(status["ria4"], "trained")
        self.assertEqual(status["ria12"], "trained")
        self.assertEqual(getattr(pipeline, "ria4").train_calls, 1)
        self.assertEqual(getattr(pipeline, "ria12").train_calls, 1)
        self.assertEqual(getattr(pipeline, "ria12").model_version, "v1")
        self.assertEqual(
            {name for name, value in status.items() if value == "loaded"},
            set(MODEL_NAMES) - {"ria4", "ria12"},
        )


if __name__ == "__main__":
    unittest.main()
