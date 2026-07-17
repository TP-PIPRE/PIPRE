# RIA-03 - Recomendador de actividades

Version: `ria03-v5.1-historical-target`  
XGBoost verificado: `3.2.0`

## Objetivo

RIA-03 clasifica el rendimiento observado como `bajo`, `medio` o `alto` y lo
convierte en una recomendacion:

- bajo: actividades basicas;
- medio: actividades intermedias;
- alto: actividades avanzadas.

FastAPI mantiene el body existente:

```json
{
  "logical_level": "medio",
  "inactive_days": 4,
  "ai_interactions": 7,
  "attempts": 4
}
```

También acepta señales opcionales, sin romper el contrato anterior:

```json
{
  "logical_level": "medio",
  "inactive_days": 4,
  "ai_interactions": 7,
  "attempts": 4,
  "errors": 2,
  "help_requested": 1,
  "historical_attempts_avg": 3.5,
  "historical_errors_avg": 1.2,
  "historical_help_avg": 0.6,
  "previous_performance": "medio"
}
```

## Correcciones principales

1. `train()` exige `rendimiento` historico como etiqueta supervisada; ya no crea
   ni reemplaza el target mediante una formula basada en las features.
2. El dataset se divide antes de ajustar el preprocessing.
3. Las medianas se aprenden solo con train y se reutilizan en validacion, test,
   evaluacion y produccion.
4. `nivel_logico` usa el orden explicito bajo=0, medio=1, alto=2.
5. Se comparan XGBoost jerarquico y XGBoost multiclase.
6. La busqueda de hiperparametros usa `StratifiedGroupKFold` cuando existe ID de
   estudiante y comprueba que no haya estudiantes compartidos.
7. Se comparan features `core` y `extended`; la seleccion usa F1 macro menos su
   desviacion entre folds para penalizar soluciones inestables.
8. Las probabilidades se calibran con regresion logistica sobre predicciones OOF
   de train. Validacion decide si conviene usar la version cruda o calibrada.
9. Los umbrales de ambas etapas se seleccionan conjuntamente con todo el flujo
   de tres clases sobre validacion.
10. La metrica principal para umbrales es F1 macro; los desempates usan balanced
   accuracy y accuracy.
11. El test se usa una sola vez despues de fijar preprocessing, modelos y
   umbrales.
12. La division `auto` prioriza tiempo, despues estudiante y finalmente una
   division estratificada con advertencia.
13. Se validan columnas, clases, negativos, categorias desconocidas y suficiencia
   de cada etapa.
14. `_predict_labels()` y `predict()` trabajan por lotes sin recorrer cada fila.
15. `evaluar()` retorna todas las metricas y no cambia el estado entrenado.
16. Los hiperparametros de XGBoost son conservadores e incluyen regularizacion y
   early stopping sobre validacion.

## Flujo de entrenamiento

```text
validar datos y target observado
             |
             v
split train / validation / test
             |
             v
ajustar medianas solo con train
             |
             v
CV agrupada: core vs extended
CV agrupada: jerarquico vs multiclase
             |
             v
calibrar con predicciones OOF de train
entrenar las dos arquitecturas elegidas
seleccionar arquitectura, modo de probabilidad y umbrales en validation
             |
             v
evaluar una vez con test
```

La segunda etapa se entrena con ejemplos reales `medio` y `alto`, pero durante
la calibracion recibe todos los registros que la etapa 1 deja pasar. De esta
forma se incluyen los errores de la primera etapa en la seleccion final.

## Resultado sobre el dataset actual

El dataset contiene 650 filas:

- bajo: 161;
- medio: 280;
- alto: 209.

La division seleccionada fue agrupada por `id_estudiante`:

- train: 390;
- validacion: 130;
- test: 130;
- estudiantes compartidos: 0.

Metricas del primer entrenamiento reproducible:

| Metrica | Valor |
| --- | ---: |
| Accuracy | 0.6077 |
| Balanced accuracy | 0.6607 |
| Precision macro | 0.6189 |
| Precision ponderada | 0.6317 |
| F1 macro | 0.6084 |
| F1 ponderado | 0.5887 |

La seleccion interna eligio features `core` y la arquitectura jerarquica. Las
features extendidas siguen soportadas y se volveran a evaluar en cada
entrenamiento, pero no se conservaron en este ajuste porque su mejora media vino
acompanada de mayor variacion entre folds.

La columna `rendimiento` representa un resultado historico del estudiante. Se
usa exclusivamente como etiqueta de entrenamiento y evaluacion; no se incluye
entre las features ni se solicita al backend. El diagnostico encontro solo
0.3908 de coincidencia con una regla por cuantiles basada en puntaje y tasa de
exito, por lo que esa formula simple no explica la etiqueta historica.

## Incompatibilidades posibles de XGBoost

- XGBoost 1.x permitia con frecuencia `early_stopping_rounds` en `fit()`.
- XGBoost 2.x y 3.x lo ubican en el constructor del estimador sklearn.
- La implementacion inspecciona la firma instalada y usa la ubicacion correcta;
  si ninguna es compatible, entrena sin early stopping y emite una advertencia.
- `use_label_encoder` fue eliminado en versiones recientes y no se utiliza.
- `best_iteration` solo existe cuando early stopping se ejecuto correctamente.
- Los `.pkl` de XGBoost no deben asumirse compatibles entre versiones mayores
  de XGBoost, sklearn o Python. `MODEL_VERSION` obliga el reentrenamiento.

## Dependencias

```text
numpy==2.4.4
pandas==3.0.2
scikit-learn==1.8.0
xgboost==3.2.0
pytest==8.4.2
openpyxl==3.1.5
joblib==1.5.3
```

## Ejecucion

```powershell
cd X:\PIPRE\data-science
venv\Scripts\python.exe -B scripts\demo_ria03.py
venv\Scripts\python.exe -B -m pytest tests\test_ria03.py -v
```

## Limitaciones

- El contrato minimo conserva cuatro señales. Errores, ayuda e historicos son
  opcionales y solo se retienen si mejoran CV de forma estable.
- `nivel_logico` debe haberse calculado antes de la recomendacion y no derivarse
  del mismo rendimiento que se intenta predecir.
- El dataset actual contiene un solo registro por `id_estudiante`; por ello aun
  no permite construir secuencias personales. Los promedios y rendimiento previo
  deben llegar calculados solo con actividades anteriores.
- Para mejorar generalizacion se necesitan variables previas a la recomendacion,
  como tipo y dificultad de actividad, historial anterior y taxonomia de errores.
