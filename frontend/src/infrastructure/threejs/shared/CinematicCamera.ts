import * as THREE from "three";
import type { MapControls } from "three/addons/controls/MapControls.js";

export class CinematicCamera {
  private controls: MapControls;
  private camera: THREE.PerspectiveCamera;
  private followTarget: THREE.Vector3;
  private isActive = false;
  private shakeIntensity = 0;
  private zoomTarget = 0;
  private currentZoom = 0;
  private defaultDistance = 18;
  private smoothFactor = 0.05;
  private isFollowing = false;

  constructor(camera: THREE.PerspectiveCamera, controls: MapControls) {
    this.camera = camera;
    this.controls = controls;
    this.followTarget = new THREE.Vector3();
    this.defaultDistance = camera.position.distanceTo(controls.target);
  }

  startFollow(target: THREE.Vector3, offset?: { x: number; y: number; z: number }): void {
    this.isFollowing = true;
    const off = offset || { x: 0, y: 5, z: 6 };
    this.followTarget.copy(target);
    this.followTarget.x += off.x;
    this.followTarget.y += off.y;
    this.followTarget.z += off.z;
    this.controls.target.copy(target);
    this.isActive = true;
  }

  stopFollow(): void {
    this.isFollowing = false;
  }

  triggerShake(intensity: number = 0.3, duration: number = 400): void {
    this.shakeIntensity = intensity;
    setTimeout(() => { this.shakeIntensity = 0; }, duration);
  }

  triggerZoom(distance: number = 8, duration: number = 500): void {
    this.zoomTarget = distance;
    this.currentZoom = this.defaultDistance;
    setTimeout(() => { this.zoomTarget = 0; }, duration);
  }

  followTargetPosition(target: THREE.Vector3, offset?: { x: number; y: number; z: number }): void {
    const off = offset || { x: 0, y: 5, z: 6 };
    this.followTarget.copy(target);
    this.followTarget.x += off.x;
    this.followTarget.y += off.y;
    this.followTarget.z += off.z;
  }

  update(target: THREE.Vector3): void {
    if (!this.isActive) return;

    if (this.isFollowing) {
      this.followTargetPosition(target);
      this.controls.target.lerp(this.followTarget, this.smoothFactor * 1.5);

      const dirToCamera = this.camera.position.clone().sub(this.controls.target).normalize();
      const targetDist = this.zoomTarget > 0 ? this.zoomTarget : this.defaultDistance;
      this.currentZoom += (targetDist - this.currentZoom) * 0.1;
      const targetCamPos = this.controls.target.clone().add(dirToCamera.multiplyScalar(this.currentZoom));
      this.camera.position.lerp(targetCamPos, this.smoothFactor);
    }

    if (this.shakeIntensity > 0.001) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.z += (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= 0.9;
    }
  }
}
