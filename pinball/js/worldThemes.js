/**
 * Pinball Rush (핀볼 러시) - SPACE MISSION & 전통 핀볼 테이블 명세 (worldThemes.js)
 * 첨부 사진 기반: 상단 3단 백글래스, 3구 레드 팝범퍼, 중앙 우주 로켓 2X/3X/5X,
 * 좌측 UFO 램프, 하단 SHOOT AGAIN 부활 존 및 실사 핫스팟 매핑
 */

const WorldThemes = (() => {
  // 실사 사진 속 외곽 전구 및 통로를 따라 배치되는 38개 체이서 전구 좌표
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

    // 4. 하단 플리퍼 및 슬링샷 주변 인서트 전구 (8개)
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

  // 바닥 2X, 3X, 5X 배수 및 SHOOT AGAIN 인서트 조명 (사진 속 실제 인서트)
  const INSERT_ARROWS = [
    { x: 180, y: 360, dir: "UP", label: "2X", color: "#10b981", mult: 2 },
    { x: 180, y: 400, dir: "UP", label: "3X", color: "#f59e0b", mult: 3 },
    { x: 180, y: 440, dir: "UP", label: "5X", color: "#ef4444", mult: 5 },
    { x: 110, y: 430, dir: "LEFT_UP", label: "LOCK", color: "#00f0ff" },
    { x: 250, y: 430, dir: "RIGHT_UP", label: "EXTRA BALL", color: "#ffeb3b" },
    { x: 180, y: 540, dir: "DOWN", label: "SHOOT AGAIN", color: "#ff0077" }
  ];

  const THEMES = {
    CLASSIC: {
      id: "CLASSIC",
      name: "SPACE MISSION (우주 미션)",
      desc: "사진 속 실제 핀볼 머신: 상단 3단 백글래스, 3구 레드 팝범퍼, 로켓 2X/3X/5X 배수 및 UFO 램프",
      bgGradient: ["#05081c", "#101838", "#080c22"],
      accentColor: "#ef4444",     // 사진 속 강렬한 레드 팝범퍼
      secondaryColor: "#00f0ff",  // 네온 사이언 UFO 램프
      bumperColor: "#ef4444",
      wallColor: "#38bdf8",
      tableBorder: "#1e1b4b",
      chaserBulbs: generateChaserBulbs(),
      insertArrows: INSERT_ARROWS,
      // 사진 속 실제 3구 팝 범퍼 (MISSION CONTROL 상단 삼각형 배치)
      bumpers: [
        { x: 135, y: 175, radius: 24, points: 1000, kickPower: 12.5, color: "#ef4444", label: "POP" },
        { x: 225, y: 175, radius: 24, points: 1000, kickPower: 12.5, color: "#ef4444", label: "POP" },
        { x: 180, y: 225, radius: 26, points: 2500, kickPower: 14.5, color: "#ff0055", label: "MISSION" }
      ],
      // 좌측 UFO 스피너 램프 기믹
      ufoSpinner: { x: 55, y: 320, radius: 22, points: 3000, label: "UFO" },
      rollovers: [
        { x: 115, y: 95, width: 20, height: 16, points: 500, active: false, label: "S" },
        { x: 158, y: 85, width: 20, height: 16, points: 500, active: false, label: "P" },
        { x: 202, y: 85, width: 20, height: 16, points: 500, active: false, label: "A" },
        { x: 245, y: 95, width: 20, height: 16, points: 500, active: false, label: "C" }
      ],
      // 우측 크롬 와이어 램프 레일
      wireRamps: [
        { startX: 290, startY: 380, cp1X: 320, cp1Y: 200, cp2X: 240, cp2Y: 110, endX: 180, endY: 110 }
      ],
      hasBoss: false
    },

    SPACE: {
      id: "SPACE",
      name: "코스믹 은하계 (Cosmic Galaxy)",
      desc: "블랙홀 중력장과 워프게이트가 펼쳐지는 심우주 핀볼",
      bgGradient: ["#030511", "#09122c", "#050616"],
      accentColor: "#7928ca",
      secondaryColor: "#00dfd8",
      bumperColor: "#a855f7",
      wallColor: "#4f46e5",
      tableBorder: "#1e1b4b",
      chaserBulbs: generateChaserBulbs(),
      insertArrows: INSERT_ARROWS,
      bumpers: [
        { x: 135, y: 175, radius: 24, points: 1000, kickPower: 12.5, color: "#00dfd8", label: "WARP" },
        { x: 225, y: 175, radius: 24, points: 1000, kickPower: 12.5, color: "#7928ca", label: "WARP" },
        { x: 180, y: 225, radius: 26, points: 2500, kickPower: 14.5, color: "#ec4899", label: "NOVA" }
      ],
      rollovers: [
        { x: 125, y: 90, width: 20, height: 16, points: 500, active: false, label: "★" },
        { x: 180, y: 80, width: 20, height: 16, points: 500, active: false, label: "★" },
        { x: 235, y: 90, width: 20, height: 16, points: 500, active: false, label: "★" }
      ],
      hasBoss: false
    },

    PIRATE: {
      id: "PIRATE",
      name: "해적 코브 (Pirate Cove)",
      desc: "비밀 보물상자와 해적 대포 잭팟 모험",
      bgGradient: ["#081214", "#0a2628", "#051318"],
      accentColor: "#f59e0b",
      secondaryColor: "#10b981",
      bumperColor: "#d97706",
      wallColor: "#059669",
      tableBorder: "#134e4a",
      chaserBulbs: generateChaserBulbs(),
      insertArrows: INSERT_ARROWS,
      bumpers: [
        { x: 135, y: 175, radius: 24, points: 1000, kickPower: 12.5, color: "#f59e0b", label: "GOLD" },
        { x: 225, y: 175, radius: 24, points: 1000, kickPower: 12.5, color: "#10b981", label: "GOLD" },
        { x: 180, y: 225, radius: 26, points: 2500, kickPower: 15.0, color: "#ef4444", label: "CHEST" }
      ],
      hasBoss: false
    },

    CYBER_CITY: {
      id: "CYBER_CITY",
      name: "사이버시티 (Cyber City)",
      desc: "도시를 장악한 거대 AI 코어 보스를 타격하여 처치하는 결전",
      bgGradient: ["#0e051a", "#1b0a33", "#090312"],
      accentColor: "#06b6d4",
      secondaryColor: "#f43f5e",
      bumperColor: "#8b5cf6",
      wallColor: "#d946ef",
      tableBorder: "#4a044e",
      chaserBulbs: generateChaserBulbs(),
      insertArrows: INSERT_ARROWS,
      bumpers: [
        { x: 135, y: 175, radius: 24, points: 1000, kickPower: 12.5, color: "#06b6d4", label: "CORE" },
        { x: 225, y: 175, radius: 24, points: 1000, kickPower: 12.5, color: "#f43f5e", label: "CORE" }
      ],
      hasBoss: true,
      boss: {
        name: "AI 코어: NEXUS-9",
        x: 180, y: 120, radius: 36,
        hp: 30, maxHp: 30,
        points: 50000,
        defeated: false
      }
    },

    FANTASY: {
      id: "FANTASY",
      name: "드래곤 레어 (Dragon Lair)",
      desc: "고대 화룡의 화염 브레스와 마법진 포탈을 돌파하는 던전",
      bgGradient: ["#140707", "#2e0f0f", "#120505"],
      accentColor: "#ef4444",
      secondaryColor: "#f97316",
      bumperColor: "#fbbf24",
      wallColor: "#b91c1c",
      tableBorder: "#450a0a",
      chaserBulbs: generateChaserBulbs(),
      insertArrows: INSERT_ARROWS,
      bumpers: [
        { x: 135, y: 175, radius: 24, points: 1000, kickPower: 13.0, color: "#f97316", label: "FIRE" },
        { x: 225, y: 175, radius: 24, points: 1000, kickPower: 13.0, color: "#ef4444", label: "FIRE" },
        { x: 180, y: 225, radius: 26, points: 2500, kickPower: 15.0, color: "#fbbf24", label: "DRAGON" }
      ],
      hasBoss: true,
      boss: {
        name: "화룡 이그니스 (Ignis)",
        x: 180, y: 125, radius: 38,
        hp: 50, maxHp: 50,
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
