import * as THREE from "three";
import { MapControls } from "three/addons/controls/MapControls.js";
import { MazeBotBuilder } from "../shared/MazeBotBuilder";
import { ParticleSystem } from "../shared/ParticleSystem";
import { createSceneWithCamera, createShadowFloor, createGrid } from "../shared/SceneUtils";
import type { ISimulatorEngine } from "../../ports/ISimulatorEngine";

export class MazeStageEngine implements ISimulatorEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private botGroup: THREE.Group;
  private botParts: ReturnType<typeof MazeBotBuilder.create>;
  private ultrasonicCone: THREE.Mesh;
  private particles: ParticleSystem;
  private animationId: number | null = null;
  private clock: THREE.Clock;
  private controls!: MapControls;
  private isRunning = false;
  private doors: THREE.Mesh[] = [];
  private portalLight: THREE.PointLight;
  private beacons: THREE.Mesh[] = [];

  constructor() {
    const { scene, camera } = createSceneWithCamera({
      fov: 50,
      cameraPos: [18, 16, 18],
      fogColor: "#0a0a1a",
      fogNear: 25,
      fogFar: 80,
      bgColor: "#0a0a1a",
      ambientColor: "#332244",
      skyColor: "#443366",
      groundColor: "#1a1030",
      dirColor: "#ccbbff",
      dirPos: [10, 22, 10],
      shadowMapSize: 2048,
      shadowCameraSize: 30,
    });
    this.scene = scene;
    this.camera = camera;
    this.clock = new THREE.Clock();

    createShadowFloor(this.scene, 60, -0.5, "#1a1040");
    createGrid(this.scene, 60, 60, "#4a2d8a", "#2a1a5a", -0.49);

    this.botParts = MazeBotBuilder.create();
    this.botGroup = this.botParts.group;
    this.ultrasonicCone = this.createUltrasonicCone();
    this.botGroup.add(this.ultrasonicCone);
    this.scene.add(this.botGroup);

    this.portalLight = new THREE.PointLight(0xa78bfa, 1, 15);
    this.portalLight.position.set(14, 3, -14);
    this.scene.add(this.portalLight);

    this.particles = new ParticleSystem(this.scene);
    this.createEnvironment();
  }

  private createUltrasonicCone(): THREE.Mesh {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(2, 5, 16),
      new THREE.MeshBasicMaterial({ color: "#a78bfa", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    cone.geometry.rotateX(Math.PI / 2);
    cone.position.set(0, 0, -3.5);
    return cone;
  }

  private createEnvironment() {
    const wallMat = new THREE.MeshStandardMaterial({ color: "#3d2670", roughness: 0.8, emissive: "#1a0f3a", emissiveIntensity: 0.2 });
    const runeMat = new THREE.MeshBasicMaterial({ color: "#a78bfa", transparent: true, opacity: 0.15 });
    const mazeWalls = [
      { x: -8, z: -5, w: 12, h: 0.8 },
      { x: -3, z: 2, w: 0.8, h: 10 },
      { x: 4, z: -8, w: 0.8, h: 12 },
      { x: -6, z: 6, w: 8, h: 0.8 },
      { x: 6, z: 1, w: 0.8, h: 8 },
      { x: 1, z: -6, w: 6, h: 0.8 },
      { x: -2, z: -2, w: 0.8, h: 6 },
    ];
    mazeWalls.forEach((wall) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(wall.w, 3, wall.h), wallMat);
      mesh.position.set(wall.x, 1, wall.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      const rune = new THREE.Mesh(new THREE.BoxGeometry(wall.w - 0.5, 0.05, 0.05), runeMat);
      rune.position.set(wall.x, 2.2, wall.z);
      this.scene.add(rune);
    });

    const doorMat = new THREE.MeshStandardMaterial({
      color: "#8b6fcf", emissive: "#6b4fa3", emissiveIntensity: 0.3,
      transparent: true, opacity: 0.8,
    });
    const doorPos = [{ x: -3, z: -4 }, { x: 4, z: 4 }, { x: -2, z: 0 }];
    doorPos.forEach((pos) => {
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 0.3), doorMat);
      door.position.set(pos.x, 0.75, pos.z);
      door.castShadow = true;
      door.receiveShadow = true;
      this.doors.push(door);
      this.scene.add(door);
    });

    const portalRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.8, 0.3, 16, 32),
      new THREE.MeshStandardMaterial({ color: "#a78bfa", emissive: "#a78bfa", emissiveIntensity: 0.6 }),
    );
    portalRing.position.set(14, 1.5, -14);
    portalRing.rotation.x = Math.PI / 2;
    this.scene.add(portalRing);

    const portalGlow = new THREE.Mesh(
      new THREE.CircleGeometry(1.5, 24),
      new THREE.MeshBasicMaterial({ color: "#c084fc", transparent: true, opacity: 0.3, side: THREE.DoubleSide }),
    );
    portalGlow.position.set(14, -0.45, -14);
    portalGlow.rotation.x = -Math.PI / 2;
    this.scene.add(portalGlow);

    const beaconMat = new THREE.MeshStandardMaterial({
      color: "#fbbf24", emissive: "#fbbf24", emissiveIntensity: 0.5,
    });
    const beaconPos = [{ x: -7, z: -3 }, { x: 0, z: -7 }, { x: 7, z: -3 }, { x: -7, z: 7 }];
    beaconPos.forEach((pos) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.5, 0.2), wallMat);
      pillar.position.set(pos.x, 0.25, pos.z);
      this.scene.add(pillar);
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.15), beaconMat);
      gem.position.set(pos.x, 1.0, pos.z);
      this.beacons.push(gem);
      this.scene.add(gem);
    });

    const ambientGeo = new THREE.BufferGeometry();
    const ambientPos = new Float32Array(50 * 3);
    for (let i = 0; i < 50; i++) {
      ambientPos[i * 3] = (Math.random() - 0.5) * 40;
      ambientPos[i * 3 + 1] = Math.random() * 4;
      ambientPos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    ambientGeo.setAttribute("position", new THREE.BufferAttribute(ambientPos, 3));
    const ambientMat = new THREE.PointsMaterial({
      color: "#a78bfa", size: 0.08, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    const ambientPts = new THREE.Points(ambientGeo, ambientMat);
    this.scene.add(ambientPts);
  }

  init(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.controls = new MapControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 45;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.screenSpacePanning = true;
    this.controls.target.set(0, 0.5, 0);
    this.controls.update();
    this.resize(canvas.clientWidth, canvas.clientHeight);
    this.startLoop();
  }

  updateHardware(installedHardware: string[]) {
    const parts: Record<string, THREE.Group> = {
      "Botas de Velocidad": this.botParts.boots,
      "Faro Mágico": this.botParts.lantern,
      "Llave Antigua": this.botParts.key,
      "Espejo de Visión": this.botParts.mirror,
      "Portal de Teletransporte": this.botParts.portal,
      "Sensor Ultrasónico": this.botParts.sonar,
      "Cristal de Escarcha": this.botParts.crystal,
    };
    const all = [this.botParts.boots, this.botParts.lantern, this.botParts.key, this.botParts.mirror, this.botParts.portal, this.botParts.sonar, this.botParts.crystal];
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
      this.portalLight.intensity = 0.5 + Math.sin(Date.now() * 0.003) * 0.5;
      this.beacons.forEach((b, i) => {
        b.scale.setScalar(1 + Math.sin(Date.now() * 0.004 + i) * 0.2);
      });
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
          resolve(Math.floor(Math.random() * 10) + 3);
        }
      };
      this.clock.getDelta();
      animate(0);
    });
  }

  async lightUp(duration: number): Promise<void> {
    this.triggerParticles(this.botGroup.position.x, this.botGroup.position.z, "magic");
    const light = new THREE.PointLight(0xfbbf24, 3, 12);
    light.position.copy(this.botGroup.position);
    light.position.y = 2;
    this.scene.add(light);
    return new Promise((resolve) => {
      setTimeout(() => { this.scene.remove(light); resolve(); }, duration);
    });
  }

  async openDoor(duration: number): Promise<boolean> {
    let opened = false;
    for (const door of this.doors) {
      const dx = door.position.x - this.botGroup.position.x;
      const dz = door.position.z - this.botGroup.position.z;
      if (Math.sqrt(dx * dx + dz * dz) < 4) {
        door.position.y = -10;
        opened = true;
        this.triggerParticles(door.position.x, door.position.z, "magic");
        break;
      }
    }
    return new Promise((resolve) => setTimeout(() => resolve(opened), duration));
  }

  async detectMagic(duration: number): Promise<string> {
    this.triggerParticles(this.botGroup.position.x, this.botGroup.position.z, "scan");
    const traces = ["Débil", "Moderado", "Fuerte", "Antiguo", "Oscuro", "Divino"];
    return new Promise((resolve) => {
      setTimeout(() => resolve(traces[Math.floor(Math.random() * traces.length)]), duration);
    });
  }

  async teleport(duration: number): Promise<void> {
    this.triggerParticles(this.botGroup.position.x, this.botGroup.position.z, "magic");
    return new Promise((resolve) => {
      setTimeout(() => {
        this.botGroup.position.set(14, 0, -14);
        this.triggerParticles(14, -14, "success");
        resolve();
      }, duration);
    });
  }

  async freeze(duration: number): Promise<void> {
    this.triggerParticles(this.botGroup.position.x, this.botGroup.position.z, "magic");
    const iceMat = new THREE.MeshBasicMaterial({ color: "#7dd3fc", transparent: true, opacity: 0.4, wireframe: true });
    const iceSphere = new THREE.Mesh(new THREE.SphereGeometry(2.5, 12, 12), iceMat);
    iceSphere.position.copy(this.botGroup.position);
    iceSphere.position.y = 1;
    this.scene.add(iceSphere);
    return new Promise((resolve) => {
      setTimeout(() => {
        this.scene.remove(iceSphere);
        iceSphere.geometry.dispose();
        (iceSphere.material as THREE.Material).dispose();
        resolve();
      }, duration);
    });
  }

  stop() {}

  reset() {
    this.botGroup.position.set(0, 0, 0);
    this.botGroup.rotation.set(0, 0, 0);
    this.doors.forEach((door) => { door.position.y = 0.75; });
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
