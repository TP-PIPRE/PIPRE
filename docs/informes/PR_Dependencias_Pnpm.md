# PR preparado: dependencias del frontend

**Estado:** cambios locales validados en `codex/seguridad-dependencias-pnpm`, desde `9384639`. No se creó un PR remoto, commit ni push. El usuario conserva la publicación y la integración en `develop`.

## Título

`fix(frontend): corrige dependencias vulnerables y unifica instalación con pnpm`

## Descripción para GitHub

El frontend conservaba dependencias vulnerables y dos lockfiles con versiones diferentes; Docker compilaba un árbol distinto al de una instalación npm. Esta corrección utiliza pnpm 11.7.0 con un único lockfile, actualiza las dependencias compatibles y elimina la CLI de shadcn conservando sus estilos locales y licencia.

Se actualiza ESLint, se aplica un override acotado de minimatch 10 a su versión corregida y se conserva la causa de los errores de autenticación. La instalación queda protegida por un guard de gestor y verificada tanto en Windows como en el build Docker. No cambia las reglas de los simuladores, contratos backend, migraciones ni `data-science`.

Validación: auditoría pnpm con cero avisos sin exclusiones; 335 pruebas frontend aprobadas, seis comprobaciones específicas de autenticación tras el ajuste final, TypeScript/build y Docker correctos. Revisión en navegador de login, catálogo, victorias Neon Flow/TetriLogic, L01 y perfil responsive. El lint de los archivos modificados pasa; el lint global conserva 25 errores y dos advertencias anteriores. Permanece la advertencia de bundle mayor de 500 kB.

Detalle: [informe de actualización](Actualizacion_Dependencias_Pnpm_2026_11_02.md).

## Publicación por el usuario

Desde la raíz, revisar primero `git diff` y `git status`. Después:

```powershell
git add frontend/ README.md docs/README.md docs/ESTADO_ACTUAL.md docs/sistema/06_Guia_Despliegue_Ejecucion_Local.md docs/informes/Actualizacion_Dependencias_Pnpm_2026_11_02.md docs/informes/PR_Dependencias_Pnpm.md
git commit -m "fix(frontend): corrige dependencias y unifica instalacion con pnpm"
git push -u origin codex/seguridad-dependencias-pnpm
```

En GitHub, crear el PR con **base `develop`** y **compare `codex/seguridad-dependencias-pnpm`**. La rama parte del avance de logros `9384639`: si éste aún no está integrado en `develop`, el diff del PR también lo incluirá. Revisar ese alcance o integrar primero el PR anterior antes de fusionar. No hacer push directo a `develop`.
