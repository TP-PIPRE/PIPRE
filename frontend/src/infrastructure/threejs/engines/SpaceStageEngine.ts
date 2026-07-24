import * as THREE from "three";
import { MapControls } from "three/addons/controls/MapControls.js";
import { SpaceBotBuilder } from "../shared/SpaceBotBuilder";
import { ParticleSystem } from "../shared/ParticleSystem";
import {
  createSceneWithCamera,
} from "../shared/SceneUtils";
import type { ISimulatorEngine } from "../../ports/ISimulatorEngine";
import { EffectComposer } from "postprocessing";
import { createEffectComposer, BLOOM_PRESETS } from "../shared/EffectComposerSetup";
import { soundManager } from "../shared/SoundManager";
import { GhostPreview } from "../shared/GhostPreview";
import { RobotPersonality } from "../shared/RobotPersonality";
import { CinematicCamera } from "../shared/CinematicCamera";
import { BlockBar3D } from "../shared/BlockBar3D";

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
  private levelObstacles: THREE.Mesh[] = [];
  private goalBeacon: THREE.Mesh | null = null;
  private ambientDust: THREE.Points | null = null;
  private robotPersonality!: RobotPersonality;
  private cinematicCamera!: CinematicCamera;
  private blockBar!: BlockBar3D;

  constructor() {
    const { scene, camera } = createSceneWithCamera({
      fov: 50,
      cameraPos: [22, 18, 22],
      fogColor: "#0a0820",
      fogNear: 28,
      fogFar: 75,
      bgColor: "#0a0820",
      ambientColor: "#334466",
      skyColor: "#2244aa",
      groundColor: "#1a1030",
      hemiIntensity: 0.55,
      dirColor: "#8899ff",
      dirPos: [12, 28, 8],
      shadowMapSize: 2048,
      shadowCameraSize: 35,
    });
    this.scene = scene;
    this.camera = camera;

    // Large starfield with varying brightness
    const starCount = 500;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 65 + Math.random() * 20;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.6 + 8;
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      starSizes[i] = 0.05 + Math.random() * 0.25;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute("size", new THREE.BufferAttribute(starSizes, 1));
    const starMat = new THREE.PointsMaterial({
      color: "#ffffff",
      size: 0.15,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const stars = new THREE.Points(starGeo, starMat);
    this.scene.add(stars);

    this.botParts = SpaceBotBuilder.create();
    this.botGroup = this.botParts.group;
    this.ultrasonicCone = this.createUltrasonicCone();
    this.botGroup.add(this.ultrasonicCone);
    this.scene.add(this.botGroup);
    this.robotPersonality = new RobotPersonality(this.scene, this.botGroup);
    this.blockBar = new BlockBar3D(this.scene);
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
    // Alien terrain - deformed surface
    const terrainGeo = new THREE.PlaneGeometry(80, 80, 30, 30);
    const posAttr = terrainGeo.getAttribute("position");
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getY(i);
      const noise = Math.sin(x * 0.4) * Math.cos(z * 0.35) * 0.5 + Math.sin(x * 0.9 + z * 0.7) * 0.3;
      posAttr.setZ(i, noise);
    }
    terrainGeo.computeVertexNormals();
    const terrainMat = new THREE.MeshStandardMaterial({
      color: "#3d266b",
      roughness: 0.9,
      metalness: 0.15,
      emissive: "#1a0f2e",
      emissiveIntensity: 0.15,
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -0.8;
    terrain.receiveShadow = true;
    this.scene.add(terrain);

    // Craters with depth
    const craterPositions = [
      [-10, -14], [10, -10], [-6, 12], [14, 6], [0, -6], [-14, 3]
    ];
    craterPositions.forEach(([cx, cz]) => {
      const craterGeo = new THREE.CylinderGeometry(1.5 + Math.random() * 2, 2 + Math.random() * 2, 0.5, 24);
      const craterMat = new THREE.MeshStandardMaterial({
        color: "#1a0f2e",
        roughness: 1,
        emissive: "#0a0520",
        emissiveIntensity: 0.1,
      });
      const crater = new THREE.Mesh(craterGeo, craterMat);
      crater.position.set(cx, -0.5, cz);
      this.scene.add(crater);

      // Crater rim glow
      const rimGeo = new THREE.TorusGeometry(1.5 + Math.random(), 0.1, 8, 24);
      const rimMat = new THREE.MeshBasicMaterial({
        color: "#6b4fa3",
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      });
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(cx, -0.24, cz);
      this.scene.add(rim);
    });

    // Glowing crystal formations
    const crystalClusterPositions = [
      [-4, -5], [8, -3], [-2, 8], [12, 2], [-9, 4]
    ];
    crystalClusterPositions.forEach(([cx, cz]) => {
      const clusterGroup = new THREE.Group();
      for (let j = 0; j < 4; j++) {
        const height = 0.8 + Math.random() * 1.5;
        const crystalGeo = new THREE.ConeGeometry(0.15, height, 6);
        const crystalMat = new THREE.MeshStandardMaterial({
          color: "#3b82f6",
          emissive: "#3b82f6",
          emissiveIntensity: 0.6,
          roughness: 0.1,
          metalness: 0.3,
          transparent: true,
          opacity: 0.85,
        });
        const crystal = new THREE.Mesh(crystalGeo, crystalMat);
        crystal.position.set(
          (Math.random() - 0.5) * 0.6,
          height / 2 - 0.5,
          (Math.random() - 0.5) * 0.6
        );
        crystal.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3);
        clusterGroup.add(crystal);
      }
      // Light on cluster
      const ptLight = new THREE.PointLight("#3b82f6", 0.4, 4);
      ptLight.position.set(cx, 0, cz);
      this.scene.add(ptLight);
      clusterGroup.position.set(cx, 0, cz);
      this.scene.add(clusterGroup);
    });

    // Rock formations
    const rockMat = new THREE.MeshStandardMaterial({
      color: "#5a4a80",
      roughness: 0.85,
      metalness: 0.2,
    });
    for (let i = 0; i < 10; i++) {
      const rockGeo = new THREE.DodecahedronGeometry(0.4 + Math.random() * 0.7, 1);
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(
        -14 + Math.random() * 28,
        0,
        -14 + Math.random() * 28
      );
      rock.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      rock.castShadow = true;
      rock.scale.set(1, 0.6 + Math.random() * 0.8, 1);
      this.scene.add(rock);
    }

    // Collectable samples - glowing floating crystals
    const sampleMat = new THREE.MeshStandardMaterial({
      color: "#00f5d4",
      emissive: "#00f5d4",
      emissiveIntensity: 0.7,
      roughness: 0.1,
      metalness: 0.2,
    });
    const samplePositions = [[-5, -8], [7, -12], [-3, 5], [12, 0], [-8, 10]];
    samplePositions.forEach((pos) => {
      const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.4), sampleMat);
      s.position.set(pos[0], 0.5, pos[1]);
      s.name = "sample";
      this.scene.add(s);
      this.sampleMeshes.push(s);
    });

    // Landing pad with beacon
    const padGeo = new THREE.RingGeometry(2, 3, 32);
    const padMat = new THREE.MeshBasicMaterial({
      color: "#38bdf8",
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(12, -0.25, -16);
    this.scene.add(pad);

    // Beacon pillar
    const beaconBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.25, 1.5, 8),
      new THREE.MeshStandardMaterial({ color: "#334466", roughness: 0.5, metalness: 0.5 })
    );
    beaconBase.position.set(12, 0.25, -16);
    this.scene.add(beaconBase);
    const beaconLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshStandardMaterial({ color: "#38bdf8", emissive: "#38bdf8", emissiveIntensity: 0.8 })
    );
    beaconLight.position.set(12, 1.1, -16);
    this.scene.add(beaconLight);
    const beaconGlow = new THREE.PointLight("#38bdf8", 0.6, 6);
    beaconGlow.position.copy(beaconLight.position);
    this.scene.add(beaconGlow);

    // Ambient floating dust
    const dustCount = 120;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 60;
      dustPositions[i * 3 + 1] = Math.random() * 8;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: "#8899cc",
      size: 0.08,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.ambientDust = new THREE.Points(dustGeo, dustMat);
    this.scene.add(this.ambientDust);
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

    this.cinematicCamera = new CinematicCamera(this.camera, this.controls);

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
    this.robotPersonality.dispose();
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
      this.cinematicCamera.update(this.botGroup.position);
      if (this.controls) this.controls.update();
      // Spin propellers
      if (this.botParts.propellers.visible) {
        this.botParts.propellers.children.forEach((c) => {
          if (c instanceof THREE.Mesh && c.geometry.type === "BoxGeometry") {
            c.rotation.y += 0.1;
          }
        });
      }
      // Animate floating dust
      if (this.ambientDust) {
        const pos = this.ambientDust.geometry.attributes.position.array as Float32Array;
        const t = Date.now() * 0.001;
        for (let i = 0; i < pos.length; i += 3) {
          pos[i + 1] += Math.sin(t + i * 0.1) * 0.003;
          if (pos[i + 1] > 8) pos[i + 1] = 0;
          if (pos[i + 1] < 0) pos[i + 1] = 8;
        }
        this.ambientDust.geometry.attributes.position.needsUpdate = true;
      }
      // Pulse samples on terrain
      this.sampleMeshes.forEach((s, i) => {
        s.position.y = 0.5 + Math.sin(Date.now() * 0.003 + i) * 0.3;
        s.rotation.y += 0.01;
      });
      this.ghostPreview.animate(Date.now() * 0.001);

      if (this.goalBeacon) {
        const t = Date.now() * 0.001;
        this.goalBeacon.rotation.z += 0.01;
        this.goalBeacon.scale.setScalar(1 + Math.sin(t * 2) * 0.1);
      }

      this.robotPersonality.update(0.016);
      this.blockBar.animate(Date.now() * 0.001);
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

  loadLevel(obstacles: Array<{ x: number; z: number; type: string; size?: number }>, startPos: { x: number; z: number; rotation: number }, goalPos: { x: number; z: number }): void {
    this.levelObstacles.forEach((o) => {
      this.scene.remove(o);
      o.geometry?.dispose();
      if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
      else (o.material as THREE.Material)?.dispose();
    });
    this.levelObstacles = [];

    obstacles.forEach((obs) => {
      let mesh: THREE.Mesh;

      switch (obs.type) {
        case "enemy": {
          const geo = new THREE.BoxGeometry(1.2, 1.5, 1.2);
          const mat = new THREE.MeshStandardMaterial({ color: "#ef4444", emissive: "#ef4444", emissiveIntensity: 0.4, roughness: 0.4 });
          mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(obs.x, 0.75, obs.z);
          mesh.castShadow = true;
          mesh.name = "level_enemy";
          break;
        }
        case "block": {
          const s = obs.size || 1;
          const geo = new THREE.BoxGeometry(s, s, s);
          const mat = new THREE.MeshStandardMaterial({ color: "#64748b", roughness: 0.6, metalness: 0.3 });
          mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(obs.x, (obs.size || 1) / 2, obs.z);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.name = "level_block";
          break;
        }
        case "crate": {
          const geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
          const mat = new THREE.MeshStandardMaterial({ color: "#f59e0b", roughness: 0.5 });
          mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(obs.x, 0.4, obs.z);
          mesh.castShadow = true;
          mesh.name = "level_crate";
          break;
        }
        case "sample": {
          const geo = new THREE.OctahedronGeometry(0.35);
          const mat = new THREE.MeshStandardMaterial({ color: "#3b82f6", emissive: "#3b82f6", emissiveIntensity: 0.5 });
          mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(obs.x, 0.4, obs.z);
          mesh.name = "level_sample";
          break;
        }
        case "door": {
          const geo = new THREE.BoxGeometry(1.5, 2.5, 0.3);
          const mat = new THREE.MeshStandardMaterial({ color: "#8b6fcf", emissive: "#6b4fa3", emissiveIntensity: 0.3, transparent: true, opacity: 0.8 });
          mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(obs.x, 0.75, obs.z);
          mesh.name = "level_door";
          break;
        }
        case "cone": {
          const geo = new THREE.ConeGeometry(0.5, 1, 8);
          const mat = new THREE.MeshStandardMaterial({ color: "#ef4444", emissive: "#ef4444", emissiveIntensity: 0.2 });
          mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(obs.x, 0.5, obs.z);
          mesh.name = "level_cone";
          break;
        }
        case "wall": {
          const s = obs.size || 8;
          const geo = new THREE.BoxGeometry(s, 3, 0.8);
          const mat = new THREE.MeshStandardMaterial({ color: "#475569", roughness: 0.7, emissive: "#1a1a2e", emissiveIntensity: 0.1 });
          mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(obs.x, 1, obs.z);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.name = "level_wall";
          break;
        }
        default: {
          const geo = new THREE.BoxGeometry(1, 1, 1);
          const mat = new THREE.MeshStandardMaterial({ color: "#94a3b8" });
          mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(obs.x, 0.5, obs.z);
          break;
        }
      }

      this.scene.add(mesh);
      this.levelObstacles.push(mesh);
    });

    this.botGroup.position.set(startPos.x, 0, startPos.z);
    this.botGroup.rotation.set(0, 0, 0);
    this.botGroup.rotation.y = startPos.rotation;

    this.showGoalBeacon(goalPos.x, goalPos.z);
  }

  showGoalBeacon(x: number, z: number): void {
    if (this.goalBeacon) {
      this.scene.remove(this.goalBeacon);
      this.goalBeacon.geometry?.dispose();
      (this.goalBeacon.material as THREE.Material)?.dispose();
    }

    const ringGeo = new THREE.TorusGeometry(0.5, 0.1, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: "#fbbf24",
      emissive: "#fbbf24",
      emissiveIntensity: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.7,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, 0.3, z);
    ring.name = "goal_beacon";
    this.scene.add(ring);

    const dotGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const dot = new THREE.Mesh(dotGeo, ringMat.clone());
    dot.position.set(x, 0.8, z);
    dot.name = "goal_beacon_dot";
    this.scene.add(dot);

    this.goalBeacon = ring;
  }

  checkGoalReached(x: number, z: number): boolean {
    if (!this.goalBeacon) return false;
    const dx = x - this.goalBeacon.position.x;
    const dz = z - this.goalBeacon.position.z;
    return Math.sqrt(dx * dx + dz * dz) < 2;
  }

  setRobotEmotion(emotion: string): void {
    this.robotPersonality.setEmotion(emotion as "idle" | "thinking" | "excited" | "sad" | "celebrating" | "scared" | "angry");
  }

  robotSpeak(text: string, duration?: number): void {
    this.robotPersonality.speak(text, duration);
  }

  enableFollowCam(enabled: boolean): void {
    if (enabled) {
      this.cinematicCamera.startFollow(this.botGroup.position);
    } else {
      this.cinematicCamera.stopFollow();
    }
  }

  triggerCameraShake(intensity?: number): void {
    this.cinematicCamera.triggerShake(intensity);
  }

  updateBlockBar(blocks: Array<{ id: string; type: string; category: string; params: Record<string, string> }>, activeBlockId: string | null): void {
    this.blockBar.updateBlocks(blocks, activeBlockId);
  }
}
