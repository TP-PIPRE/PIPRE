# RIA-01 - Reporte de refactorizacion y validacion

Fecha de ejecucion: 2026-07-15  
Version persistida: `ria01-v10-error-events`

## Alcance

La revision se limito a `data-science`. RIA-01 conserva dos operaciones distintas:

- `predict_rule`: clasificacion determinista con `puntaje` y `tasa_exito`. No es ML.
- `predict`: estimacion temprana mediante ML sin entregar `puntaje` ni `tasa_exito` al modelo.

## Problemas corregidos

| Severidad | Problema | Correccion aplicada |
| --- | --- | --- |
| Critica | La imputacion se aprendia antes de CV | `RIA01FeatureEngineer` aprende medianas dentro de cada fold mediante `Pipeline`. |
| Critica | Features, algoritmo e hiperparametros se elegian en pasos optimistas | Se buscan conjuntamente como parametros del mismo Pipeline. |
| Critica | El test podia influir en analisis posteriores | El test se usa una sola vez, despues de fijar Pipeline; las importancias se calculan solo en CV. |
| Critica | Posible mezcla de sesiones del mismo estudiante | Split final y folds usan grupos y verifican interseccion vacia. |
| Alta | `target_source="existing"` exigia columnas de la regla | La etiqueta externa funciona sin `puntaje`, `tasa_exito` ni features opcionales. |
| Alta | Accesos directos a columnas opcionales | Los diagnosticos omiten solo el calculo no disponible y registran la causa. |
| Alta | Estado antiguo tras reentrenar o fallar | `_reset_training_state` limpia modelo, metricas, reportes, baselines e importancias. |
| Alta | Split agrupado no aproximaba bien `test_size` | Se elige la mejor de 500 particiones de `GroupShuffleSplit`. |
| Alta | Train o test podian perder clases | Solo se aceptan particiones que contienen todas las clases. |
| Alta | Se suponia incorrectamente un maximo de un error por intento | Se documento que `errores` cuenta eventos y se elimino `intentos - errores`. |
| Alta | Diagnostico de proxy usaba filas no plausibles | Correlacion y MAE usan solo reconstrucciones entre 0 y 1 y minimo 20 filas. |
| Alta | `nivel_logico` sospechoso solo generaba texto | `leakage_policy` permite mantener, excluir o detener; si deriva del rendimiento se excluye. |
| Alta | `selection_score` no seleccionaba hiperparametros | Una funcion `refit` elige realmente por F1, balance, brecha y desviacion. |
| Alta | Una sola permutacion aleatoria era inestable | Se ejecutan 20 permutaciones y se conserva su distribucion. |
| Media | Orden ambiguo por `LabelEncoder` | Mapeo estable: `bajo=0`, `adecuado=1`; multiclase `bajo=0`, `medio=1`, `alto=2`. |
| Media | Baseline de regla fallaba con nulos | Solo evalua filas comparables e informa cobertura o indisponibilidad. |
| Media | `predict_proba` podia omitir o desordenar clases | Valida codigos y devuelve siempre todas las clases en orden funcional. |
| Media | Importancia dependia de un solo fold | Se promedian importancias de permutacion de todos los folds con desviacion. |
| Media | Binario y multiclase compartian una seleccion | Cada problema crea target, CV y comparacion de features propios. |
| Media | Datasets pequenos iniciaban busquedas costosas | Se calculan limites por filas y grupos, se reducen folds y se activa modo rapido. |
| Media | Advertencias sin estructura | Cada alerta incluye codigo, severidad, mensaje y columnas afectadas. |
| Baja | Variantes textuales y acentos eran fragiles | Se normalizan texto, acentos y niveles desconocidos; estos ultimos usan categoria explicita `-1`. |

La alternativa minima permitida por la solicitud fue la seleccion conjunta en un
Pipeline. No se presenta la metrica interna de seleccion como una estimacion
independiente; la estimacion final es la del test reservado.

## Datos y separacion

- Registros: 650.
- Estudiantes unicos: 650 mediante `id_estudiante`.
- Train: 520 registros y 520 estudiantes.
- Test: 130 registros y 130 estudiantes.
- Proporcion solicitada/real de test: 20 % / 20 %.
- Solapamiento train-test: 0 estudiantes.
- CV: 5 folds, todos con las clases presentes y sin solapamiento de estudiantes.
- Distribucion train: 122 `bajo`, 398 `adecuado`.
- Distribucion test: 30 `bajo`, 100 `adecuado`.

## Calidad de datos

- Valores negativos en features base: 0.
- Valores faltantes en features base: 0.
- Filas con `errores > intentos`: 356 de 650; son validas bajo la semantica confirmada.
- Semantica aplicada: multiples eventos de error pueden ocurrir dentro de un intento.
- Concordancia entre `rendimiento` existente y regla binaria: 70 %.

`ratio_error` se conserva por compatibilidad interna, pero representa densidad de
errores o errores por intento y puede ser mayor que 1. La feature
`intentos_sin_error` fue eliminada porque restar eventos de error a intentos no
tiene una interpretacion valida.

## Diagnostico de fuga

### `tasa_exito`

- Filas plausibles para reconstruccion: 228.
- Correlacion entre `tasa_exito` y `1 - errores/intentos`: 0.1141.
- MAE: 0.4364.
- La formula es semanticamente aplicable: no.
- Fuga indirecta confirmada: no.

Con la semantica confirmada, `1 - errores/intentos` no puede representar
`tasa_exito`, porque puede haber varios eventos dentro de cada intento. El
diagnostico numerico se conserva como auditoria, pero nunca confirma fuga bajo
esta configuracion.

### `nivel_logico`

- V de Cramer con el target de train: 0.1304.
- Informacion mutua: 0.0085.
- Asociacion alta confirmada: no.
- Origen declarado en el entrenamiento persistido: `unknown`.

No se confirmo fuga estadistica, pero falta documentar el origen de negocio. Si
se deriva del desempeno actual debe usarse
`logical_level_source="current_performance"`, lo que fuerza su exclusion.

## Seleccion y metricas

Pipeline seleccionado:

- Algoritmo: Extra Trees.
- Feature set: `base_only`.
- Features: `intentos`, `errores`, `nivel_logico`, `interacciones_ia` y cuatro indicadores de faltantes.
- F1 macro medio de seleccion CV: 0.6734.
- Brecha train-validacion del candidato: 0.0531.
- Desviacion F1 entre folds: 0.0292.

Test final reservado:

| Metrica | Resultado |
| --- | ---: |
| Accuracy | 0.8077 |
| Precision macro | 0.7286 |
| Precision ponderada/API | 0.7978 |
| Recall macro | 0.7000 |
| Balanced accuracy | 0.7000 |
| F1 macro | 0.7118 |
| F1 ponderado | 0.8013 |

Matriz de confusion, orden `bajo`, `adecuado`:

```text
[[15, 15],
 [10, 90]]
```

## Baselines y sanidad

- Dummy most-frequent: accuracy 0.7692, F1 macro 0.4348.
- Regla directa sobre el target construido por esa misma regla: accuracy y F1 1.0.
- Etiquetas aleatorias, 20 permutaciones: balanced accuracy media 0.5015 y F1 macro medio 0.4596.
- Balanced accuracy real con el estimador de sanidad: 0.6198.
- Prueba aleatoria: aprobada.

La regla exacta y el modelo predictivo resuelven problemas distintos. El 100 %
de la regla no debe compararse como si fuera superior al ML: la regla ya recibe
los valores que definen matematicamente la etiqueta.

## Binario frente a multiclase

- Binario: F1 macro CV 0.6535 y balanced accuracy 0.6789 en el analisis secundario fijo.
- Multiclase: F1 macro CV 0.5417 y balanced accuracy 0.5636.

Se recomienda mantener el problema principal binario con este dataset. El
analisis multiclase queda disponible, pero presenta menor senal y mayor brecha de
generalizacion.

## Limitaciones y siguientes datos utiles

- El target predeterminado sigue siendo sintetico; una etiqueta docente externa seria metodologicamente mejor.
- Las clases estan desbalanceadas y la clase `bajo` conserva menor recall.
- La densidad de errores no distingue su tipo o gravedad.
- Cada estudiante tiene una sola fila en el dataset actual; no se puede validar generalizacion temporal por estudiante.
- Variables utiles y disponibles antes del resultado final: tipo/dificultad de actividad, taxonomia de errores, uso de pistas, secuencia de intentos y resumen historico calculado solo con sesiones anteriores.

No se cambiaron clases, umbrales ni splits para forzar 75 %. Las metricas
reportadas corresponden al flujo reproducible con `random_state=42`.

## Verificacion

```powershell
data-science\venv\Scripts\python.exe -B -m unittest tests.test_ria01 -v
data-science\venv\Scripts\python.exe -B scripts/demo_ria01.py
```

Resultado automatizado: 26 pruebas aprobadas.
