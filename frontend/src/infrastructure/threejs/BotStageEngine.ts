import * as THREE from "three";
import { MapControls } from "three/addons/controls/MapControls.js";
import type { ISimulatorEngine } from "../ports/ISimulatorEngine";
import { MathAnimationEngine } from "./animations/MathAnimationEngine";
import { robotComponentFactory, type RobotComponent } from "./factories/RobotComponentFactory";

export class BotStageEngine implements ISimulatorEngine {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer!: THREE.WebGLRenderer;
  private botGroup: THREE.Group;
  private ultrasonicCone: THREE.Mesh;

  private animationId: number | null = null;
  private clock: THREE.Clock;
  private controls!: MapControls;

  private isRunning: boolean = false;
  private animationEngine: MathAnimationEngine;
  private installedComponents: Map<string, RobotComponent> = new Map();

  constructor() {
    this.scene = new THREE.Scene();
    this.animationEngine = new MathAnimationEngine();

    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 20;
    this.camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );
    this.camera.position.set(20, 20, 20);
    this.camera.lookAt(0, 0, 0);

    this.clock = new THREE.Clock();

    this.setupLighting();
    this.botGroup = this.createBot();
    this.ultrasonicCone = this.createUltrasonicCone();
    this.botGroup.add(this.ultrasonicCone);
    this.scene.add(this.botGroup);

    this.createEnvironment();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x00f5d4, 0.5, 50);
    pointLight.position.set(0, 10, 0);
    this.scene.add(pointLight);
  }

  private createBot(): THREE.Group {
    const group = new THREE.Group();

    const chassisGeo = new THREE.BoxGeometry(2, 1, 3);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: "#cbd5e1",
      roughness: 0.4,
      metalness: 0.6,
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    group.add(chassis);

    const coreGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16);
    const coreMat = new THREE.MeshStandardMaterial({
      color: "#00f5d4",
      emissive: "#00f5d4",
      emissiveIntensity: 0.5,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(0, 0.6, 0);
    core.name = "bot_core";
    group.add(core);

    return group;
  }

  private createUltrasonicCone(): THREE.Mesh {
    const coneGeo = new THREE.ConeGeometry(2, 5, 16);
    coneGeo.rotateX(Math.PI / 2);

    const coneMat = new THREE.MeshBasicMaterial({
      color: "#9b5de5",
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(0, 0, -3.5);
    return cone;
  }

  private createEnvironment(): void {
    const floorGeo = new THREE.PlaneGeometry(100, 100);
    const floorMat = new THREE.MeshStandardMaterial({
      color: "#0f172a",
      roughness: 0.8,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.name = "environment_floor";
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    floor.visible = false;
    this.scene.add(floor);

    const gridHelper = new THREE.GridHelper(100, 100, "#334155", "#1e293b");
    gridHelper.name = "environment_grid";
    gridHelper.position.y = -0.49;
    this.scene.add(gridHelper);

    const envGroup = new THREE.Group();

    const wallMat = new THREE.MeshStandardMaterial({
      color: "#475569",
      roughness: 0.7,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: "#f59e0b",
      roughness: 0.5,
    });

    const rockGeo = new THREE.BoxGeometry(2, 2, 2);
    const rock = new THREE.Mesh(rockGeo, accentMat);
    rock.position.set(0, 0.5, -15);
    rock.castShadow = true;
    rock.receiveShadow = true;
    envGroup.add(rock);

    const wallGeo = new THREE.BoxGeometry(20, 5, 2);
    const wallLeft = new THREE.Mesh(wallGeo, wallMat);
    wallLeft.position.set(-5, 2, -25);
    wallLeft.rotation.y = Math.PI / 2;
    const wallRight = new THREE.Mesh(wallGeo, wallMat);
    wallRight.position.set(5, 2, -25);
    wallRight.rotation.y = Math.PI / 2;

    const wallEndGeo = new THREE.BoxGeometry(12, 5, 2);
    const wallEnd = new THREE.Mesh(wallEndGeo, wallMat);
    wallEnd.position.set(0, 2, -35);
    envGroup.add(wallLeft, wallRight, wallEnd);

    const craterGeo = new THREE.CylinderGeometry(8, 8, 0.1, 32);
    const craterMat = new THREE.MeshBasicMaterial({ color: "#000000" });
    const crater = new THREE.Mesh(craterGeo, craterMat);
    crater.position.set(20, -0.48, -10);
    envGroup.add(crater);

    const platGeo = new THREE.BoxGeometry(10, 6, 10);
    const plat = new THREE.Mesh(platGeo, wallMat);
    plat.position.set(35, 2.5, -10);
    plat.receiveShadow = true;
    plat.castShadow = true;

    const padGeo = new THREE.PlaneGeometry(6, 6);
    const padMat = new THREE.MeshBasicMaterial({ color: "#38bdf8" });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(35, 5.51, -10);
    envGroup.add(plat, pad);

    this.scene.add(envGroup);
  }

  public init(canvas: HTMLCanvasElement): void {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.controls = new MapControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minZoom = 0.5;
    this.controls.maxZoom = 4;
    this.controls.maxPolarAngle = Math.PI / 2;

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
      grid.material.color.set(colors.border);
      grid.material.opacity = 0.2;
      grid.material.transparent = true;
    }

    const core = this.botGroup.getObjectByName("bot_core") as THREE.Mesh;
    if (core) {
      const mat = core.material as THREE.MeshStandardMaterial;
      mat.color.set(colors.primary);
      mat.emissive.set(colors.primary);
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
    const aspect = width / height;
    const frustumSize = 20;
    this.camera.left = (frustumSize * aspect) / -2;
    this.camera.right = (frustumSize * aspect) / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = frustumSize / -2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private startLoop(): void {
    this.isRunning = true;
    const animate = () => {
      if (!this.isRunning) return;
      this.animationId = requestAnimationFrame(animate);
      this.animationEngine.update();
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

      this.animationEngine.animateVector(
        this.botGroup,
        "position",
        startPos,
        endPos,
        {
          type: "quadratic",
          duration,
        },
        resolve
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
    this.isRunning = false;
    this.animationEngine.cancelAll();
  }

  public triggerParticles(
    _x: number,
    _z: number,
    _type: "move" | "success" | "collision" | "scan" | "attack" | "magic"
  ): void {
    const particleCount = 20;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = _x + (Math.random() - 0.5) * 2;
      positions[i * 3 + 1] = 0.5;
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
          color.setHex(0x9b5de5);
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
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    let frame = 0;
    const maxFrames = 60;

    const animateParticles = () => {
      frame++;
      const progress = frame / maxFrames;

      const posAttr = particles.geometry.getAttribute("position");
      for (let i = 0; i < particleCount; i++) {
        const y = posAttr.getY(i);
        posAttr.setY(i, y + 0.05 * (1 - progress));
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
      const core = this.botGroup.getObjectByName("bot_core") as THREE.Mesh;
      if (core) {
        const mat = core.material as THREE.MeshStandardMaterial;
        const originalIntensity = mat.emissiveIntensity;
        mat.emissiveIntensity = 2;

        this.animationEngine.animate(
          mat,
          "emissiveIntensity",
          2,
          originalIntensity,
          {
            type: "quadratic",
            duration,
          },
          () => {
            mat.emissiveIntensity = originalIntensity;
            resolve();
          }
        );
      } else {
        resolve();
      }
    });
  }

  public async activateShield(duration: number): Promise<void> {
    return new Promise((resolve) => {
      const shieldGeo = new THREE.SphereGeometry(2, 16, 16);
      const shieldMat = new THREE.MeshBasicMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      });
      const shield = new THREE.Mesh(shieldGeo, shieldMat);
      shield.position.y = 0.5;
      this.botGroup.add(shield);

      this.animationEngine.animate(shieldMat, "opacity", 0, 0.4, {
        type: "quadratic",
        duration: duration / 2,
      });

      setTimeout(() => {
        this.animationEngine.animate(shieldMat, "opacity", 0.4, 0, {
          type: "quadratic",
          duration: duration / 2,
        });

        setTimeout(() => {
          this.botGroup.remove(shield);
          shieldGeo.dispose();
          shieldMat.dispose();
          resolve();
        }, duration / 2);
      }, duration / 2);
    });
  }

  public async takeOff(altitude: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startPos = this.botGroup.position.clone();
      const endPos = new THREE.Vector3(
        startPos.x,
        altitude / 10,
        startPos.z
      );

      this.animationEngine.animateVector(
        this.botGroup,
        "position",
        startPos,
        endPos,
        {
          type: "elastic",
          duration,
        },
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
        {
          type: "bounce",
          duration,
        },
        resolve
      );
    });
  }

  public async collect(duration: number): Promise<void> {
    return new Promise((resolve) => {
      this.triggerParticles(
        this.botGroup.position.x,
        this.botGroup.position.z,
        "success"
      );
      setTimeout(resolve, duration);
    });
  }

  public async scan(duration: number): Promise<number> {
    return new Promise((resolve) => {
      this.triggerParticles(
        this.botGroup.position.x,
        this.botGroup.position.z,
        "scan"
      );
      setTimeout(() => resolve(Math.floor(Math.random() * 100)), duration);
    });
  }
}
