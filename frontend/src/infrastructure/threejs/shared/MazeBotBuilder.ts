/* eslint-disable @typescript-eslint/no-explicit-any */
import * as THREE from "three";

export interface MazeBotParts {
  group: THREE.Group;
  core: THREE.Mesh;
  boots: THREE.Group;
  lantern: THREE.Group;
  key: THREE.Group;
  mirror: THREE.Group;
  portal: THREE.Group;
  sonar: THREE.Group;
  crystal: THREE.Group;
}

export class MazeBotBuilder {
  static create(): MazeBotParts {
    const group = new THREE.Group();

    // --- Body (steampunk cylinder) ---
    const bodyMat = new THREE.MeshStandardMaterial({ color: "#2d1b69", roughness: 0.6, metalness: 0.5 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 1.2, 12), bodyMat);
    body.position.y = 0.4;
    body.castShadow = true;
    group.add(body);

    // Brass banding
    const brassMat = new THREE.MeshStandardMaterial({ color: "#b8860b", roughness: 0.3, metalness: 0.8 });
    const band = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.05, 8, 24), brassMat);
    band.position.y = 0.2;
    band.rotation.x = Math.PI / 2;
    group.add(band);
    const band2 = band.clone();
    band2.position.y = 0.6;
    group.add(band2);

    // --- Head (pointed hat) ---
    const headMat = new THREE.MeshStandardMaterial({ color: "#4a2d8a", roughness: 0.7 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 12), headMat);
    head.position.set(0, 1.1, 0);
    group.add(head);

    // Wizard hat
    const hatMat = new THREE.MeshStandardMaterial({ color: "#2d1b69", roughness: 0.8 });
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.9, 12), hatMat);
    hat.position.set(0, 1.55, -0.1);
    group.add(hat);
    const hatBrim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 8, 16), brassMat);
    hatBrim.position.set(0, 1.15, -0.05);
    hatBrim.rotation.x = Math.PI / 2;
    group.add(hatBrim);

    // Star on hat tip
    const starMat = new THREE.MeshStandardMaterial({ color: "#fbbf24", emissive: "#fbbf24", emissiveIntensity: 0.8 });
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), starMat);
    star.position.set(0, 2.0, -0.1);
    group.add(star);

    // --- Eyes (glowing) ---
    const eyeMat = new THREE.MeshStandardMaterial({ color: "#a78bfa", emissive: "#a78bfa", emissiveIntensity: 0.8 });
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat);
    eye.position.set(0.2, 1.1, -0.45);
    group.add(eye);
    const eye2 = eye.clone();
    eye2.position.set(-0.2, 1.1, -0.45);
    group.add(eye2);

    // --- Core (crystal on chest) ---
    const coreMat = new THREE.MeshStandardMaterial({
      color: "#a78bfa",
      emissive: "#a78bfa",
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.9,
    });
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.2), coreMat);
    core.position.set(0, 0.5, 0.8);
    group.add(core);

    // --- Cape ---
    const capeMat = new THREE.MeshStandardMaterial({
      color: "#1a1040",
      roughness: 1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const cape = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0), capeMat);
    cape.position.set(0, 0.2, -1.2);
    group.add(cape);

    // --- Boots (magical shoes) ---
    const bootsGroup = new THREE.Group();
    bootsGroup.name = "hw_boots";
    const bootMat = new THREE.MeshStandardMaterial({ color: "#2d1b69", roughness: 0.7 });
    const soleMat = new THREE.MeshStandardMaterial({ color: "#b8860b", roughness: 0.4, metalness: 0.6 });
    [[-0.6, 0.15, -0.8], [0.6, 0.15, -0.8]].forEach((pos) => {
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.6), bootMat);
      boot.position.set(pos[0], pos[1], pos[2]);
      bootsGroup.add(boot);
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.6), soleMat);
      sole.position.set(pos[0], -0.05, pos[2]);
      bootsGroup.add(sole);
    });
    bootsGroup.visible = false;
    group.add(bootsGroup);

    // --- Lantern ---
    const lanternGroup = new THREE.Group();
    lanternGroup.name = "hw_lantern";
    const lanternMat = new THREE.MeshStandardMaterial({ color: "#b8860b", roughness: 0.3, metalness: 0.8 });
    const lanternBody = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.4, 8), lanternMat);
    lanternBody.position.set(0.8, 0.6, 1.2);
    lanternGroup.add(lanternBody);
    const glowMat = new THREE.MeshBasicMaterial({ color: "#fbbf24", transparent: true, opacity: 0.4 });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), glowMat);
    glow.position.set(0.8, 0.55, 1.2);
    lanternGroup.add(glow);
    const lanternTop = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.1, 8), lanternMat);
    lanternTop.position.set(0.8, 0.8, 1.2);
    lanternGroup.add(lanternTop);
    lanternGroup.visible = false;
    group.add(lanternGroup);

    // --- Key ---
    const keyGroup = new THREE.Group();
    keyGroup.name = "hw_key";
    const keyMat = new THREE.MeshStandardMaterial({ color: "#b8860b", roughness: 0.3, metalness: 0.9 });
    const keyHandle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.03, 8, 12), keyMat);
    keyHandle.position.set(0, 0.9, -1.6);
    keyGroup.add(keyHandle);
    const keyShaft = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.15, 0.03), keyMat);
    keyShaft.position.set(0, 0.78, -1.6);
    keyGroup.add(keyShaft);
    const keyBit = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.06), keyMat);
    keyBit.position.set(0, 0.7, -1.6);
    keyGroup.add(keyBit);
    keyGroup.visible = false;
    group.add(keyGroup);

    // --- Mirror ---
    const mirrorGroup = new THREE.Group();
    mirrorGroup.name = "hw_mirror";
    const mirrorFrameMat = new THREE.MeshStandardMaterial({ color: "#b8860b", roughness: 0.3, metalness: 0.8 });
    const mirrorFrame = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.04, 8, 12), mirrorFrameMat);
    mirrorFrame.position.set(-1.0, 0.6, 1.2);
    mirrorGroup.add(mirrorFrame);
    const mirrorGlass = new THREE.Mesh(
      new THREE.CircleGeometry(0.2, 12),
      new THREE.MeshBasicMaterial({ color: "#a78bfa", transparent: true, opacity: 0.4 }),
    );
    mirrorGlass.position.set(-1.0, 0.6, 1.25);
    mirrorGroup.add(mirrorGlass);
    mirrorGroup.visible = false;
    group.add(mirrorGroup);

    // --- Portal orb (teletransport) ---
    const portalGroup = new THREE.Group();
    portalGroup.name = "hw_portal";
    const orbMat = new THREE.MeshStandardMaterial({
      color: "#a78bfa",
      emissive: "#a78bfa",
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.8,
    });
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), orbMat);
    orb.position.set(-0.6, 0.8, -1.6);
    portalGroup.add(orb);
    const ringMat = new THREE.MeshBasicMaterial({ color: "#c084fc", transparent: true, opacity: 0.3 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.02, 8, 16), ringMat);
    ring.position.copy(orb.position);
    ring.rotation.x = Math.PI / 2;
    portalGroup.add(ring);
    portalGroup.visible = false;
    group.add(portalGroup);

    // --- Sonar (magic sensor) ---
    const sonarGroup = new THREE.Group();
    sonarGroup.name = "hw_sonar";
    const sonarBoxMat = new THREE.MeshStandardMaterial({ color: "#2d1b69", roughness: 0.6 });
    const sonarBox = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.12), sonarBoxMat);
    sonarBox.position.set(0, 0.3, 1.2);
    sonarGroup.add(sonarBox);
    const crystalMat = new THREE.MeshStandardMaterial({ color: "#a78bfa", emissive: "#a78bfa", emissiveIntensity: 0.5 });
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.06), crystalMat);
    crystal.position.set(0.15, 0.3, 1.25);
    sonarGroup.add(crystal);
    const crystal2 = crystal.clone();
    crystal2.position.set(-0.15, 0.3, 1.25);
    sonarGroup.add(crystal2);
    sonarGroup.visible = false;
    group.add(sonarGroup);

    // --- Cristal de Escarcha (frost crystal) ---
    const crystalGroup = new THREE.Group();
    crystalGroup.name = "hw_crystal";
    const crystalBodyMat = new THREE.MeshStandardMaterial({
      color: "#7dd3fc",
      emissive: "#7dd3fc",
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.85,
    });
    const crystalBody = new THREE.Mesh(new THREE.OctahedronGeometry(0.15), crystalBodyMat);
    crystalBody.position.set(-0.6, 0.9, 1.4);
    crystalGroup.add(crystalBody);
    const glowRingMat = new THREE.MeshBasicMaterial({ color: "#bae6fd", transparent: true, opacity: 0.25 });
    const glowRing = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 8, 16), glowRingMat);
    glowRing.position.copy(crystalBody.position);
    glowRing.rotation.x = Math.PI / 2;
    crystalGroup.add(glowRing);
    crystalGroup.visible = false;
    group.add(crystalGroup);

    return {
      group, core,
      boots: bootsGroup,
      lantern: lanternGroup,
      key: keyGroup,
      mirror: mirrorGroup,
      portal: portalGroup,
      sonar: sonarGroup,
      crystal: crystalGroup,
    };
  }
}
