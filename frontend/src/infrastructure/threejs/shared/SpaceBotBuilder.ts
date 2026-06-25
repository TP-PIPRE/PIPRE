/* eslint-disable @typescript-eslint/no-explicit-any */
import * as THREE from "three";

export interface SpaceBotParts {
  group: THREE.Group;
  core: THREE.Mesh;
  wheels: THREE.Group;
  propellers: THREE.Group;
  arm: THREE.Group;
  analyzer: THREE.Group;
  sonar: THREE.Group;
  drill: THREE.Group;
}

export class SpaceBotBuilder {
  static create(): SpaceBotParts {
    const group = new THREE.Group();

    // --- Rover Body ---
    const bodyMat = new THREE.MeshStandardMaterial({ color: "#cbd5e1", roughness: 0.5, metalness: 0.4 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.6, 3), bodyMat);
    body.position.y = 0.2;
    body.castShadow = true;
    group.add(body);

    // Solar panels (wings)
    const panelMat = new THREE.MeshStandardMaterial({
      color: "#1e3a5f",
      roughness: 0.8,
      metalness: 0.3,
      emissive: "#1e3a5f",
      emissiveIntensity: 0.1,
    });
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.05, 1.2), panelMat);
    panel.position.set(0, 0.5, 0);
    group.add(panel);
    // Panel grid lines
    const gridMat = new THREE.MeshBasicMaterial({ color: "#3b82f6", transparent: true, opacity: 0.2 });
    for (let i = -1; i <= 1; i += 0.5) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.01, 1.0), gridMat);
      line.position.set(i, 0.52, 0);
      group.add(line);
    }

    // --- Core (power indicator) ---
    const coreMat = new THREE.MeshStandardMaterial({
      color: "#3b82f6",
      emissive: "#3b82f6",
      emissiveIntensity: 0.5,
    });
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), coreMat);
    core.position.set(0, 0.55, 1.2);
    group.add(core);

    // --- Camera mast ---
    const mastMat = new THREE.MeshStandardMaterial({ color: "#94a3b8", metalness: 0.6, roughness: 0.4 });
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.8), mastMat);
    mast.position.set(0, 0.7, -1.2);
    group.add(mast);
    const camera = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.15, 0.15),
      new THREE.MeshStandardMaterial({ color: "#334155", roughness: 0.3, metalness: 0.7 }),
    );
    camera.position.set(0, 1.1, -1.3);
    group.add(camera);
    const lensMat = new THREE.MeshStandardMaterial({ color: "#3b82f6", emissive: "#3b82f6", emissiveIntensity: 0.3 });
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), lensMat);
    lens.position.set(0, 1.1, -1.45);
    group.add(lens);

    // --- Wheels (6 rover wheels) ---
    const wheelsGroup = new THREE.Group();
    wheelsGroup.name = "hw_wheels";
    const wheelMat = new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.9 });
    const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.15, 12);
    const wheelPositions = [
      [-1.3, 0.1, 1.2], [1.3, 0.1, 1.2],
      [-1.3, 0.1, 0], [1.3, 0.1, 0],
      [-1.3, 0.1, -1.2], [1.3, 0.1, -1.2],
    ];
    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheelsGroup.add(wheel);
    });
    wheelsGroup.visible = false;
    group.add(wheelsGroup);

    // --- Propellers (drone rotors) ---
    const propellersGroup = new THREE.Group();
    propellersGroup.name = "hw_propellers";
    const armMat = new THREE.MeshStandardMaterial({ color: "#94a3b8", roughness: 0.5 });
    const bladeMat = new THREE.MeshStandardMaterial({ color: "#cbd5e1", roughness: 0.6 });
    const positions = [[-1.8, 0.6, -1.2], [1.8, 0.6, -1.2], [-1.8, 0.6, 1.2], [1.8, 0.6, 1.2]];
    positions.forEach((pos) => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.6), armMat);
      arm.position.set(pos[0] / 2, pos[1], pos[2] / 2);
      arm.lookAt(pos[0], pos[1], pos[2]);
      propellersGroup.add(arm);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.08), bladeMat);
      blade.position.set(pos[0], pos[1], pos[2]);
      propellersGroup.add(blade);
    });
    propellersGroup.visible = false;
    group.add(propellersGroup);

    // --- Robotic Arm ---
    const armGroup = new THREE.Group();
    armGroup.name = "hw_arm";
    const armMat2 = new THREE.MeshStandardMaterial({ color: "#64748b", roughness: 0.4, metalness: 0.6 });
    const armSeg1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.4, 0.15), armMat2);
    armSeg1.position.set(-1.2, 0.5, 1.8);
    armGroup.add(armSeg1);
    const armSeg2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.12), armMat2);
    armSeg2.position.set(-1.2, 0.85, 2.0);
    armGroup.add(armSeg2);
    const clawMat = new THREE.MeshStandardMaterial({ color: "#94a3b8", roughness: 0.5 });
    const claw1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.1), clawMat);
    claw1.position.set(-1.15, 0.95, 2.1);
    armGroup.add(claw1);
    const claw2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.1), clawMat);
    claw2.position.set(-1.25, 0.95, 2.1);
    armGroup.add(claw2);
    armGroup.visible = false;
    group.add(armGroup);

    // --- Analyzer (science instrument) ---
    const analyzerGroup = new THREE.Group();
    analyzerGroup.name = "hw_analyzer";
    const analyzerMat = new THREE.MeshStandardMaterial({ color: "#3b82f6", emissive: "#3b82f6", emissiveIntensity: 0.2 });
    const analyzerBox = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.4), analyzerMat);
    analyzerBox.position.set(1.2, 0.4, 1.8);
    analyzerGroup.add(analyzerBox);
    const analyzerScreen = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.05, 0.3),
      new THREE.MeshBasicMaterial({ color: "#00ff88", transparent: true, opacity: 0.6 }),
    );
    analyzerScreen.position.set(1.2, 0.55, 1.8);
    analyzerGroup.add(analyzerScreen);
    analyzerGroup.visible = false;
    group.add(analyzerGroup);

    // --- Sonar (proximity sensor) ---
    const sonarGroup = new THREE.Group();
    sonarGroup.name = "hw_sonar";
    const sonarMat = new THREE.MeshStandardMaterial({ color: "#334155", roughness: 0.6 });
    const sonarBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.15), sonarMat);
    sonarBox.position.set(0, 0.5, -1.8);
    sonarGroup.add(sonarBox);
    const sonarEyeMat = new THREE.MeshStandardMaterial({ color: "#9b5de5", emissive: "#9b5de5", emissiveIntensity: 0.5 });
    const sonarEye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), sonarEyeMat);
    sonarEye.position.set(0.15, 0.5, -1.9);
    sonarGroup.add(sonarEye);
    const sonarEye2 = sonarEye.clone();
    sonarEye2.position.set(-0.15, 0.5, -1.9);
    sonarGroup.add(sonarEye2);
    sonarGroup.visible = false;
    group.add(sonarGroup);

    // --- Taladro Percutor (drill) ---
    const drillGroup = new THREE.Group();
    drillGroup.name = "hw_drill";
    const drillMat = new THREE.MeshStandardMaterial({ color: "#475569", roughness: 0.4, metalness: 0.7 });
    const drillBody = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 0.35, 8), drillMat);
    drillBody.position.set(1.2, 0.3, -1.8);
    drillGroup.add(drillBody);
    const drillBit = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.2, 8),
      new THREE.MeshStandardMaterial({ color: "#94a3b8", metalness: 0.9, roughness: 0.2 }),
    );
    drillBit.position.set(1.2, 0.15, -1.8);
    drillGroup.add(drillBit);
    drillGroup.visible = false;
    group.add(drillGroup);

    return {
      group, core,
      wheels: wheelsGroup,
      propellers: propellersGroup,
      arm: armGroup,
      analyzer: analyzerGroup,
      sonar: sonarGroup,
      drill: drillGroup,
    };
  }
}
