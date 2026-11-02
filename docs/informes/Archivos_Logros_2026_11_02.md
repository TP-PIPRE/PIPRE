# Archivos del avance de logros — 02/11/2026

Inventario del árbol de trabajo al cerrar el lote, sin staging, commit ni push. Incluye cambios de la auditoría del 30/10 que ya estaban presentes al retomar; no atribuye todos los archivos a la gamificación. [Informe y pruebas](Implementacion_35_Logros_2026_11_02.md).

Los archivos nuevos se indican con **nuevo**. Las migraciones V18/V19 ya se aplicaron localmente y no deben editarse. Los artefactos privados de QA, respaldo y capturas se conservan fuera del repositorio.

## Raíz

- [AGENTS.md](../../AGENTS.md) — actualizado
- [README.md](../../README.md) — actualizado

## backend

- [backend/src/main/java/com/pipre/backend/adapters/in/web/controller/DailyChallengeController.java](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/DailyChallengeController.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/adapters/in/web/controller/GameSessionController.java](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/GameSessionController.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/adapters/in/web/controller/ProfileController.java](../../backend/src/main/java/com/pipre/backend/adapters/in/web/controller/ProfileController.java) — actualizado
- [backend/src/main/java/com/pipre/backend/adapters/out/persistence/GameSessionRepositoryAdapter.java](../../backend/src/main/java/com/pipre/backend/adapters/out/persistence/GameSessionRepositoryAdapter.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/adapters/out/persistence/GamificationJdbcAdapter.java](../../backend/src/main/java/com/pipre/backend/adapters/out/persistence/GamificationJdbcAdapter.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/adapters/out/persistence/jpaEntities/AchievementJpaEntity.java](../../backend/src/main/java/com/pipre/backend/adapters/out/persistence/jpaEntities/AchievementJpaEntity.java) — actualizado
- [backend/src/main/java/com/pipre/backend/application/commands/GameSessionAction.java](../../backend/src/main/java/com/pipre/backend/application/commands/GameSessionAction.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/application/commands/StartGameSessionCommand.java](../../backend/src/main/java/com/pipre/backend/application/commands/StartGameSessionCommand.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/application/commands/VerifiedVictory.java](../../backend/src/main/java/com/pipre/backend/application/commands/VerifiedVictory.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/application/dto/AchievementDTO.java](../../backend/src/main/java/com/pipre/backend/application/dto/AchievementDTO.java) — actualizado
- [backend/src/main/java/com/pipre/backend/application/dto/AchievementExportDTO.java](../../backend/src/main/java/com/pipre/backend/application/dto/AchievementExportDTO.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/application/dto/DailyChallengeDTO.java](../../backend/src/main/java/com/pipre/backend/application/dto/DailyChallengeDTO.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/application/dto/GameCompletionDTO.java](../../backend/src/main/java/com/pipre/backend/application/dto/GameCompletionDTO.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/application/dto/GameProgressDTO.java](../../backend/src/main/java/com/pipre/backend/application/dto/GameProgressDTO.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/application/dto/GameSessionDTO.java](../../backend/src/main/java/com/pipre/backend/application/dto/GameSessionDTO.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/application/dto/StudentHistoryDTO.java](../../backend/src/main/java/com/pipre/backend/application/dto/StudentHistoryDTO.java) — actualizado
- [backend/src/main/java/com/pipre/backend/application/dto/VictoryAwardsDTO.java](../../backend/src/main/java/com/pipre/backend/application/dto/VictoryAwardsDTO.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/application/ports/input/DailyChallengeUseCase.java](../../backend/src/main/java/com/pipre/backend/application/ports/input/DailyChallengeUseCase.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/application/ports/input/ExportAchievementsUseCase.java](../../backend/src/main/java/com/pipre/backend/application/ports/input/ExportAchievementsUseCase.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/application/ports/input/GameSessionsUseCase.java](../../backend/src/main/java/com/pipre/backend/application/ports/input/GameSessionsUseCase.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/application/ports/input/GetGameProgressUseCase.java](../../backend/src/main/java/com/pipre/backend/application/ports/input/GetGameProgressUseCase.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/application/ports/input/RecordVerifiedVictoryUseCase.java](../../backend/src/main/java/com/pipre/backend/application/ports/input/RecordVerifiedVictoryUseCase.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/application/ports/output/GameSessionRepositoryPort.java](../../backend/src/main/java/com/pipre/backend/application/ports/output/GameSessionRepositoryPort.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/application/ports/output/GamificationRepositoryPort.java](../../backend/src/main/java/com/pipre/backend/application/ports/output/GamificationRepositoryPort.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/application/useCases/GameSessionsService.java](../../backend/src/main/java/com/pipre/backend/application/useCases/GameSessionsService.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/application/useCases/GamificationService.java](../../backend/src/main/java/com/pipre/backend/application/useCases/GamificationService.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/application/useCases/GetCourseRankingService.java](../../backend/src/main/java/com/pipre/backend/application/useCases/GetCourseRankingService.java) — actualizado
- [backend/src/main/java/com/pipre/backend/application/useCases/GetGroupRankingService.java](../../backend/src/main/java/com/pipre/backend/application/useCases/GetGroupRankingService.java) — actualizado
- [backend/src/main/java/com/pipre/backend/application/useCases/GetModuleRankingService.java](../../backend/src/main/java/com/pipre/backend/application/useCases/GetModuleRankingService.java) — actualizado
- [backend/src/main/java/com/pipre/backend/application/useCases/GetStudentAchievementsService.java](../../backend/src/main/java/com/pipre/backend/application/useCases/GetStudentAchievementsService.java) — actualizado
- [backend/src/main/java/com/pipre/backend/application/useCases/GetStudentHistoryService.java](../../backend/src/main/java/com/pipre/backend/application/useCases/GetStudentHistoryService.java) — actualizado
- [backend/src/main/java/com/pipre/backend/application/useCases/GetStudentProfileService.java](../../backend/src/main/java/com/pipre/backend/application/useCases/GetStudentProfileService.java) — actualizado
- [backend/src/main/java/com/pipre/backend/application/useCases/RankingGamificationView.java](../../backend/src/main/java/com/pipre/backend/application/useCases/RankingGamificationView.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/application/useCases/SaveAttemptService.java](../../backend/src/main/java/com/pipre/backend/application/useCases/SaveAttemptService.java) — actualizado
- [backend/src/main/java/com/pipre/backend/domain/entities/game/BoardAction.java](../../backend/src/main/java/com/pipre/backend/domain/entities/game/BoardAction.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/domain/entities/game/BoardRules.java](../../backend/src/main/java/com/pipre/backend/domain/entities/game/BoardRules.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/domain/entities/game/GameSession.java](../../backend/src/main/java/com/pipre/backend/domain/entities/game/GameSession.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/domain/entities/gamification/Achievement.java](../../backend/src/main/java/com/pipre/backend/domain/entities/gamification/Achievement.java) — actualizado
- [backend/src/main/java/com/pipre/backend/domain/entities/gamification/AchievementRules.java](../../backend/src/main/java/com/pipre/backend/domain/entities/gamification/AchievementRules.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/domain/exceptions/IncompleteGameBoardException.java](../../backend/src/main/java/com/pipre/backend/domain/exceptions/IncompleteGameBoardException.java) — **nuevo**
- [backend/src/main/java/com/pipre/backend/infrastructure/configuration/GameClockConfiguration.java](../../backend/src/main/java/com/pipre/backend/infrastructure/configuration/GameClockConfiguration.java) — **nuevo**
- [backend/src/main/resources/db/migration/V18__achievements_35_and_progress.sql](../../backend/src/main/resources/db/migration/V18__achievements_35_and_progress.sql) — **nuevo**
- [backend/src/main/resources/db/migration/V19__verified_game_sessions.sql](../../backend/src/main/resources/db/migration/V19__verified_game_sessions.sql) — **nuevo**
- [backend/src/test/java/com/pipre/backend/adapters/in/web/controller/GameSessionHttpTest.java](../../backend/src/test/java/com/pipre/backend/adapters/in/web/controller/GameSessionHttpTest.java) — **nuevo**
- [backend/src/test/java/com/pipre/backend/adapters/in/web/controller/StudentOwnershipContractTest.java](../../backend/src/test/java/com/pipre/backend/adapters/in/web/controller/StudentOwnershipContractTest.java) — actualizado
- [backend/src/test/java/com/pipre/backend/application/useCases/GameSessionsServiceTest.java](../../backend/src/test/java/com/pipre/backend/application/useCases/GameSessionsServiceTest.java) — **nuevo**
- [backend/src/test/java/com/pipre/backend/application/useCases/GamificationServiceTest.java](../../backend/src/test/java/com/pipre/backend/application/useCases/GamificationServiceTest.java) — **nuevo**
- [backend/src/test/java/com/pipre/backend/application/useCases/GetGroupRankingServiceTest.java](../../backend/src/test/java/com/pipre/backend/application/useCases/GetGroupRankingServiceTest.java) — actualizado
- [backend/src/test/java/com/pipre/backend/application/useCases/RankingGamificationViewTest.java](../../backend/src/test/java/com/pipre/backend/application/useCases/RankingGamificationViewTest.java) — **nuevo**
- [backend/src/test/java/com/pipre/backend/application/useCases/TraceAttemptContractTest.java](../../backend/src/test/java/com/pipre/backend/application/useCases/TraceAttemptContractTest.java) — actualizado
- [backend/src/test/java/com/pipre/backend/domain/entities/game/BoardRulesTest.java](../../backend/src/test/java/com/pipre/backend/domain/entities/game/BoardRulesTest.java) — **nuevo**
- [backend/src/test/java/com/pipre/backend/domain/entities/gamification/AchievementRulesTest.java](../../backend/src/test/java/com/pipre/backend/domain/entities/gamification/AchievementRulesTest.java) — **nuevo**

## docs

- [docs/Consultas_35_Logros.sql](../../docs/Consultas_35_Logros.sql) — **nuevo**
- [docs/ESTADO_ACTUAL.md](../../docs/ESTADO_ACTUAL.md) — actualizado
- [docs/README.md](../../docs/README.md) — actualizado
- [docs/guias/Clasificacion_Endpoints_Roles.md](../../docs/guias/Clasificacion_Endpoints_Roles.md) — actualizado
- [docs/guias/Contratos_Frontend_Backend.md](../../docs/guias/Contratos_Frontend_Backend.md) — actualizado
- [docs/guias/Guia_Implementacion_30_Retos.md](../../docs/guias/Guia_Implementacion_30_Retos.md) — actualizado
- [docs/guias/Pendientes_Endpoints_Backend.md](../../docs/guias/Pendientes_Endpoints_Backend.md) — actualizado
- [docs/guias/Plan_Implementacion_ML.md](../../docs/guias/Plan_Implementacion_ML.md) — **nuevo**
- [docs/guias/Sistema_35_Logros.md](../../docs/guias/Sistema_35_Logros.md) — **nuevo**
- [docs/historial/req-backend-mejoras.md](../../docs/historial/req-backend-mejoras.md) — actualizado
- [docs/informes/Archivos_Logros_2026_11_02.md](../../docs/informes/Archivos_Logros_2026_11_02.md) — **nuevo**
- [docs/informes/Implementacion_35_Logros_2026_11_02.md](../../docs/informes/Implementacion_35_Logros_2026_11_02.md) — **nuevo**
- [docs/informes/Revision_Exhaustiva_Simuladores_2026_10_30.md](../../docs/informes/Revision_Exhaustiva_Simuladores_2026_10_30.md) — **nuevo**
- [docs/req-ia-endpoints.md](../../docs/req-ia-endpoints.md) — actualizado
- [docs/simuladores/NeonFlow.md](../../docs/simuladores/NeonFlow.md) — actualizado
- [docs/simuladores/Pendientes_TetriLogic_SSD.md](../../docs/simuladores/Pendientes_TetriLogic_SSD.md) — actualizado
- [docs/simuladores/TetriLogic_Filas_Columnas.md](../../docs/simuladores/TetriLogic_Filas_Columnas.md) — actualizado
- [docs/sistema/01_Introduccion_Resumen_Ejecutivo.md](../../docs/sistema/01_Introduccion_Resumen_Ejecutivo.md) — actualizado
- [docs/sistema/02_Arquitectura_del_Sistema.md](../../docs/sistema/02_Arquitectura_del_Sistema.md) — actualizado
- [docs/sistema/03_Modulos_y_Componentes.md](../../docs/sistema/03_Modulos_y_Componentes.md) — actualizado
- [docs/sistema/05_Atributos_de_Calidad.md](../../docs/sistema/05_Atributos_de_Calidad.md) — actualizado
- [docs/sistema/06_Guia_Despliegue_Ejecucion_Local.md](../../docs/sistema/06_Guia_Despliegue_Ejecucion_Local.md) — actualizado

## frontend

- [frontend/src/infrastructure/api/gameProgressService.ts](../../frontend/src/infrastructure/api/gameProgressService.ts) — **nuevo**
- [frontend/src/infrastructure/api/models/apiModels.ts](../../frontend/src/infrastructure/api/models/apiModels.ts) — actualizado
- [frontend/src/infrastructure/api/models/gameProgressModels.ts](../../frontend/src/infrastructure/api/models/gameProgressModels.ts) — **nuevo**
- [frontend/src/infrastructure/store/achievementStore.ts](../../frontend/src/infrastructure/store/achievementStore.ts) — **nuevo**
- [frontend/src/infrastructure/store/attemptTrace.ts](../../frontend/src/infrastructure/store/attemptTrace.ts) — actualizado
- [frontend/src/infrastructure/store/validatedGameSession.ts](../../frontend/src/infrastructure/store/validatedGameSession.ts) — **nuevo**
- [frontend/src/ui/components/NeonFlow/NeonFlowStage.tsx](../../frontend/src/ui/components/NeonFlow/NeonFlowStage.tsx) — actualizado
- [frontend/src/ui/components/NeonFlow/PersistedNeonFlowStage.tsx](../../frontend/src/ui/components/NeonFlow/PersistedNeonFlowStage.tsx) — actualizado
- [frontend/src/ui/components/Perfil/AchievementGrid.tsx](../../frontend/src/ui/components/Perfil/AchievementGrid.tsx) — actualizado
- [frontend/src/ui/components/Perfil/GameProgressOverview.tsx](../../frontend/src/ui/components/Perfil/GameProgressOverview.tsx) — **nuevo**
- [frontend/src/ui/components/Perfil/HistoryTable.tsx](../../frontend/src/ui/components/Perfil/HistoryTable.tsx) — actualizado
- [frontend/src/ui/components/Perfil/StatsGrid.tsx](../../frontend/src/ui/components/Perfil/StatsGrid.tsx) — actualizado
- [frontend/src/ui/components/TetriLogic/FreeTetriLogicStage.tsx](../../frontend/src/ui/components/TetriLogic/FreeTetriLogicStage.tsx) — actualizado
- [frontend/src/ui/components/TetriLogic/PersistedTetriLogicStage.tsx](../../frontend/src/ui/components/TetriLogic/PersistedTetriLogicStage.tsx) — actualizado
- [frontend/src/ui/components/TetriLogic/TetriLogicStage.tsx](../../frontend/src/ui/components/TetriLogic/TetriLogicStage.tsx) — actualizado
- [frontend/src/ui/components/common/AchievementNotification.tsx](../../frontend/src/ui/components/common/AchievementNotification.tsx) — **nuevo**
- [frontend/src/ui/components/common/ControlPanel.tsx](../../frontend/src/ui/components/common/ControlPanel.tsx) — actualizado
- [frontend/src/ui/components/common/DailyChallengeCard.tsx](../../frontend/src/ui/components/common/DailyChallengeCard.tsx) — **nuevo**
- [frontend/src/ui/components/common/DailyChallengeStage.tsx](../../frontend/src/ui/components/common/DailyChallengeStage.tsx) — **nuevo**
- [frontend/src/ui/components/common/GameSessionFeedback.tsx](../../frontend/src/ui/components/common/GameSessionFeedback.tsx) — **nuevo**
- [frontend/src/ui/components/common/useValidatedGameSession.ts](../../frontend/src/ui/components/common/useValidatedGameSession.ts) — **nuevo**
- [frontend/src/ui/pages/PaginaInicio.tsx](../../frontend/src/ui/pages/PaginaInicio.tsx) — actualizado
- [frontend/src/ui/pages/PerfilPage.tsx](../../frontend/src/ui/pages/PerfilPage.tsx) — actualizado
- [frontend/src/ui/pages/ResultadosPage.tsx](../../frontend/src/ui/pages/ResultadosPage.tsx) — actualizado
- [frontend/src/ui/pages/Simulador.tsx](../../frontend/src/ui/pages/Simulador.tsx) — actualizado
- [frontend/src/ui/router/index.tsx](../../frontend/src/ui/router/index.tsx) — actualizado
- [frontend/tests/unit/AchievementsProfile.test.tsx](../../frontend/tests/unit/AchievementsProfile.test.tsx) — **nuevo**
- [frontend/tests/unit/ActivitySimulator.test.tsx](../../frontend/tests/unit/ActivitySimulator.test.tsx) — actualizado
- [frontend/tests/unit/AttemptTrace.test.tsx](../../frontend/tests/unit/AttemptTrace.test.tsx) — actualizado
- [frontend/tests/unit/GameProgressApi.test.ts](../../frontend/tests/unit/GameProgressApi.test.ts) — **nuevo**
- [frontend/tests/unit/PersistedNeonFlow.test.tsx](../../frontend/tests/unit/PersistedNeonFlow.test.tsx) — **nuevo**
- [frontend/tests/unit/SimulatorAccessibility.test.tsx](../../frontend/tests/unit/SimulatorAccessibility.test.tsx) — actualizado
- [frontend/tests/unit/ValidatedGameSession.test.tsx](../../frontend/tests/unit/ValidatedGameSession.test.tsx) — **nuevo**

## scripts

- [scripts/verify_achievements_http.py](../../scripts/verify_achievements_http.py) — **nuevo**
- [scripts/verify_achievements_postgres.py](../../scripts/verify_achievements_postgres.py) — **nuevo**
- [scripts/verify_integration_http.py](../../scripts/verify_integration_http.py) — actualizado
