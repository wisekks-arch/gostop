/**
 * Pinball Rush (핀볼 러시) - 스킬 및 아이템 파워업 엔진 (skillEngine.js)
 * 타임 슬로우, 멀티볼, 자석 플리퍼, 점수 부스트, 세이프 실드 및 특수 볼 관리
 */

const SkillEngine = (() => {
  // 스킬 정의 및 기본 쿨다운(초), 지속시간(초)
  const SKILL_DEFINITIONS = {
    TIME_SLOW: {
      id: "TIME_SLOW",
      name: "타임 슬로우",
      desc: "5초간 공의 속도를 35%로 감속하여 정밀 조준을 돕습니다.",
      icon: "⏱️",
      duration: 5.0,
      cooldown: 25.0,
      color: "#00f0ff"
    },
    MULTIBALL: {
      id: "MULTIBALL",
      name: "멀티볼",
      desc: "즉시 공 2개를 추가 소환하여 총 3개의 공으로 콤보를 극대화합니다.",
      icon: "🔮",
      duration: 0,
      cooldown: 35.0,
      color: "#a855f7"
    },
    MAGNET: {
      id: "MAGNET",
      name: "자석 플리퍼",
      desc: "8초간 플리퍼에 다가온 공을 일시 흡착하여 원하는 각도로 발사합니다.",
      icon: "🧲",
      duration: 8.0,
      cooldown: 28.0,
      color: "#ec4899"
    },
    SCORE_BOOST: {
      id: "SCORE_BOOST",
      name: "점수 2배 부스트",
      desc: "10초간 모든 타격 및 콤보 점수가 2배로 증폭됩니다.",
      icon: "⚡",
      duration: 10.0,
      cooldown: 30.0,
      color: "#fbbf24"
    },
    SHIELD: {
      id: "SHIELD",
      name: "세이프 실드",
      desc: "15초간 하단 드레인 홀에 에너지 배리어를 형성하여 추락을 막습니다.",
      icon: "🛡️",
      duration: 15.0,
      cooldown: 40.0,
      color: "#10b981"
    }
  };

  // 활성 스킬 상태
  const activeSkills = {
    TIME_SLOW: { active: false, timer: 0, cdTimer: 0 },
    MULTIBALL: { active: false, timer: 0, cdTimer: 0 },
    MAGNET: { active: false, timer: 0, cdTimer: 0 },
    SCORE_BOOST: { active: false, timer: 0, cdTimer: 0 },
    SHIELD: { active: false, timer: 0, cdTimer: 0 }
  };

  function update(dt, gameState) {
    let timeScale = 1.0;

    Object.keys(activeSkills).forEach(skillId => {
      const s = activeSkills[skillId];

      // 쿨다운 타이머 감소
      if (s.cdTimer > 0) {
        s.cdTimer = Math.max(0, s.cdTimer - dt);
      }

      // 지속 시간 타이머 감소
      if (s.active) {
        s.timer -= dt;
        if (s.timer <= 0) {
          deactivateSkill(skillId, gameState);
        }
      }
    });

    if (activeSkills.TIME_SLOW.active) {
      timeScale = 0.35;
    }

    return timeScale;
  }

  function canUseSkill(skillId) {
    const s = activeSkills[skillId];
    return s && !s.active && s.cdTimer <= 0;
  }

  function activateSkill(skillId, gameState) {
    const def = SKILL_DEFINITIONS[skillId];
    const s = activeSkills[skillId];
    if (!def || !s || !canUseSkill(skillId)) return false;

    s.active = true;
    s.timer = def.duration;
    s.cdTimer = def.cooldown;

    if (typeof AudioManager !== "undefined") {
      AudioManager.playSkill(skillId === "TIME_SLOW" ? "SLOW" : (skillId === "SHIELD" ? "SHIELD" : "BUFF"));
    }

    if (typeof MapRenderer !== "undefined") {
      MapRenderer.addFloatingText(190, 300, `★ ${def.name} 발동! ★`, def.color, 18);
      MapRenderer.emitSparks(190, 300, def.color, 25);
    }

    // 스킬별 즉시 효과 처리
    if (skillId === "MULTIBALL") {
      spawnExtraBalls(gameState);
      s.active = false; // 즉발형
      if (typeof AudioManager !== "undefined") {
        AudioManager.playMultiball();
      }
    } else if (skillId === "SHIELD") {
      gameState.shieldActive = true;
    }

    return true;
  }

  function deactivateSkill(skillId, gameState) {
    const s = activeSkills[skillId];
    if (!s) return;
    s.active = false;
    s.timer = 0;

    if (skillId === "SHIELD") {
      gameState.shieldActive = false;
    }
  }

  // 멀티볼 추가 생성
  function spawnExtraBalls(gameState) {
    if (!gameState || !gameState.balls) return;

    // 현재 살아있는 공의 위치 기준으로 좌우 2개 생성
    const mainBall = gameState.balls.find(b => b.active) || { x: 190, y: 350, vx: 0, vy: -5 };

    const ball1 = new PhysicsEngine.Ball(mainBall.x - 12, mainBall.y, 9, "GOLD");
    ball1.vx = -4.5 + Math.random() * 2;
    ball1.vy = -6.5;

    const ball2 = new PhysicsEngine.Ball(mainBall.x + 12, mainBall.y, 9, "GOLD");
    ball2.vx = 4.5 + Math.random() * 2;
    ball2.vy = -6.5;

    gameState.balls.push(ball1, ball2);
  }

  function getSkillStatus(skillId) {
    const def = SKILL_DEFINITIONS[skillId];
    const s = activeSkills[skillId];
    if (!def || !s) return null;

    return {
      ...def,
      active: s.active,
      remainingTime: Math.max(0, s.timer),
      cooldownRatio: s.cdTimer > 0 ? s.cdTimer / def.cooldown : 0
    };
  }

  function getAllSkillsStatus() {
    return Object.keys(SKILL_DEFINITIONS).map(id => getSkillStatus(id));
  }

  function resetSkills() {
    Object.keys(activeSkills).forEach(id => {
      activeSkills[id].active = false;
      activeSkills[id].timer = 0;
      activeSkills[id].cdTimer = 0;
    });
  }

  function isScoreBoostActive() {
    return activeSkills.SCORE_BOOST.active;
  }

  return {
    SKILL_DEFINITIONS,
    update,
    canUseSkill,
    activateSkill,
    getSkillStatus,
    getAllSkillsStatus,
    resetSkills,
    isScoreBoostActive
  };
})();

if (typeof window !== "undefined") {
  window.SkillEngine = SkillEngine;
}

