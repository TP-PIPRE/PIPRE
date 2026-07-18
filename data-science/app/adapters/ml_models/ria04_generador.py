from __future__ import annotations

import hashlib
from collections.abc import Mapping
from typing import Any


class GeneradorRetosProgramacion:
    """RIA-04: genera borradores de retos mediante IA simbolica.

    El generador usa conocimiento pedagogico explicito, plantillas y reglas de
    compatibilidad. No necesita datos historicos ni entrenamiento supervisado.
    Los retos siempre se entregan como borradores sujetos a revision docente.
    """

    TECHNIQUE = "sistema_experto_y_generacion_procedural_controlada"
    SUPPORTED_DIFFICULTIES = ("basic", "intermediate", "advanced")
    SUPPORTED_TOPICS = (
        "sequences",
        "loops",
        "conditionals",
        "variables",
        "general_logic",
    )

    TOPIC_ALIASES = {
        "sequences": ("secuencia", "secuencias", "orden", "pasos"),
        "loops": ("ciclo", "ciclos", "bucle", "bucles", "repetir", "repeticion"),
        "conditionals": (
            "condicional",
            "condicionales",
            "si entonces",
            "sensor",
            "obstaculo",
        ),
        "variables": ("variable", "variables", "contador", "contadores"),
    }

    DIFFICULTY_ALIASES = {
        "basic": ("basic", "basico", "basica", "bajo", "low"),
        "intermediate": ("intermediate", "intermedio", "intermedia", "medio", "medium"),
        "advanced": ("advanced", "avanzado", "avanzada", "alto", "high"),
    }

    DEFAULT_BLOCKS = {
        "sequences": ["move_forward", "turn_left", "turn_right"],
        "loops": ["repeat", "move_forward", "turn_right"],
        "conditionals": ["if", "obstacle_ahead", "move_forward", "turn_right"],
        "variables": ["set_variable", "change_variable", "repeat", "move_forward"],
        "general_logic": ["move_forward", "turn_left", "turn_right"],
    }

    def __init__(self) -> None:
        self.feature_columns = [
            "topic",
            "learning_objective",
            "difficulty",
            "allowed_blocks",
            "constraints",
            "quantity",
            "seed",
        ]
        self.generation_count = 0
        self.model_version = None

    def train(self, _data: Any = None) -> None:
        """Mantiene compatibilidad con el pipeline; no ajusta parametros."""

    def predict(self, data: Mapping[str, Any] | Any) -> str:
        result = self.predict_detailed(data)
        return result["status"]

    def predict_detailed(self, data: Mapping[str, Any] | Any) -> dict[str, Any]:
        row = self._to_mapping(data)
        topic_text = self._clean_text(row.get("topic"), "logica de programacion")
        objective = self._clean_text(
            row.get("learning_objective"),
            f"Aplicar {topic_text} para controlar un robot virtual",
        )
        topic = self._normalize_topic(topic_text)
        difficulty = self._normalize_difficulty(row.get("difficulty"))
        allowed_blocks = self._normalize_list(row.get("allowed_blocks"))
        constraints = self._normalize_list(row.get("constraints"))
        quantity = self._normalize_quantity(row.get("quantity"))
        seed = self._normalize_seed(row.get("seed"), topic_text, objective, difficulty)

        challenges = [
            self._build_challenge(
                topic=topic,
                topic_text=topic_text,
                objective=objective,
                difficulty=difficulty,
                allowed_blocks=allowed_blocks,
                constraints=constraints,
                variant=(seed + index) % 3,
                index=index,
            )
            for index in range(quantity)
        ]

        self.generation_count += quantity
        valid_count = sum(
            challenge["validation"]["block_compatibility"]
            and challenge["validation"]["deterministic_tests_available"]
            for challenge in challenges
        )
        status = "generated" if valid_count == quantity else "needs_adjustment"

        return {
            "status": status,
            "technique": self.TECHNIQUE,
            "challenges": challenges,
            "operational_metrics": {
                "requested_challenges": quantity,
                "generated_challenges": len(challenges),
                "format_valid_rate": 1.0,
                "block_compatibility_rate": round(valid_count / quantity, 4),
                "teacher_review_required": True,
            },
        }

    def _build_challenge(
        self,
        *,
        topic: str,
        topic_text: str,
        objective: str,
        difficulty: str,
        allowed_blocks: list[str],
        constraints: list[str],
        variant: int,
        index: int,
    ) -> dict[str, Any]:
        blueprint = self._blueprint(topic, difficulty, variant)
        required_blocks = blueprint["required_blocks"]
        effective_allowed = allowed_blocks or list(self.DEFAULT_BLOCKS[topic])
        missing_blocks = [
            block for block in required_blocks if block not in effective_allowed
        ]
        block_compatibility = not missing_blocks

        return {
            "challenge_id": f"ria04-{topic}-{difficulty}-{index + 1}",
            "title": blueprint["title"],
            "topic": topic_text,
            "learning_objective": objective,
            "difficulty": difficulty,
            "statement": blueprint["statement"],
            "hint": blueprint["hint"],
            "allowed_blocks": effective_allowed,
            "required_blocks": required_blocks,
            "constraints": constraints,
            "expected_solution": blueprint["expected_solution"],
            "test_cases": blueprint["test_cases"],
            "validation": {
                "schema_valid": True,
                "block_compatibility": block_compatibility,
                "missing_blocks": missing_blocks,
                "deterministic_tests_available": bool(blueprint["test_cases"]),
                "status": (
                    "ready_for_teacher_review"
                    if block_compatibility
                    else "needs_block_adjustment"
                ),
            },
        }

    def _blueprint(self, topic: str, difficulty: str, variant: int) -> dict[str, Any]:
        distance = 3 + variant
        templates = {
            "sequences": {
                "basic": {
                    "title": "Ruta de exploracion",
                    "statement": (
                        f"Ordena los bloques para que el robot avance {distance} casillas "
                        "y se detenga en la meta."
                    ),
                    "hint": "Primero identifica la posicion inicial y luego ordena cada movimiento.",
                    "required_blocks": ["move_forward"],
                    "expected_solution": [{"block": "move_forward", "times": distance}],
                    "test_cases": [{"start": [0, 0], "expected": [distance, 0]}],
                },
                "intermediate": {
                    "title": "Entrega en la esquina",
                    "statement": (
                        f"Programa al robot para avanzar {distance} casillas, girar a la "
                        "derecha y avanzar dos casillas hasta el punto de entrega."
                    ),
                    "hint": "Separa la ruta en dos tramos unidos por un giro.",
                    "required_blocks": ["move_forward", "turn_right"],
                    "expected_solution": [
                        {"block": "move_forward", "times": distance},
                        {"block": "turn_right", "times": 1},
                        {"block": "move_forward", "times": 2},
                    ],
                    "test_cases": [{"start": [0, 0], "expected": [distance, -2]}],
                },
                "advanced": {
                    "title": "Ruta de inspeccion",
                    "statement": (
                        f"Construye una secuencia para visitar ({distance}, 0), "
                        f"({distance}, {distance}) y regresar al origen."
                    ),
                    "hint": "Divide el recorrido en lados y controla la orientacion en cada giro.",
                    "required_blocks": ["move_forward", "turn_left"],
                    "expected_solution": [
                        {"block": "move_forward", "times": distance},
                        {"block": "turn_left", "times": 1},
                        {"block": "move_forward", "times": distance},
                        {"block": "turn_left", "times": 1},
                        {"block": "move_forward", "times": distance},
                        {"block": "turn_left", "times": 1},
                        {"block": "move_forward", "times": distance},
                    ],
                    "test_cases": [{"start": [0, 0], "expected": [0, 0]}],
                },
            },
            "loops": {
                "basic": {
                    "title": "Avance repetitivo",
                    "statement": (
                        f"Haz que el robot avance {distance} casillas utilizando un solo ciclo."
                    ),
                    "hint": "Coloca el movimiento dentro del bloque repetir.",
                    "required_blocks": ["repeat", "move_forward"],
                    "expected_solution": [
                        {"block": "repeat", "times": distance, "body": ["move_forward"]}
                    ],
                    "test_cases": [{"start": [0, 0], "expected": [distance, 0]}],
                },
                "intermediate": {
                    "title": "Patrulla cuadrada",
                    "statement": (
                        f"Programa al robot para recorrer un cuadrado de lado {distance} "
                        "usando un ciclo."
                    ),
                    "hint": "Cada lado repite avanzar y girar; el cuadrado tiene cuatro lados.",
                    "required_blocks": ["repeat", "move_forward", "turn_right"],
                    "expected_solution": [
                        {
                            "block": "repeat",
                            "times": 4,
                            "body": [
                                {"block": "move_forward", "times": distance},
                                {"block": "turn_right", "times": 1},
                            ],
                        }
                    ],
                    "test_cases": [{"start": [0, 0], "expected": [0, 0]}],
                },
                "advanced": {
                    "title": "Inspeccion por sectores",
                    "statement": (
                        "Usa ciclos anidados para que el robot inspeccione tres sectores "
                        f"cuadrados de lado {distance}."
                    ),
                    "hint": "El ciclo interno dibuja un sector y el externo repite la inspeccion.",
                    "required_blocks": ["repeat", "move_forward", "turn_right"],
                    "expected_solution": [
                        {
                            "block": "repeat",
                            "times": 3,
                            "body": [
                                {
                                    "block": "repeat",
                                    "times": 4,
                                    "body": ["move_forward", "turn_right"],
                                }
                            ],
                        }
                    ],
                    "test_cases": [{"invariant": "returns_to_sector_origin"}],
                },
            },
            "conditionals": {
                "basic": {
                    "title": "Evita el obstaculo",
                    "statement": (
                        "Si el sensor detecta un obstaculo, gira a la derecha; de lo "
                        "contrario, avanza una casilla."
                    ),
                    "hint": "La lectura del sensor debe ser la condicion del bloque si.",
                    "required_blocks": ["if", "obstacle_ahead", "move_forward", "turn_right"],
                    "expected_solution": [
                        {
                            "block": "if",
                            "condition": "obstacle_ahead",
                            "then": ["turn_right"],
                            "else": ["move_forward"],
                        }
                    ],
                    "test_cases": [
                        {"obstacle_ahead": True, "expected_action": "turn_right"},
                        {"obstacle_ahead": False, "expected_action": "move_forward"},
                    ],
                },
                "intermediate": {
                    "title": "Cruce seguro",
                    "statement": (
                        "Avanza mientras el camino este libre. Si aparece un obstaculo, "
                        "gira a la derecha y continua la ruta."
                    ),
                    "hint": "Combina la decision del sensor con la accion de movimiento.",
                    "required_blocks": ["if", "obstacle_ahead", "move_forward", "turn_right"],
                    "expected_solution": [
                        {
                            "block": "if",
                            "condition": "obstacle_ahead",
                            "then": ["turn_right", "move_forward"],
                            "else": ["move_forward"],
                        }
                    ],
                    "test_cases": [
                        {"obstacle_ahead": True, "expected_actions": ["turn_right", "move_forward"]},
                        {"obstacle_ahead": False, "expected_actions": ["move_forward"]},
                    ],
                },
                "advanced": {
                    "title": "Navegacion con sensores",
                    "statement": (
                        "Decide el movimiento usando los sensores frontal y lateral: "
                        "prioriza avanzar, luego girar y evita quedar bloqueado."
                    ),
                    "hint": "Ordena las condiciones desde la accion mas segura hasta la alternativa.",
                    "required_blocks": ["if", "obstacle_ahead", "move_forward", "turn_right"],
                    "expected_solution": [
                        {
                            "block": "if",
                            "condition": "not obstacle_ahead",
                            "then": ["move_forward"],
                            "else": ["turn_right"],
                        }
                    ],
                    "test_cases": [
                        {"obstacle_ahead": False, "expected_action": "move_forward"},
                        {"obstacle_ahead": True, "expected_action": "turn_right"},
                    ],
                },
            },
            "variables": {
                "basic": {
                    "title": "Contador de pasos",
                    "statement": (
                        f"Usa una variable para contar los {distance} pasos que avanza el robot."
                    ),
                    "hint": "Inicializa el contador antes de comenzar a mover el robot.",
                    "required_blocks": ["set_variable", "change_variable", "move_forward"],
                    "expected_solution": [
                        {"block": "set_variable", "name": "steps", "value": 0},
                        {"block": "move_forward", "times": distance},
                        {"block": "change_variable", "name": "steps", "value": distance},
                    ],
                    "test_cases": [{"expected_variable": {"steps": distance}}],
                },
                "intermediate": {
                    "title": "Limite de movimiento",
                    "statement": (
                        f"Controla con una variable que el robot avance exactamente {distance} casillas."
                    ),
                    "hint": "Actualiza el contador dentro del ciclo de movimiento.",
                    "required_blocks": ["set_variable", "change_variable", "repeat", "move_forward"],
                    "expected_solution": [
                        {"block": "set_variable", "name": "steps", "value": 0},
                        {
                            "block": "repeat",
                            "times": distance,
                            "body": ["move_forward", "change_variable"],
                        },
                    ],
                    "test_cases": [{"expected_position": [distance, 0], "steps": distance}],
                },
                "advanced": {
                    "title": "Registro de recorrido",
                    "statement": (
                        "Registra con variables los pasos y giros realizados durante una "
                        "ruta de inspeccion."
                    ),
                    "hint": "Usa un contador independiente para cada tipo de accion.",
                    "required_blocks": ["set_variable", "change_variable", "move_forward", "turn_right"],
                    "expected_solution": [
                        {"block": "set_variable", "name": "steps", "value": 0},
                        {"block": "set_variable", "name": "turns", "value": 0},
                        {"block": "move_forward", "times": distance},
                        {"block": "turn_right", "times": 1},
                    ],
                    "test_cases": [{"expected_variables": {"steps": distance, "turns": 1}}],
                },
            },
        }

        if topic == "general_logic":
            topic = "sequences"

        return templates[topic][difficulty]

    def _normalize_topic(self, value: str) -> str:
        normalized = self._normalize_token(value)
        for topic, aliases in self.TOPIC_ALIASES.items():
            if any(alias in normalized for alias in aliases):
                return topic
        return "general_logic"

    def _normalize_difficulty(self, value: Any) -> str:
        normalized = self._normalize_token(value or "basic")
        for difficulty, aliases in self.DIFFICULTY_ALIASES.items():
            if normalized in aliases:
                return difficulty
        return "basic"

    def _normalize_seed(
        self,
        value: Any,
        topic: str,
        objective: str,
        difficulty: str,
    ) -> int:
        if value is not None:
            try:
                return int(value)
            except (TypeError, ValueError):
                pass
        digest = hashlib.sha256(
            f"{topic}|{objective}|{difficulty}".encode("utf-8")
        ).hexdigest()
        return int(digest[:8], 16)

    @staticmethod
    def _to_mapping(data: Mapping[str, Any] | Any) -> dict[str, Any]:
        if isinstance(data, Mapping):
            return dict(data)
        if hasattr(data, "iloc") and len(data.index) > 0:
            return data.iloc[0].to_dict()
        raise ValueError("RIA04 requires a non-empty mapping or DataFrame")

    @staticmethod
    def _normalize_list(value: Any) -> list[str]:
        if value is None:
            return []
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return [str(item).strip() for item in value if str(item).strip()]

    @staticmethod
    def _normalize_quantity(value: Any) -> int:
        try:
            return min(max(int(value or 1), 1), 5)
        except (TypeError, ValueError):
            return 1

    @staticmethod
    def _clean_text(value: Any, default: str) -> str:
        text = str(value or "").strip()
        return text or default

    @staticmethod
    def _normalize_token(value: Any) -> str:
        return (
            str(value or "")
            .strip()
            .lower()
            .replace("á", "a")
            .replace("é", "e")
            .replace("í", "i")
            .replace("ó", "o")
            .replace("ú", "u")
        )
