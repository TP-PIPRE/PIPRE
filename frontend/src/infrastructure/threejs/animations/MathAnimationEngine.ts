import * as THREE from "three";
import { EASING, type EasingFn } from "../shared/easing";

export type AnimationType =
  | "linear"
  | "quadratic"
  | "cubic"
  | "sinusoidal"
  | "elastic"
  | "bounce"
  | "spiral"
  | "wave";

export interface AnimationConfig {
  type: AnimationType;
  duration: number;
  delay?: number;
  amplitude?: number;
  frequency?: number;
  phase?: number;
}

export class MathAnimationEngine {
  private animations: Map<string, AnimationState> = new Map();
  private clock: THREE.Clock;

  constructor() {
    this.clock = new THREE.Clock();
  }

  animate(
    target: THREE.Object3D,
    property: string,
    from: number,
    to: number,
    config: AnimationConfig,
    onComplete?: () => void
  ): string {
    const id = `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const state: AnimationState = {
      id,
      target,
      property,
      from,
      to,
      config,
      elapsed: 0,
      completed: false,
      onComplete,
    };

    this.animations.set(id, state);
    return id;
  }

  animateVector(
    target: THREE.Object3D,
    property: "position" | "rotation" | "scale",
    from: THREE.Vector3,
    to: THREE.Vector3,
    config: AnimationConfig,
    onComplete?: () => void
  ): string {
    const id = `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const state: AnimationState = {
      id,
      target,
      property,
      fromVector: from.clone(),
      toVector: to.clone(),
      config,
      elapsed: 0,
      completed: false,
      onComplete,
      isVector: true,
    };

    this.animations.set(id, state);
    return id;
  }

  createSpiralPath(
    center: THREE.Vector3,
    radius: number,
    turns: number,
    height: number,
    points: number = 100
  ): THREE.Vector3[] {
    const path: THREE.Vector3[] = [];
    for (let i = 0; i <= points; i++) {
      const t = i / points;
      const angle = t * turns * Math.PI * 2;
      const r = radius * (1 - t);
      const x = center.x + Math.cos(angle) * r;
      const z = center.z + Math.sin(angle) * r;
      const y = center.y + t * height;
      path.push(new THREE.Vector3(x, y, z));
    }
    return path;
  }

  createWavePath(
    start: THREE.Vector3,
    end: THREE.Vector3,
    amplitude: number,
    frequency: number,
    points: number = 100
  ): THREE.Vector3[] {
    const path: THREE.Vector3[] = [];
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    direction.normalize();

    const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);

    for (let i = 0; i <= points; i++) {
      const t = i / points;
      const pos = start.clone().add(direction.clone().multiplyScalar(t * length));
      const wave = Math.sin(t * frequency * Math.PI * 2) * amplitude;
      pos.add(perpendicular.clone().multiplyScalar(wave));
      path.push(pos);
    }
    return path;
  }

  createEllipsePath(
    center: THREE.Vector3,
    radiusX: number,
    radiusZ: number,
    points: number = 100
  ): THREE.Vector3[] {
    const path: THREE.Vector3[] = [];
    for (let i = 0; i <= points; i++) {
      const t = i / points;
      const angle = t * Math.PI * 2;
      const x = center.x + Math.cos(angle) * radiusX;
      const z = center.z + Math.sin(angle) * radiusZ;
      path.push(new THREE.Vector3(x, center.y, z));
    }
    return path;
  }

  getEasingFunction(type: AnimationType): EasingFn {
    switch (type) {
      case "linear":
        return EASING.linear;
      case "quadratic":
        return EASING.easeOutQuad;
      case "cubic":
        return EASING.easeOutCubic;
      case "sinusoidal":
        return (t: number) => (1 - Math.cos(t * Math.PI)) / 2;
      case "elastic":
        return EASING.easeOutElastic;
      case "bounce":
        return EASING.easeOutBounce;
      case "spiral":
        return (t: number) => t * t;
      case "wave":
        return (t: number) => Math.sin(t * Math.PI);
      default:
        return EASING.linear;
    }
  }

  update(): void {
    const delta = this.clock.getDelta();

    this.animations.forEach((state, id) => {
      if (state.completed) return;

      state.elapsed += delta * 1000;

      if (state.elapsed < (state.config.delay || 0)) return;

      const animTime = state.elapsed - (state.config.delay || 0);
      const progress = Math.min(animTime / state.config.duration, 1);
      const easingFn = this.getEasingFunction(state.config.type);
      const easedProgress = easingFn(progress);

      if (state.isVector && state.fromVector && state.toVector) {
        const value = new THREE.Vector3().lerpVectors(
          state.fromVector,
          state.toVector,
          easedProgress
        );

        if (state.config.type === "spiral") {
          const angle = easedProgress * Math.PI * 4;
          const radius = (state.config.amplitude || 1) * (1 - easedProgress);
          value.x += Math.cos(angle) * radius;
          value.z += Math.sin(angle) * radius;
        }

        if (state.config.type === "wave") {
          const wave = Math.sin(easedProgress * (state.config.frequency || 1) * Math.PI * 2) * (state.config.amplitude || 1);
          value.y += wave;
        }

        (state.target as any)[state.property] = value;
      } else {
        const value = THREE.MathUtils.lerp(state.from!, state.to!, easedProgress);
        this.setNestedProperty(state.target, state.property, value);
      }

      if (progress >= 1) {
        state.completed = true;
        state.onComplete?.();
        this.animations.delete(id);
      }
    });
  }

  private setNestedProperty(obj: any, path: string, value: number): void {
    const parts = path.split(".");
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }

  cancel(id: string): void {
    this.animations.delete(id);
  }

  cancelAll(): void {
    this.animations.clear();
  }

  dispose(): void {
    this.cancelAll();
  }
}

interface AnimationState {
  id: string;
  target: THREE.Object3D;
  property: string;
  from?: number;
  to?: number;
  fromVector?: THREE.Vector3;
  toVector?: THREE.Vector3;
  config: AnimationConfig;
  elapsed: number;
  completed: boolean;
  onComplete?: () => void;
  isVector?: boolean;
}

export const mathAnimationEngine = new MathAnimationEngine();
