import pandas as pd

from models.ria01_desempeño import ClasificadorDesempeno
from models.ria03_recomendador import RecomendadorActividades
from models.ria08_anomalias import DetectorAnomalias
from models.ria11_tiempo import ClasificadorTiempo
from models.ria12_codigo import EvaluadorCodigo


class PipelineIA:

    def __init__(self):
        self.ria1 = ClasificadorDesempeno()
        self.ria3 = RecomendadorActividades()
        self.ria8 = DetectorAnomalias()
        self.ria11 = ClasificadorTiempo()
        self.ria12 = EvaluadorCodigo()

        self._trained = False

    def train(self, df):
        self.ria1.train(df)

        self.ria3.train(df)
        self.ria3.evaluar(df)

        self.ria8.train(df)

        self.ria11.train(df)
        self.ria12.train(df)

        self._trained = True

    def get_models(self):
        return self.ria1, self.ria3, self.ria8, self.ria11, self.ria12