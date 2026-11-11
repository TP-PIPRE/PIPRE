# Ayudas progresivas de Neon Flow y TetriLogic

**Estado del 10/11/2026.** El tutor progresivo se habilita para partidas nuevas de los retos oficiales de Neon Flow (`c001`) y TetriLogic (`c002`). Las partidas anteriores conservan la ayuda y la rúbrica asignadas al iniciarse.

## Comportamiento solicitado

Neon Flow toma las ayudas fijas de su catálogo y usa el estado del haz para preparar las generadas. TetriLogic toma los cinco consejos fijos de las dimensiones y los objetivos publicados. Para las ayudas generadas usa la diferencia entre el conteo comprobado y el objetivo de la fila o columna, además de las acciones recientes. [Catálogo de Neon Flow](../../backend/src/main/resources/catalog/neonflow-progressive-advice.json)

| Entrega en el reto | Consejo | Efecto en las estrellas |
|---|---|---|
| 1–5 | Cinco textos fijos en orden para la plantilla del reto | Sin penalización por ayuda |
| 6–8 | Consejo generado a partir del estado confirmado de la partida | Sin penalización por ayuda |
| 9 en adelante | Consejo generado después de aceptar un aviso | Cuenta como una ayuda en la rúbrica del intento |

Una solicitud cancelada, fallida u obsoleta conserva el siguiente número. El aviso de la novena ayuda aparece al solicitarla. Cerrar el aviso permite seguir jugando con el mismo contador y las mismas estrellas potenciales.

## Decisiones y entorno de prueba

- **Proveedor acordado.** La prueba local usa Ollama con Qwen3 4B en la PC de desarrollo. En el colegio, Ollama y el modelo se ejecutan en el servidor de la aplicación o en un equipo dedicado dentro de su red. Los estudiantes usan el navegador. [Modelo](https://ollama.com/library/qwen3:4b) · [Respuestas estructuradas](https://docs.ollama.com/capabilities/structured-outputs)
- **Repetición del reto acordada.** El cupo se conserva por estudiante y plantilla oficial entre intentos. Para las estrellas se cuentan únicamente las ayudas adicionales que se entreguen en el intento que se completa.
- **Tiempo de espera acordado.** Los puntos mantienen la fórmula actual. Del tiempo usado para calcularlos se excluye solo la espera de la IA que el servidor pueda acreditar mientras el tablero esté pausado. El historial, la duración de la partida y los logros conservan el tiempo real.

## Activación local

Con Ollama disponible en el equipo, descarga una vez el modelo con `ollama pull qwen3:4b`. Arranca Ollama si el servicio está detenido. Configura el backend con estas variables antes de iniciarlo.

| Variable | Valor para la prueba local |
|---|---|
| `PIPRE_TUTOR_PROGRESSIVE_ENABLED` | `true` |
| `PIPRE_TUTOR_PROGRESSIVE_BASE_URL` | `http://localhost:11434` para Spring local. Docker Compose local usa `http://host.docker.internal:11434`. |
| `PIPRE_TUTOR_PROGRESSIVE_MODEL` | `qwen3:4b` |
| `PIPRE_TUTOR_PROGRESSIVE_TIMEOUT` | `15s` |

Recompila el backend y el frontend con los cambios. Flyway aplica V31 de forma aditiva en instalaciones que aún no la tienen. Abre un reto oficial de cualquiera de los dos juegos con una cuenta estudiantil e inicia una partida nueva. La ruta de práctica y el diario ofrecen sus consejos habituales.

Precarga el modelo antes de la prueba para separar la carga inicial del tiempo de respuesta al estudiante. La solicitud vacía carga el modelo sin generar un consejo. [Precarga de modelos en Ollama](https://docs.ollama.com/faq#how-can-i-preload-a-model-into-ollama-to-get-faster-response-times)

```powershell
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:11434/api/generate' `
  -ContentType 'application/json' `
  -Body '{"model":"qwen3:4b","keep_alive":"30m","stream":false,"options":{"num_ctx":2048}}'
```

## Persistencia y verificación

- V31 guarda entregas y reservas de generación de ambos juegos. El identificador canónico de la plantilla incluye el juego y el nivel, de modo que los contadores son independientes. La API verifica el propietario, la revisión, el orden y la aceptación antes de avanzar. Si se pierde la respuesta, el mismo identificador o una consulta al estado recuperan el consejo registrado.
- El proveedor recibe el diagnóstico y las acciones recientes del juego fuera de la transacción. El formato distingue la observación, la explicación, la pregunta y la comparación. Si el texto resulta inválido o repetido, el adaptador pide una alternativa dentro del mismo plazo. Una solicitud fallida deja libre el mismo número. El servidor mantiene la pausa mientras la reserva está vigente y descuenta de los puntos el intervalo acreditado, limitado por su vencimiento.
- La rúbrica de estrellas recibe solo las ayudas adicionales del intento. Los cambios de tablero y las recargas recuperan el contador desde la base de datos.

Para verificar el flujo en el navegador con Ollama precargado, ejecuta esta prueba desde la raíz del repositorio. Usa un estudiante de prueba y PostgreSQL desechable.

```powershell
$env:PIPRE_AUDIT_PROGRESSIVE_ENABLED = 'true'
./scripts/audit-environment.ps1 -Action Start
Push-Location frontend
try {
    pnpm run test:e2e:run --browser electron --spec tests/e2e/progressive-ollama.cy.ts
} finally {
    Pop-Location
    ./scripts/audit-environment.ps1 -Action Stop
    Remove-Item Env:PIPRE_AUDIT_PROGRESSIVE_ENABLED
}
```

### Resultados en la PC de desarrollo

- El catálogo contiene cinco consejos distintos para cada uno de los 30 retos oficiales.
- Cypress completó el flujo con Qwen3 4B real y una cuenta desechable. Entregó los consejos 1–5, conservó el contador tras recargar y entregó las ayudas generadas 6–8 sin aviso. Cancelar el aviso de la novena conservó el contador en ocho. Tras aceptarlo, PostgreSQL registró la novena como ayuda con penalización.
- Pasaron las 22 pruebas de integración en PostgreSQL. Se verificaron las estrellas de distintos intentos, la separación del contador por reto, las solicitudes simultáneas, el error del proveedor y la exclusión de la espera acreditada del cálculo de puntos. También pasaron las 12 pruebas del adaptador Ollama.
- En la última prueba, las cuatro ayudas generadas tardaron entre 0,77 y 1,73 segundos con el modelo precargado. Una carga inicial en esta PC tardó unos 67 segundos. Estas mediciones corresponden a una sesión local.

Con TetriLogic incorporado, Cypress completó el flujo hasta la novena ayuda con Ollama real en ambos juegos. Pasaron 23 pruebas de integración en PostgreSQL, 26 de sesión y adaptador en Java y 44 de sesión en el frontend. La integración verificó que los contadores de ambos juegos son independientes y que un reto de TetriLogic conserva el suyo entre intentos. La ayuda adicional se aplicó solo a las estrellas del intento en que se entregó.

## Pendientes de validación para el colegio

- [ ] Medir latencia, concurrencia y calidad en español con el hardware del colegio y la carga de un aula. Comprobar que los consejos orienten sin indicar la solución.
- [ ] Elegir la ubicación del servicio de inferencia y probar su acceso privado desde el backend. Aplicar la migración y activar el tutor en el entorno acordado después de verificar la configuración.
