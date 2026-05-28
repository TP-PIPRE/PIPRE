from app.domain.ports.pipeline_usecase import PipelineUseCase


class PipelineIA(PipelineUseCase):

    def __init__(self, ria1, ria3, ria8, ria11, ria12):
        self.ria1 = ria1
        self.ria3 = ria3
        self.ria8 = ria8
        self.ria11 = ria11
        self.ria12 = ria12

        self._trained = False

    def train(self, df):
        self.ria1.train(df)

        self.ria3.train(df)

        self.ria8.train(df)

        self.ria11.train(df)
        self.ria12.train(df)

        self._trained = True

    def get_models(self):
        return self.ria1, self.ria3, self.ria8, self.ria11, self.ria12
