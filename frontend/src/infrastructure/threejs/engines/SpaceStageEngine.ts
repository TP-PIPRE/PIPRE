import * as THREE from "three";
import { MapControls } from "three/addons/controls/MapControls.js";
import { SpaceBotBuilder } from "../shared/SpaceBotBuilder";
import { ParticleSystem } from "../shared/ParticleSystem";
import {
  createSceneWithCamera,
  createShadowFloor,
  createGrid,
  createStarfield,
} from "../shared/SceneUtils";
import type { ISimulatorEngine } from "../../ports/ISimulatorEngine";
import { EffectComposer } from "postprocessing";
import { createEffectComposer, BLOOM_PRESETS } from "../shared/EffectComposerSetup";
import { soundManager } from "../shared/SoundManager";
import { GhostPreview } from "../shared/GhostPreview";

export class SpaceStageEngine implements ISimulatorEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private composer!: EffectComposer;
  private botGroup: THREE.Group;
  private botParts: ReturnType<typeof SpaceBotBuilder.create>;
  private ultrasonicCone: THREE.Mesh;
  private particles: ParticleSystem;
  private animationId: number | null = null;
  private lastTime = 0;
  private controls!: MapControls;
  private isRunning = false;
  private collectedSamples = 0;
  private sampleMeshes: THREE.Mesh[] = [];
  private ghostPreview!: GhostPreview;

  constructor() {
    const { scene, camera } = createSceneWithCamera({
      fov: 50,
      cameraPos: [22, 18, 22],
      fogColor: "#0a0a20",
      fogNear: 35,
      fogFar: 100,
      bgColor: "#0a0a20",
      ambientColor: "#334466",
      skyColor: "#334488",
      groundColor: "#1a1030",
      dirColor: "#ccddff",
      dirPos: [15, 30, 10],
      shadowMapSize: 2048,
      shadowCameraSize: 35,
    });
    this.scene = scene;
    this.camera = camera;

    createShadowFloor(this.scene, 80, -0.5, "#1a1a3e");
    createGrid(this.scene, 80, 80, "#4a4a8a", "#2a1a5a", -0.49);
    createStarfield(this.scene, 350, 80, 3, 30, "#8899ff", 0.12, 0.65);

    this.botParts = SpaceBotBuilder.create();
    this.botGroup = this.botParts.group;
    this.ultrasonicCone = this.createUltrasonicCone();
    this.botGroup.add(this.ultrasonicCone);
    this.scene.add(this.botGroup);
    this.particles = new ParticleSystem(this.scene);
    this.ghostPreview = new GhostPreview(this.scene);
    this.createEnvironment();
  }

  private getDelta(): number {
    const now = performance.now();
    const delta = (now - this.lastTime) / 1000;
    this.lastTime = now;
    return delta;
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
      s.userData.origY = pos[1];
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
  }

  init(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.composer = createEffectComposer(this.renderer, this.scene, this.camera, BLOOM_PRESETS.space);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.controls = new MapControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 55;
    this.controls.screenSpacePanning = true;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.target.set(0, 0.5, 0);
    this.controls.update();
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

  updateTheme(colors: Record<string, string>) {
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
    this.composer.dispose();
    this.ghostPreview.dispose();
    this.renderer.dispose();
    this.particles.dispose();
  }

  resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
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
      // Gentle sample floating animation
      this.sampleMeshes.forEach((sample, i) => {
        if (sample.visible) {
          sample.position.y = (sample.userData.origY as number) + Math.sin(Date.now() * 0.002 + i) * 0.15;
        }
      });
      this.ghostPreview.animate(Date.now() * 0.001);
      this.composer.render();
    };
    animate();
  }

  async moveForward(distance: number, duration: number): Promise<void> {
    soundManager.play("move");
    return this.animatePosition(distance, duration);
  }

  async rotateCore(degrees: number, duration: number): Promise<void> {
    soundManager.play("rotate");
    return this.animateRotation(degrees, duration);
  }

  async triggerUltrasonicSensor(duration: number): Promise<number> {
    soundManager.play("scan");
    return new Promise((resolve) => {
      let elapsed = 0;
      const animate = (delta: number) => {
        elapsed += delta;
        const p = Math.min(elapsed / (duration / 1000), 1);
        (this.ultrasonicCone.material as THREE.MeshBasicMaterial).opacity = p < 0.5 ? p * 1.6 : (1 - p) * 1.6;
        if (p < 1 && this.isRunning) {
          requestAnimationFrame(() => animate(this.getDelta()));
        } else {
          (this.ultrasonicCone.material as THREE.MeshBasicMaterial).opacity = 0;
          resolve(Math.floor(Math.random() * 15) + 5);
        }
      };
      this.getDelta();
      animate(0);
    });
  }

  async takeOff(altitude: number, duration: number): Promise<void> {
    soundManager.play("takeoff");
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
          requestAnimationFrame(() => animate(this.getDelta()));
        } else {
          this.triggerParticles(this.botGroup.position.x, this.botGroup.position.z, "move");
          resolve();
        }
      };
      this.getDelta();
      animate(0);
    });
  }

  async land(duration: number): Promise<void> {
    soundManager.play("land");
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
          requestAnimationFrame(() => animate(this.getDelta()));
        } else {
          this.triggerParticles(this.botGroup.position.x, this.botGroup.position.z, "success");
          resolve();
        }
      };
      this.getDelta();
      animate(0);
    });
  }

  async collect(duration: number): Promise<void> {
    soundManager.play("collect");
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
    soundManager.play("scan");
    this.triggerParticles(this.botGroup.position.x, this.botGroup.position.z, "scan");
    const compositions = ["Rocoso (Basalto)", "Arenoso (Regolito)", "Helado (H2O)", "Metálico (Fe-Ni)", "Orgánico (Carbono)"];
    return new Promise((resolve) => {
      setTimeout(() => resolve(compositions[Math.floor(Math.random() * compositions.length)]), duration);
    });
  }

  async drill(duration: number): Promise<void> {
    soundManager.play("attack");
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
          requestAnimationFrame(() => vibrate(this.getDelta()));
        } else {
          bit.position.y = origY;
        }
      };
      this.getDelta();
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

  getState(): { collectedSamples: number } {
    return { collectedSamples: this.collectedSamples };
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
          requestAnimationFrame(() => animate(this.getDelta()));
        } else resolve();
      };
      this.getDelta();
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
          requestAnimationFrame(() => animate(this.getDelta()));
        } else resolve();
      };
      this.getDelta();
      animate(0);
    });
  }

  getBotPosition(): { x: number; z: number; rotation: number } {
    return {
      x: this.botGroup.position.x,
      z: this.botGroup.position.z,
      rotation: this.botGroup.rotation.y,
    };
  }

  showPathPreview(waypoints: Array<{ x: number; z: number; y?: number }>): void {
    this.ghostPreview.showPath(waypoints);
  }

  showRotationPreview(angle: number): void {
    const pos = this.botGroup.position;
    this.ghostPreview.showRotationArc(pos, this.botGroup.rotation.y, angle);
  }

  showMarkerPreview(x: number, z: number, color?: string): void {
    this.ghostPreview.showSingleMarker(x, z, color);
  }

  clearPreview(): void {
    this.ghostPreview.clear();
  }
}
