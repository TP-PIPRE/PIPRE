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
import { RobotPersonality } from "../shared/RobotPersonality";
import { CinematicCamera } from "../shared/CinematicCamera";
import { BlockBar3D } from "../shared/BlockBar3D";

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
  private timer: THREE.Timer;
  private controls!: MapControls;
  private isRunning = false;
  private doors: THREE.Mesh[] = [];
  private portalLight!: THREE.PointLight;
  private beacons: THREE.Mesh[] = [];
  private fireflies: THREE.Points | null = null;
  private ghostPreview!: GhostPreview;
  private levelObstacles: THREE.Mesh[] = [];
  private goalBeacon: THREE.Mesh | null = null;
  private robotPersonality!: RobotPersonality;
  private cinematicCamera!: CinematicCamera;
  private blockBar!: BlockBar3D;
  private templeGroup!: THREE.Group;
  private treeTrunks: THREE.Mesh[] = [];
  private runeMarkers: THREE.Mesh[] = [];
  private magicalDoors: Array<{ arch: THREE.Group; veil: THREE.Mesh; position: THREE.Vector3 }> = [];

  constructor() {
    const { scene, camera } = createSceneWithCamera({
      fov: 50,
      cameraPos: [18, 16, 18],
      fogColor: "#050510",
      fogNear: 18,
      fogFar: 60,
      bgColor: "#0a0a1a",
      ambientColor: "#332244",
      ambientIntensity: 0.55,
      skyColor: "#2a1a3e",
      groundColor: "#0a0a1a",
      hemiIntensity: 0.5,
      dirColor: "#9988bb",
      dirIntensity: 0.7,
      dirPos: [8, 15, 8],
    });
    this.scene = scene;
    this.camera = camera;
    this.timer = new THREE.Timer();

    this.botParts = MazeBotBuilder.create();
    this.botGroup = this.botParts.group;
    this.ultrasonicCone = this.createUltrasonicCone();
    this.botGroup.add(this.ultrasonicCone);
    this.scene.add(this.botGroup);
    this.botGroup.position.set(-18, 0, 0);
    this.robotPersonality = new RobotPersonality(this.scene, this.botGroup);
    this.blockBar = new BlockBar3D(this.scene);

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
    // ===== DARK SOIL FLOOR =====
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({
      color: "#10101a",
      roughness: 1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // ===== MOSS PATCHES =====
    const mossMat = new THREE.MeshStandardMaterial({
      color: "#0a150a",
      roughness: 1,
    });
    for (let i = 0; i < 15; i++) {
      const mossGeo = new THREE.CircleGeometry(0.5 + Math.random() * 1.5, 12);
      const moss = new THREE.Mesh(mossGeo, mossMat);
      moss.rotation.x = -Math.PI / 2;
      moss.position.set(
        (Math.random() - 0.5) * 50,
        -0.48,
        (Math.random() - 0.5) * 50
      );
      this.scene.add(moss);
    }

    // ===== AMBIENT GRID =====
    const grid = new THREE.GridHelper(50, 50, "#2a1040", "#050510");
    grid.position.y = -0.49;
    (grid.material as THREE.Material).opacity = 0.06;
    (grid.material as THREE.Material).transparent = true;
    grid.name = "environment_grid";
    this.scene.add(grid);

    // ===== PATH CORRIDOR CHECK =====
    const isInCorridor = (x: number, z: number): boolean => {
      // Vertical path: z from -20 to 20, x between -1.5 and 1.5
      if (Math.abs(x) < 1.5 && z > -20 && z < 20) return true;
      // Horizontal path: x from -12 to 12, z between -1.5 and 1.5
      if (Math.abs(z) < 1.5 && x > -12 && x < 12) return true;
      // Diagonal path: from (-15,-10) to (15,10), 3 units wide
      const dx = 30;
      const dz = 20;
      const len = Math.sqrt(dx * dx + dz * dz);
      const t = Math.max(0, Math.min(1, ((x - (-15)) * dx + (z - (-10)) * dz) / (len * len)));
      const projX = -15 + t * dx;
      const projZ = -10 + t * dz;
      const dist = Math.sqrt((x - projX) ** 2 + (z - projZ) ** 2);
      if (dist < 3) return true;
      return false;
    };

    // ===== PROCEDURAL FOREST (60+ TREES) =====
    const treeTrunkMat = new THREE.MeshStandardMaterial({
      color: "#2d1a10",
      roughness: 0.9,
    });
    const treeCrownMat = new THREE.MeshStandardMaterial({
      color: "#0d2410",
      roughness: 0.85,
    });
    const treeCount = 65;
    let placed = 0;
    while (placed < treeCount) {
      const tx = (Math.random() - 0.5) * 56;
      const tz = (Math.random() - 0.5) * 56;
      if (isInCorridor(tx, tz)) continue;

      // Skip near temple center
      if (Math.abs(tx) < 5 && Math.abs(tz) < 5) continue;

      const trunkHeight = 2.5 + Math.random() * 3.5;
      const trunkGeo = new THREE.CylinderGeometry(0.12, 0.25, trunkHeight, 8);
       const trunk = new THREE.Mesh(trunkGeo, treeTrunkMat);
       trunk.name = "tree_trunk";
       trunk.position.set(tx, trunkHeight / 2 - 0.5, tz);
      trunk.rotation.z = (Math.random() - 0.5) * 0.2;
      trunk.castShadow = true;
      this.scene.add(trunk);
      this.treeTrunks.push(trunk);

      const crownHeight = 1.5 + Math.random() * 2;
      const crownRadius = 0.5 + Math.random() * 0.7;
      const crownGeo = new THREE.ConeGeometry(crownRadius, crownHeight, 8);
       const crown = new THREE.Mesh(crownGeo, treeCrownMat);
       crown.name = "tree_crown";
       crown.position.set(tx, trunkHeight - 0.3, tz);
      crown.castShadow = true;
      this.scene.add(crown);
      this.treeTrunks.push(crown);

      placed++;
    }

    // ===== TEMPLE AT CENTER =====
    this.templeGroup = new THREE.Group();
    const templeStoneMat = new THREE.MeshStandardMaterial({
      color: "#1a1a2e",
      roughness: 0.7,
      metalness: 0.3,
      emissive: "#2a1a4a",
      emissiveIntensity: 0.15,
    });

    // Stepped pyramid: 3 layers
    const bottomGeo = new THREE.BoxGeometry(8, 2, 8);
     const bottom = new THREE.Mesh(bottomGeo, templeStoneMat);
     bottom.name = "temple_block";
     bottom.position.y = 0.5;
    bottom.castShadow = true;
    bottom.receiveShadow = true;
    this.templeGroup.add(bottom);

    const middleGeo = new THREE.BoxGeometry(6, 1.8, 6);
     const middle = new THREE.Mesh(middleGeo, templeStoneMat);
     middle.name = "temple_block";
     middle.position.y = 1.9;
    middle.castShadow = true;
    middle.receiveShadow = true;
    this.templeGroup.add(middle);

    const topGeo = new THREE.BoxGeometry(4, 1.5, 4);
     const top = new THREE.Mesh(topGeo, templeStoneMat);
     top.name = "temple_block";
     top.position.y = 3.0;
    top.castShadow = true;
    top.receiveShadow = true;
    this.templeGroup.add(top);

    // 4 corner pillars
    const cornerOffsets = [
      [-3.5, -3.5], [3.5, -3.5], [-3.5, 3.5], [3.5, 3.5]
    ];
    cornerOffsets.forEach(([cx, cz]) => {
      const pillarGeo = new THREE.CylinderGeometry(0.25, 0.35, 4.5, 8);
       const pillar = new THREE.Mesh(pillarGeo, templeStoneMat);
       pillar.name = "temple_pillar";
       pillar.position.set(cx, 2.25, cz);
      pillar.castShadow = true;
      this.templeGroup.add(pillar);
    });

    // Portal on top platform
    const portalTopY = 3.75;
    const portalRingGeo = new THREE.TorusGeometry(1.2, 0.25, 16, 32);
    const portalRingMat = new THREE.MeshStandardMaterial({
      color: "#a78bfa",
      emissive: "#a78bfa",
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.1,
    });
    const portalRing = new THREE.Mesh(portalRingGeo, portalRingMat);
    portalRing.position.y = portalTopY + 1.8;
    portalRing.rotation.x = Math.PI / 2;
    this.templeGroup.add(portalRing);

    const portalInnerGeo = new THREE.CircleGeometry(1, 32);
    const portalInnerMat = new THREE.MeshBasicMaterial({
      color: "#a78bfa",
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const portalInner = new THREE.Mesh(portalInnerGeo, portalInnerMat);
    portalInner.position.y = portalTopY + 1.81;
    portalInner.rotation.x = -Math.PI / 2;
    this.templeGroup.add(portalInner);

    this.portalLight = new THREE.PointLight("#a78bfa", 1.2, 18);
    this.portalLight.position.set(0, portalTopY + 1.8, 0);
    this.templeGroup.add(this.portalLight);

    this.scene.add(this.templeGroup);
    this.templeGroup.position.set(12, 0, 0);

    // Temple corner point lights
    const cornerLightOffsets = [
      [-3.5, -3.5], [3.5, -3.5], [-3.5, 3.5], [3.5, 3.5]
    ];
    cornerLightOffsets.forEach(([lx, lz]) => {
      const light = new THREE.PointLight("#a78bfa", 0.4, 12);
      light.position.set(lx, 2.5, lz);
      light.name = "temple_light";
      this.templeGroup.add(light);
    });

    // ===== RUNAS ON PATHS (8 markers) =====
    const runePositions: Array<[number, number]> = [
      // Vertical path
      [0, -18], [0, -10], [0, 10], [0, 18],
      // Horizontal path
      [-10, 0], [10, 0],
      // Diagonal path
      [-12, -8], [12, 8],
    ];
     const runeMat = new THREE.MeshBasicMaterial({
       color: "#a78bfa",
       transparent: true,
       opacity: 0.4,
     });
    runePositions.forEach(([rx, rz]) => {
      const runeGeo = new THREE.RingGeometry(0.35, 0.45, 16);
       const rune = new THREE.Mesh(runeGeo, runeMat.clone());
       rune.name = "rune_marker";
       rune.rotation.x = -Math.PI / 2;
      rune.position.set(rx, -0.48, rz);
      this.scene.add(rune);
      this.runeMarkers.push(rune);

      const runeLight = new THREE.PointLight("#a78bfa", 0.2, 3);
      runeLight.position.set(rx, 0.1, rz);
      this.scene.add(runeLight);
    });

    // ===== MAGIC DOORS (3 along paths) =====
    const doorPlacements: Array<{ x: number; z: number }> = [
      { x: -3, z: -10 },
      { x: 4, z: 8 },
      { x: -8, z: 4 },
    ];
    const doorArchMat = new THREE.MeshStandardMaterial({
      color: "#3d2670",
      roughness: 0.5,
      emissive: "#1a0f3a",
      emissiveIntensity: 0.3,
    });
    const doorVeilMat = new THREE.MeshStandardMaterial({
      color: "#6b4fa3",
      emissive: "#6b4fa3",
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.5,
    });

    doorPlacements.forEach((pos) => {
      const archGroup = new THREE.Group();

       const pillar1 = new THREE.Mesh(
         new THREE.CylinderGeometry(0.2, 0.25, 3, 8),
         doorArchMat
       );
       pillar1.name = "door_pillar";
       pillar1.position.set(-0.8, 1.5, 0);
       archGroup.add(pillar1);

       const pillar2 = new THREE.Mesh(
         new THREE.CylinderGeometry(0.2, 0.25, 3, 8),
         doorArchMat
       );
       pillar2.name = "door_pillar";
       pillar2.position.set(0.8, 1.5, 0);
      archGroup.add(pillar2);

      // Half-torus arch top
      const archGeo = new THREE.TorusGeometry(0.9, 0.15, 8, 16, Math.PI);
      const archTop = new THREE.Mesh(archGeo, doorArchMat);
      archTop.position.set(0, 2.8, 0);
      archGroup.add(archTop);

       const veil = new THREE.Mesh(
         new THREE.BoxGeometry(1.5, 2.5, 0.15),
         doorVeilMat
       );
       veil.name = "door_veil";
       veil.position.set(pos.x, 0.75, pos.z);
      this.scene.add(veil);

      archGroup.position.set(pos.x, 0, pos.z);
      this.scene.add(archGroup);

      this.magicalDoors.push({
        arch: archGroup,
        veil,
        position: new THREE.Vector3(pos.x, 0, pos.z),
      });
      this.doors.push(veil);
    });

    // ===== MAZE WALLS - forming a winding labyrinth =====
    const mazeWallMat = new THREE.MeshStandardMaterial({
      color: "#2a1835", roughness: 0.7, metalness: 0.2,
      emissive: "#150a1e", emissiveIntensity: 0.1,
    });

    const wallSegments: Array<[number, number, number, boolean]> = [
      [-2.5, -16, 5, true],
      [2.5, -12, 4, true],
      [-2.5, -8, 3, true],
      [2.5, -4, 5, true],
      [-2.5, 2, 4, true],
      [2.5, 6, 3, true],
      [-2.5, 10, 4, true],
      [2.5, 14, 3, true],

      [-10, -2.5, 3, false],
      [-6, 2.5, 4, false],
      [-2, -2.5, 3, false],
      [2, 2.5, 4, false],
      [6, -2.5, 3, false],
      [10, 2.5, 2, false],

      [-8, -4, 3, true],
      [-3, 0, 2, false],
      [2, 3, 3, true],
      [7, 6, 2, false],
    ];

    wallSegments.forEach(([x, z, len, isHorizontal]) => {
      const w = isHorizontal ? len : 0.5;
      const d = isHorizontal ? 0.5 : len;
      const geo = new THREE.BoxGeometry(w, 1.5, d);
      const wall = new THREE.Mesh(geo, mazeWallMat);
      wall.position.set(x, 0.25, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      wall.name = "maze_wall";
      this.scene.add(wall);

      const edgeGeo = new THREE.BoxGeometry(w - 0.1, 0.05, d - 0.1);
      const edge = new THREE.Mesh(edgeGeo, new THREE.MeshBasicMaterial({
        color: "#a78bfa", transparent: true, opacity: 0.15, depthWrite: false,
      }));
      edge.position.set(x, 1.0, z);
      edge.name = "maze_wall_edge";
      this.scene.add(edge);
    });

    // ===== FIREFLIES (80 particles) =====
    const fireflyCount = 80;
    const fireflyGeo = new THREE.BufferGeometry();
    const fireflyPositions = new Float32Array(fireflyCount * 3);
    for (let i = 0; i < fireflyCount; i++) {
      fireflyPositions[i * 3] = (Math.random() - 0.5) * 50;
      fireflyPositions[i * 3 + 1] = Math.random() * 6;
      fireflyPositions[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    fireflyGeo.setAttribute("position", new THREE.BufferAttribute(fireflyPositions, 3));
    const fireflyMat = new THREE.PointsMaterial({
      color: "#a78bfa",
      size: 0.1,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.fireflies = new THREE.Points(fireflyGeo, fireflyMat);
    this.scene.add(this.fireflies);

    // Path intersection lights
    const pathLights = [
      { x: 0, z: -7, color: "#a78bfa", intensity: 0.5 },
      { x: 7, z: 0, color: "#c084fc", intensity: 0.5 },
      { x: -7, z: 0, color: "#a78bfa", intensity: 0.4 },
      { x: 0, z: 7, color: "#c084fc", intensity: 0.4 },
      { x: -3, z: -5, color: "#a78bfa", intensity: 0.35 },
      { x: 5, z: 3, color: "#a78bfa", intensity: 0.35 },
    ];
    pathLights.forEach(({ x, z, color, intensity }) => {
      const light = new THREE.PointLight(color, intensity, 8);
      light.position.set(x, 1.8, z);
      this.scene.add(light);
    });

    const gemGeo = new THREE.OctahedronGeometry(0.2);
    const gemMat = new THREE.MeshStandardMaterial({
      color: "#a78bfa",
      emissive: "#a78bfa",
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.1,
    });
    pathLights.forEach(({ x, z }) => {
      const gem = new THREE.Mesh(gemGeo, gemMat);
      gem.position.set(x, 2.4, z);
      gem.name = "beacon_gem";
      this.scene.add(gem);
      this.beacons.push(gem);
    });
  }

  init(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.composer = createEffectComposer(this.renderer, this.scene, this.camera, BLOOM_PRESETS.maze);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.controls = new MapControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 45;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.screenSpacePanning = true;
    this.controls.target.set(0, 0.5, 0);
    this.controls.update();

    this.cinematicCamera = new CinematicCamera(this.camera, this.controls);

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
    this.robotPersonality.dispose();
    this.blockBar.dispose();
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
      this.portalLight.intensity = 0.5 + Math.sin(Date.now() * 0.003) * 0.5;
      this.beacons.forEach((b, i) => {
        b.scale.setScalar(1 + Math.sin(Date.now() * 0.004 + i) * 0.2);
      });

      // Pulse runes
      this.runeMarkers.forEach((rune, i) => {
        const mat = rune.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.25 + Math.sin(Date.now() * 0.004 + i) * 0.25;
      });

      // Wave magical door veils
      this.magicalDoors.forEach((door, i) => {
        if (door.veil) {
          const mat = door.veil.material as THREE.MeshStandardMaterial;
          mat.opacity = 0.3 + Math.sin(Date.now() * 0.003 + i) * 0.2;
        }
      });

      // Fireflies drift
      if (this.fireflies) {
        const pos = this.fireflies.geometry.attributes.position.array as Float32Array;
        const t = Date.now() * 0.001;
        for (let i = 0; i < pos.length; i += 3) {
          pos[i] += Math.sin(t * 2 + i * 0.5) * 0.006;
          pos[i + 1] += Math.cos(t * 3 + i * 0.3) * 0.005;
          pos[i + 2] += Math.cos(t * 2.5 + i * 0.4) * 0.006;
          if (pos[i + 1] > 6) pos[i + 1] = 0;
          if (pos[i + 1] < 0) pos[i + 1] = 6;
        }
        this.fireflies.geometry.attributes.position.needsUpdate = true;
      }

      // Sway tree crowns gently
      this.treeTrunks.forEach((tree, i) => {
        tree.rotation.z = Math.sin(Date.now() * 0.0008 + i * 0.4) * 0.04;
        tree.rotation.x = Math.cos(Date.now() * 0.0006 + i * 0.3) * 0.02;
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
          requestAnimationFrame(() => animate(this.timer.getDelta()));
        } else {
          (this.ultrasonicCone.material as THREE.MeshBasicMaterial).opacity = 0;
          resolve(Math.floor(Math.random() * 10) + 3);
        }
      };
      this.timer.getDelta();
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
        const magicDoor = this.magicalDoors.find(d => d.veil === door);
        if (magicDoor?.arch) magicDoor.arch.visible = false;
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
    this.botGroup.position.set(-18, 0, 0);
    this.botGroup.rotation.set(0, 0, 0);
    this.doors.forEach((door) => { door.position.y = 0.75; });
    this.magicalDoors.forEach((door) => { if (door.arch) door.arch.visible = true; });
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
          requestAnimationFrame(() => animate(this.timer.getDelta()));
        } else resolve();
      };
      this.timer.getDelta();
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
          requestAnimationFrame(() => animate(this.timer.getDelta()));
        } else resolve();
      };
      this.timer.getDelta();
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

    const oldDot = (this as any)._goalBeaconDot as THREE.Mesh | undefined;
    if (oldDot) {
      this.scene.remove(oldDot);
      oldDot.geometry?.dispose();
      (oldDot.material as THREE.Material)?.dispose();
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
    (this as any)._goalBeaconDot = dot;
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
      if (!(child instanceof THREE.Mesh) || !child.name) return;
      const wp = new THREE.Vector3();
      child.getWorldPosition(wp);
      const name = child.name;
      let radius = 0;
      if (name.includes("trunk") || name.includes("tree")) radius = 0.5;
      else if (name.includes("temple") || name.includes("pillar")) radius = 0.7;
      else if (name.includes("door") || name.includes("arch")) radius = 0.6;
      else if (name.includes("crystal") || name.includes("rock")) radius = 0.7;
      else if (name.includes("wall") || name.includes("level_wall")) radius = 1.8;
      else if (name.includes("barrier") || name.includes("cone")) radius = 0.6;
      else if (name.includes("ship")) radius = 3;
      else if (name.includes("enemy")) radius = 1.5;
      else if (name.includes("crate")) radius = 0.8;
      else if (name.includes("level_block") || name.includes("block")) radius = 0.8;
      else if (name.includes("level_enemy")) radius = 1.5;
      else if (name.includes("level_crate")) radius = 0.8;
      else if (name.includes("level_sample") || name.includes("level_door")) radius = 0.6;
      else if (name.includes("level_cone")) radius = 0.5;
      else if (name.includes("ramp")) radius = 1;
      else if (name.includes("grandstand")) radius = 1;
      else if (name.includes("turret")) radius = 0.8;
      else if (name.includes("generator")) radius = 2.5;
      else if (name.includes("bridge") || name.includes("debris")) radius = 0.7;
      else if (name.includes("canyon")) radius = 1.5;
      else if (name.includes("loop") || name.includes("tunnel")) radius = 1.2;
      if (radius > 0) {
        obstacles.push({ x: wp.x, z: wp.z, radius });
      }
    });
    const enemies = (this as any).enemies as THREE.Mesh[] | undefined;
    if (enemies) {
      enemies.forEach((e: THREE.Mesh) => {
        if (e.visible !== false) {
          obstacles.push({ x: e.position.x, z: e.position.z, radius: 1.5 });
        }
      });
    }
    return obstacles;
  }

  checkCollision(x: number, z: number): boolean {
    const obstacles = this.getObstacles();
    for (const obs of obstacles) {
      const dx = x - obs.x;
      const dz = z - obs.z;
      if (Math.sqrt(dx * dx + dz * dz) < obs.radius) return true;
    }
    return false;
  }
}