/**
 * Pinball Rush (핀볼 러시) - 캔버스 고해상도 네온 렌더러 (mapRenderer.js)
 * 모바일 레티나 DPR 최적화, 네온 글로우, 충돌 파티클 스파크,
 * 플리퍼/범퍼/특수 오브젝트 및 플로팅 스코어 텍스트 시각화
 */

const MapRenderer = (() => {
  let canvas = null;
  let ctx = null;
  let dpr = 1;

  // 파티클 및 플로팅 텍스트 풀
  const particles = [];
  const floatingTexts = [];

  // 가상 게임 보드 표준 해상도 (9:16 모바일 최적화)
  const V_WIDTH = 380;
  const V_HEIGHT = 680;

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
  }

  function resize() {
    if (!canvas) return;
    dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
  }

  // 충돌 파티클 스파크 방출
  function emitSparks(x, y, color = "#00f0ff", count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.5 + Math.random() * 2.5,
        color,
        life: 1.0,
        decay: 0.035 + Math.random() * 0.025
      });
    }
  }

  // 부동 점수 텍스트 팝업 ("+500", "JACKPOT!", "COMBO x3")
  function addFloatingText(x, y, text, color = "#ffffff", size = 16) {
    floatingTexts.push({
      x, y,
      text,
      color,
      size,
      vy: -1.4,
      life: 1.0,
      decay: 0.025
    });
  }

  // 전체 프레임 렌더링
  function render(gameState) {
    if (!ctx || !canvas) return;

    const w = canvas.width;
    const h = canvas.height;
    const scaleX = w / V_WIDTH;
    const scaleY = h / V_HEIGHT;

    ctx.save();
    ctx.scale(scaleX, scaleY);

    // 1. 테마 배경 렌더링
    const theme = gameState.theme;
    const grad = ctx.createLinearGradient(0, 0, 0, V_HEIGHT);
    grad.addColorStop(0, theme.bgGradient[0]);
    grad.addColorStop(0.5, theme.bgGradient[1]);
    grad.addColorStop(1, theme.bgGradient[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

    // 은은한 배경 사이버 그리드 패턴
    renderGrid(theme);

    // 2. 외곽 벽면 및 가이드 레일 렌더링
    renderWalls(gameState, theme);

    // 3. 테마 특수 오브젝트 렌더링 (블랙홀, 워프게이트, 보스, 보물상자 등)
    renderThemeSpecialObjects(gameState, theme);

    // 4. 범퍼 및 슬링샷 렌더링
    renderBumpers(gameState, theme);
    renderSlingshots(gameState, theme);
    renderRollovers(gameState, theme);

    // 5. 하단 세이프 실드 (스킬 발동 시)
    if (gameState.shieldActive) {
      ctx.save();
      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 6;
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(140, 630);
      ctx.lineTo(240, 630);
      ctx.stroke();
      ctx.restore();
    }

    // 6. 플리퍼 렌더링
    renderFlipper(gameState.leftFlipper, theme.accentColor);
    renderFlipper(gameState.rightFlipper, theme.secondaryColor);

    // 7. 플런저 (발사 스프링)
    renderPlunger(gameState.plunger);

    // 8. 핀볼 공들 렌더링 (멀티볼 포함)
    gameState.balls.forEach(b => {
      if (b.active) renderBall(b, theme);
    });

    // 9. 파티클 스파크 업데이트 및 렌더링
    renderParticles();

    // 10. 플로팅 스코어 텍스트
    renderFloatingTexts();

    ctx.restore();
  }

  // 배경 네온 그리드
  function renderGrid(theme) {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
    ctx.lineWidth = 1;
    const step = 30;
    for (let x = 0; x <= V_WIDTH; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, V_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= V_HEIGHT; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(V_WIDTH, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 벽면 & 곡선 가이드 레일
  function renderWalls(gameState, theme) {
    ctx.save();
    ctx.strokeStyle = theme.wallColor;
    ctx.lineWidth = 4;
    ctx.shadowColor = theme.wallColor;
    ctx.shadowBlur = 8;
    ctx.lineCap = "round";

    // 좌측 상단 곡면 벽
    ctx.beginPath();
    ctx.moveTo(35, 120);
    ctx.quadraticCurveTo(35, 20, 190, 20);
    ctx.quadraticCurveTo(345, 20, 345, 120);
    ctx.stroke();

    // 우측 발사 레인 분리벽 (Plunger Lane)
    ctx.beginPath();
    ctx.moveTo(345, 120);
    ctx.lineTo(345, 600);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(375, 120);
    ctx.lineTo(375, 660);
    ctx.stroke();

    // 좌측 외곽벽
    ctx.beginPath();
    ctx.moveTo(35, 120);
    ctx.lineTo(35, 450);
    ctx.lineTo(100, 530);
    ctx.stroke();

    // 우측 외곽벽 (발사대 안쪽)
    ctx.beginPath();
    ctx.moveTo(315, 150);
    ctx.lineTo(315, 450);
    ctx.lineTo(280, 530);
    ctx.stroke();

    // 하단 드레인 가이드 경사벽
    ctx.beginPath();
    ctx.moveTo(100, 530);
    ctx.lineTo(135, 570);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(280, 530);
    ctx.lineTo(245, 570);
    ctx.stroke();

    ctx.restore();
  }

  // 플리퍼 렌더링
  function renderFlipper(flipper, color) {
    if (!flipper) return;
    ctx.save();
    ctx.translate(flipper.pivotX, flipper.pivotY);
    ctx.rotate(flipper.angle);

    // 플리퍼 몸체 (네온 라운드 사다리꼴)
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.arc(0, 0, flipper.radius, Math.PI * 0.5, Math.PI * 1.5);
    ctx.lineTo(flipper.length, -flipper.radius * 0.6);
    ctx.arc(flipper.length, 0, flipper.radius * 0.6, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.lineTo(0, flipper.radius);
    ctx.closePath();
    ctx.fill();

    // 힌지 축 볼트 캡
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(0, 0, flipper.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 범퍼 렌더링
  function renderBumpers(gameState, theme) {
    const bumpers = gameState.theme.bumpers || [];
    bumpers.forEach(b => {
      ctx.save();
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 16;

      // 외곽 링
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.stroke();

      // 내부 코어 그라디언트
      const grad = ctx.createRadialGradient(b.x, b.y, 2, b.x, b.y, b.radius);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.4, b.color);
      grad.addColorStop(1, "rgba(0,0,0,0.6)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 0.78, 0, Math.PI * 2);
      ctx.fill();

      // 점수 표기 텍스트
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowBlur = 0;
      ctx.fillText(b.points, b.x, b.y);

      ctx.restore();
    });
  }

  // 슬링샷 삼각형 렌더링
  function renderSlingshots(gameState, theme) {
    const slings = gameState.slingshots || [];
    slings.forEach(s => {
      ctx.save();
      ctx.strokeStyle = theme.accentColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = theme.accentColor;
      ctx.shadowBlur = 10;
      ctx.fillStyle = "rgba(0, 240, 255, 0.12)";

      ctx.beginPath();
      ctx.moveTo(s.p1.x, s.p1.y);
      ctx.lineTo(s.p2.x, s.p2.y);
      ctx.lineTo(s.p3.x, s.p3.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    });
  }

  // 롤오버 레인
  function renderRollovers(gameState, theme) {
    const rollovers = gameState.theme.rollovers || [];
    rollovers.forEach(r => {
      ctx.save();
      const col = r.active ? "#ffeb3b" : "rgba(255,255,255,0.3)";
      ctx.strokeStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = r.active ? 12 : 2;
      ctx.lineWidth = 2;

      ctx.strokeRect(r.x - r.width / 2, r.y - r.height / 2, r.width, r.height);
      ctx.fillStyle = col;
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(r.label || "★", r.x, r.y);

      ctx.restore();
    });
  }

  // 플런저 스프링
  function renderPlunger(plunger) {
    if (!plunger) return;
    ctx.save();
    const px = 360;
    const py = 640;
    const pullDist = plunger.pullRatio * 38; // 0 ~ 38px 압축

    // 스프링 지지대
    ctx.strokeStyle = "#888888";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px - 10, py);
    ctx.lineTo(px + 10, py);
    ctx.stroke();

    // 코일 스프링
    ctx.strokeStyle = "#00f0ff";
    ctx.shadowColor = "#00f0ff";
    ctx.shadowBlur = 6;
    ctx.lineWidth = 3;

    ctx.beginPath();
    const coils = 6;
    const coilHeight = (40 - pullDist) / coils;
    let currY = py + 10;
    ctx.moveTo(px, currY);
    for (let i = 0; i < coils; i++) {
      ctx.lineTo(px + (i % 2 === 0 ? 8 : -8), currY + coilHeight * 0.5);
      currY += coilHeight;
      ctx.lineTo(px, currY);
    }
    ctx.stroke();

    // 팁 손잡이
    ctx.fillStyle = "#ff0077";
    ctx.shadowColor = "#ff0077";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(px, py - 8 + pullDist, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 핀볼 공 렌더링
  function renderBall(ball, theme) {
    ctx.save();

    // 1. 잔상 궤적 (Motion Blur Trail)
    if (ball.trail && ball.trail.length > 0) {
      for (let i = 0; i < ball.trail.length; i++) {
        const tr = ball.trail[i];
        ctx.fillStyle = ball.type === "GOLD" ? `rgba(255, 215, 0, ${tr.alpha * 0.4})` : `rgba(0, 240, 255, ${tr.alpha * 0.4})`;
        ctx.beginPath();
        ctx.arc(tr.x, tr.y, ball.radius * (0.5 + 0.5 * (i / ball.trail.length)), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2. 공 본체 (금속 광택 구체 그라디언트)
    ctx.shadowColor = ball.type === "GOLD" ? "#ffd700" : (ball.type === "BOMB" ? "#ff0055" : "#00f0ff");
    ctx.shadowBlur = 10;

    const grad = ctx.createRadialGradient(
      ball.x - ball.radius * 0.35, ball.y - ball.radius * 0.35, 1,
      ball.x, ball.y, ball.radius
    );

    if (ball.type === "GOLD") {
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.3, "#fff3a8");
      grad.addColorStop(0.8, "#f59e0b");
      grad.addColorStop(1, "#b45309");
    } else if (ball.type === "BOMB") {
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.3, "#f43f5e");
      grad.addColorStop(0.8, "#be123c");
      grad.addColorStop(1, "#4c0519");
    } else {
      // 일반 크롬 볼
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.2, "#e2e8f0");
      grad.addColorStop(0.7, "#94a3b8");
      grad.addColorStop(1, "#334155");
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 테마 특수 오브젝트 (블랙홀, 보스, 보물상자 등)
  function renderThemeSpecialObjects(gameState, theme) {
    // 1. 우주 블랙홀
    if (theme.blackhole && theme.blackhole.active) {
      const bh = theme.blackhole;
      ctx.save();
      ctx.translate(bh.x, bh.y);
      bh.spinTimer = (bh.spinTimer || 0) + 0.04;
      ctx.rotate(bh.spinTimer);

      // 나선 소용돌이
      ctx.strokeStyle = "rgba(168, 85, 247, 0.45)";
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, bh.radius * (0.4 + i * 0.22), i, i + Math.PI * 1.2);
        ctx.stroke();
      }

      // 블랙홀 코어
      ctx.fillStyle = "#000000";
      ctx.shadowColor = "#a855f7";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 0, bh.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 2. 사이버시티 / 판타지 보스
    if (theme.hasBoss && theme.boss && !theme.boss.defeated) {
      const boss = theme.boss;
      ctx.save();
      ctx.shadowColor = theme.secondaryColor;
      ctx.shadowBlur = 20;

      // 보스 코어 본체
      ctx.fillStyle = theme.secondaryColor;
      ctx.beginPath();
      ctx.arc(boss.x, boss.y, boss.radius, 0, Math.PI * 2);
      ctx.fill();

      // 보스 심볼
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowBlur = 0;
      ctx.fillText(theme.id === "FANTASY" ? "🐲" : "🤖", boss.x, boss.y - 2);

      // 보스 HP 바
      const barW = 80;
      const barH = 7;
      const hpRatio = Math.max(0, boss.hp / boss.maxHp);
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(boss.x - barW / 2, boss.y + boss.radius + 6, barW, barH);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(boss.x - barW / 2, boss.y + boss.radius + 6, barW * hpRatio, barH);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.strokeRect(boss.x - barW / 2, boss.y + boss.radius + 6, barW, barH);

      ctx.restore();
    }

    // 3. 해적 보물상자
    if (theme.chests) {
      theme.chests.forEach(c => {
        ctx.save();
        ctx.fillStyle = c.opened ? "#10b981" : "#f59e0b";
        ctx.strokeStyle = "#ffffff";
        ctx.shadowColor = c.opened ? "#10b981" : "#f59e0b";
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2;
        ctx.fillRect(c.x - c.width / 2, c.y - c.height / 2, c.width, c.height);
        ctx.strokeRect(c.x - c.width / 2, c.y - c.height / 2, c.width, c.height);

        ctx.fillStyle = "#000000";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(c.opened ? "★" : "📦", c.x, c.y);
        ctx.restore();
      });
    }
  }

  // 파티클 업데이트 & 렌더링
  function renderParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 플로팅 스코어 텍스트 업데이트 & 렌더링
  function renderFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y += ft.vy;
      ft.life -= ft.decay;

      if (ft.life <= 0) {
        floatingTexts.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.font = `800 ${ft.size}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  return {
    init,
    resize,
    render,
    emitSparks,
    addFloatingText,
    V_WIDTH,
    V_HEIGHT
  };
})();

if (typeof window !== "undefined") {
  window.MapRenderer = MapRenderer;
}
