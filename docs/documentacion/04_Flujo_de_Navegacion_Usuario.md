# 4. Flujo de Navegación del Usuario (User Journey)

## 4.1 Recorrido Principal del Estudiante

```
┌───────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│   Login   │───▶│  Selección de Curso  │───▶│  /simulador/:courseId │
└───────────┘    │  (PaginaInicio)      │    └──────────┬───────────┘
                 └──────────────────────┘               │
                 ┌──────────────────────────────────────▼──────────────────────────────────────┐
                 │                     Stage (NeonFlow | TetriLogic)                            │
                 │  startGame() → cronómetro + contadores en cero (estado PLAYING)             │
                 │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                        │
                 │  │ Arrastrar/  │   │  Rotar      │   │  Pista IA   │                        │
                 │  │ colocar     │   │  (click der)│   │ (toast +    │                        │
                 │  │ → register  │   │  → register │   │  pistasIa++)│                        │
                 │  │  Move()     │   │  Move()     │   └─────────────┘                        │
                 │  └─────────────┘   └─────────────┘                                          │
                 │  ┌─────────────────────────────────────────────┐                            │
                 │  │ Comprobar → validación del reto             │                            │
                 │  │  (raycast | restricciones fila/columna)     │                            │
                 │  └────────────────────────┬────────────────────┘                            │
                 └───────────────────────────┼─────────────────────────────────────────────────┘
                                             │
                        ┌────────────────────┴────────────────────┐
                        │            ¿Reto resuelto?              │
                        └───┬─────────────────────────────┬───────┘
                            │ Sí                          │ No
                 ┌──────────▼──────────┐                 │ (continúa jugando)
                 │ completeGame(SUCCESS)│                 │
                 │  → snapshot intento  │                 │
                 │  → syncTelemetry()   │                 │
                 └──────────┬──────────┘                 │
                            │
              ┌─────────────┴──────────────┐
              │ ¿Último nivel del curso?    │
              └──┬───────────────────────┬─┘
                 │ No                    │ Sí
        ┌────────▼─────────┐   ┌─────────▼──────────────┐
        │ Banner "Nivel    │   │ Banner "¡Curso         │
        │ completado" +    │   │ Completado!" +         │
        │ "Siguiente Nivel"│   │ "Volver a mis cursos"  │
        │ → startGame()    │   └────────────────────────┘
        └──────────────────┘
```

## 4.2 Ciclo de Vida de un Intento (Telemetría)

1. **Inicio:** al montar el Stage se ejecuta `startGame(game)`; el store reinicia contadores
   y arranca el cronómetro de 1 s fuera del ciclo de renderizado.
2. **Interacción:** cada colocación válida o rotación invoca `registerMove()`; cada pista
   invoca `requestHint()`; cada reinicio invoca `resetGame()` (incrementa `reinicios`).
3. **Cierre:** `completeGame(result)` detiene el cronómetro, construye el objeto
   `AttemptMetrics` con `studentId` obtenido del estado de autenticación y lo agrega al
   historial local (`attempts[]`).
4. **Sincronización:** `syncTelemetry(attempt)` realiza un `fetch POST /api/v1/telemetry`
   con el JWT (cabecera `Authorization: Bearer` y cookie). Cualquier fallo de red o HTTP
   se captura y registra sin interrumpir la interfaz (fire-and-forget).

## 4.3 Procesamiento en el Backend

1. `TelemetryController` valida el payload (`jakarta.validation`) y responde `201 Created`.
2. `SaveAttemptService` aplica reglas de dominio (no negativos, formato de fecha ISO-8601)
   y delega en el puerto de salida.
3. `TelemetryPersistenceAdapter` persiste el registro en `telemetry_attempts`.
4. Los datos quedan disponibles para el panel docente, el ranking y los modelos de IA.

## 4.4 Flujo del Docente

- Inicia sesión con rol `TEACHER` y accede al dashboard (`/docente/*`).
- Consulta métricas, retos, estudiantes y ranking poblados por el seedeo oficial.
- Crea retos seleccionando el entorno `neonflow` o `tetrilogic` en el formulario de retos.
