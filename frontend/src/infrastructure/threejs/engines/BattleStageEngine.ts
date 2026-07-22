import * as THREE from "three";
import { MapControls } from "three/addons/controls/MapControls.js";
import { BattleBotBuilder } from "../shared/BattleBotBuilder";
import { ParticleSystem } from "../shared/ParticleSystem";
import { createSceneWithCamera, createShadowFloor, createGrid, createStarfield } from "../shared/SceneUtils";
import type { ISimulatorEngine } from "../../ports/ISimulatorEngine";

export class BattleStageEngine implements ISimulatorEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private botGroup: THREE.Group;
  private botParts: ReturnType<typeof BattleBotBuilder.create>;
  private ultrasonicCone: THREE.Mesh;
  private particles: ParticleSystem;
  private animationId: number | null = null;
  private clock: THREE.Clock;
  private controls!: MapControls;
  private isRunning = false;
  private enemies: THREE.Mesh[] = [];
  private score = 0;

  constructor() {
    const { scene, camera } = createSceneWithCamera({
      fov: 50,
      cameraPos: [20, 16, 20],
      fogColor: "#1a0a0a",
      fogNear: 30,
      fogFar: 90,
      bgColor: "#1a0a0a",
      ambientColor: "#443333",
      ambientIntensity: 0.35,
      skyColor: "#883333",
      groundColor: "#1a1020",
      hemiIntensity: 0.4,
      dirColor: "#ffccaa",
      dirIntensity: 1.3,
      dirPos: [15, 28, 15],
      shadowMapSize: 2048,
      shadowCameraSize: 35,
    });

    this.scene = scene;
    this.camera = camera;
    this.clock = new THREE.Clock();

    createShadowFloor(this.scene, 80, -0.5, "#1a1020");
    createGrid(this.scene, 80, 80, "#e94560", "#1a1020", -0.49);
    createStarfield(this.scene, 200, 70, 3, 25, "#ff6666", 0.1, 0.4);

    // Battle arena spotlight
    const spotLight = new THREE.SpotLight("#e94560", 2, 40, Math.PI / 6, 0.3, 1);
    spotLight.position.set(0, 15, 0);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    this.scene.add(spotLight);

    // Dynamic point lights for arena corners
    const cornerLights = [
      { pos: [-18, 4, -18], color: "#ff4444" },
      { pos: [18, 4, -18], color: "#ff8844" },
      { pos: [-18, 4, 18], color: "#ff4444" },
      { pos: [18, 4, 18], color: "#ff8844" },
    ];
    cornerLights.forEach(({ pos, color }) => {
      const light = new THREE.PointLight(color, 0.6, 20);
      light.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(light);
    });

    this.botParts = BattleBotBuilder.create();
    this.botGroup = this.botParts.group;
    this.ultrasonicCone = this.createUltrasonicCone();
    this.botGroup.add(this.ultrasonicCone);
    this.scene.add(this.botGroup);
    this.particles = new ParticleSystem(this.scene);
    this.createEnvironment();
  }

  private createUltrasonicCone(): THREE.Mesh {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(2, 5, 16),
      new THREE.MeshBasicMaterial({
        color: "#e94560",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    cone.geometry.rotateX(Math.PI / 2);
    cone.position.set(0, 0, -3.5);
    return cone;
  }

  private createEnvironment() {
    // Arena walls with neon trim
    const wallMat = new THREE.MeshStandardMaterial({
      color: "#16213e",
      roughness: 0.5,
      metalness: 0.4,
      emissive: "#0a0f1e",
      emissiveIntensity: 0.2,
    });
    const neonMat = new THREE.MeshStandardMaterial({
      color: "#e94560",
      emissive: "#e94560",
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });
    const wallConfigs = [
      { pos: [0, 2.5, -22], size: [50, 5, 1] },
      { pos: [0, 2.5, 22], size: [50, 5, 1] },
      { pos: [-25, 2.5, 0], size: [1, 5, 44] },
      { pos: [25, 2.5, 0], size: [1, 5, 44] },
    ];
    wallConfigs.forEach((w) => {
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(w.size[0], w.size[1], w.size[2]),
        wallMat,
      );
      wall.position.set(w.pos[0], w.pos[1], w.pos[2]);
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.scene.add(wall);

      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(w.size[0] - 1, 0.06, 0.12),
        neonMat,
      );
      strip.position.set(w.pos[0], w.pos[1] + 2.5, w.pos[2]);
      this.scene.add(strip);
    });

    // High-ground platforms
    const platMat = new THREE.MeshStandardMaterial({
      color: "#533483",
      roughness: 0.6,
      metalness: 0.3,
      emissive: "#2a1a4a",
      emissiveIntensity: 0.15,
    });
    const platPositions = [
      [-8, 0, -10],
      [8, 0, -8],
      [-5, 0, 8],
      [10, 0, 5],
    ];
    platPositions.forEach((pos) => {
      const plat = new THREE.Mesh(new THREE.BoxGeometry(4, 0.6, 4), platMat);
      plat.position.set(pos[0], pos[1], pos[2]);
      plat.castShadow = true;
      plat.receiveShadow = true;
      this.scene.add(plat);
    });

    // Enemies - now with more geometry detail
    const enemyMat = new THREE.MeshStandardMaterial({
      color: "#ff3333",
      emissive: "#ff3333",
      emissiveIntensity: 0.4,
      roughness: 0.4,
      metalness: 0.5,
    });
    const eyeMat = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      emissive: "#ffffff",
      emissiveIntensity: 1,
    });

    for (let i = 0; i < 4; i++) {
      const enemyBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 1.2), enemyMat);
      enemyBody.position.set(-12 + i * 7, 0.75, -12);
      enemyBody.castShadow = true;
      this.scene.add(enemyBody);

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), eyeMat);
      eye.position.set(-12 + i * 7, 1.1, -11.4);
      this.scene.add(eye);

      this.enemies.push(enemyBody);
    }

    // Cover obstacles
    const crateMat = new THREE.MeshStandardMaterial({
      color: "#e94560",
      roughness: 0.4,
      metalness: 0.5,
      emissive: "#4a1020",
      emissiveIntensity: 0.15,
    });
    for (let i = 0; i < 6; i++) {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), crateMat);
      crate.position.set(-6 + i * 2.5, 0.4, -4 + (i % 2 === 0 ? 3 : -3));
      crate.castShadow = true;
      crate.receiveShadow = true;
      this.scene.add(crate);
    }
  }

  init(canvas: HTMLCanvasElement) {
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
    this.renderer.toneMappingExposure = 1.15;

    this.controls = new MapControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 55;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.controls.target.set(0, 0.5, 0);
    this.controls.update();

    this.resize(canvas.clientWidth, canvas.clientHeight);
    this.startLoop();
  }

  updateHardware(installedHardware: string[]) {
    const parts: Record<string, THREE.Group> = {
      "Tracción Oruga": this.botParts.treads,
      "Cañón Láser": this.botParts.cannon,
      "Escudo Energético": this.botParts.shield,
      "Radar Táctico": this.botParts.radar,
      "Sensor Ultrasónico": this.botParts.sonar,
      "Hacha de Combate": this.botParts.hacha,
    };
    const all = [
      this.botParts.treads,
      this.botParts.cannon,
      this.botParts.shield,
      this.botParts.radar,
      this.botParts.sonar,
      this.botParts.hacha,
    ];
    all.forEach((p) => { p.visible = false; });
    installedHardware.forEach((id) => {
      const part = parts[id];
      if (part) part.visible = true;
    });
  }

  updateTheme(colors: Record<string, string>) {
    const grid = this.scene.getObjectByName("environment_grid") as THREE.GridHelper;
    if (grid) {
      (grid.material as THREE.Material).opacity = 0.2;
    }
    if (this.ultrasonicCone) {
      (this.ultrasonicCone.material as THREE.MeshBasicMaterial).color.set(
        colors.accent || colors.primary,
      );
    }
  }

  triggerParticles(
    x: number,
    z: number,
    type: "move" | "success" | "collision" | "scan" | "attack" | "magic",
  ) {
    this.particles.emit(x, z, type);
  }

  dispose() {
    this.isRunning = false;
    if (this.animationId !== null) cancelAnimationFrame(this.animationId);
    this.renderer.dispose();
    this.particles.dispose();
  }

  resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private startLoop() {
    this.isRunning = true;
    const animate = () => {
      if (!this.isRunning) return;
      this.animationId = requestAnimationFrame(animate);
      if (this.controls) this.controls.update();

      if (this.botParts.radar.visible) {
        const child = this.botParts.radar.children[1];
        if (child) {
          child.scale.setScalar(1 + Math.sin(Date.now() * 0.005) * 0.1);
        }
      }

      // Enemy hover animation
      this.enemies.forEach((e, i) => {
        e.position.y = 0.75 + Math.sin(Date.now() * 0.003 + i) * 0.1;
      });

      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  async moveForward(distance: number, duration: number): Promise<void> {
    return this.animatePosition(distance, duration, false);
  }

  async rotateCore(degrees: number, duration: number): Promise<void> {
    return this.animateRotation(degrees, duration);
  }

  async triggerUltrasonicSensor(duration: number): Promise<number> {
    return new Promise((resolve) => {
      let elapsed = 0;
      const animate = (delta: number) => {
        elapsed += delta;
        const p = Math.min(elapsed / (duration / 1000), 1);
        (this.ultrasonicCone.material as THREE.MeshBasicMaterial).opacity =
          p < 0.5 ? p * 1.6 : (1 - p) * 1.6;
        if (p < 1 && this.isRunning) {
          requestAnimationFrame(() => animate(this.clock.getDelta()));
        } else {
          (this.ultrasonicCone.material as THREE.MeshBasicMaterial).opacity = 0;
          resolve(Math.floor(Math.random() * 12) + 4);
        }
      };
      this.clock.getDelta();
      animate(0);
    });
  }

  async attack(_power: number, duration: number): Promise<void> {
    this.triggerParticles(this.botGroup.position.x, this.botGroup.position.z, "attack");
    if (this.botParts.cannon.visible) {
      const tip = this.botParts.cannon.children[2];
      if (tip) {
        const mat = (tip as THREE.Mesh).material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 2;
        setTimeout(() => { mat.emissiveIntensity = 0.4; }, 200);
      }
    }
    // Check hit on nearest enemy
    for (const enemy of this.enemies) {
      const dx = enemy.position.x - this.botGroup.position.x;
      const dz = enemy.position.z - this.botGroup.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 8 && this.botGroup.position.z < enemy.position.z) {
        this.triggerParticles(enemy.position.x, enemy.position.z, "collision");
        (enemy.material as THREE.MeshStandardMaterial).transparent = true;
        (enemy.material as THREE.MeshStandardMaterial).opacity = 0.5;
        (enemy.material as THREE.MeshStandardMaterial).emissive.set("#ffffff");
        (enemy.material as THREE.MeshStandardMaterial).emissiveIntensity = 1;
        this.score += 100;
      }
    }
    return new Promise((resolve) => setTimeout(resolve, duration));
  }

  async activateShield(duration: number): Promise<void> {
    const shield = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 20, 20),
      new THREE.MeshBasicMaterial({
        color: "#34D399",
        transparent: true,
        opacity: 0.35,
        wireframe: false,
        depthWrite: false,
      }),
    );
    shield.position.copy(this.botGroup.position);
    shield.position.y = 1;
    this.scene.add(shield);
    return new Promise((resolve) => {
      setTimeout(() => {
        this.scene.remove(shield);
        shield.geometry.dispose();
        (shield.material as THREE.Material).dispose();
        resolve();
      }, duration);
    });
  }

  async scan(duration: number): Promise<number> {
    this.triggerParticles(this.botGroup.position.x, this.botGroup.position.z, "scan");
    const count = this.enemies.filter((e) => {
      const mat = e.material as THREE.MeshStandardMaterial;
      return mat.opacity === undefined || mat.opacity > 0.5;
    }).length;
    return new Promise((resolve) => setTimeout(() => resolve(count), duration));
  }

  async strike(duration: number): Promise<void> {
    this.triggerParticles(this.botGroup.position.x, this.botGroup.position.z, "attack");
    if (this.botParts.hacha.visible) {
      const blade = this.botParts.hacha.children[1] as THREE.Mesh;
      const mat = blade.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.5;
      setTimeout(() => { mat.emissiveIntensity = 0; }, 200);
    }
    for (const enemy of this.enemies) {
      const dx = enemy.position.x - this.botGroup.position.x;
      const dz = enemy.position.z - this.botGroup.position.z;
      if (Math.sqrt(dx * dx + dz * dz) < 6) {
        this.triggerParticles(enemy.position.x, enemy.position.z, "collision");
        (enemy.material as THREE.MeshStandardMaterial).transparent = true;
        (enemy.material as THREE.MeshStandardMaterial).opacity = 0.5;
        this.score += 150;
      }
    }
    return new Promise((resolve) => setTimeout(resolve, duration));
  }

  stop() { }

  reset() {
    this.botGroup.position.set(0, 0, 0);
    this.botGroup.rotation.set(0, 0, 0);
    const enemyMat = new THREE.MeshStandardMaterial({
      color: "#ff3333",
      emissive: "#ff3333",
      emissiveIntensity: 0.4,
      roughness: 0.4,
      metalness: 0.5,
    });
    this.enemies.forEach((e) => {
      e.material = enemyMat;
    });
  }

  getState(): Record<string, unknown> {
    return { score: this.score };
  }

  private async animatePosition(distance: number, duration: number, _backward: boolean) {
    return new Promise<void>((resolve) => {
      const start = this.botGroup.position.clone();
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.botGroup.quaternion);
      const end = start.clone().add(dir.multiplyScalar(distance / 10));
      let elapsed = 0;
      const animate = (delta: number) => {
        elapsed += delta;
        const p = Math.min(elapsed / (duration / 1000), 1);
        const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        this.botGroup.position.lerpVectors(start, end, ease);
        if (p < 1 && this.isRunning) {
          requestAnimationFrame(() => animate(this.clock.getDelta()));
        } else {
          this.triggerParticles(end.x, end.z, "move");
          resolve();
        }
      };
      this.clock.getDelta();
      animate(0);
    });
  }

  private async animateRotation(degrees: number, duration: number) {
    return new Promise<void>((resolve) => {
      const start = this.botGroup.rotation.y;
      const end = start + (degrees * Math.PI) / 180;
      let elapsed = 0;
      const animate = (delta: number) => {
        elapsed += delta;
        const p = Math.min(elapsed / (duration / 1000), 1);
        const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        this.botGroup.rotation.y = THREE.MathUtils.lerp(start, end, ease);
        if (p < 1 && this.isRunning) {
          requestAnimationFrame(() => animate(this.clock.getDelta()));
        } else resolve();
      };
      this.clock.getDelta();
      animate(0);
    });
  }
}
