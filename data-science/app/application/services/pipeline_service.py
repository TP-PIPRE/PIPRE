from app.domain.ports.pipeline_usecase import PipelineUseCase


class PipelineIA(PipelineUseCase):

    MODEL_NAMES = tuple(f"ria{number}" for number in range(1, 11))

    def __init__(
        self,
        ria1,
        ria2,
        ria3,
        ria4,
        ria5,
        ria6,
        ria7,
        ria8,
        ria9,
        ria10,
    ):
        self.ria1 = ria1
        self.ria2 = ria2
        self.ria3 = ria3
        self.ria4 = ria4
        self.ria5 = ria5
        self.ria6 = ria6
        self.ria7 = ria7
        self.ria8 = ria8
        self.ria9 = ria9
        self.ria10 = ria10

        self._trained = False
        self.load_errors = {}

    def train(self, df):
        self.ria1.train(df)

        self.ria2.train(df)

        self.ria3.train(df)

        self.ria4.train(df)

        self.ria5.train(None)
        self.ria6.train(df)
        self.ria7.train(df)
        self.ria8.train(df)
        self.ria9.train(df)
        self.ria10.train(df)

        self._trained = True

    def load_or_train(self, df, repositories, expected_versions=None):
        """Carga modelos persistidos y entrena solo los ausentes o incompatibles."""
        expected_versions = expected_versions or {}
        status = {}
        self.load_errors = {}

        for name in self.MODEL_NAMES:
            current_model = getattr(self, name)
            repository = repositories[name]
            expected_version = expected_versions.get(name)

            try:
                if not repository.exists():
                    raise FileNotFoundError("modelo no persistido")

                loaded_model = repository.load()
                if not isinstance(loaded_model, type(current_model)):
                    raise TypeError(
                        f"tipo incompatible: {type(loaded_model).__name__}"
                    )
                if (
                    expected_version is not None
                    and getattr(loaded_model, "model_version", None)
                    != expected_version
                ):
                    raise ValueError("version incompatible")

                setattr(self, name, loaded_model)
                status[name] = "loaded"
            except Exception as exc:
                self.load_errors[name] = f"{type(exc).__name__}: {exc}"
                training_data = None if name == "ria5" else df
                current_model.train(training_data)
                if expected_version is not None:
                    current_model.model_version = expected_version
                repository.save(current_model)
                status[name] = "trained"

        self._trained = True
        return status

    def get_models(self):
        return (
            self.ria1,
            self.ria2,
            self.ria3,
            self.ria4,
            self.ria5,
            self.ria6,
            self.ria7,
            self.ria8,
            self.ria9,
            self.ria10,
        )
