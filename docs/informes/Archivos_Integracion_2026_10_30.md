# Archivos de la integración — 30/10/2026

Inventario histórico respecto al HEAD destino a912ad0 en la entrega de integración. Las rutas enumeradas corresponden a ese checkpoint, anterior a la reorganización documental. Consultar las [nuevas ubicaciones y revisión](Revision_Documentacion_2026_10_30.md). No se eliminaron archivos en aquel lote. No incluye respaldos SQL, logs, capturas ni datos temporales, que permanecen fuera del repositorio.

## Nuevos (32)

- `backend/src/main/java/com/pipre/backend/adapters/in/web/controller/NeonFlowTemplateController.java`
- `backend/src/main/java/com/pipre/backend/adapters/out/persistence/NeonFlowTemplateRepositoryAdapter.java`
- `backend/src/main/java/com/pipre/backend/adapters/out/persistence/jpaEntities/NeonFlowTemplateJpaEntity.java`
- `backend/src/main/java/com/pipre/backend/adapters/out/persistence/repositories/NeonFlowTemplateJpaRepository.java`
- `backend/src/main/java/com/pipre/backend/application/commands/TelemetryFingerprint.java`
- `backend/src/main/java/com/pipre/backend/application/ports/input/GetNeonFlowTemplateUseCase.java`
- `backend/src/main/java/com/pipre/backend/application/ports/output/NeonFlowTemplateRepositoryPort.java`
- `backend/src/main/java/com/pipre/backend/application/useCases/GetNeonFlowTemplateService.java`
- `backend/src/main/java/com/pipre/backend/domain/entities/activity/NeonFlowTemplate.java`
- `backend/src/main/resources/catalog/neonflow-v2.json`
- `backend/src/main/resources/db/migration/V16__neonflow_official_catalog.sql`
- `backend/src/main/resources/db/migration/V17__traceable_telemetry_attempts.sql`
- `backend/src/test/java/com/pipre/backend/application/useCases/TraceAttemptContractTest.java`
- `docs/Archivos_Integracion_2026_10_30.md`
- `docs/Consultas_Analitica_Intentos.sql`
- `docs/Integracion_TetriLogic_NeonFlow_ML.md`
- `frontend/src/application/usecases/neonflow/board.ts`
- `frontend/src/infrastructure/store/attemptTrace.ts`
- `frontend/src/shared/constants/neonFlowCatalog.json`
- `frontend/src/shared/constants/neonFlowLevels.ts`
- `frontend/src/ui/components/NeonFlow/PersistedNeonFlowStage.tsx`
- `frontend/src/ui/components/common/useAttemptTrace.ts`
- `frontend/tests/fixtures/neonFlowSolutions.json`
- `frontend/tests/unit/AttemptTrace.test.tsx`
- `frontend/tests/unit/NeonFlowCatalogInteraction.test.tsx`
- `frontend/tests/unit/NeonFlowLevelSolvability.test.ts`
- `scripts/generate_neonflow_catalog.mjs`
- `scripts/neonflow_layouts.ts`
- `scripts/verify_integration_http.py`
- `scripts/verify_integration_postgres.py`
- `scripts/verify_integration_preservation.py`
- `scripts/verify_source_integrity.py`

## Modificados (38)

- `AGENTS.md`
- `README.md`
- `backend/src/main/java/com/pipre/backend/adapters/in/web/controller/TelemetryController.java`
- `backend/src/main/java/com/pipre/backend/adapters/in/web/dto/SaveAttemptRequestDTO.java`
- `backend/src/main/java/com/pipre/backend/adapters/out/persistence/ActivityRepositoryAdapter.java`
- `backend/src/main/java/com/pipre/backend/adapters/out/persistence/TelemetryPersistenceAdapter.java`
- `backend/src/main/java/com/pipre/backend/adapters/out/persistence/jpaEntities/TelemetryAttemptJpaEntity.java`
- `backend/src/main/java/com/pipre/backend/application/commands/SaveAttemptCommand.java`
- `backend/src/main/java/com/pipre/backend/application/ports/output/SaveTelemetryPort.java`
- `backend/src/main/java/com/pipre/backend/application/useCases/SaveAttemptService.java`
- `backend/src/main/java/com/pipre/backend/domain/entities/activity/Activity.java`
- `backend/src/main/java/com/pipre/backend/domain/entities/telemetry/TelemetryAttempt.java`
- `backend/src/main/java/com/pipre/backend/infrastructure/util/DataSeeder.java`
- `backend/src/main/java/com/pipre/backend/infrastructure/util/seed/CourseSeederService.java`
- `backend/src/main/resources/application.yaml`
- `backend/src/test/java/com/pipre/backend/BackendApplicationTests.java`
- `backend/src/test/java/com/pipre/backend/adapters/in/web/controller/TetriLogicTemplateHttpTest.java`
- `backend/src/test/java/com/pipre/backend/application/useCases/ActivityMetadataContractTest.java`
- `backend/src/test/java/com/pipre/backend/infrastructure/util/seed/TetriLogicCatalogMigrationTest.java`
- `docs/Guia_Implementacion_30_Retos.md`
- `docs/Informe_Contratos_Frontend_Backend.md`
- `docs/Pendientes_TetriLogic_SSD.md`
- `frontend/src/application/usecases/activityLevels.ts`
- `frontend/src/globals.css`
- `frontend/src/infrastructure/api/apiService.ts`
- `frontend/src/infrastructure/api/models/apiModels.ts`
- `frontend/src/infrastructure/store/gameStore.ts`
- `frontend/src/shared/constants/levelConfigs.ts`
- `frontend/src/shared/types/NeonFlow.ts`
- `frontend/src/ui/components/NeonFlow/ComponentTray.tsx`
- `frontend/src/ui/components/NeonFlow/NeonBoard.tsx`
- `frontend/src/ui/components/NeonFlow/NeonFlowStage.tsx`
- `frontend/src/ui/components/TetriLogic/FreeTetriLogicStage.tsx`
- `frontend/src/ui/components/TetriLogic/useFreePieceInteraction.ts`
- `frontend/src/ui/components/common/ControlPanel.tsx`
- `frontend/src/ui/pages/PaginaInicio.tsx`
- `frontend/src/ui/pages/Simulador.tsx`
- `frontend/tests/unit/SimulatorAccessibility.test.tsx`
