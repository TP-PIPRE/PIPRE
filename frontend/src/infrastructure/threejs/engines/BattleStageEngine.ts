import * as THREE from "three";
import { MapControls } from "three/addons/controls/MapControls.js";
import { EffectComposer } from "postprocessing";
import { BattleBotBuilder } from "../shared/BattleBotBuilder";
import { ParticleSystem } from "../shared/ParticleSystem";
import { createSceneWithCamera, createShadowFloor, createStarfield } from "../shared/SceneUtils";
import { createEffectComposer, BLOOM_PRESETS } from "../shared/EffectComposerSetup";
import { soundManager } from "../shared/SoundManager";
import { GhostPreview } from "../shared/GhostPreview";
import { RobotPersonality } from "../shared/RobotPersonality";
import { CinematicCamera } from "../shared/CinematicCamera";
import { BlockBar3D } from "../shared/BlockBar3D";
import type { ISimulatorEngine } from "../../ports/ISimulatorEngine";

export class BattleStageEngine implements ISimulatorEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private composer!: EffectComposer;
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
  private ghostPreview!: GhostPreview;
  private levelObstacles: THREE.Mesh[] = [];
  private goalBeacon: THREE.Mesh | null = null;
  private ambientEmbers: THREE.Points | null = null;
  private lavaRivers: THREE.Mesh[] = [];
  private robotPersonality!: RobotPersonality;
  private cinematicCamera!: CinematicCamera;
  private blockBar!: BlockBar3D;

  constructor() {
    const { scene, camera } = createSceneWithCamera({
      fov: 50,
      cameraPos: [20, 16, 20],
      fogColor: "#2a0a05",
      fogNear: 25,
      fogFar: 65,
      bgColor: "#2a0a05",
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

    createShadowFloor(this.scene, 80, -0.5, "#0d0812");
    createStarfield(this.scene, 300, 60, 3, 25, "#ff8866", 0.1, 0.3);

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

    // Lava glow point lights
    const lavaLights = [
      { pos: [-15, 0.3, -20], color: "#ff4400", intensity: 0.8, distance: 15 },
      { pos: [15, 0.3, 20], color: "#ff4400", intensity: 0.8, distance: 15 },
    ];
    lavaLights.forEach(({ pos, color, intensity, distance }) => {
      const light = new THREE.PointLight(color, intensity, distance);
      light.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(light);
    });

    this.botParts = BattleBotBuilder.create();
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
    // Coliseum floor - dark metal with glowing grid
    const floorGeo = new THREE.PlaneGeometry(80, 80, 20, 20);
    // Deform floor slightly for uneven terrain
    const posAttr = floorGeo.getAttribute("position");
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getY(i);
      posAttr.setZ(i, (Math.sin(x * 0.3) * Math.cos(z * 0.3)) * 0.15);
    }
    floorGeo.computeVertexNormals();
    const floorMat = new THREE.MeshStandardMaterial({
      color: "#1a1a2e",
      roughness: 0.7,
      metalness: 0.8,
      emissive: "#0a0a14",
      emissiveIntensity: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.6;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Glowing hexagonal floor pattern overlay
    const patternGeo = new THREE.PlaneGeometry(76, 76);
    const patternMat = new THREE.MeshBasicMaterial({
      color: "#e94560",
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const pattern = new THREE.Mesh(patternGeo, patternMat);
    pattern.rotation.x = -Math.PI / 2;
    pattern.position.y = -0.59;
    this.scene.add(pattern);

    // Grid lines (hex-style) - thin glowing red grid
    const gridHelper = new THREE.GridHelper(80, 40, "#e94560", "#1a1020");
    gridHelper.position.y = -0.58;
    gridHelper.material.opacity = 0.15;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);

    // Lava rivers on the sides
    const lavaMat = new THREE.MeshStandardMaterial({
      color: "#ff4400",
      emissive: "#ff4400",
      emissiveIntensity: 1.5,
      roughness: 0.2,
      metalness: 0.1,
    });
    const lavaRivers = [
      { x: -18, z: 0, w: 2, d: 60 },
      { x: 18, z: 0, w: 2, d: 60 },
    ];
    lavaRivers.forEach((r) => {
      const lavaGeo = new THREE.PlaneGeometry(r.w, r.d);
      const lava = new THREE.Mesh(lavaGeo, lavaMat.clone());
      lava.rotation.x = -Math.PI / 2;
      lava.position.set(r.x, -0.55, r.z);
      this.scene.add(lava);
      this.lavaRivers.push(lava);
    });

    // Arena walls - tall imposing walls with neon edges
    const wallMat = new THREE.MeshStandardMaterial({
      color: "#1a1a30",
      roughness: 0.5,
      metalness: 0.9,
      emissive: "#0a0810",
      emissiveIntensity: 0.1,
    });
    const wallConfigs = [
      { pos: [0, 3.5, -22], size: [48, 7, 1.5] },
      { pos: [0, 3.5, 22], size: [48, 7, 1.5] },
      { pos: [-24, 3.5, 0], size: [1.5, 7, 44] },
      { pos: [24, 3.5, 0], size: [1.5, 7, 44] },
    ];
    wallConfigs.forEach((w) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w.size[0], w.size[1], w.size[2]), wallMat);
      wall.position.set(w.pos[0], w.pos[1], w.pos[2]);
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.scene.add(wall);
    });

    // Turrets on wall corners
    const turretMat = new THREE.MeshStandardMaterial({
      color: "#e94560",
      emissive: "#e94560",
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.7,
    });
    const turretPositions = [
      [-22, 3.5, -20], [22, 3.5, -20],
      [-22, 3.5, 20], [22, 3.5, 20],
    ];
    turretPositions.forEach((pos) => {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 2, 16), turretMat);
      base.position.set(pos[0], pos[1] - 4, pos[2]);
      base.castShadow = true;
      this.scene.add(base);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2, 8), turretMat);
      barrel.position.set(pos[0], pos[1] - 3, pos[2]);
      barrel.rotation.x = Math.PI / 2;
      this.scene.add(barrel);
    });

    // High platforms with glow edges
    const platMat = new THREE.MeshStandardMaterial({
      color: "#2a1a40",
      roughness: 0.5,
      metalness: 0.6,
      emissive: "#1a0a25",
      emissiveIntensity: 0.2,
    });
    const platPositions = [[-8, 0.3, -10], [8, 0.3, -8], [-5, 0.3, 8], [10, 0.3, 5]];
    platPositions.forEach((pos) => {
      const plat = new THREE.Mesh(new THREE.BoxGeometry(4, 0.6, 4), platMat);
      plat.position.set(pos[0], pos[1], pos[2]);
      plat.castShadow = true;
      plat.receiveShadow = true;
      this.scene.add(plat);
      // Glow edge
      const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(4, 0.6, 4));
      const edgeLine = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: "#e94560", transparent: true, opacity: 0.3 }));
      edgeLine.position.copy(plat.position);
      this.scene.add(edgeLine);
    });

    // Enemies - intimidating combat bots
    const enemyBodyMat = new THREE.MeshStandardMaterial({
      color: "#ff3333",
      emissive: "#ff3333",
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.6,
    });
    for (let i = 0; i < 4; i++) {
      // Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 1.4, 2, 2, 2), enemyBodyMat);
      body.position.set(-12 + i * 7, 0.9, -14);
      body.castShadow = true;
      this.scene.add(body);

      // Canon arm
      const armGeo = new THREE.CylinderGeometry(0.15, 0.2, 1, 8);
      const arm = new THREE.Mesh(armGeo, turretMat);
      arm.rotation.x = Math.PI / 2;
      arm.position.set(-12 + i * 7, 0.7, -13);
      this.scene.add(arm);

      // Eyes
      const eyeGeo = new THREE.SphereGeometry(0.12, 8, 8);
      const eyeMat = new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 2 });
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(-12 + i * 7, 1.4, -13.6);
      this.scene.add(eye);

      this.enemies.push(body);
    }

    // Crates with glow
    for (let i = 0; i < 8; i++) {
      const crate = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.7, 0.7),
        new THREE.MeshStandardMaterial({ color: "#e94560", roughness: 0.4, emissive: "#e94560", emissiveIntensity: 0.2 })
      );
      crate.position.set(-7 + i * 2.2, 0.35, -3 + (i % 3 - 1) * 3);
      crate.castShadow = true;
      this.scene.add(crate);
    }

    // Ambient floating embers
    const emberCount = 80;
    const emberGeo = new THREE.BufferGeometry();
    const emberPositions = new Float32Array(emberCount * 3);
    for (let i = 0; i < emberCount; i++) {
      emberPositions[i * 3] = (Math.random() - 0.5) * 40;
      emberPositions[i * 3 + 1] = Math.random() * 10;
      emberPositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    emberGeo.setAttribute("position", new THREE.BufferAttribute(emberPositions, 3));
    const emberMat = new THREE.PointsMaterial({
      color: "#ff8844",
      size: 0.15,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.ambientEmbers = new THREE.Points(emberGeo, emberMat);
    this.scene.add(this.ambientEmbers);
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

    this.composer = createEffectComposer(this.renderer, this.scene, this.camera, BLOOM_PRESETS.battle);

    this.controls = new MapControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 55;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.controls.target.set(0, 0.5, 0);
    this.controls.update();

    this.cinematicCamera = new CinematicCamera(this.camera, this.controls);

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

      if (this.botParts.radar.visible) {
        const child = this.botParts.radar.children[1];
        if (child) {
          child.scale.setScalar(1 + Math.sin(Date.now() * 0.005) * 0.1);
        }
      }

      // Enemy hover animation
      this.enemies.forEach((e, i) => {
        e.position.y = 0.75 + Math.sin(Date.now() * 0.003 + i) * 0.1;
        e.rotation.y += 0.01 * Math.sin(Date.now() * 0.002 + i);
      });

      this.ghostPreview.animate(Date.now() * 0.001);

      if (this.goalBeacon) {
        const t = Date.now() * 0.001;
        this.goalBeacon.rotation.z += 0.01;
        this.goalBeacon.scale.setScalar(1 + Math.sin(t * 2) * 0.1);
      }

      // Animate lava glow
      const lavaTime = Date.now() * 0.001;
      this.lavaRivers.forEach((l, i) => {
        const mat = l.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 1.2 + Math.sin(lavaTime * 3 + i) * 0.4;
      });

      // Animate embers rising
      if (this.ambientEmbers) {
        const pos = this.ambientEmbers.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < pos.length; i += 3) {
          pos[i + 1] += 0.02;
          if (pos[i + 1] > 10) pos[i + 1] = 0;
          pos[i] += (Math.sin(lavaTime + i) * 0.01);
        }
        this.ambientEmbers.geometry.attributes.position.needsUpdate = true;
      }

      this.robotPersonality.update(0.016);
      this.blockBar.animate(Date.now() * 0.001);
      this.composer.render();
    };
    animate();
  }

  async moveForward(distance: number, duration: number): Promise<void> {
    soundManager.play("move");
    return this.animatePosition(distance, duration, false);
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
    soundManager.play("attack");
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
        const origEmissive = (enemy.material as THREE.MeshStandardMaterial).emissive.getHex();
        (enemy.material as THREE.MeshStandardMaterial).emissive.set("#ffffff");
        (enemy.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5;
        setTimeout(() => {
          (enemy.material as THREE.MeshStandardMaterial).emissive.setHex(origEmissive);
          (enemy.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4;
        }, 150);
        this.score += 100;
      }
    }
    return new Promise((resolve) => setTimeout(resolve, duration));
  }

  async activateShield(duration: number): Promise<void> {
    soundManager.play("shield");
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
    soundManager.play("scan");
    this.triggerParticles(this.botGroup.position.x, this.botGroup.position.z, "scan");
    const count = this.enemies.filter((e) => {
      const mat = e.material as THREE.MeshStandardMaterial;
      return mat.opacity === undefined || mat.opacity > 0.5;
    }).length;
    return new Promise((resolve) => setTimeout(() => resolve(count), duration));
  }

  async strike(duration: number): Promise<void> {
    soundManager.play("attack");
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
        const origEmissive = (enemy.material as THREE.MeshStandardMaterial).emissive.getHex();
        (enemy.material as THREE.MeshStandardMaterial).emissive.set("#ffffff");
        (enemy.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5;
        setTimeout(() => {
          (enemy.material as THREE.MeshStandardMaterial).emissive.setHex(origEmissive);
          (enemy.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4;
        }, 150);
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
