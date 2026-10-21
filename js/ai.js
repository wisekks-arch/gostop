/**
 * 맞고 상대방(컴퓨터) 인공지능 모듈
 * 전략적 가치 평가 알고리즘 기반 패 선택 및 고/스톱 판단
 */

class GoStopAI {
  constructor(engine) {
    this.engine = engine;
  }

  /**
   * AI의 손패 선택 전략
   * @param {Object} aiPlayer AI 플레이어 상태
   * @returns {Object} { card, chosenFieldCard, isBomb }
   */
  decideHandCard(aiPlayer) {
    const hand = aiPlayer.hand;
    if (hand.length === 0) return null;

    // 1. 폭탄 가능 여부 확인
    const bombMonths = this.engine.getBombableMonths(aiPlayer);
    if (bombMonths.length > 0) {
      const bombMonth = bombMonths[0];
      const bombCard = hand.find(c => c.month === bombMonth);
      return {
        card: bombCard,
        chosenFieldCard: null,
        isBomb: true
      };
    }

    // 2. 보너스패가 손에 있다면 즉시 출도
    const bonusCard = hand.find(c => c.type === CARD_TYPE.BONUS);
    if (bonusCard) {
      return { card: bonusCard, chosenFieldCard: null, isBomb: false };
    }

    // 3. 각 손패별 가치 평가 점수 매기기
    let bestChoice = null;
    let highestScore = -9999;

    for (const card of hand) {
      const matches = this.engine.getFieldMatches(card.month);
      let matchScore = 0;
      let chosenFieldCard = null;

      if (matches.length === 0) {
        // 바닥에 먹을 게 없음: 버릴 때의 패 손실 점수 (낮을수록 안전하게 버림)
        matchScore = -this.evaluateDiscardDanger(card);
      } else if (matches.length === 1) {
        // 1장 먹기
        matchScore = this.evaluateCardValue(card) + this.evaluateCardValue(matches[0]) + 50;
      } else if (matches.length === 2) {
        // 2장 중 1장 선택 먹기: 더 좋은 패를 선택
        const val0 = this.evaluateCardValue(matches[0]);
        const val1 = this.evaluateCardValue(matches[1]);
        if (val0 >= val1) {
          chosenFieldCard = matches[0];
          matchScore = this.evaluateCardValue(card) + val0 + 60;
        } else {
          chosenFieldCard = matches[1];
          matchScore = this.evaluateCardValue(card) + val1 + 60;
        }
      } else if (matches.length === 3) {
        // 뻑 먹기 (3장 몽땅 먹기) -> 최우선
        matchScore = 200 + this.evaluateCardValue(card);
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

  /**
   * 덱에서 뒤집은 패가 바닥 2장과 매칭될 때 AI의 선택
   */
  decideDeckFieldChoice(deckCard, matchedTwoCards) {
    const val0 = this.evaluateCardValue(matchedTwoCards[0]);
    const val1 = this.evaluateCardValue(matchedTwoCards[1]);
    return val0 >= val1 ? matchedTwoCards[0] : matchedTwoCards[1];
  }

  /**
   * 카드의 단일 가치 점수 평가
   */
  evaluateCardValue(card) {
    if (!card) return 0;
    if (card.isKwang) return 100; // 광 최고
    if (card.godori) return 85;   // 고도리
    if (card.rib === RIB_TYPE.HONG || card.rib === RIB_TYPE.CHEONG || card.rib === RIB_TYPE.CHO) return 60; // 3대 단
    if (card.canBeDoublePi || (card.piValue && card.piValue >= 2)) return 50; // 쌍피
    if (card.type === CARD_TYPE.TEN) return 40; // 일반 열끗
    if (card.type === CARD_TYPE.RIB) return 30; // 일반 띠
    return 15; // 일반 피
  }

  /**
   * 패를 버릴 때 상대방에게 유리한 패를 주지 않기 위한 위험도 평가
   */
  evaluateDiscardDanger(card) {
    let danger = 0;
    if (card.isKwang) danger += 80;
    if (card.godori) danger += 60;
    if (card.canBeDoublePi || (card.piValue && card.piValue >= 2)) danger += 40;
    if (card.type === CARD_TYPE.TEN) danger += 30;
    if (card.type === CARD_TYPE.RIB) danger += 20;
    if (card.type === CARD_TYPE.PI) danger += 5; // 피를 버리는 것이 가장 안전
    return danger;
  }

  /**
   * 고 / 스톱 결정
   * @param {Object} aiPlayer AI 플레이어
   * @param {Object} currentScoreObj 현재 계산된 점수 객체
   * @returns {boolean} true: 고, false: 스톱
   */
  decideGoOrStop(aiPlayer, currentScoreObj) {
    const opponent = this.engine.player;
    const opponentScore = this.engine.calculateScore(opponent).total;
    const currentScore = currentScoreObj.total;

    // 이미 3고 이상이면 무조건 스톱으로 안전하게 굳힘
    if (aiPlayer.goCount >= 2) {
      return false;
    }

    // 상대방이 점수가 4점 이상이거나 획득패가 많아서 언제든 날 수 있다면 스톱
    if (opponentScore >= 4 || opponent.captured.pi.length >= 8) {
      return false;
    }

    // 내 손패가 3장 이상 넉넉히 남아있고 점수가 10점 미만이면 추가 득점을 위해 1고 시도
    if (aiPlayer.hand.length >= 3 && aiPlayer.goCount === 0) {
      return true; // 1고
    }

    return false; // 기본은 안전하게 스톱
  }
}

// 싱글톤 전역 노출
window.goStopAI = new GoStopAI(window.goStopEngine);
