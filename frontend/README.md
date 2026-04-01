# Stack Actual
### React TS
> Librería para crear componentes con typescript.
### Vite
> Bundler para la construcción rápida del proyecto.
### pnpm
> Gestor de instalación y actualización de paquetes.

### Plugins Actuales
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