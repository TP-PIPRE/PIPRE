# PIPRE

Plataforma educativa para practicar lógica y razonamiento espacial mediante simuladores interactivos. Los estudiantes exploran y resuelven retos; docentes y administradores organizan el contenido y consultan la información académica disponible.

**Catálogo actual: 60 retos oficiales, 30 por simulador.**

[Simuladores](#simuladores) · [Inicio local](#inicio-local-con-docker) · [Cuentas de prueba](#cuentas-de-prueba) · [Estructura](#estructura-del-proyecto) · [Documentación](#documentación)

## Simuladores

| Simulador | ¿Qué debes hacer? | Retos oficiales |
|---|---|---|
| **Neon Flow** | Guiar un haz de luz con espejos y filtros hasta el receptor del color correcto. | 30 |
| **TetriLogic** | Colocar y girar piezas hasta igualar los objetivos de ocupación de cada fila y columna. | 30 |

En TetriLogic puedes mover, girar y devolver piezas libremente, respetando límites y colisiones. Los conteos pueden superarse mientras experimentas; el reto se completa cuando todos coinciden, incluidos los ceros. No es necesario llenar todo el tablero.

Para empezar: **Iniciar sesión → Mis cursos → Elegir un curso → Seleccionar un reto → Iniciar**.

## Inicio local con Docker

### 1. Preparar el entorno

Necesitas **Docker Desktop iniciado**, **Docker Compose v2** y los puertos **5173** y **8081** disponibles. Ejecuta los comandos en **PowerShell, desde la raíz del repositorio**.

Crea `.env` a partir del ejemplo únicamente si todavía no existe:

```powershell
if (-not (Test-Path -LiteralPath .env)) {
    Copy-Item -LiteralPath .env.example -Destination .env
}
```

Revisa que `DATABASE_URL` corresponda a la base local prevista. Para PostgreSQL dentro de este Compose, el ejemplo usa `jdbc:postgresql://postgres:5432/pipre_database`.

### 2. Iniciar los servicios

Este procedimiento inicia PostgreSQL, backend y frontend. El servicio de IA queda fuera del arranque.

```powershell
$env:PORT_BACK = '8081'
$env:PORT_FRONT = '5173'
$env:PIPRE_COOKIE_SECURE = 'false'
$env:PIPRE_COOKIE_SAME_SITE = 'Lax'
$env:PIPRE_ALLOWED_ORIGINS = 'http://localhost:5173'

docker compose -f docker-compose.local.yaml up -d postgres
docker compose -f docker-compose.local.yaml up --build -d --no-deps backend frontend
docker compose -f docker-compose.local.yaml ps
```

Espera a que PostgreSQL aparezca saludable y el backend termine de arrancar. La primera compilación puede tardar varios minutos.

### 3. Abrir la aplicación

| Servicio | Dirección con la configuración anterior |
|---|---|
| **PIPRE — interfaz web** | [http://localhost:5173](http://localhost:5173) |
| Backend | [http://localhost:8081](http://localhost:8081) |
| Salud del backend | [http://localhost:8081/actuator/health](http://localhost:8081/actuator/health) |
| Documentación de la API | [http://localhost:8081/scalar](http://localhost:8081/scalar) |

Los puertos corresponden a los valores fijados arriba. Para ejecución nativa, otros entornos o problemas de conexión, consulta la [guía completa de ejecución](docs/sistema/06_Guia_Despliegue_Ejecucion_Local.md).

### Detener la aplicación

Detén los servicios conservando sus contenedores:

```powershell
docker compose -f docker-compose.local.yaml stop backend frontend postgres
```

> **Datos locales:** el Compose actual no declara un volumen nombrado para PostgreSQL. Respalda la base antes de eliminar o recrear su contenedor; `down` seguido de `up` no garantiza recuperar automáticamente los mismos datos.

> **Archivos Compose:** `docker-compose.override.yaml` es configuración, no un programa ejecutable. Usa los comandos anteriores con `-f docker-compose.local.yaml`; la combinación principal/override conserva diferencias de redes y nombres.

## Cuentas de prueba

Las cuentas iniciales de desarrollo se crean cuando se ejecuta el bootstrap de usuarios:

| Rol | Correo | Contraseña inicial |
|---|---|---|
| Estudiante | `alumno@pipre.com` | `123` |
| Docente | `docente@pipre.com` | `123` |
| Administrador | `admin@pipre.com` | `123` |

Son credenciales de desarrollo. Una base existente puede tener cuentas modificadas; no borres la base para restablecer el acceso.

## Estado y alcance

- **Catálogo:** 30 retos oficiales por juego. Los prototipos y alias compatibles se conservan y no se cuentan otra vez; una base existente puede mostrar 62 actividades al preservar dos prototipos de Neon Flow.
- **Trazabilidad:** ambos juegos registran intentos y acciones autorizados. Esto no concede automáticamente notas, puntos, XP ni progreso académico, y no guarda una partida para reanudarla.
- **Ayudas e IA:** la pista de Neon Flow es estática. El tutor adaptativo, los modelos ML y los retos diarios conservan su alcance pendiente; `data-science` sigue excluido de las intervenciones actuales.
- **Datos de demostración:** `pipre.seed.demo-data=false` evita resultados y analítica aleatorios. El bootstrap aún crea usuarios ficticios; deben distinguirse de estudiantes reales antes de analizar datos.

Consulta el [estado consolidado](docs/ESTADO_ACTUAL.md) para conocer lo implementado, las evidencias y los pendientes.

## Estructura del proyecto

```text
frontend/       Interfaz React, TypeScript, Vite y Tailwind CSS
backend/        API Java 21 / Spring Boot, persistencia y migraciones Flyway
docs/           Manual, guías, simuladores, informes e historial
design-system/  Criterios visuales y componentes del sistema de diseño
scripts/        Generación y verificación de catálogos e integridad
SDD/            Documentos de diseño de los simuladores
data-science/   Servicio y recursos de IA; fuera del alcance actual
```

La base de datos es PostgreSQL 16. El frontend y el backend mantienen una separación por capas; el detalle está en el [manual de arquitectura](docs/sistema/02_Arquitectura_del_Sistema.md).

## Documentación

| Necesitas… | Consulta |
|---|---|
| Encontrar la documentación del proyecto | [Índice principal](docs/README.md) |
| Conocer el alcance vigente | [Estado actual](docs/ESTADO_ACTUAL.md) |
| Instalar y ejecutar PIPRE | [Ejecución local](docs/sistema/06_Guia_Despliegue_Ejecucion_Local.md) |
| Entender los módulos y la navegación | [Manual del sistema](docs/sistema/README.md) |
| Revisar integración y permisos | [Contratos](docs/guias/Contratos_Frontend_Backend.md) · [Roles y endpoints](docs/guias/Clasificacion_Endpoints_Roles.md) |
| Consultar propuestas de endpoints y su relación con IA | [Pendientes backend](docs/guias/Pendientes_Endpoints_Backend.md) · [Contratos IA y datos](req-ia-endpoints.md) |
| Crear o conectar actividades con sus tableros | [Guía de retos](docs/guias/Guia_Implementacion_30_Retos.md) |
| Revisar pruebas y decisiones de integración | [Informe del 30/10/2026](docs/informes/Integracion_TetriLogic_NeonFlow_ML.md) |

Para continuar el desarrollo, lee [AGENTS.md](AGENTS.md). Las migraciones aplicadas V1…V17 se conservan; los generadores de catálogo se ejecutan únicamente con `--check`.
