// Midnight Vault — sound. One job: all audio, synthesized live with WebAudio.
// No audio files, no network: a quiet tense bassline loop plus short blips for
// pickups, alarms, tools and the win / bust stingers.

const BASSLINE = [55, 0, 55, 65.41, 55, 0, 49, 58.27, 55, 0, 55, 65.41, 82.41, 0, 73.42, 65.41];
const STEP_SECONDS = 0.22;

export function createAudio() {
  const audio = {
    ctx: null,
    musicTimer: null,
    step: 0,
    muted: false,
    alarmOn: false,

    // Call from a user gesture (key / click). Browsers refuse audio before one.
    ensure() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') void this.ctx.resume();
        return;
      }
      try {
        const Ctx = window.AudioContext ?? window.webkitAudioContext;
        if (!Ctx) return;
        this.ctx = new Ctx();
        this.startMusic();
      } catch {
        this.ctx = null;
      }
    },

    startMusic() {
      if (!this.ctx || this.musicTimer) return;
      this.musicTimer = window.setInterval(() => this.playStep(), STEP_SECONDS * 1000);
    },

    playStep() {
      if (!this.ctx || this.muted) return;
      const freq = BASSLINE[this.step % BASSLINE.length];
      this.step += 1;
      if (!freq) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.055, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + STEP_SECONDS * 0.95);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + STEP_SECONDS);
      // Soft tick on every fourth step, like a distant clock.
      if (this.step % 4 === 0) this.blip(1200, 0.012, 0.03, 'square');
    },

    blip(freq, volume, seconds, type = 'sine', slideTo = 0) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + seconds);
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + seconds);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + seconds + 0.02);
    },

    pickup() {
      this.blip(660, 0.09, 0.09);
      window.setTimeout(() => this.blip(990, 0.09, 0.12), 70);
    },
    vaultCrack() {
      this.blip(440, 0.08, 0.08, 'square');
      window.setTimeout(() => this.blip(554, 0.08, 0.08, 'square'), 90);
      window.setTimeout(() => this.blip(880, 0.1, 0.18), 180);
    },
    spotted() {
      this.blip(220, 0.12, 0.25, 'sawtooth', 110);
    },
    tool() {
      this.blip(520, 0.08, 0.07, 'square');
      window.setTimeout(() => this.blip(780, 0.07, 0.09, 'square'), 60);
    },
    denied() {
      this.blip(160, 0.09, 0.15, 'square', 120);
    },
    win() {
      [523, 659, 784, 1047].forEach((f, i) =>
        window.setTimeout(() => this.blip(f, 0.1, 0.22), i * 110),
      );
    },
    bust() {
      this.blip(180, 0.14, 0.5, 'sawtooth', 55);
    },
  };
  return audio;
}
