type EnvironmentMusic = "battle" | "space" | "maze" | "obstacle";

export class MusicManager {
  private ctx: AudioContext | null = null;
  private activeMusic: EnvironmentMusic | null = null;
  private nodes: AudioNode[] = [];
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private volume = 0.15;
  private musicTimeout: ReturnType<typeof setInterval> | null = null;

  private getCtx(): AudioContext | null {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        console.warn("Web Audio API not available");
        return null;
      }
    }
    return this.ctx;
  }

  setVolume(v: number) { this.volume = Math.max(0, Math.min(0.5, v)); if (this.gainNode) this.gainNode.gain.value = this.volume; }

  play(env: EnvironmentMusic) {
    if (this.activeMusic === env && this.isPlaying) return;
    this.stop();
    this.activeMusic = env;
    this.isPlaying = true;
    const ctx = this.getCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = this.volume;
    this.gainNode.connect(ctx.destination);

    switch (env) {
      case "battle": this.playBattle(ctx); break;
      case "space": this.playSpace(ctx); break;
      case "maze": this.playMaze(ctx); break;
      case "obstacle": this.playRace(ctx); break;
    }
  }

  private playBattle(ctx: AudioContext) {
    // Deep drone
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 55;
    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.08;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 200;
    filter.Q.value = 5;
    osc.connect(oscGain).connect(filter).connect(this.gainNode!);
    osc.start();
    this.nodes.push(osc, oscGain, filter);

    // Percussion loop
    this.musicTimeout = setInterval(() => {
      if (!this.isPlaying) return;
      const now = ctx.currentTime;
      // Kick
      const kick = ctx.createOscillator();
      kick.type = "sine";
      kick.frequency.setValueAtTime(150, now);
      kick.frequency.exponentialRampToValueAtTime(40, now + 0.1);
      const kickGain = ctx.createGain();
      kickGain.gain.setValueAtTime(0.3, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      kick.connect(kickGain).connect(this.gainNode!);
      kick.start(now); kick.stop(now + 0.2);
      // Hi-hat (noise)
      const noise = ctx.createOscillator();
      noise.type = "square";
      noise.frequency.value = 8000;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.05, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      noise.connect(noiseGain).connect(this.gainNode!);
      noise.start(now); noise.stop(now + 0.03);
    }, 500);
  }

  private playSpace(ctx: AudioContext) {
    // Two detuned sine waves for space pad
    [200, 205].forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.06;
      osc.connect(oscGain).connect(this.gainNode!);
      osc.start();
      this.nodes.push(osc, oscGain);
      // Slow LFO
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.1;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 30;
      lfo.connect(lfoGain).connect(osc.frequency);
      lfo.start();
      this.nodes.push(lfo, lfoGain);
    });
    // High shimmer
    const shimmer = ctx.createOscillator();
    shimmer.type = "sine";
    shimmer.frequency.value = 800;
    const sGain = ctx.createGain();
    sGain.gain.value = 0.02;
    shimmer.connect(sGain).connect(this.gainNode!);
    shimmer.start();
    this.nodes.push(shimmer, sGain);
  }

  private playMaze(ctx: AudioContext) {
    const notes = [293.66, 349.23, 440, 523.25]; // D4, F4, A4, C5
    let noteIndex = 0;
    this.musicTimeout = setInterval(() => {
      if (!this.isPlaying) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = notes[noteIndex % 4];
      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.06, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      // Dry signal
      osc.connect(oscGain).connect(this.gainNode!);
      // Wet signal (delay)
      const delay = ctx.createDelay(0.3);
      delay.delayTime.value = 0.2;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.3;
      const delayGain = ctx.createGain();
      delayGain.gain.value = 0.04;
      osc.connect(delayGain).connect(delay).connect(feedback).connect(delay).connect(this.gainNode!);
      osc.start(now); osc.stop(now + 0.8);
      noteIndex++;
    }, 800);
  }

  private playRace(ctx: AudioContext) {
    let step = 0;
    this.musicTimeout = setInterval(() => {
      if (!this.isPlaying) return;
      const now = ctx.currentTime;
      const bassFreqs = [65, 65, 73, 65, 82, 82, 73, 65];
      const bass = ctx.createOscillator();
      bass.type = "sawtooth";
      bass.frequency.value = bassFreqs[step % 8];
      const bassGain = ctx.createGain();
      bassGain.gain.setValueAtTime(0.15, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 300;
      bass.connect(bassGain).connect(filter).connect(this.gainNode!);
      bass.start(now); bass.stop(now + 0.3);
      // Snare
      const noise = ctx.createOscillator();
      noise.type = "triangle";
      noise.frequency.value = 200;
      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.1, now + 0.25);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      noise.connect(nGain).connect(this.gainNode!);
      noise.start(now + 0.25); noise.stop(now + 0.35);
      step++;
    }, 250);
  }

  stop() {
    this.isPlaying = false;
    if (this.musicTimeout) { clearInterval(this.musicTimeout); this.musicTimeout = null; }
    this.nodes.forEach((n) => {
      try { if (n instanceof AudioScheduledSourceNode) n.stop(); n.disconnect(); } catch {}
    });
    this.nodes = [];
    if (this.gainNode) {
      try { this.gainNode.disconnect(); } catch {}
      this.gainNode = null;
    }
    this.activeMusic = null;
  }

  dispose() {
    this.stop();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const musicManager = new MusicManager();
