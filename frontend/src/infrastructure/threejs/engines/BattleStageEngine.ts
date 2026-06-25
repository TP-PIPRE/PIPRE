import * as THREE from "three";
import { MapControls } from "three/addons/controls/MapControls.js";
import { BattleBotBuilder } from "../shared/BattleBotBuilder";
import { ParticleSystem } from "../shared/ParticleSystem";
import type { ISimulatorEngine } from "../../ports/ISimulatorEngine";

export class BattleStageEngine implements ISimulatorEngine {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
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
    this.scene = new THREE.Scene();
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 25;
    this.camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2, (frustumSize * aspect) / 2,
      frustumSize / 2, frustumSize / -2, 0.1, 1000,
    );
    this.camera.position.set(22, 22, 22);
    this.camera.lookAt(0, 0, 0);
    this.clock = new THREE.Clock();
    this.setupLighting();
    this.botParts = BattleBotBuilder.create();
    this.botGroup = this.botParts.group;
    this.ultrasonicCone = this.createUltrasonicCone();
    this.botGroup.add(this.ultrasonicCone);
    this.scene.add(this.botGroup);
    this.particles = new ParticleSystem(this.scene);
    this.createEnvironment();
  }

  private setupLighting() {
    this.scene.add(new THREE.AmbientLight(0xffeedd, 0.4));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(15, 25, 15);
    dirLight.castShadow = true;
    this.scene.add(dirLight);
    const fill = new THREE.DirectionalLight(0x8888ff, 0.3);
    fill.position.set(-10, 10, -10);
    this.scene.add(fill);
  }

  private createUltrasonicCone(): THREE.Mesh {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(2, 5, 16),
      new THREE.MeshBasicMaterial({ color: "#e94560", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    cone.geometry.rotateX(Math.PI / 2);
    cone.position.set(0, 0, -3.5);
    return cone;
  }

  private createEnvironment() {
    // Arena floor
    const floorMat = new THREE.MeshStandardMaterial({ color: "#1a1a2e", roughness: 0.9 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Grid
    const grid = new THREE.GridHelper(80, 80, "#e94560", "#16213e");
    grid.name = "environment_grid";
    grid.position.y = -0.49;
    this.scene.add(grid);

    // Arena walls with neon trim
    const wallMat = new THREE.MeshStandardMaterial({ color: "#0f3460", roughness: 0.6 });
    const neonMat = new THREE.MeshBasicMaterial({ color: "#e94560" });
    const wallConfigs = [
      { pos: [0, 2.5, -20], size: [50, 5, 1] },
      { pos: [0, 2.5, 20], size: [50, 5, 1] },
      { pos: [-22, 2.5, 0], size: [1, 5, 40] },
      { pos: [22, 2.5, 0], size: [1, 5, 40] },
    ];
    wallConfigs.forEach((w) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w.size[0], w.size[1], w.size[2]), wallMat);
      wall.position.set(w.pos[0], w.pos[1], w.pos[2]);
      this.scene.add(wall);
      // Neon strip
      const strip = new THREE.Mesh(new THREE.BoxGeometry(w.size[0] - 1, 0.05, 0.1), neonMat);
      strip.position.set(w.pos[0], w.pos[1] + 2.5, w.pos[2]);
      this.scene.add(strip);
    });

    // High-ground platforms
    const platMat = new THREE.MeshStandardMaterial({ color: "#533483", roughness: 0.7 });
    const platPositions = [[-8, -0.2, -10], [8, -0.2, -8], [-5, -0.2, 8], [10, -0.2, 5]];
    platPositions.forEach((pos) => {
      const plat = new THREE.Mesh(new THREE.BoxGeometry(4, 0.6, 4), platMat);
      plat.position.set(pos[0], pos[1], pos[2]);
      plat.castShadow = true;
      plat.receiveShadow = true;
      this.scene.add(plat);
    });

    // Enemies (red glowing bots)
    const enemyMat = new THREE.MeshStandardMaterial({ color: "#ff3333", emissive: "#ff3333", emissiveIntensity: 0.3 });
    for (let i = 0; i < 4; i++) {
      const enemy = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 1.2), enemyMat);
      enemy.position.set(-12 + i * 7, 0.25, -12);
      enemy.castShadow = true;
      this.scene.add(enemy);
      this.enemies.push(enemy);
    }

    // Cover obstacles (barrels/crates)
    const crateMat = new THREE.MeshStandardMaterial({ color: "#e94560", roughness: 0.5 });
    for (let i = 0; i < 6; i++) {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), crateMat);
      crate.position.set(-6 + i * 2.5, 0, -4 + (i % 2 === 0 ? 3 : -3));
      crate.castShadow = true;
      this.scene.add(crate);
    }
  }

  init(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.controls = new MapControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minZoom = 0.5;
    this.controls.maxZoom = 4;
    this.controls.maxPolarAngle = Math.PI / 2;
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
    const all = [this.botParts.treads, this.botParts.cannon, this.botParts.shield, this.botParts.radar, this.botParts.sonar, this.botParts.hacha];
    all.forEach((p) => { p.visible = false; });
    installedHardware.forEach((id) => {
      const part = parts[id];
      if (part) part.visible = true;
    });
  }

  updateTheme(colors: Record<string, string>) {
    const grid = this.scene.getObjectByName("environment_grid") as THREE.GridHelper;
    if (grid) {
      grid.material.color.set(colors.border);
      grid.material.opacity = 0.25;
      grid.material.transparent = true;
    }
    if (this.ultrasonicCone) {
      (this.ultrasonicCone.material as THREE.MeshBasicMaterial).color.set(colors.accent || colors.primary);
    }
  }

  triggerParticles(x: number, z: number, type: "move" | "success" | "collision" | "scan" | "attack" | "magic") {
    this.particles.emit(x, z, type);
  }

  dispose() {
    this.isRunning = false;
    if (this.animationId !== null) cancelAnimationFrame(this.animationId);
    this.renderer.dispose();
    this.particles.dispose();
  }

  resize(width: number, height: number) {
    const aspect = width / height;
    const frustumSize = 25;
    this.camera.left = (frustumSize * aspect) / -2;
    this.camera.right = (frustumSize * aspect) / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = frustumSize / -2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private startLoop() {
    this.isRunning = true;
    const animate = () => {
      if (!this.isRunning) return;
      this.animationId = requestAnimationFrame(animate);
      if (this.controls) this.controls.update();
      // Pulsing radar dish
      if (this.botParts.radar.visible) {
        const child = this.botParts.radar.children[1];
        if (child) {
          child.scale.setScalar(1 + Math.sin(Date.now() * 0.005) * 0.1);
        }
      }
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
        (this.ultrasonicCone.material as THREE.MeshBasicMaterial).opacity = p < 0.5 ? p * 1.6 : (1 - p) * 1.6;
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
    // Flash cannon
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
        enemy.material = new THREE.MeshStandardMaterial({ color: "#ffcccc", transparent: true, opacity: 0.5 });
        this.score += 100;
      }
    }
    return new Promise((resolve) => setTimeout(resolve, duration));
  }

  async activateShield(duration: number): Promise<void> {
    const shield = new THREE.Mesh(
      new THREE.SphereGeometry(2, 16, 16),
      new THREE.MeshBasicMaterial({ color: "#34D399", transparent: true, opacity: 0.3, wireframe: true }),
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
    const count = this.enemies.filter((e) => e.visible).length;
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
        enemy.material = new THREE.MeshStandardMaterial({ color: "#ffcccc", transparent: true, opacity: 0.5 });
        this.score += 150;
      }
    }
    return new Promise((resolve) => setTimeout(resolve, duration));
  }

  stop() {}

  reset() {
    this.botGroup.position.set(0, 0, 0);
    this.botGroup.rotation.set(0, 0, 0);
    // Restore enemies
    const enemyMat = new THREE.MeshStandardMaterial({ color: "#ff3333", emissive: "#ff3333", emissiveIntensity: 0.3 });
    this.enemies.forEach((e) => { e.material = enemyMat; });
  }

  private async animatePosition(distance: number, duration: number, backward: boolean) {
    return new Promise<void>((resolve) => {
      const start = this.botGroup.position.clone();
      const dir = new THREE.Vector3(0, 0, backward ? 1 : -1).applyQuaternion(this.botGroup.quaternion);
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
