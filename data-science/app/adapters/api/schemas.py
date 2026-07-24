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


class RIA05Input(BaseModel):
    expected_result: dict[str, object]
    obtained_result: dict[str, object]
    robot_position: Optional[dict[str, float] | list[float]] = None
    sensor_states: dict[str, object] = Field(default_factory=dict)
    instructions_used: list[str | dict[str, object]] = Field(
        default_factory=list,
        max_length=1_000,
    )
    collisions: int | list[object] = Field(default=0)
    interruption_step: Optional[int] = Field(default=None, ge=0)
    completion_ratio: Optional[float] = Field(default=None, ge=0, le=1)


class RIA05Response(BaseModel):
    result: str
    error_type: str
    error_label: str
    confidence: float
    requires_review: bool
    reasons: list[str]
    probabilities: dict[str, float]
    feature_values: dict[str, float]
    details: dict[str, object]


class RIA05BatchInput(BaseModel):
    executions: list[RIA05Input] = Field(min_length=1, max_length=500)


class RIA06Input(BaseModel):
    student_id: Optional[str] = Field(default=None, max_length=100)
    student_name: Optional[str] = Field(default=None, max_length=200)
    activity_frequency: float = Field(ge=0, le=10_000)
    average_session_minutes: float = Field(ge=0, le=1_440)
    inactive_days: float = Field(ge=0, le=365)


class RIA06BatchInput(BaseModel):
    students: list[RIA06Input] = Field(min_length=1, max_length=500)


class RIA06ModelQuality(BaseModel):
    quality_status: str
    quality_label: str
    quality_explanation: str
    recommended_use: str
    selected_clusters: int
    silhouette: Optional[float] = None
    davies_bouldin: Optional[float] = None
    calinski_harabasz: Optional[float] = None
    stability_ari: Optional[float] = None
    stability_std: Optional[float] = None
    stability_valid_iterations: int = 0
    stability_method: str
    active_features: list[str]
    excluded_features: list[str]
    model_run_id: Optional[str] = None
    model_version: str
    feature_schema_version: str
    trained_at: Optional[str] = None
    accuracy: Optional[float] = None
    metrics_note: str


class RIA06SegmentComparison(BaseModel):
    metric_label: str
    student_value: float
    segment_center: float
    difference: float
    status: str
    status_label: str
    student_display: str
    segment_display: str
    message: str


class RIA06AssignmentInterpretation(BaseModel):
    level: str
    label: str
    explanation: str
    technical_note: str


class RIA06TeacherSuggestion(BaseModel):
    priority: str
    title: str
    actions: list[str]


class RIA06StudentResult(BaseModel):
    student_id: Optional[str] = None
    student_name: Optional[str] = None
    model_run_id: str
    model_version: str
    feature_schema_version: str
    trained_at: str
    raw_cluster: int
    profile_key: str
    segment_id: str
    segment_uid: str
    segment_name: str
    segment_description: str
    assignment_typicality: float
    assignment_margin: float
    assignment_ambiguous: bool
    nearest_cluster_distance: float
    second_cluster_distance: float
    segment_sample_size: int
    typicality_reference_size: int
    typicality_method: str
    typicality_small_sample_warning: bool
    out_of_distribution: bool
    review_reasons: list[str]
    assignment_interpretation: RIA06AssignmentInterpretation
    requires_review: bool
    teacher_summary: str
    reasons: list[str]
    feature_values: dict[str, float]
    segment_comparison: dict[str, RIA06SegmentComparison]
    teacher_suggestion: RIA06TeacherSuggestion
    model_quality: RIA06ModelQuality
    training_period: dict[str, object]
    technical_details: dict[str, object]
    details: dict[str, object]


class RIA06Response(RIA06StudentResult):
    result: str


class RIA06BatchSummary(BaseModel):
    total_students: int
    segment_counts: dict[str, int]
    segments: list[dict[str, object]]
    model_quality: RIA06ModelQuality


class RIA06BatchResponse(BaseModel):
    summary: RIA06BatchSummary
    students: list[RIA06StudentResult]


class RIA07Input(BaseModel):
    student_id: Optional[str] = None
    student_name: Optional[str] = None
    attempts: int = Field(ge=0)
    errors: int = Field(ge=0)
    score: float = Field(ge=0, le=100)
    inactive_days: int = Field(ge=0)
    completed_activities: int = Field(ge=0)
    success_rate: Optional[float] = Field(default=None, ge=0, le=1)
    help_requested: int = Field(ge=0)


class RIA07BatchInput(BaseModel):
    students: list[RIA07Input] = Field(min_length=1, max_length=500)


class RIA08Input(BaseModel):
    attempts: int
    errors: int
    ai_interactions: float
    inactive_days: int
    help_requested: int
    completed_activities: int
    grade: int
    logical_level: str


class RIA08MetricComparison(BaseModel):
    student_value: float
    grade_average: float
    difference: float
    status: str


class RIA08GradeComparison(BaseModel):
    grade: int | float
    reference_scope: str
    metrics: dict[str, RIA08MetricComparison]


class RIA08TeacherSuggestion(BaseModel):
    title: str
    summary: str
    priority: str
    actions: list[str]
    review_after_activities: int
    based_on_reasons: list[str]


class RIA08Details(BaseModel):
    pedagogical_profile: str
    pedagogical_risk: str
    confidence: float
    grade_comparison: RIA08GradeComparison
    reasons: list[str]
    teacher_suggestion: RIA08TeacherSuggestion


class RIA08Response(BaseModel):
    result: str
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    details: RIA08Details


class RIA09Input(BaseModel):
    attempts: int
    errors: int
    ai_interactions: float
    inactive_days: int
    help_requested: int
    completed_activities: int
    age: int
    grade: int
    logical_level: str


class RIA10Input(BaseModel):
    student_id: Optional[str] = Field(default=None, max_length=100)
    student_name: Optional[str] = Field(default=None, max_length=200)
    errors: int = Field(ge=0, le=100_000)
    attempts: int = Field(ge=0, le=100_000)
    ai_interactions: float = Field(ge=0, le=100_000)
    help_requested: int = Field(ge=0, le=100_000)
    completed_activities: int = Field(ge=0, le=100_000)
    inactive_days: int = Field(ge=0, le=36_500)
    age: int = Field(ge=5, le=100)
    grade: int = Field(ge=1, le=20)
    logical_level: str = Field(min_length=1, max_length=30)
    detected_emotion: str = Field(min_length=1, max_length=50)

    @field_validator("logical_level", "detected_emotion")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not normalized:
            raise ValueError("value must not be empty")
        return normalized


class RIA10Details(BaseModel):
    model_version: str
    target_source: str
    metrics_note: str


class RIA10Response(BaseModel):
    result: str
    student_id: Optional[str] = None
    student_name: Optional[str] = None
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    details: RIA10Details


class RIA10BatchInput(BaseModel):
    students: list[RIA10Input] = Field(min_length=1, max_length=500)


class RIA10BatchStudentResult(BaseModel):
    result: str
    student_id: Optional[str] = None
    student_name: Optional[str] = None


class RIA10BatchSummary(BaseModel):
    total_students: int
    quality_counts: dict[str, int]
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    metrics_note: str


class RIA10BatchResponse(BaseModel):
    summary: RIA10BatchSummary
    students: list[RIA10BatchStudentResult]
