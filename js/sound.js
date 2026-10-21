/**
 * Web Audio API 기반 화투 사운드 엔진
 * 외부 오디오 파일 다운로드 없이 브라우저 내장 신디사이저로 타격감 있는 효과음 구현
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }

  // 브라우저 사용자 인터랙션 후 오디오 컨텍스트 초기화
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  // 1. 세련된 리얼 화투패 타격음 (담요에 닿는 묵직한 베이스 + 찰진 플라스틱 스냅 "착! 촵!")
  playCardSnap() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // [레이어 1: 묵직한 담요 바닥 저역 펀치 (Thump)]
    const thumpOsc = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();
    thumpOsc.type = 'triangle';
    thumpOsc.frequency.setValueAtTime(140, t);
    thumpOsc.frequency.exponentialRampToValueAtTime(45, t + 0.045);
    thumpGain.gain.setValueAtTime(0.7, t);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    thumpOsc.connect(thumpGain);
    thumpGain.connect(this.ctx.destination);
    thumpOsc.start(t);
    thumpOsc.stop(t + 0.055);

    // [레이어 2: 펠트 담요 표면 찰진 밀착 노이즈 (Felt Slap)]
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.04); // 40ms
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const feltFilter = this.ctx.createBiquadFilter();
    feltFilter.type = 'bandpass';
    feltFilter.frequency.setValueAtTime(850, t);
    feltFilter.Q.setValueAtTime(3.0, t);

    const feltGain = this.ctx.createGain();
    feltGain.gain.setValueAtTime(0.9, t);
    feltGain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);

    noise.connect(feltFilter);
    feltFilter.connect(feltGain);
    feltGain.connect(this.ctx.destination);
    noise.start(t);

    // [레이어 3: 플라스틱/석분 화투패의 찰진 어택 스냅 (Crisp Snap)]
    const snapOsc = this.ctx.createOscillator();
    const snapFilter = this.ctx.createBiquadFilter();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'square';
    snapOsc.frequency.setValueAtTime(2200, t);
    snapOsc.frequency.exponentialRampToValueAtTime(600, t + 0.02);
    snapFilter.type = 'highpass';
    snapFilter.frequency.setValueAtTime(1200, t);
    snapGain.gain.setValueAtTime(0.25, t);
    snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

    snapOsc.connect(snapFilter);
    snapFilter.connect(snapGain);
    snapGain.connect(this.ctx.destination);
    snapOsc.start(t);
    snapOsc.stop(t + 0.03);
  }

  // 2. 패 획득 / 매칭 성공 사운드 (경쾌한 목탁/차임음)
  playMatch() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, t); // D5
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.08); // A5

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  // 3. 쌀 때 (뻑/설사) 사운드 - 익살스럽고 코믹한 만화풍 사운드 ("피유우웅~ 뽀오옹!")
  playPpeok() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // [파트 1: 만화적인 "피유우웅~" 미끄러지는 슬라이드 휘슬]
    const whistleOsc = this.ctx.createOscillator();
    const whistleGain = this.ctx.createGain();
    whistleOsc.type = 'sine';
    whistleOsc.frequency.setValueAtTime(850, t);
    whistleOsc.frequency.exponentialRampToValueAtTime(220, t + 0.25);

    whistleGain.gain.setValueAtTime(0.5, t);
    whistleGain.gain.linearRampToValueAtTime(0.4, t + 0.2);
    whistleGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    whistleOsc.connect(whistleGain);
    whistleGain.connect(this.ctx.destination);
    whistleOsc.start(t);
    whistleOsc.stop(t + 0.29);

    // [파트 2: 끝에서 터지는 익살스러운 방귀/뽀오옹 효과음 ("뿌우웅~ 뽀옹!")]
    const popTime = t + 0.22;
    const fartOsc = this.ctx.createOscillator();
    const fartGain = this.ctx.createGain();
    const fartFilter = this.ctx.createBiquadFilter();

    fartOsc.type = 'sawtooth';
    fartOsc.frequency.setValueAtTime(160, popTime);
    fartOsc.frequency.exponentialRampToValueAtTime(60, popTime + 0.28);

    fartFilter.type = 'lowpass';
    fartFilter.frequency.setValueAtTime(450, popTime);
    fartFilter.frequency.exponentialRampToValueAtTime(180, popTime + 0.28);

    // 주파수 LFO 진동 (방귀 떨림)
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(32, popTime);
    lfoGain.gain.setValueAtTime(40, popTime);
    lfo.connect(fartOsc.frequency);
    lfo.start(popTime);
    lfo.stop(popTime + 0.3);

    fartGain.gain.setValueAtTime(0.65, popTime);
    fartGain.gain.exponentialRampToValueAtTime(0.001, popTime + 0.3);

    fartOsc.connect(fartFilter);
    fartFilter.connect(fartGain);
    fartGain.connect(this.ctx.destination);
    fartOsc.start(popTime);
    fartOsc.stop(popTime + 0.31);
  }

  // 4. 싹쓸이(판쓸이) 전용 다이나믹 사운드 ("쫘아아악~ 딴따라란!")
  playSseul() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // [파트 1: 바닥을 쫘아아악 쓸어버리는 다이나믹 브러시 스위프 윈드]
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.35); // 350ms
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const sweepNoise = this.ctx.createBufferSource();
    sweepNoise.buffer = buffer;

    const sweepFilter = this.ctx.createBiquadFilter();
    sweepFilter.type = 'bandpass';
    sweepFilter.Q.setValueAtTime(2.0, t);
    sweepFilter.frequency.setValueAtTime(350, t);
    sweepFilter.frequency.exponentialRampToValueAtTime(3200, t + 0.18);
    sweepFilter.frequency.exponentialRampToValueAtTime(600, t + 0.35);

    const sweepGain = this.ctx.createGain();
    sweepGain.gain.setValueAtTime(0.1, t);
    sweepGain.gain.linearRampToValueAtTime(0.7, t + 0.12);
    sweepGain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    sweepNoise.connect(sweepFilter);
    sweepFilter.connect(sweepGain);
    sweepGain.connect(this.ctx.destination);
    sweepNoise.start(t);

    // [파트 2: 바닥 싹쓸이의 통쾌한 5단계 상승 아르페지오 팡파레]
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + 0.08 + idx * 0.055;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.45, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + (idx === notes.length - 1 ? 0.35 : 0.15));

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + (idx === notes.length - 1 ? 0.36 : 0.16));
    });
  }

  // 5. 쪽 / 따닥 / 특수 획득 (경쾌한 팡파레)
  playSpecial() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.06;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.4, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.16);
    });
  }

  // 5. 폭탄 / 흔들기 사운드 (웅장한 타격음)
  playBomb() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.4);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.46);
  }

  // 6. "고!" 외침 사운드
  playGo() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.2);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  // 7. "스톱!" 및 승리 축하 사운드
  playStop() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.50];
    chords.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.75);
    });
  }
}

// 싱글톤 인스턴스 전역 노출
window.soundEngine = new SoundEngine();
