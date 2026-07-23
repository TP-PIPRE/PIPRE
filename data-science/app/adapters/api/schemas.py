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
    topic: str
    learning_objective: str
    difficulty: str = "basic"
    allowed_blocks: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    quantity: int = Field(default=1, ge=1, le=5)
    seed: Optional[int] = None


class RIA08Input(BaseModel):
    student_id: Optional[str] = None
    student_name: Optional[str] = None
    attempts: int = Field(ge=0)
    errors: int = Field(ge=0)
    score: float = Field(ge=0, le=100)
    inactive_days: int = Field(ge=0)
    completed_activities: int = Field(ge=0)
    success_rate: Optional[float] = Field(default=None, ge=0, le=1)
    help_requested: int = Field(ge=0)


class RIA08BatchInput(BaseModel):
    students: list[RIA08Input] = Field(min_length=1, max_length=500)


class RIA10Input(BaseModel):
    attempts: int
    errors: int
    ai_interactions: float
    inactive_days: int
    help_requested: int
    completed_activities: int
    grade: int
    logical_level: str


class RIA10MetricComparison(BaseModel):
    student_value: float
    grade_average: float
    difference: float
    status: str


class RIA10GradeComparison(BaseModel):
    grade: int | float
    reference_scope: str
    metrics: dict[str, RIA10MetricComparison]


class RIA10TeacherSuggestion(BaseModel):
    title: str
    summary: str
    priority: str
    actions: list[str]
    review_after_activities: int
    based_on_reasons: list[str]


class RIA10Details(BaseModel):
    pedagogical_profile: str
    pedagogical_risk: str
    confidence: float
    grade_comparison: RIA10GradeComparison
    reasons: list[str]
    teacher_suggestion: RIA10TeacherSuggestion


class RIA10Response(BaseModel):
    result: str
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    details: RIA10Details


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
