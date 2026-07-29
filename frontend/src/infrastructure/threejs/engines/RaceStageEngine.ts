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
  private timer: THREE.Timer;
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
  private circuitPath!: THREE.CatmullRomCurve3;
  private loopRing!: THREE.Mesh;
  private neonTunnel!: THREE.Mesh;
  private lapDisplay!: THREE.Mesh;
  private crowdDots: THREE.Mesh[] = [];

  constructor() {
    const setup = createSceneWithCamera({
      fov: 60,
      cameraPos: [28, 22, 28],
      fogColor: "#100a05",
      fogNear: 30,
      fogFar: 120,
      bgColor: "#100a05",
      ambientColor: "#332211",
      skyColor: "#553322",
      groundColor: "#100a05",
      hemiIntensity: 0.55,
      dirColor: "#ffcc88",
      dirIntensity: 1.6,
      dirPos: [5, 30, 5],
    });
    this.scene = setup.scene;
    this.camera = setup.camera;

    this.timer = new THREE.Timer();

    this.botParts = RaceBotBuilder.create();
    this.botGroup = this.botParts.group;
    this.botGroup.position.set(-30, 0, 0);
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
    // 1. CIRCUIT PATH
    const cp = [
      new THREE.Vector3(-30, 0, 0),
      new THREE.Vector3(-20, 0, -15),
      new THREE.Vector3(0, 0, -20),
      new THREE.Vector3(20, 0, -12),
      new THREE.Vector3(32, 0, 0),
      new THREE.Vector3(20, 0, 15),
      new THREE.Vector3(0, 0, 20),
      new THREE.Vector3(-20, 0, 12),
      new THREE.Vector3(-28, 0, 0),
      new THREE.Vector3(-22, 0, -8),
    ];
    this.circuitPath = new THREE.CatmullRomCurve3(cp, true);

    // Center line tube (emissive orange)
    const centerTube = new THREE.Mesh(
      new THREE.TubeGeometry(this.circuitPath, 200, 0.15, 8, true),
      new THREE.MeshStandardMaterial({ color: "#f59e0b", emissive: "#f59e0b", emissiveIntensity: 0.8, roughness: 0.3 }),
    );
    centerTube.position.y = 0.01;
    centerTube.name = "center_line";
    this.scene.add(centerTube);

    // 2. ASPHALT SURFACE PATCHES
    const asphaltMat = new THREE.MeshStandardMaterial({ color: "#1a1a22", roughness: 0.9, metalness: 0.05 });
        const patchCount = 80;
    for (let i = 0; i < patchCount; i++) {
      const t = i / patchCount;
      const pt = this.circuitPath.getPointAt(t);
      const tangent = this.circuitPath.getTangentAt(t).normalize();
      const patch = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), asphaltMat);
      patch.rotation.x = -Math.PI / 2;
      patch.rotation.z = Math.atan2(tangent.x, tangent.z);
      patch.position.set(pt.x, -0.05, pt.z);
      patch.receiveShadow = true;
      this.scene.add(patch);
    }

    // 3. NEON LANE LINES (±3 offset)
    const numSamples = 120;
    const leftPts: THREE.Vector3[] = [];
    const rightPts: THREE.Vector3[] = [];
    for (let i = 0; i <= numSamples; i++) {
      const t = i / numSamples;
      const pt = this.circuitPath.getPointAt(t);
      const tangent = this.circuitPath.getTangentAt(t).normalize();
      const perpRight = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      leftPts.push(pt.clone().add(perpRight.clone().multiplyScalar(-3)));
      rightPts.push(pt.clone().add(perpRight.clone().multiplyScalar(3)));
    }
    const leftCurve = new THREE.CatmullRomCurve3(leftPts, true);
    const rightCurve = new THREE.CatmullRomCurve3(rightPts, true);
    const neonLaneMat = new THREE.MeshBasicMaterial({ color: "#f59e0b", transparent: true, opacity: 0.3, depthWrite: false });
    this.scene.add(new THREE.Mesh(new THREE.TubeGeometry(leftCurve, 200, 0.1, 6, true), neonLaneMat));
    this.scene.add(new THREE.Mesh(new THREE.TubeGeometry(rightCurve, 200, 0.1, 6, true), neonLaneMat));

    // 4. CHECKPOINT ARCHES
    const archParams = [0.2, 0.5, 0.8];
    archParams.forEach((param) => {
      const archPos = this.circuitPath.getPointAt(param);
      const tangent = this.circuitPath.getTangentAt(param).normalize();
      const zAxis = tangent.clone();
      const xAxis = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), zAxis).normalize();
      const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis);
      const rotMatrix = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);

      // Torus arch standing vertically
      const torus = new THREE.Mesh(
        new THREE.TorusGeometry(5, 0.15, 8, 24),
        new THREE.MeshStandardMaterial({ color: "#3b82f6", emissive: "#3b82f6", emissiveIntensity: 0.6, roughness: 0.3 }),
      );
      torus.position.copy(archPos.clone().add(new THREE.Vector3(0, 3, 0)));
      torus.quaternion.setFromRotationMatrix(rotMatrix);
      this.scene.add(torus);

      // Translucent plane through arch
      const archPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(5, 10),
        new THREE.MeshBasicMaterial({ color: "#3b82f6", transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthWrite: false }),
      );
      archPlane.position.copy(archPos.clone().add(new THREE.Vector3(0, 3, 0)));
      archPlane.quaternion.setFromRotationMatrix(rotMatrix);
      this.scene.add(archPlane);
      this.checkpoints.push({ mesh: archPlane, passed: false });

      const archLight = new THREE.PointLight("#3b82f6", 0.4, 8);
      archLight.position.copy(archPos.clone().add(new THREE.Vector3(0, 3, 0)));
      this.scene.add(archLight);
    });

    // 5. LOOPING (vertical loop-the-loop)
    const loopParam = 0.35;
    const loopPos = this.circuitPath.getPointAt(loopParam);
    const loopTangent = this.circuitPath.getTangentAt(loopParam).normalize();
    const loopZ = loopTangent.clone();
    const loopX = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), loopZ).normalize();
    const loopY = new THREE.Vector3().crossVectors(loopZ, loopX);
    const loopMatrix = new THREE.Matrix4().makeBasis(loopX, loopY, loopZ);

    this.loopRing = new THREE.Mesh(
      new THREE.TorusGeometry(4, 0.4, 16, 32),
      new THREE.MeshStandardMaterial({ color: "#f59e0b", emissive: "#f59e0b", emissiveIntensity: 0.8, roughness: 0.2 }),
    );
    this.loopRing.position.copy(loopPos.clone().add(new THREE.Vector3(0, 4, 0)));
    this.loopRing.quaternion.setFromRotationMatrix(loopMatrix);
    this.loopRing.name = "loop_ring";
    this.scene.add(this.loopRing);

    const loopGlow = new THREE.PointLight("#f59e0b", 0.5, 10);
    loopGlow.position.copy(loopPos.clone().add(new THREE.Vector3(0, 4, 0)));
    this.scene.add(loopGlow);

    // 6. NEON TUNNEL
    const tunnelStart = 0.58;
    const tunnelEnd = 0.72;
    const tunnelPoints: THREE.Vector3[] = [];
    const tunnelSamples = 30;
    for (let i = 0; i <= tunnelSamples; i++) {
      const t = tunnelStart + (i / tunnelSamples) * (tunnelEnd - tunnelStart);
      tunnelPoints.push(this.circuitPath.getPointAt(t));
    }
    const tunnelCurve = new THREE.CatmullRomCurve3(tunnelPoints, false);
    this.neonTunnel = new THREE.Mesh(
      new THREE.TubeGeometry(tunnelCurve, 50, 5, 8, false),
      new THREE.MeshBasicMaterial({ color: "#3b82f6", transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false }),
    );
    this.scene.add(this.neonTunnel);

    // 7. BARRIERS along track edges (±8 offset)
    const barrierPostMat = new THREE.MeshStandardMaterial({ color: "#f59e0b", emissive: "#f59e0b", emissiveIntensity: 0.5, roughness: 0.3 });
    const totalLen = this.circuitPath.getLength();
    const postSpacing = 2;
    const numPosts = Math.floor(totalLen / postSpacing);
    const leftBarrierPoints: THREE.Vector3[] = [];
    const rightBarrierPoints: THREE.Vector3[] = [];

    for (let i = 0; i < numPosts; i++) {
      const dist = i * postSpacing;
      const t = dist / totalLen;
      const pt = this.circuitPath.getPointAt(t);
      const tangent = this.circuitPath.getTangentAt(t).normalize();
      const perpRight = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const leftPt = pt.clone().add(perpRight.clone().multiplyScalar(-8));
      const rightPt = pt.clone().add(perpRight.clone().multiplyScalar(8));
      leftBarrierPoints.push(leftPt);
      rightBarrierPoints.push(rightPt);

      const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1, 8), barrierPostMat);
      postL.position.set(leftPt.x, 0.5, leftPt.z);
      postL.name = "barrier_post";
      this.scene.add(postL);

      const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1, 8), barrierPostMat);
      postR.position.set(rightPt.x, 0.5, rightPt.z);
      postR.name = "barrier_post";
      this.scene.add(postR);
    }

    const barrierTubeMat = new THREE.MeshBasicMaterial({ color: "#f59e0b", transparent: true, opacity: 0.25, depthWrite: false });
    const leftBarrierCurve = new THREE.CatmullRomCurve3(leftBarrierPoints, true);
    const rightBarrierCurve = new THREE.CatmullRomCurve3(rightBarrierPoints, true);
    this.scene.add(new THREE.Mesh(new THREE.TubeGeometry(leftBarrierCurve, numPosts, 0.08, 6, true), barrierTubeMat));
    this.scene.add(new THREE.Mesh(new THREE.TubeGeometry(rightBarrierCurve, numPosts, 0.08, 6, true), barrierTubeMat));

    // 8. GRANDSTAND at (0, 1, -16)
    const grandMat = new THREE.MeshStandardMaterial({ color: "#1e2028", roughness: 0.6, metalness: 0.4, emissive: "#0a0a0f", emissiveIntensity: 0.1 });
    this.crowdDots = [];
    const crowdColors = ["#e94560", "#f59e0b", "#3b82f6", "#22c55e", "#a855f7"];
    for (let row = 0; row < 6; row++) {
      const standRow = new THREE.Mesh(new THREE.BoxGeometry(30, 0.3, 1.5), grandMat);
      standRow.position.set(0, row * 0.7 + 1.3, -16 + row * 0.4);
      standRow.name = "grandstand";
      standRow.castShadow = true;
      this.scene.add(standRow);

      for (let c = 0; c < 33; c++) {
        if (Math.random() > 0.25) {
          const crowd = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 4, 4),
            new THREE.MeshBasicMaterial({ color: crowdColors[Math.floor(Math.random() * crowdColors.length)] }),
          );
          crowd.position.set(-14 + c * 0.9, row * 0.7 + 1.6, -16 + row * 0.4);
          (crowd as any).userData = { baseY: crowd.position.y };
          this.scene.add(crowd);
          this.crowdDots.push(crowd);
        }
      }
    }

    // Grandstand roof lights
    for (let i = -12; i <= 12; i += 8) {
      const roofLight = new THREE.PointLight("#ffcc88", 0.3, 10);
      roofLight.position.set(i, 5.7, -13);
      this.scene.add(roofLight);
    }

    // 9. GIANT SCREEN / LAP DISPLAY
    const lapCanvas = document.createElement("canvas");
    lapCanvas.width = 512;
    lapCanvas.height = 256;
    const ctx = lapCanvas.getContext("2d")!;
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, 512, 256);
    ctx.font = "bold 40px sans-serif";
    ctx.fillStyle = "#f59e0b";
    ctx.textAlign = "center";
    ctx.fillText("GRAN PREMIO", 256, 80);
    ctx.font = "bold 32px sans-serif";
    ctx.fillStyle = "#3b82f6";
    ctx.fillText("VUELTA 1/3", 256, 150);
    ctx.font = "20px sans-serif";
    ctx.fillStyle = "#22c55e";
    ctx.fillText("CIRCUITO RACING", 256, 200);
    const lapTex = new THREE.CanvasTexture(lapCanvas);
    this.lapDisplay = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 4.5),
      new THREE.MeshBasicMaterial({ map: lapTex, transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
    );
    this.lapDisplay.position.set(22, 6, -14);
    this.lapDisplay.rotation.y = Math.PI / 4;
    this.scene.add(this.lapDisplay);

    const screenLight = new THREE.PointLight("#3b82f6", 0.3, 8);
    screenLight.position.copy(this.lapDisplay.position);
    this.scene.add(screenLight);

    // 10. START/FINISH LINE at curveParam 0
    const startT = 0;
    const startPos = this.circuitPath.getPointAt(startT);
    const startTangent = this.circuitPath.getTangentAt(startT).normalize();
    const startPerp = new THREE.Vector3(-startTangent.z, 0, startTangent.x).normalize();

    // Checkered strips
    const whiteMat = new THREE.MeshBasicMaterial({ color: "#ffffff", side: THREE.DoubleSide });
    const blackMat = new THREE.MeshBasicMaterial({ color: "#000000", side: THREE.DoubleSide });
    for (let i = -16; i <= 16; i++) {
      const stripMat = i % 2 === 0 ? whiteMat : blackMat;
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 10), stripMat);
      const offsetPos = startPos.clone().add(startPerp.clone().multiplyScalar(i * 0.3));
      strip.position.set(offsetPos.x, 0.01, offsetPos.z);
      strip.rotation.x = -Math.PI / 2;
      this.scene.add(strip);
    }

    // Start arch pillars + top bar
    const startArchMat = new THREE.MeshStandardMaterial({ color: "#22c55e", emissive: "#22c55e", emissiveIntensity: 0.8, roughness: 0.2 });
    const pillarL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 4, 8), startArchMat);
    pillarL.position.copy(startPos.clone().add(startPerp.clone().multiplyScalar(-5)));
    pillarL.position.y = 2;
    pillarL.name = "arch_pillar";
    this.scene.add(pillarL);

    const pillarR = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 4, 8), startArchMat);
    pillarR.position.copy(startPos.clone().add(startPerp.clone().multiplyScalar(5)));
    pillarR.position.y = 2;
    pillarR.name = "arch_pillar";
    this.scene.add(pillarR);

    const archTop = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 10.5), startArchMat);
    archTop.position.copy(startPos.clone().add(new THREE.Vector3(0, 4, 0)));
    this.scene.add(archTop);

    const startLight = new THREE.PointLight("#22c55e", 0.5, 6);
    startLight.position.copy(startPos.clone().add(new THREE.Vector3(0, 2, 0)));
    this.scene.add(startLight);

    // 11. CONES distributed along circuit path
    const coneBodyMat = new THREE.MeshStandardMaterial({ color: "#ef4444", emissive: "#ef4444", emissiveIntensity: 0.15, roughness: 0.5 });
    this.cones = [];
    for (let i = 0; i < 12; i++) {
      const t = (i / 12 + Math.random() * 0.04) % 1;
      const conePt = this.circuitPath.getPointAt(t);
      const coneTangent = this.circuitPath.getTangentAt(t).normalize();
      const conePerp = new THREE.Vector3(-coneTangent.z, 0, coneTangent.x).normalize();
      const offset = (Math.random() - 0.5) * 12;
      const pos = conePt.clone().add(conePerp.clone().multiplyScalar(offset));

      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 8), coneBodyMat);
      cone.position.set(pos.x, 0.5, pos.z);
      cone.name = "cone";
      this.scene.add(cone);
      this.cones.push(cone);

      // Glow ring at base
      const baseRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.6, 0.05, 8, 16),
        new THREE.MeshBasicMaterial({ color: "#ef4444", transparent: true, opacity: 0.4 }),
      );
      baseRing.rotation.x = Math.PI / 2;
      baseRing.position.set(pos.x, 0.15, pos.z);
      this.scene.add(baseRing);
    }

    // 12. SPEED TRAILS
    const trailSections = [0.05, 0.3, 0.55, 0.8];
    this.speedTrails = [];
    trailSections.forEach((t) => {
      const trailPos = this.circuitPath.getPointAt(t);
      const trailTan = this.circuitPath.getTangentAt(t).normalize();
      const angle = Math.atan2(trailTan.x, trailTan.z);

      const trail = new THREE.Mesh(
        new THREE.PlaneGeometry(15, 0.8),
        new THREE.MeshBasicMaterial({ color: "#f59e0b", transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }),
      );
      trail.rotation.x = -Math.PI / 2;
      trail.rotation.z = angle;
      trail.position.set(trailPos.x, 0.02, trailPos.z);
      this.scene.add(trail);
      this.speedTrails.push(trail);
    });
  }

  init(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
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

      const t = this.timer.getElapsed();
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
        const tBeacon = Date.now() * 0.001;
        this.goalBeacon.rotation.z += 0.01;
        this.goalBeacon.scale.setScalar(1 + Math.sin(tBeacon * 2) * 0.1);
      }

      // Pulse speed trails
      const trailT = Date.now() * 0.002;
      this.speedTrails.forEach((trail, i) => {
        (trail.material as THREE.MeshBasicMaterial).opacity = 0.04 + Math.sin(trailT * 3 + i) * 0.03;
      });

      // Update lap display
      if (this.lapDisplay && this.lapDisplay.material instanceof THREE.MeshBasicMaterial && this.lapDisplay.material.map) {
        this.lapDisplay.material.opacity = 0.8 + Math.sin(Date.now() * 0.003) * 0.2;
      }

      if (this.loopRing) {
        this.loopRing.rotation.z = Math.sin(Date.now() * 0.0005) * 0.02;
      }

      // Animate crowd (slight random movement)
      this.crowdDots.forEach((dot, i) => {
        const baseY = (dot.userData as any)?.baseY;
        if (baseY !== undefined) {
          dot.position.y = baseY + Math.sin(Date.now() * 0.008 + i) * 0.03;
        }
      });

      // Spin wheels if bot has wheels
      if (this.botParts.wheels.visible) {
        this.botParts.wheels.children.forEach((c) => {
          if (c instanceof THREE.Mesh && c.geometry.type === "TorusGeometry") {
            c.rotation.x += 0.05;
          }
        });
      }

      // Checkpoint detection
      this.checkpoints.forEach((cp) => {
        if (!cp.passed && this.botGroup) {
          const dx = this.botGroup.position.x - cp.mesh.position.x;
          const dz = this.botGroup.position.z - cp.mesh.position.z;
          if (Math.sqrt(dx * dx + dz * dz) < 5) {
            cp.passed = true;
            // Flash the checkpoint mesh brighter
            (cp.mesh.material as THREE.MeshBasicMaterial).opacity = 0.5;
            // Passed visual: change ring color to green briefly
          }
        }
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
          requestAnimationFrame(() => animate(this.timer.getDelta()));
        } else {
          (this.ultrasonicCone.material as THREE.MeshBasicMaterial).opacity = 0;
          resolve(Math.floor(Math.random() * 18) + 3);
        }
      };
      this.timer.getDelta();
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
          requestAnimationFrame(() => animate(this.timer.getDelta()));
        } else {
          this.botGroup.position.y = startY;
          this.triggerParticles(this.botGroup.position.x, this.botGroup.position.z, "success");
          resolve();
        }
      };
      this.timer.getDelta();
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
          requestAnimationFrame(() => animate(this.timer.getDelta()));
        } else {
          this.botGroup.position.copy(orig);
          this.triggerParticles(orig.x, orig.z, "move");
          resolve();
        }
      };
      this.timer.getDelta();
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
    this.botGroup.position.set(-30, 0, 0);
    this.botGroup.rotation.set(0, 0, 0);
    this.checkpoints.forEach((cp) => { cp.passed = false; });
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
