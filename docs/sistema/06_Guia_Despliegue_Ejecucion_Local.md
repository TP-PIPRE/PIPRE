# 6. Despliegue y ejecución local

**Revisado: 30/10/2026.** [Manual](README.md) · [Estado actual](../ESTADO_ACTUAL.md).

## Requisitos

Para contenedores: Docker Desktop con Compose v2 y los puertos del host disponibles. Para ejecución nativa: Java 21, el wrapper Maven incluido, PostgreSQL 16 accesible y Node compatible con Vite 8/pnpm 11. El build Docker usa Node 22; el manifiesto fija pnpm 11.7.0. [Configuración frontend](../../frontend/package.json).

Los comandos PowerShell siguientes parten de la raíz del repositorio. Revisar el `.env` existente; no sustituirlo si ya contiene una configuración de trabajo.

## Docker local sin iniciar IA

```powershell
if (-not (Test-Path -LiteralPath .env)) {
    Copy-Item -LiteralPath .env.example -Destination .env
}
$env:PORT_BACK = '8081'
$env:PORT_FRONT = '5173'
$env:PIPRE_COOKIE_SECURE = 'false'
$env:PIPRE_COOKIE_SAME_SITE = 'Lax'
$env:PIPRE_ALLOWED_ORIGINS = 'http://localhost:5173'

docker compose -f docker-compose.local.yaml up -d postgres
docker compose -f docker-compose.local.yaml up --build -d --no-deps backend frontend
docker compose -f docker-compose.local.yaml ps
```

Se usa explícitamente [docker-compose.local.yaml](../../docker-compose.local.yaml). Esperar PostgreSQL saludable y revisar que `DATABASE_URL` del entorno apunte a la base local prevista; una variable exportada tiene prioridad sobre `.env`. `--no-deps` limita la actualización del backend/frontend a esos servicios.

| Servicio | Acceso con los valores anteriores |
|---|---|
| Frontend estático | `http://localhost:5173` → puerto 3000 del contenedor |
| Backend | `http://localhost:8081` → puerto 8080 del contenedor |
| Salud / API | `http://localhost:8081/actuator/health` · `/scalar` |
| PostgreSQL | `postgres:5432` en la red Docker; el Compose local no publica 5432 al host. |
| `ml-ia` | No se inicia ni reconstruye en este procedimiento. |

Los puertos 8081/5173 son los fijados en este ejemplo y usados en la validación previa. No son valores universales: el Compose local usa por defecto 8080/3000 cuando no hay variables; `.env.example` propone 8080/5173.

Para detener conservando los contenedores:

```powershell
docker compose -f docker-compose.local.yaml stop backend frontend postgres
```

El archivo local **no declara un volumen nombrado de PostgreSQL**. La imagen conserva los datos en el almacenamiento de su contenedor/volumen anónimo; no asumir que crear otro contenedor o ejecutar `down` y después `up` recuperará automáticamente la misma base. Mantener los contenedores y respaldar antes de recreaciones. Definir persistencia nombrada requiere un cambio técnico separado, no aplicado por esta revisión documental. No usar `down -v` para actualizar el catálogo.

## Diferencia entre archivos Compose

| Configuración | Comportamiento y límite |
|---|---|
| `docker-compose.local.yaml` | Configuración explícita usada arriba; selecciona sólo los tres servicios requeridos. |
| `docker-compose.yaml` + `docker-compose.override.yaml` | Compose habitual combina ambos; usa nombres `dev-*` y todavía conserva la red externa `cloud-network` de la base. |

`docker-compose.override.yaml` es un archivo de configuración, no un comando ejecutable. El override actual no basta para afirmar que la red externa dejó de ser necesaria. Tampoco usar un `up` general que incluya IA mientras se mantenga su exclusión. No se modifica aquí ningún archivo Compose.

## Ejecución nativa opcional

Requiere una base PostgreSQL accesible desde el host. La base del Compose local anterior no expone por sí sola ese puerto; configurar una instalación accesible o un override propio revisado antes de usar el ejemplo nativo.

En una terminal para backend:

```powershell
$env:DATABASE_URL = 'jdbc:postgresql://localhost:5432/pipre_database'
$env:POSTGRES_USER = 'pipre_user'
$env:POSTGRES_PASSWORD = 'CONTRASENA_DE_TU_BASE_LOCAL'
$env:JWT_SECRET = 'CLAVE_LOCAL_PROPIA_DE_LONGITUD_SUFICIENTE'
Set-Location backend
.\mvnw.cmd spring-boot:run
```

El backend nativo usa 8080 por defecto. Spring no importa automáticamente el `.env` de Compose: exportar su configuración en la terminal. Flyway valida/aplica V1…V17 y Hibernate valida el esquema; no borrar/recrear cursos para incorporar retos.

En otra terminal, crear `frontend/.env.local` con:

```dotenv
VITE_USE_LOCAL_BACKEND=true
VITE_LOCAL_BACKEND_URL=http://localhost:8080
```

Después:

```powershell
Set-Location frontend
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Usar sólo una instancia frontend por puerto. En Docker, las variables VITE se incorporan durante el build: cambiar únicamente variables del contenedor estático no recompila el JavaScript.

## Cuentas iniciales de desarrollo

| Rol | Correo | Contraseña inicial |
|---|---|---|
| Administrador | `admin@pipre.com` | `123` |
| Docente | `docente@pipre.com` | `123` |
| Estudiante | `alumno@pipre.com` | `123` |

Son cuentas del bootstrap local, no credenciales de producción. Su presencia depende de que el seeder haya ejecutado la creación de usuarios; una base existente puede tener cuentas editadas. No borrar la base para restablecer una cuenta. El bootstrap también crea diez estudiantes ficticios: `pipre.seed.demo-data=false` evita resultados/analítica aleatorios, pero no esas cuentas.

## Comprobaciones de continuación

Desde la raíz, con las herramientas instaladas:

```powershell
node scripts/generate_neonflow_catalog.mjs --check
python scripts/generate_tetrilogic_catalog.py --check
python scripts/verify_source_integrity.py
pnpm --dir frontend test:run --maxWorkers=2 --testTimeout=20000
pnpm --dir frontend build
Set-Location backend
.\mvnw.cmd -B test
```

Los generadores se ejecutan sólo con `--check`: V1…V17 están publicadas. Un build con `-DskipTests` no cuenta como pruebas ejecutadas. El lint global tiene deuda histórica; no asumir que todas las comprobaciones generales están aprobadas.

El [informe de integración](../informes/Integracion_TetriLogic_NeonFlow_ML.md) contiene resultados ejecutados y límites. Esta guía no presenta sus comandos como ejecutados nuevamente por una edición de documentos. Para HTTPS revisar cookies, CORS, proxy y CSRF con la configuración real.
