import * as THREE from "three";
import { MapControls } from "three/addons/controls/MapControls.js";
import { RaceBotBuilder } from "../shared/RaceBotBuilder";
import { ParticleSystem } from "../shared/ParticleSystem";
import { createSceneWithCamera } from "../shared/SceneUtils";
import type { ISimulatorEngine } from "../../ports/ISimulatorEngine";
import { EffectComposer } from "postprocessing";
import { createEffectComposer, BLOOM_PRESETS } from "../shared/EffectComposerSetup";
import { soundManager } from "../shared/SoundManager";
import { GhostPreview } from "../shared/GhostPreview";
import { RobotPersonality } from "../shared/RobotPersonality";
import { CinematicCamera } from "../shared/CinematicCamera";
import { BlockBar3D } from "../shared/BlockBar3D";

export class RaceStageEngine implements ISimulatorEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private composer!: EffectComposer;
  private botGroup: THREE.Group;
  private botParts: ReturnType<typeof RaceBotBuilder.create>;
  private ultrasonicCone: THREE.Mesh;
  private particles: ParticleSystem;
  private animationId: number | null = null;
  private clock: THREE.Clock;
  private controls!: MapControls;
  private isRunning = false;
  private checkpoints: { mesh: THREE.Mesh; passed: boolean }[] = [];
  private cones: THREE.Mesh[] = [];
  private ghostPreview!: GhostPreview;
  private levelObstacles: THREE.Mesh[] = [];
  private goalBeacon: THREE.Mesh | null = null;
  private speedTrails: THREE.Mesh[] = [];
  private robotPersonality!: RobotPersonality;
  private cinematicCamera!: CinematicCamera;
  private blockBar!: BlockBar3D;

  constructor() {
    const setup = createSceneWithCamera({
      fov: 55,
      cameraPos: [25, 22, 25],
      fogColor: "#1a1210",
      fogNear: 30,
      fogFar: 90,
      bgColor: "#1a1210",
      ambientColor: "#443322",
      skyColor: "#554433",
      groundColor: "#1a1210",
      dirColor: "#ffcc88",
      dirIntensity: 1.4,
      dirPos: [10, 25, 5],
      shadowMapSize: 2048,
      shadowCameraSize: 40,
    });
    this.scene = setup.scene;
    this.camera = setup.camera;

    this.clock = new THREE.Clock();

    this.botParts = RaceBotBuilder.create();
    this.botGroup = this.botParts.group;
    this.botGroup.position.set(-25, 0, 0);
    this.ultrasonicCone = this.createUltrasonicCone();
    this.botGroup.add(this.ultrasonicCone);
    this.scene.add(this.botGroup);
    this.robotPersonality = new RobotPersonality(this.scene, this.botGroup);
    this.blockBar = new BlockBar3D(this.scene);
    this.particles = new ParticleSystem(this.scene);
    this.ghostPreview = new GhostPreview(this.scene);
    this.createEnvironment();
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
    // Race track floor - dark asphalt
    const trackGeo = new THREE.PlaneGeometry(80, 40);
    const trackMat = new THREE.MeshStandardMaterial({
      color: "#1a1a1e",
      roughness: 0.85,
      metalness: 0.1,
    });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.rotation.x = -Math.PI / 2;
    track.position.y = -0.5;
    track.receiveShadow = true;
    this.scene.add(track);

    // Neon lane lines on track
    const laneMat = new THREE.MeshBasicMaterial({
      color: "#f59e0b",
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    for (let z = -14; z <= 14; z += 4) {
      const lineGeo = new THREE.PlaneGeometry(76, 0.15);
      const line = new THREE.Mesh(lineGeo, laneMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, -0.47, z);
      this.scene.add(line);
    }

    // Grid (subtle)
    const grid = new THREE.GridHelper(80, 40, "#f59e0b", "#2a2a2e");
    grid.position.y = -0.48;
    grid.material.opacity = 0.1;
    grid.material.transparent = true;
    grid.name = "environment_grid";
    this.scene.add(grid);

    // Neon barriers instead of boring walls
    const barrierGlowMat = new THREE.MeshStandardMaterial({
      color: "#f59e0b",
      emissive: "#f59e0b",
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.3,
    });
    const barrierCoreMat = new THREE.MeshStandardMaterial({
      color: "#2d3748",
      roughness: 0.6,
      metalness: 0.7,
    });

    const barriers = [
      { x: 0, z: -18, w: 80, h: 1 },
      { x: 0, z: 18, w: 80, h: 1 },
      { x: -38, z: 0, w: 1, h: 36 },
      { x: 38, z: 0, w: 1, h: 36 },
    ];

    barriers.forEach((b) => {
      // Core barrier
      const core = new THREE.Mesh(
        new THREE.BoxGeometry(b.w, 0.6, b.h),
        barrierCoreMat
      );
      core.position.set(b.x, 0, b.z);
      core.castShadow = true;
      core.receiveShadow = true;
      this.scene.add(core);

      // Glowing strip on top
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(b.w - 1, 0.06, 0.15),
        barrierGlowMat
      );
      strip.position.set(b.x, 0.33, b.z);
      this.scene.add(strip);
    });

    // Checkered start line
    const startLine = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 30),
      new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.25, side: THREE.DoubleSide })
    );
    startLine.rotation.x = -Math.PI / 2;
    startLine.position.set(-30, -0.47, 0);
    this.scene.add(startLine);

    // Goal line - glowing green
    const goalLine = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 30),
      new THREE.MeshBasicMaterial({ color: "#22c55e", transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false })
    );
    goalLine.rotation.x = -Math.PI / 2;
    goalLine.position.set(30, -0.47, 0);
    this.scene.add(goalLine);

    // Animated goal beacon
    const goalPillar1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.2, 3, 8),
      new THREE.MeshStandardMaterial({ color: "#22c55e", emissive: "#22c55e", emissiveIntensity: 0.5 })
    );
    goalPillar1.position.set(28, 1, -2);
    this.scene.add(goalPillar1);
    const goalPillar2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.2, 3, 8),
      new THREE.MeshStandardMaterial({ color: "#22c55e", emissive: "#22c55e", emissiveIntensity: 0.5 })
    );
    goalPillar2.position.set(28, 1, 2);
    this.scene.add(goalPillar2);
    // Goal glow
    const goalGlow = new THREE.PointLight("#22c55e", 0.6, 8);
    goalGlow.position.set(29, 1.5, 0);
    this.scene.add(goalGlow);

    // Checkpoints with glowing rings
    const checkpointPositions = [{ x: 0, z: -16 }, { x: 25, z: 0 }, { x: 0, z: 16 }];
    checkpointPositions.forEach((pos) => {
      const ringGeo = new THREE.TorusGeometry(1, 0.08, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: "#3b82f6",
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(pos.x, 0.5, pos.z);
      ring.name = "checkpoint_ring";
      this.scene.add(ring);

      const cpPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 24),
        new THREE.MeshBasicMaterial({ color: "#3b82f6", transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthWrite: false })
      );
      cpPlane.rotation.x = -Math.PI / 2;
      cpPlane.position.set(pos.x, -0.47, pos.z);
      this.scene.add(cpPlane);
      this.checkpoints.push({ mesh: cpPlane, passed: false });

      // Ring light
      const ringLight = new THREE.PointLight("#3b82f6", 0.3, 5);
      ringLight.position.copy(ring.position);
      this.scene.add(ringLight);
    });

    // Cones with glowing bases
    const coneBodyMat = new THREE.MeshStandardMaterial({
      color: "#ef4444",
      emissive: "#ef4444",
      emissiveIntensity: 0.15,
      roughness: 0.5,
    });
    for (let i = 0; i < 12; i++) {
      const coneHeight = 1;
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.5, coneHeight, 8),
        coneBodyMat
      );
      const zOff = i % 3 === 0 ? 0 : i % 3 === 1 ? -4 : 4;
      cone.position.set(-22 + i * 4, coneHeight / 2, zOff);
      this.scene.add(cone);

      // Glow ring at base
      const baseRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.6, 0.05, 8, 16),
        new THREE.MeshBasicMaterial({ color: "#ef4444", transparent: true, opacity: 0.4 })
      );
      baseRing.rotation.x = Math.PI / 2;
      baseRing.position.set(-22 + i * 4, 0.15, zOff);
      this.scene.add(baseRing);
    }

    // Ramps with neon edges
    const rampMat = new THREE.MeshStandardMaterial({
      color: "#eab308",
      roughness: 0.5,
      emissive: "#eab308",
      emissiveIntensity: 0.15,
    });
    const rampPositions = [
      { x: -10, z: -10, rot: 0.15 },
      { x: 10, z: 10, rot: -0.15 },
      { x: 20, z: -12, rot: 0.12 },
    ];
    rampPositions.forEach((r) => {
      const ramp = new THREE.Mesh(new THREE.BoxGeometry(4, 0.5, 4), rampMat);
      ramp.position.set(r.x, 0, r.z);
      ramp.rotation.z = r.rot;
      ramp.castShadow = true;
      this.scene.add(ramp);

      const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(4, 0.5, 4));
      const edgeLine = new THREE.LineSegments(
        edgeGeo,
        new THREE.LineBasicMaterial({ color: "#f59e0b", transparent: true, opacity: 0.5 })
      );
      edgeLine.position.copy(ramp.position);
      edgeLine.rotation.copy(ramp.rotation);
      this.scene.add(edgeLine);
    });

    // Grandstand with crowd silhouettes
    const standMat = new THREE.MeshStandardMaterial({
      color: "#1e2028",
      roughness: 0.6,
      metalness: 0.4,
      emissive: "#0a0a0f",
      emissiveIntensity: 0.1,
    });
    for (let row = 0; row < 4; row++) {
      const standRow = new THREE.Mesh(
        new THREE.BoxGeometry(14, 0.4, 1.2),
        standMat
      );
      standRow.position.set(-28, row * 0.6 + 0.3, 14 - row * 0.3);
      this.scene.add(standRow);
      // Crowd dots
      for (let c = 0; c < 12; c++) {
        if (Math.random() > 0.3) {
          const crowd = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 4, 4),
            new THREE.MeshBasicMaterial({ color: ["#e94560", "#f59e0b", "#3b82f6", "#22c55e"][Math.floor(Math.random() * 4)] })
          );
          crowd.position.set(-28 + c * 1.2 - 6, row * 0.6 + 0.7, 14 - row * 0.3);
          this.scene.add(crowd);
        }
      }
    }

    // Finish arch
    const archMat = new THREE.MeshStandardMaterial({
      color: "#f59e0b",
      emissive: "#f59e0b",
      emissiveIntensity: 0.6,
      roughness: 0.2,
    });
    const archPillar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 4, 8), archMat);
    archPillar1.position.set(29, 1.5, -5);
    this.scene.add(archPillar1);
    const archPillar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 4, 8), archMat);
    archPillar2.position.set(29, 1.5, 5);
    this.scene.add(archPillar2);
    const archTop = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.3, 10.5),
      new THREE.MeshStandardMaterial({ color: "#22c55e", emissive: "#22c55e", emissiveIntensity: 0.8, roughness: 0.2 })
    );
    archTop.position.set(29, 3.5, 0);
    this.scene.add(archTop);

    // Speed trail glow paths (visual only)
    const trailMat = new THREE.MeshBasicMaterial({
      color: "#f59e0b",
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < 3; i++) {
      const trail = new THREE.Mesh(new THREE.PlaneGeometry(28, 0.5), trailMat);
      trail.rotation.x = -Math.PI / 2;
      trail.position.set(-25 + i * 25, -0.46, 0);
      this.scene.add(trail);
      this.speedTrails.push(trail);
    }
  }

  init(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.composer = createEffectComposer(this.renderer, this.scene, this.camera, BLOOM_PRESETS.obstacle);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.controls = new MapControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 60;
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

  getState(): Record<string, unknown> {
    return { checkpointsPassed: this.checkpoints.filter(cp => cp.passed).length };
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
      // Spin wheels when visible
      if (this.botParts.wheels.visible) {
        this.botParts.wheels.children.forEach((c) => {
          if (c instanceof THREE.Mesh && c.geometry.type === "TorusGeometry") {
            c.rotation.x += 0.05;
          }
        });
      }
      const t = this.clock.getElapsedTime();
      // Gentle cone pulsing
      this.cones.forEach((cone) => {
        const s = 1 + Math.sin(t * 2 + cone.position.x) * 0.06;
        cone.scale.setScalar(s);
      });
      // Checkpoint animation: gates that glow when passed
      this.checkpoints.forEach((cp) => {
        if (cp.passed) {
          const mat = cp.mesh.material as THREE.MeshBasicMaterial;
          mat.opacity = 0.3 + Math.sin(t * 3) * 0.2;
        }
      });
      this.ghostPreview.animate(Date.now() * 0.001);

      if (this.goalBeacon) {
        const t = Date.now() * 0.001;
        this.goalBeacon.rotation.z += 0.01;
        this.goalBeacon.scale.setScalar(1 + Math.sin(t * 2) * 0.1);
      }

      // Pulse speed trail opacity
      const trailT = Date.now() * 0.002;
      this.speedTrails.forEach((trail, i) => {
        (trail.material as THREE.MeshBasicMaterial).opacity = 0.05 + Math.sin(trailT * 2 + i) * 0.04;
      });

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
    soundManager.play("boost");
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
    soundManager.play("move");
    return new Promise((resolve) => setTimeout(resolve, duration));
  }

  async jump(duration: number): Promise<void> {
    soundManager.play("takeoff");
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
    soundManager.play("move");
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
    soundManager.play("error");
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
