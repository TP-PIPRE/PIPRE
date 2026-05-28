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


class RIA04Input(BaseModel):
    score: float
    success_rate: float
    errors: int
    attempts: int
    help_requested: int
    completed_activities: int
    inactive_days: int
    logical_level: str


class RIA08Input(BaseModel):
    attempts: int
    errors: int
    score: float
    inactive_days: int


class RIA11Input(BaseModel):
    attempts: int
    errors: int
    ai_interactions: float
    inactive_days: int
    help_requested: int
    completed_activities: int
    age: int
    grade: int
    logical_level: str
