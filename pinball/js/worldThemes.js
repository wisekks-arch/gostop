/**
 * Pinball Rush (핀볼 러시) - 5대 테마 월드 명세 (worldThemes.js)
 * 클래식 아케이드, 우주, 해적, 사이버시티, 판타지 테마의 오브젝트 구성, 시각 스타일 및 보스전 스펙
 */

const WorldThemes = (() => {
  const THEMES = {
    CLASSIC: {
      id: "CLASSIC",
      name: "월드 1: 클래식 아케이드",
      desc: "네온 사이버 스타일과 정통 아케이드 핀볼의 경쾌한 콤보 액션",
      bgGradient: ["#070714", "#120e2e", "#0a0a18"],
      accentColor: "#00f0ff",     // 네온 사이언
      secondaryColor: "#ff0077",  // 네온 마젠타
      bumperColor: "#ffeb3b",     // 골드 옐로우
      wallColor: "#00d2ff",
      tableBorder: "#2a2258",
      ambientParticles: "NEON_SPARKS",
      bumpers: [
        { x: 140, y: 190, radius: 26, points: 500, kickPower: 12.0, color: "#ff0077" },
        { x: 240, y: 190, radius: 26, points: 500, kickPower: 12.0, color: "#00f0ff" },
        { x: 190, y: 265, radius: 28, points: 1000, kickPower: 13.5, color: "#ffeb3b" }
      ],
      rollovers: [
        { x: 120, y: 80, width: 22, height: 18, points: 200, active: false, label: "R" },
        { x: 190, y: 70, width: 22, height: 18, points: 200, active: false, label: "U" },
        { x: 260, y: 80, width: 22, height: 18, points: 200, active: false, label: "S" },
        { x: 320, y: 100, width: 22, height: 18, points: 200, active: false, label: "H" }
      ],
      spinners: [
        { x: 75, y: 220, radius: 14, angle: 0, speed: 0, pointsPerSpin: 100 }
      ],
      hasBoss: false
    },

    SPACE: {
      id: "SPACE",
      name: "월드 2: 우주 (Cosmic Galaxy)",
      desc: "블랙홀 중력장, 워프게이트 및 레이저 범퍼가 펼쳐지는 은하계 탐험",
      bgGradient: ["#030511", "#09122c", "#050616"],
      accentColor: "#7928ca",     // 코스믹 퍼플
      secondaryColor: "#00dfd8",  // 네뷸라 틸
      bumperColor: "#a855f7",
      wallColor: "#4f46e5",
      tableBorder: "#1e1b4b",
      ambientParticles: "STARS",
      bumpers: [
        { x: 130, y: 180, radius: 25, points: 600, kickPower: 12.5, color: "#00dfd8" },
        { x: 250, y: 180, radius: 25, points: 600, kickPower: 12.5, color: "#7928ca" },
        { x: 190, y: 250, radius: 30, points: 1200, kickPower: 14.0, color: "#ec4899" }
      ],
      blackhole: {
        x: 190, y: 130, radius: 28, gravityRadius: 85, pullForce: 0.42,
        active: true, spinTimer: 0, trappedBall: null
      },
      warpGates: [
        { inX: 65, inY: 290, outX: 300, outY: 90, radius: 16, cooldown: 0 },
        { inX: 315, inY: 290, outX: 80, outY: 90, radius: 16, cooldown: 0 }
      ],
      rollovers: [
        { x: 130, y: 75, width: 22, height: 18, points: 300, active: false, label: "★" },
        { x: 190, y: 65, width: 22, height: 18, points: 300, active: false, label: "★" },
        { x: 250, y: 75, width: 22, height: 18, points: 300, active: false, label: "★" }
      ],
      hasBoss: false
    },

    PIRATE: {
      id: "PIRATE",
      name: "월드 3: 해적 (Pirate Cove)",
      desc: "비밀 보물상자와 해적 대포, 거대 크라켄 촉수를 격파하는 해양 모험",
      bgGradient: ["#081214", "#0a2628", "#051318"],
      accentColor: "#f59e0b",     // 골드 앰버
      secondaryColor: "#10b981",  // 에메랄드 그린
      bumperColor: "#d97706",
      wallColor: "#059669",
      tableBorder: "#134e4a",
      ambientParticles: "GOLD_COINS",
      bumpers: [
        { x: 135, y: 200, radius: 27, points: 700, kickPower: 12.0, color: "#f59e0b" },
        { x: 245, y: 200, radius: 27, points: 700, kickPower: 12.0, color: "#10b981" },
        { x: 190, y: 280, radius: 32, points: 1500, kickPower: 14.5, color: "#ef4444" }
      ],
      chests: [
        { x: 90, y: 110, width: 34, height: 26, hp: 3, maxHp: 3, points: 2000, opened: false },
        { x: 190, y: 90, width: 34, height: 26, hp: 3, maxHp: 3, points: 2000, opened: false },
        { x: 290, y: 110, width: 34, height: 26, hp: 3, maxHp: 3, points: 2000, opened: false }
      ],
      krakenTentacles: [
        { x: 70, y: 230, width: 14, height: 50, swing: 0, points: 400 },
        { x: 310, y: 230, width: 14, height: 50, swing: Math.PI, points: 400 }
      ],
      hasBoss: false
    },

    CYBER_CITY: {
      id: "CYBER_CITY",
      name: "월드 4: 사이버시티 (Cyber City)",
      desc: "도시를 장악한 거대 AI 코어 보스를 타격하여 처치하는 사이버펑크 결전",
      bgGradient: ["#0e051a", "#1b0a33", "#090312"],
      accentColor: "#06b6d4",     // 네온 시안
      secondaryColor: "#f43f5e",  // 네온 로즈
      bumperColor: "#8b5cf6",
      wallColor: "#d946ef",
      tableBorder: "#4a044e",
      ambientParticles: "CYBER_CIRCUITS",
      bumpers: [
        { x: 125, y: 220, radius: 24, points: 800, kickPower: 12.0, color: "#06b6d4" },
        { x: 255, y: 220, radius: 24, points: 800, kickPower: 12.0, color: "#f43f5e" }
      ],
      hasBoss: true,
      boss: {
        name: "AI 코어: NEXUS-9",
        x: 190, y: 120, radius: 38,
        hp: 30, maxHp: 30,
        shieldAngle: 0,
        shieldActive: true,
        points: 50000,
        defeated: false
      }
    },

    FANTASY: {
      id: "FANTASY",
      name: "월드 5: 판타지 (Dragon Lair)",
      desc: "고대 드래곤의 화염 브레스와 마법진 포탈을 돌파하는 궁극의 던전",
      bgGradient: ["#140707", "#2e0f0f", "#120505"],
      accentColor: "#ef4444",     // 파이어 레드
      secondaryColor: "#f97316",  // 블레이즈 오렌지
      bumperColor: "#fbbf24",
      wallColor: "#b91c1c",
      tableBorder: "#450a0a",
      ambientParticles: "FIRE_EMBER",
      bumpers: [
        { x: 130, y: 230, radius: 26, points: 1000, kickPower: 13.0, color: "#f97316" },
        { x: 250, y: 230, radius: 26, points: 1000, kickPower: 13.0, color: "#ef4444" },
        { x: 190, y: 305, radius: 30, points: 2000, kickPower: 15.0, color: "#fbbf24" }
      ],
      hasBoss: true,
      boss: {
        name: "화룡 이그니스 (Ignis)",
        x: 190, y: 130, radius: 42,
        hp: 50, maxHp: 50,
        fireTimer: 0,
        points: 100000,
        defeated: false
      }
    }
  };

  function getTheme(themeId) {
    return THEMES[themeId] ? JSON.parse(JSON.stringify(THEMES[themeId])) : JSON.parse(JSON.stringify(THEMES.CLASSIC));
  }

  function getAllThemes() {
    return Object.values(THEMES);
  }

  return {
    THEMES,
    getTheme,
    getAllThemes
  };
})();

if (typeof window !== "undefined") {
  window.WorldThemes = WorldThemes;
}
