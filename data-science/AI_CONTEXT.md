# AI context - data-science

Este archivo es el punto de entrada recomendado para una IA que necesite
trabajar en el modulo `data-science` sin gastar tokens leyendo todo el
proyecto.

## Alcance

- Trabajar solo dentro de `data-science` salvo que el usuario indique lo
  contrario.
- Este modulo contiene modelos de machine learning, servicios de aplicacion,
  endpoints FastAPI, persistencia de modelos y una UI local de pruebas.
- El frontend y backend externos consumen este modulo mediante FastAPI.

## Arquitectura rapida

- `app/adapters/ml_models`: logica principal de cada RIA/modelo.
- `app/adapters/ml_support`: preprocessing, seleccion de modelos y apoyo tecnico de los adaptadores ML.
- `app/application/services`: contrato estable para usar cada modelo.
- `app/adapters/api`: FastAPI, schemas Pydantic y endpoints.
- `app/infrastructure`: rutas, repositorios y wiring de dependencias.
- `app/ui`: UI local para pruebas con el dataset.
- `data`: dataset de entrenamiento.
- `saved_models`: modelos `.pkl` entrenados.

## RIA implementados

| RIA | Archivo principal | Funcion |
| --- | --- | --- |
| RIA01 | `ria01_desempeño.py` | Regla exacta con score/success rate o estimacion ML binaria sin esas variables. |
| RIA02 | `ria02_feedback.py` | Decide si requiere retroalimentacion y arma contexto para IA. |
| RIA03 | `ria03_recomendador.py` | Compara XGBoost jerarquico/multiclase para recomendar basic, intermediate o advanced. |
| RIA04 | `ria04_generador.py` | Genera borradores de retos con un sistema experto y reglas procedurales. |
| RIA08 | `ria08_anomalias.py` | Detecta comportamiento normal o anomalous. |
| RIA10 | `ria10_pedagogica.py` | Recomienda intervencion pedagogica. |
| RIA11 | `ria11_tiempo.py` | Clasifica tiempo: short, medium, long. |
| RIA12 | `ria12_codigo.py` | Evalua codigo en la UI local. No tiene endpoint FastAPI directo actualmente. |

### RIA01: modos y restricciones

- `predict(data)` ejecuta ML predictivo con intentos, errores, nivel logico e interacciones IA.
- `predict_rule(data)` aplica la formula exacta con puntaje y tasa de exito.
- El target predictivo predeterminado se construye con la regla, pero puntaje y tasa de exito no son features.
- `rendimiento` solo se usa como target cuando se configura `target_source="existing"` y se considera una etiqueta externa valida.
- La seleccion de features y modelos usa validacion cruzada; el test solo se usa para la evaluacion final.
- La imputacion y la ingenieria de variables viven en `app/adapters/ml_support/ria01_preprocessing.py` y se ajustan dentro de cada fold.
- La busqueda conjunta selecciona algoritmo, hiperparametros y conjunto de features en un mismo Pipeline.
- Las clases usan un mapeo explicito y estable: `bajo=0`, `adecuado=1`.
- En RIA01, `errores` cuenta eventos: un intento puede contener varios errores. Por ello `errores > intentos` es valido y `ratio_error` significa errores por intento.
- El origen de `nivel_logico` debe declararse con `logical_level_source` cuando se conozca.
- `target_source="existing"` admite datasets sin puntaje, tasa de exito o features opcionales; en ese caso el baseline de regla se marca como no disponible.
- Las pruebas reproducibles de RIA01 estan en `tests/test_ria01.py` y el flujo demostrativo en `scripts/demo_ria01.py`.

### RIA03: target y evaluacion

- `train()` usa `rendimiento` historico del estudiante como etiqueta supervisada con bajo, medio y alto; no genera el target internamente.
- `rendimiento` solo existe en entrenamiento/evaluacion: no entra como feature ni se solicita al backend durante prediccion.
- El preprocessing se ajusta solo con train.
- La division `auto` prioriza fecha, luego estudiante y finalmente estratificacion.
- La busqueda compara features core/extended y modelos jerarquico/multiclase con CV agrupada.
- La calibracion usa predicciones OOF de train; validacion selecciona arquitectura, modo de probabilidad y umbrales.
- FastAPI exige logical_level, inactive_days, ai_interactions y attempts. Acepta opcionalmente errors, help_requested, promedios historicos y previous_performance.
- `previous_performance` y los promedios historicos deben haberse calculado antes de la actividad actual; nunca se derivan del resultado que se intenta predecir.

### RIA04: generacion de retos

- No usa datos historicos ni entrenamiento supervisado.
- Recibe tema, objetivo pedagogico, dificultad indicada por el docente,
  bloques permitidos, restricciones y cantidad de retos.
- Usa un sistema experto con plantillas y generacion procedural controlada.
- Devuelve borradores estructurados, casos de prueba y validacion de bloques.
- Todo reto requiere revision docente antes de publicarse.
- No reportar `accuracy` ni `precision`; medir validez de formato,
  compatibilidad de bloques, ejecucion de casos de prueba y aprobacion docente.

### RIA10: recomendacion pedagogica por grado

- Compara errores, dias de inactividad y actividades completadas del estudiante
  con promedios aprendidos del mismo grado en el conjunto de entrenamiento.
- Si el grado no existe en entrenamiento, usa el promedio global e informa ese
  alcance en `reference_scope`.
- Devuelve categoria, perfil, riesgo, confianza, comparacion por grado, razones
  y una sugerencia docente accionable.
- Las acciones se construyen a partir de la categoria y de las brechas
  observadas; siempre requieren criterio final del docente.
- RIA10 forma parte tanto de FastAPI como del pipeline de la UI local.

## Endpoints principales

- `POST /ria01/predict`
- `POST /ria02/feedback`
- `POST /ria03/recommend`
- `POST /ria04/generate`
- `POST /ria08/anomaly`
- `POST /ria10/pedagogical`
- `POST /ria11/time`
- `GET /riaXX/info`
- `GET /health`

## Contrato de respuesta recomendado

Las predicciones deben mantenerse compactas:

```json
{
  "result": "category",
  "accuracy": 0.0,
  "precision": 0.0,
  "details": {}
}
```

Notas:

- `accuracy` y `precision` se muestran con 4 decimales usando `round_metric`.
- Metricas diagnosticas como `recall`, `f1`, matriz de confusion o busquedas de
  hiperparametros deben quedarse en endpoints `/info`, no en predicciones.
- La respuesta de prediccion debe evitar payloads grandes para no gastar tokens
  ni ancho de banda.

## Reglas para evitar data leakage

- No usar en prediccion columnas que no esten disponibles en produccion.
- Si una variable se usa para crear el target, revisar si tambien esta entrando
  como feature.
- Calcular umbrales y estadisticas de grupo solo con train cuando se evalua en
  test.
- Separar metrica de validacion y metrica de prueba cuando se ajustan reglas o
  hiperparametros.
- Documentar claramente cuando una etiqueta es sintetica y no una etiqueta real
  de docente.

## Skills necesarias para futuras IAs

### 1. Scope guard

Antes de modificar, confirmar si el pedido aplica solo a `data-science`. Si es
asi, no tocar frontend ni backend externos.

### 2. RIA map

Usar la tabla de RIA de este archivo para ubicar rapidamente el modelo, servicio
y endpoint. Abrir solo los archivos del RIA involucrado.

### 3. API contract

Mantener el formato compacto de respuesta. No agregar campos grandes en
prediccion si pueden vivir en `/info`.

### 4. ML leakage review

Revisar features, target, split train/test y disponibilidad en produccion antes
de subir metricas.

### 5. Model persistence

Si cambia `feature_columns`, version del modelo o logica incompatible, actualizar
`MODEL_VERSION` para forzar reentrenamiento del `.pkl`.

### 6. UI smoke test

Si se toca `app/ui`, verificar que `generar_resultados` y `ui_resultados` puedan
mostrar datos anidados sin romper la pantalla.

La UI carga los modelos desde `saved_models` mediante
`PipelineIA.load_or_train`; no debe llamar `pipeline.train(df)` en cada inicio.
Solo se reentrena el RIA cuyo archivo falte, tenga otro tipo o una version
incompatible.

### 7. FastAPI smoke test

Validar imports, carga de modelos y al menos una prediccion por endpoint
afectado.

### 8. Agent context builder

Cuando un RIA alimente una IA generativa, devolver contexto breve, estructurado y
accionable. Evitar mandar dataset completo, configuraciones internas o metricas
diagnosticas.

## Comandos utiles

```powershell
data-science\venv\Scripts\python.exe -m compileall -q data-science/app
```

```powershell
$env:PYTHONPATH='data-science'
data-science\venv\Scripts\python.exe -c "from app.adapters.api.main import app; print('api import ok')"
```
