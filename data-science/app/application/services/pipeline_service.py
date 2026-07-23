from app.domain.ports.pipeline_usecase import PipelineUseCase


class PipelineIA(PipelineUseCase):

    def __init__(self, ria1, ria2, ria3, ria4, ria7, ria8, ria10, ria11, ria12):
        self.ria1 = ria1
        self.ria2 = ria2
        self.ria3 = ria3
        self.ria4 = ria4
        self.ria7 = ria7
        self.ria8 = ria8
        self.ria10 = ria10
        self.ria11 = ria11
        self.ria12 = ria12

        self._trained = False
        self.load_errors = {}

    def train(self, df):
        self.ria1.train(df)

        self.ria2.train(df)

        self.ria3.train(df)

        self.ria4.train(df)

        self.ria7.train(df)

        self.ria8.train(df)

        self.ria10.train(df)

        self.ria11.train(df)
        self.ria12.train(df)

        self._trained = True

    def load_or_train(self, df, repositories, expected_versions=None):
        """Carga modelos persistidos y entrena solo los ausentes o incompatibles."""
        expected_versions = expected_versions or {}
        status = {}
        self.load_errors = {}

        for name in (
            "ria1",
            "ria2",
            "ria3",
            "ria4",
            "ria7",
            "ria8",
            "ria10",
            "ria11",
            "ria12",
        ):
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
                current_model.train(df)
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
            self.ria7,
            self.ria8,
            self.ria10,
            self.ria11,
            self.ria12,
        )
