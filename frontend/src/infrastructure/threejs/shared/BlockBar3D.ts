import * as THREE from "three";

interface BlockSimple {
  id: string;
  type: string;
  category: string;
  params: Record<string, string>;
}

interface BlockSprite {
  sprite: THREE.Sprite;
  normalScale: THREE.Vector3;
  pulseOffset: number;
}

const CATEGORY_GLOW: Record<string, string> = {
  event: "#22c55e",
  action: "#94a3b8",
  condition: "#818cf8",
  loop: "#f97316",
  variable: "#22c55e",
};

export class BlockBar3D {
  private scene: THREE.Scene;
  private sprites: BlockSprite[] = [];
  private container: THREE.Group;
  private activeId: string | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.container = new THREE.Group();
    this.container.name = "block_bar";
    this.scene.add(this.container);
  }

  updateBlocks(blocks: BlockSimple[], activeBlockId: string | null): void {
    this.activeId = activeBlockId;
    this.clearSprites();

    if (blocks.length === 0) return;

    const ySpacing = 1.1;
    const startY = (blocks.length - 1) * ySpacing / 2;
    // Position on the right side of the scene
    const barX = 16;
    const barZ = 0;

    this.container.position.set(barX, 0, barZ);

    blocks.forEach((block, index) => {
      const sprite = this.createBlockSprite(block, index);
      sprite.sprite.position.set(0, startY - index * ySpacing, 0);
      this.sprites.push(sprite);
      this.container.add(sprite.sprite);
    });
  }

  private createBlockSprite(block: BlockSimple, index: number): BlockSprite {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No canvas context");

    const color = CATEGORY_GLOW[block.category] || "#94a3b8";
    const isActive = this.activeId === block.id;

    // Background card
    ctx.fillStyle = isActive ? "rgba(0, 200, 150, 0.3)" : "rgba(10, 10, 30, 0.85)";
    roundRect(ctx, 4, 4, canvas.width - 8, canvas.height - 8, 10);
    ctx.fill();

    // Border
    ctx.strokeStyle = isActive ? "#00f5d4" : color;
    ctx.lineWidth = isActive ? 3 : 1.5;
    roundRect(ctx, 4, 4, canvas.width - 8, canvas.height - 8, 10);
    ctx.stroke();

    // Left accent bar
    ctx.fillStyle = color;
    ctx.fillRect(4, 8, 6, canvas.height - 16);

    // Block number
    ctx.fillStyle = color;
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`${index + 1}`, 20, 28);

    // Block label
    const label = block.type.replace(/_/g, " ").toUpperCase();
    const params = Object.entries(block.params || {})
      .map(([, v]) => v)
      .join(", ");
    const displayLabel = params ? `${label}(${params})` : label;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px Geist, sans-serif";
    ctx.fillText(displayLabel.substring(0, 22), 20, 48);

    if (isActive) {
      ctx.fillStyle = "#00f5d4";
      ctx.font = "bold 10px monospace";
      ctx.fillText("▶ EJECUTANDO", 20, 60);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3, 0.75, 1);
    // Make it always face camera
    sprite.name = "block_hologram";

    return {
      sprite,
      normalScale: sprite.scale.clone(),
      pulseOffset: index * 0.5,
    };
  }

  animate(time: number): void {
    this.sprites.forEach((bs, i) => {
      const isActive = this.activeId && this.sprites[i] === bs;
      if (isActive) {
        const s = 1 + Math.sin(time * 4) * 0.05;
        bs.sprite.scale.set(bs.normalScale.x * s, bs.normalScale.y * s, 1);
        (bs.sprite.material as THREE.SpriteMaterial).opacity = 0.8 + Math.sin(time * 3) * 0.2;
      } else {
        bs.sprite.scale.copy(bs.normalScale);
        (bs.sprite.material as THREE.SpriteMaterial).opacity = 0.7;
      }
    });
  }

  private clearSprites(): void {
    this.sprites.forEach((bs) => {
      this.container.remove(bs.sprite);
      (bs.sprite.material as THREE.SpriteMaterial).map?.dispose();
      (bs.sprite.material as THREE.SpriteMaterial).dispose();
    });
    this.sprites = [];
  }

  dispose(): void {
    this.clearSprites();
    this.scene.remove(this.container);
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
