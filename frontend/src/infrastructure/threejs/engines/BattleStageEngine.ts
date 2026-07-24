import * as THREE from "three";
import { MapControls } from "three/addons/controls/MapControls.js";
import { EffectComposer } from "postprocessing";
import { BattleBotBuilder } from "../shared/BattleBotBuilder";
import { ParticleSystem } from "../shared/ParticleSystem";
import { createSceneWithCamera } from "../shared/SceneUtils";
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
  private robotPersonality!: RobotPersonality;
  private torretaLasers: THREE.Line[] = [];
  private generatorRings: THREE.Mesh[] = [];
  private arenaFloor!: THREE.Mesh;
  private cinematicCamera!: CinematicCamera;
  private blockBar!: BlockBar3D;

  constructor() {
    const { scene, camera } = createSceneWithCamera({
      fov: 50,
      cameraPos: [20, 16, 20],
      fogColor: "#0a0505",
      fogNear: 20,
      fogFar: 70,
      bgColor: "#0a0505",
      ambientColor: "#442222",
      skyColor: "#661111",
      groundColor: "#0a0505",
      hemiIntensity: 0.4,
      dirColor: "#ffcc88",
      dirIntensity: 1.5,
      dirPos: [10, 20, 10],
      shadowMapSize: 2048,
      shadowCameraSize: 35,
    });

    this.scene = scene;
    this.camera = camera;
    this.clock = new THREE.Clock();

    // Main drama light from above center
    const mainLight = new THREE.SpotLight("#ffffff", 3, 50, Math.PI / 5, 0.3, 1);
    mainLight.position.set(0, 20, 0);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    this.scene.add(mainLight);

    // Lava glow lights around the ring
    const lavaRing = [
      { pos: [0, 0.2, -18], color: "#ff3300" },
      { pos: [0, 0.2, 18], color: "#ff3300" },
      { pos: [-18, 0.2, 0], color: "#ff4400" },
      { pos: [18, 0.2, 0], color: "#ff4400" },
    ];
    lavaRing.forEach(({ pos, color }) => {
      const light = new THREE.PointLight(color, 1.2, 22);
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
    // ===== CIRCULAR ARENA FLOOR (concave bowl) =====
    const floorGeo = new THREE.CylinderGeometry(18, 16, 1.5, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: "#2a2a35",
      roughness: 0.5,
      metalness: 0.9,
      emissive: "#0a0a10",
      emissiveIntensity: 0.15,
    });
    this.arenaFloor = new THREE.Mesh(floorGeo, floorMat);
    this.arenaFloor.position.y = -1.8;
    this.arenaFloor.receiveShadow = true;
    this.scene.add(this.arenaFloor);

    // Metal grid overlay on floor
    const gridGeo = new THREE.RingGeometry(1, 17, 64);
    const gridMat = new THREE.MeshBasicMaterial({
      color: "#e94560",
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const grid = new THREE.Mesh(gridGeo, gridMat);
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = -1.0;
    this.scene.add(grid);

    // ===== GRADAS (stepped seating around arena) =====
    const seatMat = new THREE.MeshStandardMaterial({
      color: "#1e2430",
      roughness: 0.7,
      metalness: 0.5,
    });
    for (let row = 1; row <= 5; row++) {
      const radius = 18.5 + row * 1.2;
      const stepGeo = new THREE.TorusGeometry(radius, 0.4, 8, 64);
      const step = new THREE.Mesh(stepGeo, seatMat);
      step.rotation.x = Math.PI / 2;
      step.position.y = -1.5 + row * 0.7;
      step.receiveShadow = true;
      this.scene.add(step);

      // Crowd dots
      const crowdColors = ["#e94560", "#f59e0b", "#3b82f6", "#22c55e", "#a855f7"];
      for (let c = 0; c < 30; c++) {
        if (Math.random() > 0.25) {
          const angle = (c / 30) * Math.PI * 2;
          const cx = Math.cos(angle) * radius;
          const cz = Math.sin(angle) * radius;
          const dot = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 4, 4),
            new THREE.MeshBasicMaterial({ color: crowdColors[Math.floor(Math.random() * 5)] })
          );
          dot.position.set(cx, -1.5 + row * 0.7 + 0.35, cz);
          this.scene.add(dot);
        }
      }
    }

    // ===== LAVA FOSO (ring around arena) =====
    const lavaGeo = new THREE.TorusGeometry(19.5, 0.8, 16, 64);
    const lavaMat = new THREE.MeshStandardMaterial({
      color: "#ff3300",
      emissive: "#ff3300",
      emissiveIntensity: 2.0,
      roughness: 0.1,
      metalness: 0.05,
    });
    const lava = new THREE.Mesh(lavaGeo, lavaMat);
    lava.rotation.x = Math.PI / 2;
    lava.position.y = -0.55;
    lava.name = "lava_ring";
    this.scene.add(lava);

    // Lava embers
    const emberCount = 150;
    const emberGeo = new THREE.BufferGeometry();
    const emberPos = new Float32Array(emberCount * 3);
    for (let i = 0; i < emberCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 19 + Math.random() * 1.5;
      emberPos[i * 3] = Math.cos(angle) * r;
      emberPos[i * 3 + 1] = Math.random() * 4;
      emberPos[i * 3 + 2] = Math.sin(angle) * r;
    }
    emberGeo.setAttribute("position", new THREE.BufferAttribute(emberPos, 3));
    this.ambientEmbers = new THREE.Points(emberGeo, new THREE.PointsMaterial({
      color: "#ff8844", size: 0.12, transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    this.scene.add(this.ambientEmbers);

    // ===== 4 PILARES INDUSTRIALES + PLATAFORMAS =====
    const pillarPositions: [number, number][] = [[-10, -10], [10, -10], [-10, 10], [10, 10]];
    const pillarMat = new THREE.MeshStandardMaterial({
      color: "#334455", roughness: 0.5, metalness: 0.8, emissive: "#111822", emissiveIntensity: 0.1,
    });
    const platMat2 = new THREE.MeshStandardMaterial({
      color: "#222a35", roughness: 0.4, metalness: 0.7, emissive: "#0a0f15", emissiveIntensity: 0.2,
    });

    pillarPositions.forEach(([px, pz]) => {
      // Main pillar
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 10, 16), pillarMat);
      pillar.position.set(px, 4, pz);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.scene.add(pillar);

      // Top glow disc
      const discGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.1, 16);
      const discMat = new THREE.MeshStandardMaterial({
        color: "#e94560", emissive: "#e94560", emissiveIntensity: 0.5, roughness: 0.2,
      });
      const disc = new THREE.Mesh(discGeo, discMat);
      disc.position.set(px, 9.2, pz);
      this.scene.add(disc);

      // Platform at mid-height
      const plat = new THREE.Mesh(new THREE.BoxGeometry(4, 0.3, 4), platMat2);
      plat.position.set(px, 5.5, pz);
      plat.castShadow = true;
      plat.receiveShadow = true;
      this.scene.add(plat);
      // Glow edge
      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(4, 0.3, 4)),
        new THREE.LineBasicMaterial({ color: "#e94560", transparent: true, opacity: 0.25 })
      );
      edge.position.copy(plat.position);
      this.scene.add(edge);
    });

    // ===== BRIDGES between platforms =====
    const bridgePairs: [[number, number], [number, number]][] = [[pillarPositions[0], pillarPositions[1]], [pillarPositions[2], pillarPositions[3]]];
    bridgePairs.forEach(([a, b]) => {
      const midX = (a[0] + b[0]) / 2;
      const midZ = (a[1] + b[1]) / 2;
      const length = Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2);
      const angle = Math.atan2(b[1]-a[1], b[0]-a[0]);
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(length, 0.15, 0.6), platMat2);
      bridge.position.set(midX, 5.5, midZ);
      bridge.rotation.y = angle;
      bridge.castShadow = true;
      this.scene.add(bridge);
    });

    // ===== GENERATOR CENTRAL (metallic reactor) =====
    const genMat = new THREE.MeshStandardMaterial({
      color: "#667788", roughness: 0.2, metalness: 0.95, emissive: "#112233", emissiveIntensity: 0.1,
    });
    const core = new THREE.Mesh(new THREE.SphereGeometry(2, 32, 32), genMat);
    core.position.set(0, 1, 0);
    core.castShadow = true;
    this.scene.add(core);

    // Rotating rings
    for (let r = 0; r < 3; r++) {
      const ringGeo = new THREE.TorusGeometry(2.3 + r * 0.6, 0.12, 16, 48);
      const ringMat = new THREE.MeshStandardMaterial({
        color: ["#e94560", "#f59e0b", "#3b82f6"][r],
        emissive: ["#e94560", "#f59e0b", "#3b82f6"][r],
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.5,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(0, 1, 0);
      ring.rotation.x = (r * Math.PI) / 3;
      ring.rotation.y = (r * Math.PI) / 4;
      ring.name = `gen_ring_${r}`;
      this.scene.add(ring);
      this.generatorRings.push(ring);
    }

    // Core glow light
    const coreLight = new THREE.PointLight("#e94560", 0.8, 12);
    coreLight.position.set(0, 1, 0);
    this.scene.add(coreLight);

    // ===== TORRETAS (4 corners, above gradas) =====
    const turretMat = new THREE.MeshStandardMaterial({
      color: "#445566", roughness: 0.3, metalness: 0.9, emissive: "#111822", emissiveIntensity: 0.1,
    });
    const barrelMat = new THREE.MeshStandardMaterial({
      color: "#e94560", emissive: "#e94560", emissiveIntensity: 0.4, roughness: 0.2, metalness: 0.4,
    });
    const turretBasePositions = [[-22, -22], [22, -22], [-22, 22], [22, 22]];

    turretBasePositions.forEach(([tx, tz]) => {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 3, 12), turretMat);
      base.position.set(tx, 0.5, tz);
      this.scene.add(base);

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 2.5, 8), barrelMat);
      barrel.position.set(tx, 2, tz);
      barrel.rotation.x = Math.PI / 2;
      barrel.lookAt(new THREE.Vector3(0, 1, 0));
      barrel.name = `turret_barrel_${tx}_${tz}`;
      this.scene.add(barrel);

      // Laser beam (thin line to center)
      const laserPoints = [new THREE.Vector3(tx, 2, tz), new THREE.Vector3(0, 1, 0)];
      const laserGeo = new THREE.BufferGeometry().setFromPoints(laserPoints);
      const laserMat = new THREE.LineDashedMaterial({
        color: "#e94560", transparent: true, opacity: 0.3, dashSize: 0.5, gapSize: 0.3, depthWrite: false,
      });
      const laser = new THREE.Line(laserGeo, laserMat);
      laser.computeLineDistances();
      laser.name = "turret_laser";
      this.scene.add(laser);
      this.torretaLasers.push(laser);
    });

    // ===== ENEMIES with patrol routes =====
    // Store enemy data for patrol
    (this as any)._enemyData = [];

    const enemyBodyMat = new THREE.MeshStandardMaterial({
      color: "#ff3333", emissive: "#ff3333", emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.6,
    });
    const enemyAngles = [0.3, 1.8, 3.5, 5.2];

    enemyAngles.forEach((angle) => {
      const orbitRadius = 7;
      const ex = Math.cos(angle) * orbitRadius;
      const ez = Math.sin(angle) * orbitRadius;

      const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 1.4, 2, 2, 2), enemyBodyMat);
      body.position.set(ex, 0.8, ez);
      body.castShadow = true;
      this.scene.add(body);

      // Cannon
      const cannon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.18, 1, 8),
        barrelMat
      );
      cannon.rotation.x = Math.PI / 2;
      cannon.position.set(ex, 0.7, ez - 0.8);
      cannon.name = "enemy_cannon";
      body.add(cannon);

      // Eye
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 3 })
      );
      eye.position.set(0, 0.3, -0.8);
      body.add(eye);

      this.enemies.push(body);
      (this as any)._enemyData.push({ body, cannon, angle, orbitRadius, speed: 0.002 + Math.random() * 0.003, patrolAngle: angle });
    });

    // ===== DEBRIS PILES =====
    for (let i = 0; i < 12; i++) {
      const debris = new THREE.Mesh(
        new THREE.BoxGeometry(0.3 + Math.random() * 0.4, 0.2 + Math.random() * 0.3, 0.3 + Math.random() * 0.4),
        new THREE.MeshStandardMaterial({ color: "#334455", roughness: 0.7, metalness: 0.6 })
      );
      const a = Math.random() * Math.PI * 2;
      const r = 3 + Math.random() * 12;
      debris.position.set(Math.cos(a) * r, 0.1, Math.sin(a) * r);
      debris.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      debris.castShadow = true;
      this.scene.add(debris);
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

      // Animate lava embers rising from the ring
      if (this.ambientEmbers) {
        const pos = (this.ambientEmbers as THREE.Points).geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < pos.length; i += 3) {
          pos[i + 1] += 0.03;
          if (pos[i + 1] > 4) { pos[i + 1] = 0; }
        }
        (this.ambientEmbers as THREE.Points).geometry.attributes.position.needsUpdate = true;
      }

      // Rotate generator rings
      this.generatorRings.forEach((ring, i) => {
        ring.rotation.x += 0.003 * (i + 1);
        ring.rotation.y += 0.005 * (i + 1);
      });

      // Update laser dash offsets
      this.torretaLasers.forEach((laser) => {
        if (laser.material instanceof THREE.LineDashedMaterial) {
          laser.material.opacity = 0.2 + Math.sin(Date.now() * 0.005) * 0.1;
        }
      });

      // Animate lava glow pulsing
      const lavaRing = this.scene.getObjectByName("lava_ring") as THREE.Mesh;
      if (lavaRing) {
        const mat = lavaRing.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 1.8 + Math.sin(Date.now() * 0.004) * 0.3;
      }

      // PATROL enemies in orbit around generator
      const enemyData = (this as any)._enemyData;
      if (enemyData) {
        enemyData.forEach((ed: any) => {
          ed.patrolAngle += ed.speed;
          const ex = Math.cos(ed.patrolAngle) * ed.orbitRadius;
          const ez = Math.sin(ed.patrolAngle) * ed.orbitRadius;
          ed.body.position.x += (ex - ed.body.position.x) * 0.05;
          ed.body.position.z += (ez - ed.body.position.z) * 0.05;
          ed.body.rotation.y = Math.atan2(
            this.botGroup.position.x - ed.body.position.x,
            this.botGroup.position.z - ed.body.position.z
          ) * 0.1 + ed.body.rotation.y * 0.9;
          ed.body.position.y = 0.8 + Math.sin(Date.now() * 0.003 + ed.angle) * 0.1;
        });
      }

      this.ghostPreview.animate(Date.now() * 0.001);

      if (this.goalBeacon) {
        const time = Date.now() * 0.001;
        this.goalBeacon.rotation.z += 0.01;
        this.goalBeacon.scale.setScalar(1 + Math.sin(time * 2) * 0.1);
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

  getObstacles(): Array<{ x: number; z: number; radius: number }> {
    const obstacles: Array<{ x: number; z: number; radius: number }> = [];
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name || "";
        const isObstacle =
          name.includes("wall") || name.includes("level_") ||
          name.includes("pillar") || name.includes("barrier") ||
          name.includes("enemy") || name.includes("block") ||
          name.includes("tree") || name.includes("crate") ||
          name.includes("ramp") || name.includes("cone") ||
          name.includes("turret") || name.includes("generator");
        if (isObstacle && child.geometry.boundingSphere) {
          obstacles.push({
            x: child.position.x,
            z: child.position.z,
            radius: child.geometry.boundingSphere.radius * 1.2,
          });
        }
      }
    });
    this.enemies?.forEach?.((enemy: THREE.Mesh) => {
      if (enemy.visible) {
        obstacles.push({ x: enemy.position.x, z: enemy.position.z, radius: 1.5 });
      }
    });
    this.levelObstacles?.forEach?.((obs: THREE.Mesh) => {
      if (obs.visible) {
        obstacles.push({ x: obs.position.x, z: obs.position.z, radius: 1.2 });
      }
    });
    return obstacles;
  }

  checkCollision(x: number, z: number): boolean {
    const obstacles = this.getObstacles();
    for (const obs of obstacles) {
      const dx = x - obs.x;
      const dz = z - obs.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < obs.radius) return true;
    }
    return false;
  }
}
