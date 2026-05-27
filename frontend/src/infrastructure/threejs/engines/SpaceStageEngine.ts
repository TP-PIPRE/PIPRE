/* eslint-disable @typescript-eslint/no-explicit-any */
import * as THREE from "three";
import { MapControls } from "three/addons/controls/MapControls.js";
import { SpaceBotBuilder } from "../shared/SpaceBotBuilder";
import { ParticleSystem } from "../shared/ParticleSystem";
import type { ISimulatorEngine } from "../../ports/ISimulatorEngine";

export class SpaceStageEngine implements ISimulatorEngine {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer!: THREE.WebGLRenderer;
  private botGroup: THREE.Group;
  private botParts: ReturnType<typeof SpaceBotBuilder.create>;
  private ultrasonicCone: THREE.Mesh;
  private particles: ParticleSystem;
  private animationId: number | null = null;
  private clock: THREE.Clock;
  private controls!: MapControls;
  private isRunning = false;
  private collectedSamples = 0;
  private sampleMeshes: THREE.Mesh[] = [];

  constructor() {
    this.scene = new THREE.Scene();
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 30;
    this.camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2, (frustumSize * aspect) / 2,
      frustumSize / 2, frustumSize / -2, 0.1, 1000,
    );
    this.camera.position.set(28, 28, 28);
    this.camera.lookAt(0, 0, 0);
    this.clock = new THREE.Clock();
    this.setupLighting();
    this.botParts = SpaceBotBuilder.create();
    this.botGroup = this.botParts.group;
    this.ultrasonicCone = this.createUltrasonicCone();
    this.botGroup.add(this.ultrasonicCone);
    this.scene.add(this.botGroup);
    this.particles = new ParticleSystem(this.scene);
    this.createEnvironment();
  }

  private setupLighting() {
    this.scene.add(new THREE.AmbientLight(0x222244, 0.4));
    const dir = new THREE.DirectionalLight(0x8888ff, 0.7);
    dir.position.set(10, 30, 10);
    this.scene.add(dir);
    const sun = new THREE.PointLight(0xffaa44, 0.8, 60);
    sun.position.set(0, 25, 0);
    this.scene.add(sun);
  }

  private createUltrasonicCone(): THREE.Mesh {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(2, 5, 16),
      new THREE.MeshBasicMaterial({ color: "#3b82f6", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    cone.geometry.rotateX(Math.PI / 2);
    cone.position.set(0, 0, -3.5);
    return cone;
  }

  private createEnvironment() {
    // Martian terrain
    const terrainMat = new THREE.MeshStandardMaterial({ color: "#2d1b4e", roughness: 1, metalness: 0 });
    const terrain = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), terrainMat);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -0.5;
    terrain.receiveShadow = true;
    this.scene.add(terrain);

    const grid = new THREE.GridHelper(80, 80, "#6b4fa3", "#3d266b");
    grid.name = "environment_grid";
    grid.position.y = -0.49;
    this.scene.add(grid);

    // Craters
    const craterMat = new THREE.MeshStandardMaterial({ color: "#1a0f2e", roughness: 1 });
    const craterPos = [[-10, -0.48, -14], [10, -0.48, -10], [-6, -0.48, 12], [14, -0.48, 6], [0, -0.48, -6]];
    craterPos.forEach((pos) => {
      const c = new THREE.Mesh(new THREE.CircleGeometry(2 + Math.random() * 2, 24), craterMat);
      c.rotation.x = -Math.PI / 2;
      c.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(c);
    });

    // Rocks
    const rockMat = new THREE.MeshStandardMaterial({ color: "#6b4fa3", roughness: 0.9 });
    for (let i = 0; i < 8; i++) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.6), rockMat);
      rock.position.set(-14 + i * 4, 0, -6 + (i % 2 === 0 ? 2 : -2));
      rock.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      rock.castShadow = true;
      this.scene.add(rock);
    }

    // Collectable samples (glowing crystals)
    const sampleMat = new THREE.MeshStandardMaterial({ color: "#3b82f6", emissive: "#3b82f6", emissiveIntensity: 0.5 });
    const samplePos = [[-5, 0, -8], [7, 0, -12], [-3, 0, 5], [12, 0, 0], [-8, 0, 10]];
    samplePos.forEach((pos) => {
      const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), sampleMat);
      s.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(s);
      this.sampleMeshes.push(s);
    });

    // Landing pad
    const padMat = new THREE.MeshBasicMaterial({ color: "#38bdf8", transparent: true, opacity: 0.3, side: THREE.DoubleSide });
    const pad = new THREE.Mesh(new THREE.RingGeometry(2.5, 3.5, 32), padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(12, -0.48, -16);
    this.scene.add(pad);
    // Landing beacon
    const beaconMat = new THREE.MeshStandardMaterial({ color: "#38bdf8", emissive: "#38bdf8", emissiveIntensity: 0.5 });
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 0.5, 8), beaconMat);
    beacon.position.set(12, 0.25, -16);
    this.scene.add(beacon);

    // Stars background particles
    const starsGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 200;
      starPos[i * 3 + 1] = Math.random() * 50 + 5;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starsMat = new THREE.PointsMaterial({ color: "#ffffff", size: 0.1, transparent: true, opacity: 0.6 });
    const stars = new THREE.Points(starsGeo, starsMat);
    this.scene.add(stars);
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
      "Ruedas Lunares": this.botParts.wheels,
      "Propulsores Iónicos": this.botParts.propellers,
      "Brazo Recolector": this.botParts.arm,
      "Analizador de Suelo": this.botParts.analyzer,
      "Sensor Ultrasónico": this.botParts.sonar,
      "Taladro Percutor": this.botParts.drill,
    };
    const all = [this.botParts.wheels, this.botParts.propellers, this.botParts.arm, this.botParts.analyzer, this.botParts.sonar, this.botParts.drill];
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
    const frustumSize = 30;
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
      // Spin propellers
      if (this.botParts.propellers.visible) {
        this.botParts.propellers.children.forEach((c) => {
          if (c instanceof THREE.Mesh && c.geometry.type === "BoxGeometry") {
            c.rotation.y += 0.1;
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
          resolve(Math.floor(Math.random() * 15) + 5);
        }
      };
      this.clock.getDelta();
      animate(0);
    });
  }

  async takeOff(altitude: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startY = this.botGroup.position.y;
      const endY = startY + altitude / 15;
      let elapsed = 0;
      const animate = (delta: number) => {
        elapsed += delta;
        const p = Math.min(elapsed / (duration / 1000), 1);
        const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        this.botGroup.position.y = THREE.MathUtils.lerp(startY, endY, ease);
        if (p < 1 && this.isRunning) {
          requestAnimationFrame(() => animate(this.clock.getDelta()));
        } else {
          this.triggerParticles(this.botGroup.position.x, this.botGroup.position.z, "move");
          resolve();
        }
      };
      this.clock.getDelta();
      animate(0);
    });
  }

  async land(duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startY = this.botGroup.position.y;
      const endY = 0;
      let elapsed = 0;
      const animate = (delta: number) => {
        elapsed += delta;
        const p = Math.min(elapsed / (duration / 1000), 1);
        const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        this.botGroup.position.y = THREE.MathUtils.lerp(startY, endY, ease);
        if (p < 1 && this.isRunning) {
          requestAnimationFrame(() => animate(this.clock.getDelta()));
        } else {
          this.triggerParticles(this.botGroup.position.x, this.botGroup.position.z, "success");
          resolve();
        }
      };
      this.clock.getDelta();
      animate(0);
    });
  }

  async collect(duration: number): Promise<void> {
    this.triggerParticles(this.botGroup.position.x, this.botGroup.position.z, "success");
    // Check for nearby samples
    for (const sample of this.sampleMeshes) {
      const dx = sample.position.x - this.botGroup.position.x;
      const dz = sample.position.z - this.botGroup.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 3 && sample.visible) {
        sample.visible = false;
        this.collectedSamples++;
        this.triggerParticles(sample.position.x, sample.position.z, "success");
      }
    }
    return new Promise((resolve) => setTimeout(resolve, duration));
  }

  async analyze(duration: number): Promise<string> {
    this.triggerParticles(this.botGroup.position.x, this.botGroup.position.z, "scan");
    const compositions = ["Rocoso (Basalto)", "Arenoso (Regolito)", "Helado (H2O)", "Metálico (Fe-Ni)", "Orgánico (Carbono)"];
    return new Promise((resolve) => {
      setTimeout(() => resolve(compositions[Math.floor(Math.random() * compositions.length)]), duration);
    });
  }

  async drill(duration: number): Promise<void> {
    this.triggerParticles(this.botGroup.position.x, this.botGroup.position.z, "attack");
    if (this.botParts.drill.visible) {
      const bit = this.botParts.drill.children[1] as THREE.Mesh;
      const origY = bit.position.y;
      let elapsed = 0;
      const vibrate = (delta: number) => {
        elapsed += delta;
        const p = Math.min(elapsed / (duration / 1000), 1);
        bit.position.y = origY + Math.sin(elapsed * 40) * 0.02;
        if (p < 1 && this.isRunning) {
          requestAnimationFrame(() => vibrate(this.clock.getDelta()));
        } else {
          bit.position.y = origY;
        }
      };
      this.clock.getDelta();
      vibrate(0);
    }
    return new Promise((resolve) => setTimeout(resolve, duration));
  }

  stop() {}

  reset() {
    this.botGroup.position.set(0, 0, 0);
    this.botGroup.rotation.set(0, 0, 0);
    this.collectedSamples = 0;
    this.sampleMeshes.forEach((s) => { s.visible = true; });
  }

  private async animatePosition(distance: number, duration: number) {
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
