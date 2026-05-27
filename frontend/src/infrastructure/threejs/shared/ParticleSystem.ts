import * as THREE from "three";

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: THREE.Points | null = null;
  private particleCount = 100;
  private positions: Float32Array;
  private velocities: Float32Array;
  private lifetimes: Float32Array;
  private maxLifetime = 1.5;
  private isActive = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.positions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount);
    this.lifetimes = new Float32Array(this.particleCount);
  }

  emit(
    x: number,
    z: number,
    type: "move" | "success" | "collision" | "scan" | "attack" | "magic" = "move",
  ) {
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles.geometry.dispose();
      (this.particles.material as THREE.PointsMaterial).dispose();
    }

    const colors: Record<string, THREE.Color> = {
      move: new THREE.Color("#34D399"),
      success: new THREE.Color("#F59E0B"),
      collision: new THREE.Color("#EF4444"),
      scan: new THREE.Color("#9B5DE5"),
      attack: new THREE.Color("#FF6B6B"),
      magic: new THREE.Color("#A78BFA"),
    };

    const color = colors[type] || colors.move;

    const geometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(this.particleCount * 3);
    const colorArray = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      const index = i * 3;
      const spread = type === "success" ? 5 : type === "collision" ? 3 : 2;
      posArray[index] = x + (Math.random() - 0.5) * spread;
      posArray[index + 1] = Math.random() * 2;
      posArray[index + 2] = z + (Math.random() - 0.5) * spread;

      this.velocities[i] = (Math.random() - 0.5) * 3;
      this.lifetimes[i] = this.maxLifetime;

      const c = color.clone();
      c.multiplyScalar(0.5 + Math.random() * 0.5);
      colorArray[index] = c.r;
      colorArray[index + 1] = c.g;
      colorArray[index + 2] = c.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colorArray, 3));

    const material = new THREE.PointsMaterial({
      size: type === "success" ? 0.3 : 0.15,
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

  private animateParticles() {
    if (!this.isActive || !this.particles) return;

    const pos = this.particles.geometry.attributes.position
      .array as Float32Array;
    let alive = false;

    for (let i = 0; i < this.particleCount; i++) {
      this.lifetimes[i] -= 0.02;
      if (this.lifetimes[i] <= 0) {
        pos[i * 3 + 1] = -10;
        continue;
      }
      alive = true;
      pos[i * 3] += this.velocities[i] * 0.05;
      pos[i * 3 + 1] += 0.03;
      pos[i * 3 + 2] += this.velocities[i] * 0.05;
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

  clear() {
    this.isActive = false;
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles.geometry.dispose();
      (this.particles.material as THREE.PointsMaterial).dispose();
      this.particles = null;
    }
  }

  dispose() {
    this.clear();
  }
}
