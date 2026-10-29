/**
 * Pinball Rush (핀볼 러시) - 오디오 신시사이저 & 라스베가스 BGM 엔진 (audioManager.js)
 * Web Audio API를 활용하여 외부 오디오 파일 다운로드 없이
 * 지연시간 0초의 경쾌한 타격음과 신나는 125 BPM 라스베가스 아케이드 BGM을 무한 루프 합성 재생
 */

const AudioManager = (() => {
  let ctx = null;
  let masterGain = null;
  let bgmGain = null;
  let sfxGain = null;

  let isMuted = false;
  let isBgmPlaying = false;
  let bgmIntervalId = null;
  let bgmStep = 0;

  // 오디오 컨텍스트 초기화 (사용자 첫 인터랙션 시 자동 언락)
  function initAudio() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();

        masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.8, ctx.currentTime);
        masterGain.connect(ctx.destination);

        sfxGain = ctx.createGain();
        sfxGain.gain.setValueAtTime(0.85, ctx.currentTime);
        sfxGain.connect(masterGain);

        bgmGain = ctx.createGain();
        bgmGain.gain.setValueAtTime(0.35, ctx.currentTime);
        bgmGain.connect(masterGain);
      }
    }
    if (ctx && ctx.state === "suspended") {
      ctx.resume().then(() => {
        if (!isBgmPlaying && !isMuted) startVegasBGM();
      });
    } else if (ctx && ctx.state === "running") {
      if (!isBgmPlaying && !isMuted) startVegasBGM();
    }
  }

  // 햅틱 진동 헬퍼
  function triggerHaptic(pattern) {
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (e) {}
  }

  // ============================================================
  // 🎵 3대 명작 핀볼 머신별 신스 BGM 엔진 (Web Audio API Synthesizer)
  // 1) AVENGERS: 영웅적이고 웅장한 히어로 팡파레 & 펀치 베이스
  // 2) PIRATE: 경쾌하고 박진감 넘치는 해적선 대포 칩튠 비트
  // 3) GUARDIANS: 7080 레트로 디스코 펑키 팝 신스 아르페지오
  // ============================================================
  let currentThemeKey = "AVENGERS";
  const BGM_BPM = 126;
  const STEP_TIME_MS = (60 / BGM_BPM / 4) * 1000; // 16분음표 단위 (~119ms)

  // 테마별 베이스라인
  const THEME_BASS = {
    AVENGERS: [
      110.0, 0, 110.0, 110.0, 130.81, 0, 146.83, 0,
      110.0, 0, 110.0, 164.81, 146.83, 130.81, 110.0, 0
    ],
    PIRATE: [
      146.83, 0, 146.83, 174.61, 220.0, 0, 196.0, 174.61,
      146.83, 0, 164.81, 146.83, 130.81, 0, 146.83, 0
    ],
    GUARDIANS: [
      82.41, 0, 82.41, 0, 98.0, 0, 110.0, 123.47,
      82.41, 0, 146.83, 0, 123.47, 110.0, 98.0, 0
    ],
    SPACE: [
      82.41, 0, 82.41, 0, 98.0, 0, 110.0, 123.47,
      82.41, 0, 146.83, 0, 123.47, 110.0, 98.0, 0
    ]
  };

  // 테마별 리드 멜로디
  const THEME_LEAD = {
    AVENGERS: [
      440.0, 0, 440.0, 523.25, 659.25, 0, 587.33, 523.25,
      440.0, 0, 659.25, 783.99, 659.25, 0, 587.33, 0
    ],
    PIRATE: [
      587.33, 659.25, 698.46, 587.33, 880.0, 0, 783.99, 698.46,
      587.33, 0, 659.25, 698.46, 587.33, 523.25, 587.33, 0
    ],
    GUARDIANS: [
      329.63, 392.0, 493.88, 587.33, 659.25, 493.88, 392.0, 493.88,
      293.66, 369.99, 440.0, 587.33, 440.0, 369.99, 329.63, 0
    ],
    SPACE: [
      329.63, 392.0, 493.88, 587.33, 659.25, 493.88, 392.0, 493.88,
      293.66, 369.99, 440.0, 587.33, 440.0, 369.99, 329.63, 0
    ]
  };

  function playSynthKick(t) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.08);

    g.gain.setValueAtTime(0.7, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(g);
    g.connect(bgmGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  function playSynthSnare(t) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.06);

    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(g);
    g.connect(bgmGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  function playSynthBassNote(t, freq) {
    if (!ctx || freq <= 0) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, t);

    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

    osc.connect(g);
    g.connect(bgmGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  function playSynthArpNote(t, freq) {
    if (!ctx || freq <= 0) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);

    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(g);
    g.connect(bgmGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  function bgmTick() {
    if (!ctx || isMuted || !isBgmPlaying) return;
    const t = ctx.currentTime;
    const step = bgmStep % 16;

    // 1. 킥 드럼 (0, 4, 8, 12박)
    if (step % 4 === 0) {
      playSynthKick(t);
    }

    // 2. 스네어 비트 (4, 12박)
    if (step === 4 || step === 12) {
      playSynthSnare(t);
    }

    // 3. 머신별 전용 베이스라인
    const bassArr = THEME_BASS[currentThemeKey] || THEME_BASS.AVENGERS;
    const bassFreq = bassArr[step];
    if (bassFreq > 0) {
      playSynthBassNote(t, bassFreq);
    }

    // 4. 머신별 전용 리드 멜로디
    const leadArr = THEME_LEAD[currentThemeKey] || THEME_LEAD.AVENGERS;
    const arpFreq = leadArr[step];
    if (arpFreq > 0) {
      playSynthArpNote(t, arpFreq);
    }

    bgmStep++;
  }

  function setBgmTheme(themeKey) {
    currentThemeKey = THEME_BASS[themeKey] ? themeKey : "AVENGERS";
  }

  function startVegasBGM(themeKey = null) {
    if (themeKey) setBgmTheme(themeKey);
    if (bgmIntervalId) clearInterval(bgmIntervalId);
    isBgmPlaying = true;
    bgmStep = 0;
    bgmIntervalId = setInterval(bgmTick, STEP_TIME_MS);
  }

  function stopVegasBGM() {
    if (bgmIntervalId) {
      clearInterval(bgmIntervalId);
      bgmIntervalId = null;
    }
    isBgmPlaying = false;
  }

  // ============================================================
  // 🔊 인게임 효과음 (SFX)
  // ============================================================

  // 1. 플리퍼 조작음 (기계식 솔레노이드 타격 사운드: "탁/찰칵!")
  function playFlipper(isUp = true) {
    if (isMuted || !ctx) return;
    initAudio();

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (isUp) {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.04);

      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

      osc.connect(gain);
      gain.connect(sfxGain);
      osc.start(t);
      osc.stop(t + 0.05);

      triggerHaptic(12);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.02);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

      osc.connect(gain);
      gain.connect(sfxGain);
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

    const baseFreq = 540 + Math.min(12, comboLevel) * 38;

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(baseFreq, t);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.02);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, t + 0.12);

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(baseFreq * 2.05, t);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, t + 0.12);

    gain.gain.setValueAtTime(0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.15);
    osc2.stop(t + 0.15);

    triggerHaptic([20, 10, 20]);
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

    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(sfxGain);

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

    const notes = [523.25, 659.25, 783.99, 1046.50];
    const freq = notes[noteIndex % notes.length];

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.38, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(sfxGain);

    osc.start(t);
    osc.stop(t + 0.26);

    triggerHaptic(10);
  }

  // 5. 플런저 스프링 발사 사운드 ("슈우웅- 쾅!")
  function playPlungerLaunch(powerRatio = 1) {
    if (isMuted || !ctx) return;
    initAudio();

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(650 * powerRatio, t + 0.12);

    gain.gain.setValueAtTime(0.45 * powerRatio, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(sfxGain);

    osc.start(t);
    osc.stop(t + 0.18);

    triggerHaptic([35, 15, 45]);
  }

  // 6. 멀티볼 파워업 사운드 (우주적인 상승 팡파레)
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

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(sfxGain);

      osc.start(t);
      osc.stop(t + 0.26);
    });

    triggerHaptic([50, 30, 50, 30, 80]);
  }

  // 7. 잭팟 / 대규모 보너스 팡파레 ("빠바밤- 빰!")
  function playJackpot() {
    if (isMuted || !ctx) return;
    initAudio();

    const melody = [
      { f: 523.25, d: 0.1 },
      { f: 659.25, d: 0.1 },
      { f: 783.99, d: 0.1 },
      { f: 1046.50, d: 0.28 }
    ];

    let offset = 0;
    melody.forEach(m => {
      const t = ctx.currentTime + offset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(m.f, t);

      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + m.d);

      osc.connect(gain);
      gain.connect(sfxGain);

      osc.start(t);
      osc.stop(t + m.d + 0.02);
      offset += m.d;
    });

    triggerHaptic([40, 20, 40, 20, 100]);
  }

  // 8. 볼 아웃 (드레인 사운드)
  function playDrain() {
    if (isMuted || !ctx) return;
    initAudio();

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.45);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(sfxGain);

    osc.start(t);
    osc.stop(t + 0.52);

    triggerHaptic([80, 50, 100]);
  }

  // 9. 스킬 발동 사운드
  function playSkill(skillType) {
    if (isMuted || !ctx) return;
    initAudio();

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (skillType === "SLOW") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.35);
    } else if (skillType === "SHIELD") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(250, t);
      osc.frequency.exponentialRampToValueAtTime(950, t + 0.25);
    } else {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.2);
    }

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(sfxGain);

    osc.start(t);
    osc.stop(t + 0.35);

    triggerHaptic([40, 30, 40]);
  }

  // 볼륨 및 음소거 토글
  function toggleMute() {
    isMuted = !isMuted;
    if (masterGain && ctx) {
      masterGain.gain.setValueAtTime(isMuted ? 0 : 0.8, ctx.currentTime);
    }
    if (isMuted) {
      stopVegasBGM();
    } else {
      startVegasBGM();
    }
    return isMuted;
  }

  function getMuted() {
    return isMuted;
  }

  return {
    initAudio,
    startVegasBGM,
    stopVegasBGM,
    setBgmTheme,
    playFlipper,
    playBumper,
    playSlingshot,
    playRollover,
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
