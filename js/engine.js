/**
 * 맞고(GOSTOP) 핵심 게임 엔진
 * 1:1 대전 규칙, 덱/필드/패 관리, 특수 판정(쪽/따닥/쓸/뻑/폭탄), 점수 및 박 계산
 */

class GoStopEngine {
  constructor() {
    this.deck = [];
    this.field = [];      // 바닥패 [{ card, month, ... }]
    this.player = null;   // 플레이어 상태
    this.opponent = null; // 상대방(컴퓨터) 상태
    this.turn = 'player'; // 'player' | 'opponent'
    this.roundOver = false;
    this.winner = null;
    this.firstTurn = true;
    this.bombFreeTurns = { player: 0, opponent: 0 }; // 폭탄 후 덱만 뒤집는 프리턴
  }

  // 플레이어 인스턴스 팩토리
  createPlayerState(name, isAI = false) {
    return {
      name,
      isAI,
      hand: [],           // 손패
      captured: {         // 획득패
        kwang: [],
        ten: [],
        rib: [],
        pi: []
      },
      shakeCount: 0,      // 흔들기 횟수
      bombCount: 0,       // 폭탄 횟수
      ppeokCount: 0,      // 뻑 횟수
      goCount: 0,         // 고 횟수
      lastScore: 0,       // 고 선언 당시 점수
      hasKookjinAsDoublePi: false, // 9월 열끗 쌍피 전환 여부
      money: 100000       // 기본 판돈 10만 원
    };
  }

  // 게임 초기화 및 패 분배
  initGame() {
    this.roundOver = false;
    this.winner = null;
    this.firstTurn = true;
    this.turn = 'player';
    this.bombFreeTurns = { player: 0, opponent: 0 };

    if (!this.player) this.player = this.createPlayerState('나 (플레이어)', false);
    if (!this.opponent) this.opponent = this.createPlayerState('타짜 AI', true);

    // 패 초기화
    this.player.hand = [];
    this.player.captured = { kwang: [], ten: [], rib: [], pi: [] };
    this.player.shakeCount = 0;
    this.player.bombCount = 0;
    this.player.ppeokCount = 0;
    this.player.goCount = 0;
    this.player.lastScore = 0;
    this.player.hasKookjinAsDoublePi = false;

    this.opponent.hand = [];
    this.opponent.captured = { kwang: [], ten: [], rib: [], pi: [] };
    this.opponent.shakeCount = 0;
    this.opponent.bombCount = 0;
    this.opponent.ppeokCount = 0;
    this.opponent.goCount = 0;
    this.opponent.lastScore = 0;
    this.opponent.hasKookjinAsDoublePi = false;

    // 덱 생성 및 셔플 (50장 = 48장 + 보너스 2장)
    this.deck = this.shuffle([...HWA_TU_CARDS]);
    this.field = [];

    // 분배: 플레이어 10장, 상대 10장, 바닥 8장, 덱 22장
    for (let i = 0; i < 10; i++) {
      this.player.hand.push(this.deck.pop());
      this.opponent.hand.push(this.deck.pop());
    }
    for (let i = 0; i < 8; i++) {
      this.field.push(this.deck.pop());
    }

    // 손패 정렬 (월 순서대로)
    this.sortHand(this.player.hand);
    this.sortHand(this.opponent.hand);

    // 총통 체크 (바닥 or 손패에 같은 월 4장)
    const fieldChongtong = this.checkChongtong(this.field);
    const playerChongtong = this.checkChongtong(this.player.hand);
    const opponentChongtong = this.checkChongtong(this.opponent.hand);

    return {
      fieldChongtong,
      playerChongtong,
      opponentChongtong
    };
  }

  // 암호학적 수준의 피셔-예이츠 셔플
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  sortHand(hand) {
    hand.sort((a, b) => {
      if (a.month === 0) return 1;
      if (b.month === 0) return -1;
      if (a.month !== b.month) return a.month - b.month;
      return a.id.localeCompare(b.id);
    });
  }

  // 총통 검사 (같은 월 4장)
  checkChongtong(cards) {
    const monthCounts = {};
    for (const c of cards) {
      if (c.month > 0) {
        monthCounts[c.month] = (monthCounts[c.month] || 0) + 1;
        if (monthCounts[c.month] === 4) return c.month;
      }
    }
    return null;
  }

  // 흔들기 가능한 월 목록 (손패에 같은 월 3장)
  getShakeableMonths(player) {
    const monthCounts = {};
    for (const c of player.hand) {
      if (c.month > 0) {
        monthCounts[c.month] = (monthCounts[c.month] || 0) + 1;
      }
    }
    return Object.keys(monthCounts)
      .filter(m => monthCounts[m] === 3)
      .map(Number);
  }

  // 폭탄 가능한 월 목록 (손패에 3장 + 바닥에 1장)
  getBombableMonths(player) {
    const shakeable = this.getShakeableMonths(player);
    return shakeable.filter(month => {
      const fieldCount = this.field.filter(c => c.month === month).length;
      return fieldCount === 1;
    });
  }

  // 바닥에서 특정 월의 카드들 찾기
  getFieldMatches(month) {
    if (month === 0) return []; // 보너스패는 바닥 매칭 없음
    return this.field.filter(c => c.month === month);
  }

  /**
   * 턴 진행의 전반부: 플레이어가 손패를 내기
   * @param {Object} player 현재 플레이어
   * @param {Object} handCard 낸 카드
   * @param {Object} chosenFieldCard 바닥에 2장 깔렸을 때 선택한 카드 (옵션)
   * @param {boolean} isBomb 폭탄 선언 여부
   */
  playHandCard(player, handCard, chosenFieldCard = null, isBomb = false) {
    let playedCards = [];
    let matchedFieldCards = [];

    if (isBomb) {
      // 폭탄: 손패의 같은 월 3장 모두 투입
      playedCards = player.hand.filter(c => c.month === handCard.month);
      player.hand = player.hand.filter(c => c.month !== handCard.month);
      player.bombCount++;
      player.shakeCount++;
      // 바닥에 있는 1장 매칭
      matchedFieldCards = this.field.filter(c => c.month === handCard.month);
      this.field = this.field.filter(c => c.month !== handCard.month);
      // 폭탄 후 2턴간 덱만 뒤집는 프리턴 부여
      const side = player === this.player ? 'player' : 'opponent';
      this.bombFreeTurns[side] = 2;
    } else {
      // 일반 손패 내기 (1장)
      const idx = player.hand.findIndex(c => c.id === handCard.id);
      if (idx !== -1) {
        playedCards.push(player.hand.splice(idx, 1)[0]);
      } else {
        playedCards.push(handCard);
      }

      // 보너스패를 손에서 낸 경우: 즉시 피로 획득하고 덱에서 추가 보충
      if (handCard.type === CARD_TYPE.BONUS) {
        this.addCapturedCard(player, handCard);
        return {
          step: 'bonusHand',
          card: handCard,
          needDeckDraw: true
        };
      }

      const matches = this.getFieldMatches(handCard.month);
      if (matches.length === 0) {
        // 바닥에 없음 -> 바닥에 놓임
        this.field.push(handCard);
      } else if (matches.length === 1) {
        // 1장 매칭
        matchedFieldCards.push(matches[0]);
        this.field = this.field.filter(c => c.id !== matches[0].id);
      } else if (matches.length === 2) {
        // 2장 매칭: 유저 선택 패 1장 매칭
        const target = chosenFieldCard || matches[0];
        matchedFieldCards.push(target);
        this.field = this.field.filter(c => c.id !== target.id);
      } else if (matches.length === 3) {
        // 3장 깔려있음 -> 3장 모두 먹기 (엉덩이 먹기)
        matchedFieldCards.push(...matches);
        this.field = this.field.filter(c => c.month !== handCard.month);
      }
    }

    return {
      step: 'handPlayed',
      playedCards,
      matchedFieldCards,
      isBomb
    };
  }

  /**
   * 턴 진행의 후반부: 중앙 덱에서 카드 1장 뒤집기
   * @param {Object} player 현재 플레이어
   * @param {Object} handResult 앞서 playHandCard의 결과
   * @param {Object} chosenDeckFieldCard 덱 패가 바닥 2장과 매칭 시 유저 선택 카드
   */
  drawDeckCard(player, handResult, chosenDeckFieldCard = null) {
    if (this.deck.length === 0) {
      return { step: 'deckEmpty', roundOver: true };
    }

    const deckCard = this.deck.pop();
    let deckMatchedFieldCards = [];
    let isPpeok = false;
    let isJjok = false;
    let isTtadak = false;
    let isSseul = false;

    // 보너스 패가 덱에서 나온 경우
    if (deckCard.type === CARD_TYPE.BONUS) {
      this.addCapturedCard(player, deckCard);
      // 상대 피 1장 강탈
      const stolen = this.stealPi(player);
      // 덱에서 다시 1장 추가로 뽑음
      const subResult = this.drawDeckCard(player, handResult, chosenDeckFieldCard);
      return {
        step: 'bonusDeck',
        bonusCard: deckCard,
        stolen,
        subResult
      };
    }

    const playedCards = (handResult && handResult.playedCards) ? handResult.playedCards : [];
    const matchedFieldCards = (handResult && handResult.matchedFieldCards) ? handResult.matchedFieldCards : [];
    const isBomb = (handResult && handResult.isBomb) ? handResult.isBomb : false;
    const handCard = playedCards.length > 0 ? playedCards[0] : null;

    // 1. 뻑(설사) 판정: 내가 바닥패 1장을 매칭시켰는데, 덱 카드도 같은 월인 경우 (총 3장)
    if (!isBomb && handCard && matchedFieldCards.length === 1 && deckCard.month === handCard.month) {
      isPpeok = true;
      player.ppeokCount++;
      // 매칭 취소! 바닥에 손패, 매칭패, 덱패 모두 남김
      this.field.push(handCard);
      this.field.push(matchedFieldCards[0]);
      this.field.push(deckCard);
      matchedFieldCards.length = 0; // 획득 취소
      playedCards.length = 0;
    } else {
      // 덱 패와 바닥패 매칭 확인
      const deckMatches = this.getFieldMatches(deckCard.month);
      if (deckMatches.length === 0) {
        // 2. 쪽 판정: 내가 낸 손패가 바닥에 놓였는데, 덱에서 같은 월이 나온 경우
        if (!isBomb && handCard && matchedFieldCards.length === 0 && deckCard.month === handCard.month) {
          isJjok = true;
          // 바닥에서 내가 냈던 손패 회수
          this.field = this.field.filter(c => c.id !== handCard.id);
          matchedFieldCards.push(handCard);
        } else {
          // 바닥에 놓임
          this.field.push(deckCard);
        }
      } else if (deckMatches.length === 1) {
        deckMatchedFieldCards.push(deckMatches[0]);
        this.field = this.field.filter(c => c.id !== deckMatches[0].id);
      } else if (deckMatches.length === 2) {
        const target = chosenDeckFieldCard || deckMatches[0];
        deckMatchedFieldCards.push(target);
        this.field = this.field.filter(c => c.id !== target.id);
      } else if (deckMatches.length === 3) {
        // 덱으로 바닥 3장 모두 먹기 (엉덩이 먹기)
        deckMatchedFieldCards.push(...deckMatches);
        this.field = this.field.filter(c => c.month !== deckCard.month);
      }
    }

    // 획득할 총 패 수집
    const totalCaptured = [];
    if (!isPpeok) {
      totalCaptured.push(...playedCards, ...matchedFieldCards);
      if (deckMatchedFieldCards.length > 0 || isJjok) {
        totalCaptured.push(deckCard, ...deckMatchedFieldCards);
      }

      // 3. 따닥 판정: 손패로 먹고, 덱으로 바닥에 남아있던 같은 월 먹어서 4장 모두 싹쓸이
      if (handCard && matchedFieldCards.length === 1 && deckCard.month === handCard.month && deckMatchedFieldCards.length === 1) {
        isTtadak = true;
      }

      // 획득패 플레이어 소유로 이전
      for (const c of totalCaptured) {
        this.addCapturedCard(player, c);
      }

      // 4. 쓸(판쓸이) 판정: 바닥에 패가 하나도 안 남은 경우
      if (this.field.length === 0) {
        isSseul = true;
      }
    }

    // 상대 피 강탈 계산: 쪽, 따닥, 쓸, 폭탄 각각 상대 피 1장씩 강탈
    let stolenCount = 0;
    if (isJjok) stolenCount++;
    if (isTtadak) stolenCount++;
    if (isSseul) stolenCount++;
    if (isBomb) stolenCount++;

    const stolenCards = [];
    for (let i = 0; i < stolenCount; i++) {
      const stolen = this.stealPi(player);
      if (stolen) stolenCards.push(stolen);
    }

    this.firstTurn = false;

    // 점수 재계산
    const currentScore = this.calculateScore(player);

    return {
      step: 'turnFinished',
      deckCard,
      deckMatchedFieldCards,
      isPpeok,
      isJjok,
      isTtadak,
      isSseul,
      isBomb,
      stolenCards,
      currentScore
    };
  }

  // 획득 카드 분류 보관
  addCapturedCard(player, card) {
    if (card.isKwang) {
      player.captured.kwang.push(card);
    } else if (card.type === CARD_TYPE.TEN) {
      // 국진(9월 열끗)의 쌍피 전환 여부
      if (card.canBeDoublePi && player.hasKookjinAsDoublePi) {
        player.captured.pi.push(card);
      } else {
        player.captured.ten.push(card);
      }
    } else if (card.type === CARD_TYPE.RIB) {
      player.captured.rib.push(card);
    } else {
      player.captured.pi.push(card);
    }
  }

  // 상대 피 1장 빼앗기
  stealPi(taker) {
    const victim = taker === this.player ? this.opponent : this.player;
    if (victim.captured.pi.length === 0) return null;

    // 1피짜리 우선 빼앗기, 없으면 쌍피 빼앗기
    let targetIdx = victim.captured.pi.findIndex(c => (!c.piValue || c.piValue === 1) && !c.canBeDoublePi);
    if (targetIdx === -1) {
      targetIdx = 0; // 쌍피밖에 없음
    }

    const stolen = victim.captured.pi.splice(targetIdx, 1)[0];
    taker.captured.pi.push(stolen);
    return stolen;
  }

  // 국진(9월 열끗) 쌍피/열끗 토글
  toggleKookjin(player) {
    player.hasKookjinAsDoublePi = !player.hasKookjinAsDoublePi;
    // 재정렬
    const all = [...player.captured.kwang, ...player.captured.ten, ...player.captured.rib, ...player.captured.pi];
    player.captured = { kwang: [], ten: [], rib: [], pi: [] };
    for (const c of all) {
      this.addCapturedCard(player, c);
    }
    return this.calculateScore(player);
  }

  /**
   * 점수 계산 공식 (표준 맞고 룰)
   */
  calculateScore(player) {
    let score = 0;
    const details = {
      kwang: 0,
      ten: 0,
      godori: 0,
      rib: 0,
      hongdan: 0,
      cheongdan: 0,
      chodan: 0,
      pi: 0
    };

    // 1. 광 점수
    const kwangs = player.captured.kwang;
    const hasBiKwang = kwangs.some(c => c.isBiKwang);
    if (kwangs.length === 5) {
      details.kwang = 15;
    } else if (kwangs.length === 4) {
      details.kwang = 4;
    } else if (kwangs.length === 3) {
      details.kwang = hasBiKwang ? 2 : 3; // 비광 포함 3광은 2점
    }
    score += details.kwang;

    // 2. 열끗 점수
    const tens = player.captured.ten;
    if (tens.length >= 5) {
      details.ten = tens.length - 4; // 5장: 1점, 6장: 2점...
      score += details.ten;
    }
    // 고도리 검사 (2, 4, 8월 열끗 새 3마리)
    const godoriCount = tens.filter(c => c.godori).length;
    if (godoriCount === 3) {
      details.godori = 5;
      score += details.godori;
    }

    // 3. 띠 점수
    const ribs = player.captured.rib;
    if (ribs.length >= 5) {
      details.rib = ribs.length - 4;
      score += details.rib;
    }
    // 홍단, 청단, 초단
    const hongCount = ribs.filter(c => c.rib === RIB_TYPE.HONG).length;
    const cheongCount = ribs.filter(c => c.rib === RIB_TYPE.CHEONG).length;
    const choCount = ribs.filter(c => c.rib === RIB_TYPE.CHO).length;

    if (hongCount === 3) {
      details.hongdan = 3;
      score += 3;
    }
    if (cheongCount === 3) {
      details.cheongdan = 3;
      score += 3;
    }
    if (choCount === 3) {
      details.chodan = 3;
      score += 3;
    }

    // 4. 피 점수
    let piTotal = 0;
    for (const c of player.captured.pi) {
      if (c.piValue) {
        piTotal += c.piValue;
      } else if (c.canBeDoublePi) {
        piTotal += 2; // 쌍피 국진
      } else {
        piTotal += 1;
      }
    }
    if (piTotal >= 10) {
      details.pi = piTotal - 9; // 10장: 1점, 11장: 2점...
      score += details.pi;
    }

    // 고 점수 가산: 1고(+1), 2고(+2)
    if (player.goCount === 1) score += 1;
    else if (player.goCount === 2) score += 2;

    return {
      total: score,
      details,
      piCount: piTotal,
      kwangCount: kwangs.length,
      tenCount: tens.length,
      ribCount: ribs.length
    };
  }

  /**
   * 최종 승패 및 배수(박) 계산
   */
  finalizeWinner(winnerSide, isStop = true) {
    const winner = winnerSide === 'player' ? this.player : this.opponent;
    const loser = winnerSide === 'player' ? this.opponent : this.player;

    const baseScoreObj = this.calculateScore(winner);
    let finalScore = baseScoreObj.total;
    const multipliers = [];

    // 1. 고 배수: 3고 이상부터 배수 적용
    if (winner.goCount >= 3) {
      const goMult = Math.pow(2, winner.goCount - 2); // 3고 2배, 4고 4배, 5고 8배
      multipliers.push({ name: `${winner.goCount}고`, mult: goMult });
      finalScore *= goMult;
    }

    // 2. 흔들기/폭탄 배수 (흔든 횟수당 2배)
    if (winner.shakeCount > 0) {
      const shakeMult = Math.pow(2, winner.shakeCount);
      multipliers.push({ name: `흔들기 (${winner.shakeCount}회)`, mult: shakeMult });
      finalScore *= shakeMult;
    }

    // 3. 멍텅구리 (열끗 7장 이상 2배)
    if (winner.captured.ten.length >= 7) {
      multipliers.push({ name: '멍텅구리 (열끗 7장 이상)', mult: 2 });
      finalScore *= 2;
    }

    // 4. 피박: 승자가 피 점수를 얻었는데, 패자의 피가 1~7장인 경우 (2배)
    const loserPi = this.calculateScore(loser).piCount;
    if (baseScoreObj.details.pi > 0 && loserPi >= 1 && loserPi <= 7) {
      multipliers.push({ name: '피박 (상대 피 7장 이하)', mult: 2 });
      finalScore *= 2;
    }

    // 5. 광박: 승자가 광 점수를 얻었는데, 패자의 광이 0장인 경우 (2배)
    if (baseScoreObj.details.kwang > 0 && loser.captured.kwang.length === 0) {
      multipliers.push({ name: '광박 (상대 광 0장)', mult: 2 });
      finalScore *= 2;
    }

    // 6. 고박(역고 독박): 상대가 고를 한 상태에서 승리한 경우
    if (loser.goCount > 0) {
      multipliers.push({ name: '고박 (역고)', mult: 2 });
      finalScore *= 2;
    }

    // 판돈 계산 (점당 1,000원)
    const stakePerPoint = 1000;
    const totalWonMoney = finalScore * stakePerPoint;

    winner.money += totalWonMoney;
    loser.money = Math.max(0, loser.money - totalWonMoney);

    this.roundOver = true;
    this.winner = winnerSide;

    return {
      winner: winnerSide,
      baseScore: baseScoreObj.total,
      finalScore,
      multipliers,
      totalWonMoney,
      playerMoney: this.player.money,
      opponentMoney: this.opponent.money
    };
  }

  // 턴 전환
  switchTurn() {
    this.turn = this.turn === 'player' ? 'opponent' : 'player';
    return this.turn;
  }
}

// 싱글톤 전역 노출
window.goStopEngine = new GoStopEngine();
