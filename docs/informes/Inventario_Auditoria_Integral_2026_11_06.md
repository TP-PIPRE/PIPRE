# Inventario de la auditoría integral — 06/11/2026

Instantánea del código y de las rutas registradas por Spring durante la suite. Complementa el [informe](Auditoria_Integral_2026_11_06.md); inventariar una ruta no equivale a probar todas sus combinaciones de campos/roles. Las áreas excluidas se identifican en el informe.

## Backend: rutas y permisos

52 combinaciones de ruta/método en 23 controladores. La autorización de método se complementa con filtros de seguridad y validación de identidad dentro de servicios; un campo vacío no implica acceso anónimo.

| Controlador | Método | Ruta | Autorización registrada |
|---|---|---|---|
| [ActivityController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/ActivityController.java) | `[POST]` | `/api/v1/activities` | `hasAnyRole('TEACHER', 'ADMIN')` |
| [ActivityController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/ActivityController.java) | `[GET]` | `/api/v1/activities/lesson/{idLesson}` | `hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')` |
| [ActivityController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/ActivityController.java) | `[DELETE]` | `/api/v1/activities/{id}` | `hasAnyRole('TEACHER', 'ADMIN')` |
| [ActivityController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/ActivityController.java) | `[GET]` | `/api/v1/activities/{id}` | `hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')` |
| [ActivityController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/ActivityController.java) | `[PUT]` | `/api/v1/activities/{id}` | `hasAnyRole('TEACHER', 'ADMIN')` |
| [AuthController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/AuthController.java) | `[POST]` | `/api/v1/auth/login` | `public` |
| [AuthController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/AuthController.java) | `[POST]` | `/api/v1/auth/logout` | `public` |
| [CourseController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/CourseController.java) | `[GET]` | `/api/v1/courses` | `hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')` |
| [CourseController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/CourseController.java) | `[POST]` | `/api/v1/courses` | `hasAnyRole('TEACHER', 'ADMIN')` |
| [CourseController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/CourseController.java) | `[DELETE]` | `/api/v1/courses/{idCourse}` | `hasAnyRole('TEACHER', 'ADMIN')` |
| [CourseController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/CourseController.java) | `[PUT]` | `/api/v1/courses/{idCourse}` | `hasAnyRole('TEACHER', 'ADMIN')` |
| [CourseModuleRankingController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/CourseModuleRankingController.java) | `[GET]` | `/api/v1/ranking/course/{courseId}` | `hasAnyRole('TEACHER', 'ADMIN')` |
| [CourseModuleRankingController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/CourseModuleRankingController.java) | `[GET]` | `/api/v1/ranking/module/{moduleId}` | `hasAnyRole('TEACHER', 'ADMIN')` |
| [DailyChallengeController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/DailyChallengeController.java) | `[GET]` | `/api/v1/daily-challenges/today` | `hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#studentId)` |
| [DailyChallengeController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/DailyChallengeController.java) | `[GET]` | `/api/v1/daily-challenges/today/set` | `hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#studentId)` |
| [DropoutRiskController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/DropoutRiskController.java) | `[GET]` | `/api/v1/dropout-risk/{idStudent}` | `hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#idStudent)` |
| [GameSessionController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/GameSessionController.java) | `[POST]` | `/api/v1/game-sessions` | `hasRole('STUDENT') and @securityService.isCurrentUser(#request.studentId())` |
| [GameSessionController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/GameSessionController.java) | `[POST]` | `/api/v1/game-sessions/{sessionId}/actions` | `hasRole('STUDENT')` |
| [GameSessionController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/GameSessionController.java) | `[POST]` | `/api/v1/game-sessions/{sessionId}/complete` | `hasRole('STUDENT')` |
| [GroupController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/GroupController.java) | `[GET]` | `/api/v1/groups` | `hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')` |
| [GroupController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/GroupController.java) | `[GET]` | `/api/v1/groups/{idGroup}` | `hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')` |
| [HelpRequestController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/HelpRequestController.java) | `[POST]` | `/api/v1/help-requests` | `hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#command.idStudent())` |
| [HelpRequestController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/HelpRequestController.java) | `[GET]` | `/api/v1/help-requests/{idStudent}` | `hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#idStudent)` |
| [HomeController](../../backend/src/main/java/com/pipre/backend/HomeController.java) | `[GET]` | `/` | `public` |
| [LessonController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/LessonController.java) | `[POST]` | `/api/v1/lessons` | `hasAnyRole('TEACHER', 'ADMIN')` |
| [LessonController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/LessonController.java) | `[GET]` | `/api/v1/lessons/module/{idModule}` | `hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')` |
| [ModuleController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/ModuleController.java) | `[POST]` | `/api/v1/modules` | `hasAnyRole('TEACHER', 'ADMIN')` |
| [ModuleController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/ModuleController.java) | `[GET]` | `/api/v1/modules/course/{idCourse}` | `hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')` |
| [ModuleController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/ModuleController.java) | `[DELETE]` | `/api/v1/modules/{idModule}` | `hasAnyRole('TEACHER', 'ADMIN')` |
| [ModuleProgressController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/ModuleProgressController.java) | `[POST]` | `/api/v1/module-progress` | `hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#command.idStudent())` |
| [ModuleProgressController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/ModuleProgressController.java) | `[GET]` | `/api/v1/module-progress/user/{idStudent}` | `hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#idStudent)` |
| [NeonFlowTemplateController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/NeonFlowTemplateController.java) | `[GET]` | `/api/v1/neonflow/templates/{templateId}` | `hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')` |
| [PerformanceController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/PerformanceController.java) | `[POST]` | `/api/v1/performance/rating` | `hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')` |
| [ProfileController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/ProfileController.java) | `[GET]` | `/api/v1/profile/{idStudent}` | `hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#idStudent)` |
| [ProfileController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/ProfileController.java) | `[GET]` | `/api/v1/profile/{idStudent}/achievements` | `hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#idStudent)` |
| [ProfileController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/ProfileController.java) | `[GET]` | `/api/v1/profile/{idStudent}/achievements/export` | `hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#idStudent)` |
| [ProfileController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/ProfileController.java) | `[GET]` | `/api/v1/profile/{idStudent}/game-progress` | `hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#idStudent)` |
| [ProfileController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/ProfileController.java) | `[GET]` | `/api/v1/profile/{idStudent}/history` | `hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#idStudent)` |
| [RankingController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/RankingController.java) | `[POST]` | `/api/v1/group-students` | `hasAnyRole('TEACHER', 'ADMIN')` |
| [RankingController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/RankingController.java) | `[GET]` | `/api/v1/group-students/{idGroup}` | `hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')` |
| [RankingController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/RankingController.java) | `[DELETE]` | `/api/v1/group-students/{idGroup}/{idStudent}` | `hasAnyRole('TEACHER', 'ADMIN')` |
| [ResultController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/ResultController.java) | `[POST]` | `/api/v1/activity-results` | `hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#command.idStudent())` |
| [ResultController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/ResultController.java) | `[GET]` | `/api/v1/activity-results/user/{idStudent}` | `hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#idStudent)` |
| [RoleController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/RoleController.java) | `[GET]` | `/api/v1/roles` | `hasRole('ADMIN')` |
| [RoleController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/RoleController.java) | `[POST]` | `/api/v1/roles/user` | `hasRole('ADMIN')` |
| [SimulationController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/SimulationController.java) | `[POST]` | `/api/v1/simulations` | `hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#command.idStudent())` |
| [SimulationController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/SimulationController.java) | `[GET]` | `/api/v1/simulations/user/{idStudent}` | `hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#idStudent)` |
| [TelemetryController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/TelemetryController.java) | `[POST]` | `/api/v1/telemetry` | `hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#request.studentId())` |
| [TetriLogicTemplateController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/TetriLogicTemplateController.java) | `[GET]` | `/api/v1/tetrilogic/templates/{templateId}` | `hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')` |
| [UserController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/UserController.java) | `[GET]` | `/api/v1/users` | `hasAnyRole('TEACHER', 'ADMIN')` |
| [UserController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/UserController.java) | `[POST]` | `/api/v1/users` | `public` |
| [UserController](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/UserController.java) | `[GET]` | `/api/v1/users/{userId}` | `hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#userId)` |

## Frontend: páginas y acceso

| Página | Ruta activa | Responsabilidad |
|---|---|---|
| [LoginPage](../../frontend/src/ui/pages/LoginPage.tsx) | `/login` | Registro/acceso público |
| [PaginaInicio](../../frontend/src/ui/pages/PaginaInicio.tsx) | `/` | Catálogo curricular y diario |
| [Simulador](../../frontend/src/ui/pages/Simulador.tsx) | `/simulador/:courseId?` | Tableros oficiales/práctica/diario; actividad mediante query |
| [ResultadosPage](../../frontend/src/ui/pages/ResultadosPage.tsx) | `/resultados` | Resultados y registros académicos |
| [PerfilPage](../../frontend/src/ui/pages/PerfilPage.tsx) | `/perfil` | Perfil, progreso por juego y logros |
| [RankingPage](../../frontend/src/ui/pages/RankingPage.tsx) | `/ranking` | Ranking global/grupo; curso/módulo para gestión |
| [DocenteDashboard](../../frontend/src/ui/pages/DocenteDashboard.tsx) | `/docente/dashboard` | Resumen de gestión |
| [DocenteEstudiantesPage](../../frontend/src/ui/pages/DocenteEstudiantesPage.tsx) | `/docente/estudiantes` | Estudiantes y membresías de grupo |
| [DocenteRetosPage](../../frontend/src/ui/pages/DocenteRetosPage.tsx) | `/docente/retos` | CRUD curricular y actividades |
| [DocenteMetricasPage](../../frontend/src/ui/pages/DocenteMetricasPage.tsx) | `/docente/metricas` | Agregados de registros y riesgo persistido |
| [CursosPage](../../frontend/src/ui/pages/CursosPage.tsx) | `Sin ruta activa` | Componente conservado; no reactivar /cursos por los E2E antiguos |

`/docente` y las subrutas desconocidas de gestión redirigen a su dashboard; otras rutas desconocidas redirigen a login. Las rutas privadas requieren sesión y las de gestión rol docente/admin. Los metadatos del navegador no autorizan operaciones en servidor.

## Componentes, hooks y casos de uso

Inventario de archivos, incluyendo variantes históricas y componentes sin ruta activa. Su presencia no afirma una funcionalidad activa o un modelo IA operativo. La cobertura completa conserva también los archivos no ejercitados.

### Interfaz

- [components/ui/badge.tsx](../../frontend/src/components/ui/badge.tsx)
- [components/ui/button.tsx](../../frontend/src/components/ui/button.tsx)
- [components/ui/card.tsx](../../frontend/src/components/ui/card.tsx)
- [components/ui/dialog.tsx](../../frontend/src/components/ui/dialog.tsx)
- [components/ui/dropdown-menu.tsx](../../frontend/src/components/ui/dropdown-menu.tsx)
- [components/ui/select.tsx](../../frontend/src/components/ui/select.tsx)
- [components/ui/sheet.tsx](../../frontend/src/components/ui/sheet.tsx)
- [ui/components/common/AchievementNotification.tsx](../../frontend/src/ui/components/common/AchievementNotification.tsx)
- [ui/components/common/AiFeedbackToast.tsx](../../frontend/src/ui/components/common/AiFeedbackToast.tsx)
- [ui/components/common/ControlPanel.tsx](../../frontend/src/ui/components/common/ControlPanel.tsx)
- [ui/components/common/CourseStructure.tsx](../../frontend/src/ui/components/common/CourseStructure.tsx)
- [ui/components/common/DailyChallengeCard.tsx](../../frontend/src/ui/components/common/DailyChallengeCard.tsx)
- [ui/components/common/DailyChallengeStage.tsx](../../frontend/src/ui/components/common/DailyChallengeStage.tsx)
- [ui/components/common/DailyProgress.tsx](../../frontend/src/ui/components/common/DailyProgress.tsx)
- [ui/components/common/DailySetList.tsx](../../frontend/src/ui/components/common/DailySetList.tsx)
- [ui/components/common/GameSessionFeedback.tsx](../../frontend/src/ui/components/common/GameSessionFeedback.tsx)
- [ui/components/common/HelpRequestHistory.tsx](../../frontend/src/ui/components/common/HelpRequestHistory.tsx)
- [ui/components/common/Modal.tsx](../../frontend/src/ui/components/common/Modal.tsx)
- [ui/components/common/Navbar.tsx](../../frontend/src/ui/components/common/Navbar.tsx)
- [ui/components/common/RobotIcon.tsx](../../frontend/src/ui/components/common/RobotIcon.tsx)
- [ui/components/common/useAttemptTrace.ts](../../frontend/src/ui/components/common/useAttemptTrace.ts)
- [ui/components/common/useDailySet.ts](../../frontend/src/ui/components/common/useDailySet.ts)
- [ui/components/common/useValidatedGameSession.ts](../../frontend/src/ui/components/common/useValidatedGameSession.ts)
- [ui/components/layout/DocenteLayout.tsx](../../frontend/src/ui/components/layout/DocenteLayout.tsx)
- [ui/components/NeonFlow/ComponentTray.tsx](../../frontend/src/ui/components/NeonFlow/ComponentTray.tsx)
- [ui/components/NeonFlow/NeonBoard.tsx](../../frontend/src/ui/components/NeonFlow/NeonBoard.tsx)
- [ui/components/NeonFlow/NeonFlowStage.tsx](../../frontend/src/ui/components/NeonFlow/NeonFlowStage.tsx)
- [ui/components/NeonFlow/PersistedNeonFlowStage.tsx](../../frontend/src/ui/components/NeonFlow/PersistedNeonFlowStage.tsx)
- [ui/components/Perfil/AchievementGrid.tsx](../../frontend/src/ui/components/Perfil/AchievementGrid.tsx)
- [ui/components/Perfil/GameProgressOverview.tsx](../../frontend/src/ui/components/Perfil/GameProgressOverview.tsx)
- [ui/components/Perfil/HistoryTable.tsx](../../frontend/src/ui/components/Perfil/HistoryTable.tsx)
- [ui/components/Perfil/PlayerCard.tsx](../../frontend/src/ui/components/Perfil/PlayerCard.tsx)
- [ui/components/Perfil/StatsGrid.tsx](../../frontend/src/ui/components/Perfil/StatsGrid.tsx)
- [ui/components/ria-bento-grid/cards/Ria01Card.tsx](../../frontend/src/ui/components/ria-bento-grid/cards/Ria01Card.tsx)
- [ui/components/ria-bento-grid/cards/Ria03Card.tsx](../../frontend/src/ui/components/ria-bento-grid/cards/Ria03Card.tsx)
- [ui/components/ria-bento-grid/cards/Ria04Card.tsx](../../frontend/src/ui/components/ria-bento-grid/cards/Ria04Card.tsx)
- [ui/components/ria-bento-grid/cards/Ria08Card.tsx](../../frontend/src/ui/components/ria-bento-grid/cards/Ria08Card.tsx)
- [ui/components/ria-bento-grid/cards/Ria10Card.tsx](../../frontend/src/ui/components/ria-bento-grid/cards/Ria10Card.tsx)
- [ui/components/ria-bento-grid/cards/Ria11Card.tsx](../../frontend/src/ui/components/ria-bento-grid/cards/Ria11Card.tsx)
- [ui/components/ria-bento-grid/RiaBentoGrid.tsx](../../frontend/src/ui/components/ria-bento-grid/RiaBentoGrid.tsx)
- [ui/components/TetriLogic/Board.tsx](../../frontend/src/ui/components/TetriLogic/Board.tsx)
- [ui/components/TetriLogic/FreeTetriLogicStage.tsx](../../frontend/src/ui/components/TetriLogic/FreeTetriLogicStage.tsx)
- [ui/components/TetriLogic/HistoricalTetriLogicStage.tsx](../../frontend/src/ui/components/TetriLogic/HistoricalTetriLogicStage.tsx)
- [ui/components/TetriLogic/LegacyTetriLogicStage.tsx](../../frontend/src/ui/components/TetriLogic/LegacyTetriLogicStage.tsx)
- [ui/components/TetriLogic/OfficialTetriLogicStage.tsx](../../frontend/src/ui/components/TetriLogic/OfficialTetriLogicStage.tsx)
- [ui/components/TetriLogic/PersistedTetriLogicStage.tsx](../../frontend/src/ui/components/TetriLogic/PersistedTetriLogicStage.tsx)
- [ui/components/TetriLogic/PiecePreview.tsx](../../frontend/src/ui/components/TetriLogic/PiecePreview.tsx)
- [ui/components/TetriLogic/PieceSurface.tsx](../../frontend/src/ui/components/TetriLogic/PieceSurface.tsx)
- [ui/components/TetriLogic/PieceTray.tsx](../../frontend/src/ui/components/TetriLogic/PieceTray.tsx)
- [ui/components/TetriLogic/TetriLogicRules.tsx](../../frontend/src/ui/components/TetriLogic/TetriLogicRules.tsx)
- [ui/components/TetriLogic/TetriLogicStage.tsx](../../frontend/src/ui/components/TetriLogic/TetriLogicStage.tsx)
- [ui/components/TetriLogic/useFreePieceInteraction.ts](../../frontend/src/ui/components/TetriLogic/useFreePieceInteraction.ts)

### Aplicación

- [application/hooks/useAsyncResource.ts](../../frontend/src/application/hooks/useAsyncResource.ts)
- [application/hooks/useAuth.ts](../../frontend/src/application/hooks/useAuth.ts)
- [application/hooks/useTheme.ts](../../frontend/src/application/hooks/useTheme.ts)
- [application/usecases/activityLevels.ts](../../frontend/src/application/usecases/activityLevels.ts)
- [application/usecases/loadCourseActivities.ts](../../frontend/src/application/usecases/loadCourseActivities.ts)
- [application/usecases/loadTeacherMetrics.ts](../../frontend/src/application/usecases/loadTeacherMetrics.ts)
- [application/usecases/LoginUserUseCase.ts](../../frontend/src/application/usecases/LoginUserUseCase.ts)
- [application/usecases/mergeRankings.ts](../../frontend/src/application/usecases/mergeRankings.ts)
- [application/usecases/neonflow/board.ts](../../frontend/src/application/usecases/neonflow/board.ts)
- [application/usecases/neonflow/raycast.ts](../../frontend/src/application/usecases/neonflow/raycast.ts)
- [application/usecases/tetrilogic/freePlay.ts](../../frontend/src/application/usecases/tetrilogic/freePlay.ts)
- [application/usecases/tetrilogic/lineGoals.ts](../../frontend/src/application/usecases/tetrilogic/lineGoals.ts)
- [application/usecases/tetrilogic/rules.ts](../../frontend/src/application/usecases/tetrilogic/rules.ts)
- [application/usecases/tetrilogic/validatePlacement.ts](../../frontend/src/application/usecases/tetrilogic/validatePlacement.ts)

## Suites disponibles y ejecutadas

Backend: suite completa de `*Test.java`, 272 casos; la integración PostgreSQL repite 9 de ellos contra el motor real y no se suma como nueve casos únicos de negocio. Frontend: 37 archivos unitarios, 375 casos. Navegador: ocho specs, diez casos con aplicación real y 23 con API interceptada; resultado final en el informe.

### Backend

- [AuthRolePriorityTest](../../backend/src/test/java/com/pipre/backend/adapters/in/web/controller/AuthRolePriorityTest.java)
- [GameSessionHttpTest](../../backend/src/test/java/com/pipre/backend/adapters/in/web/controller/GameSessionHttpTest.java)
- [StudentOwnershipContractTest](../../backend/src/test/java/com/pipre/backend/adapters/in/web/controller/StudentOwnershipContractTest.java)
- [TetriLogicTemplateHttpTest](../../backend/src/test/java/com/pipre/backend/adapters/in/web/controller/TetriLogicTemplateHttpTest.java)
- [UserRegistrationContractTest](../../backend/src/test/java/com/pipre/backend/adapters/in/web/controller/UserRegistrationContractTest.java)
- [ActivityMetadataContractTest](../../backend/src/test/java/com/pipre/backend/application/useCases/ActivityMetadataContractTest.java)
- [AddStudentRankingServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/AddStudentRankingServiceTest.java)
- [AssignRoleServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/AssignRoleServiceTest.java)
- [CreateActivityServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/CreateActivityServiceTest.java)
- [CreateCourseServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/CreateCourseServiceTest.java)
- [CreateHelpRequestServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/CreateHelpRequestServiceTest.java)
- [CreateLessonServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/CreateLessonServiceTest.java)
- [CreateModuleServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/CreateModuleServiceTest.java)
- [DeleteActivityServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/DeleteActivityServiceTest.java)
- [DeleteCourseServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/DeleteCourseServiceTest.java)
- [DeleteModuleServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/DeleteModuleServiceTest.java)
- [GameSessionsServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/GameSessionsServiceTest.java)
- [GamificationServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/GamificationServiceTest.java)
- [GetActivitiesServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/GetActivitiesServiceTest.java)
- [GetCoursesContractTest](../../backend/src/test/java/com/pipre/backend/application/useCases/GetCoursesContractTest.java)
- [GetCoursesServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/GetCoursesServiceTest.java)
- [GetDropoutRiskServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/GetDropoutRiskServiceTest.java)
- [GetGroupRankingServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/GetGroupRankingServiceTest.java)
- [GetGroupServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/GetGroupServiceTest.java)
- [GetGroupsServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/GetGroupsServiceTest.java)
- [GetHelpRequestsServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/GetHelpRequestsServiceTest.java)
- [GetLessonsServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/GetLessonsServiceTest.java)
- [GetModuleProgressServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/GetModuleProgressServiceTest.java)
- [GetModulesServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/GetModulesServiceTest.java)
- [GetRolesServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/GetRolesServiceTest.java)
- [GetStudentResultServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/GetStudentResultServiceTest.java)
- [GetUserByIdServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/GetUserByIdServiceTest.java)
- [ProceduralDailyTest](../../backend/src/test/java/com/pipre/backend/application/useCases/ProceduralDailyTest.java)
- [RandomDailySelectionPolicyTest](../../backend/src/test/java/com/pipre/backend/application/useCases/RandomDailySelectionPolicyTest.java)
- [RankingGamificationViewTest](../../backend/src/test/java/com/pipre/backend/application/useCases/RankingGamificationViewTest.java)
- [RatePerformanceServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/RatePerformanceServiceTest.java)
- [RegisterUserServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/RegisterUserServiceTest.java)
- [SaveModuleProgressServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/SaveModuleProgressServiceTest.java)
- [SaveResultServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/SaveResultServiceTest.java)
- [SimulationUseCaseTest](../../backend/src/test/java/com/pipre/backend/application/useCases/SimulationUseCaseTest.java)
- [TetriLogicCatalogContractTest](../../backend/src/test/java/com/pipre/backend/application/useCases/TetriLogicCatalogContractTest.java)
- [TraceAttemptContractTest](../../backend/src/test/java/com/pipre/backend/application/useCases/TraceAttemptContractTest.java)
- [UpdateCoursesServiceTest](../../backend/src/test/java/com/pipre/backend/application/useCases/UpdateCoursesServiceTest.java)
- [BoardRulesTest](../../backend/src/test/java/com/pipre/backend/domain/entities/game/BoardRulesTest.java)
- [AchievementRulesTest](../../backend/src/test/java/com/pipre/backend/domain/entities/gamification/AchievementRulesTest.java)
- [UserDomainTest](../../backend/src/test/java/com/pipre/backend/domain/entities/user/UserDomainTest.java)
- [BrowserSecurityPropertiesTest](../../backend/src/test/java/com/pipre/backend/infrastructure/configuration/BrowserSecurityPropertiesTest.java)
- [CourseSeederPreservationTest](../../backend/src/test/java/com/pipre/backend/infrastructure/util/seed/CourseSeederPreservationTest.java)
- [TetriLogicCatalogMigrationTest](../../backend/src/test/java/com/pipre/backend/infrastructure/util/seed/TetriLogicCatalogMigrationTest.java)
- [BackendPersistenceIntegrationTest](../../backend/src/test/java/com/pipre/backend/integration/BackendPersistenceIntegrationTest.java)
- [BackendErrorContractTest](../../backend/src/test/java/com/pipre/backend/unit/BackendErrorContractTest.java)
- [RankingIdempotencyTest](../../backend/src/test/java/com/pipre/backend/unit/RankingIdempotencyTest.java)
- [ResultIdentityTest](../../backend/src/test/java/com/pipre/backend/unit/ResultIdentityTest.java)
- [SimulationArithmeticTest](../../backend/src/test/java/com/pipre/backend/unit/SimulationArithmeticTest.java)

### Frontend unitario

- [AcademicMetrics.test.ts](../../frontend/tests/unit/AcademicMetrics.test.ts)
- [AchievementsProfile.test.tsx](../../frontend/tests/unit/AchievementsProfile.test.tsx)
- [ActivitySimulator.test.tsx](../../frontend/tests/unit/ActivitySimulator.test.tsx)
- [ApiContract.test.ts](../../frontend/tests/unit/ApiContract.test.ts)
- [AttemptTrace.test.tsx](../../frontend/tests/unit/AttemptTrace.test.tsx)
- [AuthAdapter.test.ts](../../frontend/tests/unit/AuthAdapter.test.ts)
- [AuthWorkflow.test.tsx](../../frontend/tests/unit/AuthWorkflow.test.tsx)
- [ChallengeEditorContract.test.tsx](../../frontend/tests/unit/ChallengeEditorContract.test.tsx)
- [CourseStructure.test.tsx](../../frontend/tests/unit/CourseStructure.test.tsx)
- [DailyFiveProgress.test.tsx](../../frontend/tests/unit/DailyFiveProgress.test.tsx)
- [DailySetRenewal.test.tsx](../../frontend/tests/unit/DailySetRenewal.test.tsx)
- [FreeCatalogEntry.test.tsx](../../frontend/tests/unit/FreeCatalogEntry.test.tsx)
- [GameProgressApi.test.ts](../../frontend/tests/unit/GameProgressApi.test.ts)
- [HelpRequestHistory.test.tsx](../../frontend/tests/unit/HelpRequestHistory.test.tsx)
- [LoginForm.test.tsx](../../frontend/tests/unit/LoginForm.test.tsx)
- [MergeRankings.test.ts](../../frontend/tests/unit/MergeRankings.test.ts)
- [NavbarProgress.test.tsx](../../frontend/tests/unit/NavbarProgress.test.tsx)
- [NeonFlowCatalogInteraction.test.tsx](../../frontend/tests/unit/NeonFlowCatalogInteraction.test.tsx)
- [NeonFlowLevelSolvability.test.ts](../../frontend/tests/unit/NeonFlowLevelSolvability.test.ts)
- [NeonLevelTemplates.test.ts](../../frontend/tests/unit/NeonLevelTemplates.test.ts)
- [PersistedNeonFlow.test.tsx](../../frontend/tests/unit/PersistedNeonFlow.test.tsx)
- [PersistedTetriLogic.test.tsx](../../frontend/tests/unit/PersistedTetriLogic.test.tsx)
- [RankingPage.test.tsx](../../frontend/tests/unit/RankingPage.test.tsx)
- [RankingRequests.test.tsx](../../frontend/tests/unit/RankingRequests.test.tsx)
- [RouteGuards.test.tsx](../../frontend/tests/unit/RouteGuards.test.tsx)
- [SessionContract.test.ts](../../frontend/tests/unit/SessionContract.test.ts)
- [SimulatorAccessibility.test.tsx](../../frontend/tests/unit/SimulatorAccessibility.test.tsx)
- [TeacherMetricsLoading.test.ts](../../frontend/tests/unit/TeacherMetricsLoading.test.ts)
- [TetriClarity.test.tsx](../../frontend/tests/unit/TetriClarity.test.tsx)
- [TetriFreeInteraction.test.tsx](../../frontend/tests/unit/TetriFreeInteraction.test.tsx)
- [TetriFreePlay.test.ts](../../frontend/tests/unit/TetriFreePlay.test.ts)
- [TetriInteractions.test.tsx](../../frontend/tests/unit/TetriInteractions.test.tsx)
- [TetriLevelSolvability.test.tsx](../../frontend/tests/unit/TetriLevelSolvability.test.tsx)
- [TetriLineGoals.test.tsx](../../frontend/tests/unit/TetriLineGoals.test.tsx)
- [TetriOfficialCatalog.test.tsx](../../frontend/tests/unit/TetriOfficialCatalog.test.tsx)
- [TetriRuleEdges.test.ts](../../frontend/tests/unit/TetriRuleEdges.test.ts)
- [ValidatedGameSession.test.tsx](../../frontend/tests/unit/ValidatedGameSession.test.tsx)

### Navegador

- [application.cy.ts](../../frontend/tests/e2e/application.cy.ts)
- [courses.cy.ts](../../frontend/tests/e2e/courses.cy.ts)
- [data-masiva.cy.ts](../../frontend/tests/e2e/data-masiva.cy.ts)
- [login.cy.ts](../../frontend/tests/e2e/login.cy.ts)
- [metricas.cy.ts](../../frontend/tests/e2e/metricas.cy.ts)
- [pagina-inicio.cy.ts](../../frontend/tests/e2e/pagina-inicio.cy.ts)
- [ranking.cy.ts](../../frontend/tests/e2e/ranking.cy.ts)
- [retos-create.cy.ts](../../frontend/tests/e2e/retos-create.cy.ts)
