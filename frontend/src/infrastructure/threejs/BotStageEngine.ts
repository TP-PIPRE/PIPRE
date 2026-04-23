import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import type { ISimulatorEngine } from '../../domain/ports/ISimulatorEngine';

export class BotStageEngine implements ISimulatorEngine {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer!: THREE.WebGLRenderer;
  private botGroup: THREE.Group;
  private ultrasonicCone: THREE.Mesh;
  
  private animationId: number | null = null;
  private clock: THREE.Clock;
  private controls!: MapControls;

  private isRunning: boolean = false;
  
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0f172a'); // slate-900

    // Orthographic Camera for 2.5D isometric look
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 20;
    this.camera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );
    this.camera.position.set(20, 20, 20);
    this.camera.lookAt(0, 0, 0);


    
    this.clock = new THREE.Clock();

    this.setupLighting();
    this.botGroup = this.createBot();
    this.ultrasonicCone = this.createUltrasonicCone();
    this.botGroup.add(this.ultrasonicCone);
    this.scene.add(this.botGroup);
    
    this.createEnvironment();
  }

  private setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    this.scene.add(dirLight);
  }

  private createBot(): THREE.Group {
    const group = new THREE.Group();

    // Chassis Base
    const chassisGeo = new THREE.BoxGeometry(2, 1, 3);
    const chassisMat = new THREE.MeshStandardMaterial({ 
      color: '#cbd5e1', // slate-300
      roughness: 0.4,
      metalness: 0.6
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    group.add(chassis);

    // Core Indicator
    const coreGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16);
    const coreMat = new THREE.MeshStandardMaterial({ 
      color: '#00f5d4', // Cyan accent
      emissive: '#00f5d4',
      emissiveIntensity: 0.5
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(0, 0.6, 0);
    group.add(core);

    // --- Hardware Modules ---

    // 1. Ruedas (Tracción)
    const wheelsGroup = new THREE.Group();
    wheelsGroup.name = 'hw_ruedas';
    const wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.9 });
    const wheelPositions = [
      [-1.2, -0.2, 1], [1.2, -0.2, 1],
      [-1.2, -0.2, -1], [1.2, -0.2, -1]
    ];
    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.rotation.z = Math.PI / 2;
      wheelsGroup.add(wheel);
    });
    wheelsGroup.visible = false;
    group.add(wheelsGroup);

    // 2. Hélices (Propulsión)
    const propsGroup = new THREE.Group();
    propsGroup.name = 'hw_helices';
    const propArmGeo = new THREE.CylinderGeometry(0.1, 0.1, 2);
    const propMat = new THREE.MeshStandardMaterial({ color: '#94a3b8' });
    const arm1 = new THREE.Mesh(propArmGeo, propMat);
    arm1.position.y = 0.5; arm1.rotation.x = Math.PI / 2; arm1.rotation.y = Math.PI / 4;
    const arm2 = new THREE.Mesh(propArmGeo, propMat);
    arm2.position.y = 0.5; arm2.rotation.x = Math.PI / 2; arm2.rotation.y = -Math.PI / 4;
    propsGroup.add(arm1, arm2);
    const bladeGeo = new THREE.BoxGeometry(0.8, 0.05, 0.1);
    const bladeMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1' });
    const propPositions = [
      [-1, 0.6, -1], [1, 0.6, -1],
      [-1, 0.6, 1], [1, 0.6, 1]
    ];
    propPositions.forEach(pos => {
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.set(pos[0], pos[1], pos[2]);
      propsGroup.add(blade);
    });
    propsGroup.visible = false;
    group.add(propsGroup);

    // 3. Garra (Manipulación)
    const armGroup = new THREE.Group();
    armGroup.name = 'hw_garra';
    const armBaseGeo = new THREE.BoxGeometry(0.4, 0.4, 1);
    const armBase = new THREE.Mesh(armBaseGeo, propMat);
    armBase.position.set(0, 0.2, -1.8);
    armGroup.add(armBase);
    const clawGeo = new THREE.BoxGeometry(0.8, 0.2, 0.4);
    const claw = new THREE.Mesh(clawGeo, propMat);
    claw.position.set(0, 0.2, -2.4);
    armGroup.add(claw);
    armGroup.visible = false;
    group.add(armGroup);

    // 4. Faro LED (Emisor)
    const ledGroup = new THREE.Group();
    ledGroup.name = 'hw_led';
    const ledGeo = new THREE.BoxGeometry(0.8, 0.4, 0.2);
    const ledMat = new THREE.MeshStandardMaterial({ color: '#fcd34d', emissive: '#fcd34d', emissiveIntensity: 0.8 });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0, 0.4, -1.6);
    ledGroup.add(led);
    ledGroup.visible = false;
    group.add(ledGroup);

    // 5. Ultrasónico (Sensor visual)
    const sonarGroup = new THREE.Group();
    sonarGroup.name = 'hw_sonar';
    const sonarGeo = new THREE.BoxGeometry(0.6, 0.3, 0.2);
    const sonarMat = new THREE.MeshStandardMaterial({ color: '#334155' });
    const sonar = new THREE.Mesh(sonarGeo, sonarMat);
    sonar.position.set(0, 0.8, -1.6);
    const eyeGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.1);
    eyeGeo.rotateX(Math.PI/2);
    const eye1 = new THREE.Mesh(eyeGeo, propMat); eye1.position.set(-0.15, 0.8, -1.7);
    const eye2 = new THREE.Mesh(eyeGeo, propMat); eye2.position.set(0.15, 0.8, -1.7);
    sonarGroup.add(sonar, eye1, eye2);
    sonarGroup.visible = false;
    group.add(sonarGroup);

    return group;
  }

  private createUltrasonicCone(): THREE.Mesh {
    const coneGeo = new THREE.ConeGeometry(2, 5, 16);
    // Rotate to face forward (-z in threejs local space)
    coneGeo.rotateX(Math.PI / 2);
    
    const coneMat = new THREE.MeshBasicMaterial({ 
      color: '#9b5de5', // Magenta accent
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(0, 0, -3.5); // Position in front of the bot
    return cone;
  }

  private createEnvironment(): void {
    // 1. Base Floor
    const floorGeo = new THREE.PlaneGeometry(100, 100);
    const floorMat = new THREE.MeshStandardMaterial({ 
      color: '#0f172a',
      roughness: 0.8,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Grid helper on top of floor
    const gridHelper = new THREE.GridHelper(100, 100, '#334155', '#1e293b');
    gridHelper.position.y = -0.49;
    this.scene.add(gridHelper);

    // --- Misiones Obstáculos ---
    const envGroup = new THREE.Group();

    // Material industrial
    const wallMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.7 });
    const accentMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.5 }); // Amber accent
    
    // Misión 3: Roca / Bloque
    const rockGeo = new THREE.BoxGeometry(2, 2, 2);
    const rock = new THREE.Mesh(rockGeo, accentMat);
    rock.position.set(0, 0.5, -15);
    rock.castShadow = true;
    rock.receiveShadow = true;
    envGroup.add(rock);

    // Misión 4: Túnel (Muros)
    const wallGeo = new THREE.BoxGeometry(20, 5, 2);
    const wallLeft = new THREE.Mesh(wallGeo, wallMat);
    wallLeft.position.set(-5, 2, -25);
    wallLeft.rotation.y = Math.PI / 2;
    const wallRight = new THREE.Mesh(wallGeo, wallMat);
    wallRight.position.set(5, 2, -25);
    wallRight.rotation.y = Math.PI / 2;
    
    const wallEndGeo = new THREE.BoxGeometry(12, 5, 2);
    const wallEnd = new THREE.Mesh(wallEndGeo, wallMat);
    wallEnd.position.set(0, 2, -35); // Cierra el túnel
    envGroup.add(wallLeft, wallRight, wallEnd);

    // Misión 5: Plataforma elevada y Cráter
    // Cráter (simulado con un foso o agujero negro)
    const craterGeo = new THREE.CylinderGeometry(8, 8, 0.1, 32);
    const craterMat = new THREE.MeshBasicMaterial({ color: '#000000' }); // Black hole
    const crater = new THREE.Mesh(craterGeo, craterMat);
    crater.position.set(20, -0.48, -10);
    envGroup.add(crater);

    // Plataforma de rescate
    const platGeo = new THREE.BoxGeometry(10, 6, 10);
    const plat = new THREE.Mesh(platGeo, wallMat);
    plat.position.set(35, 2.5, -10);
    plat.receiveShadow = true;
    plat.castShadow = true;
    
    // Indicador en plataforma
    const padGeo = new THREE.PlaneGeometry(6, 6);
    const padMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' }); // Sky blue target
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(35, 5.51, -10);
    envGroup.add(plat, pad);

    this.scene.add(envGroup);
  }

  public init(canvas: HTMLCanvasElement): void {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    
    this.controls = new MapControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minZoom = 0.5;
    this.controls.maxZoom = 4;
    this.controls.maxPolarAngle = Math.PI / 2;

    this.resize(canvas.clientWidth, canvas.clientHeight);
    this.startLoop();
  }

  public updateHardware(installedHardware: string[]): void {
    const mapping: Record<string, string> = {
      'Ruedas Básicas': 'hw_ruedas',
      'Tracción Oruga': 'hw_ruedas', // use same mesh for now
      'Hélices Cuádruples': 'hw_helices',
      'Brazo Robótico': 'hw_garra',
      'Sensor Ultrasónico': 'hw_sonar',
      'Lidar': 'hw_sonar', // reuse mesh or create new one later
      'Faro LED': 'hw_led'
    };

    // Hide all first
    ['hw_ruedas', 'hw_helices', 'hw_garra', 'hw_sonar', 'hw_led'].forEach(name => {
      const part = this.botGroup.getObjectByName(name);
      if (part) part.visible = false;
    });

    // Show installed
    installedHardware.forEach(hw => {
      const name = mapping[hw];
      if (name) {
        const part = this.botGroup.getObjectByName(name);
        if (part) part.visible = true;
      }
    });
  }

  public dispose(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    this.renderer.dispose();
  }

  public resize(width: number, height: number): void {
    const aspect = width / height;
    const frustumSize = 20;
    this.camera.left = frustumSize * aspect / -2;
    this.camera.right = frustumSize * aspect / 2;
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
      if (this.controls) this.controls.update(); // only required if controls.enableDamping or controls.autoRotate are set
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  public async moveForward(distance: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startPos = this.botGroup.position.clone();
      // Calculate forward vector based on current rotation
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.botGroup.quaternion);
      const endPos = startPos.clone().add(forward.multiplyScalar(distance / 10)); // Scale distance

      let elapsed = 0;
      const animateMovement = (delta: number) => {
        elapsed += delta;
        const progress = Math.min(elapsed / (duration / 1000), 1);
        
        // Ease in-out quad
        const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        this.botGroup.position.lerpVectors(startPos, endPos, easeProgress);

        if (progress < 1 && this.isRunning) {
          requestAnimationFrame(() => animateMovement(this.clock.getDelta()));
        } else {
          resolve();
        }
      };
      
      this.clock.getDelta(); // Reset delta
      animateMovement(0);
    });
  }

  public async rotateCore(degrees: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startRot = this.botGroup.rotation.y;
      const endRot = startRot + (degrees * Math.PI / 180);

      let elapsed = 0;
      const animateRotation = (delta: number) => {
        elapsed += delta;
        const progress = Math.min(elapsed / (duration / 1000), 1);
        
        // Ease in-out quad
        const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        this.botGroup.rotation.y = THREE.MathUtils.lerp(startRot, endRot, easeProgress);

        if (progress < 1 && this.isRunning) {
          requestAnimationFrame(() => animateRotation(this.clock.getDelta()));
        } else {
          resolve();
        }
      };
      
      this.clock.getDelta(); // Reset delta
      animateRotation(0);
    });
  }

  public async triggerUltrasonicSensor(duration: number): Promise<number> {
    return new Promise((resolve) => {
      let elapsed = 0;
      
      const animatePulse = (delta: number) => {
        elapsed += delta;
        const totalDuration = duration / 1000;
        const progress = Math.min(elapsed / totalDuration, 1);
        
        // Pulse opacity up and down
        if (progress < 0.5) {
          (this.ultrasonicCone.material as THREE.MeshBasicMaterial).opacity = progress * 1.6; // Max 0.8
        } else {
          (this.ultrasonicCone.material as THREE.MeshBasicMaterial).opacity = (1 - progress) * 1.6;
        }

        if (progress < 1 && this.isRunning) {
          requestAnimationFrame(() => animatePulse(this.clock.getDelta()));
        } else {
          (this.ultrasonicCone.material as THREE.MeshBasicMaterial).opacity = 0;
          // Return a random distance or fixed for now since it's just a visual simulation
          resolve(Math.floor(Math.random() * 15) + 5); 
        }
      };
      
      this.clock.getDelta(); // Reset delta
      animatePulse(0);
    });
  }

  public stop(): void {
    // Logic to interrupt animations could be added here
  }

  public reset(): void {
    this.botGroup.position.set(0, 0, 0);
    this.botGroup.rotation.set(0, 0, 0);
  }
}
