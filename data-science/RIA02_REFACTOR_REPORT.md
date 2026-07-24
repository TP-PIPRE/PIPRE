# RIA02 - revision y mejoras (v4)

## Objetivo

RIA02 entrega retroalimentacion automatica durante la resolucion de una
actividad. La decision se basa en senales disponibles en ese momento: errores,
intentos, recurrencia, complejidad del codigo y nivel logico. El puntaje y la
tasa de exito se conservan como contexto, pero no deciden si el estudiante
necesita ayuda para evitar usar informacion final de la actividad.

## Correcciones realizadas

- Se evita que una entrada sin errores ni intentos acumule riesgo cuando un
  percentil de entrenamiento sea cero.
- Las etiquetas textuales `false`, `no`, `true` y `si` se convierten de forma
  explicita. Antes, Python interpretaba cualquier texto no vacio como verdadero.
- La calibracion ya no falla con datasets pequenos o clases insuficientes. En
  ese caso calibra umbrales y deja las metricas como no disponibles.
- La seleccion de reglas prioriza F1 y recall, adecuados para reducir casos de
  estudiantes que necesitan apoyo y no son detectados.
- Se elimina un calculo duplicado del tipo de retroalimentacion.
- Los errores recurrentes se comparan sin depender de mayusculas, espacios o
  tildes.
- Se validan limites, rangos y formatos en la entrada del API.
- Se limita y limpia el texto que puede terminar en sugerencias o contexto para
  un LLM.

## Respuesta del endpoint

`POST /ria02/feedback` mantiene `result`, `accuracy`, `precision` y los campos
de detalle existentes. Tambien devuelve:

- `recall` y `f1`: metricas de evaluacion cuando existe una etiqueta
  independiente suficiente.
- `details.needs_feedback`: decision booleana.
- `details.risk_score` y `details.risk_cutoff`: puntaje de reglas y umbral.
- `details.reasons`: explicaciones legibles de las senales activadas.
- `details.evidence`: valores observados, umbrales y confirmacion de que el
  puntaje final no fue usado para decidir.
- `details.input_warnings`: contexto faltante que reduce la calidad de la
  recomendacion.

## Flujo de uso

1. El editor o evaluador envia codigo, errores, intentos, errores previos, nivel
   logico y objetivo de la actividad.
2. RIA02 normaliza la entrada, identifica recurrencia y estima complejidad.
3. Las reglas suman un puntaje de riesgo y lo comparan con el umbral calibrado.
4. El API devuelve la decision, evidencia, razones y hasta cuatro pistas.
5. Si se utiliza un LLM para redactar el mensaje final, debe consumir
   `details.llm_context` y respetar la instruccion de no entregar la solucion
   completa.

## Limitaciones de esta version

- Es un motor de reglas calibrado, no un modelo generativo ni una probabilidad
  de fracaso.
- El dataset actual contiene conteos agregados; no contiene codigo real ni
  mensajes de error reales. Por ello, la clasificacion semantica de errores y
  complejidad debe validarse posteriormente con casos reales anonimizados.
- Las metricas solo son comparables cuando existe una etiqueta independiente y
  una particion aislada de prueba. No deben inventarse metricas cuando faltan
  esas condiciones.
- Las pistas deben mostrarse como apoyo pedagogico y permitir revision docente;
  no sustituyen la evaluacion del profesor.

## Pruebas

Las pruebas de `tests/test_ria02.py` cubren entrada limpia, percentiles en cero,
etiquetas booleanas textuales, datasets pequenos, recurrencia normalizada,
contrato del servicio, validacion de entrada y seleccion de reglas.
