import * as THREE from "three";

export interface RobotComponent {
  id: string;
  name: string;
  type: "sensor" | "actuator" | "body" | "power" | "weapon" | "special";
  mesh: THREE.Object3D;
  slots: string[];
  dependencies?: string[];
}

export interface IRobotComponentFactory {
  create(componentId: string): RobotComponent;
  createAll(componentIds: string[]): RobotComponent[];
  register(componentId: string, creator: () => RobotComponent): void;
  getAvailable(): string[];
}

export class RobotComponentFactory implements IRobotComponentFactory {
  private registry: Map<string, () => RobotComponent> = new Map();
  private createdComponents: Map<string, RobotComponent> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    this.register("ruedas_basicas", () => this.createWheelsBasic());
    this.register("helices_cuadruples", () => this.createPropellers());
    this.register("brazo_robotico", () => this.createRoboticArm());
    this.register("faro_led", () => this.createLEDHeadlight());
    this.register("sensor_ultrasonico", () => this.createUltrasonicSensor());
    this.register("canon_laser", () => this.createLaserCannon());
    this.register("escudo_energetico", () => this.createEnergyShield());
    this.register("turbo_compresor", () => this.createTurboCompressor());
    this.register("suspension_deportiva", () => this.createSportsSuspension());
    this.register("alerones_activos", () => this.createActiveWings());
    this.register("paracaidas", () => this.createParachute());
    this.register("propulsores_ionicos", () => this.createIonicPropellers());
    this.register("brazo_recolector", () => this.createCollectorArm());
    this.register("analizador_suelo", () => this.createGroundAnalyzer());
    this.register("taladro_percutor", () => this.createPercussionDrill());
    this.register("botas_velocidad", () => this.createSpeedBoots());
    this.register("faro_magico", () => this.createMagicLantern());
    this.register("llave_antigua", () => this.createAncientKey());
    this.register("espejo_vision", () => this.createVisionMirror());
    this.register("portal_teletransporte", () => this.createTeleportPortal());
    this.register("cristal_escarcha", () => this.createFrostCrystal());
  }

  create(componentId: string): RobotComponent {
    const existing = this.createdComponents.get(componentId);
    if (existing) return existing;

    const creator = this.registry.get(componentId);
    if (!creator) {
      throw new Error(`Component not registered: ${componentId}`);
    }

    const component = creator();
    this.createdComponents.set(componentId, component);
    return component;
  }

  createAll(componentIds: string[]): RobotComponent[] {
    return componentIds.map((id) => this.create(id));
  }

  register(componentId: string, creator: () => RobotComponent): void {
    this.registry.set(componentId, creator);
  }

  getAvailable(): string[] {
    return Array.from(this.registry.keys());
  }

  private createWheelsBasic(): RobotComponent {
    const group = new THREE.Group();
    const wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
    const wheelMat = new THREE.MeshStandardMaterial({
      color: "#1e293b",
      roughness: 0.9,
    });

    const positions = [
      [-1.2, -0.2, 1],
      [1.2, -0.2, 1],
      [-1.2, -0.2, -1],
      [1.2, -0.2, -1],
    ];

    positions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.rotation.z = Math.PI / 2;
      group.add(wheel);
    });

    return {
      id: "ruedas_basicas",
      name: "Ruedas Básicas",
      type: "actuator",
      mesh: group,
      slots: ["ps_movement"],
    };
  }

  private createPropellers(): RobotComponent {
    const group = new THREE.Group();
    const propArmGeo = new THREE.CylinderGeometry(0.1, 0.1, 2);
    const propMat = new THREE.MeshStandardMaterial({ color: "#94a3b8" });

    const arm1 = new THREE.Mesh(propArmGeo, propMat);
    arm1.position.y = 0.5;
    arm1.rotation.x = Math.PI / 2;
    arm1.rotation.y = Math.PI / 4;

    const arm2 = new THREE.Mesh(propArmGeo, propMat);
    arm2.position.y = 0.5;
    arm2.rotation.x = Math.PI / 2;
    arm2.rotation.y = -Math.PI / 4;

    group.add(arm1, arm2);

    const bladeGeo = new THREE.BoxGeometry(0.8, 0.05, 0.1);
    const bladeMat = new THREE.MeshStandardMaterial({ color: "#cbd5e1" });

    const propPositions = [
      [-1, 0.6, -1],
      [1, 0.6, -1],
      [-1, 0.6, 1],
      [1, 0.6, 1],
    ];

    propPositions.forEach((pos) => {
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.set(pos[0], pos[1], pos[2]);
      group.add(blade);
    });

    return {
      id: "helices_cuadruples",
      name: "Hélices Cuádruples",
      type: "power",
      mesh: group,
      slots: ["ps_propulsion"],
    };
  }

  private createRoboticArm(): RobotComponent {
    const group = new THREE.Group();
    const armMat = new THREE.MeshStandardMaterial({ color: "#94a3b8" });

    const armBaseGeo = new THREE.BoxGeometry(0.4, 0.4, 1);
    const armBase = new THREE.Mesh(armBaseGeo, armMat);
    armBase.position.set(0, 0.2, -1.8);
    group.add(armBase);

    const clawGeo = new THREE.BoxGeometry(0.8, 0.2, 0.4);
    const claw = new THREE.Mesh(clawGeo, armMat);
    claw.position.set(0, 0.2, -2.4);
    group.add(claw);

    return {
      id: "brazo_robotico",
      name: "Brazo Robótico",
      type: "actuator",
      mesh: group,
      slots: ["ps_manipulation"],
    };
  }

  private createLEDHeadlight(): RobotComponent {
    const group = new THREE.Group();
    const ledGeo = new THREE.BoxGeometry(0.8, 0.4, 0.2);
    const ledMat = new THREE.MeshStandardMaterial({
      color: "#fcd34d",
      emissive: "#fcd34d",
      emissiveIntensity: 0.8,
    });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0, 0.4, -1.6);
    group.add(led);

    return {
      id: "faro_led",
      name: "Faro LED",
      type: "sensor",
      mesh: group,
      slots: ["ps_light"],
    };
  }

  private createUltrasonicSensor(): RobotComponent {
    const group = new THREE.Group();
    const sonarGeo = new THREE.BoxGeometry(0.6, 0.3, 0.2);
    const sonarMat = new THREE.MeshStandardMaterial({ color: "#334155" });
    const sonar = new THREE.Mesh(sonarGeo, sonarMat);
    sonar.position.set(0, 0.8, -1.6);

    const eyeGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.1);
    eyeGeo.rotateX(Math.PI / 2);
    const eyeMat = new THREE.MeshStandardMaterial({ color: "#94a3b8" });

    const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
    eye1.position.set(-0.15, 0.8, -1.7);

    const eye2 = new THREE.Mesh(eyeGeo, eyeMat);
    eye2.position.set(0.15, 0.8, -1.7);

    group.add(sonar, eye1, eye2);

    return {
      id: "sensor_ultrasonico",
      name: "Sensor Ultrasónico",
      type: "sensor",
      mesh: group,
      slots: ["ps_sensor"],
    };
  }

  private createLaserCannon(): RobotComponent {
    const group = new THREE.Group();
    const cannonGeo = new THREE.CylinderGeometry(0.15, 0.2, 1.5, 8);
    const cannonMat = new THREE.MeshStandardMaterial({
      color: "#ef4444",
      emissive: "#ef4444",
      emissiveIntensity: 0.3,
    });
    const cannon = new THREE.Mesh(cannonGeo, cannonMat);
    cannon.rotation.x = Math.PI / 2;
    cannon.position.set(0, 0.3, -2);
    group.add(cannon);

    return {
      id: "canon_laser",
      name: "Cañón Láser",
      type: "weapon",
      mesh: group,
      slots: ["ps_weapon"],
    };
  }

  private createEnergyShield(): RobotComponent {
    const group = new THREE.Group();
    const shieldGeo = new THREE.SphereGeometry(1.5, 16, 16);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: "#3b82f6",
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.y = 0.5;
    group.add(shield);

    return {
      id: "escudo_energetico",
      name: "Escudo Energético",
      type: "body",
      mesh: group,
      slots: ["ps_defense"],
    };
  }

  private createTurboCompressor(): RobotComponent {
    const group = new THREE.Group();
    const turboGeo = new THREE.ConeGeometry(0.3, 0.8, 8);
    const turboMat = new THREE.MeshStandardMaterial({
      color: "#f97316",
      emissive: "#f97316",
      emissiveIntensity: 0.5,
    });
    const turbo = new THREE.Mesh(turboGeo, turboMat);
    turbo.rotation.x = -Math.PI / 2;
    turbo.position.set(0, 0.2, -1.5);
    group.add(turbo);

    return {
      id: "turbo_compresor",
      name: "Turbo Compresor",
      type: "power",
      mesh: group,
      slots: ["ps_turbo"],
    };
  }

  private createSportsSuspension(): RobotComponent {
    const group = new THREE.Group();
    const springGeo = new THREE.TorusGeometry(0.2, 0.05, 8, 16);
    const springMat = new THREE.MeshStandardMaterial({ color: "#22c55e" });

    const positions = [
      [-1, -0.3, 1],
      [1, -0.3, 1],
      [-1, -0.3, -1],
      [1, -0.3, -1],
    ];

    positions.forEach((pos) => {
      const spring = new THREE.Mesh(springGeo, springMat);
      spring.position.set(pos[0], pos[1], pos[2]);
      spring.rotation.y = Math.PI / 2;
      group.add(spring);
    });

    return {
      id: "suspension_deportiva",
      name: "Suspensión Deportiva",
      type: "actuator",
      mesh: group,
      slots: ["ps_suspension"],
    };
  }

  private createActiveWings(): RobotComponent {
    const group = new THREE.Group();
    const wingGeo = new THREE.BoxGeometry(1.5, 0.1, 0.5);
    const wingMat = new THREE.MeshStandardMaterial({ color: "#8b5cf6" });

    const wing1 = new THREE.Mesh(wingGeo, wingMat);
    wing1.position.set(-1.2, 0.5, -0.5);
    wing1.rotation.z = -0.2;
    group.add(wing1);

    const wing2 = new THREE.Mesh(wingGeo, wingMat);
    wing2.position.set(1.2, 0.5, -0.5);
    wing2.rotation.z = 0.2;
    group.add(wing2);

    return {
      id: "alerones_activos",
      name: "Alerones Activos",
      type: "body",
      mesh: group,
      slots: ["ps_aero"],
    };
  }

  private createParachute(): RobotComponent {
    const group = new THREE.Group();
    const chuteGeo = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const chuteMat = new THREE.MeshStandardMaterial({
      color: "#ec4899",
      side: THREE.DoubleSide,
    });
    const chute = new THREE.Mesh(chuteGeo, chuteMat);
    chute.position.y = 2;
    chute.scale.set(0.5, 0.5, 0.5);
    group.add(chute);

    return {
      id: "paracaidas",
      name: "Paracaídas de Frenado",
      type: "body",
      mesh: group,
      slots: ["ps_brake"],
    };
  }

  private createIonicPropellers(): RobotComponent {
    const group = new THREE.Group();
    const propGeo = new THREE.TorusGeometry(0.4, 0.1, 8, 16);
    const propMat = new THREE.MeshStandardMaterial({
      color: "#06b6d4",
      emissive: "#06b6d4",
      emissiveIntensity: 0.4,
    });

    const positions = [
      [-0.8, 0.3, -0.8],
      [0.8, 0.3, -0.8],
      [-0.8, 0.3, 0.8],
      [0.8, 0.3, 0.8],
    ];

    positions.forEach((pos) => {
      const prop = new THREE.Mesh(propGeo, propMat);
      prop.position.set(pos[0], pos[1], pos[2]);
      prop.rotation.x = Math.PI / 2;
      group.add(prop);
    });

    return {
      id: "propulsores_ionicos",
      name: "Propulsores Iónicos",
      type: "power",
      mesh: group,
      slots: ["ps_propulsion"],
    };
  }

  private createCollectorArm(): RobotComponent {
    const group = new THREE.Group();
    const armMat = new THREE.MeshStandardMaterial({ color: "#a3a3a3" });

    const armGeo = new THREE.BoxGeometry(0.2, 0.2, 1.2);
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(0, 0.2, -1.8);
    group.add(arm);

    const clawGeo = new THREE.BoxGeometry(0.4, 0.15, 0.3);
    const claw = new THREE.Mesh(clawGeo, armMat);
    claw.position.set(0, 0.2, -2.5);
    group.add(claw);

    return {
      id: "brazo_recolector",
      name: "Brazo Recolector",
      type: "actuator",
      mesh: group,
      slots: ["ps_collection"],
    };
  }

  private createGroundAnalyzer(): RobotComponent {
    const group = new THREE.Group();
    const analyzerGeo = new THREE.BoxGeometry(0.4, 0.3, 0.4);
    const analyzerMat = new THREE.MeshStandardMaterial({
      color: "#10b981",
      emissive: "#10b981",
      emissiveIntensity: 0.3,
    });
    const analyzer = new THREE.Mesh(analyzerGeo, analyzerMat);
    analyzer.position.set(0, 0.5, -1.5);
    group.add(analyzer);

    return {
      id: "analizador_suelo",
      name: "Analizador de Suelo",
      type: "sensor",
      mesh: group,
      slots: ["ps_analyzer"],
    };
  }

  private createPercussionDrill(): RobotComponent {
    const group = new THREE.Group();
    const drillGeo = new THREE.ConeGeometry(0.15, 1, 8);
    const drillMat = new THREE.MeshStandardMaterial({ color: "#dc2626" });
    const drill = new THREE.Mesh(drillGeo, drillMat);
    drill.rotation.x = Math.PI / 2;
    drill.position.set(0, 0.2, -2.2);
    group.add(drill);

    return {
      id: "taladro_percutor",
      name: "Taladro Percutor",
      type: "actuator",
      mesh: group,
      slots: ["ps_drill"],
    };
  }

  private createSpeedBoots(): RobotComponent {
    const group = new THREE.Group();
    const bootGeo = new THREE.BoxGeometry(0.4, 0.5, 0.6);
    const bootMat = new THREE.MeshStandardMaterial({ color: "#22c55e" });

    const boot1 = new THREE.Mesh(bootGeo, bootMat);
    boot1.position.set(-0.5, -0.3, 0);
    group.add(boot1);

    const boot2 = new THREE.Mesh(bootGeo, bootMat);
    boot2.position.set(0.5, -0.3, 0);
    group.add(boot2);

    return {
      id: "botas_velocidad",
      name: "Botas de Velocidad",
      type: "actuator",
      mesh: group,
      slots: ["ps_movement"],
    };
  }

  private createMagicLantern(): RobotComponent {
    const group = new THREE.Group();
    const lanternGeo = new THREE.CylinderGeometry(0.2, 0.3, 0.5, 8);
    const lanternMat = new THREE.MeshStandardMaterial({
      color: "#fbbf24",
      emissive: "#fbbf24",
      emissiveIntensity: 0.6,
    });
    const lantern = new THREE.Mesh(lanternGeo, lanternMat);
    lantern.position.set(0, 0.8, -1.5);
    group.add(lantern);

    return {
      id: "faro_magico",
      name: "Faro Mágico",
      type: "sensor",
      mesh: group,
      slots: ["ps_light"],
    };
  }

  private createAncientKey(): RobotComponent {
    const group = new THREE.Group();
    const keyGeo = new THREE.TorusGeometry(0.15, 0.03, 8, 16);
    const keyMat = new THREE.MeshStandardMaterial({ color: "#b45309" });
    const key = new THREE.Mesh(keyGeo, keyMat);
    key.position.set(0, 0.5, -1.8);
    group.add(key);

    const shaftGeo = new THREE.BoxGeometry(0.05, 0.4, 0.05);
    const shaft = new THREE.Mesh(shaftGeo, keyMat);
    shaft.position.set(0, 0.3, -1.8);
    group.add(shaft);

    return {
      id: "llave_antigua",
      name: "Llave Antigua",
      type: "weapon",
      mesh: group,
      slots: ["ps_key"],
    };
  }

  private createVisionMirror(): RobotComponent {
    const group = new THREE.Group();
    const mirrorGeo = new THREE.CircleGeometry(0.3, 16);
    const mirrorMat = new THREE.MeshStandardMaterial({
      color: "#e5e7eb",
      metalness: 0.9,
      roughness: 0.1,
    });
    const mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
    mirror.position.set(0, 0.8, -1.7);
    group.add(mirror);

    return {
      id: "espejo_vision",
      name: "Espejo de Visión",
      type: "sensor",
      mesh: group,
      slots: ["ps_vision"],
    };
  }

  private createTeleportPortal(): RobotComponent {
    const group = new THREE.Group();
    const portalGeo = new THREE.TorusGeometry(0.4, 0.08, 8, 32);
    const portalMat = new THREE.MeshStandardMaterial({
      color: "#8b5cf6",
      emissive: "#8b5cf6",
      emissiveIntensity: 0.5,
    });
    const portal = new THREE.Mesh(portalGeo, portalMat);
    portal.position.set(0, 0.5, -1.5);
    group.add(portal);

    return {
      id: "portal_teletransporte",
      name: "Portal de Teletransporte",
      type: "special",
      mesh: group,
      slots: ["ps_portal"],
    };
  }

  private createFrostCrystal(): RobotComponent {
    const group = new THREE.Group();
    const crystalGeo = new THREE.OctahedronGeometry(0.3);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: "#06b6d4",
      emissive: "#06b6d4",
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.8,
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.set(0, 0.5, -1.5);
    group.add(crystal);

    return {
      id: "cristal_escarcha",
      name: "Cristal de Escarcha",
      type: "weapon",
      mesh: group,
      slots: ["ps_ice"],
    };
  }
}

export const robotComponentFactory = new RobotComponentFactory();
