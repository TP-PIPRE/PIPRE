# 6. Guía de Despliegue y Ejecución Local

## 6.1 Requisitos Previos

| Herramienta | Versión mínima |
|-------------|----------------|
| Node.js + pnpm | Node 20+, pnpm 11 |
| JDK | 21 |
| Maven (wrapper incluido) | 3.9+ |
| PostgreSQL | 16 |
| Docker (opcional) | 24+ |

## 6.2 Ejecución Local del Backend

```powershell
# 1. Base de datos PostgreSQL disponible (local o vía Docker):
docker compose up -d postgres

# 2. Variables de entorno requeridas (application.yaml):
#    DATABASE_URL=jdbc:postgresql://localhost:5432/pipre_database
#    POSTGRES_USER=pipre_user
#    POSTGRES_PASSWORD=pipre_password
#    JWT_SECRET=clave_secreta_segura_desarrollo_muy_larga_para_pipre

# 3. Compilar y ejecutar:
cd backend
.\mvnw.cmd spring-boot:run
```

- El backend queda disponible en `http://localhost:8080`.
- Flyway aplica automáticamente las migraciones `V1`–`V12` y el seedeo oficial crea los
  cursos `c001` (Neon Flow) y `c002` (TetriLogic).
- Documentación OpenAPI/Scalar: `http://localhost:8080/scalar`.

## 6.3 Ejecución Local del Frontend

```powershell
cd frontend
pnpm install
pnpm dev
```

- La aplicación queda disponible en `http://localhost:5173`.
- El proxy de Vite redirige `/api/v1` al backend local (`VITE_USE_LOCAL_BACKEND=true` →
  `http://localhost:8080`, sin doble prefijo) o al backend remoto según configuración.

## 6.4 Credenciales de Prueba (Seedeo)

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Administrador | `admin@pipre.com` | `123` |
| Docente | `docente@pipre.com` | `123` |
| Estudiante | `alumno@pipre.com` | `123` |

## 6.5 Despliegue con Docker Compose

```powershell
# En la raíz del repositorio:
docker compose up -d --build
```

Servicios levantados:

| Servicio | Contenedor | Puerto |
|----------|------------|--------|
| PostgreSQL 16 | `pipre-database` | 5432 |
| API de IA (FastAPI) | `pipre-ml-ia` | 8000 |
| Backend Spring Boot | `pipre-backend` | 8080 |
| Frontend (Vite) | `pipre-frontend` | 5173 |

## 6.6 Verificación de Sanidad

```powershell
# Frontend
cd frontend
pnpm tsc -b

# Backend
cd backend
.\mvnw.cmd compile
```

Flujo de validación manual sugerido: iniciar sesión como estudiante → seleccionar
`Neon Flow` (c001) o `TetriLogic` (c002) → resolver el reto usando pistas y reinicios →
verificar el banner de éxito y el registro en la tabla `telemetry_attempts`.
