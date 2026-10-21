/**
 * 천하제일 맞고전 10단계 고수 인공지능 (AI) 엔진
 * 10~8단 초보 / 7~4단 중수 / 3~1단 전설의 타짜 차등 지능 알고리즘
 */

class ChunhaGoStopAI {
  constructor(engine) {
    this.engine = engine;
  }

  /**
   * AI의 손패 선택 (단계별 알고리즘 분기)
   * @param {Object} aiPlayer AI 플레이어 상태
   * @param {Object} masterInfo 현재 도전 중인 고수 메타데이터
   */
  decideHandCard(aiPlayer, masterInfo = null) {
    const hand = aiPlayer.hand;
    if (hand.length === 0) return null;

    const dan = masterInfo ? masterInfo.dan : 10;
    const difficulty = masterInfo ? masterInfo.difficulty : 'beginner';

    // 1. 폭탄 가능 여부 확인
    const bombMonths = this.engine.getBombableMonths(aiPlayer);
    if (bombMonths.length > 0) {
      if (difficulty !== 'beginner' || Math.random() < 0.8) {
        const bombMonth = bombMonths[0];
        const bombCard = hand.find(c => c.month === bombMonth);
        return {
          card: bombCard,
          chosenFieldCard: null,
          isBomb: true
        };
      }
    }

    // 2. 보너스패가 손에 있다면 즉시 출도
    const bonusCard = hand.find(c => c.type === CARD_TYPE.BONUS);
    if (bonusCard) {
      return { card: bonusCard, chosenFieldCard: null, isBomb: false };
    }

    // 3. 초보 난이도 (10단 ~ 8단): 25% 확률로 아무 생각 없이 랜덤 패 출도
    if (difficulty === 'beginner' && Math.random() < 0.25) {
      const randomCard = hand[Math.floor(Math.random() * hand.length)];
      const matches = this.engine.getFieldMatches(randomCard.month);
      return {
        card: randomCard,
        chosenFieldCard: matches.length > 0 ? matches[0] : null,
        isBomb: false
      };
    }

    // 4. 중수 (7단~4단) 및 고수/타짜 (3단~1단) 정밀 가치 평가
    let bestChoice = null;
    let highestScore = -999999;

    const opponent = this.engine.player; // 유저 플레이어
    const opponentScore = this.engine.calculateScore(opponent);

    for (const card of hand) {
      const matches = this.engine.getFieldMatches(card.month);
      let matchScore = 0;
      let chosenFieldCard = null;

      if (matches.length === 0) {
        matchScore = -this.evaluateDiscardDanger(card, difficulty, opponent);
      } else if (matches.length === 1) {
        matchScore = this.evaluateCardValue(card, difficulty) + this.evaluateCardValue(matches[0], difficulty) + 60;
      } else if (matches.length === 2) {
        const val0 = this.evaluateCardValue(matches[0], difficulty);
        const val1 = this.evaluateCardValue(matches[1], difficulty);
        if (val0 >= val1) {
          chosenFieldCard = matches[0];
          matchScore = this.evaluateCardValue(card, difficulty) + val0 + 70;
        } else {
          chosenFieldCard = matches[1];
          matchScore = this.evaluateCardValue(card, difficulty) + val1 + 70;
        }
      } else if (matches.length === 3) {
        matchScore = 300 + this.evaluateCardValue(card, difficulty);
      }

      // 타짜(1단~3단) 특수 가중치
      if (difficulty === 'expert') {
        if (opponent.captured.kwang.length >= 2 && card.isKwang) {
          matchScore += 120;
        }
        if (opponentScore.piCount >= 5 && opponentScore.piCount <= 7) {
          if (card.type === CARD_TYPE.PI || card.canBeDoublePi) {
            matchScore += 80;
          }
        }
      }

      if (matchScore > highestScore) {
        highestScore = matchScore;
        bestChoice = {
          card,
          chosenFieldCard,
          isBomb: false
        };
      }
    }

    return bestChoice || { card: hand[0], chosenFieldCard: null, isBomb: false };
  }

  // 덱 뒤집은 패 매칭 시 선택
  decideDeckFieldChoice(deckCard, matchedTwoCards, masterInfo = null) {
    const difficulty = masterInfo ? masterInfo.difficulty : 'beginner';
    const val0 = this.evaluateCardValue(matchedTwoCards[0], difficulty);
    const val1 = this.evaluateCardValue(matchedTwoCards[1], difficulty);
    return val0 >= val1 ? matchedTwoCards[0] : matchedTwoCards[1];
  }

  evaluateCardValue(card, difficulty = 'beginner') {
    if (!card) return 0;
    let base = 15;
    if (card.isKwang) base = 100;
    else if (card.godori) base = 85;
    else if (card.rib === RIB_TYPE.HONG || card.rib === RIB_TYPE.CHEONG || card.rib === RIB_TYPE.CHO) base = 65;
    else if (card.canBeDoublePi || (card.piValue && card.piValue >= 2)) base = 55;
    else if (card.type === CARD_TYPE.TEN) base = 40;
    else if (card.type === CARD_TYPE.RIB) base = 30;

    if (difficulty === 'expert') {
      if (card.isKwang) base += 30;
      if (card.piValue >= 2 || card.canBeDoublePi) base += 25;
    }
    return base;
  }

  evaluateDiscardDanger(card, difficulty, opponent) {
    let danger = 10;
    if (card.isKwang) danger += 120;
    if (card.godori) danger += 90;
    if (card.canBeDoublePi || (card.piValue && card.piValue >= 2)) danger += 60;
    if (card.type === CARD_TYPE.TEN) danger += 40;
    if (card.type === CARD_TYPE.RIB) danger += 25;
    if (card.type === CARD_TYPE.PI) danger = 5;

    if (difficulty === 'expert') {
      if (card.isKwang && opponent.captured.kwang.length >= 2) danger += 200;
      if (card.godori && opponent.captured.ten.filter(c => c.godori).length >= 1) danger += 150;
    }

    return danger;
  }

  decideGoOrStop(aiPlayer, currentScoreObj, masterInfo = null) {
    const difficulty = masterInfo ? masterInfo.difficulty : 'beginner';
    const opponent = this.engine.player;
    const opponentScore = this.engine.calculateScore(opponent).total;
    const currentScore = currentScoreObj.total;

    if (difficulty === 'beginner') {
      return false; // 7점 즉시 스톱
    }

    if (difficulty === 'intermediate') {
      if (aiPlayer.goCount >= 2) return false;
      if (opponentScore >= 4) return false;
      if (aiPlayer.hand.length >= 3 && aiPlayer.goCount === 0) return true;
      return false;
    }

    // expert (타짜)
    if (opponent.goCount > 0) {
      if (currentScore >= 7) return false; // 고박 승리
    }

    if (aiPlayer.hand.length >= 3 && aiPlayer.goCount < 2) {
      const oppPi = this.engine.calculateScore(opponent).piCount;
      if (oppPi <= 6) return true;
    }

    return false;
  }
}

window.ChunhaGoStopAI = ChunhaGoStopAI;
window.goStopAI = new ChunhaGoStopAI(window.goStopEngine);
