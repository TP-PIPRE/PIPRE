import * as THREE from "three";
import { MapControls } from "three/addons/controls/MapControls.js";
import { MazeBotBuilder } from "../shared/MazeBotBuilder";
import { ParticleSystem } from "../shared/ParticleSystem";
import { createSceneWithCamera } from "../shared/SceneUtils";
import type { ISimulatorEngine } from "../../ports/ISimulatorEngine";
import { EffectComposer } from "postprocessing";
import { createEffectComposer, BLOOM_PRESETS } from "../shared/EffectComposerSetup";
import { soundManager } from "../shared/SoundManager";
import { GhostPreview } from "../shared/GhostPreview";

export class MazeStageEngine implements ISimulatorEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private composer!: EffectComposer;
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
  private fireflies: THREE.Points | null = null;
  private ghostPreview!: GhostPreview;
  private levelObstacles: THREE.Mesh[] = [];
  private goalBeacon: THREE.Mesh | null = null;

  constructor() {
    const { scene, camera } = createSceneWithCamera({
      fov: 50,
      cameraPos: [18, 16, 18],
      fogColor: "#0a0515",
      fogNear: 18,
      fogFar: 55,
      bgColor: "#0a0515",
      ambientColor: "#332244",
      skyColor: "#221144",
      groundColor: "#1a1030",
      dirColor: "#8877cc",
      dirIntensity: 0.7,
      dirPos: [8, 18, 8],
      shadowMapSize: 2048,
      shadowCameraSize: 30,
    });
    this.scene = scene;
    this.camera = camera;
    this.clock = new THREE.Clock();

    this.botParts = MazeBotBuilder.create();
    this.botGroup = this.botParts.group;
    this.ultrasonicCone = this.createUltrasonicCone();
    this.botGroup.add(this.ultrasonicCone);
    this.scene.add(this.botGroup);

    this.portalLight = new THREE.PointLight(0xa78bfa, 1, 15);
    this.portalLight.position.set(14, 3, -14);
    this.scene.add(this.portalLight);

    this.particles = new ParticleSystem(this.scene);
    this.ghostPreview = new GhostPreview(this.scene);
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
    // Dark forest floor
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({
      color: "#0d0a0f",
      roughness: 0.95,
      metalness: 0,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Moss patches scattered on ground
    const mossMat = new THREE.MeshStandardMaterial({
      color: "#1a3320",
      roughness: 1,
      emissive: "#0a1a10",
      emissiveIntensity: 0.05,
    });
    for (let i = 0; i < 15; i++) {
      const mossGeo = new THREE.CircleGeometry(0.8 + Math.random() * 2, 12);
      const moss = new THREE.Mesh(mossGeo, mossMat);
      moss.rotation.x = -Math.PI / 2;
      moss.position.set(
        (Math.random() - 0.5) * 45,
        -0.48,
        (Math.random() - 0.5) * 45
      );
      this.scene.add(moss);
    }

    // Glowing grid - mystic ley lines
    const grid = new THREE.GridHelper(60, 30, "#4a2d8a", "#1a1040");
    grid.position.y = -0.48;
    grid.material.opacity = 0.12;
    grid.material.transparent = true;
    grid.name = "environment_grid";
    this.scene.add(grid);

    // Twisted tree walls (replace box walls)
    const treeTrunkMat = new THREE.MeshStandardMaterial({
      color: "#1a1025",
      roughness: 0.9,
      emissive: "#0a0515",
      emissiveIntensity: 0.1,
    });
    const treeTopMat = new THREE.MeshStandardMaterial({
      color: "#0a1a10",
      roughness: 0.8,
      emissive: "#051008",
      emissiveIntensity: 0.05,
    });

    const wallConfigs: Array<{ x: number; z: number; w: number; h: number }> = [
      { x: -8, z: -5, w: 10, h: 1 },
      { x: -3, z: 2, w: 1, h: 8 },
      { x: 4, z: -8, w: 1, h: 10 },
      { x: -6, z: 6, w: 6, h: 1 },
      { x: 6, z: 1, w: 1, h: 8 },
      { x: 1, z: -6, w: 5, h: 1 },
      { x: -2, z: -2, w: 1, h: 5 },
    ];

    wallConfigs.forEach((wall) => {
      // Create a row of twisted pillars instead of solid wall
      const isHorizontal = wall.w > wall.h;
      const length = Math.max(wall.w, wall.h);
      const pillarCount = Math.floor(length / 1.5);

      for (let p = 0; p < pillarCount; p++) {
        const offset = (p - pillarCount / 2) * 1.5;
        const twistAngle = Math.sin(p * 0.7) * 0.15;
        const height = 2.5 + Math.random() * 1.5;

        // Tree trunk
        const trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, height, 8);
        const trunk = new THREE.Mesh(trunkGeo, treeTrunkMat);
        const tx = isHorizontal ? wall.x + offset : wall.x;
        const tz = isHorizontal ? wall.z : wall.z + offset;
        trunk.position.set(tx, height / 2 - 0.5, tz);
        trunk.rotation.z = twistAngle;
        trunk.castShadow = true;
        this.scene.add(trunk);

        // Foliage top
        const foliageGeo = new THREE.ConeGeometry(0.8, 1.5, 6);
        const foliage = new THREE.Mesh(foliageGeo, treeTopMat);
        foliage.position.set(tx, height - 0.1, tz);
        foliage.castShadow = true;
        this.scene.add(foliage);

        // Hanging glow orb on some trees
        if (Math.random() > 0.6) {
          const orbGeo = new THREE.SphereGeometry(0.12, 8, 8);
          const orbMat = new THREE.MeshStandardMaterial({
            color: "#a78bfa",
            emissive: "#a78bfa",
            emissiveIntensity: 0.6,
          });
          const orb = new THREE.Mesh(orbGeo, orbMat);
          orb.position.set(tx, height - 1.2, tz + 0.5);
          this.scene.add(orb);
          const orbLight = new THREE.PointLight("#a78bfa", 0.25, 3);
          orbLight.position.copy(orb.position);
          this.scene.add(orbLight);
        }
      }
    });

    // Magic doors - arches with shimmering veils
    const doorPositions = [{ x: -3, z: -4 }, { x: 4, z: 4 }, { x: -2, z: 0 }];
    const doorArchMat = new THREE.MeshStandardMaterial({
      color: "#3d2670",
      roughness: 0.5,
      emissive: "#1a0f3a",
      emissiveIntensity: 0.3,
    });

    doorPositions.forEach((pos) => {
      // Stone arch
      const archPillar1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.3, 3, 8),
        doorArchMat
      );
      archPillar1.position.set(pos.x - 0.8, 1, pos.z);
      this.scene.add(archPillar1);
      const archPillar2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.3, 3, 8),
        doorArchMat
      );
      archPillar2.position.set(pos.x + 0.8, 1, pos.z);
      this.scene.add(archPillar2);

      // Magic veil (translucent door)
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 2.5, 0.2),
        new THREE.MeshStandardMaterial({
          color: "#8b6fcf",
          emissive: "#6b4fa3",
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.6,
        })
      );
      door.position.set(pos.x, 0.75, pos.z);
      door.name = "magic_door";
      this.doors.push(door);
      this.scene.add(door);
    });

    // Portal - large glowing ring
    const portalRing = new THREE.Mesh(
      new THREE.TorusGeometry(2, 0.3, 16, 48),
      new THREE.MeshStandardMaterial({
        color: "#a78bfa",
        emissive: "#a78bfa",
        emissiveIntensity: 0.8,
        roughness: 0.2,
      })
    );
    portalRing.position.set(14, 1.5, -14);
    portalRing.rotation.x = Math.PI / 2;
    portalRing.name = "portal";
    this.scene.add(portalRing);

    // Portal inner glow
    const portalInner = new THREE.Mesh(
      new THREE.CircleGeometry(1.7, 32),
      new THREE.MeshBasicMaterial({
        color: "#c084fc",
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    portalInner.position.set(14, 0.05, -14);
    portalInner.rotation.x = -Math.PI / 2;
    this.scene.add(portalInner);

    this.portalLight = new THREE.PointLight("#a78bfa", 1, 15);
    this.portalLight.position.set(14, 2, -14);
    this.scene.add(this.portalLight);

    // Beacon pillars with glowing gems
    const beaconPositions = [{ x: -7, z: -3 }, { x: 0, z: -7 }, { x: 7, z: -3 }, { x: -7, z: 7 }];
    const beaconStoneMat = new THREE.MeshStandardMaterial({
      color: "#2a1a3a",
      roughness: 0.7,
      emissive: "#1a0a20",
      emissiveIntensity: 0.1,
    });
    const beaconGemMat = new THREE.MeshStandardMaterial({
      color: "#fbbf24",
      emissive: "#fbbf24",
      emissiveIntensity: 0.7,
    });

    beaconPositions.forEach((pos) => {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.35, 2, 8),
        beaconStoneMat
      );
      pillar.position.set(pos.x, 0.5, pos.z);
      pillar.castShadow = true;
      this.scene.add(pillar);

      const gem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.2),
        beaconGemMat
      );
      gem.position.set(pos.x, 1.6, pos.z);
      this.beacons.push(gem);
      this.scene.add(gem);

      const gemLight = new THREE.PointLight("#fbbf24", 0.3, 4);
      gemLight.position.copy(gem.position);
      this.scene.add(gemLight);
    });

    // Fireflies - floating ambient particles
    const fireflyCount = 80;
    const fireflyGeo = new THREE.BufferGeometry();
    const fireflyPositions = new Float32Array(fireflyCount * 3);
    for (let i = 0; i < fireflyCount; i++) {
      fireflyPositions[i * 3] = (Math.random() - 0.5) * 35;
      fireflyPositions[i * 3 + 1] = Math.random() * 5;
      fireflyPositions[i * 3 + 2] = (Math.random() - 0.5) * 35;
    }
    fireflyGeo.setAttribute("position", new THREE.BufferAttribute(fireflyPositions, 3));
    const fireflyMat = new THREE.PointsMaterial({
      color: "#a78bfa",
      size: 0.12,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.fireflies = new THREE.Points(fireflyGeo, fireflyMat);
    this.scene.add(this.fireflies);
  }

  init(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.composer = createEffectComposer(this.renderer, this.scene, this.camera, BLOOM_PRESETS.maze);
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
      this.portalLight.intensity = 0.5 + Math.sin(Date.now() * 0.003) * 0.5;
      this.beacons.forEach((b, i) => {
        b.scale.setScalar(1 + Math.sin(Date.now() * 0.004 + i) * 0.2);
      });
      this.ghostPreview.animate(Date.now() * 0.001);

      if (this.goalBeacon) {
        const t = Date.now() * 0.001;
        this.goalBeacon.rotation.z += 0.01;
        this.goalBeacon.scale.setScalar(1 + Math.sin(t * 2) * 0.1);
      }

      // Animate fireflies
      if (this.fireflies) {
        const pos = this.fireflies.geometry.attributes.position.array as Float32Array;
        const t = Date.now() * 0.001;
        for (let i = 0; i < pos.length; i += 3) {
          pos[i + 1] += Math.sin(t * 2 + i * 0.3) * 0.005;
          pos[i] += Math.cos(t * 1.5 + i * 0.2) * 0.003;
          if (pos[i + 1] > 5) pos[i + 1] = 0;
          if (pos[i + 1] < 0) pos[i + 1] = 5;
        }
        this.fireflies.geometry.attributes.position.needsUpdate = true;
      }

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
    soundManager.play("magic");
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
    soundManager.play("magic");
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
    soundManager.play("scan");
    this.triggerParticles(this.botGroup.position.x, this.botGroup.position.z, "scan");
    const traces = ["Débil", "Moderado", "Fuerte", "Antiguo", "Oscuro", "Divino"];
    return new Promise((resolve) => {
      setTimeout(() => resolve(traces[Math.floor(Math.random() * traces.length)]), duration);
    });
  }

  async teleport(duration: number): Promise<void> {
    soundManager.play("magic");
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
    soundManager.play("magic");
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
}
