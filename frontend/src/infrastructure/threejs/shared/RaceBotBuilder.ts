/* eslint-disable @typescript-eslint/no-explicit-any */
import * as THREE from "three";

export interface RaceBotParts {
  group: THREE.Group;
  core: THREE.Mesh;
  wheels: THREE.Group;
  turbo: THREE.Group;
  suspension: THREE.Group;
  spoiler: THREE.Group;
  sensor: THREE.Group;
  parachute: THREE.Group;
}

export class RaceBotBuilder {
  static create(): RaceBotParts {
    const group = new THREE.Group();

    // --- Low body (F1 style) ---
    const bodyMat = new THREE.MeshStandardMaterial({ color: "#dc2626", roughness: 0.3, metalness: 0.7 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.35, 4.5), bodyMat);
    body.position.y = 0.15;
    body.castShadow = true;
    group.add(body);

    // Nose cone
    const noseMat = new THREE.MeshStandardMaterial({ color: "#dc2626", roughness: 0.3, metalness: 0.7 });
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.0, 8), noseMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.15, -2.7);
    group.add(nose);

    // Cockpit
    const cockpitMat = new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.1, metalness: 0.9 });
    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.6), cockpitMat);
    cockpit.position.set(0, 0.35, -0.5);
    group.add(cockpit);

    // Racing stripe
    const stripeMat = new THREE.MeshStandardMaterial({ color: "#fbbf24", roughness: 0.3 });
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 4.0), stripeMat);
    stripe.position.set(0, 0.33, 0);
    group.add(stripe);
    const stripe2 = stripe.clone();
    stripe2.position.set(0.6, 0.33, 0);
    group.add(stripe2);

    // Headlights
    const lightMat = new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 0.5 });
    const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), lightMat);
    headlight.position.set(0.4, 0.15, -2.3);
    group.add(headlight);
    const headlight2 = headlight.clone();
    headlight2.position.set(-0.4, 0.15, -2.3);
    group.add(headlight2);

    // Taillights
    const tailMat = new THREE.MeshStandardMaterial({ color: "#ff0000", emissive: "#ff0000", emissiveIntensity: 0.4 });
    const taillight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), tailMat);
    taillight.position.set(0.4, 0.15, 2.3);
    group.add(taillight);
    const taillight2 = taillight.clone();
    taillight2.position.set(-0.4, 0.15, 2.3);
    group.add(taillight2);

    // --- Core (engine indicator) ---
    const coreMat = new THREE.MeshStandardMaterial({
      color: "#fbbf24",
      emissive: "#fbbf24",
      emissiveIntensity: 0.6,
    });
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), coreMat);
    core.position.set(0, 0.35, 1.8);
    group.add(core);

    // --- Wheels (race tires) ---
    const wheelsGroup = new THREE.Group();
    wheelsGroup.name = "hw_wheels";
    const tireMat = new THREE.MeshStandardMaterial({ color: "#111111", roughness: 1 });
    const rimMat = new THREE.MeshStandardMaterial({ color: "#94a3b8", roughness: 0.3, metalness: 0.8 });
    const wheelPositions = [
      [-1.2, 0.1, 1.5], [1.2, 0.1, 1.5],
      [-1.2, 0.1, -1.5], [1.2, 0.1, -1.5],
    ];
    wheelPositions.forEach((pos) => {
      const tire = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.12, 8, 16), tireMat);
      tire.rotation.y = Math.PI / 2;
      tire.position.set(pos[0], pos[1], pos[2]);
      wheelsGroup.add(tire);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 8), rimMat);
      rim.rotation.z = Math.PI / 2;
      rim.position.set(pos[0], pos[1], pos[2]);
      wheelsGroup.add(rim);
    });
    // Rear wheels (wider)
    [[-1.4, 0.1, 1.8], [1.4, 0.1, 1.8]].forEach((pos) => {
      const wideTire = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.15, 8, 16), tireMat);
      wideTire.rotation.y = Math.PI / 2;
      wideTire.position.set(pos[0], pos[1], pos[2]);
      wheelsGroup.add(wideTire);
    });
    wheelsGroup.visible = false;
    group.add(wheelsGroup);

    // --- Turbo (exhaust pipes) ---
    const turboGroup = new THREE.Group();
    turboGroup.name = "hw_turbo";
    const exhaustMat = new THREE.MeshStandardMaterial({ color: "#4a5568", roughness: 0.4, metalness: 0.9 });
    [[-0.5, 0.1, 2.3], [0.5, 0.1, 2.3]].forEach((pos) => {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.3, 8), exhaustMat);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(pos[0], pos[1], pos[2]);
      turboGroup.add(pipe);
      const flameMat = new THREE.MeshBasicMaterial({ color: "#f59e0b", transparent: true, opacity: 0.5 });
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15, 6), flameMat);
      flame.rotation.x = Math.PI / 2;
      flame.position.set(pos[0], pos[1], pos[2] + 0.2);
      turboGroup.add(flame);
    });
    turboGroup.visible = false;
    group.add(turboGroup);

    // --- Suspension (springs) ---
    const suspensionGroup = new THREE.Group();
    suspensionGroup.name = "hw_suspension";
    const springMat = new THREE.MeshStandardMaterial({ color: "#cbd5e1", roughness: 0.5, metalness: 0.6 });
    [[-1.0, 0.1, 1.2], [1.0, 0.1, 1.2], [-1.0, 0.1, -1.2], [1.0, 0.1, -1.2]].forEach((pos) => {
      const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.3, 6), springMat);
      spring.position.set(pos[0], pos[1], pos[2]);
      suspensionGroup.add(spring);
    });
    suspensionGroup.visible = false;
    group.add(suspensionGroup);

    // --- Spoiler (rear wing) ---
    const spoilerGroup = new THREE.Group();
    spoilerGroup.name = "hw_spoiler";
    const wingMat = new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.5, metalness: 0.3 });
    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 0.4), wingMat);
    wing.position.set(0, 0.5, 2.3);
    spoilerGroup.add(wing);
    const supportMat = new THREE.MeshStandardMaterial({ color: "#94a3b8", roughness: 0.3, metalness: 0.7 });
    [[-0.7, 0.2, 2.3], [0.7, 0.2, 2.3]].forEach((pos) => {
      const support = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.04), supportMat);
      support.position.set(pos[0], pos[1], pos[2]);
      spoilerGroup.add(support);
    });
    spoilerGroup.visible = false;
    group.add(spoilerGroup);

    // --- Speed sensor ---
    const sensorGroup = new THREE.Group();
    sensorGroup.name = "hw_sensor";
    const sensorMat = new THREE.MeshStandardMaterial({ color: "#334155", roughness: 0.5 });
    const sensorBox = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.1), sensorMat);
    sensorBox.position.set(0, 0.1, -2.5);
    sensorGroup.add(sensorBox);
    const ledMat = new THREE.MeshStandardMaterial({ color: "#3b82f6", emissive: "#3b82f6", emissiveIntensity: 0.5 });
    const led1 = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), ledMat);
    led1.position.set(0.1, 0.1, -2.55);
    sensorGroup.add(led1);
    const led2 = led1.clone();
    led2.position.set(-0.1, 0.1, -2.55);
    sensorGroup.add(led2);
    sensorGroup.visible = false;
    group.add(sensorGroup);

    // --- Paracaídas de Frenado (braking parachute) ---
    const parachuteGroup = new THREE.Group();
    parachuteGroup.name = "hw_parachute";
    const chuteMat = new THREE.MeshStandardMaterial({
      color: "#dc2626",
      roughness: 0.9,
      side: THREE.DoubleSide,
    });
    const chute = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8, 0, Math.PI * 2, 0, Math.PI / 3), chuteMat);
    chute.scale.set(1, 1, 0.6);
    chute.position.set(0, 0.5, 2.5);
    chute.rotation.x = Math.PI / 2;
    parachuteGroup.add(chute);
    const ropeMat = new THREE.MeshStandardMaterial({ color: "#94a3b8", roughness: 0.5 });
    for (let i = -1; i <= 1; i += 0.5) {
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.3), ropeMat);
      rope.position.set(i * 0.25, 0.3, 2.5);
      parachuteGroup.add(rope);
    }
    parachuteGroup.visible = false;
    group.add(parachuteGroup);

    return {
      group, core,
      wheels: wheelsGroup,
      turbo: turboGroup,
      suspension: suspensionGroup,
      spoiler: spoilerGroup,
      sensor: sensorGroup,
      parachute: parachuteGroup,
    };
  }
}
