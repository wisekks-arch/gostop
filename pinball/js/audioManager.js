/**
 * Pinball Rush (핀볼 러시) - 오디오 신시사이저 매니저 (audioManager.js)
 * Web Audio API를 활용하여 외부 오디오 파일 다운로드 없이
 * 지연시간(Latency) 0초의 경쾌하고 생생한 타격음 및 팡파레를 즉각 합성하여 재생
 */

const AudioManager = (() => {
  let ctx = null;
  let masterGain = null;
  let bgmOsc = null;
  let bgmGain = null;
  let isMuted = false;
  let isUnlocked = false;

  // 오디오 컨텍스트 초기화 (사용자 첫 인터랙션 시 자동 언락)
  function initAudio() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
        masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.7, ctx.currentTime);
        masterGain.connect(ctx.destination);
      }
    }
    if (ctx && ctx.state === "suspended") {
      ctx.resume().then(() => {
        isUnlocked = true;
      });
    } else if (ctx && ctx.state === "running") {
      isUnlocked = true;
    }
  }

  // 햅틱 진동 헬퍼 (모바일 스마트폰 지원 시)
  function triggerHaptic(pattern) {
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (e) {}
  }

  // 1. 플리퍼 조작음 (기계식 솔레노이드 타격 사운드: "탁/찰칵!")
  function playFlipper(isUp = true) {
    if (isMuted || !ctx) return;
    initAudio();

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (isUp) {
      // 플리퍼 올릴 때: 묵직한 솔레노이드 펀치
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.04);

      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.05);

      triggerHaptic(12); // 미세 햅틱
    } else {
      // 플리퍼 복귀할 때: 가벼운 기계식 클릭
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.02);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.03);
    }
  }

  // 2. 범퍼 충돌음 (경쾌하고 쨍한 금속성/네온 타격음: "탕! 핑!")
  function playBumper(comboLevel = 1) {
    if (isMuted || !ctx) return;
    initAudio();

    const t = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    // 콤보 레벨에 따라 피치 상승
    const baseFreq = 520 + Math.min(12, comboLevel) * 35;

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(baseFreq, t);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.02);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, t + 0.12);

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(baseFreq * 2.05, t);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, t + 0.12);

    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.15);
    osc2.stop(t + 0.15);

    triggerHaptic([20, 10, 20]); // 범퍼 충돌 햅틱
  }

  // 3. 슬링샷 충돌음 (강력한 고무 탄성 바운스: "퍽-팡!")
  function playSlingshot() {
    if (isMuted || !ctx) return;
    initAudio();

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.07);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(t);
    osc.stop(t + 0.09);

    triggerHaptic(25);
  }

  // 4. 롤오버 통과음 (맑고 고운 차임벨 사운드: "딩~")
  function playRollover(noteIndex = 0) {
    if (isMuted || !ctx) return;
    initAudio();

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const notes = [523.25, 659.25, 783.99, 1046.50]; // 도, 미, 솔, 높은도
    const freq = notes[noteIndex % notes.length];

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(t);
    osc.stop(t + 0.26);

    triggerHaptic(10);
  }

  // 5. 스피너 회전음 (고속 회전 기어 사운드: "치리리링")
  function playSpinner() {
    if (isMuted || !ctx) return;
    initAudio();

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(800 + Math.random() * 400, t);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(t);
    osc.stop(t + 0.035);
  }

  // 6. 플런저 스프링 발사 사운드 ("슈우웅- 쾅!")
  function playPlungerLaunch(powerRatio = 1) {
    if (isMuted || !ctx) return;
    initAudio();

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(650 * powerRatio, t + 0.12);

    gain.gain.setValueAtTime(0.4 * powerRatio, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(t);
    osc.stop(t + 0.18);

    triggerHaptic([35, 15, 45]);
  }

  // 7. 멀티볼 파워업 사운드 (우주적인 상승 팡파레)
  function playMultiball() {
    if (isMuted || !ctx) return;
    initAudio();

    const chords = [440, 554.37, 659.25, 880];
    chords.forEach((freq, idx) => {
      const t = ctx.currentTime + idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.2);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(t);
      osc.stop(t + 0.26);
    });

    triggerHaptic([50, 30, 50, 30, 80]);
  }

  // 8. 잭팟 / 대규모 보너스 팡파레 ("빠바밤- 빰!")
  function playJackpot() {
    if (isMuted || !ctx) return;
    initAudio();

    const melody = [
      { f: 523.25, d: 0.1 },
      { f: 659.25, d: 0.1 },
      { f: 783.99, d: 0.1 },
      { f: 1046.50, d: 0.25 }
    ];

    let offset = 0;
    melody.forEach(m => {
      const t = ctx.currentTime + offset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(m.f, t);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + m.d);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(t);
      osc.stop(t + m.d + 0.02);
      offset += m.d;
    });

    triggerHaptic([40, 20, 40, 20, 100]);
  }

  // 9. 스킬 발동 사운드
  function playSkill(skillType) {
    if (isMuted || !ctx) return;
    initAudio();

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (skillType === "SLOW") {
      // 타임 슬로우: 저음으로 피치 드롭
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.35);
    } else if (skillType === "SHIELD") {
      // 실드 배리어: 전자 에너지 상승음
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(250, t);
      osc.frequency.exponentialRampToValueAtTime(950, t + 0.25);
    } else {
      // 기본 파워업
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.2);
    }

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(t);
    osc.stop(t + 0.35);

    triggerHaptic([40, 30, 40]);
  }

  // 10. 볼 아웃 (추락/드레인 사운드: 아쉬운 다운톤)
  function playDrain() {
    if (isMuted || !ctx) return;
    initAudio();

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.45);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(t);
    osc.stop(t + 0.52);

    triggerHaptic([80, 50, 100]);
  }

  // 볼륨 및 음소거 토글
  function toggleMute() {
    isMuted = !isMuted;
    if (masterGain && ctx) {
      masterGain.gain.setValueAtTime(isMuted ? 0 : 0.7, ctx.currentTime);
    }
    return isMuted;
  }

  function getMuted() {
    return isMuted;
  }

  return {
    initAudio,
    playFlipper,
    playBumper,
    playSlingshot,
    playRollover,
    playSpinner,
    playPlungerLaunch,
    playMultiball,
    playJackpot,
    playSkill,
    playDrain,
    toggleMute,
    getMuted,
    triggerHaptic
  };
})();

if (typeof window !== "undefined") {
  window.AudioManager = AudioManager;
}
