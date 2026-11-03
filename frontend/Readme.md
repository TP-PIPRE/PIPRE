# Frontend

## Estructura de ejemplo

```
frontend/
│
├── public/                         # Assets estáticos (favicon, index.html base)
│
├── src/
│   │
│   │
│   ├── application/                # Casos de uso: orquesta domain + ports
│   │   ├── usecases/
│   │   │   ├── LoginUserUseCase.ts       # Lógica de autenticación
│   │   │   └── FetchProductsUseCase.ts
│   │   │
│   │   └── hooks/                  # Custom hooks que exponen los casos de uso a los componentes
│   │       ├── useAuth.ts
│   │       └── useProducts.ts
│   │
│   ├── infrastructure/             # Implementaciones concretas de los ports (adapters)
│   │   │
│   │   ├── adapters/               # Implementan las interfaces del domain/ports
│   │   │   ├── http/
│   │   │   │   └── UserApiAdapter.ts       # Implementa IUserRepository usando Axios/fetch llamando al backend
│   │   │   │
│   │   │   └── storage/
│   │   │       └── LocalStorageAdapter.ts  # Persistencia local (tokens, preferencias)
│   │   │
│   │   ├── api/                    # Configuración del cliente HTTP
│   │   │   ├── axiosInstance.ts    # Instancia Axios con baseURL, interceptores, JWT header
│   │   │   └── endpoints.ts        # Constantes con todas las rutas del backend
│   │   │
│   │   |── store/                  # Estado global (Zustand / Redux Toolkit)
│   │   |   └── authStore.ts        # Estado de autenticación
│   │   └── ports/                  # Contratos (interfaces) que la app espera cumplir
│   │       └── IUserRepository.ts  #  Qué operaciones puede hacer sobre usuarios
│   │
│   ├── ui/                         # Capa de presentación (solo React, sin lógica de negocio)
│   │   ├── pages/                  # Vistas completas mapeadas a rutas
│   │   │   ├── HomePage.tsx
│   │   │   └── LoginPage.tsx
│   │   │
│   │   ├── components/             # Componentes reutilizables
│   │   │   ├── common/             #   Botones, inputs, loaders, modales
│   │   │   └── layout/             #   Navbar, Sidebar, Footer
│   │   │
│   │   └── router/
│   │       └── AppRouter.tsx       # React Router: define rutas y lazy loading
│   │
│   ├── shared/                     # Utilidades transversales sin lógica de negocio
│   │   ├── utils/                  # Funciones puras (formatDate, slugify, etc.)
│   │   ├── constants/              # Enumeraciones y constantes globales
│   │   └── types/                  # Tipos genéricos compartidos (Pagination, ApiResponse<T>)
│   │       ├── User.ts             #  Tipo User con sus atributos de negocio
│   │       └── Product.ts          #  Ejemplo de entidad de dominio
│   │
│   ├── assets/                     # Imágenes, fuentes, íconos SVG
│   │
│   ├── App.tsx                     # Raíz de la aplicación
│   └── main.tsx                    # Entry point (ReactDOM.createRoot)
│
├── tests/
│   ├── unit/                       # Tests unitarios por capa
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   └── e2e/                        # Tests end-to-end (Playwright / Cypress)
│
├── .env                            # VITE_API_BASE_URL, VITE_ML_API_URL
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Stack

- React TS: Librería para crear componentes con typescript.
- Vite: Bundler para la construcción rápida del proyecto.
- pnpm: Gestor de instalación y actualización de paquetes.

## Plugins Actuales

- Tailwind CSS
- React Icons

# Dependencias y pnpm

El frontend usa **pnpm 11.7.0**, fijado en `package.json`, y un único lockfile:
`pnpm-lock.yaml`. Docker usa el mismo contrato. Necesitas Node 22.13 o superior
dentro de la rama 22, o Node 24 o superior, con Corepack disponible.

```powershell
corepack pnpm --version
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

| Acción | Comando desde `frontend/` |
|---|---|
| Instalar versiones publicadas del proyecto | `corepack pnpm install --frozen-lockfile` |
| Agregar o actualizar un paquete | `corepack pnpm add <paquete>@<versión revisada>` |
| Agregar dependencia de desarrollo | `corepack pnpm add -D <paquete>@<versión revisada>` |
| Quitar dependencia | `corepack pnpm remove <paquete>` |
| Comprobar vulnerabilidades | `corepack pnpm audit` |
| Pruebas unitarias | `corepack pnpm test:run --maxWorkers=2 --testTimeout=20000` |
| Compilar y verificar TypeScript | `corepack pnpm build` |
| Analizar código | `corepack pnpm lint` |

No generar `package-lock.json` ni mezclar instalaciones npm/yarn. El preinstall
comprueba el gestor. Para una actualización de seguridad, revisar el diff del
lockfile, auditar, ejecutar pruebas y compilar antes de preparar el PR.

Los componentes ya generados siguen en `src/components/ui`. Sus variantes CSS
se conservan en `src/styles/component-variants.css`, con licencia en
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md); no requieren instalar la CLI
de shadcn. Si se vuelve a usar un generador, revisar su árbol y no añadirlo como
dependencia de ejecución sólo para importar estilos.

### Agregar Nuevos plugins

Para instalar nuevos plugins buscarlos con **pnpm** en internet o pedírselo a la IA.

# Uso rutas absolutas(Aliases)

Para evitar imports con multiples anidaciones como ".../../modules/domain", vamos a configurar los alias.

Por ejemplo, vamos a configurar la ruta "./src/modules/domain" para usar "@domain/" en su lugar.
En el archivo **tsconfig.json** en paths, añadir la línea debajo de src:

```json
    "paths": {
      "@/*": ["src/*"],
      "@domain/*": ["src/modules/domain/*"],
    }
```

Con esto tenemos 2 rutas:

> "@/" reemplaza a "./src/"

> "@domain/" reemplaza a "./src/modules/domain/"

Estas rutas solo las usaremos para carpetas importantes.

# Para comenzar

```shell
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```
