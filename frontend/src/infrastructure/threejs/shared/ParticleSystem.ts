import * as THREE from "three";

export type ParticlePattern = "burst" | "spiral" | "wave" | "trail" | "ring" | "fountain";

export interface ParticleConfig {
  count: number;
  color: THREE.Color;
  size: number;
  lifetime: number;
  speed: number;
  pattern: ParticlePattern;
  gravity?: number;
  spread?: number;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: THREE.Points | null = null;
  private velocities: Float32Array = new Float32Array(0);
  private lifetimes: Float32Array = new Float32Array(0);
  private ages: Float32Array = new Float32Array(0);
  private maxLifetime = 1.5;
  private isActive = false;
  private config: ParticleConfig;

  constructor(scene: THREE.Scene, config?: Partial<ParticleConfig>) {
    this.scene = scene;
    this.config = {
      count: 100,
      color: new THREE.Color("#34D399"),
      size: 0.15,
      lifetime: 1.5,
      speed: 3,
      pattern: "burst",
      gravity: 0.03,
      spread: 2,
      ...config,
    };
    this.maxLifetime = this.config.lifetime;
    this.velocities = new Float32Array(this.config.count * 3);
    this.lifetimes = new Float32Array(this.config.count);
    this.ages = new Float32Array(this.config.count);
  }

  emit(
    x: number,
    z: number,
    type: "move" | "success" | "collision" | "scan" | "attack" | "magic" = "move"
  ): void {
    this.clear();

    const typeConfigs: Record<string, Partial<ParticleConfig>> = {
      move: { color: new THREE.Color("#34D399"), pattern: "trail", size: 0.12 },
      success: { color: new THREE.Color("#F59E0B"), pattern: "burst", size: 0.25, count: 150 },
      collision: { color: new THREE.Color("#EF4444"), pattern: "ring", size: 0.18, count: 80 },
      scan: { color: new THREE.Color("#9B5DE5"), pattern: "spiral", size: 0.15 },
      attack: { color: new THREE.Color("#FF6B6B"), pattern: "fountain", size: 0.2 },
      magic: { color: new THREE.Color("#A78BFA"), pattern: "wave", size: 0.2, count: 120 },
    };

    const typeConfig = typeConfigs[type] || {};
    this.config = { ...this.config, ...typeConfig };
    this.maxLifetime = this.config.lifetime;

    const geometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(this.config.count * 3);
    const colorArray = new Float32Array(this.config.count * 3);

    for (let i = 0; i < this.config.count; i++) {
      const index = i * 3;
      const angle = (i / this.config.count) * Math.PI * 2;

      switch (this.config.pattern) {
        case "spiral":
          const spiralRadius = (i / this.config.count) * this.config.spread!;
          posArray[index] = x + Math.cos(angle * 3) * spiralRadius;
          posArray[index + 1] = 0;
          posArray[index + 2] = z + Math.sin(angle * 3) * spiralRadius;
          this.velocities[index] = Math.cos(angle) * this.config.speed * 0.5;
          this.velocities[index + 1] = this.config.speed;
          this.velocities[index + 2] = Math.sin(angle) * this.config.speed * 0.5;
          break;

        case "wave":
          posArray[index] = x + Math.cos(angle) * this.config.spread!;
          posArray[index + 1] = Math.sin(angle * 4) * 0.5;
          posArray[index + 2] = z + Math.sin(angle) * this.config.spread!;
          this.velocities[index] = Math.cos(angle) * this.config.speed * 0.3;
          this.velocities[index + 1] = Math.abs(Math.sin(angle * 4)) * this.config.speed;
          this.velocities[index + 2] = Math.sin(angle) * this.config.speed * 0.3;
          break;

        case "trail":
          posArray[index] = x + (Math.random() - 0.5) * 0.5;
          posArray[index + 1] = Math.random() * 0.5;
          posArray[index + 2] = z + (Math.random() - 0.5) * 0.5;
          this.velocities[index] = (Math.random() - 0.5) * 0.5;
          this.velocities[index + 1] = Math.random() * this.config.speed * 0.5;
          this.velocities[index + 2] = (Math.random() - 0.5) * 0.5;
          break;

        case "ring":
          posArray[index] = x + Math.cos(angle) * 0.5;
          posArray[index + 1] = 0.2;
          posArray[index + 2] = z + Math.sin(angle) * 0.5;
          this.velocities[index] = Math.cos(angle) * this.config.speed;
          this.velocities[index + 1] = 0;
          this.velocities[index + 2] = Math.sin(angle) * this.config.speed;
          break;

        case "fountain":
          posArray[index] = x + (Math.random() - 0.5) * 1;
          posArray[index + 1] = 0;
          posArray[index + 2] = z + (Math.random() - 0.5) * 1;
          this.velocities[index] = (Math.random() - 0.5) * this.config.speed * 0.5;
          this.velocities[index + 1] = this.config.speed * (0.8 + Math.random() * 0.4);
          this.velocities[index + 2] = (Math.random() - 0.5) * this.config.speed * 0.5;
          break;

        case "burst":
        default:
          posArray[index] = x + (Math.random() - 0.5) * this.config.spread!;
          posArray[index + 1] = Math.random() * 2;
          posArray[index + 2] = z + (Math.random() - 0.5) * this.config.spread!;
          this.velocities[index] = (Math.random() - 0.5) * this.config.speed;
          this.velocities[index + 1] = Math.random() * this.config.speed;
          this.velocities[index + 2] = (Math.random() - 0.5) * this.config.speed;
          break;
      }

      this.lifetimes[i] = this.maxLifetime * (0.7 + Math.random() * 0.3);
      this.ages[i] = 0;

      const c = this.config.color.clone();
      c.multiplyScalar(0.5 + Math.random() * 0.5);
      colorArray[index] = c.r;
      colorArray[index + 1] = c.g;
      colorArray[index + 2] = c.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colorArray, 3));

    const material = new THREE.PointsMaterial({
      size: this.config.size,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particles = new THREE.Points(geometry, material);
    this.particles.position.y = 0;
    this.scene.add(this.particles);
    this.isActive = true;

    this.animateParticles();
  }

  emitTrail(
    startX: number,
    startZ: number,
    endX: number,
    endZ: number,
    type: "move" | "success" | "collision" | "scan" | "attack" | "magic" = "move"
  ): void {
    this.clear();

    const typeConfigs: Record<string, Partial<ParticleConfig>> = {
      move: { color: new THREE.Color("#34D399"), size: 0.1 },
      success: { color: new THREE.Color("#F59E0B"), size: 0.15 },
      collision: { color: new THREE.Color("#EF4444"), size: 0.12 },
      scan: { color: new THREE.Color("#9B5DE5"), size: 0.1 },
      attack: { color: new THREE.Color("#FF6B6B"), size: 0.12 },
      magic: { color: new THREE.Color("#A78BFA"), size: 0.15 },
    };

    const typeConfig = typeConfigs[type] || {};
    this.config = { ...this.config, ...typeConfig, pattern: "trail" };

    const trailCount = 50;
    const geometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(trailCount * 3);
    const colorArray = new Float32Array(trailCount * 3);

    for (let i = 0; i < trailCount; i++) {
      const t = i / trailCount;
      const x = startX + (endX - startX) * t;
      const z = startZ + (endZ - startZ) * t;

      posArray[i * 3] = x + (Math.random() - 0.5) * 0.3;
      posArray[i * 3 + 1] = Math.random() * 0.3;
      posArray[i * 3 + 2] = z + (Math.random() - 0.5) * 0.3;

      this.velocities[i * 3] = (Math.random() - 0.5) * 0.2;
      this.velocities[i * 3 + 1] = Math.random() * 0.5;
      this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;

      this.lifetimes[i] = this.maxLifetime * (0.5 + Math.random() * 0.5);
      this.ages[i] = 0;

      const c = this.config.color.clone();
      c.multiplyScalar(0.3 + Math.random() * 0.7);
      colorArray[i * 3] = c.r;
      colorArray[i * 3 + 1] = c.g;
      colorArray[i * 3 + 2] = c.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colorArray, 3));

    const material = new THREE.PointsMaterial({
      size: this.config.size,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
    this.isActive = true;

    this.animateParticles();
  }

  private animateParticles(): void {
    if (!this.isActive || !this.particles) return;

    const pos = this.particles.geometry.attributes.position.array as Float32Array;
    let alive = false;

    for (let i = 0; i < this.config.count; i++) {
      this.ages[i] += 0.016;
      this.lifetimes[i] -= 0.016;

      if (this.lifetimes[i] <= 0) {
        pos[i * 3 + 1] = -10;
        continue;
      }

      alive = true;
      const lifeRatio = this.lifetimes[i] / this.maxLifetime;

      pos[i * 3] += this.velocities[i * 3] * 0.05;
      pos[i * 3 + 1] += this.velocities[i * 3 + 1] * 0.05;
      pos[i * 3 + 2] += this.velocities[i * 3 + 2] * 0.05;

      if (this.config.gravity) {
        this.velocities[i * 3 + 1] -= this.config.gravity;
      }

      if (this.config.pattern === "spiral") {
        const angle = this.ages[i] * 3;
        pos[i * 3] += Math.cos(angle) * 0.02;
        pos[i * 3 + 2] += Math.sin(angle) * 0.02;
      }

      if (this.config.pattern === "wave") {
        pos[i * 3 + 1] += Math.sin(this.ages[i] * 5) * 0.01;
      }
    }

    this.particles.geometry.attributes.position.needsUpdate = true;

    if (this.particles.material) {
      (this.particles.material as THREE.PointsMaterial).opacity *= 0.98;
    }

    if (alive) {
      requestAnimationFrame(() => this.animateParticles());
    } else {
      this.clear();
    }
  }

  clear(): void {
    this.isActive = false;
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles.geometry.dispose();
      (this.particles.material as THREE.PointsMaterial).dispose();
      this.particles = null;
    }
  }

  dispose(): void {
    this.clear();
  }
}
