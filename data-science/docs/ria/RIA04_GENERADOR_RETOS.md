# RIA04 - Generador de retos

## Propósito

RIA04 genera borradores estructurados de retos de programación con bloques para
que un docente los revise antes de publicarlos.

No ajusta automáticamente la dificultad con historial del estudiante. La
dificultad, el tema y el objetivo son decisiones de entrada del docente o
pueden provenir de una recomendación previa de RIA03.

## Funcionamiento

- Versión del servicio: `ria04-v2-generator`.
- Técnica: sistema experto y generación procedural controlada.
- No requiere entrenamiento supervisado ni datos históricos.
- Genera de uno a cinco retos.
- Valida formato, bloques requeridos, compatibilidad y disponibilidad de casos
  de prueba deterministas.
- Todo resultado exige revisión docente.

## Endpoints

| Método | Ruta | Uso |
| --- | --- | --- |
| `POST` | `/ria04/generate` | Generar borradores de retos. |
| `GET` | `/ria04/info` | Consultar temas, dificultades y técnica. |

### Entrada

```json
{
  "topic": "ciclos",
  "learning_objective": "Controlar el robot usando repeticiones",
  "difficulty": "basic",
  "allowed_blocks": ["repeat", "move_forward", "turn_right"],
  "constraints": ["usar al menos un ciclo"],
  "quantity": 1,
  "seed": 42
}
```

### Salida relevante

Cada elemento de `details.challenges` contiene:

- `challenge_id`, `title`, `statement` y `hint`.
- `topic`, `learning_objective` y `difficulty`.
- `allowed_blocks`, `required_blocks` y `constraints`.
- `expected_solution` y `test_cases`.
- `validation.block_compatibility`, `missing_blocks` y `status`.

`details.operational_metrics` informa cantidad solicitada/generada, validez,
compatibilidad y revisión docente obligatoria.

## Contexto recomendado para una IA generativa

Para que una IA ayude al docente a mejorar la redacción:

```json
{
  "ria": "RIA04",
  "audience": "teacher",
  "topic": "ciclos",
  "learning_objective": "Controlar el robot usando repeticiones",
  "difficulty": "basic",
  "allowed_blocks": ["repeat", "move_forward", "turn_right"],
  "constraints": ["usar al menos un ciclo"],
  "challenge": {
    "title": "Ruta con repetición",
    "statement": "Borrador generado",
    "hint": "Pista generada",
    "validation_status": "ready_for_teacher_review"
  },
  "instruction": "Mejorar claridad sin cambiar objetivo, dificultad ni bloques."
}
```

Para una IA visible al estudiante, no enviar:

- `expected_solution`;
- respuestas completas de `test_cases`;
- información que revele el camino exacto de solución.

Para una IA de apoyo al docente sí pueden incluirse la solución esperada, casos
de prueba y bloques faltantes.

## Restricciones

- `accuracy` y `precision` no aplican a un generador procedural.
- No publicar automáticamente un reto generado.
- No agregar bloques fuera de `allowed_blocks`.
- Mantener las restricciones y el objetivo pedagógico indicados.
- El `seed` permite reproducibilidad; no representa dificultad.

## Implementación

- Modelo: [`ria04_generador.py`](../../app/adapters/ml_models/ria04_generador.py)
- Servicio: [`ria04_service.py`](../../app/application/services/ria04_service.py)
- Schema: [`schemas.py`](../../app/adapters/api/schemas.py)

