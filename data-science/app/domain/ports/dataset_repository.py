from abc import ABC, abstractmethod


class DatasetRepository(ABC):
    @abstractmethod
    def load(self):
        pass
