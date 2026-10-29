/**
 * Pinball Rush (핀볼 러시) - 메인 컨트롤러 및 이벤트 바인딩 (app.js)
 * 모바일 터치(좌/우 플리퍼, 롱프레스, 플런저 드래그, 스킬 스와이프),
 * 키보드 조작, 모달 UI 제어 및 메인 렌더 루프
 */

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("pinballCanvas");
  MapRenderer.init(canvas);

  // 상단 HUD 엘리먼트
  const elScore = document.getElementById("hudScore");
  const elCombo = document.getElementById("hudCombo");
  const elBalls = document.getElementById("hudBalls");
  const elThemeName = document.getElementById("hudThemeName");
  const elUserGold = document.getElementById("userGoldDisplay");
  const elUserLevel = document.getElementById("userLevelDisplay");

  // 모달 엘리먼트
  const modalLobby = document.getElementById("modalLobby");
  const modalStage = document.getElementById("modalStage");
  const modalShop = document.getElementById("modalShop");
  const modalRank = document.getElementById("modalRank");
  const modalGameOver = document.getElementById("modalGameOver");

  // 버튼 엘리먼트
  const btnStartGame = document.getElementById("btnStartGame");
  const btnOpenStage = document.getElementById("btnOpenStage");
  const btnOpenShop = document.getElementById("btnOpenShop");
  const btnOpenRank = document.getElementById("btnOpenRank");
  const btnSoundToggle = document.getElementById("btnSoundToggle");
  const btnRetry = document.getElementById("btnRetry");
  const btnLobbyReturn = document.getElementById("btnLobbyReturn");

  // 터치 조작 영역
  const touchLeftFlipper = document.getElementById("touchLeftFlipper");
  const touchRightFlipper = document.getElementById("touchRightFlipper");
  const plungerHandle = document.getElementById("plungerHandle");

  let lastTime = performance.now();

  // 1. 메인 렌더 루프 (requestAnimationFrame)
  function gameLoop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    const state = GameEngine.getGameState();

    if (state.isRunning && !state.isPaused) {
      GameEngine.update(dt);
      MapRenderer.render(state);
      updateHUD(state);
    }

    requestAnimationFrame(gameLoop);
  }

  // 2. 상단 HUD 업데이트
  function updateHUD(state) {
    if (elScore) elScore.textContent = state.score.toLocaleString();
    if (elCombo) {
      elCombo.textContent = `x${state.combo}`;
      elCombo.style.color = state.combo > 1 ? "#ffeb3b" : "#ffffff";
    }
    if (elBalls) {
      let ballsHtml = "";
      for (let i = 0; i < state.ballsLeft; i++) {
        ballsHtml += "● ";
      }
      elBalls.textContent = ballsHtml.trim();
    }
    if (elThemeName && state.theme) {
      elThemeName.textContent = state.theme.name.split(":")[0];
    }

    // 스킬 쿨다운 버튼 상태 갱신
    updateSkillButtons(state);
  }

  function updateSkillButtons(state) {
    const skills = SkillEngine.getAllSkillsStatus();
    skills.forEach(s => {
      const btn = document.querySelector(`.skill-btn[data-skill="${s.id}"]`);
      if (btn) {
        if (s.active) {
          btn.classList.add("active");
          btn.classList.remove("cooldown");
          btn.querySelector(".skill-label").textContent = `${Math.ceil(s.remainingTime)}s`;
        } else if (s.cooldownRatio > 0) {
          btn.classList.add("cooldown");
          btn.classList.remove("active");
          btn.querySelector(".skill-label").textContent = "쿨다운";
        } else {
          btn.classList.remove("active", "cooldown");
          btn.querySelector(".skill-label").textContent = s.name.split(" ")[0];
        }
      }
    });
  }

  // 3. 모바일 터치 플리퍼 바인딩 (좌측/우측 분할 터치 & 롱프레스 유지)
  function bindTouchFlipper(element, isLeft) {
    const onDown = (e) => {
      e.preventDefault();
      AudioManager.initAudio();
      GameEngine.setFlipper(isLeft, true);
    };

    const onUp = (e) => {
      e.preventDefault();
      GameEngine.setFlipper(isLeft, false);
    };

    element.addEventListener("touchstart", onDown, { passive: false });
    element.addEventListener("touchend", onUp, { passive: false });
    element.addEventListener("touchcancel", onUp, { passive: false });

    element.addEventListener("mousedown", onDown);
    element.addEventListener("mouseup", onUp);
    element.addEventListener("mouseleave", onUp);
  }

  if (touchLeftFlipper) bindTouchFlipper(touchLeftFlipper, true);
  if (touchRightFlipper) bindTouchFlipper(touchRightFlipper, false);

  // 4. 플런저 (발사대) 터치 드래그 & 릴리즈 바인딩
  if (plungerHandle) {
    let startY = 0;
    let isDragging = false;

    const onStart = (e) => {
      e.preventDefault();
      AudioManager.initAudio();
      isDragging = true;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      startY = clientY;
    };

    const onMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const deltaY = Math.max(0, clientY - startY);
      const ratio = Math.min(1.0, deltaY / 80); // 80px 드래그 시 최대 장전
      GameEngine.setPlungerPull(ratio);
      plungerHandle.style.transform = `translateY(${ratio * 35}px)`;
    };

    const onEnd = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      isDragging = false;
      GameEngine.releasePlunger();
      plungerHandle.style.transform = "translateY(0px)";
    };

    plungerHandle.addEventListener("touchstart", onStart, { passive: false });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd, { passive: false });

    plungerHandle.addEventListener("mousedown", onStart);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
  }

  // 5. 키보드 조작 지원 (PC 환경)
  window.addEventListener("keydown", (e) => {
    AudioManager.initAudio();
    if (e.repeat) return;

    if (e.code === "KeyA" || e.code === "ArrowLeft") {
      GameEngine.setFlipper(true, true);
    } else if (e.code === "KeyD" || e.code === "ArrowRight") {
      GameEngine.setFlipper(false, true);
    } else if (e.code === "Space" || e.code === "ArrowDown") {
      GameEngine.setPlungerPull(1.0);
    } else if (e.code === "Digit1") {
      SkillEngine.activateSkill("TIME_SLOW", GameEngine.getGameState());
    } else if (e.code === "Digit2") {
      SkillEngine.activateSkill("MULTIBALL", GameEngine.getGameState());
    } else if (e.code === "Digit3") {
      SkillEngine.activateSkill("MAGNET", GameEngine.getGameState());
    } else if (e.code === "Digit4") {
      SkillEngine.activateSkill("SCORE_BOOST", GameEngine.getGameState());
    } else if (e.code === "Digit5") {
      SkillEngine.activateSkill("SHIELD", GameEngine.getGameState());
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.code === "KeyA" || e.code === "ArrowLeft") {
      GameEngine.setFlipper(true, false);
    } else if (e.code === "KeyD" || e.code === "ArrowRight") {
      GameEngine.setFlipper(false, false);
    } else if (e.code === "Space" || e.code === "ArrowDown") {
      GameEngine.releasePlunger();
    }
  });

  // 6. 스킬 슬롯 버튼 클릭
  document.querySelectorAll(".skill-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      AudioManager.initAudio();
      const skillId = btn.getAttribute("data-skill");
      SkillEngine.activateSkill(skillId, GameEngine.getGameState());
    });
  });

  // 7. 사운드 온/오프 토글
  if (btnSoundToggle) {
    btnSoundToggle.addEventListener("click", () => {
      const muted = AudioManager.toggleMute();
      btnSoundToggle.textContent = muted ? "🔇" : "🔊";
    });
  }

  // 8. 모달 제어 및 로비/게임 시작
  function hideAllModals() {
    document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
  }

  function showModal(modalEl) {
    hideAllModals();
    if (modalEl) modalEl.classList.add("active");
  }

  function refreshUserProfileUI() {
    const p = GameEngine.getProfile();
    if (elUserGold) elUserGold.textContent = p.gold.toLocaleString();
    if (elUserLevel) elUserLevel.textContent = `Lv.${p.level}`;
  }

  // 게임 시작 버튼
  if (btnStartGame) {
    btnStartGame.addEventListener("click", () => {
      AudioManager.initAudio();
      hideAllModals();
      const p = GameEngine.getProfile();
      GameEngine.startGame(p.currentTheme, p.currentMode);
    });
  }

  // 스테이지 모달
  if (btnOpenStage) {
    btnOpenStage.addEventListener("click", () => {
      AudioManager.initAudio();
      renderStageList();
      showModal(modalStage);
    });
  }

  // 상점 모달
  if (btnOpenShop) {
    btnOpenShop.addEventListener("click", () => {
      AudioManager.initAudio();
      renderShopList();
      showModal(modalShop);
    });
  }

  // 랭킹 모달
  if (btnOpenRank) {
    btnOpenRank.addEventListener("click", () => {
      AudioManager.initAudio();
      renderRankList();
      showModal(modalRank);
    });
  }

  // 모달 닫기 버튼들
  document.querySelectorAll(".btn-close-modal").forEach(btn => {
    btn.addEventListener("click", () => {
      hideAllModals();
      showModal(modalLobby);
    });
  });

  // 게임 오버 콜백 연동
  window.onGameOverCallback = (result) => {
    const elFinalScore = document.getElementById("goFinalScore");
    const elHighScore = document.getElementById("goHighScore");
    const elEarnedGold = document.getElementById("goEarnedGold");
    const elEarnedExp = document.getElementById("goEarnedExp");

    if (elFinalScore) elFinalScore.textContent = result.score.toLocaleString();
    if (elHighScore) elHighScore.textContent = result.highScore.toLocaleString();
    if (elEarnedGold) elEarnedGold.textContent = `+${result.earnedGold.toLocaleString()} G`;
    if (elEarnedExp) elEarnedExp.textContent = `+${result.earnedExp.toLocaleString()} EXP`;

    refreshUserProfileUI();
    showModal(modalGameOver);
  };

  // 재시도 버튼
  if (btnRetry) {
    btnRetry.addEventListener("click", () => {
      hideAllModals();
      const p = GameEngine.getProfile();
      GameEngine.startGame(p.currentTheme, p.currentMode);
    });
  }

  if (btnLobbyReturn) {
    btnLobbyReturn.addEventListener("click", () => {
      hideAllModals();
      showModal(modalLobby);
      refreshUserProfileUI();
    });
  }

  // 테마/스테이지 목록 렌더링
  function renderStageList() {
    const container = document.getElementById("stageListContainer");
    if (!container) return;

    const themes = WorldThemes.getAllThemes();
    const p = GameEngine.getProfile();

    container.innerHTML = themes.map(t => {
      const isSelected = p.currentTheme === t.id;
      return `
        <div class="stage-card ${isSelected ? 'selected' : ''}" data-theme="${t.id}">
          <div style="font-weight: 800; font-size: 1.05rem; color: ${t.accentColor}; margin-bottom: 0.25rem;">
            ${t.name}
          </div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.6rem;">
            ${t.desc}
          </div>
          <button class="btn-select-theme" data-theme="${t.id}" style="width: 100%; padding: 0.45rem; border-radius: 6px; font-weight: 700; background: ${isSelected ? 'var(--accent-cyan)' : 'var(--bg-tertiary)'}; color: ${isSelected ? '#000' : '#fff'}; border: 1px solid var(--border-color); cursor: pointer;">
            ${isSelected ? '선택됨 (준비 완료)' : '이 테마 선택'}
          </button>
        </div>
      `;
    }).join("");

    container.querySelectorAll(".btn-select-theme").forEach(b => {
      b.addEventListener("click", () => {
        const tid = b.getAttribute("data-theme");
        p.currentTheme = tid;
        GameEngine.saveProfile();
        renderStageList();
      });
    });
  }

  // 상점 업그레이드 목록 렌더링
  function renderShopList() {
    const p = GameEngine.getProfile();
    refreshUserProfileUI();

    const setCost = (id, cost) => {
      const el = document.getElementById(id);
      if (el) el.textContent = `${cost.toLocaleString()} G`;
    };
    const setLvl = (id, lvl) => {
      const el = document.getElementById(id);
      if (el) el.textContent = `Lv.${lvl}`;
    };

    setCost("costUpgradePower", p.upgrades.power * 800);
    setLvl("lvlUpgradePower", p.upgrades.power);

    setCost("costUpgradeCombo", p.upgrades.comboMax * 1200);
    setLvl("lvlUpgradeCombo", p.upgrades.comboMax);

    setCost("costUpgradeBonus", p.upgrades.bonusRate * 1000);
    setLvl("lvlUpgradeBonus", p.upgrades.bonusRate);
  }

  // 업그레이드 버튼 이벤트 바인딩
  document.querySelectorAll(".btn-buy-upgrade").forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.getAttribute("data-type");
      const res = GameEngine.buyUpgrade(type);
      if (res.success) {
        AudioManager.playJackpot();
        renderShopList();
      } else {
        alert(res.reason || "구매에 실패했습니다.");
      }
    });
  });

  // 랭킹 리더보드 가상 순위표
  function renderRankList() {
    const container = document.getElementById("rankListContainer");
    if (!container) return;

    const p = GameEngine.getProfile();
    const myScore = p.highScore || 25000;

    const dummyRanks = [
      { rank: 1, name: "NeonStriker", score: 1850000, theme: "우주" },
      { rank: 2, name: "FlipperKing", score: 1420000, theme: "사이버시티" },
      { rank: 3, name: "PinballWizard", score: 980000, theme: "판타지" },
      { rank: 4, name: "CyberAce", score: 650000, theme: "클래식" },
      { rank: 5, name: "나(Player)", score: myScore, theme: p.currentTheme }
    ];

    container.innerHTML = `
      <table style="width: 100%; font-size: 0.85rem; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 1px solid var(--border-color); color: var(--accent-cyan); text-align: left;">
            <th style="padding: 0.5rem 0.25rem;">순위</th>
            <th>플레이어</th>
            <th style="text-align: right;">최고 점수</th>
          </tr>
        </thead>
        <tbody>
          ${dummyRanks.map(r => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.06); ${r.name.includes('나') ? 'color: var(--accent-gold); font-weight: 800;' : ''}">
              <td style="padding: 0.6rem 0.25rem;">#${r.rank}</td>
              <td>${r.name}</td>
              <td style="text-align: right;">${r.score.toLocaleString()} pt</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  // 초기 실행
  refreshUserProfileUI();
  showModal(modalLobby);
  requestAnimationFrame(gameLoop);
});

