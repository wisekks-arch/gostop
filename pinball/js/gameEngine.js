/**
 * Pinball Rush (핀볼 러시) - 메인 게임 라이프사이클 & RPG 성장 엔진 (gameEngine.js)
 * 클래식/스테이지/무한 모드, 콤보 연쇄, 보스 배틀, 레벨업 및 재화 관리
 */

const GameEngine = (() => {
  const STORAGE_KEY = "pinball_rush_save_v1";

  // 기본 사용자 성장 프로필
  const defaultProfile = {
    level: 1,
    exp: 0,
    gold: 1500,
    diamonds: 50,
    highScore: 0,
    unlockedThemes: ["CLASSIC", "SPACE"],
    currentTheme: "CLASSIC",
    currentMode: "CLASSIC", // CLASSIC, STAGE, ENDLESS
    currentStage: 1,
    upgrades: {
      power: 1,       // 타격 공격력 (보스 데미지 배율)
      comboMax: 5,    // 최대 콤보 배수
      bonusRate: 1    // 보너스 드롭률
    }
  };

  let profile = { ...defaultProfile };

  // 인게임 실행 상태
  let gameState = {
    isRunning: false,
    isPaused: false,
    score: 0,
    combo: 1,
    comboTimer: 0,
    ballsLeft: 3,
    balls: [],
    theme: null,
    leftFlipper: null,
    rightFlipper: null,
    plunger: { pullRatio: 0, isPulling: false },
    slingshots: [],
    shieldActive: false,
    missionCleared: false,
    gameOver: false
  };

  // 프로필 저장/불러오기
  function loadProfile() {
    try {
      if (typeof localStorage !== "undefined") {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          profile = { ...defaultProfile, ...JSON.parse(saved) };
        }
      }
    } catch (e) {
      console.warn("프로필 로드 실패:", e);
    }
  }

  function saveProfile() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      }
    } catch (e) {
      console.error("프로필 저장 실패:", e);
    }
  }

  // 경험치 추가 및 레벨업 체크
  function addExp(amount) {
    profile.exp += amount;
    const expNeeded = profile.level * 1000;
    if (profile.exp >= expNeeded) {
      profile.exp -= expNeeded;
      profile.level++;
      profile.gold += profile.level * 500;
      profile.diamonds += 10;
      saveProfile();
      if (typeof MapRenderer !== "undefined") {
        MapRenderer.addFloatingText(190, 200, `LEVEL UP! Lv.${profile.level}`, "#ffeb3b", 22);
      }
      if (typeof AudioManager !== "undefined") {
        AudioManager.playJackpot();
      }
    }
  }

  // 게임 세션 시작
  function startGame(themeId = null, mode = "CLASSIC") {
    loadProfile();

    const selectedThemeId = themeId || profile.currentTheme || "CLASSIC";
    const theme = WorldThemes.getTheme(selectedThemeId);

    // 플리퍼 생성 (기준 좌표: 140, 580 및 240, 580)
    const leftFlipper = new PhysicsEngine.Flipper(138, 575, 48, true);
    const rightFlipper = new PhysicsEngine.Flipper(242, 575, 48, false);

    // 슬링샷 삼각형 범퍼 생성
    const slingshots = [
      {
        p1: { x: 95, y: 460 },
        p2: { x: 125, y: 535 },
        p3: { x: 95, y: 535 }
      },
      {
        p1: { x: 285, y: 460 },
        p2: { x: 255, y: 535 },
        p3: { x: 285, y: 535 }
      }
    ];

    const ballsLeft = mode === "ENDLESS" ? 1 : 3;

    gameState = {
      isRunning: true,
      isPaused: false,
      score: 0,
      combo: 1,
      comboTimer: 0,
      ballsLeft,
      balls: [],
      theme,
      mode,
      leftFlipper,
      rightFlipper,
      plunger: { pullRatio: 0, isPulling: false },
      slingshots,
      shieldActive: false,
      missionCleared: false,
      gameOver: false
    };

    SkillEngine.resetSkills();
    spawnBallInPlunger();

    return gameState;
  }

  // 발사대에 새 볼 준비
  function spawnBallInPlunger() {
    if (gameState.ballsLeft <= 0) {
      triggerGameOver();
      return;
    }

    const ball = new PhysicsEngine.Ball(360, 580, 9, "NORMAL");
    ball.inPlunger = true;
    ball.vx = 0;
    ball.vy = 0;
    gameState.balls = [ball];
  }

  // 플런저 당기기 / 발사
  function setPlungerPull(ratio) {
    if (!gameState.isRunning || gameState.isPaused) return;
    gameState.plunger.pullRatio = Math.max(0, Math.min(1.0, ratio));
    gameState.plunger.isPulling = true;
  }

  function releasePlunger() {
    if (!gameState.isRunning || gameState.isPaused) return;
    const ratio = gameState.plunger.pullRatio;
    gameState.plunger.isPulling = false;
    gameState.plunger.pullRatio = 0;

    const ballInPlunger = gameState.balls.find(b => b.inPlunger);
    if (ballInPlunger && ratio > 0.15) {
      ballInPlunger.inPlunger = false;
      // 발사 속도: 위로 14 ~ 22px/프레임
      const launchPower = 14 + ratio * 8.5;
      ballInPlunger.vy = -launchPower;
      ballInPlunger.vx = (Math.random() - 0.5) * 1.5;

      if (typeof AudioManager !== "undefined") {
        AudioManager.playPlungerLaunch(ratio);
      }
    }
  }

  // 플리퍼 터치 조작
  function setFlipper(isLeft, isPressed) {
    if (!gameState.isRunning || gameState.isPaused) return;
    const flipper = isLeft ? gameState.leftFlipper : gameState.rightFlipper;
    if (flipper) {
      flipper.isPressed = isPressed;
      if (isPressed && typeof AudioManager !== "undefined") {
        AudioManager.playFlipper(true);
      }
    }
  }

  // 점수 획득 및 콤보 계산
  function addScore(points, x = 190, y = 300) {
    let multiplier = gameState.combo;
    if (SkillEngine.isScoreBoostActive()) multiplier *= 2;

    const finalPoints = Math.round(points * multiplier * (1 + (profile.upgrades.power - 1) * 0.15));
    gameState.score += finalPoints;

    // 콤보 증가 및 타이머 갱신 (3초 지속)
    gameState.comboTimer = 3.2;
    if (gameState.combo < profile.upgrades.comboMax) {
      gameState.combo++;
    }

    if (typeof MapRenderer !== "undefined") {
      const col = multiplier > 1 ? "#ffeb3b" : "#ffffff";
      MapRenderer.addFloatingText(x, y, `+${finalPoints.toLocaleString()}`, col, multiplier > 1 ? 16 : 13);
    }

    // 최고 점수 갱신
    if (gameState.score > profile.highScore) {
      profile.highScore = gameState.score;
      saveProfile();
    }
  }

  // 메인 물리 & 게임 로직 업데이트 (매 프레임 호출)
  function update(dt = 0.016) {
    if (!gameState.isRunning || gameState.isPaused) return;

    // 스킬 엔진 업데이트 (타임 슬로우 감속 배율 반영)
    const timeScale = SkillEngine.update(dt, gameState);

    // 콤보 타이머 감쇠
    if (gameState.comboTimer > 0) {
      gameState.comboTimer -= dt;
      if (gameState.comboTimer <= 0) {
        gameState.combo = 1;
      }
    }

    // 플리퍼 물리 업데이트
    if (gameState.leftFlipper) gameState.leftFlipper.update();
    if (gameState.rightFlipper) gameState.rightFlipper.update();

    // 테마별 특수 오브젝트 업데이트 (우주 블랙홀, 보스 등)
    updateSpecialObjects(dt);

    // 공(Balls) 물리 시뮬레이션 및 충돌 감지
    for (let i = gameState.balls.length - 1; i >= 0; i--) {
      const ball = gameState.balls[i];
      if (!ball.active) continue;

      ball.update(timeScale);

      // 1. 외곽 벽면 충돌
      handleWallCollisions(ball);

      // 2. 플리퍼 충돌
      if (PhysicsEngine.checkFlipperBallCollision(gameState.leftFlipper, ball)) {
        if (typeof AudioManager !== "undefined") AudioManager.playFlipper(false);
      }
      if (PhysicsEngine.checkFlipperBallCollision(gameState.rightFlipper, ball)) {
        if (typeof AudioManager !== "undefined") AudioManager.playFlipper(false);
      }

      // 3. 범퍼 충돌
      const bumpers = gameState.theme.bumpers || [];
      bumpers.forEach(b => {
        if (PhysicsEngine.checkBumperCollision(b, ball)) {
          addScore(b.points, b.x, b.y);
          if (typeof AudioManager !== "undefined") AudioManager.playBumper(gameState.combo);
          if (typeof MapRenderer !== "undefined") MapRenderer.emitSparks(b.x, b.y, b.color, 14);
        }
      });

      // 4. 슬링샷 충돌
      const slings = gameState.slingshots || [];
      slings.forEach(s => {
        if (PhysicsEngine.checkSlingshotCollision(s, ball)) {
          addScore(300, ball.x, ball.y);
          if (typeof AudioManager !== "undefined") AudioManager.playSlingshot();
          if (typeof MapRenderer !== "undefined") MapRenderer.emitSparks(ball.x, ball.y, gameState.theme.accentColor, 10);
        }
      });

      // 5. 롤오버 통과 감지
      const rollovers = gameState.theme.rollovers || [];
      rollovers.forEach((r, idx) => {
        if (Math.abs(ball.x - r.x) < r.width * 0.6 && Math.abs(ball.y - r.y) < r.height * 0.6) {
          if (!r.active) {
            r.active = true;
            addScore(r.points, r.x, r.y);
            if (typeof AudioManager !== "undefined") AudioManager.playRollover(idx);

            // 모든 롤오버 활성화 시 잭팟 발동!
            if (rollovers.every(roll => roll.active)) {
              addScore(10000, 190, 100);
              if (typeof AudioManager !== "undefined") AudioManager.playJackpot();
              if (typeof MapRenderer !== "undefined") {
                MapRenderer.addFloatingText(190, 100, "★ JACKPOT BONUS! +10,000 ★", "#ffeb3b", 22);
                MapRenderer.emitSparks(190, 100, "#ffeb3b", 30);
              }
              // 리셋
              setTimeout(() => { rollovers.forEach(roll => roll.active = false); }, 1500);
            }
          }
        }
      });

      // 6. 하단 세이프 실드 충돌
      if (gameState.shieldActive) {
        if (PhysicsEngine.checkLineBallCollision(140, 630, 240, 630, ball, 0.95, 6.0)) {
          if (typeof AudioManager !== "undefined") AudioManager.playSlingshot();
        }
      }

      // 7. 하단 드레인 (볼 아웃 판정)
      if (ball.y > 670) {
        ball.active = false;
        gameState.balls.splice(i, 1);

        if (typeof AudioManager !== "undefined") {
          AudioManager.playDrain();
        }
      }
    }

    // 모든 공이 소진된 경우 (볼 감소 및 새 볼 장전 또는 게임오버)
    if (gameState.balls.length === 0) {
      gameState.ballsLeft--;
      if (gameState.ballsLeft > 0) {
        spawnBallInPlunger();
      } else {
        triggerGameOver();
      }
    }
  }

  // 테마 특수 오브젝트 상호작용
  function updateSpecialObjects(dt) {
    const theme = gameState.theme;
    if (!theme) return;

    // 1. 우주 블랙홀 인력
    if (theme.blackhole && theme.blackhole.active) {
      const bh = theme.blackhole;
      gameState.balls.forEach(ball => {
        if (!ball.active || ball.inPlunger) return;
        const d = PhysicsEngine.Vec2.dist(bh.x, bh.y, ball.x, ball.y);
        if (d < bh.gravityRadius && d > 4) {
          // 중심 방향 중력 가속도
          const pull = (1 - d / bh.gravityRadius) * bh.pullForce;
          const nx = (bh.x - ball.x) / d;
          const ny = (bh.y - ball.y) / d;
          ball.vx += nx * pull;
          ball.vy += ny * pull;

          // 코어 도달 시 튕겨내기
          if (d < bh.radius * 0.7) {
            ball.vx = (Math.random() - 0.5) * 16;
            ball.vy = -12;
            addScore(2500, bh.x, bh.y);
            if (typeof AudioManager !== "undefined") AudioManager.playBumper(5);
            if (typeof MapRenderer !== "undefined") MapRenderer.emitSparks(bh.x, bh.y, "#a855f7", 20);
          }
        }
      });
    }

    // 2. 보스전 타격 판정
    if (theme.hasBoss && theme.boss && !theme.boss.defeated) {
      const boss = theme.boss;
      gameState.balls.forEach(ball => {
        if (!ball.active || ball.inPlunger) return;
        if (PhysicsEngine.checkBumperCollision({ x: boss.x, y: boss.y, radius: boss.radius, kickPower: 12 }, ball)) {
          const dmg = profile.upgrades.power;
          boss.hp = Math.max(0, boss.hp - dmg);
          addScore(1500, boss.x, boss.y);
          if (typeof AudioManager !== "undefined") AudioManager.playBumper(4);
          if (typeof MapRenderer !== "undefined") MapRenderer.emitSparks(boss.x, boss.y, "#ef4444", 16);

          // 보스 처치
          if (boss.hp <= 0) {
            boss.defeated = true;
            addScore(boss.points, boss.x, boss.y);
            gameState.missionCleared = true;
            if (typeof AudioManager !== "undefined") AudioManager.playJackpot();
            if (typeof MapRenderer !== "undefined") {
              MapRenderer.addFloatingText(190, boss.y, `🏆 ${boss.name} 격파 성공! 🏆`, "#ffeb3b", 22);
              MapRenderer.emitSparks(boss.x, boss.y, "#ffeb3b", 40);
            }
          }
        }
      });
    }

    // 3. 해적 보물상자 타격
    if (theme.chests) {
      theme.chests.forEach(c => {
        if (!c.opened) {
          gameState.balls.forEach(ball => {
            if (!ball.active || ball.inPlunger) return;
            if (Math.abs(ball.x - c.x) < c.width * 0.6 && Math.abs(ball.y - c.y) < c.height * 0.6) {
              c.hp--;
              addScore(500, c.x, c.y);
              if (typeof AudioManager !== "undefined") AudioManager.playRollover();

              if (c.hp <= 0) {
                c.opened = true;
                addScore(c.points, c.x, c.y);
                profile.gold += 300;
                saveProfile();
                if (typeof AudioManager !== "undefined") AudioManager.playJackpot();
                if (typeof MapRenderer !== "undefined") {
                  MapRenderer.addFloatingText(c.x, c.y, "📦 보물상자 오픈! +300G", "#f59e0b", 16);
                  MapRenderer.emitSparks(c.x, c.y, "#f59e0b", 20);
                }
              }
            }
          });
        }
      });
    }
  }

  // 외곽 벽면 충돌 판정
  function handleWallCollisions(ball) {
    if (ball.inPlunger) return;

    // 상단 아치 벽면
    if (ball.y < 120) {
      const cx = 190;
      const cy = 120;
      const r = 155;
      const d = PhysicsEngine.Vec2.dist(cx, cy, ball.x, ball.y);
      if (d > r - ball.radius && ball.y < cy) {
        const nx = (cx - ball.x) / d;
        const ny = (cy - ball.y) / d;
        ball.x = cx - nx * (r - ball.radius);
        ball.y = cy - ny * (r - ball.radius);
        const vDotN = ball.vx * nx + ball.vy * ny;
        if (vDotN < 0) {
          ball.vx -= 1.65 * vDotN * nx;
          ball.vy -= 1.65 * vDotN * ny;
        }
      }
    }

    // 좌측 외곽 수직 벽
    PhysicsEngine.checkLineBallCollision(35, 120, 35, 450, ball, 0.7);
    PhysicsEngine.checkLineBallCollision(35, 450, 100, 530, ball, 0.7);
    PhysicsEngine.checkLineBallCollision(100, 530, 135, 570, ball, 0.7);

    // 우측 외곽 수직 벽 (발사대 분리벽)
    PhysicsEngine.checkLineBallCollision(315, 150, 315, 450, ball, 0.7);
    PhysicsEngine.checkLineBallCollision(315, 450, 280, 530, ball, 0.7);
    PhysicsEngine.checkLineBallCollision(280, 530, 245, 570, ball, 0.7);

    // 발사대 레인 오른쪽 바깥벽
    PhysicsEngine.checkLineBallCollision(375, 120, 375, 660, ball, 0.7);
    PhysicsEngine.checkLineBallCollision(345, 120, 345, 600, ball, 0.7);
  }

  // 게임 오버 처리 및 경험치/골드 결산
  function triggerGameOver() {
    gameState.isRunning = false;
    gameState.gameOver = true;

    // 보상 지급: 점수에 비례한 골드 및 경험치
    const earnedGold = Math.max(50, Math.floor(gameState.score / 250));
    const earnedExp = Math.max(100, Math.floor(gameState.score / 150));

    profile.gold += earnedGold;
    addExp(earnedExp);
    saveProfile();

    if (typeof window !== "undefined" && window.onGameOverCallback) {
      window.onGameOverCallback({
        score: gameState.score,
        highScore: profile.highScore,
        earnedGold,
        earnedExp,
        missionCleared: gameState.missionCleared
      });
    }
  }

  // 업그레이드 구매
  function buyUpgrade(type) {
    loadProfile();
    const costMap = {
      power: profile.upgrades.power * 800,
      comboMax: profile.upgrades.comboMax * 1200,
      bonusRate: profile.upgrades.bonusRate * 1000
    };

    const cost = costMap[type] || 999999;
    if (profile.gold >= cost) {
      profile.gold -= cost;
      profile.upgrades[type]++;
      saveProfile();
      return { success: true, newLevel: profile.upgrades[type], goldLeft: profile.gold };
    }
    return { success: false, reason: "골드가 부족합니다." };
  }

  loadProfile();

  return {
    startGame,
    update,
    setPlungerPull,
    releasePlunger,
    setFlipper,
    addScore,
    getGameState: () => gameState,
    getProfile: () => profile,
    buyUpgrade,
    loadProfile,
    saveProfile
  };
})();

if (typeof window !== "undefined") {
  window.GameEngine = GameEngine;
}
