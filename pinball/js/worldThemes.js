/**
 * Pinball Rush (핀볼 러시) - 3대 명작 핀볼 머신 & 테마 명세 (worldThemes.js)
 * 머신 1: AVENGERS (어벤져스 인피니티 퀘스트 - 타노스/인피니티 스톤/히어로 범퍼)
 * 머신 2: PIRATE (블랙 로즈 : 싱크 쉽 - 해적선 회전 대포/SINK SHIP 잭팟)
 * 머신 3: GUARDIANS (가디언즈 오브 갤럭시 - 그루트 범퍼/스타로드 마스크/네온 워프)
 */

const WorldThemes = (() => {
  // 외곽 체이서 전구 38개 자동 생성
  function generateChaserBulbs() {
    const bulbs = [];
    const colors = ["#ff0055", "#ffeb3b", "#ff7700", "#00f0ff", "#a855f7"];

    // 1. 상단 아치 곡선 전구 (14개)
    for (let i = 0; i <= 14; i++) {
      const angle = Math.PI + (i / 14) * Math.PI;
      const x = 180 + Math.cos(angle) * 150;
      const y = 140 + Math.sin(angle) * 105;
      bulbs.push({ x, y, radius: 4.5, color: colors[i % colors.length], id: `arch_${i}` });
    }

    // 2. 좌측 외곽 수직 레일 전구 (8개)
    for (let i = 0; i < 8; i++) {
      bulbs.push({ x: 28, y: 175 + i * 42, radius: 4.5, color: colors[(i + 1) % colors.length], id: `left_${i}` });
    }

    // 3. 우측 외곽 발사대 레일 전구 (8개)
    for (let i = 0; i < 8; i++) {
      bulbs.push({ x: 348, y: 175 + i * 42, radius: 4.5, color: colors[(i + 3) % colors.length], id: `right_${i}` });
    }

    // 4. 하단 플리퍼 주변 전구 (8개)
    const lowerPositions = [
      { x: 80, y: 535 }, { x: 105, y: 555 }, { x: 125, y: 585 },
      { x: 235, y: 585 }, { x: 255, y: 555 }, { x: 280, y: 535 },
      { x: 180, y: 610 }, { x: 180, y: 565 }
    ];
    lowerPositions.forEach((pos, idx) => {
      bulbs.push({ x: pos.x, y: pos.y, radius: 5.0, color: colors[idx % colors.length], id: `lower_${idx}` });
    });

    return bulbs;
  }

  const THEMES = {
    // ============================================================
    // 🦸‍♂️ 머신 1: 어벤져스 인피니티 퀘스트 (Avengers Infinity Quest)
    // ============================================================
    AVENGERS: {
      id: "AVENGERS",
      name: "어벤져스 : 인피니티 퀘스트",
      subName: "AVENGERS INFINITY QUEST",
      badge: "🦸‍♂️ MARVEL HERO",
      icon: "🦸‍♂️",
      desc: "타노스의 인피니티 건틀릿, 헐크·아이언맨·토르·캡틴 아메리카의 슈퍼 히어로 핀볼",
      bgImageKey: "AVENGERS",
      bgSrc: "assets/table_avengers.jpg",
      dmdType: "AVENGERS",
      bgGradient: ["#0b0e24", "#1d234d", "#0c102b"],
      accentColor: "#ef4444",      // 아이언맨 레드
      secondaryColor: "#eab308",   // 인피니티 골드
      bumperColor: "#10b981",      // 헐크 그린
      wallColor: "#3b82f6",        // 캡틴 블루
      tableBorder: "#1e3a8a",
      chaserBulbs: generateChaserBulbs(),
      insertArrows: [
        { x: 140, y: 360, dir: "UP", label: "SPACE", color: "#3b82f6", mult: 2 },
        { x: 160, y: 360, dir: "UP", label: "REALITY", color: "#ef4444", mult: 2 },
        { x: 180, y: 360, dir: "UP", label: "POWER", color: "#a855f7", mult: 3 },
        { x: 200, y: 360, dir: "UP", label: "MIND", color: "#eab308", mult: 3 },
        { x: 220, y: 360, dir: "UP", label: "TIME", color: "#10b981", mult: 4 },
        { x: 180, y: 440, dir: "UP", label: "BATTLE THANOS", color: "#f97316", mult: 5 },
        { x: 180, y: 550, dir: "DOWN", label: "AVENGERS ASSEMBLE", color: "#ef4444" }
      ],
      bumpers: [
        { x: 180, y: 190, radius: 26, points: 3000, kickPower: 14.5, color: "#a855f7", label: "THANOS" },
        { x: 130, y: 245, radius: 24, points: 2000, kickPower: 13.0, color: "#10b981", label: "HULK" },
        { x: 230, y: 245, radius: 24, points: 2000, kickPower: 13.0, color: "#ef4444", label: "IRON" },
        { x: 180, y: 295, radius: 22, points: 1500, kickPower: 12.5, color: "#3b82f6", label: "CAP" }
      ],
      rollovers: [
        { x: 110, y: 95, width: 20, height: 16, points: 500, active: false, label: "T" },
        { x: 155, y: 85, width: 20, height: 16, points: 500, active: false, label: "H" },
        { x: 205, y: 85, width: 20, height: 16, points: 500, active: false, label: "O" },
        { x: 250, y: 95, width: 20, height: 16, points: 500, active: false, label: "R" }
      ],
      wireRamps: [
        { startX: 290, startY: 390, cp1X: 325, cp1Y: 210, cp2X: 245, cp2Y: 100, endX: 180, endY: 95 }
      ],
      hasBoss: false
    },

    // ============================================================
    // 🏴‍☠️ 머신 2: 블랙 로즈 : 싱크 쉽 (Black Rose : Sink Ship)
    // ============================================================
    PIRATE: {
      id: "PIRATE",
      name: "블랙 로즈 : 싱크 쉽",
      subName: "BLACK ROSE : SINK SHIP",
      badge: "🏴‍☠️ PIRATE CANNON",
      icon: "🏴‍☠️",
      desc: "바다의 무법자 해적선! 중앙 회전 대포(Cannon) 발사 및 SINK SHIP 군함 침몰 잭팟",
      bgImageKey: "PIRATE",
      bgSrc: "assets/table_pirate.jpg",
      dmdType: "PIRATE",
      bgGradient: ["#120804", "#2c150b", "#140905"],
      accentColor: "#f59e0b",      // 황금 보물 골드
      secondaryColor: "#10b981",   // 에메랄드 해적
      bumperColor: "#d97706",
      wallColor: "#059669",
      tableBorder: "#451a03",
      chaserBulbs: generateChaserBulbs(),
      insertArrows: [
        { x: 180, y: 370, dir: "UP", label: "SINK SHIP", color: "#ef4444", mult: 3 },
        { x: 180, y: 410, dir: "UP", label: "BROADSIDE", color: "#f59e0b", mult: 2 },
        { x: 120, y: 430, dir: "LEFT_UP", label: "JACKPOT", color: "#10b981" },
        { x: 240, y: 430, dir: "RIGHT_UP", label: "CANNON", color: "#ff0055" },
        { x: 180, y: 540, dir: "DOWN", label: "SHOOT AGAIN", color: "#f59e0b" }
      ],
      bumpers: [
        // 상단 해적선 돛대
        { x: 180, y: 155, radius: 26, points: 2500, kickPower: 14.0, color: "#d97706", label: "SHIP" },
        // 좌측 해적 검사
        { x: 115, y: 340, radius: 24, points: 2000, kickPower: 13.0, color: "#10b981", label: "JACK" },
        // 우측 해적 선원
        { x: 245, y: 340, radius: 24, points: 2000, kickPower: 13.0, color: "#f59e0b", label: "ROSE" },
        // 중앙 회전 대포 핫스팟
        { x: 180, y: 450, radius: 25, points: 5000, kickPower: 16.0, color: "#94a3b8", label: "CANNON" }
      ],
      rollovers: [
        { x: 120, y: 95, width: 20, height: 16, points: 600, active: false, label: "☠" },
        { x: 180, y: 85, width: 20, height: 16, points: 600, active: false, label: "⚓" },
        { x: 240, y: 95, width: 20, height: 16, points: 600, active: false, label: "⚔" }
      ],
      wireRamps: [
        { startX: 290, startY: 370, cp1X: 320, cp1Y: 200, cp2X: 240, cp2Y: 90, endX: 180, endY: 90 }
      ],
      hasBoss: false
    },

    // ============================================================
    // 🚀 머신 3: 가디언즈 오브 갤럭시 (Guardians of the Galaxy)
    // ============================================================
    GUARDIANS: {
      id: "GUARDIANS",
      name: "가디언즈 오브 갤럭시",
      subName: "GUARDIANS OF THE GALAXY",
      badge: "🚀 COSMIC GROOT",
      icon: "🚀",
      desc: "상단 거대 그루트(Groot) 인터랙티브 범퍼, 스타로드의 믹스테이프 & 코스믹 워프게이트",
      bgImageKey: "GUARDIANS",
      bgSrc: "assets/table_guardians.jpg",
      dmdType: "GUARDIANS",
      bgGradient: ["#090514", "#1a0b33", "#0c0419"],
      accentColor: "#ec4899",      // 네온 핑크
      secondaryColor: "#06b6d4",   // 사이버 사이언
      bumperColor: "#84cc16",      // 그루트 그린
      wallColor: "#06b6d4",
      tableBorder: "#3b0764",
      chaserBulbs: generateChaserBulbs(),
      insertArrows: [
        { x: 180, y: 370, dir: "UP", label: "WE ARE GROOT", color: "#84cc16", mult: 2 },
        { x: 180, y: 410, dir: "UP", label: "CHERRY BOMB", color: "#ec4899", mult: 3 },
        { x: 180, y: 450, dir: "UP", label: "ORB MULTIBALL", color: "#06b6d4", mult: 5 },
        { x: 110, y: 430, dir: "LEFT_UP", label: "STAR-LORD", color: "#f59e0b" },
        { x: 250, y: 430, dir: "RIGHT_UP", label: "ROCKET", color: "#a855f7" },
        { x: 180, y: 540, dir: "DOWN", label: "SAVE GALAXY", color: "#ec4899" }
      ],
      bumpers: [
        // 상단 거대 그루트 머리
        { x: 180, y: 145, radius: 28, points: 4000, kickPower: 15.0, color: "#84cc16", label: "GROOT" },
        // 중앙 코스믹 오브 2구
        { x: 135, y: 255, radius: 22, points: 2000, kickPower: 13.0, color: "#ec4899", label: "ORB" },
        { x: 225, y: 255, radius: 22, points: 2000, kickPower: 13.0, color: "#06b6d4", label: "ROCKET" },
        // 중앙 믹스테이프 볼륨2
        { x: 180, y: 320, radius: 24, points: 3000, kickPower: 13.5, color: "#f59e0b", label: "VOL.2" }
      ],
      rollovers: [
        { x: 120, y: 95, width: 20, height: 16, points: 700, active: false, label: "G" },
        { x: 180, y: 85, width: 20, height: 16, points: 700, active: false, label: "A" },
        { x: 240, y: 95, width: 20, height: 16, points: 700, active: false, label: "L" }
      ],
      wireRamps: [
        { startX: 290, startY: 380, cp1X: 320, cp1Y: 200, cp2X: 240, cp2Y: 100, endX: 180, endY: 100 }
      ],
      hasBoss: false
    },

    // ============================================================
    // (보조 호환) 스페이스 미션 (Space Mission Classic)
    // ============================================================
    CLASSIC: {
      id: "CLASSIC",
      name: "SPACE MISSION (우주 미션)",
      subName: "SPACE MISSION CLASSIC",
      badge: "✨ RETRO NEON",
      icon: "✨",
      desc: "사진 속 실제 핀볼 머신: 상단 3단 백글래스, 3구 레드 팝범퍼, 로켓 2X/3X/5X 배수 및 UFO 램프",
      bgImageKey: "SPACE",
      bgSrc: "assets/table_space.jpg",
      dmdType: "SPACE",
      bgGradient: ["#05081c", "#101838", "#080c22"],
      accentColor: "#ef4444",
      secondaryColor: "#00f0ff",
      bumperColor: "#ef4444",
      wallColor: "#38bdf8",
      tableBorder: "#1e1b4b",
      chaserBulbs: generateChaserBulbs(),
      insertArrows: [
        { x: 180, y: 360, dir: "UP", label: "2X", color: "#10b981", mult: 2 },
        { x: 180, y: 400, dir: "UP", label: "3X", color: "#f59e0b", mult: 3 },
        { x: 180, y: 440, dir: "UP", label: "5X", color: "#ef4444", mult: 5 },
        { x: 110, y: 430, dir: "LEFT_UP", label: "LOCK", color: "#00f0ff" },
        { x: 250, y: 430, dir: "RIGHT_UP", label: "EXTRA BALL", color: "#ffeb3b" },
        { x: 180, y: 540, dir: "DOWN", label: "SHOOT AGAIN", color: "#ff0077" }
      ],
      bumpers: [
        { x: 135, y: 175, radius: 24, points: 1000, kickPower: 12.5, color: "#ef4444", label: "POP" },
        { x: 225, y: 175, radius: 24, points: 1000, kickPower: 12.5, color: "#ef4444", label: "POP" },
        { x: 180, y: 225, radius: 26, points: 2500, kickPower: 14.5, color: "#ff0055", label: "MISSION" }
      ],
      rollovers: [
        { x: 115, y: 95, width: 20, height: 16, points: 500, active: false, label: "S" },
        { x: 158, y: 85, width: 20, height: 16, points: 500, active: false, label: "P" },
        { x: 202, y: 85, width: 20, height: 16, points: 500, active: false, label: "A" },
        { x: 245, y: 95, width: 20, height: 16, points: 500, active: false, label: "C" }
      ],
      wireRamps: [
        { startX: 290, startY: 380, cp1X: 320, cp1Y: 200, cp2X: 240, cp2Y: 110, endX: 180, endY: 110 }
      ],
      hasBoss: false
    }
  };

  function getTheme(themeId) {
    if (THEMES[themeId]) {
      return JSON.parse(JSON.stringify(THEMES[themeId]));
    }
    // 기본값은 어벤져스
    return JSON.parse(JSON.stringify(THEMES.AVENGERS));
  }

  // 상위 3대 명작 핀볼 머신 리스트 반환
  function getMainMachines() {
    return [THEMES.AVENGERS, THEMES.PIRATE, THEMES.GUARDIANS];
  }

  function getAllThemes() {
    return Object.values(THEMES);
  }

  return {
    THEMES,
    getTheme,
    getMainMachines,
    getAllThemes
  };
})();

if (typeof window !== "undefined") {
  window.WorldThemes = WorldThemes;
}
