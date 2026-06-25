export type ComponentThemeId = "movimiento" | "sensores" | "actuadores" | "control" | "comunicacion" | "estructura";

export interface ComponentTheme {
  id: ComponentThemeId;
  name: string;
  description: string;
  icon: string;
}

export interface TechSpec {
  label: string;
  value: string;
}

export interface ComponentWikiEntry {
  id: string;
  name: string;
  description: string;
  theme: ComponentThemeId;
  technicalSpecs: TechSpec[];
  wiring: string;
  industrialUses: string[];
  relatedBlockTypes: string[];
  relatedHardware?: string[];
}

export const COMPONENT_THEMES: ComponentTheme[] = [
  { id: "movimiento", name: "Movimiento", description: "Motores, ruedas y sistemas de desplazamiento industrial", icon: "⚙️" },
  { id: "sensores", name: "Sensores", description: "Dispositivos de medición y percepción del entorno", icon: "📡" },
  { id: "actuadores", name: "Actuadores", description: "Elementos que ejecutan acciones físicas sobre el entorno", icon: "🔧" },
  { id: "control", name: "Control", description: "Unidades de procesamiento y lógica de control", icon: "🧠" },
  { id: "comunicacion", name: "Comunicación", description: "Protocolos e interfaces para intercambio de datos", icon: "📶" },
  { id: "estructura", name: "Estructura", description: "Soportes, chasis y elementos mecánicos pasivos", icon: "🏗️" },
];

export const COMPONENT_WIKI: ComponentWikiEntry[] = [
  // ── MOVIMIENTO ──────────────────────────────────────────
  {
    id: "motor-dc",
    name: "Motor DC",
    description: "Motor de corriente continua que convierte energía eléctrica en movimiento rotatorio. Ampliamente usado en robótica móvil por su simplicidad y facilidad de control mediante PWM.",
    theme: "movimiento",
    technicalSpecs: [
      { label: "Voltaje", value: "6V – 24V DC" },
      { label: "Corriente", value: "0.5A – 3A (sin carga)" },
      { label: "RPM", value: "100 – 3000 rpm (según modelo)" },
      { label: "Torque", value: "0.5 – 15 kg·cm" },
      { label: "Control", value: "PWM + Puente H (L298N / L293D)" },
    ],
    wiring: "VCC → Puente H (12V) | GND → GND común | Señal PWM → Pin GPIO (ej. 9) | Enable A/B → 5V (siempre activo) | Input 1/2 → Pines dirección",
    industrialUses: [
      "Accionamiento de bandas transportadoras",
      "Robots móviles AGV",
      "Brazos robóticos de baja carga",
      "Sistemas de ventilación industrial",
      "Actuación de compuertas y válvulas",
    ],
    relatedBlockTypes: ["mover_ruedas", "acelerar", "frenar"],
    relatedHardware: ["ruedas_carrera", "traccion_oruga"],
  },
  {
    id: "servomotor",
    name: "Servomotor",
    description: "Motor con retroalimentación de posición que permite controlar ángulo, velocidad y aceleración con precisión. Essencial para articulaciones robóticas.",
    theme: "movimiento",
    technicalSpecs: [
      { label: "Voltaje", value: "4.8V – 7.4V" },
      { label: "Ángulo", value: "0° – 180° (estándar) / 0° – 360° (rotación continua)" },
      { label: "Torque", value: "1 – 30 kg·cm" },
      { label: "Velocidad", value: "0.1 – 0.5 s/60°" },
      { label: "Control", value: "PWM (50 Hz, ancho 1–2 ms)" },
    ],
    wiring: "Cable rojo (VCC) → 5V | Cable café/negro (GND) → GND | Cable naranja/blanco (Señal) → Pin GPIO PWM",
    industrialUses: [
      "Articulaciones de brazos robóticos (hombro, codo, muñeca)",
      "Pinzas y garras de sujeción",
      "Dirección de vehículos autoguiados",
      "Posicionamiento de cámaras y sensores",
      "Válvulas proporcionales",
    ],
    relatedBlockTypes: ["rotar_nucleo"],
    relatedHardware: ["brazo_recolector"],
  },
  {
    id: "motor-paso-a-paso",
    name: "Motor Paso a Paso",
    description: "Motor que gira en pasos discretos y precisos sin necesidad de encoder. Ideal para posicionamiento exacto en impresoras 3D, CNC y robótica de precisión.",
    theme: "movimiento",
    technicalSpecs: [
      { label: "Voltaje", value: "5V – 12V DC" },
      { label: "Pasos por vuelta", value: "200 (1.8°/paso) o 400 (0.9°/paso)" },
      { label: "Corriente por fase", value: "0.5A – 2A" },
      { label: "Torque", value: "1 – 20 kg·cm" },
      { label: "Control", value: "Driver A4988 / DRV8825 + Pines STEP/DIR" },
    ],
    wiring: "VCC (motor) → Fuente externa (según voltaje) | GND → GND común | STEP → Pin GPIO | DIR → Pin GPIO | Enable → GND (habilitado) | VDD (driver) → 5V",
    industrialUses: [
      "Ejes de coordenadas CNC",
      "Impresoras 3D industriales",
      "Posicionadores de pallets",
      "Mesas rotativas de ensamblaje",
      "Sistemas de etiquetado y marcado",
    ],
    relatedBlockTypes: ["mover_ruedas", "rotar_nucleo"],
  },
  {
    id: "ruedas-orugas",
    name: "Ruedas y Orugas",
    description: "Sistemas de tracción que convierten el torque del motor en desplazamiento lineal. Las orugas ofrecen mayor agarre en terrenos irregulares; las ruedas permiten mayor velocidad.",
    theme: "movimiento",
    technicalSpecs: [
      { label: "Diámetro rueda", value: "65 – 200 mm" },
      { label: "Ancho oruga", value: "20 – 80 mm" },
      { label: "Material", value: "Caucho vulcanizado / Poliuretano" },
      { label: "Coef. tracción", value: "0.6 – 0.9 (oruga) / 0.4 – 0.7 (rueda)" },
      { label: "Carga máxima", value: "5 – 100 kg por unidad" },
    ],
    wiring: "Acople directo al eje del motor | Tornillería M4–M8 para fijación | Rodamientos de bolas opcionales en ejes de carga",
    industrialUses: [
      "Vehículos de guiado automático (AGV)",
      "Plataformas de inspección en ductos",
      "Transporte interno de materiales",
      "Robots de exploración y rescate",
      "Líneas de ensamblaje móviles",
    ],
    relatedBlockTypes: ["mover_ruedas"],
    relatedHardware: ["traccion_oruga", "ruedas_carrera", "ruedas_lunares"],
  },
  {
    id: "poleas-cadenas",
    name: "Poleas y Cadenas",
    description: "Sistemas de transmisión mecánica que convierten movimiento rotatorio en lineal o lo transfieren entre ejes distantes. Cadenas para alta carga, poleas para precisión.",
    theme: "movimiento",
    technicalSpecs: [
      { label: "Relación de transmisión", value: "1:1 – 10:1 (según diámetro)" },
      { label: "Perfil correa", value: "T5 / T10 / HTD 5M / HTD 8M" },
      { label: "Cadena", value: "ANSI #25 / #35 / #40 (paso 6.35 / 9.52 / 12.7 mm)" },
      { label: "Tensión máxima", value: "50 – 500 kg según perfil" },
      { label: "Material", value: "Acero inoxidable / Nylon reforzado" },
    ],
    wiring: "Fijación mecánica: soportes de eje con rodamientos | Tensado mediante tornillos excéntricos o deslizaderas",
    industrialUses: [
      "Transmisión de potencia en transportadores",
      "Elevadores de carga vertical",
      "Sistemas de posicionamiento lineal (correa dentada)",
      "Puentes grúa y polipastos",
      "Mecanismos de apertura/cierre",
    ],
    relatedBlockTypes: ["mover_ruedas", "acelerar"],
  },

  // ── SENSORES ────────────────────────────────────────────
  {
    id: "ultrasonido",
    name: "Sensor Ultrasónico HC-SR04",
    description: "Sensor de distancia por ultrasonido que emite pulsos de 40 kHz y mide el tiempo de retorno del eco. Ideal para detección de obstáculos hasta 4 metros.",
    theme: "sensores",
    technicalSpecs: [
      { label: "Rango", value: "2 cm – 400 cm" },
      { label: "Resolución", value: "0.3 cm" },
      { label: "Frecuencia", value: "40 kHz" },
      { label: "Ángulo de detección", value: "15° – 30°" },
      { label: "Alimentación", value: "5V DC, 15 mA" },
      { label: "Interfaz", value: "TTL (Trigger + Echo)" },
    ],
    wiring: "VCC → 5V | GND → GND | Trig → Pin GPIO (salida) | Echo → Pin GPIO (entrada, con divisor 5V→3.3V si es necesario)",
    industrialUses: [
      "Medición de nivel en tanques y silos",
      "Detección de presencia en cintas transportadoras",
      "Sensado de proximidad en robots colaborativos",
      "Estacionamiento asistido en AGVs",
      "Monitoreo de distancia en grúas",
    ],
    relatedBlockTypes: ["al_detectar_obstaculo", "si_distancia", "escanear_enemigo"],
    relatedHardware: ["sensor_ultrasonico", "sensor_velocidad"],
  },
  {
    id: "infrarrojo",
    name: "Sensor Infrarrojo",
    description: "Sensor óptico que detecta obstáculos mediante luz infrarroja reflejada. Económico y eficaz para cortas distancias. Versión digital (obstáculo sí/no) o analógica (distancia aproximada).",
    theme: "sensores",
    technicalSpecs: [
      { label: "Rango", value: "2 cm – 30 cm (SHARP GP2Y0A21)" },
      { label: "Longitud de onda", value: "850 – 950 nm" },
      { label: "Salida digital", value: "0/1 (ajustable con potenciómetro)" },
      { label: "Salida analógica", value: "0 – 5V (inversamente proporcional a distancia)" },
      { label: "Alimentación", value: "3.3V – 5V DC, 10 mA" },
    ],
    wiring: "VCC → 5V | GND → GND | OUT → Pin GPIO (modo digital) o Pin ADC (modo analógico)",
    industrialUses: [
      "Detección de piezas en líneas de ensamblaje",
      "Contadores de objetos en transportadores",
      "Sensado de fin de carrera sin contacto",
      "Navegación por seguimiento de línea",
      "Detección de proximidad en almacenes automatizados",
    ],
    relatedBlockTypes: ["al_detectar_obstaculo", "si_distancia"],
  },
  {
    id: "lidar",
    name: "LIDAR / Escáner Láser",
    description: "Sensor de barrido láser que genera mapas 2D/3D del entorno mediante tiempo de vuelo (ToF). Usado en SLAM, mapeo autónomo y navegación avanzada.",
    theme: "sensores",
    technicalSpecs: [
      { label: "Rango", value: "0.1 – 40 m (según clase)" },
      { label: "Precisión", value: "±1 – 3 cm" },
      { label: "Tasa de muestreo", value: "5 – 40 kHz" },
      { label: "Ángulo", value: "360° (2D) / 270°x90° (3D)" },
      { label: "Interfaz", value: "UART / USB / Ethernet" },
    ],
    wiring: "VCC → 5V (2A recomendado) | GND → GND | TX → RX (UART, 115200 baud) | RX → TX | Habilitar con pin EN o comando serie",
    industrialUses: [
      "SLAM y mapeo autónomo de almacenes",
      "Navegación de AGVs sin marcadores",
      "Inspección de túneles y ductos",
      "Escaneo volumétrico de mercancía",
      "Seguridad perimetral en zonas restringidas",
    ],
    relatedBlockTypes: ["escanear_enemigo", "al_detectar_obstaculo"],
    relatedHardware: ["radar_tactico"],
  },
  {
    id: "encoder",
    name: "Encoder Rotatorio",
    description: "Sensor de posición angular que convierte el giro de un eje en pulsos digitales. Permite medir velocidad, distancia recorrida y posición absoluta o incremental.",
    theme: "sensores",
    technicalSpecs: [
      { label: "Resolución", value: "200 – 5000 PPR (pulsos por revolución)" },
      { label: "Tipo", value: "Incremental (2 canales A/B) / Absoluto (Gray code)" },
      { label: "Frecuencia máx.", value: "100 kHz – 1 MHz" },
      { label: "Alimentación", value: "5V – 24V DC" },
      { label: "Salida", value: "TTL / Push-Pull / Open Collector" },
    ],
    wiring: "VCC → 5V/24V | GND → GND | Ch A → Pin GPIO (interrupción) | Ch B → Pin GPIO | Index/Z (opcional) → Pin GPIO",
    industrialUses: [
      "Control de velocidad en motores DC",
      "Odometría en robots móviles",
      "Posicionamiento de ejes CNC",
      "Medición de longitud en transportadores",
      "Sincronización de múltiples motores",
    ],
    relatedBlockTypes: ["mover_ruedas", "acelerar", "frenar"],
  },

  // ── ACTUADORES ──────────────────────────────────────────
  {
    id: "brazo-robotico",
    name: "Brazo Robótico",
    description: "Manipulador articulado con múltiples grados de libertad (DOF). Compuesto por segmentos unidos por articulaciones accionadas por servomotores o actuadores lineales.",
    theme: "actuadores",
    technicalSpecs: [
      { label: "Grados de libertad", value: "4 – 6 DOF" },
      { label: "Alcance", value: "20 – 100 cm" },
      { label: "Capacidad de carga", value: "0.5 – 10 kg" },
      { label: "Precisión", value: "±0.1 – 2 mm" },
      { label: "Actuadores", value: "Servomotores / Motores paso a paso" },
    ],
    wiring: "Cada articulación: VCC → Fuente de poder (5–7.4V) | GND → GND común | Señal PWM → Pin GPIO dedicado | Alimentación externa para motores de alta corriente",
    industrialUses: [
      "Pick-and-place en líneas de ensamblaje",
      "Soldadura y corte automatizado",
      "Pintura y recubrimiento por pulverización",
      "Empaque y paletizado",
      "Inspección y control de calidad",
    ],
    relatedBlockTypes: ["atacar", "recolectar", "golpear"],
    relatedHardware: ["brazo_recolector"],
  },
  {
    id: "pinza",
    name: "Pinza / Gripper",
    description: "Efector final que permite al brazo robótico agarrar, sostener y manipular objetos. Puede ser neumática, eléctrica o magnética según la aplicación.",
    theme: "actuadores",
    technicalSpecs: [
      { label: "Apertura", value: "10 – 150 mm" },
      { label: "Fuerza de sujeción", value: "0.5 – 50 N" },
      { label: "Accionamiento", value: "Servomotor / Solenoide / Neumático" },
      { label: "Material de mordazas", value: "Aluminio / Acero / Caucho" },
      { label: "Tiempo de cierre", value: "0.1 – 1 s" },
    ],
    wiring: "Servo: PWM (pin GPIO) | Neumática: Válvula solenoide → Relé → Pin GPIO | Sensor de presencia (opcional) → Pin GPIO entrada",
    industrialUses: [
      "Sujeción de piezas durante mecanizado",
      "Clasificación y separación de productos",
      "Ensamblaje de componentes pequeños",
      "Manipulación de materiales frágiles (con mordazas blandas)",
      "Cambio de herramientas automático",
    ],
    relatedBlockTypes: ["recolectar", "golpear"],
    relatedHardware: ["brazo_recolector"],
  },
  {
    id: "piston-neumatico",
    name: "Pistón Neumático",
    description: "Actuador lineal que convierte aire comprimido en movimiento mecánico. Rápido, simple y de alta fuerza, ideal para movimientos de ida/vuelta en entornos industriales.",
    theme: "actuadores",
    technicalSpecs: [
      { label: "Carrera", value: "10 – 1000 mm" },
      { label: "Diámetro", value: "8 – 100 mm" },
      { label: "Presión de trabajo", value: "2 – 10 bar" },
      { label: "Fuerza", value: "10 – 5000 N (según diámetro y presión)" },
      { label: "Velocidad", value: "0.1 – 2 m/s" },
    ],
    wiring: "Electroválvula 5/2 vías: VCC → 24V DC | GND → GND | Señal A/B → Pines GPIO (vía relé o driver MOSFET) | Manguera de 6–10 mm desde compresor",
    industrialUses: [
      "Empujadores y expulsores en transportadores",
      "Sujeción de piezas en taladros y fresadoras",
      "Puertas automáticas industriales",
      "Sistemas de estampado y marcado",
      "Mecanismos de parada de emergencia",
    ],
    relatedBlockTypes: ["golpear", "frenado_emergencia"],
  },
  {
    id: "electroiman",
    name: "Electroimán",
    description: "Dispositivo que genera un campo magnético controlable eléctricamente. Permite sujetar y soltar objetos ferromagnéticos sin contacto mecánico.",
    theme: "actuadores",
    technicalSpecs: [
      { label: "Voltaje", value: "12V / 24V DC" },
      { label: "Fuerza de sujeción", value: "5 – 200 kg" },
      { label: "Consumo", value: "0.5 – 5 A" },
      { label: "Diámetro", value: "20 – 100 mm" },
      { label: "Tiempo de respuesta", value: "< 50 ms" },
    ],
    wiring: "VCC → Relé o MOSFET (nunca directo a GPIO) | GND → GND común | Diodo flyback en paralelo para protección | Pin GPIO → Base del transistor / Relé",
    industrialUses: [
      "Manipulación de chapa metálica",
      "Separación de materiales ferrosos en reciclaje",
      "Sujeción en mesas de fresado",
      "Grúas magnéticas para carga pesada",
      "Sistemas de clasificación magnética",
    ],
    relatedBlockTypes: ["recolectar"],
  },

  // ── CONTROL ─────────────────────────────────────────────
  {
    id: "pipre-x1",
    name: "Microcontrolador PIPRE-X1",
    description: "Unidad de control central del simulador basada en arquitectura ARM Cortex-M4. Integra pines PWM, ADC, UART, I2C y SPI para control de periféricos robóticos.",
    theme: "control",
    technicalSpecs: [
      { label: "Arquitectura", value: "ARM Cortex-M4 a 168 MHz" },
      { label: "Flash / RAM", value: "512 KB / 128 KB" },
      { label: "Pines GPIO", value: "40 (16 con PWM, 8 ADC, 2 DAC)" },
      { label: "Comunicación", value: "3× UART, 2× I2C, 3× SPI, 1× CAN" },
      { label: "Alimentación", value: "5V USB o 7–12V Vin" },
    ],
    wiring: "Vin → 7–12V (si no usa USB) | 5V → Salida a sensores | 3.3V → Salida a módulos lógicos | GND → GND común | Pines según periférico conectado",
    industrialUses: [
      "Control central de robots educativos e industriales",
      "Adquisición de datos de sensores múltiples",
      "Ejecución de algoritmos de control PID en tiempo real",
      "Interfaz entre sensores y actuadores",
      "Comunicación con sistemas SCADA y HMI",
    ],
    relatedBlockTypes: ["al_iniciar_sistema", "repetir", "mientras", "por_cada", "si_distancia"],
  },
  {
    id: "plc",
    name: "PLC Industrial",
    description: "Controlador Lógico Programable, cerebro de la automatización industrial. Ejecuta ciclos de scan: leer entradas → ejecutar lógica → actualizar salidas.",
    theme: "control",
    technicalSpecs: [
      { label: "Tensión de entrada", value: "110–240 VAC o 24 VDC" },
      { label: "Entradas digitales", value: "8 – 32 (24V sink/source)" },
      { label: "Salidas digitales", value: "8 – 32 (Relé o Transistor)" },
      { label: "Entradas analógicas", value: "0 – 8 (0–10V / 4–20 mA)" },
      { label: "Lenguaje", value: "Ladder / FBD / ST / SFC / IL (IEC 61131-3)" },
    ],
    wiring: "L → Fase 110–240VAC | N → Neutro | PE → Tierra | Sensores → Entradas digitales/analógicas | Actuadores → Salidas vía relés | Bus de comunicación → SCADA",
    industrialUses: [
      "Control de líneas de ensamblaje completas",
      "Automatización de procesos batch (químico, alimenticio)",
      "Gestión de transportadores y almacenes",
      "Supervisión de parámetros críticos (temperatura, presión)",
      "Interlock de seguridad en maquinaria pesada",
    ],
    relatedBlockTypes: ["al_iniciar_sistema", "repetir", "mientras", "si_distancia"],
  },
  {
    id: "arduino",
    name: "Arduino Uno / Mega",
    description: "Plataforma de prototipado electrónico open-source basada en ATmega. Ideal para aprendizaje, validación de conceptos y control de robots educativos.",
    theme: "control",
    technicalSpecs: [
      { label: "Microcontrolador", value: "ATmega328P (Uno) / ATmega2560 (Mega)" },
      { label: "Velocidad", value: "16 MHz" },
      { label: "GPIO", value: "14 (Uno) / 54 (Mega)" },
      { label: "Pines PWM", value: "6 (Uno) / 15 (Mega)" },
      { label: "Entradas analógicas", value: "6 (Uno) / 16 (Mega)" },
    ],
    wiring: "VCC → 5V USB o 7–12V (Vin) | GND → GND común | Pines digitales → señales | Pines analógicos → sensores analógicos | 3.3V → módulos de baja potencia",
    industrialUses: [
      "Prototipado rápido de controladores robóticos",
      "Educación en automatización y robótica",
      "Sistemas de monitoreo de bajo costo",
      "Control de impresoras 3D y CNC caseras",
      "Estaciones meteorológicas y IoT educativas",
    ],
    relatedBlockTypes: ["al_iniciar_sistema", "repetir", "mover_ruedas", "rotar_nucleo"],
  },

  // ── COMUNICACION ────────────────────────────────────────
  {
    id: "bluetooth",
    name: "Módulo Bluetooth HC-05 / HC-06",
    description: "Módulo de comunicación inalámbrica serie por Bluetooth 2.0. Permite control remoto y telemetría entre el robot y una estación base o dispositivo móvil.",
    theme: "comunicacion",
    technicalSpecs: [
      { label: "Versión Bluetooth", value: "2.0 (HC-05) / 2.0 (HC-06)" },
      { label: "Alcance", value: "10 m" },
      { label: "Velocidad", value: "9600 – 115200 baud" },
      { label: "Alimentación", value: "3.6 – 6V DC, 30 mA" },
      { label: "Interfaz", value: "UART (TTL)" },
    ],
    wiring: "VCC → 5V / 3.3V | GND → GND | TXD → RXD del microcontrolador | RXD → TXD del microcontrolador (vía divisor 5V→3.3V)",
    industrialUses: [
      "Control remoto de robots educativos",
      "Transmisión de datos de telemetría",
      "Configuración inalámbrica de parámetros",
      "Interfaz con tablets y smartphones",
      "Depuración remota de código",
    ],
    relatedBlockTypes: [],
  },
  {
    id: "wifi",
    name: "Módulo WiFi ESP8266 / ESP32",
    description: "Módulo con WiFi integrado que permite conexión a redes TCP/IP, comunicación MQTT y REST API. El ESP32 añade Bluetooth LE y capacidades de doble núcleo.",
    theme: "comunicacion",
    technicalSpecs: [
      { label: "Estándar WiFi", value: "802.11 b/g/n (2.4 GHz)" },
      { label: "Alcance", value: "30 – 100 m" },
      { label: "Velocidad", value: "Hasta 150 Mbps" },
      { label: "Protocolos", value: "TCP/IP, UDP, HTTP, MQTT, WebSocket" },
      { label: "GPIO", value: "9 (ESP8266) / 34 (ESP32)" },
    ],
    wiring: "VCC → 3.3V (¡IMPORTANTE! NO 5V directo) | GND → GND | TX → RX (UART) | RX → TX (vía divisor si es 5V) | CH_PD/EN → 3.3V (habilitar módulo) | GPIO0 → GND (flash mode)",
    industrialUses: [
      "IoT industrial — monitoreo remoto de máquinas",
      "Comunicación con plataformas cloud (AWS, Azure)",
      "Actualización OTA de firmware",
      "Dashboards en tiempo real de telemetría",
      "Integración con sistemas MES y SCADA vía API",
    ],
    relatedBlockTypes: [],
  },
  {
    id: "rs485",
    name: "Bus RS-485 / Modbus RTU",
    description: "Estándar de comunicación serial diferencial para largas distancias y entornos ruidosos. Soporta múltiples dispositivos en bus multidrop. Base del protocolo Modbus RTU industrial.",
    theme: "comunicacion",
    technicalSpecs: [
      { label: "Topología", value: "Bus multidrop (hasta 32 dispositivos)" },
      { label: "Distancia máxima", value: "1200 m" },
      { label: "Velocidad", value: "9600 – 115200 baud (hasta 10 Mbps en corta distancia)" },
      { label: "Señal", value: "Diferencial (A+/B-)" },
      { label: "Terminación", value: "Resistencia 120Ω en cada extremo del bus" },
    ],
    wiring: "A+ (no inversor) → A+ de siguiente dispositivo | B- (inversor) → B- de siguiente dispositivo | GND → GND común (opcional pero recomendado) | Resistencia 120Ω entre A+ y B- en extremos | Shield → Tierra (solo un punto)",
    industrialUses: [
      "Comunicación entre PLCs y periféricos",
      "Red de sensores industriales distribuidos",
      "Control de variadores de frecuencia y servos",
      "Sistemas de adquisición de datos remotos",
      "Integración de robots con líneas de producción",
    ],
    relatedBlockTypes: [],
  },
  {
    id: "can-bus",
    name: "Bus CAN (Controller Area Network)",
    description: "Bus de comunicación robusto diseñado para automoción e industria. Mensajes prioritarios, detección de errores y alta confiabilidad en tiempo real.",
    theme: "comunicacion",
    technicalSpecs: [
      { label: "Velocidad", value: "125 kbps – 1 Mbps" },
      { label: "Topología", value: "Bus lineal con terminación en ambos extremos" },
      { label: "Longitud máxima", value: "40 m (1 Mbps) / 500 m (125 kbps)" },
      { label: "Señal", value: "Diferencial (CAN_H / CAN_L)" },
      { label: "Estándares", value: "CAN 2.0A (11 bits) / CAN 2.0B (29 bits) / CAN FD" },
    ],
    wiring: "CAN_H → CAN_H de siguiente nodo | CAN_L → CAN_L de siguiente nodo | GND → GND común (opcional) | Resistencia 120Ω entre CAN_H y CAN_L en cada extremo | Shield → Tierra (un solo punto)",
    industrialUses: [
      "Comunicación interna de robots modulares",
      "Red de sensores y actuadores en automoción",
      "Sistemas de control de movimiento sincronizado",
      "Máquinas agrícolas y de construcción",
      "Dispositivos médicos y de diagnóstico",
    ],
    relatedBlockTypes: [],
  },

  // ── ESTRUCTURA ──────────────────────────────────────────
  {
    id: "chasis",
    name: "Chasis Robótico",
    description: "Estructura mecánica que soporta todos los componentes del robot. Debe ser rígida, liviana y permitir el montaje de motores, ruedas, sensores y la placa de control.",
    theme: "estructura",
    technicalSpecs: [
      { label: "Material", value: "Aluminio 6061 / Acrílico / PLA+ / Fibra de carbono" },
      { label: "Formato", value: "Placa base + laterales + soportes" },
      { label: "Dimensiones típicas", value: "200×200 mm – 500×400 mm" },
      { label: "Altura", value: "40 – 100 mm" },
      { label: "Peso", value: "300 – 2000 g (según material)" },
    ],
    wiring: "Puntos de fijación M3–M6 | Separadores de latón hexagonal para montaje de PCB | Soportes amortiguados para batería | Ranuras para ajuste de motores",
    industrialUses: [
      "Base estructural de robots móviles educativos",
      "Plataforma para prototipado rápido",
      "Soporte para sensores en vehículos autónomos",
      "Estructura de brazos robóticos livianos",
      "Bastidor para drones y vehículos aéreos",
    ],
    relatedBlockTypes: [],
  },
  {
    id: "rieles-lineales",
    name: "Rieles Lineales y Guías",
    description: "Sistemas de guiado lineal que permiten movimiento preciso en un eje. Combinados con husillos o correas dentadas forman ejes de posicionamiento completos.",
    theme: "estructura",
    technicalSpecs: [
      { label: "Carrera", value: "50 – 2000 mm" },
      { label: "Precisión", value: "±0.01 – 0.1 mm" },
      { label: "Carga dinámica", value: "50 – 5000 N" },
      { label: "Coef. fricción", value: "0.001 – 0.01 (rodamientos lineales)" },
      { label: "", value: "" },
    ],
    wiring: "Montaje sobre superficie plana (≤0.05 mm/m) | Lubricación con grasa LG2 | Tope elástico en extremos | Fuelles protectores opcionales contra viruta",
    industrialUses: [
      "Ejes X/Y/Z de máquinas CNC",
      "Posicionadores de pick-and-place",
      "Mesas de coordenadas para inspección",
      "Desplazamiento de cabezales de soldadura",
      "Sistemas de corte por láser y agua",
    ],
    relatedBlockTypes: ["mover_ruedas"],
  },
];
