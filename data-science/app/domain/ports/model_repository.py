from abc import ABC, abstractmethod


class ModelRepository(ABC):
    @abstractmethod
    def exists(self) -> bool:
        pass

    @abstractmethod
    def load(self):
        pass

    @abstractmethod
    def save(self, model) -> None:
        pass
