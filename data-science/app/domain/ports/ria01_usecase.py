from abc import ABC, abstractmethod


class RIA01UseCase(ABC):
    @abstractmethod
    def train(self, df):
        pass

    @abstractmethod
    def predict(self, data_dict):
        pass
