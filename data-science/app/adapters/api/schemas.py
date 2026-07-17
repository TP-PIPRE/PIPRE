from typing import Optional

from pydantic import BaseModel, Field


class RIA01Input(BaseModel):
    attempts: int
    errors: int
    logical_level: str
    ai_interactions: float


class RIA02Input(BaseModel):
    code: str
    language: str = "python"
    errors: list[str] = Field(default_factory=list)
    attempts: int
    score: Optional[float] = None
    success_rate: Optional[float] = None
    previous_errors: list[str] = Field(default_factory=list)
    logical_level: str
    activity_objective: str = ""


class RIA03Input(BaseModel):
    logical_level: str
    inactive_days: int
    ai_interactions: float
    attempts: int
    errors: Optional[int] = None
    help_requested: Optional[int] = None
    historical_attempts_avg: Optional[float] = None
    historical_errors_avg: Optional[float] = None
    historical_help_avg: Optional[float] = None
    previous_performance: Optional[str] = None


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


class RIA10Input(BaseModel):
    attempts: int
    errors: int
    ai_interactions: float
    inactive_days: int
    help_requested: int
    completed_activities: int
    grade: int
    logical_level: str


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
