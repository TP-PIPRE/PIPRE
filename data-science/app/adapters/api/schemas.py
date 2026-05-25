from pydantic import BaseModel


class RIA01Input(BaseModel):
    intentos: int
    errores: int
    nivel_logico: str
    interacciones_ia: float
