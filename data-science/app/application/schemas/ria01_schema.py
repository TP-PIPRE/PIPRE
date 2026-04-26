from pydantic import BaseModel

class RIA01Input(BaseModel):
    tiempo_sesion_min: float
    intentos: int
    errores: int
    nivel_logico: str
    uso_codigo: float
    interacciones_ia: float