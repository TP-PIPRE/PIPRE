# Clasificación de Endpoints por Roles — PIPRE Backend

Este documento clasifica todos los endpoints expuestos en el backend de PIPRE según los permisos de acceso y el Control de Acceso Basado en Roles (RBAC) para los tres roles definidos: `ADMIN`, `TEACHER` (Docente), y `STUDENT` (Estudiante).

---

## 🔑 Matriz de Permisos Rápida

| Controlador / Recurso | Endpoint (Ruta) | Método | STUDENT | TEACHER | ADMIN |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Autenticación** | `/api/v1/auth/login` | `POST` | 🟢 PÚB | 🟢 PÚB | 🟢 PÚB |
| | `/api/v1/auth/logout` | `POST` | 🔐 AUT | 🔐 AUT | 🔐 AUT |
| **Usuarios** | `/api/v1/users` | `POST` | 🟢 PÚB | 🟢 PÚB | 🟢 PÚB |
| | `/api/v1/users/{userId}` | `GET` | 🔐 AUT | 🔐 AUT | 🔐 AUT |
| **Roles** | `/api/v1/roles` | `GET` | ❌ NO | ❌ NO | 🔴 SÍ |
| | `/api/v1/roles/user` | `POST` | ❌ NO | ❌ NO | 🔴 SÍ |
| **Cursos** | `/api/v1/courses` | `GET` | 🔐 AUT | 🔐 AUT | 🔐 AUT |
| | `/api/v1/courses` | `POST` | ❌ NO | 🟠 SÍ | 🔴 SÍ |
| | `/api/v1/courses/{idCourse}` | `PUT` | ❌ NO | 🟠 SÍ | 🔴 SÍ |
| **Módulos** | `/api/v1/modules/course/{idCourse}` | `GET` | 🔐 AUT | 🔐 AUT | 🔐 AUT |
| | `/api/v1/modules` | `POST` | ❌ NO | 🟠 SÍ | 🔴 SÍ |
| **Lecciones** | `/api/v1/lessons/module/{idModule}` | `GET` | 🔐 AUT | 🔐 AUT | 🔐 AUT |
| | `/api/v1/lessons` | `POST` | ❌ NO | 🟠 SÍ | 🔴 SÍ |
| **Actividades** | `/api/v1/activities/lesson/{idLesson}` | `GET` | 🔐 AUT | 🔐 AUT | 🔐 AUT |
| | `/api/v1/activities` | `POST` | ❌ NO | 🟠 SÍ | 🔴 SÍ |
| **Grupos** | `/api/v1/groups` | `GET` | 🔐 AUT | 🔐 AUT | 🔐 AUT |
| **Ranking** | `/api/v1/group-students/{idGroup}` | `GET` | 🔐 AUT | 🔐 AUT | 🔐 AUT |
| | `/api/v1/group-students` | `POST` | ❌ NO | 🟠 SÍ | 🔴 SÍ |
| **Resultados** | `/api/v1/activity-results/user/{idStudent}` | `GET` | 🔐 AUT* | 🔐 AUT | 🔐 AUT |
| | `/api/v1/activity-results` | `POST` | 🔐 AUT | 🔐 AUT | 🔐 AUT |
| **Simulaciones** | `/api/v1/simulations/user/{idStudent}` | `GET` | 🔐 AUT* | 🔐 AUT | 🔐 AUT |
| | `/api/v1/simulations` | `POST` | 🔐 AUT | 🔐 AUT | 🔐 AUT |

> **Leyendas:**
> * 🟢 **PÚB**: Endpoint público (sin autenticar).
> * 🔐 **AUT**: Endpoint autenticado (cualquier rol válido tiene acceso).
> * 🔐 **AUT***: El estudiante solo puede consultar sus propios datos. Los docentes y administradores pueden consultar los de cualquiera.
> * 🔴 **SÍ / Admin**: Reservado para el administrador del sistema.
> * 🟠 **SÍ / Docente**: Reservado para docentes y administradores.
> * ❌ **NO**: Acceso denegado.

---

## 🛠️ Detalle de Reglas de Seguridad a Implementar

### 1. Endpoints Públicos (PermitAll)
* `POST /api/v1/auth/login` — Inicio de sesión y asignación de cookie.
* `POST /api/v1/users` — Registro inicial de usuarios.

### 2. Endpoints Exclusivos para Administradores (`hasRole('ADMIN')`)
* `GET /api/v1/roles` — Consultar catálogo completo de roles.
* `POST /api/v1/roles/user` — Asignación manual de roles a usuarios.

### 3. Endpoints para Docentes y Administradores (`hasAnyRole('TEACHER', 'ADMIN')`)
* `POST /api/v1/courses` — Creación de cursos.
* `PUT /api/v1/courses/{idCourse}` — Edición de cursos.
* `POST /api/v1/modules` — Creación de módulos.
* `POST /api/v1/lessons` — Creación de lecciones.
* `POST /api/v1/activities` — Creación de actividades.
* `POST /api/v1/group-students` — Asignar un estudiante a un grupo (inscribirlo).

### 4. Endpoints Generales de Lectura / Operación del Alumno (`hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')`)
* `POST /api/v1/auth/logout` — Cerrar sesión.
* `GET /api/v1/users/{userId}` — Obtener datos del perfil.
* `GET /api/v1/courses` — Ver lista de cursos.
* `GET /api/v1/modules/course/{idCourse}` — Ver módulos de un curso.
* `GET /api/v1/lessons/module/{idModule}` — Ver lecciones de un módulo.
* `GET /api/v1/activities/lesson/{idLesson}` — Ver actividades de una lección.
* `GET /api/v1/groups` — Listar grupos.
* `GET /api/v1/group-students/{idGroup}` — Ver el ranking de un grupo.
* `POST /api/v1/activity-results` — Guardar resultado de una actividad.
* `POST /api/v1/simulations` — Guardar resultado de una simulación.
* `GET /api/v1/activity-results/user/{idStudent}` — Obtener resultados de actividades. *(Nota: El estudiante solo debe poder consultar su propio ID, mientras que TEACHER y ADMIN pueden consultar cualquiera)*.
* `GET /api/v1/simulations/user/{idStudent}` — Obtener simulaciones de un estudiante. *(Nota: El estudiante solo debe poder consultar su propio ID, mientras que TEACHER y ADMIN pueden consultar cualquiera)*.
