# Frontend
## Estructura de ejemplo
```
frontend/
│
├── public/                         # Assets estáticos (favicon, index.html base)
│
├── src/
│   │
│   ├── domain/                     #  Núcleo de negocio del frontend (sin dependencias externas)
│   │   ├── models/                 #  Tipos e interfaces que representan entidades del negocio
│   │   │   ├── User.ts             #  Tipo User con sus atributos de negocio
│   │   │   └── Product.ts          #  Ejemplo de entidad de dominio
│   │   │
│   │   ├── ports/                  # Contratos (interfaces) que la app espera cumplir
│   │   │   └── IUserRepository.ts  #  Qué operaciones puede hacer sobre usuarios
│   │   │
│   │   └── exceptions/             # Errores del dominio (ej. ValidationError, NotFoundError)
│   │       └── DomainError.ts
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
│   │   └── store/                  # Estado global (Zustand / Redux Toolkit)
│   │       └── authStore.ts        # Estado de autenticación
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

# Uso de pnpm
Instalar pnpm (si no lo tienes):
``` Bash
npm install -g pnpm
```

| Acción                          | Comando npm              | Comando pnpm        |
|---------------------------------|--------------------------|---------------------|
| Instalar dependencias           | npm install              | pnpm i              |
| Levantar proyecto               | npm run dev              | pnpm dev            |
| Construir para prod             | npm run build            | pnpm build          |
| Agregar un paquete              | npm install <pkg>        | pnpm add <pkg>      |
| Agregar como dev dependency     | npm install -D <pkg>     | pnpm add -D <pkg>   |
| Quitar un paquete               | npm uninstall <pkg>      | pnpm remove <pkg>   |

### Agregar Nuevos plugins
Para instalar nuevos plugins buscarlos con **pnpm** en internet o pedírselo a la IA.

# Uso rutas absolutas(Aliases)
Para evitar imports con multiples anidaciones como ".../../modules/domain", vamos a configurar los alias.

Por ejemplo, vamos a configurar la ruta "./src/modules/domain" para usar "@domain/" en su lugar.
En el archivo **tsconfig.json** en paths, añadir la línea debajo de src:
``` json
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
pnpm i
pnpm dev
```