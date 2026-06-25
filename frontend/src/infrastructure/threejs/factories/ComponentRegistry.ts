import type { RobotComponent, IRobotComponentFactory } from "./RobotComponentFactory";
import { robotComponentFactory } from "./RobotComponentFactory";

export interface ComponentDefinition {
  id: string;
  name: string;
  type: "sensor" | "actuator" | "body" | "power" | "weapon" | "special";
  description: string;
  icon: string;
  color: string;
  slots: string[];
  dependencies?: string[];
  unlockedBy?: string[];
}

export class ComponentRegistry {
  private definitions: Map<string, ComponentDefinition> = new Map();
  private factory: IRobotComponentFactory;

  constructor(factory: IRobotComponentFactory) {
    this.factory = factory;
    this.registerDefaults();
  }

  private registerDefaults(): void {
    this.register({
      id: "ruedas_basicas",
      name: "Ruedas Básicas",
      type: "actuator",
      description: "Sistema de tracción básico para movimiento terrestre.",
      icon: "settings_motion_mode",
      color: "var(--success)",
      slots: ["ps_movement"],
    });

    this.register({
      id: "helices_cuadruples",
      name: "Hélices Cuádruples",
      type: "power",
      description: "Propulsión aérea con cuatro hélices de alta eficiencia.",
      icon: "flight",
      color: "var(--primary)",
      slots: ["ps_propulsion"],
    });

    this.register({
      id: "brazo_robotico",
      name: "Brazo Robótico",
      type: "actuator",
      description: "Manipulador de precisión para objetos y muestras.",
      icon: "precision_manufacturing",
      color: "var(--accent)",
      slots: ["ps_manipulation"],
    });

    this.register({
      id: "faro_led",
      name: "Faro LED",
      type: "sensor",
      description: "Iluminación de alta intensidad para exploración.",
      icon: "highlight",
      color: "var(--accent)",
      slots: ["ps_light"],
    });

    this.register({
      id: "sensor_ultrasonico",
      name: "Sensor Ultrasónico",
      type: "sensor",
      description: "Detección de proximidad por ultrasonido.",
      icon: "sensors",
      color: "var(--primary)",
      slots: ["ps_sensor"],
    });

    this.register({
      id: "canon_laser",
      name: "Cañón Láser",
      type: "weapon",
      description: "Arma de energía de alta precisión.",
      icon: "bolt",
      color: "var(--danger)",
      slots: ["ps_weapon"],
    });

    this.register({
      id: "escudo_energetico",
      name: "Escudo Energético",
      type: "body",
      description: "Campo de fuerza defensivo de energía.",
      icon: "shield",
      color: "var(--primary)",
      slots: ["ps_defense"],
    });

    this.register({
      id: "turbo_compresor",
      name: "Turbo Compresor",
      type: "power",
      description: "Aumento de velocidad repentino.",
      icon: "bolt",
      color: "var(--accent)",
      slots: ["ps_turbo"],
    });

    this.register({
      id: "suspension_deportiva",
      name: "Suspensión Deportiva",
      type: "actuator",
      description: "Amortiguación para saltos y frenado.",
      icon: "swap_vertical_circle",
      color: "var(--success)",
      slots: ["ps_suspension"],
    });

    this.register({
      id: "alerones_activos",
      name: "Alerones Activos",
      type: "body",
      description: "Estabilidad en curvas cerradas.",
      icon: "air",
      color: "var(--accent)",
      slots: ["ps_aero"],
    });

    this.register({
      id: "paracaidas",
      name: "Paracaídas de Frenado",
      type: "body",
      description: "Despliega un paracaídas para frenar en seco.",
      icon: "parachuting",
      color: "var(--danger)",
      slots: ["ps_brake"],
    });

    this.register({
      id: "propulsores_ionicos",
      name: "Propulsores Iónicos",
      type: "power",
      description: "Sistema de vuelo atmosférico.",
      icon: "flight",
      color: "var(--primary)",
      slots: ["ps_propulsion"],
    });

    this.register({
      id: "brazo_recolector",
      name: "Brazo Recolector",
      type: "actuator",
      description: "Manipulador de muestras geológicas.",
      icon: "precision_manufacturing",
      color: "var(--accent)",
      slots: ["ps_collection"],
    });

    this.register({
      id: "analizador_suelo",
      name: "Analizador de Suelo",
      type: "sensor",
      description: "Escáner de composición del terreno.",
      icon: "biotech",
      color: "var(--primary)",
      slots: ["ps_analyzer"],
    });

    this.register({
      id: "taladro_percutor",
      name: "Taladro Percutor",
      type: "actuator",
      description: "Perfora roca profunda para obtener muestras.",
      icon: "hardware",
      color: "var(--danger)",
      slots: ["ps_drill"],
    });

    this.register({
      id: "botas_velocidad",
      name: "Botas de Velocidad",
      type: "actuator",
      description: "Desplazamiento sigiloso.",
      icon: "directions_run",
      color: "var(--success)",
      slots: ["ps_movement"],
    });

    this.register({
      id: "faro_magico",
      name: "Faro Mágico",
      type: "sensor",
      description: "Ilumina pasadizos oscuros.",
      icon: "highlight",
      color: "var(--accent)",
      slots: ["ps_light"],
    });

    this.register({
      id: "llave_antigua",
      name: "Llave Antigua",
      type: "weapon",
      description: "Abre puertas encantadas.",
      icon: "vpn_key",
      color: "var(--primary)",
      slots: ["ps_key"],
    });

    this.register({
      id: "espejo_vision",
      name: "Espejo de Visión",
      type: "sensor",
      description: "Revela rastros de magia.",
      icon: "visibility",
      color: "var(--primary)",
      slots: ["ps_vision"],
    });

    this.register({
      id: "portal_teletransporte",
      name: "Portal de Teletransporte",
      type: "special",
      description: "Teletransportación entre nodos.",
      icon: "swipe",
      color: "var(--accent)",
      slots: ["ps_portal"],
    });

    this.register({
      id: "cristal_escarcha",
      name: "Cristal de Escarcha",
      type: "weapon",
      description: "Congela puertas y enemigos con hielo mágico.",
      icon: "ac_unit",
      color: "var(--primary)",
      slots: ["ps_ice"],
    });
  }

  register(definition: ComponentDefinition): void {
    this.definitions.set(definition.id, definition);
  }

  get(id: string): ComponentDefinition | undefined {
    return this.definitions.get(id);
  }

  getAll(): ComponentDefinition[] {
    return Array.from(this.definitions.values());
  }

  getByType(type: ComponentDefinition["type"]): ComponentDefinition[] {
    return this.getAll().filter((def) => def.type === type);
  }

  getBySlot(slotId: string): ComponentDefinition[] {
    return this.getAll().filter((def) => def.slots.includes(slotId));
  }

  getUnlocked(unlockedBy: string[]): ComponentDefinition[] {
    return this.getAll().filter(
      (def) => !def.unlockedBy || def.unlockedBy.some((req) => unlockedBy.includes(req))
    );
  }

  createComponent(id: string): RobotComponent {
    return this.factory.create(id);
  }
}

export const componentRegistry = new ComponentRegistry(
  robotComponentFactory
);
