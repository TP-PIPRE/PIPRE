from pydantic import BaseModel


class RIA01Input(BaseModel):
    attempts: int
    errors: int
    logical_level: str
    ai_interactions: float


class RIA03Input(BaseModel):
    logical_level: str
    inactive_days: int
    ai_interactions: float
    attempts: int
