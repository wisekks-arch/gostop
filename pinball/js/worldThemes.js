/**
 * Pinball Rush (핀볼 러시) - 라스베가스 전통 핀볼 테이블 & 체이서 전구 명세 (worldThemes.js)
 * 첨부 사진 기반: 화려한 체이서 전구 불빛, 3구 팝 범퍼, 와이어 램프, 도트 전광판(DMD) 연동
 */

const WorldThemes = (() => {
  // 테이블 외곽 및 레인을 따라 배치되는 38개 라스베가스 체이서 전구 좌표 생성
  function generateChaserBulbs() {
    const bulbs = [];
    const colors = ["#ff0055", "#ffeb3b", "#ff7700", "#00f0ff", "#10b981"];

    // 1. 상단 아치 곡선 전구 (14개)
    for (let i = 0; i <= 14; i++) {
      const angle = Math.PI + (i / 14) * Math.PI;
      const x = 190 + Math.cos(angle) * 155;
      const y = 145 + Math.sin(angle) * 115;
      bulbs.push({ x, y, radius: 4.5, color: colors[i % colors.length], id: `arch_${i}` });
    }

    // 2. 좌측 외곽 수직 레일 전구 (8개)
    for (let i = 0; i < 8; i++) {
      bulbs.push({ x: 28, y: 180 + i * 40, radius: 4.5, color: colors[(i + 2) % colors.length], id: `left_${i}` });
    }

    // 3. 우측 외곽 발사대 레일 전구 (8개)
    for (let i = 0; i < 8; i++) {
      bulbs.push({ x: 348, y: 180 + i * 40, radius: 4.5, color: colors[(i + 4) % colors.length], id: `right_${i}` });
    }

    // 4. 하단 플리퍼 주변 인디케이터 전구 (8개)
    const lowerPositions = [
      { x: 90, y: 550 }, { x: 115, y: 565 }, { x: 135, y: 595 },
      { x: 245, y: 595 }, { x: 265, y: 565 }, { x: 290, y: 550 },
      { x: 190, y: 615 }, { x: 190, y: 575 }
    ];
    lowerPositions.forEach((pos, idx) => {
      bulbs.push({ x: pos.x, y: pos.y, radius: 5.0, color: colors[idx % colors.length], id: `lower_${idx}` });
    });

    return bulbs;
  }

  // 바닥 화살표 인서트 전구 (Insert Arrows)
  const INSERT_ARROWS = [
    { x: 190, y: 460, dir: "UP", label: "JACKPOT", color: "#ffeb3b" },
    { x: 190, y: 420, dir: "UP", label: "COMBO", color: "#ff7700" },
    { x: 190, y: 380, dir: "UP", label: "AUTO FIRE", color: "#ff0055" },
    { x: 130, y: 440, dir: "LEFT_UP", label: "RAMP", color: "#00f0ff" },
    { x: 250, y: 440, dir: "RIGHT_UP", label: "SUPER", color: "#a855f7" }
  ];

  const THEMES = {
    CLASSIC: {
      id: "CLASSIC",
      name: "월드 1: 라스베가스 클래식",
      desc: "화려한 체이서 전구 불빛, 3구 팝범퍼, 와이어 램프가 어우러진 전통 라스베가스 카지노 머신",
      bgGradient: ["#0a0818", "#181236", "#0c0a1a"],
      accentColor: "#ff0077",
      secondaryColor: "#00f0ff",
      bumperColor: "#ffeb3b",
      wallColor: "#f59e0b",
      tableBorder: "#451a03",
      chaserBulbs: generateChaserBulbs(),
      insertArrows: INSERT_ARROWS,
      // 첨부 사진의 전통 3구 팝 범퍼 (역삼각형 배치)
      bumpers: [
        { x: 140, y: 220, radius: 27, points: 500, kickPower: 12.5, color: "#ff0055", label: "1000" },
        { x: 240, y: 220, radius: 27, points: 500, kickPower: 12.5, color: "#00f0ff", label: "1000" },
        { x: 190, y: 295, radius: 29, points: 1500, kickPower: 14.0, color: "#ffeb3b", label: "SUPER" }
      ],
      rollovers: [
        { x: 120, y: 100, width: 22, height: 18, points: 200, active: false, label: "R" },
        { x: 165, y: 88, width: 22, height: 18, points: 200, active: false, label: "U" },
        { x: 215, y: 88, width: 22, height: 18, points: 200, active: false, label: "S" },
        { x: 260, y: 100, width: 22, height: 18, points: 200, active: false, label: "H" }
      ],
      // 전통 핀볼 크롬 와이어 램프 레일 (시각 렌더링용)
      wireRamps: [
        { startX: 60, startY: 340, cp1X: 45, cp1Y: 150, cp2X: 280, cp2Y: 120, endX: 305, endY: 350 }
      ],
      hasBoss: false
    },

    SPACE: {
      id: "SPACE",
      name: "월드 2: 우주 (Cosmic Galaxy)",
      desc: "블랙홀 중력장, 워프게이트 및 레이저 범퍼가 펼쳐지는 은하계 탐험",
      bgGradient: ["#030511", "#09122c", "#050616"],
      accentColor: "#7928ca",
      secondaryColor: "#00dfd8",
      bumperColor: "#a855f7",
      wallColor: "#4f46e5",
      tableBorder: "#1e1b4b",
      chaserBulbs: generateChaserBulbs(),
      insertArrows: INSERT_ARROWS,
      bumpers: [
        { x: 130, y: 210, radius: 26, points: 600, kickPower: 12.5, color: "#00dfd8", label: "WARP" },
        { x: 250, y: 210, radius: 26, points: 600, kickPower: 12.5, color: "#7928ca", label: "WARP" },
        { x: 190, y: 285, radius: 30, points: 1500, kickPower: 14.5, color: "#ec4899", label: "NOVA" }
      ],
      blackhole: {
        x: 190, y: 150, radius: 28, gravityRadius: 85, pullForce: 0.42,
        active: true, spinTimer: 0, trappedBall: null
      },
      rollovers: [
        { x: 130, y: 95, width: 22, height: 18, points: 300, active: false, label: "★" },
        { x: 190, y: 85, width: 22, height: 18, points: 300, active: false, label: "★" },
        { x: 250, y: 95, width: 22, height: 18, points: 300, active: false, label: "★" }
      ],
      hasBoss: false
    },

    PIRATE: {
      id: "PIRATE",
      name: "월드 3: 해적 (Pirate Cove)",
      desc: "비밀 보물상자와 해적 대포, 거대 크라켄 촉수를 격파하는 해양 모험",
      bgGradient: ["#081214", "#0a2628", "#051318"],
      accentColor: "#f59e0b",
      secondaryColor: "#10b981",
      bumperColor: "#d97706",
      wallColor: "#059669",
      tableBorder: "#134e4a",
      chaserBulbs: generateChaserBulbs(),
      insertArrows: INSERT_ARROWS,
      bumpers: [
        { x: 135, y: 220, radius: 27, points: 700, kickPower: 12.5, color: "#f59e0b", label: "GOLD" },
        { x: 245, y: 220, radius: 27, points: 700, kickPower: 12.5, color: "#10b981", label: "GOLD" },
        { x: 190, y: 295, radius: 32, points: 2000, kickPower: 15.0, color: "#ef4444", label: "CHEST" }
      ],
      chests: [
        { x: 90, y: 120, width: 34, height: 26, hp: 3, maxHp: 3, points: 2000, opened: false },
        { x: 190, y: 100, width: 34, height: 26, hp: 3, maxHp: 3, points: 2000, opened: false },
        { x: 290, y: 120, width: 34, height: 26, hp: 3, maxHp: 3, points: 2000, opened: false }
      ],
      hasBoss: false
    },

    CYBER_CITY: {
      id: "CYBER_CITY",
      name: "월드 4: 사이버시티 (Cyber City)",
      desc: "도시를 장악한 거대 AI 코어 보스를 타격하여 처치하는 사이버 결전",
      bgGradient: ["#0e051a", "#1b0a33", "#090312"],
      accentColor: "#06b6d4",
      secondaryColor: "#f43f5e",
      bumperColor: "#8b5cf6",
      wallColor: "#d946ef",
      tableBorder: "#4a044e",
      chaserBulbs: generateChaserBulbs(),
      insertArrows: INSERT_ARROWS,
      bumpers: [
        { x: 125, y: 240, radius: 25, points: 800, kickPower: 12.5, color: "#06b6d4", label: "CORE" },
        { x: 255, y: 240, radius: 25, points: 800, kickPower: 12.5, color: "#f43f5e", label: "CORE" }
      ],
      hasBoss: true,
      boss: {
        name: "AI 코어: NEXUS-9",
        x: 190, y: 140, radius: 38,
        hp: 30, maxHp: 30,
        shieldAngle: 0,
        points: 50000,
        defeated: false
      }
    },

    FANTASY: {
      id: "FANTASY",
      name: "월드 5: 판타지 (Dragon Lair)",
      desc: "고대 드래곤의 화염 브레스와 마법진 포탈을 돌파하는 궁극의 던전",
      bgGradient: ["#140707", "#2e0f0f", "#120505"],
      accentColor: "#ef4444",
      secondaryColor: "#f97316",
      bumperColor: "#fbbf24",
      wallColor: "#b91c1c",
      tableBorder: "#450a0a",
      chaserBulbs: generateChaserBulbs(),
      insertArrows: INSERT_ARROWS,
      bumpers: [
        { x: 130, y: 240, radius: 26, points: 1000, kickPower: 13.0, color: "#f97316", label: "FIRE" },
        { x: 250, y: 240, radius: 26, points: 1000, kickPower: 13.0, color: "#ef4444", label: "FIRE" },
        { x: 190, y: 315, radius: 30, points: 2000, kickPower: 15.0, color: "#fbbf24", label: "DRAGON" }
      ],
      hasBoss: true,
      boss: {
        name: "화룡 이그니스 (Ignis)",
        x: 190, y: 145, radius: 42,
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
