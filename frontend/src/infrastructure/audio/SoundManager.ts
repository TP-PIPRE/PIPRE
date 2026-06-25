/* BACKEND:
 * Este módulo no requiere conexión con backend.
 * Utiliza Web Audio API para feedback sonoro local.
 * Cuando se integre con el backend, se podría:
 * - Cargar config de sonidos desde el servidor (ej: respuesta del API /api/v1/sound-config)
 * - Enviar estadísticas de eventos de sonido al backend de analítica
 */

export class SoundManager {
  private static instance: SoundManager;
  private initialized = false;
  private audioContext: AudioContext | null = null;

  private constructor() {}

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  /* BACKEND: Inicialización con config remota
   * async init(remoteConfigUrl?: string) {
   *   if (remoteConfigUrl) {
   *     const response = await fetch(remoteConfigUrl);
   *     const config = await response.json();
   *     this.configureFromRemote(config);
   *   }
   * }
   */
  init() {
    if (this.initialized) return;
    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
      this.initialized = true;
    } catch {
      console.warn("AudioContext not available, sounds disabled.");
    }
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = "square", volume = 0.1) {
    if (!this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.start();
    osc.stop(this.audioContext.currentTime + duration);
  }

  /* BACKEND: Envío de eventos de sonido a analítica
   * private async logSoundEvent(eventType: string) {
   *   try {
   *     await apiService.analytics.postHelpRequest({
   *       id_student: getAuthState().user?.id || "",
   *       times_requested: 1,
   *       ai_interactions: 0,
   *     });
   *   } catch {}
   * }
   */

  play(type: "move" | "rotate" | "scan" | "success" | "fail" | "click" | "attack" | "magic") {
    if (!this.initialized) return;

    switch (type) {
      case "move":
        this.playTone(440, 0.1, "sine", 0.08);
        break;
      case "rotate":
        this.playTone(330, 0.15, "triangle", 0.08);
        break;
      case "scan":
        this.playTone(880, 0.3, "sine", 0.05);
        setTimeout(() => this.playTone(1100, 0.2, "sine", 0.05), 150);
        break;
      case "success":
        this.playTone(523, 0.15, "square", 0.1);
        setTimeout(() => this.playTone(659, 0.15, "square", 0.1), 150);
        setTimeout(() => this.playTone(784, 0.3, "square", 0.1), 300);
        break;
      case "fail":
        this.playTone(200, 0.3, "sawtooth", 0.08);
        break;
      case "click":
        this.playTone(600, 0.05, "square", 0.05);
        break;
      case "attack":
        this.playTone(150, 0.2, "sawtooth", 0.15);
        setTimeout(() => this.playTone(100, 0.3, "sawtooth", 0.1), 100);
        break;
      case "magic":
        this.playTone(500, 0.2, "sine", 0.08);
        setTimeout(() => this.playTone(700, 0.2, "sine", 0.08), 100);
        setTimeout(() => this.playTone(900, 0.3, "sine", 0.06), 200);
        break;
    }
  }

  dispose() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.initialized = false;
  }
}
