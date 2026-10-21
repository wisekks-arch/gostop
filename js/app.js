/**
 * 천하제일 맞고전 메인 애플리케이션 매니저
 * 로비(10단 도장깨기 타워) ↔ 인게임(세로 100dvh) 전환, 사운드, 햅틱, 올인 광고 충전 관리
 */

class ChunhaGoStopApp {
  constructor() {
    this.engine = window.goStopEngine;
    this.ai = window.goStopAI;
    this.sound = window.soundEngine;
    this.storage = window.storageManager;
    this.masters = window.MASTERS_DATA;

    this.currentMaster = null;
    this.selectedHandCard = null;
    this.isProcessingTurn = false;

    // DOM 캐시
    this.dom = {
      // 뷰
      lobbyView: document.getElementById('lobby-view'),
      gameView: document.getElementById('game-view'),
      adView: document.getElementById('ad-view'),

      // 로비
      lobbyUserMoney: document.getElementById('lobby-user-money'),
      lobbyUnlockedDan: document.getElementById('lobby-unlocked-dan'),
      lobbyUserRecord: document.getElementById('lobby-user-record'),
      towerList: document.getElementById('tower-list'),
      btnLobbySound: document.getElementById('btn-lobby-sound'),

      // 인게임 상단 (상대)
      gameOppAvatar: document.getElementById('game-opp-avatar'),
      gameOppName: document.getElementById('game-opp-name'),
      gameOppMoney: document.getElementById('game-opp-money'),
      gameOppScore: document.getElementById('game-opp-score'),
      oppCntKwang: document.getElementById('opp-cnt-kwang'),
      oppCntTen: document.getElementById('opp-cnt-ten'),
      oppCntRib: document.getElementById('opp-cnt-rib'),
      oppCntPi: document.getElementById('opp-cnt-pi'),

      // 인게임 중앙 (필드 & 덱)
      gameDeckStack: document.getElementById('game-deck-stack'),
      gameDeckCount: document.getElementById('game-deck-count'),
      gameFieldBoard: document.getElementById('game-field-board'),

      // 인게임 중하단 (플레이어)
      playerCntKwang: document.getElementById('player-cnt-kwang'),
      playerCntTen: document.getElementById('player-cnt-ten'),
      playerCntRib: document.getElementById('player-cnt-rib'),
      playerCntPi: document.getElementById('player-cnt-pi'),
      gamePlayerMoney: document.getElementById('game-player-money'),
      gamePlayerScore: document.getElementById('game-player-score'),
      gamePlayerBadges: document.getElementById('game-player-badges'),

      // 손패
      gameHandCards: document.getElementById('game-hand-cards'),

      // 하단 바
      btnBackLobby: document.getElementById('btn-back-lobby'),
      btnGameSound: document.getElementById('btn-game-sound'),
      btnKookjin: document.getElementById('btn-kookjin-toggle'),
      gameStakeInfo: document.getElementById('game-stake-info'),

      // 이펙트 & 모달
      effectBanner: document.getElementById('effect-banner'),
      modalGoStop: document.getElementById('modal-gostop'),
      gostopTitle: document.getElementById('gostop-title'),
      gostopDesc: document.getElementById('gostop-desc'),
      gostopScoreVal: document.getElementById('gostop-score-val'),
      btnDeclareGo: document.getElementById('btn-declare-go'),
      btnDeclareStop: document.getElementById('btn-declare-stop'),

      modalChoice: document.getElementById('modal-choice'),
      choiceCardsList: document.getElementById('choice-cards-list'),

      modalResult: document.getElementById('modal-result'),
      resultTitle: document.getElementById('result-title'),
      resultDesc: document.getElementById('result-desc'),
      resultBreakdown: document.getElementById('result-breakdown'),
      btnResultRematch: document.getElementById('btn-result-rematch'),
      btnResultLobby: document.getElementById('btn-result-lobby'),

      modalUnlock: document.getElementById('modal-unlock'),
      unlockDesc: document.getElementById('unlock-desc'),
      btnUnlockOk: document.getElementById('btn-unlock-ok'),

      modalBankrupt: document.getElementById('modal-bankrupt'),
      btnWatchAd: document.getElementById('btn-watch-ad'),

      // 광고 뷰
      adTimerNum: document.getElementById('ad-timer-num'),
      btnSkipAd: document.getElementById('btn-skip-ad')
    };
  }

  init() {
    this.bindEvents();
    this.renderLobby();
  }

  // 이벤트 바인딩
  bindEvents() {
    // 1. 소리 토글
    const handleSoundToggle = () => {
      const isMuted = this.sound.toggleMute();
      const txt = isMuted ? '🔇 음소거' : '🔊 소리';
      this.dom.btnLobbySound.textContent = txt;
      this.dom.btnGameSound.textContent = txt;
    };
    this.dom.btnLobbySound.onclick = handleSoundToggle;
    this.dom.btnGameSound.onclick = handleSoundToggle;

    // 2. 인게임 -> 로비 복귀
    this.dom.btnBackLobby.onclick = () => {
      if (confirm('현재 대국을 포기하고 로비로 돌아가시겠습니까?')) {
        this.showLobby();
      }
    };

    // 3. 국진 쌍피 토글
    this.dom.btnKookjin.onclick = () => {
      this.engine.toggleKookjin(this.engine.player);
      this.sound.playCardSnap();
      this.dom.btnKookjin.textContent = this.engine.player.hasKookjinAsDoublePi ? '🌸 쌍피' : '🌸 열끗';
      this.renderInGame();
    };

    // 4. 결과창 버튼
    this.dom.btnResultRematch.onclick = () => {
      this.dom.modalResult.classList.remove('active');
      this.startMatch(this.currentMaster);
    };
    this.dom.btnResultLobby.onclick = () => {
      this.dom.modalResult.classList.remove('active');
      this.showLobby();
    };

    // 5. 해금 축하 팝업 확인
    this.dom.btnUnlockOk.onclick = () => {
      this.dom.modalUnlock.classList.remove('active');
    };

    // 6. 보상형 광고 시청 버튼
    this.dom.btnWatchAd.onclick = () => {
      this.dom.modalBankrupt.classList.remove('active');
      this.startRewardAdRoutine();
    };
  }

  // ============================================================
  // 로비(10단 도장깨기 타워) 뷰 렌더링
  // ============================================================
  renderLobby() {
    const data = this.storage.userData;
    this.dom.lobbyUserMoney.textContent = data.money.toLocaleString() + '전';
    this.dom.lobbyUnlockedDan.textContent = `${data.unlockedDan}단`;
    this.dom.lobbyUserRecord.textContent = `${data.stats.wins}승 ${data.stats.losses}패`;

    this.dom.towerList.innerHTML = '';

    // 10단부터 1단까지 타워 리스트 표시
    this.masters.forEach((m) => {
      const isUnlocked = m.dan >= data.unlockedDan;
      const wins = data.stageWins[m.dan] || 0;

      const card = document.createElement('div');
      card.className = `master-card ${isUnlocked ? 'unlocked' : 'locked'}`;

      card.innerHTML = `
        <div class="master-avatar">${m.avatar}</div>
        <div class="master-info">
          <div style="display:flex; align-items:center; gap:6px;">
            <span class="master-dan-badge">${m.title}</span>
            <span class="master-name">${m.name}</span>
          </div>
          <div class="master-specs">점당 <span>${m.stakePerPoint.toLocaleString()}전</span> · 자금 ${m.initialMoney.toLocaleString()}전</div>
          <div class="master-quote">"${m.quote}"</div>
          ${isUnlocked ? `<div style="font-size:10px; color:#a7f3d0; margin-top:2px;">누적 전적: ${wins}승 달성 (해금 조건: ${m.winConditionWins}승)</div>` : ''}
        </div>
        ${isUnlocked ? `
          <button class="btn-challenge" data-dan="${m.dan}">도전하기</button>
        ` : `
          <div class="lock-badge">🔒</div>
        `}
      `;

      if (isUnlocked) {
        const btn = card.querySelector('.btn-challenge');
        btn.onclick = () => this.handleChallengeClick(m);
      }

      this.dom.towerList.appendChild(card);
    });
  }

  // 도전하기 클릭 핸들러
  handleChallengeClick(master) {
    const userMoney = this.storage.userData.money;
    if (userMoney < master.minEntryMoney) {
      this.sound.playBankrupt();
      this.dom.modalBankrupt.classList.add('active');
      return;
    }
    this.startMatch(master);
  }

  // ============================================================
  // 대국 시작 및 화면 전환
  // ============================================================
  startMatch(master) {
    this.currentMaster = master;
    this.selectedHandCard = null;
    this.isProcessingTurn = false;

    // 엔진 초기화 (고수 정보 주입)
    const initRes = this.engine.initGame(master, this.storage.userData.money);

    // 뷰 전환
    this.dom.lobbyView.classList.add('hidden');
    this.dom.gameView.classList.remove('hidden');

    this.sound.playCardSnap();

    // 총통 체크
    if (initRes.fieldChongtong) {
      this.showBanner(`바닥 총통! (${initRes.fieldChongtong}월)`, 2000);
      setTimeout(() => this.startMatch(master), 2000);
      return;
    }
    if (initRes.playerChongtong) {
      this.showBanner('🎉 플레이어 총통 승리! (10점)', 2500);
      setTimeout(() => this.handleRoundEnd('player', true), 2500);
      return;
    }
    if (initRes.opponentChongtong) {
      this.showBanner(`${master.name} 총통 승리!`, 2500);
      setTimeout(() => this.handleRoundEnd('opponent', true), 2500);
      return;
    }

    this.renderInGame();
  }

  // 로비로 복귀
  showLobby() {
    this.dom.gameView.classList.add('hidden');
    this.dom.lobbyView.classList.remove('hidden');
    this.renderLobby();
  }

  // ============================================================
  // 세로형 인게임 화면 렌더링
  // ============================================================
  renderInGame() {
    const opp = this.engine.opponent;
    const player = this.engine.player;

    const oppScore = this.engine.calculateScore(opp);
    const pScore = this.engine.calculateScore(player);

    // 1. 상대방 정보
    this.dom.gameOppAvatar.textContent = this.currentMaster ? this.currentMaster.avatar : '🤖';
    this.dom.gameOppName.textContent = opp.name;
    this.dom.gameOppMoney.textContent = `자금: ${opp.money.toLocaleString()}전`;
    this.dom.gameOppScore.textContent = oppScore.total;

    this.dom.oppCntKwang.textContent = opp.captured.kwang.length;
    this.dom.oppCntTen.textContent = opp.captured.ten.length;
    this.dom.oppCntRib.textContent = opp.captured.rib.length;
    this.dom.oppCntPi.textContent = oppScore.piCount;

    // 2. 플레이어 정보
    this.dom.gamePlayerMoney.textContent = `${player.money.toLocaleString()}전`;
    this.dom.gamePlayerScore.textContent = pScore.total;

    let pBadge = '';
    if (player.goCount > 0) pBadge += ` ${player.goCount}고`;
    if (player.shakeCount > 0) pBadge += ` 흔듦`;
    if (player.bombCount > 0) pBadge += ` 폭탄`;
    this.dom.gamePlayerBadges.textContent = pBadge;

    this.dom.playerCntKwang.textContent = player.captured.kwang.length;
    this.dom.playerCntTen.textContent = player.captured.ten.length;
    this.dom.playerCntRib.textContent = player.captured.rib.length;
    this.dom.playerCntPi.textContent = pScore.piCount;

    // 3. 중앙 덱
    this.dom.gameDeckCount.textContent = `덱 ${this.engine.deck.length}장`;
    this.dom.gameDeckStack.innerHTML = '';
    const layerCount = Math.min(4, Math.ceil(this.engine.deck.length / 5));
    for (let i = 0; i < layerCount; i++) {
      const layer = document.createElement('div');
      layer.className = 'deck-card-layer';
      layer.style.top = `${-i * 2}px`;
      layer.style.left = `${i * 1.5}px`;
      layer.innerHTML = renderCardSVG(null, true);
      this.dom.gameDeckStack.appendChild(layer);
    }

    // 4. 바닥패 보드 (월별 슬롯)
    this.renderFieldBoard();

    // 5. 내 손패 (20px 슬라이드업 & 골드 글로우 하이라이트)
    this.renderHandCards();

    // 6. 하단 판돈 바
    this.dom.gameStakeInfo.textContent = `점당: ${(this.engine.stakePerPoint || 10000).toLocaleString()}전`;
  }

  // 바닥패 렌더링
  renderFieldBoard() {
    this.dom.gameFieldBoard.innerHTML = '';
    const monthGroups = {};
    for (const card of this.engine.field) {
      if (!monthGroups[card.month]) monthGroups[card.month] = [];
      monthGroups[card.month].push(card);
    }

    for (const [month, cards] of Object.entries(monthGroups)) {
      const slot = document.createElement('div');
      slot.className = 'field-slot-item';

      cards.forEach((card) => {
        const wrap = document.createElement('div');
        wrap.className = 'hwatu-card-wrap';
        wrap.innerHTML = renderCardSVG(card, false);

        // 손패 선택 시 같은 월이면 금색 굵은 외곽선(Glow Effect) 깜빡임!
        if (this.selectedHandCard && this.selectedHandCard.month === Number(month)) {
          wrap.classList.add('highlight-match');
        }

        slot.appendChild(wrap);
      });

      this.dom.gameFieldBoard.appendChild(slot);
    }
  }

  // 내 손패 렌더링 (선택 시 20px 슬라이드업)
  renderHandCards() {
    this.dom.gameHandCards.innerHTML = '';
    const hand = this.engine.player.hand;
    const isPlayerTurn = this.engine.turn === 'player' && !this.isProcessingTurn;

    hand.forEach((card) => {
      const slot = document.createElement('div');
      slot.className = 'vertical-hand-slot';
      if (!isPlayerTurn) slot.classList.add('disabled');

      if (this.selectedHandCard && this.selectedHandCard.id === card.id) {
        slot.classList.add('selected'); // 위로 20px 슬라이드업!
      }

      const wrap = document.createElement('div');
      wrap.className = 'hwatu-card-wrap';
      wrap.innerHTML = renderCardSVG(card, false);
      slot.appendChild(wrap);

      slot.onclick = () => {
        if (!isPlayerTurn) return;
        this.handleCardClick(card);
      };

      this.dom.gameHandCards.appendChild(slot);
    });
  }

  // 손패 터치 핸들러
  async handleCardClick(card) {
    if (this.isProcessingTurn) return;

    // 이미 선택된 패를 다시 터치하면 내기 진행
    if (this.selectedHandCard && this.selectedHandCard.id === card.id) {
      this.selectedHandCard = null;
      await this.playTurn(card);
      return;
    }

    // 최초 터치: 20px 슬라이드업 + 바닥패 하이라이트 + 햅틱
    this.selectedHandCard = card;
    this.sound.playCardSnap();
    this.renderInGame();
  }

  // 플레이어 턴 실행
  async playTurn(card) {
    this.isProcessingTurn = true;
    this.renderInGame();

    const bombMonths = this.engine.getBombableMonths(this.engine.player);
    const isBomb = bombMonths.includes(card.month);

    let chosenFieldCard = null;
    const matches = this.engine.getFieldMatches(card.month);

    if (!isBomb && matches.length === 2) {
      chosenFieldCard = await this.promptChoiceModal(matches);
    }

    this.sound.playCardSnap();
    const handResult = this.engine.playHandCard(this.engine.player, card, chosenFieldCard, isBomb);
    this.renderInGame();

    if (isBomb) {
      this.sound.playTtadakOrBomb(true);
      this.showBanner('💣 폭탄 투하!', 1400);
      await this.sleep(900);
    }

    await this.sleep(350);
    await this.processDeckPhase(this.engine.player, handResult);
  }

  // 덱 드로우 처리
  async processDeckPhase(player, handResult) {
    const isPlayer = player === this.engine.player;

    const deckMatches = this.engine.field.filter(c => this.engine.deck.length > 0 && c.month === this.engine.deck[this.engine.deck.length - 1].month);
    let chosenDeckField = null;

    if (isPlayer && deckMatches.length === 2) {
      chosenDeckField = await this.promptChoiceModal(deckMatches);
    } else if (!isPlayer && deckMatches.length === 2) {
      chosenDeckField = this.ai.decideDeckFieldChoice(this.engine.deck[this.engine.deck.length - 1], deckMatches, this.currentMaster);
    }

    this.sound.playCardSnap();
    const turnResult = this.engine.drawDeckCard(player, handResult, chosenDeckField);
    this.renderInGame();

    // 특수 판정 효과음 & 햅틱 연출
    if (turnResult.isPpeok) {
      this.sound.playPpeok();
      this.showBanner('💩 뻑!', 1200);
      await this.sleep(900);
    } else {
      if (turnResult.isTtadak) {
        this.sound.playTtadakOrBomb(false);
        this.showBanner('⚡ 따닥! (피 강탈)', 1400);
        await this.sleep(900);
      }
      if (turnResult.isJjok) {
        this.sound.playJjok();
        this.showBanner('💋 쪽! (피 강탈)', 1400);
        await this.sleep(900);
      }
      if (turnResult.isSseul) {
        this.sound.playSseul();
        this.showBanner('🧹 판쓸이! (피 강탈)', 1400);
        await this.sleep(900);
      }
      if (turnResult.deckMatchedFieldCards && turnResult.deckMatchedFieldCards.length > 0) {
        this.sound.playMatch();
      }
    }

    this.renderInGame();
    await this.sleep(350);

    // 점수 검사 및 고/스톱
    const scoreObj = this.engine.calculateScore(player);
    if (scoreObj.total >= 7 && scoreObj.total > player.lastScore) {
      if (isPlayer) {
        await this.promptGoStopModal(scoreObj.total);
        return;
      } else {
        const aiGo = this.ai.decideGoOrStop(player, scoreObj, this.currentMaster);
        if (aiGo) {
          player.goCount++;
          player.lastScore = scoreObj.total;
          this.sound.playGo();
          this.showBanner(`🔥 ${this.currentMaster.name}의 ${player.goCount}고!`, 1600);
          await this.sleep(1400);
        } else {
          this.sound.playStop();
          this.showBanner(`🛑 ${this.currentMaster.name} 스톱!`, 1800);
          await this.sleep(1400);
          this.handleRoundEnd('opponent', true);
          return;
        }
      }
    }

    // 종료 확인
    if (this.engine.deck.length === 0 || (this.engine.player.hand.length === 0 && this.engine.opponent.hand.length === 0)) {
      this.handleDrawOrFinalScore();
      return;
    }

    // 턴 교대
    this.engine.switchTurn();
    this.isProcessingTurn = false;
    this.renderInGame();

    if (this.engine.turn === 'opponent') {
      setTimeout(() => this.playAITurn(), 700);
    }
  }

  // AI 턴
  async playAITurn() {
    this.isProcessingTurn = true;
    this.renderInGame();

    const decision = this.ai.decideHandCard(this.engine.opponent, this.currentMaster);
    if (!decision || !decision.card) {
      this.handleDrawOrFinalScore();
      return;
    }

    this.sound.playCardSnap();
    const handResult = this.engine.playHandCard(
      this.engine.opponent,
      decision.card,
      decision.chosenFieldCard,
      decision.isBomb
    );
    this.renderInGame();

    if (decision.isBomb) {
      this.sound.playTtadakOrBomb(true);
      this.showBanner(`💣 ${this.currentMaster.name}의 폭탄!`, 1400);
      await this.sleep(900);
    }

    await this.sleep(500);
    await this.processDeckPhase(this.engine.opponent, handResult);
  }

  // 바닥 2장 모달
  promptChoiceModal(cards) {
    return new Promise((resolve) => {
      this.dom.choiceCardsList.innerHTML = '';
      cards.forEach((card) => {
        const item = document.createElement('div');
        item.className = 'hwatu-card-wrap';
        item.style.cursor = 'pointer';
        item.innerHTML = renderCardSVG(card, false);

        item.onclick = () => {
          this.sound.playCardSnap();
          this.dom.modalChoice.classList.remove('active');
          resolve(card);
        };
        this.dom.choiceCardsList.appendChild(item);
      });
      this.dom.modalChoice.classList.add('active');
    });
  }

  // 고 / 스톱 모달
  promptGoStopModal(score) {
    this.dom.gostopScoreVal.textContent = score;
    this.dom.gostopTitle.textContent = this.engine.player.goCount > 0 ? `🎴 ${this.engine.player.goCount + 1}고 도전?` : '🎴 7점 달성!';
    this.dom.modalGoStop.classList.add('active');

    this.dom.btnDeclareGo.onclick = async () => {
      this.dom.modalGoStop.classList.remove('active');
      this.engine.player.goCount++;
      this.engine.player.lastScore = score;
      this.sound.playGo();
      this.showBanner(`🔥 ${this.engine.player.goCount}고!`, 1500);
      await this.sleep(1200);

      this.engine.switchTurn();
      this.isProcessingTurn = false;
      this.renderInGame();
      setTimeout(() => this.playAITurn(), 700);
    };

    this.dom.btnDeclareStop.onclick = () => {
      this.dom.modalGoStop.classList.remove('active');
      this.sound.playStop();
      this.handleRoundEnd('player', true);
    };
  }

  // 정산 및 승패 기록
  handleRoundEnd(winnerSide, isStop) {
    const res = this.engine.finalizeWinner(winnerSide, isStop);
    const isPlayerWin = winnerSide === 'player';

    // 전적 및 머니 로컬 스토리지에 영구 반영
    const dan = this.currentMaster ? this.currentMaster.dan : 10;
    const { newlyUnlockedDan } = this.storage.recordGameResult(
      dan,
      isPlayerWin,
      isPlayerWin ? res.totalWonMoney : 0
    );

    if (isPlayerWin) {
      this.storage.addMoney(res.totalWonMoney);
    } else {
      this.storage.addMoney(-res.totalWonMoney);
    }

    this.dom.resultTitle.textContent = isPlayerWin ? '🎉 승리했습니다!' : '💀 패배했습니다...';
    this.dom.resultTitle.style.color = isPlayerWin ? '#ffd166' : '#ef4444';
    this.dom.resultDesc.textContent = `${winnerSide === 'player' ? '도전자' : this.currentMaster.name}가 스톱으로 승리하여 판돈을 획득했습니다.`;

    let html = `
      <div style="display:flex; justify-content:space-between;">
        <span>기본 점수</span>
        <span>${res.baseScore}점</span>
      </div>
    `;

    res.multipliers.forEach(m => {
      html += `
        <div style="display:flex; justify-content:space-between; color:#ffd166;">
          <span>${m.name}</span>
          <span>x${m.mult}배</span>
        </div>
      `;
    });

    html += `
      <div style="display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.2); padding-top:4px; font-weight:bold; color:#ffd166;">
        <span>판돈 (점당 ${res.stakePerPoint.toLocaleString()}전)</span>
        <span>${res.finalScore}점 (${res.totalWonMoney.toLocaleString()}전)</span>
      </div>
    `;

    this.dom.resultBreakdown.innerHTML = html;
    this.dom.modalResult.classList.add('active');
    this.renderInGame();

    // 상위 단계 해금 발생 시 축하 모달 준비
    if (newlyUnlockedDan) {
      setTimeout(() => {
        this.dom.unlockDesc.textContent = `축하합니다! ${dan}단을 클리어하여 ${newlyUnlockedDan}단이 새로 해금되었습니다!`;
        this.dom.modalUnlock.classList.add('active');
      }, 500);
    }

    // 유저 보유 전 소진 (올인) 확인
    if (this.storage.userData.money <= 0 || this.storage.userData.money < (this.currentMaster ? this.currentMaster.minEntryMoney : 100000)) {
      setTimeout(() => {
        this.dom.modalResult.classList.remove('active');
        this.sound.playBankrupt();
        this.dom.modalBankrupt.classList.add('active');
      }, 1200);
    }
  }

  // 무승부 처리
  handleDrawOrFinalScore() {
    const pScore = this.engine.calculateScore(this.engine.player).total;
    const oppScore = this.engine.calculateScore(this.engine.opponent).total;

    if (pScore >= 7 && pScore > oppScore) {
      this.handleRoundEnd('player', true);
    } else if (oppScore >= 7 && oppScore > pScore) {
      this.handleRoundEnd('opponent', true);
    } else {
      this.showBanner('판 나가리 (무승부)', 2000);
      setTimeout(() => this.startMatch(this.currentMaster), 2000);
    }
  }

  // ============================================================
  // 보상형 광고 30초 카운트다운 루틴
  // ============================================================
  startRewardAdRoutine() {
    this.dom.adView.classList.add('active');
    let timeLeft = 30;
    this.dom.adTimerNum.textContent = timeLeft;
    this.dom.btnSkipAd.style.display = 'none';

    const timer = setInterval(() => {
      timeLeft--;
      this.dom.adTimerNum.textContent = timeLeft;

      // 테스트 편의 및 빠른 확인을 위해 5초 후 보상 수령 버튼 활성화 (실서버에서는 30초 완료)
      if (timeLeft <= 25) {
        this.dom.btnSkipAd.style.display = 'block';
      }

      if (timeLeft <= 0) {
        clearInterval(timer);
        this.completeRewardAd();
      }
    }, 1000);

    this.dom.btnSkipAd.onclick = () => {
      clearInterval(timer);
      this.completeRewardAd();
    };
  }

  completeRewardAd() {
    this.dom.adView.classList.remove('active');
    const newMoney = this.storage.rewardAdBonus();
    this.sound.playMatch();
    alert(`🎉 보상형 광고 시청 완료!\n100만 전이 무료로 충전되었습니다.\n현재 잔액: ${newMoney.toLocaleString()}전`);
    this.showLobby();
  }

  // 시각 배너
  showBanner(text, duration = 1200) {
    this.dom.effectBanner.textContent = text;
    this.dom.effectBanner.classList.remove('banner-pop');
    void this.dom.effectBanner.offsetWidth;
    this.dom.effectBanner.classList.add('banner-pop');

    setTimeout(() => {
      this.dom.effectBanner.classList.remove('banner-pop');
    }, duration);
  }

  sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
}

// 브라우저 로드 시 구동
window.addEventListener('DOMContentLoaded', () => {
  window.app = new ChunhaGoStopApp();
  window.app.init();
});
