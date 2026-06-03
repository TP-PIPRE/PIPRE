from abc import ABC, abstractmethod


class PipelineUseCase(ABC):
    @abstractmethod
    def train(self, df):
        pass

    @abstractmethod
    def get_models(self):
        pass
