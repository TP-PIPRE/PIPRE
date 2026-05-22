import pandas as pd

from app.domain.ports.dataset_repository import DatasetRepository


class ExcelDatasetRepository(DatasetRepository):
    def __init__(self, path):
        self.path = path

    def load(self):
        return pd.read_excel(self.path)
