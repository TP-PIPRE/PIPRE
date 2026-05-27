/* eslint-disable @typescript-eslint/no-explicit-any */
import * as THREE from "three";

export interface BattleBotParts {
  group: THREE.Group;
  core: THREE.Mesh;
  treads: THREE.Group;
  cannon: THREE.Group;
  shield: THREE.Group;
  radar: THREE.Group;
  sonar: THREE.Group;
  hacha: THREE.Group;
}

export class BattleBotBuilder {
  static create(): BattleBotParts {
    const group = new THREE.Group();

    // --- Torso (armored chassis) ---
    const torsoMat = new THREE.MeshStandardMaterial({ color: "#4a5568", roughness: 0.6, metalness: 0.7 });
    const torso = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 2.8), torsoMat);
    torso.position.y = 0.4;
    torso.castShadow = true;
    group.add(torso);

    // Armor plates on torso
    const armorMat = new THREE.MeshStandardMaterial({ color: "#e94560", roughness: 0.3, metalness: 0.8 });
    const plate1 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 0.5), armorMat);
    plate1.position.set(0, 0.8, 1.3);
    group.add(plate1);
    const plate2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 0.5), armorMat);
    plate2.position.set(0, 0.8, -1.3);
    group.add(plate2);

    // --- Head ---
    const headMat = new THREE.MeshStandardMaterial({ color: "#718096", roughness: 0.4, metalness: 0.6 });
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.8), headMat);
    head.position.set(0, 1.1, -0.8);
    group.add(head);

    // Visor (glowing eyes)
    const visorMat = new THREE.MeshStandardMaterial({
      color: "#ff4444",
      emissive: "#ff4444",
      emissiveIntensity: 0.6,
    });
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.1), visorMat);
    visor.position.set(0, 1.1, -1.25);
    group.add(visor);

    // Antenna
    const antennaMat = new THREE.MeshStandardMaterial({ color: "#a0aec0" });
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6), antennaMat);
    antenna.position.set(0.4, 1.55, -0.8);
    group.add(antenna);
    const antennaBall = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), visorMat);
    antennaBall.position.set(0.4, 1.85, -0.8);
    group.add(antennaBall);

    // --- Core (power core on chest) ---
    const coreMat = new THREE.MeshStandardMaterial({
      color: "#ff6b6b",
      emissive: "#ff6b6b",
      emissiveIntensity: 0.5,
    });
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.15, 12), coreMat);
    core.position.set(0, 0.5, 1.5);
    group.add(core);

    // --- Treads (instead of wheels) ---
    const treadsGroup = new THREE.Group();
    treadsGroup.name = "hw_treads";
    const treadMat = new THREE.MeshStandardMaterial({ color: "#1a202c", roughness: 0.9 });
    for (let side = -1; side <= 1; side += 2) {
      const treadBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 2.6), treadMat);
      treadBody.position.set(side * 1.5, -0.1, 0);
      treadsGroup.add(treadBody);
      // Wheels on treads
      const wMat = new THREE.MeshStandardMaterial({ color: "#2d3748", roughness: 0.8 });
      for (let z = -1; z <= 1; z += 0.67) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12), wMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(side * 1.7, -0.1, z);
        treadsGroup.add(wheel);
      }
    }
    treadsGroup.visible = false;
    group.add(treadsGroup);

    // --- Cannon (right arm) ---
    const cannonGroup = new THREE.Group();
    cannonGroup.name = "hw_cannon";
    const cannonMat = new THREE.MeshStandardMaterial({ color: "#2d3748", roughness: 0.5, metalness: 0.8 });
    const cannonArm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 1.2), cannonMat);
    cannonArm.position.set(1.3, 0.4, -1.2);
    cannonGroup.add(cannonArm);
    const cannonBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 0.6), cannonMat);
    cannonBarrel.rotation.x = Math.PI / 2;
    cannonBarrel.position.set(1.3, 0.4, -2);
    cannonGroup.add(cannonBarrel);
    const cannonTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 8),
      new THREE.MeshStandardMaterial({ color: "#ff4444", emissive: "#ff4444", emissiveIntensity: 0.4 }),
    );
    cannonTip.position.set(1.3, 0.4, -2.3);
    cannonGroup.add(cannonTip);
    cannonGroup.visible = false;
    group.add(cannonGroup);

    // --- Shield (left arm) ---
    const shieldGroup = new THREE.Group();
    shieldGroup.name = "hw_shield";
    const shieldMat = new THREE.MeshStandardMaterial({
      color: "#34D399",
      emissive: "#34D399",
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.7,
      roughness: 0.3,
    });
    const shieldMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.0, 0.1), shieldMat);
    shieldMesh.position.set(-1.5, 0.3, -1.2);
    shieldGroup.add(shieldMesh);
    // Shield border
    const borderMat = new THREE.MeshStandardMaterial({ color: "#2d3748", metalness: 0.9, roughness: 0.3 });
    const border = new THREE.Mesh(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.6, 1.0, 0.1)), borderMat);
    border.position.copy(shieldMesh.position);
    shieldGroup.add(border);
    shieldGroup.visible = false;
    group.add(shieldGroup);

    // --- Radar (on head) ---
    const radarGroup = new THREE.Group();
    radarGroup.name = "hw_radar";
    const radarMat = new THREE.MeshStandardMaterial({ color: "#718096", roughness: 0.5 });
    const radarBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.1, 8), radarMat);
    radarBase.position.set(-0.4, 1.55, -0.8);
    radarGroup.add(radarBase);
    const radarDish = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 8),
      new THREE.MeshStandardMaterial({ color: "#fbbf24", emissive: "#fbbf24", emissiveIntensity: 0.3 }),
    );
    radarDish.position.set(-0.4, 1.7, -0.95);
    radarGroup.add(radarDish);
    radarGroup.visible = false;
    group.add(radarGroup);

    // --- Sonar (chest sensor) ---
    const sonarGroup = new THREE.Group();
    sonarGroup.name = "hw_sonar";
    const sonarMat = new THREE.MeshStandardMaterial({ color: "#2d3748", roughness: 0.6 });
    const sonarMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.1), sonarMat);
    sonarMesh.position.set(0, 0.2, 1.55);
    sonarGroup.add(sonarMesh);
    const sonarEye = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshStandardMaterial({ color: "#9b5de5", emissive: "#9b5de5", emissiveIntensity: 0.5 }),
    );
    sonarEye.position.set(0.2, 0.2, 1.6);
    sonarGroup.add(sonarEye);
    const sonarEye2 = sonarEye.clone();
    sonarEye2.position.set(-0.2, 0.2, 1.6);
    sonarGroup.add(sonarEye2);
    sonarGroup.visible = false;
    group.add(sonarGroup);

    // --- Hacha de Combate (battle axe) ---
    const hachaGroup = new THREE.Group();
    hachaGroup.name = "hw_hacha";
    const hachaMat = new THREE.MeshStandardMaterial({ color: "#666", roughness: 0.4, metalness: 0.8 });
    const hachaHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.7), hachaMat);
    hachaHandle.position.set(-1.3, 0.3, 1.2);
    hachaGroup.add(hachaHandle);
    const bladeMat = new THREE.MeshStandardMaterial({ color: "#e94560", roughness: 0.2, metalness: 0.9 });
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.35, 0.4), bladeMat);
    blade.position.set(-1.3, 0.65, 1.2);
    hachaGroup.add(blade);
    const edge = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.3, 0.35),
      new THREE.MeshStandardMaterial({ color: "#fff", emissive: "#e94560", emissiveIntensity: 0.2 }),
    );
    edge.position.set(-1.3, 0.65, 1.0);
    hachaGroup.add(edge);
    hachaGroup.visible = false;
    group.add(hachaGroup);

    return {
      group, core,
      treads: treadsGroup,
      cannon: cannonGroup,
      shield: shieldGroup,
      radar: radarGroup,
      sonar: sonarGroup,
      hacha: hachaGroup,
    };
  }
}
