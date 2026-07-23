from typing import Optional

from pydantic import BaseModel, Field, field_validator


class RIA01Input(BaseModel):
    attempts: int
    errors: int
    logical_level: str
    ai_interactions: float


class RIA02Input(BaseModel):
    code: str = Field(max_length=20_000)
    language: str = Field(default="python", min_length=1, max_length=30)
    errors: list[str] = Field(default_factory=list, max_length=100)
    attempts: int = Field(ge=0, le=1_000)
    score: Optional[float] = Field(default=None, ge=0, le=100)
    success_rate: Optional[float] = Field(default=None, ge=0, le=1)
    previous_errors: list[str] = Field(default_factory=list, max_length=100)
    logical_level: str = Field(min_length=1, max_length=20)
    activity_objective: str = Field(default="", max_length=1_000)

    @field_validator("language")
    @classmethod
    def normalize_language(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("logical_level")
    @classmethod
    def normalize_logical_level(cls, value: str) -> str:
        aliases = {
            "low": "bajo",
            "basic": "bajo",
            "basico": "bajo",
            "básico": "bajo",
            "medium": "medio",
            "intermediate": "medio",
            "intermedio": "medio",
            "high": "alto",
            "advanced": "alto",
            "avanzado": "alto",
        }
        normalized = value.strip().lower()
        normalized = aliases.get(normalized, normalized)
        if normalized not in {"bajo", "medio", "alto"}:
            raise ValueError("logical_level must be bajo, medio or alto")
        return normalized

    @field_validator("success_rate", mode="before")
    @classmethod
    def normalize_success_rate(cls, value):
        if value is None or value == "":
            return None
        number = float(value)
        if 1 < number <= 100:
            return number / 100
        return number

    @field_validator("errors", "previous_errors")
    @classmethod
    def clean_error_messages(cls, values: list[str]) -> list[str]:
        cleaned = []
        for value in values:
            message = str(value).strip()
            if not message:
                continue
            if len(message) > 500:
                raise ValueError("each error message must contain at most 500 characters")
            cleaned.append(message)
        return cleaned


class RIA02Evidence(BaseModel):
    errors_count: int
    attempts: float
    error_threshold: float
    attempt_threshold: float
    recurrent_errors_count: int
    final_score_used_for_decision: bool


class RIA02Details(BaseModel):
    needs_feedback: bool
    feedback_type: str
    priority: str
    risk_score: int
    risk_cutoff: int
    reasons: list[str]
    recurrent_errors: list[str]
    code_complexity: str
    suggestions: list[str]
    evidence: RIA02Evidence
    input_warnings: list[str]
    llm_context: dict[str, object]


class RIA02Response(BaseModel):
    result: str
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1: Optional[float] = None
    details: RIA02Details


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
