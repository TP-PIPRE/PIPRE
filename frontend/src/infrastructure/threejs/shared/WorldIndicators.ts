import * as THREE from "three";

export class WorldIndicators {
  private scene: THREE.Scene;
  private guideArrow: THREE.Group | null = null;
  private goalLabel: THREE.Sprite | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  showGoalMarker(x: number, z: number, text?: string): void {
    this.clear();

    // Guide arrow
    this.guideArrow = new THREE.Group();
    const arrowMat = new THREE.MeshStandardMaterial({
      color: "#fbbf24", emissive: "#fbbf24", emissiveIntensity: 0.8, roughness: 0.2,
    });

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.5, 8), arrowMat);
    shaft.position.y = 0.75;
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 8), arrowMat);
    head.position.y = 1.65;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.15, 16), arrowMat);
    base.position.y = 0.05;

    this.guideArrow.add(shaft, head, base);
    this.guideArrow.position.set(x, 0.3, z);
    this.guideArrow.name = "guide_arrow";
    this.scene.add(this.guideArrow);

    // Floating text label
    if (text) {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "rgba(10, 10, 30, 0.8)";
        ctx.beginPath();
        ctx.roundRect(10, 5, canvas.width - 20, canvas.height - 10, 10);
        ctx.fill();
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(10, 5, canvas.width - 20, canvas.height - 10, 10);
        ctx.stroke();
        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 14px Geist, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
      this.goalLabel = new THREE.Sprite(spriteMat);
      this.goalLabel.position.set(x, 2.5, z);
      this.goalLabel.scale.set(3, 0.75, 1);
      this.goalLabel.name = "goal_label";
      this.scene.add(this.goalLabel);
    }
  }

  animate(time: number): void {
    if (this.guideArrow) {
      this.guideArrow.rotation.y += 0.01;
      this.guideArrow.position.y = 0.3 + Math.sin(time * 2) * 0.15;
    }
  }

  clear(): void {
    if (this.guideArrow) {
      this.scene.remove(this.guideArrow);
      this.guideArrow.traverse((c) => {
        if (c instanceof THREE.Mesh) {
          c.geometry?.dispose();
          (c.material as THREE.Material)?.dispose();
        }
      });
      this.guideArrow = null;
    }
    if (this.goalLabel) {
      this.scene.remove(this.goalLabel);
      (this.goalLabel.material as THREE.SpriteMaterial).map?.dispose();
      (this.goalLabel.material as THREE.SpriteMaterial).dispose();
      this.goalLabel = null;
    }
  }

  dispose(): void { this.clear(); }
}
