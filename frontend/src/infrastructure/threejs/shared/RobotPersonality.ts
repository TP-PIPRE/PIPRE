import * as THREE from "three";

export type RobotEmotion = "idle" | "thinking" | "excited" | "sad" | "celebrating" | "scared" | "angry";

interface EmotionConfig {
  visorColor: string;
  coreIntensity: number;
  bobSpeed: number;
  bobAmount: number;
  particleColor: string;
}

const EMOTIONS: Record<RobotEmotion, EmotionConfig> = {
  idle:      { visorColor: "#00f5d4", coreIntensity: 0.5, bobSpeed: 1.2, bobAmount: 0.06, particleColor: "#00f5d4" },
  thinking:  { visorColor: "#818cf8", coreIntensity: 0.8, bobSpeed: 0.7, bobAmount: 0.04, particleColor: "#818cf8" },
  excited:   { visorColor: "#22c55e", coreIntensity: 1.5, bobSpeed: 4.0, bobAmount: 0.15, particleColor: "#22c55e" },
  sad:       { visorColor: "#60a5fa", coreIntensity: 0.2, bobSpeed: 0.3, bobAmount: 0.02, particleColor: "#60a5fa" },
  celebrating:{ visorColor: "#fbbf24", coreIntensity: 2.0, bobSpeed: 6.0, bobAmount: 0.25, particleColor: "#fbbf24" },
  scared:    { visorColor: "#ef4444", coreIntensity: 0.3, bobSpeed: 10.0, bobAmount: 0.04, particleColor: "#ef4444" },
  angry:     { visorColor: "#ff4444", coreIntensity: 2.5, bobSpeed: 3.0, bobAmount: 0.1, particleColor: "#ff4444" },
};

export class RobotPersonality {
  private botGroup: THREE.Group;
  private visor: THREE.Mesh | null = null;
  private core: THREE.Mesh | null = null;
  private bodyParts: THREE.Mesh[] = [];
  private scene: THREE.Scene;
  private dialogueSprite: THREE.Sprite | null = null;
  private dialogueTimer: ReturnType<typeof setTimeout> | null = null;
  private emotion: RobotEmotion = "idle";
  private idleTime = 0;
  private celebrationParticles: THREE.Points[] = [];
  private audioCtx: AudioContext | null = null;

  constructor(scene: THREE.Scene, botGroup: THREE.Group) {
    this.scene = scene;
    this.botGroup = botGroup;

    // Find visor and core in bot group
    botGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.name === "bot_core" || child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (mat.emissive && mat.emissiveIntensity !== undefined) {
            if (child.name === "bot_core" || child.geometry.type === "CylinderGeometry") {
              this.core = child;
            }
          }
        }
        // Visor is usually a small box
        if (child.geometry.type === "BoxGeometry" && child.position.length() > 0.5) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (mat.emissive && mat.emissiveIntensity !== undefined && mat.emissiveIntensity > 0.3) {
            if (!this.visor || child.geometry.type === "BoxGeometry") {
              this.visor = child;
            }
          }
        }
        this.bodyParts.push(child);
      }
    });
  }

  setEmotion(emotion: RobotEmotion): void {
    this.emotion = emotion;
    const config = EMOTIONS[emotion];

    if (this.visor) {
      const mat = this.visor.material as THREE.MeshStandardMaterial;
      mat.color.set(config.visorColor);
      mat.emissive.set(config.visorColor);
      mat.emissiveIntensity = config.coreIntensity * (emotion === "idle" ? 0.7 : 1.2);
    }

    if (this.core) {
      const mat = this.core.material as THREE.MeshStandardMaterial;
      mat.color.set(config.visorColor);
      mat.emissive.set(config.visorColor);
      mat.emissiveIntensity = config.coreIntensity;
    }

    // Celebrating: spawn particles
    if (emotion === "celebrating") {
      this.spawnCelebrationParticles();
    }

    // Scared: shrink briefly
    if (emotion === "scared") {
      this.botGroup.scale.set(0.85, 0.85, 0.85);
      setTimeout(() => {
        if (this.emotion === "scared") {
          this.botGroup.scale.set(1, 1, 1);
        }
      }, 500);
    }

    // Sad: slouch
    if (emotion === "sad") {
      this.botGroup.position.y -= 0.3;
      setTimeout(() => {
        if (this.emotion === "sad") {
          this.botGroup.position.y += 0.3;
          this.setEmotion("idle");
        }
      }, 2000);
    }
  }

  speak(text: string, duration: number = 3000): void {
    this.clearDialogue();
    this.playRobotVoice();

    // Create dialogue bubble sprite
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Bubble background
    ctx.fillStyle = "rgba(20, 20, 40, 0.9)";
    ctx.beginPath();
    ctx.roundRect(20, 10, canvas.width - 40, canvas.height - 30, 16);
    ctx.fill();
    ctx.strokeStyle = "#818cf8";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px Geist, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Word wrap
    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const test = line + word + " ";
      if (ctx.measureText(test).width > canvas.width - 80) {
        lines.push(line);
        line = word + " ";
      } else {
        line = test;
      }
    }
    lines.push(line);

    lines.forEach((l, i) => {
      ctx.fillText(l.trim(), canvas.width / 2, 40 + i * 30);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
    this.dialogueSprite = new THREE.Sprite(spriteMat);
    this.dialogueSprite.position.copy(this.botGroup.position);
    this.dialogueSprite.position.y += 3;
    this.dialogueSprite.scale.set(4, 1, 1);
    this.scene.add(this.dialogueSprite);

    this.dialogueTimer = setTimeout(() => {
      this.clearDialogue();
    }, duration);
  }

  update(deltaTime: number): void {
    this.idleTime += deltaTime;
    const config = EMOTIONS[this.emotion];

    // Gentle bob animation
    const targetY = Math.sin(this.idleTime * config.bobSpeed) * config.bobAmount;
    this.botGroup.position.y += (targetY - (this.botGroup.position.y % 1)) * 0.05;

    // Core pulse
    if (this.core) {
      const mat = this.core.material as THREE.MeshStandardMaterial;
      const pulse = config.coreIntensity + Math.sin(this.idleTime * 3.5) * 0.15;
      mat.emissiveIntensity += (pulse - mat.emissiveIntensity) * 0.1;
    }

    // Update dialogue position
    if (this.dialogueSprite && this.botGroup) {
      this.dialogueSprite.position.x += (this.botGroup.position.x - this.dialogueSprite.position.x) * 0.1;
      this.dialogueSprite.position.z += (this.botGroup.position.z - this.dialogueSprite.position.z) * 0.1;
      this.dialogueSprite.position.y = this.botGroup.position.y + 3 + Math.sin(this.idleTime * 1.5) * 0.15;
    }

    // Celebration particles
    if (this.emotion === "celebrating") {
      this.celebrationParticles.forEach((pts) => {
        const pos = pts.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < pos.length; i += 3) {
          pos[i + 1] += 0.05;
          pos[i] += (Math.random() - 0.5) * 0.03;
          if (pos[i + 1] > 6) {
            pos[i + 1] = this.botGroup.position.y;
            pos[i] = this.botGroup.position.x + (Math.random() - 0.5) * 4;
            pos[i + 2] = this.botGroup.position.z + (Math.random() - 0.5) * 4;
          }
        }
        pts.geometry.attributes.position.needsUpdate = true;
      });
    }
  }

  private spawnCelebrationParticles(): void {
    const count = 60;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = this.botGroup.position.x + (Math.random() - 0.5) * 4;
      positions[i * 3 + 1] = this.botGroup.position.y;
      positions[i * 3 + 2] = this.botGroup.position.z + (Math.random() - 0.5) * 4;
      colors[i * 3] = Math.random();
      colors[i * 3 + 1] = Math.random();
      colors[i * 3 + 2] = Math.random();
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const pts = new THREE.Points(geo, mat);
    this.scene.add(pts);
    this.celebrationParticles.push(pts);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      this.scene.remove(pts);
      geo.dispose();
      mat.dispose();
      this.celebrationParticles = this.celebrationParticles.filter((p) => p !== pts);
      if (this.emotion === "celebrating") this.setEmotion("idle");
    }, 4000);
  }

  private clearDialogue(): void {
    if (this.dialogueSprite) {
      this.scene.remove(this.dialogueSprite);
      (this.dialogueSprite.material as THREE.SpriteMaterial).map?.dispose();
      (this.dialogueSprite.material as THREE.SpriteMaterial).dispose();
      this.dialogueSprite = null;
    }
    if (this.dialogueTimer) {
      clearTimeout(this.dialogueTimer);
      this.dialogueTimer = null;
    }
  }

  private playRobotVoice(): void {
    try {
      if (!this.audioCtx) this.audioCtx = new AudioContext();
      const ctx = this.audioCtx;
      if (ctx.state === "suspended") ctx.resume();

      const notes = [400, 500, 600, 700, 450, 550, 650];
      const duration = 0.06;
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.08, ctx.currentTime + i * duration);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * duration + duration);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + i * duration);
        osc.stop(ctx.currentTime + i * duration + duration);
      });
    } catch {
      // Audio not available
    }
  }

  getEmotion(): RobotEmotion {
    return this.emotion;
  }

  dispose(): void {
    this.clearDialogue();
    this.celebrationParticles.forEach((p) => {
      this.scene.remove(p);
      p.geometry.dispose();
      (p.material as THREE.Material).dispose();
    });
    this.celebrationParticles = [];
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}
