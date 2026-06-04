/* eslint-disable @typescript-eslint/no-explicit-any */
import * as THREE from "three";
import { MapControls } from "three/addons/controls/MapControls.js";
import { RaceBotBuilder } from "../shared/RaceBotBuilder";
import { ParticleSystem } from "../shared/ParticleSystem";
import type { ISimulatorEngine } from "../../ports/ISimulatorEngine";

export class RaceStageEngine implements ISimulatorEngine {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer!: THREE.WebGLRenderer;
  private botGroup: THREE.Group;
  private botParts: ReturnType<typeof RaceBotBuilder.create>;
  private ultrasonicCone: THREE.Mesh;
  private particles: ParticleSystem;
  private animationId: number | null = null;
  private clock: THREE.Clock;
  private controls!: MapControls;
  private isRunning = false;
  private checkpoints: { mesh: THREE.Mesh; passed: boolean }[] = [];

  constructor() {
    this.scene = new THREE.Scene();
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 35;
    this.camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2, (frustumSize * aspect) / 2,
      frustumSize / 2, frustumSize / -2, 0.1, 1000,
    );
    this.camera.position.set(30, 35, 30);
    this.camera.lookAt(0, 0, 0);
    this.clock = new THREE.Clock();
    this.setupLighting();
    this.botParts = RaceBotBuilder.create();
    this.botGroup = this.botParts.group;
    this.botGroup.position.set(-25, 0, 0);
    this.ultrasonicCone = this.createUltrasonicCone();
    this.botGroup.add(this.ultrasonicCone);
    this.scene.add(this.botGroup);
    this.particles = new ParticleSystem(this.scene);
    this.createEnvironment();
  }

  private setupLighting() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(10, 25, 10);
    dir.castShadow = true;
    this.scene.add(dir);
    const fill = new THREE.DirectionalLight(0x8888ff, 0.2);
    fill.position.set(-10, 10, -10);
    this.scene.add(fill);
  }

  private createUltrasonicCone(): THREE.Mesh {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(2, 5, 16),
      new THREE.MeshBasicMaterial({ color: "#f59e0b", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    cone.geometry.rotateX(Math.PI / 2);
    cone.position.set(0, 0, -3.5);
    return cone;
  }

  private createEnvironment() {
    // Track
    const trackMat = new THREE.MeshStandardMaterial({ color: "#2d3748", roughness: 0.9 });
    const track = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), trackMat);
    track.rotation.x = -Math.PI / 2;
    track.position.y = -0.5;
    track.receiveShadow = true;
    this.scene.add(track);

    const grid = new THREE.GridHelper(80, 80, "#f59e0b", "#4a5568");
    grid.name = "environment_grid";
    grid.position.y = -0.49;
    this.scene.add(grid);

    // Track barriers
    const barrierMat = new THREE.MeshStandardMaterial({ color: "#f59e0b", roughness: 0.5 });
    const barriers = [
      { x: 0, z: -18, w: 80, h: 1 },
      { x: 0, z: 18, w: 80, h: 1 },
      { x: -38, z: 0, w: 1, h: 36 },
      { x: 38, z: 0, w: 1, h: 36 },
    ];
    barriers.forEach((b) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, 0.8, b.h), barrierMat);
      mesh.position.set(b.x, 0, b.z);
      this.scene.add(mesh);
    });

    // Checkered start/finish line
    const checkMat = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.3, side: THREE.DoubleSide });
    const startLine = new THREE.Mesh(new THREE.PlaneGeometry(2, 30), checkMat);
    startLine.rotation.x = -Math.PI / 2;
    startLine.position.set(-30, -0.48, 0);
    this.scene.add(startLine);

    // Goal line (green)
    const goalMat = new THREE.MeshBasicMaterial({ color: "#34D399", transparent: true, opacity: 0.3, side: THREE.DoubleSide });
    const goal = new THREE.Mesh(new THREE.PlaneGeometry(2, 30), goalMat);
    goal.rotation.x = -Math.PI / 2;
    goal.position.set(30, -0.48, 0);
    this.scene.add(goal);

    // Checkpoints along the track
    const cpMat = new THREE.MeshBasicMaterial({ color: "#3b82f6", transparent: true, opacity: 0.2, side: THREE.DoubleSide });
    const cpPos = [{ x: 0, z: -16 }, { x: 25, z: 0 }, { x: 0, z: 16 }];
    cpPos.forEach((pos) => {
      const cp = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 24), cpMat);
      cp.rotation.x = -Math.PI / 2;
      cp.position.set(pos.x, -0.48, pos.z);
      this.scene.add(cp);
      this.checkpoints.push({ mesh: cp, passed: false });
    });

    // Cones
    const coneMat = new THREE.MeshStandardMaterial({ color: "#ef4444", emissive: "#ef4444", emissiveIntensity: 0.2 });
    for (let i = 0; i < 12; i++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 8), coneMat);
      const zOff = i % 2 === 0 ? 4 : -4;
      cone.position.set(-20 + i * 4, 0, zOff);
      this.scene.add(cone);
    }

    // Ramps
    const rampMat2 = new THREE.MeshStandardMaterial({ color: "#f59e0b", roughness: 0.6 });
    const rampPos = [
      { x: -10, z: -10, rot: 0.15 },
      { x: 10, z: 10, rot: -0.15 },
      { x: 20, z: -12, rot: 0.12 },
    ];
    rampPos.forEach((r) => {
      const ramp = new THREE.Mesh(new THREE.BoxGeometry(4, 0.5, 4), rampMat2);
      ramp.position.set(r.x, 0, r.z);
      ramp.rotation.z = r.rot;
      ramp.castShadow = true;
      this.scene.add(ramp);
    });

    // Grandstand
    const standMat = new THREE.MeshStandardMaterial({ color: "#1a202c", roughness: 0.7 });
    const stand = new THREE.Mesh(new THREE.BoxGeometry(15, 0.5, 4), standMat);
    stand.position.set(-29, 0.5, 14);
    this.scene.add(stand);
    const standCol = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), standMat);
    for (let i = -6; i <= 6; i += 1.5) {
      const c = standCol.clone();
      c.position.set(-29 + i, 0.8, 14);
      this.scene.add(c);
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
      "Ruedas de Carrera": this.botParts.wheels,
      "Turbo Compresor": this.botParts.turbo,
      "Suspensión Deportiva": this.botParts.suspension,
      "Alerones Activos": this.botParts.spoiler,
      "Sensor de Velocidad": this.botParts.sensor,
      "Paracaídas de Frenado": this.botParts.parachute,
    };
    const all = [this.botParts.wheels, this.botParts.turbo, this.botParts.suspension, this.botParts.spoiler, this.botParts.sensor, this.botParts.parachute];
    all.forEach((p) => { p.visible = false; });
    installedHardware.forEach((id) => {
      const part = parts[id];
      if (part) part.visible = true;
    });
  }

  updateTheme(colors: any) {
    const grid = this.scene.getObjectByName("environment_grid") as THREE.GridHelper;
    if (grid) {
      grid.material.color.set(colors.border);
      grid.material.opacity = 0.2;
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
    const frustumSize = 35;
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
      // Spin wheels when visible
      if (this.botParts.wheels.visible) {
        this.botParts.wheels.children.forEach((c) => {
          if (c instanceof THREE.Mesh && c.geometry.type === "TorusGeometry") {
            c.rotation.x += 0.05;
          }
        });
      }
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  async moveForward(distance: number, duration: number): Promise<void> {
    return this.animatePosition(distance, duration);
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
          resolve(Math.floor(Math.random() * 18) + 3);
        }
      };
      this.clock.getDelta();
      animate(0);
    });
  }

  async boost(speed: number, duration: number): Promise<void> {
    this.triggerParticles(this.botGroup.position.x, this.botGroup.position.z, "move");
    // Animate exhaust flames brighter
    if (this.botParts.turbo.visible) {
      this.botParts.turbo.children.forEach((c) => {
        if (c instanceof THREE.Mesh && c.geometry.type === "ConeGeometry") {
          const mat = c.material as THREE.MeshBasicMaterial;
          mat.opacity = 0.8;
          c.scale.set(1, 2, 1);
        }
      });
    }
    const fastDur = Math.max(200, duration / 2);
    await this.animatePosition(speed * 2.5, fastDur);
    // Reset exhaust
    if (this.botParts.turbo.visible) {
      this.botParts.turbo.children.forEach((c) => {
        if (c instanceof THREE.Mesh && c.geometry.type === "ConeGeometry") {
          const mat = c.material as THREE.MeshBasicMaterial;
          mat.opacity = 0.5;
          c.scale.set(1, 1, 1);
        }
      });
    }
  }

  async brake(duration: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, duration));
  }

  async jump(duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startY = this.botGroup.position.y;
      const peakY = 4;
      let elapsed = 0;
      const animate = (delta: number) => {
        elapsed += delta;
        const p = Math.min(elapsed / (duration / 1000), 1);
        if (p < 0.5) {
          this.botGroup.position.y = THREE.MathUtils.lerp(startY, peakY, p * 2);
        } else {
          this.botGroup.position.y = THREE.MathUtils.lerp(peakY, startY, (p - 0.5) * 2);
        }
        if (p < 1 && this.isRunning) {
          requestAnimationFrame(() => animate(this.clock.getDelta()));
        } else {
          this.botGroup.position.y = startY;
          this.triggerParticles(this.botGroup.position.x, this.botGroup.position.z, "success");
          resolve();
        }
      };
      this.clock.getDelta();
      animate(0);
    });
  }

  async dodge(duration: number): Promise<void> {
    const orig = this.botGroup.position.clone();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.botGroup.quaternion);
    const dodgePos = orig.clone().add(right.multiplyScalar(3));
    return new Promise((resolve) => {
      let elapsed = 0;
      const animate = (delta: number) => {
        elapsed += delta;
        const p = Math.min(elapsed / (duration / 1000), 1);
        if (p < 0.5) {
          this.botGroup.position.lerpVectors(orig, dodgePos, p * 2);
        } else {
          this.botGroup.position.lerpVectors(dodgePos, orig, (p - 0.5) * 2);
        }
        if (p < 1 && this.isRunning) {
          requestAnimationFrame(() => animate(this.clock.getDelta()));
        } else {
          this.botGroup.position.copy(orig);
          this.triggerParticles(orig.x, orig.z, "move");
          resolve();
        }
      };
      this.clock.getDelta();
      animate(0);
    });
  }

  async emergencyBrake(duration: number): Promise<void> {
    this.triggerParticles(this.botGroup.position.x, this.botGroup.position.z, "collision");
    if (this.botParts.parachute.visible) {
      const chute = this.botParts.parachute.children[0] as THREE.Mesh;
      if (chute?.material) {
        const mat = chute.material as THREE.MeshStandardMaterial;
        mat.color.setHex(0xef4444);
      }
    }
    return new Promise((resolve) => setTimeout(resolve, duration));
  }

  stop() {}

  reset() {
    this.botGroup.position.set(-25, 0, 0);
    this.botGroup.rotation.set(0, 0, 0);
    this.checkpoints.forEach((cp) => { cp.passed = false; });
  }

  private async animatePosition(distance: number, duration: number) {
    return new Promise<void>((resolve) => {
      const start = this.botGroup.position.clone();
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.botGroup.quaternion);
      const end = start.clone().add(dir.multiplyScalar(distance / 6));
      let elapsed = 0;
      const animate = (delta: number) => {
        elapsed += delta;
        const p = Math.min(elapsed / (duration / 1000), 1);
        const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        this.botGroup.position.lerpVectors(start, end, ease);
        if (p < 1 && this.isRunning) {
          requestAnimationFrame(() => animate(this.clock.getDelta()));
        } else resolve();
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
