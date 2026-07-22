import * as THREE from "three";
import { MapControls } from "three/addons/controls/MapControls.js";
import type { ISimulatorEngine } from "../ports/ISimulatorEngine";
import { MathAnimationEngine } from "./animations/MathAnimationEngine";
import { robotComponentFactory, type RobotComponent } from "./factories/RobotComponentFactory";
import {
  createSceneWithCamera,
  createShadowFloor,
  createGrid,
  createStarfield,
  createGlowRing,
} from "./shared/SceneUtils";

export class BotStageEngine implements ISimulatorEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private botGroup: THREE.Group;
  private ultrasonicCone: THREE.Mesh;
  private coreGlow!: THREE.Mesh;

  private animationId: number | null = null;
  private clock: THREE.Clock;
  private controls!: MapControls;
  private starfield!: THREE.Points;

  private isRunning: boolean = false;
  private animationEngine: MathAnimationEngine;
  private installedComponents: Map<string, RobotComponent> = new Map();

  constructor() {
    const { scene, camera } = createSceneWithCamera({
      fov: 50,
      cameraPos: [18, 14, 18],
      fogColor: "#0a0f1e",
      fogNear: 35,
      fogFar: 90,
      bgColor: "#0a0f1e",
      ambientColor: "#4466aa",
      ambientIntensity: 0.3,
      skyColor: "#4466aa",
      groundColor: "#1a1030",
      hemiIntensity: 0.45,
      dirColor: "#c8d6ff",
      dirIntensity: 1.2,
      dirPos: [15, 28, 10],
      shadowMapSize: 2048,
      shadowCameraSize: 30,
    });

    this.scene = scene;
    this.camera = camera;
    this.clock = new THREE.Clock();
    this.animationEngine = new MathAnimationEngine();

    createShadowFloor(this.scene, 80, -0.5, "#111827");
    createGrid(this.scene, 80, 80, "#334155", "#1e293b", -0.49);
    this.starfield = createStarfield(this.scene, 350, 75, 3, 30, "#8899cc", 0.12, 0.6);

    this.createEnvironmentDecorations();
    this.botGroup = this.createDetailedBot();
    this.ultrasonicCone = this.createUltrasonicCone();
    this.botGroup.add(this.ultrasonicCone);
    this.scene.add(this.botGroup);
  }

  private createEnvironmentDecorations(): void {
    // Glowing border rings
    createGlowRing(this.scene, 0, -0.45, 0, 12, "#4f46e5", 0.25);
    createGlowRing(this.scene, 0, -0.45, 0, 18, "#3b82f6", 0.15);

    // Decorative pillars
    const pillarConfigs: [number, number, string][] = [
      [-8, -8, "#475569"],
      [8, -8, "#475569"],
      [-8, 8, "#475569"],
      [8, 8, "#475569"],
      [-12, 0, "#4f46e5"],
      [12, 0, "#4f46e5"],
      [0, -12, "#3b82f6"],
      [0, 12, "#3b82f6"],
    ];
    pillarConfigs.forEach(([x, z, color]) => {
      const geo = new THREE.CylinderGeometry(0.2, 0.3, 3, 8);
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.5,
        metalness: 0.6,
        emissive: color,
        emissiveIntensity: 0.2,
      });
      const pillar = new THREE.Mesh(geo, mat);
      pillar.position.set(x, 1, z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.scene.add(pillar);

      const capGeo = new THREE.SphereGeometry(0.25, 8, 8);
      const cap = new THREE.Mesh(capGeo, mat.clone());
      cap.position.set(x, 2.7, z);
      this.scene.add(cap);
    });

    // Floating crystal at center
    const crystalGeo = new THREE.OctahedronGeometry(0.6, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: "#818cf8",
      emissive: "#4f46e5",
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.3,
      transparent: true,
      opacity: 0.8,
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.set(0, 3.5, 0);
    crystal.name = "center_crystal";
    this.scene.add(crystal);

    const pointLight = new THREE.PointLight("#4f46e5", 0.6, 12);
    pointLight.position.copy(crystal.position);
    this.scene.add(pointLight);
  }

  private createDetailedBot(): THREE.Group {
    const group = new THREE.Group();
    const accentColor = "#4f46e5";
    const bodyColor = "#6366f1";
    const metalColor = "#94a3b8";

    // Main chassis - rounded box
    const chassisGeo = new THREE.BoxGeometry(2.2, 1.0, 3.0, 2, 2, 2);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.35,
      metalness: 0.55,
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.3;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    group.add(chassis);

    // Top armor plate
    const topPlateGeo = new THREE.BoxGeometry(1.6, 0.15, 2.2);
    const topPlateMat = new THREE.MeshStandardMaterial({
      color: accentColor,
      roughness: 0.25,
      metalness: 0.7,
      emissive: accentColor,
      emissiveIntensity: 0.15,
    });
    const topPlate = new THREE.Mesh(topPlateGeo, topPlateMat);
    topPlate.position.y = 0.88;
    topPlate.castShadow = true;
    group.add(topPlate);

    // Side panels
    for (let side = -1; side <= 1; side += 2) {
      const panelGeo = new THREE.BoxGeometry(0.15, 0.5, 2.2);
      const panelMat = new THREE.MeshStandardMaterial({
        color: metalColor,
        roughness: 0.4,
        metalness: 0.8,
      });
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(side * 1.18, 0.3, 0);
      panel.castShadow = true;
      group.add(panel);
    }

    // Wheels
    for (let side = -1; side <= 1; side += 2) {
      for (let zOff = -1; zOff <= 1; zOff += 2) {
        const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 16);
        const wheelMat = new THREE.MeshStandardMaterial({
          color: "#1e293b",
          roughness: 0.7,
          metalness: 0.3,
        });
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(side * 1.35, -0.1, zOff * 1.1);
        wheel.castShadow = true;
        group.add(wheel);

        const hubGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.22, 8);
        const hubMat = new THREE.MeshStandardMaterial({
          color: accentColor,
          roughness: 0.3,
          metalness: 0.6,
          emissive: accentColor,
          emissiveIntensity: 0.2,
        });
        const hub = new THREE.Mesh(hubGeo, hubMat);
        hub.rotation.z = Math.PI / 2;
        hub.position.copy(wheel.position);
        group.add(hub);
      }
    }

    // Head
    const headGeo = new THREE.BoxGeometry(1.0, 0.7, 0.6, 2, 2, 2);
    const headMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.3,
      metalness: 0.5,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.15, -0.6);
    head.castShadow = true;
    group.add(head);

    // Eyes / Visor
    const visorGeo = new THREE.BoxGeometry(0.7, 0.18, 0.08);
    const visorMat = new THREE.MeshStandardMaterial({
      color: "#00f5d4",
      emissive: "#00f5d4",
      emissiveIntensity: 0.7,
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.15, -0.93);
    group.add(visor);

    // Antenna
    const antennaGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6);
    const antennaMat = new THREE.MeshStandardMaterial({
      color: "#cbd5e1",
      roughness: 0.3,
      metalness: 0.5,
    });
    const antenna = new THREE.Mesh(antennaGeo, antennaMat);
    antenna.position.set(0.25, 1.55, -0.6);
    group.add(antenna);

    const antennaBallGeo = new THREE.SphereGeometry(0.07, 8, 8);
    const antennaBall = new THREE.Mesh(antennaBallGeo, visorMat.clone());
    antennaBall.position.set(0.25, 1.82, -0.6);
    group.add(antennaBall);

    // Power core on chest
    const coreGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.18, 16);
    const coreMat = new THREE.MeshStandardMaterial({
      color: "#00f5d4",
      emissive: "#00f5d4",
      emissiveIntensity: 0.6,
      roughness: 0.15,
      metalness: 0.2,
    });
    this.coreGlow = new THREE.Mesh(coreGeo, coreMat);
    this.coreGlow.position.set(0, 0.5, 1.45);
    this.coreGlow.name = "bot_core";
    group.add(this.coreGlow);

    // Exhaust ports (back)
    const exhaustMat = new THREE.MeshStandardMaterial({
      color: "#334155",
      roughness: 0.6,
      metalness: 0.7,
    });
    for (let side = -1; side <= 1; side += 2) {
      const exhaustGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.25, 8);
      const exhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
      exhaust.rotation.x = Math.PI / 2;
      exhaust.position.set(side * 0.5, 0.3, 1.65);
      group.add(exhaust);
    }

    return group;
  }

  private createUltrasonicCone(): THREE.Mesh {
    const coneGeo = new THREE.ConeGeometry(2, 5, 16);
    coneGeo.rotateX(Math.PI / 2);

    const coneMat = new THREE.MeshBasicMaterial({
      color: "#818cf8",
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(0, 0, -3.5);
    return cone;
  }

  public init(canvas: HTMLCanvasElement): void {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.controls = new MapControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 50;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.controls.target.set(0, 0.5, 0);
    this.controls.update();

    this.resize(canvas.clientWidth, canvas.clientHeight);
    this.startLoop();
  }

  public updateHardware(installedHardware: string[]): void {
    this.installedComponents.forEach((component, id) => {
      this.botGroup.remove(component.mesh);
      this.installedComponents.delete(id);
    });

    installedHardware.forEach((hardwareId) => {
      const componentMap: Record<string, string> = {
        "Ruedas Básicas": "ruedas_basicas",
        "Tracción Oruga": "ruedas_basicas",
        "Hélices Cuádruples": "helices_cuadruples",
        "Brazo Robótico": "brazo_robotico",
        "Sensor Ultrasónico": "sensor_ultrasonico",
        Lidar: "sensor_ultrasonico",
        "Faro LED": "faro_led",
        "Cañón Láser": "canon_laser",
        "Escudo Energético": "escudo_energetico",
        "Turbo Compresor": "turbo_compresor",
        "Suspensión Deportiva": "suspension_deportiva",
        "Alerones Activos": "alerones_activos",
        "Paracaídas de Frenado": "paracaidas",
        "Propulsores Iónicos": "propulsores_ionicos",
        "Brazo Recolector": "brazo_recolector",
        "Analizador de Suelo": "analizador_suelo",
        "Taladro Percutor": "taladro_percutor",
        "Botas de Velocidad": "botas_velocidad",
        "Faro Mágico": "faro_magico",
        "Llave Antigua": "llave_antigua",
        "Espejo de Visión": "espejo_vision",
        "Portal de Teletransporte": "portal_teletransporte",
        "Cristal de Escarcha": "cristal_escarcha",
        "Ruedas de Carrera": "ruedas_basicas",
        "Ruedas Lunares": "ruedas_basicas",
      };

      const componentId = componentMap[hardwareId];
      if (componentId) {
        try {
          const component = robotComponentFactory.create(componentId);
          component.mesh.visible = true;
          this.botGroup.add(component.mesh);
          this.installedComponents.set(componentId, component);
        } catch (e) {
          console.warn(`Failed to create component: ${componentId}`, e);
        }
      }
    });
  }

  public updateTheme(colors: Record<string, string>): void {
    const grid = this.scene.getObjectByName("environment_grid") as THREE.GridHelper;
    if (grid) {
      (grid.material as THREE.Material).opacity = 0.15;
    }

    if (this.coreGlow) {
      const mat = this.coreGlow.material as THREE.MeshStandardMaterial;
      if (colors.primary) {
        mat.color.set(colors.primary);
        mat.emissive.set(colors.primary);
      }
    }

    if (this.ultrasonicCone) {
      (this.ultrasonicCone.material as THREE.MeshBasicMaterial).color.set(
        colors.accent || colors.primary
      );
    }
  }

  public dispose(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    this.animationEngine.dispose();
    this.renderer.dispose();
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private startLoop(): void {
    this.isRunning = true;

    let idleTime = 0;
    const animate = () => {
      if (!this.isRunning) return;
      this.animationId = requestAnimationFrame(animate);
      this.animationEngine.update();

      idleTime += 0.016;

      // Idle animation: gentle hover
      if (this.botGroup) {
        const hoverY = Math.sin(idleTime * 1.5) * 0.08;
        this.botGroup.position.y += (hoverY - this.botGroup.position.y) * 0.1;

        // Subtle core pulse
        const pulse = 0.5 + Math.sin(idleTime * 2.5) * 0.15;
        (this.coreGlow.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
      }

      // Rotate center crystal
      const crystal = this.scene.getObjectByName("center_crystal");
      if (crystal) {
        crystal.rotation.y += 0.005;
        crystal.rotation.x += 0.002;
      }

      // Spin starfield slowly
      this.starfield.rotation.y += 0.0003;

      if (this.controls) this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  public async moveForward(distance: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startPos = this.botGroup.position.clone();
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
        this.botGroup.quaternion
      );
      const endPos = startPos
        .clone()
        .add(forward.multiplyScalar(distance / 10));

      // Spin wheels during movement
      const wheelSpin = () => {
        this.botGroup.children.forEach((child) => {
          if (child instanceof THREE.Mesh && child.geometry.type === "CylinderGeometry") {
            child.rotation.x += 0.3;
          }
        });
      };
      const spinInterval = setInterval(wheelSpin, 16);

      this.animationEngine.animateVector(
        this.botGroup,
        "position",
        startPos,
        endPos,
        {
          type: "quadratic",
          duration,
        },
        () => {
          clearInterval(spinInterval);
          resolve();
        }
      );
    });
  }

  public async rotateCore(degrees: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startRot = this.botGroup.rotation.y;
      const endRot = startRot + (degrees * Math.PI) / 180;

      this.animationEngine.animate(
        this.botGroup.rotation,
        "y",
        startRot,
        endRot,
        {
          type: "quadratic",
          duration,
        },
        resolve
      );
    });
  }

  public async triggerUltrasonicSensor(duration: number): Promise<number> {
    return new Promise((resolve) => {
      let elapsed = 0;

      const animatePulse = (delta: number) => {
        elapsed += delta;
        const totalDuration = duration / 1000;
        const progress = Math.min(elapsed / totalDuration, 1);

        if (progress < 0.5) {
          (this.ultrasonicCone.material as THREE.MeshBasicMaterial).opacity =
            progress * 1.6;
        } else {
          (this.ultrasonicCone.material as THREE.MeshBasicMaterial).opacity =
            (1 - progress) * 1.6;
        }

        if (progress < 1 && this.isRunning) {
          requestAnimationFrame(() => animatePulse(this.clock.getDelta()));
        } else {
          (this.ultrasonicCone.material as THREE.MeshBasicMaterial).opacity = 0;
          resolve(Math.floor(Math.random() * 15) + 5);
        }
      };

      this.clock.getDelta();
      animatePulse(0);
    });
  }

  public stop(): void {
    this.animationEngine.cancelAll();
  }

  public triggerParticles(
    _x: number,
    _z: number,
    _type: "move" | "success" | "collision" | "scan" | "attack" | "magic"
  ): void {
    const particleCount = 30;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = _x + (Math.random() - 0.5) * 2;
      positions[i * 3 + 1] = 0.5 + Math.random() * 2;
      positions[i * 3 + 2] = _z + (Math.random() - 0.5) * 2;

      const color = new THREE.Color();
      switch (_type) {
        case "success":
          color.setHex(0x00f5d4);
          break;
        case "collision":
          color.setHex(0xef4444);
          break;
        case "attack":
          color.setHex(0xf97316);
          break;
        case "magic":
          color.setHex(0xa78bfa);
          break;
        default:
          color.setHex(0x3b82f6);
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.25,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    let frame = 0;
    const maxFrames = 50;

    const animateParticles = () => {
      frame++;
      const progress = frame / maxFrames;

      const posAttr = particles.geometry.getAttribute("position");
      for (let i = 0; i < particleCount; i++) {
        const y = posAttr.getY(i);
        posAttr.setY(i, y + 0.06 * (1 - progress));
        posAttr.setX(i, posAttr.getX(i) + (Math.random() - 0.5) * 0.1);
        posAttr.setZ(i, posAttr.getZ(i) + (Math.random() - 0.5) * 0.1);
      }
      posAttr.needsUpdate = true;

      material.opacity = 1 - progress;

      if (frame < maxFrames) {
        requestAnimationFrame(animateParticles);
      } else {
        this.scene.remove(particles);
        geometry.dispose();
        material.dispose();
      }
    };

    animateParticles();
  }

  public reset(): void {
    this.botGroup.position.set(0, 0, 0);
    this.botGroup.rotation.set(0, 0, 0);
    this.animationEngine.cancelAll();
  }

  public async attack(_power: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const mat = this.coreGlow.material as THREE.MeshStandardMaterial;
      const originalIntensity = mat.emissiveIntensity;
      mat.emissiveIntensity = 2.5;
      mat.color.set("#ff6b6b");
      mat.emissive.set("#ff6b6b");

      setTimeout(() => {
        mat.emissiveIntensity = originalIntensity;
        mat.color.set("#00f5d4");
        mat.emissive.set("#00f5d4");
        resolve();
      }, duration);
    });
  }

  public async activateShield(duration: number): Promise<void> {
    return new Promise((resolve) => {
      const shieldGeo = new THREE.SphereGeometry(2.2, 24, 24);
      const shieldMat = new THREE.MeshBasicMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const shield = new THREE.Mesh(shieldGeo, shieldMat);
      shield.position.y = 0.5;
      this.botGroup.add(shield);

      let elapsed = 0;
      const halfDuration = duration / 2000;
      const fadeIn = (delta: number) => {
        elapsed += delta;
        const p = Math.min(elapsed / halfDuration, 1);
        shieldMat.opacity = p < 0.5 ? 0.6 * p * 2 : 0.6 * (1 - (p - 0.5) * 2);
        if (p < 1) {
          requestAnimationFrame(() => fadeIn(this.clock.getDelta()));
        } else {
          this.botGroup.remove(shield);
          shieldGeo.dispose();
          shieldMat.dispose();
          resolve();
        }
      };
      this.clock.getDelta();
      fadeIn(0);
    });
  }

  public async takeOff(altitude: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startPos = this.botGroup.position.clone();
      const endPos = new THREE.Vector3(startPos.x, altitude / 10, startPos.z);

      this.animationEngine.animateVector(
        this.botGroup,
        "position",
        startPos,
        endPos,
        { type: "elastic", duration },
        resolve
      );
    });
  }

  public async land(duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startPos = this.botGroup.position.clone();
      const endPos = new THREE.Vector3(startPos.x, 0, startPos.z);

      this.animationEngine.animateVector(
        this.botGroup,
        "position",
        startPos,
        endPos,
        { type: "bounce", duration },
        resolve
      );
    });
  }

  public async collect(duration: number): Promise<void> {
    this.triggerParticles(this.botGroup.position.x, this.botGroup.position.z, "success");
    return new Promise((resolve) => setTimeout(resolve, duration));
  }

  public async scan(duration: number): Promise<number> {
    return new Promise((resolve) => {
      this.triggerParticles(this.botGroup.position.x, this.botGroup.position.z, "scan");
      setTimeout(() => resolve(Math.floor(Math.random() * 100)), duration);
    });
  }
}
