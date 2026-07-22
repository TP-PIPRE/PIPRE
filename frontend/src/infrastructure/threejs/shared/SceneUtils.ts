import * as THREE from "three";

export interface SceneSetupOptions {
  fov?: number;
  near?: number;
  far?: number;
  cameraPos?: [number, number, number];
  cameraTarget?: [number, number, number];
  fogColor?: string;
  fogNear?: number;
  fogFar?: number;
  bgColor?: string;
  ambientColor?: string;
  ambientIntensity?: number;
  skyColor?: string;
  groundColor?: string;
  hemiIntensity?: number;
  dirColor?: string;
  dirIntensity?: number;
  dirPos?: [number, number, number];
  shadowMapSize?: number;
  shadowCameraSize?: number;
}

export interface SceneSetupResult {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  shadowLight: THREE.DirectionalLight;
}

export function createSceneWithCamera(options: SceneSetupOptions = {}): SceneSetupResult {
  const {
    fov = 50,
    near = 0.5,
    far = 200,
    cameraPos = [18, 14, 18],
    cameraTarget = [0, 0, 0],
    fogColor = "#0a0a1a",
    fogNear = 30,
    fogFar = 100,
    bgColor = "#0a0a1a",
    ambientColor = "#8888cc",
    ambientIntensity = 0.35,
    skyColor = "#4466aa",
    groundColor = "#221133",
    hemiIntensity = 0.5,
    dirColor = "#ffffff",
    dirIntensity = 1.2,
    dirPos = [15, 25, 10],
    shadowMapSize = 2048,
    shadowCameraSize = 30,
  } = options;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bgColor);
  scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);

  const aspect = typeof window !== "undefined" ? window.innerWidth / window.innerHeight : 1;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(...cameraPos);
  camera.lookAt(...cameraTarget);

  const ambient = new THREE.AmbientLight(ambientColor, ambientIntensity);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(skyColor, groundColor, hemiIntensity);
  scene.add(hemi);

  const dirLight = new THREE.DirectionalLight(dirColor, dirIntensity);
  dirLight.position.set(...dirPos);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = shadowMapSize;
  dirLight.shadow.mapSize.height = shadowMapSize;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 100;
  dirLight.shadow.camera.left = -shadowCameraSize;
  dirLight.shadow.camera.right = shadowCameraSize;
  dirLight.shadow.camera.top = shadowCameraSize;
  dirLight.shadow.camera.bottom = -shadowCameraSize;
  dirLight.shadow.bias = -0.0001;
  dirLight.shadow.normalBias = 0.02;
  scene.add(dirLight);

  return { scene, camera, shadowLight: dirLight };
}

export function createShadowFloor(
  scene: THREE.Scene,
  size: number = 80,
  y: number = -0.5,
  color: string = "#1a1a2e"
): THREE.Mesh {
  const floorGeo = new THREE.PlaneGeometry(size, size);
  const floorMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.85,
    metalness: 0.1,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = y;
  floor.receiveShadow = true;
  floor.name = "environment_floor";
  scene.add(floor);
  return floor;
}

export function createGrid(
  scene: THREE.Scene,
  size: number = 80,
  divisions: number = 80,
  colorCenter: string = "#334155",
  colorEdge: string = "#1e293b",
  y: number = -0.49
): THREE.GridHelper {
  const grid = new THREE.GridHelper(size, divisions, colorCenter, colorEdge);
  grid.position.y = y;
  grid.name = "environment_grid";
  scene.add(grid);
  return grid;
}

export function createStarfield(
  scene: THREE.Scene,
  count: number = 400,
  radius: number = 80,
  minY: number = 2,
  maxY: number = 35,
  color: string = "#ffffff",
  size: number = 0.15,
  opacity: number = 0.7
): THREE.Points {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * (0.6 + Math.random() * 0.4);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = minY + Math.random() * (maxY - minY);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const stars = new THREE.Points(geo, mat);
  scene.add(stars);
  return stars;
}

export function createGlowRing(
  scene: THREE.Scene,
  x: number,
  y: number,
  z: number,
  radius: number,
  color: string,
  opacity: number = 0.4
): THREE.Mesh {
  const ringGeo = new THREE.TorusGeometry(radius, 0.15, 16, 48);
  const ringMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.6,
    roughness: 0.3,
    transparent: true,
    opacity,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.set(x, y, z);
  ring.rotation.x = Math.PI / 2;
  ring.name = "glow_ring";
  scene.add(ring);
  return ring;
}

export function createPillar(
  scene: THREE.Scene,
  x: number,
  z: number,
  height: number = 2.5,
  color: string = "#444466",
  emissive: string = "#222244",
  emissiveIntensity: number = 0.3
): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(0.25, 0.35, height, 12);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.6,
    metalness: 0.4,
    emissive,
    emissiveIntensity,
  });
  const pillar = new THREE.Mesh(geo, mat);
  pillar.position.set(x, height / 2 - 0.5, z);
  pillar.castShadow = true;
  pillar.receiveShadow = true;
  scene.add(pillar);
  return pillar;
}
