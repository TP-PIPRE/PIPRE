# Biblioteca de Componentes — Wiki Técnica

## Descripción General

La Biblioteca de Componentes (ruta `/biblioteca`) es una wiki técnica que documenta **componentes
industriales reales** y los relaciona con los **bloques de programación del simulador**. Su objetivo
es cerrar la brecha entre la teoría industrial y la práctica en el simulador: cada componente real
tiene su contraparte en bloques que el estudiante puede arrastrar y programar.

## Arquitectura

```
src/
├── shared/constants/
│   └── componentWiki.ts          ← Base de datos de componentes (18 entradas)
├── ui/
│   ├── components/Biblioteca/
│   │   ├── ComponentCard.tsx     ← Tarjeta de componente en grid
│   │   └── ComponentDetail.tsx   ← Modal de detalle con specs + Mermaid
│   └── pages/
│       └── BibliotecaPage.tsx    ← Página principal (tabs + grid + búsqueda)
```

## Temas (Categorías)

| Tema         | Icono | Componentes | Color     |
|-------------|-------|-------------|-----------|
| Movimiento  | ⚙️    | 5           | Azul      |
| Sensores    | 📡    | 4           | Esmeralda |
| Actuadores  | 🔧    | 4           | Ámbar     |
| Control     | 🧠    | 3           | Púrpura   |
| Comunicación| 📶    | 4           | Cian      |
| Estructura  | 🏗️    | 2           | Rosa      |

**Total: 18 componentes documentados.**

## Estructura de Datos (`componentWiki.ts`)

Cada entrada (`ComponentWikiEntry`) contiene:

```typescript
interface ComponentWikiEntry {
  id: string;                    // Identificador único (ej: "motor-dc")
  name: string;                  // Nombre del componente
  description: string;           // Descripción técnica
  theme: ComponentThemeId;       // Categoría (movimiento, sensores, etc.)
  technicalSpecs: TechSpec[];    // Especificaciones técnicas (label + value)
  wiring: string;                // Diagrama de conexionado en texto
  industrialUses: string[];      // Usos en la industria
  relatedBlockTypes: string[];   // Bloques del simulador relacionados
  relatedHardware?: string[];    // Hardware del simulador relacionado
}
```

## Componentes Documentados

### ⚙️ Movimiento
- **Motor DC** — Control por PWM + Puente H. Relacionado: `mover_ruedas`, `acelerar`, `frenar`
- **Servomotor** — Control PWM de 50 Hz. Relacionado: `rotar_nucleo`
- **Motor Paso a Paso** — Driver A4988 + STEP/DIR. Relacionado: `mover_ruedas`, `rotar_nucleo`
- **Ruedas y Orugas** — Sistemas de tracción. Relacionado: `mover_ruedas`
- **Poleas y Cadenas** — Transmisión mecánica. Relacionado: `mover_ruedas`, `acelerar`

### 📡 Sensores
- **Ultrasónico HC-SR04** — Rango 2–400 cm, 40 kHz. Relacionado: `al_detectar_obstaculo`, `si_distancia`
- **Infrarrojo** — Rango 2–30 cm. Relacionado: `al_detectar_obstaculo`, `si_distancia`
- **LIDAR** — Rango hasta 40 m, interfaz UART/USB. Relacionado: `escanear_enemigo`
- **Encoder Rotatorio** — 200–5000 PPR. Relacionado: `mover_ruedas`, `acelerar`, `frenar`

### 🔧 Actuadores
- **Brazo Robótico** — 4–6 DOF, alcance 20–100 cm. Relacionado: `atacar`, `recolectar`, `golpear`
- **Pinza / Gripper** — Apertura 10–150 mm. Relacionado: `recolectar`, `golpear`
- **Pistón Neumático** — Carrera 10–1000 mm. Relacionado: `golpear`, `frenado_emergencia`
- **Electroimán** — Fuerza 5–200 kg. Relacionado: `recolectar`

### 🧠 Control
- **PIPRE-X1** — ARM Cortex-M4, 168 MHz. Relacionado: `al_iniciar_sistema`, `repetir`, `mientras`, `si_distancia`
- **PLC Industrial** — Ladder/FBD/ST IEC 61131-3. Relacionado: `al_iniciar_sistema`, `repetir`, `si_distancia`
- **Arduino Uno/Mega** — ATmega328P/2560. Relacionado: `al_iniciar_sistema`, `mover_ruedas`

### 📶 Comunicación
- **Bluetooth HC-05/HC-06** — UART TTL, 10 m alcance
- **WiFi ESP8266/ESP32** — TCP/IP, MQTT, REST API
- **RS-485 / Modbus RTU** — Bus multidrop, hasta 1200 m
- **CAN Bus** — 125 kbps–1 Mbps, automoción/industria

### 🏗️ Estructura
- **Chasis Robótico** — Aluminio 6061 / PLA+ / Fibra de carbono
- **Rieles Lineales** — Carrera 50–2000 mm, precisión ±0.01 mm

## Funcionalidades de la UI

### Navegación por Temas
Tabs superiores con 6 categorías. Al seleccionar un tema, se filtra la cuadrícula de componentes.

### Búsqueda
Campo de texto que busca en: nombre del componente, descripción, usos industriales y bloques
relacionados.

### Grid de Componentes
Cada tarjeta muestra: nombre, descripción breve, categoría (con color), y número de bloques
relacionados en el simulador.

### Modal de Detalle
Al hacer clic en un componente, se abre un modal con:

1. **Especificaciones Técnicas** — Tabla con voltaje, corriente, rango, precisión, etc.
2. **Conexionado / Wiring** — Diagrama textual de conexiones eléctricas.
3. **Usos Industriales** — Lista de aplicaciones reales en la industria.
4. **Bloques Relacionados** — Etiquetas con los bloques del simulador que corresponden al
   componente, con un diagrama Mermaid de ejemplo generado dinámicamente.

## Integración con el Simulador

La relación entre componentes reales y bloques del simulador se define mediante
`relatedBlockTypes`, que enlaza a los `BlockDefinition.type` definidos en
`environmentConfigs.ts`. El modal de detalle resuelve estos tipos buscando en los 4 entornos
(battle, space, maze, obstacle) y renderiza un diagrama de flujo Mermaid como ejemplo de uso.

## Próximas Extensiones (Planificadas)

- **Fase 2**: Usar coordenadas reales `(x, z)` de los retos en el mapa del simulador
- **Fase 3**: Mapa tipo overworld mostrando todos los retos de un curso como nodos interactivos
- **Fase 4**: Integración con API REST para planificar progresión de retos basada en resultados
- **Endpoint de componentes**: Mover los datos a `/api/components` para que sean editables desde
  el panel docente

## Cómo Agregar un Nuevo Componente

1. Editar `src/shared/constants/componentWiki.ts`
2. Agregar la entrada al arreglo `COMPONENT_WIKI` siguiendo la interfaz `ComponentWikiEntry`
3. Si el tema no existe, agregarlo también al arreglo `COMPONENT_THEMES`
4. El bloque relacionado debe existir en `environmentConfigs.ts` (campo `type` del `BlockDefinition`)
5. Ejecutar `pnpm run build` para verificar que no hay errores de tipos
