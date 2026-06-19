// retro synth sound generator using Web Audio API

class SoundManager {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playJump() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle'; // Mario jump is quite soft and round
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.15);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.warn("Audio Context blocked or unsupported:", e);
    }
  }

  playCoin() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square'; // Coin ping is metallic and bright
      // Mario coin is B5 (987.77 Hz) for 0.05s, then E6 (1318.51 Hz) for 0.25s
      osc.frequency.setValueAtTime(988, now);
      osc.frequency.setValueAtTime(1318, now + 0.07);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.setValueAtTime(0.15, now + 0.07);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.warn(e);
    }
  }

  playTick() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.04);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {
      console.warn(e);
    }
  }

  playWinFanfare() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // retro fanfare notes
      const notes = [
        { note: 523.25, time: 0.0 },  // C5
        { note: 659.25, time: 0.1 },  // E5
        { note: 783.99, time: 0.2 },  // G5
        { note: 1046.50, time: 0.3 }, // C6
        { note: 1318.51, time: 0.4 }, // E6
        { note: 1567.98, time: 0.5 }, // G6 (stretto)
        { note: 1567.98, time: 0.65 },
        { note: 1567.98, time: 0.8 },
      ];

      notes.forEach((n) => {
        if (!this.ctx) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(n.note, this.ctx.currentTime + n.time);
        
        g.gain.setValueAtTime(0.12, this.ctx.currentTime + n.time);
        g.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + n.time + 0.15);

        o.connect(g);
        g.connect(this.ctx.destination);
        o.start(this.ctx.currentTime + n.time);
        o.stop(this.ctx.currentTime + n.time + 0.15);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  playLose() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.5);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.warn(e);
    }
  }

  playPowerup() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Ascending arpeggio
      const notes = [330, 392, 659, 523, 587, 784]; // E4, G4, E5, C5, D5, G5
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);

        g.gain.setValueAtTime(0.1, this.ctx.currentTime + idx * 0.08);
        g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.08 + 0.1);

        o.connect(g);
        g.connect(this.ctx.destination);
        o.start(this.ctx.currentTime + idx * 0.08);
        o.stop(this.ctx.currentTime + idx * 0.08 + 0.1);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  playCastleTrumpet() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const melody = [
        { f: 523, d: 0.1 }, // C5
        { f: 523, d: 0.1 },
        { f: 523, d: 0.1 },
        { f: 523, d: 0.3 },
        { f: 415, d: 0.3 }, // Ab4
        { f: 466, d: 0.3 }, // Bb4
        { f: 523, d: 0.4 }, // C5
      ];

      let runningTime = 0;
      melody.forEach((note) => {
        if (!this.ctx) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(note.f, this.ctx.currentTime + runningTime);

        g.gain.setValueAtTime(0.18, this.ctx.currentTime + runningTime);
        g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + runningTime + note.d);

        o.connect(g);
        g.connect(this.ctx.destination);
        o.start(this.ctx.currentTime + runningTime);
        o.stop(this.ctx.currentTime + runningTime + note.d);
        runningTime += note.d + 0.02;
      });
    } catch (e) {
      console.warn(e);
    }
  }
}

export const audio = new SoundManager();
