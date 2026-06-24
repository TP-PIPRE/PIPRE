import * as THREE from "three";

export interface RobotParts {
  group: THREE.Group;
  core: THREE.Mesh;
  parts: Record<string, THREE.Object3D>;
}

export interface IRobotBuilder {
  create(): RobotParts;
}
