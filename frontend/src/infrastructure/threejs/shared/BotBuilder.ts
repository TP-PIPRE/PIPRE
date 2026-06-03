import * as THREE from "three";

export interface BotParts {
  group: THREE.Group;
  core: THREE.Mesh;
  wheels: THREE.Group;
  propellers: THREE.Group;
  claw: THREE.Group;
  led: THREE.Group;
  sonar: THREE.Group;
}

export class BotBuilder {
  static createBaseBot(): BotParts {
    const group = new THREE.Group();

    // Chassis Base
    const chassisGeo = new THREE.BoxGeometry(2, 1, 3);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: "#cbd5e1",
      roughness: 0.4,
      metalness: 0.6,
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.castShadow = true;
    group.add(chassis);

    // Core Indicator
    const coreGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16);
    const coreMat = new THREE.MeshStandardMaterial({
      color: "#34D399",
      emissive: "#34D399",
      emissiveIntensity: 0.5,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(0, 0.6, 0);
    group.add(core);

    // 1. Ruedas
    const wheelsGroup = new THREE.Group();
    wheelsGroup.name = "hw_ruedas";
    const wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.9 });
    const wheelPositions = [
      [-1.2, -0.2, 1],
      [1.2, -0.2, 1],
      [-1.2, -0.2, -1],
      [1.2, -0.2, -1],
    ];
    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.rotation.z = Math.PI / 2;
      wheelsGroup.add(wheel);
    });
    wheelsGroup.visible = false;
    group.add(wheelsGroup);

    // 2. Propellers
    const propsGroup = new THREE.Group();
    propsGroup.name = "hw_helices";
    const propArmGeo = new THREE.CylinderGeometry(0.1, 0.1, 2);
    const propMat = new THREE.MeshStandardMaterial({ color: "#94a3b8" });
    const arm1 = new THREE.Mesh(propArmGeo, propMat);
    arm1.position.y = 0.5;
    arm1.rotation.x = Math.PI / 2;
    arm1.rotation.y = Math.PI / 4;
    const arm2 = new THREE.Mesh(propArmGeo, propMat);
    arm2.position.y = 0.5;
    arm2.rotation.x = Math.PI / 2;
    arm2.rotation.y = -Math.PI / 4;
    propsGroup.add(arm1, arm2);
    const bladeGeo = new THREE.BoxGeometry(0.8, 0.05, 0.1);
    const bladeMat = new THREE.MeshStandardMaterial({ color: "#cbd5e1" });
    [[-1, 0.6, -1], [1, 0.6, -1], [-1, 0.6, 1], [1, 0.6, 1]].forEach((pos) => {
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.set(pos[0], pos[1], pos[2]);
      propsGroup.add(blade);
    });
    propsGroup.visible = false;
    group.add(propsGroup);

    // 3. Garra
    const armGroup = new THREE.Group();
    armGroup.name = "hw_garra";
    const armBase = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 1), propMat);
    armBase.position.set(0, 0.2, -1.8);
    armGroup.add(armBase);
    const claw = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.4), propMat);
    claw.position.set(0, 0.2, -2.4);
    armGroup.add(claw);
    armGroup.visible = false;
    group.add(armGroup);

    // 4. Faro LED
    const ledGroup = new THREE.Group();
    ledGroup.name = "hw_led";
    const ledMat = new THREE.MeshStandardMaterial({
      color: "#fcd34d",
      emissive: "#fcd34d",
      emissiveIntensity: 0.8,
    });
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.2), ledMat);
    led.position.set(0, 0.4, -1.6);
    ledGroup.add(led);
    ledGroup.visible = false;
    group.add(ledGroup);

    // 5. Sonar
    const sonarGroup = new THREE.Group();
    sonarGroup.name = "hw_sonar";
    const sonarMat = new THREE.MeshStandardMaterial({ color: "#334155" });
    const sonar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.2), sonarMat);
    sonar.position.set(0, 0.8, -1.6);
    const eyeGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.1);
    eyeGeo.rotateX(Math.PI / 2);
    const eye1 = new THREE.Mesh(eyeGeo, propMat);
    eye1.position.set(-0.15, 0.8, -1.7);
    const eye2 = new THREE.Mesh(eyeGeo, propMat);
    eye2.position.set(0.15, 0.8, -1.7);
    sonarGroup.add(sonar, eye1, eye2);
    sonarGroup.visible = false;
    group.add(sonarGroup);

    return {
      group,
      core,
      wheels: wheelsGroup,
      propellers: propsGroup,
      claw: armGroup,
      led: ledGroup,
      sonar: sonarGroup,
    };
  }
}
