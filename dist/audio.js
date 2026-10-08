// Original synthesized score and effects. No recordings from the commercial game.
export class AudioEngine {
  constructor() { this.enabled = false; this.ctx = null; this.musicAt = 0; this.step = 0; }
  enable(value) { this.enabled = value; if (value && !this.ctx) { const Audio = window.AudioContext || window.webkitAudioContext; if (Audio) this.ctx = new Audio(); } this.unlock(); }
  unlock() { if (this.enabled && this.ctx && this.ctx.state !== 'running' && this.ctx.state !== 'closed') this.ctx.resume().catch(() => {}); }
  tone(freq, duration = .12, type = 'sine', volume = .08, delay = 0, endFreq = null) {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime + delay, osc = this.ctx.createOscillator(), gain = this.ctx.createGain(); osc.type = type; osc.frequency.setValueAtTime(freq, now); if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration); gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(volume, now + .008); gain.gain.exponentialRampToValueAtTime(.0001, now + duration); osc.connect(gain); gain.connect(this.ctx.destination); osc.start(now); osc.stop(now + duration + .01);
  }
  effect(type, data = {}) {
    if (type === 'collect') { if (data.kind === 'coin') this.tone(1047,.065,'sine',.055); else { this.tone(659,.1,'triangle',.08); this.tone(988,.15,'triangle',.06,.08); } }
    else if (type === 'jump') this.tone(data.double ? 420 : 230,.17,'triangle',.07,0,700);
    else if (type === 'sword') this.tone(data.heavy ? 90 : 230,.13,'sawtooth',.04,0,55);
    else if (type === 'hit' || type === 'break') { this.tone(90,.1,'square',.065,0,38); this.tone(330,.07,'triangle',.05); }
    else if (type === 'hurt') this.tone(180,.22,'sawtooth',.07,0,55);
    else if (type === 'magic') { this.tone(240,.22,'sawtooth',.04,0,1200); this.tone(660,.22,'sine',.055,.06); }
    else if (type === 'slam' || type === 'bossAttack') this.tone(65,.3,'triangle',.09,0,28);
    else if (type === 'blocked') this.tone(1468,.07,'triangle',.06);
    else if (type === 'checkpoint' || type === 'allLetters' || type === 'allVases') [523,659,784].forEach((f,i)=>this.tone(f,.18,'triangle',.06,i*.09));
    else if (type === 'clear' || type === 'bossDefeated') [392,523,659,784,1047].forEach((f,i)=>this.tone(f,.35,'triangle',.08,i*.14));
    else if (type === 'death') [330,277,220,165].forEach((f,i)=>this.tone(f,.3,'triangle',.06,i*.16));
  }
  music(dt, playing, underworld = false) {
    if (!playing || !this.enabled || !this.ctx || this.ctx.state !== 'running') return;
    this.musicAt -= dt; if (this.musicAt > 0) return; this.musicAt = .31;
    const melody = underworld ? [0,3,7,10,7,3,2,7,0,3,5,10,7,5,3,2] : [0,7,12,7,4,9,12,9,5,9,14,12,7,11,14,7];
    const note = melody[this.step % melody.length]; this.tone(196*Math.pow(2,note/12),.4,'triangle',.022);
    if (this.step % 4 === 0) this.tone((underworld ? 65.4 : 98)*Math.pow(2,(this.step%16>=8 ? 5 : 0)/12),.95,'sine',.026);
    this.step++;
  }
}
