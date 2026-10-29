/**
 * Pinball Rush (핀볼 러시) - 라스베가스 전통 핀볼 캔버스 렌더러 (mapRenderer.js)
 * 첨부 사진 기반: 상단 도트 전구 화면(DMD), 화려한 체이서 전구 불빛,
 * 플래시 램프, 바닥 화살표 인서트 조명, 3구 팝범퍼 및 크롬 와이어 램프 렌더링
 */

const MapRenderer = (() => {
  let canvas = null;
  let ctx = null;
  let dpr = 1;

  // 파티클 및 플로팅 텍스트 풀
  const particles = [];
  const floatingTexts = [];

  // 전구 애니메이션 타이머
  let chaserStep = 0;
  let flashIntensity = 0; // 범퍼 타격 시 순간 플래시 밝기 (0 ~ 1)
  let dmdScrollX = 0;

  // 가상 해상도 (9:16)
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
  function emitSparks(x, y, color = "#ffeb3b", count = 14) {
    flashIntensity = 1.0; // 충돌 시 전구 플래시 트리거
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.8 + Math.random() * 5.0;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.5 + Math.random() * 2.8,
        color,
        life: 1.0,
        decay: 0.035 + Math.random() * 0.03
      });
    }
  }

  // 부동 점수 텍스트
  function addFloatingText(x, y, text, color = "#ffffff", size = 16) {
    floatingTexts.push({
      x, y,
      text,
      color,
      size,
      vy: -1.3,
      life: 1.0,
      decay: 0.024
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

    chaserStep += 0.22; // 전구 회전 속도
    if (flashIntensity > 0) flashIntensity = Math.max(0, flashIntensity - 0.06);

    const theme = gameState.theme;

    // 1. 라스베가스 캐비닛 원근감 배경 렌더링
    renderCabinetBackground(theme);

    // 2. 바닥 화살표 인서트 조명 (Insert Arrows)
    renderInsertArrows(theme);

    // 3. 외곽 크롬 레일 및 벽면
    renderWalls(gameState, theme);

    // 4. 크롬 와이어 램프 레일 (첨부 사진 스타일)
    renderWireRamps(theme);

    // 5. 화려한 체이서 전구 불빛 (Las Vegas Running Chaser Bulbs)
    renderChaserBulbs(theme);

    // 6. 3구 팝 범퍼 & 슬링샷 렌더링
    renderBumpers(gameState, theme);
    renderSlingshots(gameState, theme);
    renderRollovers(gameState, theme);

    // 7. 하단 세이프 실드 (스킬 발동 시)
    if (gameState.shieldActive) {
      ctx.save();
      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 6;
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(140, 630);
      ctx.lineTo(240, 630);
      ctx.stroke();
      ctx.restore();
    }

    // 8. 플리퍼 렌더링
    renderFlipper(gameState.leftFlipper, "#ffffff", "#ff0055");
    renderFlipper(gameState.rightFlipper, "#ffffff", "#00f0ff");

    // 9. 플런저 (발사 스프링)
    renderPlunger(gameState.plunger);

    // 10. 공들 렌더링 (크롬 광택 구체)
    gameState.balls.forEach(b => {
      if (b.active) renderBall(b, theme);
    });

    // 11. 파티클 스파크 및 플로팅 텍스트
    renderParticles();
    renderFloatingTexts();

    // 12. 상단 도트 매트릭스 전구 스크린 (DMD 디스플레이)
    renderDMDDisplay(gameState);

    ctx.restore();
  }

  // 1. 캐비닛 배경 (원근감 딥 카지노 우드 & 메탈 프레임)
  function renderCabinetBackground(theme) {
    // 딥 그라디언트 테이블 매트
    const grad = ctx.createLinearGradient(0, 0, 0, V_HEIGHT);
    grad.addColorStop(0, theme.bgGradient[0]);
    grad.addColorStop(0.5, theme.bgGradient[1]);
    grad.addColorStop(1, theme.bgGradient[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

    // 플래시 효과 발동 시 은은한 전체 발광
    if (flashIntensity > 0) {
      ctx.fillStyle = `rgba(255, 235, 59, ${flashIntensity * 0.12})`;
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
    }

    // 캐비닛 양쪽 사이드 크롬 몰딩 (첨부 사진의 은색 메탈 몰딩)
    ctx.fillStyle = "linear-gradient(to right, #444, #bbb, #333)";
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fillRect(0, 0, 18, V_HEIGHT);
    ctx.fillRect(V_WIDTH - 18, 0, 18, V_HEIGHT);
  }

  // 2. 바닥 화살표 인서트 조명 (Insert Arrows)
  function renderInsertArrows(theme) {
    const arrows = theme.insertArrows || [];
    const stepIdx = Math.floor(chaserStep * 2) % 6;

    arrows.forEach((arr, idx) => {
      const isLit = (idx === stepIdx) || (flashIntensity > 0.3);
      ctx.save();
      ctx.translate(arr.x, arr.y);

      const col = isLit ? arr.color : "rgba(255, 255, 255, 0.12)";
      ctx.fillStyle = col;
      ctx.strokeStyle = isLit ? "#ffffff" : "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1.5;

      if (isLit) {
        ctx.shadowColor = arr.color;
        ctx.shadowBlur = 14;
      }

      // 화살표 형태
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(10, 8);
      ctx.lineTo(4, 8);
      ctx.lineTo(4, 16);
      ctx.lineTo(-4, 16);
      ctx.lineTo(-4, 8);
      ctx.lineTo(-10, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 화살표 텍스트 라벨
      ctx.fillStyle = isLit ? "#ffffff" : "rgba(255,255,255,0.4)";
      ctx.font = "800 8px sans-serif";
      ctx.textAlign = "center";
      ctx.shadowBlur = 0;
      ctx.fillText(arr.label, 0, 26);

      ctx.restore();
    });
  }

  // 3. 화려한 체이서 전구 불빛 (Running Chaser Bulbs)
  function renderChaserBulbs(theme) {
    const bulbs = theme.chaserBulbs || [];
    const activeIndex = Math.floor(chaserStep) % bulbs.length;

    bulbs.forEach((bulb, idx) => {
      // 순차적으로 밝아지는 시퀀스 및 플래시 연동
      const distFromHead = Math.abs(idx - activeIndex);
      const isLit = (distFromHead <= 2) || (distFromHead >= bulbs.length - 2) || (flashIntensity > 0.2);

      ctx.save();
      const bulbColor = bulb.color;

      // 전구 베이스 소켓
      ctx.fillStyle = "#222222";
      ctx.beginPath();
      ctx.arc(bulb.x, bulb.y, bulb.radius + 1.2, 0, Math.PI * 2);
      ctx.fill();

      // 전구 본체 및 발광
      if (isLit) {
        ctx.shadowColor = bulbColor;
        ctx.shadowBlur = 15 + flashIntensity * 12;
        ctx.fillStyle = "#ffffff";
      } else {
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      }

      ctx.beginPath();
      ctx.arc(bulb.x, bulb.y, bulb.radius, 0, Math.PI * 2);
      ctx.fill();

      if (isLit) {
        ctx.strokeStyle = bulbColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.restore();
    });
  }

  // 4. 크롬 와이어 램프 (Wire Ramps)
  function renderWireRamps(theme) {
    const ramps = theme.wireRamps || [];
    ramps.forEach(r => {
      ctx.save();
      ctx.strokeStyle = "rgba(220, 230, 245, 0.45)";
      ctx.lineWidth = 3;
      ctx.shadowColor = "rgba(255, 255, 255, 0.3)";
      ctx.shadowBlur = 4;

      // 트윈 와이어 레일 2가닥
      [-2.5, 2.5].forEach(offset => {
        ctx.beginPath();
        ctx.moveTo(r.startX + offset, r.startY);
        ctx.bezierCurveTo(r.cp1X + offset, r.cp1Y, r.cp2X + offset, r.cp2Y, r.endX + offset, r.endY);
        ctx.stroke();
      });

      ctx.restore();
    });
  }

  // 5. 상단 도트 매트릭스 전구 스크린 (DMD: Dot Matrix Display)
  function renderDMDDisplay(gameState) {
    ctx.save();

    // DMD 전광판 케이스 프레임 (상단 중앙)
    const dmdX = 55;
    const dmdY = 16;
    const dmdW = 270;
    const dmdH = 46;

    ctx.fillStyle = "#0a0604";
    ctx.strokeStyle = "#443022";
    ctx.lineWidth = 3;
    ctx.strokeRect(dmdX, dmdY, dmdW, dmdH);
    ctx.fillRect(dmdX, dmdY, dmdW, dmdH);

    // 내부 전구 도트 그리드 배경
    ctx.fillStyle = "rgba(35, 18, 5, 0.7)";
    ctx.fillRect(dmdX + 2, dmdY + 2, dmdW - 4, dmdH - 4);

    // 오렌지빛 도트 전구 LED 텍스트 연출
    ctx.shadowColor = "#ff7700";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#ffaa00";
    ctx.font = "900 15px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const scoreStr = gameState.score.toLocaleString();
    const comboText = gameState.combo > 1 ? ` · COMBO x${gameState.combo}` : "";
    const displayText = `★ ${scoreStr} PTS${comboText} ★`;

    ctx.fillText(displayText, dmdX + dmdW / 2, dmdY + 18);

    // 하단 보조 텍스트 ("AUTO FIRE", "JACKPOT READY", "BONUS x2")
    ctx.fillStyle = "#ff5500";
    ctx.font = "800 10px monospace";
    ctx.shadowBlur = 6;
    const subText = gameState.shieldActive ? "▶ SHIELD ACTIVE ◀" : (gameState.combo > 2 ? "⚡ SUPER COMBO ACTIVE ⚡" : "★ PINBALL RUSH LAS VEGAS ★");
    ctx.fillText(subText, dmdX + dmdW / 2, dmdY + 34);

    ctx.restore();
  }

  // 외곽 벽면 & 레일
  function renderWalls(gameState, theme) {
    ctx.save();
    ctx.strokeStyle = theme.wallColor;
    ctx.lineWidth = 4;
    ctx.shadowColor = theme.wallColor;
    ctx.shadowBlur = 10 + flashIntensity * 8;
    ctx.lineCap = "round";

    // 상단 아치 곡면
    ctx.beginPath();
    ctx.moveTo(35, 140);
    ctx.quadraticCurveTo(35, 65, 190, 65);
    ctx.quadraticCurveTo(345, 65, 345, 140);
    ctx.stroke();

    // 우측 발사 레인 분리벽
    ctx.beginPath();
    ctx.moveTo(345, 140);
    ctx.lineTo(345, 600);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(375, 140);
    ctx.lineTo(375, 660);
    ctx.stroke();

    // 좌측 외곽벽
    ctx.beginPath();
    ctx.moveTo(35, 140);
    ctx.lineTo(35, 450);
    ctx.lineTo(100, 530);
    ctx.stroke();

    // 우측 외곽벽
    ctx.beginPath();
    ctx.moveTo(315, 160);
    ctx.lineTo(315, 450);
    ctx.lineTo(280, 530);
    ctx.stroke();

    // 하단 드레인 경사벽
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

  // 3구 클래식 팝 범퍼 (Pop Bumpers) 렌더링
  function renderBumpers(gameState, theme) {
    const bumpers = theme.bumpers || [];
    bumpers.forEach(b => {
      ctx.save();
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 18 + flashIntensity * 15;

      // 외곽 크롬 링
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.stroke();

      // 내부 전구 조명 코어 그라디언트
      const grad = ctx.createRadialGradient(b.x, b.y, 2, b.x, b.y, b.radius);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.35, b.color);
      grad.addColorStop(0.85, "rgba(0,0,0,0.7)");
      grad.addColorStop(1, b.color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 0.85, 0, Math.PI * 2);
      ctx.fill();

      // 점수 라벨
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowBlur = 2;
      ctx.fillText(b.label || b.points, b.x, b.y);

      ctx.restore();
    });
  }

  // 슬링샷
  function renderSlingshots(gameState, theme) {
    const slings = gameState.slingshots || [];
    slings.forEach(s => {
      ctx.save();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.shadowColor = theme.accentColor;
      ctx.shadowBlur = 12 + flashIntensity * 10;
      ctx.fillStyle = "rgba(255, 0, 119, 0.18)";

      ctx.beginPath();
      ctx.moveTo(s.p1.x, s.p1.y);
      ctx.lineTo(s.p2.x, s.p2.y);
      ctx.lineTo(s.p3.x, s.p3.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 고무 밴드 앵커 핀
      ctx.fillStyle = "#ffeb3b";
      [s.p1, s.p2, s.p3].forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    });
  }

  // 롤오버
  function renderRollovers(gameState, theme) {
    const rollovers = theme.rollovers || [];
    rollovers.forEach(r => {
      ctx.save();
      const col = r.active ? "#ffeb3b" : "rgba(255,255,255,0.35)";
      ctx.strokeStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = r.active ? 15 : 2;
      ctx.lineWidth = 2.2;

      ctx.strokeRect(r.x - r.width / 2, r.y - r.height / 2, r.width, r.height);
      ctx.fillStyle = col;
      ctx.font = "900 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(r.label || "★", r.x, r.y);

      ctx.restore();
    });
  }

  // 플리퍼
  function renderFlipper(flipper, bodyColor, tipColor) {
    if (!flipper) return;
    ctx.save();
    ctx.translate(flipper.pivotX, flipper.pivotY);
    ctx.rotate(flipper.angle);

    ctx.shadowColor = tipColor;
    ctx.shadowBlur = 12;

    // 플리퍼 화이트 바디 + 팁 포인트
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, 0, flipper.radius, Math.PI * 0.5, Math.PI * 1.5);
    ctx.lineTo(flipper.length, -flipper.radius * 0.55);
    ctx.arc(flipper.length, 0, flipper.radius * 0.55, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.lineTo(0, flipper.radius);
    ctx.closePath();
    ctx.fill();

    // 팁 고무 캡
    ctx.fillStyle = tipColor;
    ctx.beginPath();
    ctx.arc(flipper.length, 0, flipper.radius * 0.55, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.fill();

    // 힌지 축 볼트
    ctx.fillStyle = "#333333";
    ctx.beginPath();
    ctx.arc(0, 0, flipper.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 플런저
  function renderPlunger(plunger) {
    if (!plunger) return;
    ctx.save();
    const px = 360;
    const py = 640;
    const pullDist = plunger.pullRatio * 38;

    ctx.strokeStyle = "#ff7700";
    ctx.shadowColor = "#ff7700";
    ctx.shadowBlur = 8;
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

    ctx.fillStyle = "#ff0055";
    ctx.shadowColor = "#ff0055";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(px, py - 8 + pullDist, 7.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 크롬 볼 렌더링
  function renderBall(ball, theme) {
    ctx.save();

    // 궤적
    if (ball.trail && ball.trail.length > 0) {
      for (let i = 0; i < ball.trail.length; i++) {
        const tr = ball.trail[i];
        ctx.fillStyle = `rgba(255, 235, 59, ${tr.alpha * 0.45})`;
        ctx.beginPath();
        ctx.arc(tr.x, tr.y, ball.radius * (0.5 + 0.5 * (i / ball.trail.length)), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 12;

    const grad = ctx.createRadialGradient(
      ball.x - ball.radius * 0.35, ball.y - ball.radius * 0.35, 1,
      ball.x, ball.y, ball.radius
    );
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.2, "#f1f5f9");
    grad.addColorStop(0.7, "#94a3b8");
    grad.addColorStop(1, "#1e293b");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 파티클
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
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 플로팅 텍스트
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
      ctx.font = `900 ${ft.size}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 10;
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
