# Optimización UI/UX de PIPRE

> **Informe histórico del 23/10/2026.** Sus fallos, límites y cifras corresponden a la revisión visual inicial; varios se resolvieron después. Consultar [estado actual](../ESTADO_ACTUAL.md), [sistema de diseño](../../design-system/pipre/MASTER.md) e [integración posterior](../informes/Integracion_TetriLogic_NeonFlow_ML.md). No usar sus pendientes como lista vigente.

Fecha: 23 de octubre de 2026.

Actualización posterior: los pendientes de integración y las cifras de pruebas de este informe corresponden a la revisión visual inicial. Consulte [Informe de contratos frontend/backend](Informe_Contratos_Frontend_Backend.md) para las correcciones y validaciones posteriores.

## 1. Diagnóstico inicial y alcance documentado

Se revisaron los diez documentos Markdown existentes en `docs/`: introducción, arquitectura, módulos, navegación, calidad, despliegue, índice general, documento maestro y las dos guías de autenticación y roles. El documento maestro reúne las secciones de los archivos separados.

La documentación define Neon Flow (lógica proposicional), TetriLogic (razonamiento espacial), cursos, resultados, ranking, perfil y analítica docente. Define STUDENT, TEACHER y ADMIN. No incluye backlog por sprint, historias de usuario ni criterios de aceptación formales por sprint. No hay un módulo geográfico ni un generador de rutas: el trazado existente es el haz óptico de Neon Flow. No se añadieron funcionalidades geográficas ajenas al repositorio.

Frontend: React 19, TypeScript, Vite 8, Tailwind 4, Zustand, Router 7, Axios, Base UI/shadcn y Geist. Se conservan sus capas y contratos.

Problemas principales: tamaños de 7–11 px, etiquetas desconectadas, texto con opacidad baja, utilidades semánticas de Tailwind sin mapear, tipografía remota redundante, navegación móvil incompleta, modales sin manejo completo del foco, tableros sin ancho estable y dependencia exclusiva del arrastre. La analítica tenía tres columnas incluso en móvil y ciertos controles sólo aparecían al pasar el ratón.

Orden seguido: fundamentos y navegación; acceso y cursos; paneles y formularios; simuladores; pruebas, revisión visual y Docker.

## 2. Mejoras implementadas

- Temas claro, oscuro y ciruela con tokens compartidos por páginas y componentes Base UI; texto secundario y estados con mayor contraste.
- Cabecera, navegación activa, menú móvil, perfil, temas y enlace para saltar al contenido. Se conservan los guards.
- Acceso y registro con etiquetas, autocompletado, mensajes claros, estado ocupado y foco en errores. Registro y llamadas HTTP conservados.
- Cursos con identidad óptica/espacial, apertura por botón accesible, carga, error recuperable y estado vacío.
- Panel docente, métricas, retos, estudiantes, ranking, resultados y perfil con metadatos legibles, bordes visibles, colores semánticos y tamaños coherentes. Analítica IA adaptable a una, dos o tres columnas.
- Formularios de cursos y retos con asociaciones label/campo y controles táctiles. Modales con nombre, Escape, foco contenido y restaurado. Acciones de grupos y creación rápida accesibles por teclado. Se conectaron los accesos visuales de Nuevo reto y Detalles a las pantallas existentes.
- Tableros responsivos, herramientas, objetivos y métricas ordenados. Alternativa al arrastre por toque y teclado usando las mismas validaciones. Retroalimentación de comprobación, estado seleccionado y emisor óptico visible. Pistas sin cubrir controles.
- Métricas de demostración identificadas; error de IA presentado en lenguaje comprensible. No se alteraron cálculos ni datos del dominio.

## 3. Sistema de diseño

La definición reutilizable está en [MASTER.md](../../design-system/pipre/MASTER.md). Concepto: laboratorio educativo técnico, verde petróleo y superficies sobrias; Geist local; escala de 4/8 px; Lucide; foco visible; controles de 44 px; movimiento reducido; ancho contenido y tablas desplazables.

Contraste calculado de texto principal/secundario, primario, éxito y error sobre las tres superficies: mínimo 5,06:1 en claro, 6,60:1 en oscuro y 4,87:1 en ciruela. Contraste del botón primario: 6,24:1, 9,80:1 y 6,88:1 respectivamente. El cálculo cubre los tokens opacos, no certifica todos los gráficos, superposiciones ni contenidos heredados.

## 4. Archivos modificados

El inventario al final de este documento enumera cada archivo de esta intervención. `docker-compose.local.yaml` y `.env` ya tenían ajustes del diagnóstico anterior de Docker; esta intervención no cambia backend, contratos API, motores, reglas, autenticación ni telemetría.

## 5. Validaciones ejecutadas

- TypeScript (`tsc -b`) después de fundamentos, paneles y simuladores: correcto.
- Build de producción (`pnpm build`): correcto; permanece el aviso de bundle JavaScript mayor de 500 kB.
- Reconstrucción del contenedor frontend y revisión final en `http://localhost:5173/docente/dashboard`: correctas. El servidor Vite temporal de validación se detuvo.
- Pruebas de ranking y nuevas pruebas de interacción del simulador: 10 correctas. Las tres nuevas cubren colocación/rotación/reinicio óptico, éxito de Neon Flow y rechazo/aceptación de colocaciones mediante las reglas reales de TetriLogic.
- Suite general: 12 pruebas correctas y 3 fallidas (15 en total). Los tres fallos de AuthAdapter esperan respuestas JWT antiguas; el adaptador y esas pruebas no fueron modificados. No se presenta la suite completa como aprobada.
- ESLint general: 37 errores y 3 advertencias en código existente (efectos, `any`, exportaciones de componentes). No se presenta como aprobado.
- Navegador con backend real: ingreso de estudiante, docente y administrador; error de contraseña con foco; catálogo; selector de retos; rutas de resultados, ranking y perfil; dashboard, métricas, retos y estudiantes; apertura de formularios; selección de grupo; menú móvil y cambio de tema.
- Teclado en modal: Shift+Tab permanece dentro, Escape cierra y devuelve el foco al botón de apertura.
- Los modales se renderizan con un portal en `document.body`, evitando que las animaciones del contenedor alteren su posición fija. Modal de grupo comprobado a 320 px: límites verticales dentro de los 850 px disponibles y buscador asociado a su etiqueta.
- Neon Flow: colocación por toque, rotación y solicitud de pista con incremento de contadores. TetriLogic: colocación por toque y estado seleccionado. Los motores y el store permanecen sin cambios.
- Medición de ancho en cursos, resultados, ranking, perfil y las cuatro páginas docentes a 320/768/1440 px: sin desbordamiento del documento. Neon Flow comprobado además a 390 px. Inspección visual de escritorio, móvil, menú lateral, formularios y ambos tableros.

## 6. Limitaciones

- Los análisis de IA devuelven 403 en el entorno local. Se verificó su estado de error, no sus resultados satisfactorios.
- No se completó una partida real de todos los niveles de TetriLogic. La validación automatizada cubre colocaciones válidas/incorrectas y reinicio; no prueba todos los tableros.
- La telemetría del juego conserva su implementación y limitaciones anteriores; no se certificó su persistencia extremo a extremo desde Docker. El éxito se comprueba con transporte simulado en la prueba de UI.
- La ruta docente sigue restringida a `docente` en el frontend; el administrador usa el catálogo existente. La diferencia con la matriz general de permisos del backend requiere una decisión funcional futura.
- No se crearon usuarios ni se guardaron/eliminaron cursos, retos o grupos durante la revisión visual. Se probaron apertura, etiquetas, selección y cierre de formularios.
- No se ejecutó Cypress: la instalación local no incluye su binario. La revisión funcional se realizó mediante el navegador y Vitest.
- Sin auditoría de lector de pantalla, zoom 200 %, navegación completa sin ratón o preferencias del sistema operativo. `prefers-reduced-motion` está implementado, pero no se simuló su activación. Sin declaración de conformidad WCAG completa.
- No existen mapas geográficos ni generación de rutas que validar en este proyecto.

## 7. Recomendaciones para los próximos sprints

1. Actualizar las pruebas de autenticación a cookies HttpOnly y reducir la deuda de lint sin modificar permisos durante un trabajo visual.
2. Revisar integración local de IA y persistencia de telemetría; distinguir datos derivados, demostrativos y reales en todo el panel.
3. Acordar recorrido de ADMIN y registrar historias/criterios de aceptación por rol y simulador.
4. Validar pedagógicamente todos los niveles de TetriLogic y los cursos sembrados contra los niveles realmente disponibles en el cliente.
5. Dividir el bundle por rutas, ampliar pruebas de teclado/lectores de pantalla y automatizar la matriz responsive en CI.

## Inventario de archivos

- `design-system/pipre/MASTER.md`
- `docs/Informe_UI_UX.md`
- `frontend/index.html`
- `frontend/src/App.tsx`
- `frontend/src/components/ui/sheet.tsx`
- `frontend/src/globals.css`
- `frontend/src/shared/constants/themes.ts`
- `frontend/src/ui/components/NeonFlow/ComponentTray.tsx`
- `frontend/src/ui/components/NeonFlow/NeonBoard.tsx`
- `frontend/src/ui/components/NeonFlow/NeonFlowStage.tsx`
- `frontend/src/ui/components/Perfil/AchievementGrid.tsx`
- `frontend/src/ui/components/Perfil/HistoryTable.tsx`
- `frontend/src/ui/components/Perfil/PlayerCard.tsx`
- `frontend/src/ui/components/Perfil/StatsGrid.tsx`
- `frontend/src/ui/components/TetriLogic/Board.tsx`
- `frontend/src/ui/components/TetriLogic/PieceTray.tsx`
- `frontend/src/ui/components/TetriLogic/TetriLogicStage.tsx`
- `frontend/src/ui/components/common/AiFeedbackToast.tsx`
- `frontend/src/ui/components/common/ControlPanel.tsx`
- `frontend/src/ui/components/common/Modal.tsx`
- `frontend/src/ui/components/common/Navbar.tsx`
- `frontend/src/ui/components/ria-bento-grid/RiaBentoGrid.tsx`
- `frontend/src/ui/components/ria-bento-grid/cards/Ria01Card.tsx`
- `frontend/src/ui/components/ria-bento-grid/cards/Ria03Card.tsx`
- `frontend/src/ui/components/ria-bento-grid/cards/Ria04Card.tsx`
- `frontend/src/ui/components/ria-bento-grid/cards/Ria08Card.tsx`
- `frontend/src/ui/components/ria-bento-grid/cards/Ria10Card.tsx`
- `frontend/src/ui/components/ria-bento-grid/cards/Ria11Card.tsx`
- `frontend/src/ui/pages/CursosPage.tsx`
- `frontend/src/ui/pages/DocenteDashboard.tsx`
- `frontend/src/ui/pages/DocenteEstudiantesPage.tsx`
- `frontend/src/ui/pages/DocenteMetricasPage.tsx`
- `frontend/src/ui/pages/DocenteRetosPage.tsx`
- `frontend/src/ui/pages/LoginPage.tsx`
- `frontend/src/ui/pages/PaginaInicio.tsx`
- `frontend/src/ui/pages/PerfilPage.tsx`
- `frontend/src/ui/pages/RankingPage.tsx`
- `frontend/src/ui/pages/ResultadosPage.tsx`
- `frontend/src/ui/router/index.tsx`
- `frontend/tests/unit/SimulatorAccessibility.test.tsx`
