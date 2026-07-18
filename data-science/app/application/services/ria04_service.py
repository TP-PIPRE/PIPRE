class RIA04Service:
    MODEL_VERSION = "ria04-v2-generator"

    def __init__(self, model):
        self.model = model
        self._trained = False

    def set_model(self, model):
        self.model = model
        self._trained = True

    def train(self, df):
        self.model.train(df)
        self.model.model_version = self.MODEL_VERSION
        self._trained = True

    def predict(self, data_dict):
        if not self._trained:
            raise RuntimeError("Model is not trained")

        generation = self.model.predict_detailed(data_dict)

        return {
            "result": generation["status"],
            "accuracy": None,
            "precision": None,
            "details": {
                "technique": generation["technique"],
                "challenges": generation["challenges"],
                "operational_metrics": generation["operational_metrics"],
            },
        }
