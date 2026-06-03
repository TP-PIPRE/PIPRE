import joblib

from app.domain.ports.model_repository import ModelRepository


class JoblibModelRepository(ModelRepository):
    def __init__(self, path):
        self.path = path

    def exists(self) -> bool:
        return self.path.exists()

    def load(self):
        return joblib.load(self.path)

    def save(self, model) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(model, self.path)
