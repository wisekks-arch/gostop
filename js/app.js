/**
 * 맞고(GOSTOP) UI 컨트롤러 및 인터랙션 매니저
 * 턴 진행, 카드 애니메이션, 오디오, 하이라이트, 모달 제어
 */

class GoStopApp {
  constructor() {
    this.engine = window.goStopEngine;
    this.ai = window.goStopAI;
    this.sound = window.soundEngine;

    this.selectedHandCard = null;
    this.isProcessingTurn = false;
    this.pendingChoiceResolver = null;

    // DOM 캐시
    this.dom = {
      app: document.getElementById('game-app'),
      turnIndicator: document.getElementById('turn-indicator'),
      btnFullscreen: document.getElementById('btn-fullscreen'),
      btnSound: document.getElementById('btn-sound'),
      btnKookjin: document.getElementById('btn-kookjin-toggle'),
      btnRestart: document.getElementById('btn-restart'),

      // 상대방
      oppMoney: document.getElementById('opp-money'),
      oppScore: document.getElementById('opp-score'),
      oppStatusBadge: document.getElementById('opp-status-badge'),
      oppCapKwang: document.getElementById('opp-cap-kwang'),
      oppCapTen: document.getElementById('opp-cap-ten'),
      oppCapRib: document.getElementById('opp-cap-rib'),
      oppCapPi: document.getElementById('opp-cap-pi'),
      oppCntKwang: document.getElementById('opp-cnt-kwang'),
      oppCntTen: document.getElementById('opp-cnt-ten'),
      oppCntRib: document.getElementById('opp-cnt-rib'),
      oppCntPi: document.getElementById('opp-cnt-pi'),

      // 필드 & 덱
      fieldBoard: document.getElementById('field-board'),
      deckStack: document.getElementById('deck-stack'),
      deckCount: document.getElementById('deck-count'),

      // 플레이어
      playerMoney: document.getElementById('player-money'),
      playerScore: document.getElementById('player-score'),
      playerStatusBadge: document.getElementById('player-status-badge'),
      playerHand: document.getElementById('player-hand'),
      playerCapKwang: document.getElementById('player-cap-kwang'),
      playerCapTen: document.getElementById('player-cap-ten'),
      playerCapRib: document.getElementById('player-cap-rib'),
      playerCapPi: document.getElementById('player-cap-pi'),
      playerCntKwang: document.getElementById('player-cnt-kwang'),
      playerCntTen: document.getElementById('player-cnt-ten'),
      playerCntRib: document.getElementById('player-cnt-rib'),
      playerCntPi: document.getElementById('player-cnt-pi'),

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
      resultWinnerDesc: document.getElementById('result-winner-desc'),
      resultScoreBreakdown: document.getElementById('result-score-breakdown'),
      btnNextRound: document.getElementById('btn-next-round'),

      modalShake: document.getElementById('modal-shake'),
      shakeDesc: document.getElementById('shake-desc'),
      btnDoShake: document.getElementById('btn-do-shake'),
      btnSkipShake: document.getElementById('btn-skip-shake')
    };
  }

  // 초기 시작
  init() {
    this.bindEvents();
    this.preventGestures();
    this.startNewGame();
  }

  // 모바일 웹 제스처 방지
  preventGestures() {
    document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });

    // 더블탭 확대 방지
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
  }

  // UI 이벤트 바인딩
  bindEvents() {
    // 1. 전체화면 토글
    this.dom.btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => { });
        this.dom.btnFullscreen.textContent = '⛶ 축소';
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
        this.dom.btnFullscreen.textContent = '⛶ 전체화면';
      }
    });

    // 2. 사운드 토글
    this.dom.btnSound.addEventListener('click', () => {
      const isMuted = this.sound.toggleMute();
      this.dom.btnSound.textContent = isMuted ? '🔇 음소거' : '🔊 소리 켬';
    });

    // 3. 국진 쌍피/열 전환 토글
    this.dom.btnKookjin.addEventListener('click', () => {
      const res = this.engine.toggleKookjin(this.engine.player);
      this.sound.playCardSnap();
      this.dom.btnKookjin.textContent = this.engine.player.hasKookjinAsDoublePi ? '🌸 국진: 쌍피' : '🌸 국진: 열끗';
      this.render();
    });

    // 4. 재시작
    this.dom.btnRestart.addEventListener('click', () => {
      if (confirm('게임을 새로 시작하시겠습니까?')) {
        this.startNewGame();
      }
    });

    // 5. 다음 판 시작 버튼
    this.dom.btnNextRound.addEventListener('click', () => {
      this.dom.modalResult.classList.remove('active');
      this.startNewGame();
    });
  }

  // 새 판 시작
  startNewGame() {
    this.selectedHandCard = null;
    this.isProcessingTurn = false;
    const initRes = this.engine.initGame();

    // 총통 체크
    if (initRes.fieldChongtong) {
      this.showBanner(`바닥 총통! (${initRes.fieldChongtong}월)`, 2000);
      setTimeout(() => this.startNewGame(), 2000);
      return;
    }
    if (initRes.playerChongtong) {
      this.showBanner('🎉 플레이어 총통 승리! (10점)', 2500);
      setTimeout(() => this.handleRoundEnd('player', true), 2500);
      return;
    }
    if (initRes.opponentChongtong) {
      this.showBanner('상대 AI 총통 승리!', 2500);
      setTimeout(() => this.handleRoundEnd('opponent', true), 2500);
      return;
    }

    // 플레이어 흔들기 검사
    const shakeMonths = this.engine.getShakeableMonths(this.engine.player);
    if (shakeMonths.length > 0) {
      this.promptShake(shakeMonths[0]);
    }

    this.render();
  }

  // 흔들기 확인 모달
  promptShake(month) {
    this.dom.shakeDesc.textContent = `${month}월 패를 3장 보유하고 있습니다. 흔드시겠습니까? (승리 시 2배)`;
    this.dom.modalShake.classList.add('active');

    const handleChoice = (doShake) => {
      if (doShake) {
        this.engine.player.shakeCount++;
        this.showBanner('⚡ 흔들기 선언! (2배)', 1500);
        this.sound.playSpecial();
      }
      this.dom.modalShake.classList.remove('active');
      this.render();
    };

    this.dom.btnDoShake.onclick = () => handleChoice(true);
    this.dom.btnSkipShake.onclick = () => handleChoice(false);
  }

  // 전체 화면 상태 렌더링
  render() {
    this.renderHeaderAndStatus();
    this.renderOpponent();
    this.renderField();
    this.renderDeck();
    this.renderPlayerHand();
    this.renderPlayerCaptured();
  }

  renderHeaderAndStatus() {
    const isPlayer = this.engine.turn === 'player';
    this.dom.turnIndicator.textContent = isPlayer ? '내 턴 (패를 터치하세요)' : '상대 턴 생각 중...';
    this.dom.turnIndicator.style.background = isPlayer ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)';

    // 상태 배지
    let pBadge = '';
    if (this.engine.player.goCount > 0) pBadge += ` ${this.engine.player.goCount}고`;
    if (this.engine.player.shakeCount > 0) pBadge += ` 흔듦`;
    if (this.engine.player.bombCount > 0) pBadge += ` 폭탄`;
    this.dom.playerStatusBadge.textContent = pBadge;

    let oppBadge = '';
    if (this.engine.opponent.goCount > 0) oppBadge += ` ${this.engine.opponent.goCount}고`;
    if (this.engine.opponent.shakeCount > 0) oppBadge += ` 흔듦`;
    this.dom.oppStatusBadge.textContent = oppBadge;
  }

  renderOpponent() {
    const opp = this.engine.opponent;
    const oppScoreObj = this.engine.calculateScore(opp);

    this.dom.oppScore.textContent = oppScoreObj.total;
    this.dom.oppMoney.textContent = opp.money.toLocaleString() + '원';

    this.dom.oppCntKwang.textContent = opp.captured.kwang.length;
    this.dom.oppCntTen.textContent = opp.captured.ten.length;
    this.dom.oppCntRib.textContent = opp.captured.rib.length;
    this.dom.oppCntPi.textContent = oppScoreObj.piCount;

    this.renderMiniCardStack(this.dom.oppCapKwang, opp.captured.kwang);
    this.renderMiniCardStack(this.dom.oppCapTen, opp.captured.ten);
    this.renderMiniCardStack(this.dom.oppCapRib, opp.captured.rib);
    this.renderMiniCardStack(this.dom.oppCapPi, opp.captured.pi);
  }

  renderPlayerCaptured() {
    const player = this.engine.player;
    const pScoreObj = this.engine.calculateScore(player);

    this.dom.playerScore.textContent = pScoreObj.total;
    this.dom.playerMoney.textContent = player.money.toLocaleString() + '원';

    this.dom.playerCntKwang.textContent = player.captured.kwang.length;
    this.dom.playerCntTen.textContent = player.captured.ten.length;
    this.dom.playerCntRib.textContent = player.captured.rib.length;
    this.dom.playerCntPi.textContent = pScoreObj.piCount;

    this.renderMiniCardStack(this.dom.playerCapKwang, player.captured.kwang);
    this.renderMiniCardStack(this.dom.playerCapTen, player.captured.ten);
    this.renderMiniCardStack(this.dom.playerCapRib, player.captured.rib);
    this.renderMiniCardStack(this.dom.playerCapPi, player.captured.pi);
  }

  // 획득패 미니 스택 렌더링
  renderMiniCardStack(container, cards) {
    container.innerHTML = '';
    const maxShow = 6;
    const slice = cards.slice(-maxShow);
    slice.forEach((card, idx) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'mini-card';
      cardEl.style.left = `${idx * 4}px`;
      cardEl.style.top = `${idx * 1}px`;
      cardEl.innerHTML = renderCardSVG(card, false);
      container.appendChild(cardEl);
    });
  }

  // 중앙 덱 렌더링
  renderDeck() {
    this.dom.deckStack.innerHTML = '';
    const deckCount = this.engine.deck.length;
    this.dom.deckCount.textContent = `덱 ${deckCount}장`;

    // 겹친 레이어 시각화
    const layerCount = Math.min(5, Math.ceil(deckCount / 4));
    for (let i = 0; i < layerCount; i++) {
      const layer = document.createElement('div');
      layer.className = 'deck-card-layer';
      layer.style.top = `${-i * 2}px`;
      layer.style.left = `${i * 1.5}px`;
      layer.innerHTML = renderCardSVG(null, true);
      this.dom.deckStack.appendChild(layer);
    }
  }

  // 바닥패 렌더링 (월별 그룹핑 배치)
  renderField() {
    this.dom.fieldBoard.innerHTML = '';

    // 월별로 바닥패 그룹화
    const monthGroups = {};
    for (const card of this.engine.field) {
      if (!monthGroups[card.month]) monthGroups[card.month] = [];
      monthGroups[card.month].push(card);
    }

    for (const [month, cards] of Object.entries(monthGroups)) {
      const slot = document.createElement('div');
      slot.className = 'field-slot';
      slot.dataset.month = month;

      cards.forEach((card, idx) => {
        const wrap = document.createElement('div');
        wrap.className = 'hwatu-card-wrap';
        wrap.dataset.cardId = card.id;
        wrap.innerHTML = renderCardSVG(card, false);

        // 내 손패가 선택되었을 때, 같은 월이면 발광 하이라이트(Highlight Glow) 적용!
        if (this.selectedHandCard && this.selectedHandCard.month === Number(month)) {
          wrap.classList.add('highlight-match');
        }

        slot.appendChild(wrap);
      });

      this.dom.fieldBoard.appendChild(slot);
    }
  }

  // 내 손패 10장 렌더링 (Hitbox 확장 및 선택/바운스 인터랙션)
  renderPlayerHand() {
    this.dom.playerHand.innerHTML = '';
    const hand = this.engine.player.hand;
    const isPlayerTurn = this.engine.turn === 'player' && !this.isProcessingTurn;

    hand.forEach((card) => {
      const slot = document.createElement('div');
      slot.className = 'hand-card-slot';
      if (!isPlayerTurn) slot.classList.add('disabled');

      if (this.selectedHandCard && this.selectedHandCard.id === card.id) {
        slot.classList.add('selected');
      }

      const wrap = document.createElement('div');
      wrap.className = 'hwatu-card-wrap';
      wrap.innerHTML = renderCardSVG(card, false);
      slot.appendChild(wrap);

      // 터치 / 클릭 핸들러
      slot.addEventListener('click', () => {
        if (!isPlayerTurn) return;
        this.handlePlayerCardClick(card);
      });

      this.dom.playerHand.appendChild(slot);
    });
  }

  // 손패 클릭 인터랙션
  async handlePlayerCardClick(card) {
    if (this.isProcessingTurn) return;

    // 이미 선택된 패를 한 번 더 클릭하면 내기 실행
    if (this.selectedHandCard && this.selectedHandCard.id === card.id) {
      this.selectedHandCard = null;
      await this.executePlayerTurn(card);
      return;
    }

    // 처음 선택 시: 튀어오름 & 바닥 매칭 하이라이트 활성화
    this.selectedHandCard = card;
    this.sound.playCardSnap();
    this.render();
  }

  // 플레이어 턴 실행
  async executePlayerTurn(card) {
    this.isProcessingTurn = true;
    this.render();

    // 폭탄 가능 여부 확인
    const bombMonths = this.engine.getBombableMonths(this.engine.player);
    const isBomb = bombMonths.includes(card.month);

    let chosenFieldCard = null;
    const matches = this.engine.getFieldMatches(card.month);

    // 바닥에 2장 있는 경우: 플레이어 선택 팝업 모달 호출
    if (!isBomb && matches.length === 2) {
      chosenFieldCard = await this.promptChoiceModal(matches);
    }

    // 1단계: 손패 내기
    this.sound.playCardSnap();
    const handResult = this.engine.playHandCard(this.engine.player, card, chosenFieldCard, isBomb);
    this.render();

    if (isBomb) {
      this.sound.playBomb();
      this.showBanner('💣 폭탄 투하!', 1400);
      await this.sleep(1000);
    }

    await this.sleep(400);

    // 2단계: 중앙 덱에서 1장 드로우
    await this.processDeckPhase(this.engine.player, handResult);
  }

  // 덱 드로우 및 결과 처리 공통 루틴
  async processDeckPhase(player, handResult) {
    const isPlayer = player === this.engine.player;

    // 덱 패 뒤집기 전 덱 카드 점검
    const deckMatches = this.engine.field.filter(c => this.engine.deck.length > 0 && c.month === this.engine.deck[this.engine.deck.length - 1].month);
    let chosenDeckField = null;

    if (isPlayer && deckMatches.length === 2) {
      chosenDeckField = await this.promptChoiceModal(deckMatches);
    } else if (!isPlayer && deckMatches.length === 2) {
      chosenDeckField = this.ai.decideDeckFieldChoice(this.engine.deck[this.engine.deck.length - 1], deckMatches);
    }

    this.sound.playCardSnap();
    const turnResult = this.engine.drawDeckCard(player, handResult, chosenDeckField);
    this.render();

    // 특수 판정 사운드 및 이펙트 배너 노출
    if (turnResult.isPpeok) {
      this.sound.playPpeok();
      this.showBanner('💩 뻑!', 1200);
      await this.sleep(1000);
    } else {
      if (turnResult.isTtadak) {
        this.sound.playSpecial();
        this.showBanner('⚡ 따닥! (피 1장 강탈)', 1400);
        await this.sleep(1000);
      }
      if (turnResult.isJjok) {
        this.sound.playSpecial();
        this.showBanner('💋 쪽! (피 1장 강탈)', 1400);
        await this.sleep(1000);
      }
      if (turnResult.isSseul) {
        this.sound.playSpecial();
        this.showBanner('🧹 판쓸이! (피 1장 강탈)', 1400);
        await this.sleep(1000);
      }
      if (turnResult.deckMatchedFieldCards && turnResult.deckMatchedFieldCards.length > 0) {
        this.sound.playMatch();
      }
    }

    this.render();
    await this.sleep(400);

    // 점수 검사 및 고/스톱 판정
    const scoreObj = this.engine.calculateScore(player);
    if (scoreObj.total >= 7 && scoreObj.total > player.lastScore) {
      if (isPlayer) {
        await this.promptGoStopModal(scoreObj.total);
        return; // 모달 응답 후 이어서 진행
      } else {
        // AI의 고/스톱 판단
        const aiWantsGo = this.ai.decideGoOrStop(player, scoreObj);
        if (aiWantsGo) {
          player.goCount++;
          player.lastScore = scoreObj.total;
          this.sound.playGo();
          this.showBanner(`🤖 AI가 ${player.goCount}고를 외쳤습니다!`, 1800);
          await this.sleep(1500);
        } else {
          this.sound.playStop();
          this.showBanner('🛑 AI가 스톱을 선언했습니다!', 2000);
          await this.sleep(1500);
          this.handleRoundEnd('opponent', true);
          return;
        }
      }
    }

    // 게임 종료 여부 확인 (덱 소진 or 손패 소진)
    if (this.engine.deck.length === 0 || (this.engine.player.hand.length === 0 && this.engine.opponent.hand.length === 0)) {
      this.handleDrawOrFinalScore();
      return;
    }

    // 턴 전환
    this.engine.switchTurn();
    this.isProcessingTurn = false;
    this.render();

    // AI 턴 진행
    if (this.engine.turn === 'opponent') {
      setTimeout(() => this.executeAITurn(), 800);
    }
  }

  // 컴퓨터 AI 턴 자동 실행
  async executeAITurn() {
    this.isProcessingTurn = true;
    this.render();

    const decision = this.ai.decideHandCard(this.engine.opponent);
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
    this.render();

    if (decision.isBomb) {
      this.sound.playBomb();
      this.showBanner('💣 AI의 폭탄 투하!', 1400);
      await this.sleep(1000);
    }

    await this.sleep(600);
    await this.processDeckPhase(this.engine.opponent, handResult);
  }

  // 바닥 2장 중 1장 선택 팝업
  promptChoiceModal(cards) {
    return new Promise((resolve) => {
      this.dom.choiceCardsList.innerHTML = '';
      cards.forEach((card) => {
        const item = document.createElement('div');
        item.className = 'choice-card-item hwatu-card-wrap';
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

  // 고 / 스톱 선택 모달
  promptGoStopModal(score) {
    this.dom.gostopScoreVal.textContent = score;
    this.dom.gostopTitle.textContent = this.engine.player.goCount > 0 ? `🎴 ${this.engine.player.goCount + 1}고 도전?` : '🎴 7점 달성!';
    this.dom.modalGoStop.classList.add('active');

    this.dom.btnDeclareGo.onclick = async () => {
      this.dom.modalGoStop.classList.remove('active');
      this.engine.player.goCount++;
      this.engine.player.lastScore = score;
      this.sound.playGo();
      this.showBanner(`🔥 ${this.engine.player.goCount}고!`, 1600);
      await this.sleep(1200);

      // 계속 진행
      this.engine.switchTurn();
      this.isProcessingTurn = false;
      this.render();
      setTimeout(() => this.executeAITurn(), 800);
    };

    this.dom.btnDeclareStop.onclick = () => {
      this.dom.modalGoStop.classList.remove('active');
      this.sound.playStop();
      this.handleRoundEnd('player', true);
    };
  }

  // 라운드 종료 및 정산 모달
  handleRoundEnd(winnerSide, isStop) {
    const result = this.engine.finalizeWinner(winnerSide, isStop);
    const isPlayerWin = winnerSide === 'player';

    this.dom.resultTitle.textContent = isPlayerWin ? '🎉 승리했습니다!' : '💀 패배했습니다...';
    this.dom.resultTitle.style.color = isPlayerWin ? '#ffd166' : '#ef4444';
    this.dom.resultWinnerDesc.textContent = `${winnerSide === 'player' ? '플레이어' : '타짜 AI'}가 스톱으로 승리하여 판돈을 획득했습니다.`;

    let html = `
      <div class="result-score-item">
        <span>기본 점수</span>
        <span>${result.baseScore}점</span>
      </div>
    `;

    result.multipliers.forEach((m) => {
      html += `
        <div class="result-score-item" style="color: #ffd166;">
          <span>${m.name}</span>
          <span>x${m.mult}배</span>
        </div>
      `;
    });

    html += `
      <div class="result-score-item result-total">
        <span>최종 점수 / 판돈</span>
        <span>${result.finalScore}점 (${result.totalWonMoney.toLocaleString()}원)</span>
      </div>
    `;

    this.dom.resultScoreBreakdown.innerHTML = html;
    this.dom.modalResult.classList.add('active');
    this.render();
  }

  // 덱이나 패가 다 떨어져 무승부 처리
  handleDrawOrFinalScore() {
    const pScore = this.engine.calculateScore(this.engine.player).total;
    const oppScore = this.engine.calculateScore(this.engine.opponent).total;

    if (pScore >= 7 && pScore > oppScore) {
      this.handleRoundEnd('player', true);
    } else if (oppScore >= 7 && oppScore > pScore) {
      this.handleRoundEnd('opponent', true);
    } else {
      this.showBanner('판 나가리 (무승부)', 2000);
      setTimeout(() => this.startNewGame(), 2000);
    }
  }

  // 시각 배너 텍스트 팝업 (쪽, 따닥, 쓸, 뻑 등)
  showBanner(text, duration = 1200) {
    this.dom.effectBanner.textContent = text;
    this.dom.effectBanner.classList.remove('banner-pop');
    void this.dom.effectBanner.offsetWidth; // 리플로우 트리거
    this.dom.effectBanner.classList.add('banner-pop');

    setTimeout(() => {
      this.dom.effectBanner.classList.remove('banner-pop');
    }, duration);
  }

  sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
}

// 브라우저 DOM 로드 시 실행
window.addEventListener('DOMContentLoaded', () => {
  window.app = new GoStopApp();
  window.app.init();
});
