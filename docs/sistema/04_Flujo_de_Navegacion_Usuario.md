# 4. Navegación y ciclo de un intento

**Actualizado: 30/10/2026.** [Manual](README.md) · [Permisos](../guias/Clasificacion_Endpoints_Roles.md).

## Recorrido del estudiante

1. Iniciar sesión. El navegador recibe la cookie HttpOnly y la interfaz conserva únicamente metadatos de navegación.
2. En **Mis cursos**, abrir un curso y elegir su actividad.
3. **Iniciar** abre `/simulador/:courseId?activity=:idActivity`.
4. El simulador comprueba que la actividad pertenece al curso y resuelve su `levelTemplate`.
5. Para plantillas oficiales v2, cargar y verificar `{ templateId, version, config }` desde la API.
6. Manipular el tablero correspondiente. Cambiar de actividad limpia el estado anterior.

Una actividad o configuración desconocida conserva un aviso específico. La práctica `/simulador` abre TetriLogic sin actividad, de modo que su traza puede tener actividad nula.

## Completar y continuar

| Juego | Validación y respuesta |
|---|---|
| Neon Flow | Pulsar Comprobar; se calcula el haz y se verifican receptores/color. La pista es estática. |
| TetriLogic | Los conteos de filas/columnas se actualizan al manipular; todos deben coincidir, incluidos ceros. La confirmación es automática y se puede seguir moviendo piezas. |

Volver a Mis cursos o elegir otra actividad no equivale a guardar progreso académico. La práctica independiente Neon Flow conserva navegación de niveles local; no debe confundirse con haber completado un curso persistido.

## Episodio observado

1. El observador se prepara con juego, actividad opcional, plantilla y versión de reglas. Una visita sin acciones no genera un intento vacío.
2. Se registran selección, colocación, giros, devolución, reinicio, comprobación, ayuda o rechazo según corresponda al juego; no cada píxel de movimiento.
3. El episodio se cierra con éxito o abandono y conserva inicio/fin, tiempo relativo y estados del tablero. Una comprobación incorrecta permite continuar.
4. Después de un éxito, una nueva mutación del tablero abre otro episodio desde el estado real anterior. Reiniciar durante un episodio es un evento; no equivale siempre a crear otra fila de intento.
5. La cola usa el cliente Axios configurado y sólo envía bajo el mismo estudiante autenticado. Reintenta con el mismo identificador/contenido; el servidor evita duplicados aceptados.

Al salir se intenta enviar; un cierre forzado, corte de luz o sesión sin conexión puede perder eventos aún no entregados. La cola no es un guardado de partida ni reanudación. Los registros son declarados por el cliente y no otorgan resultados académicos.

## Recorrido de gestión

Docentes y administradores acceden a `/docente/dashboard`, `/docente/metricas`, `/docente/retos` y `/docente/estudiantes`. En Retos pueden crear estructura y actividad, seleccionar entorno/plantilla y comprobar tras recargar que se conservan descripción, orden, misiones y lección.

La verificación final de un reto exige abrirlo también como estudiante y comprobar su tablero y solución. No basta con guardar una tarjeta. [Guía de implementación](../guias/Guia_Implementacion_30_Retos.md).
