/**
 * StockCraft (스톡크래프트) 5가지 실전 투자 전략 연습 및 검증 모듈 (practiceModes.js)
 * 1️⃣ 가상 투자로 리스크 관리 연습하기
 * 2️⃣ 다양한 투자 전략 테스트 (백테스팅)
 * 3️⃣ 종목 분석 능력 향상 (재무/차트 워크시트)
 * 4️⃣ 감정 조절 훈련 (급락장 심리 관리 시뮬레이션)
 * 5️⃣ 투자 목표 설정 및 검증 (목표 수익률 퀘스트)
 */

const PracticeModesEngine = (() => {
  const PRACTICE_MODULES = [
    {
      id: "risk-mgmt",
      title: "1️⃣ 리스크 관리 연습",
      subTitle: "원금 손실 방어 및 스탑로스 준수 훈련",
      icon: "🛡️",
      desc: "단일 종목 비중 30% 이하 분산 투자, 손절선(-5%) 필수 설정으로 최대 낙폭(MDD)을 5% 이내로 방어하는 훈련입니다.",
      missions: [
        { id: "m1", text: "3개 이상 종목으로 분산 포트폴리오 구축하기", completed: false },
        { id: "m2", text: "보유 종목에 -5% 스탑로스(손절가) 예약 주문 걸기", completed: false },
        { id: "m3", text: "단일 종목 비중 30% 이하 유지하기", completed: false }
      ]
    },
    {
      id: "strategy-test",
      title: "2️⃣ 다양한 투자 전략 테스트",
      subTitle: "분할 매수 및 골든크로스 전략 백테스트",
      icon: "🧪",
      desc: "단번에 전액 매수하는 '몰빵 매매'와 3회에 걸친 '분할 매매'의 매입 단가 안정성을 비교 검증합니다.",
      missions: [
        { id: "s1", text: "관심 종목 3분할 매수 주문 실행해보기", completed: false },
        { id: "s2", text: "이동평균선(MA 5 > MA 20) 골든크로스 발생 종목 포착하기", completed: false },
        { id: "s3", text: "전략 검증 매매 일지에 매매 근거 메모 작성하기", completed: false }
      ]
    },
    {
      id: "stock-analysis",
      title: "3️⃣ 종목 분석 역량 향상",
      subTitle: "PER, PBR 및 차트 지표 해독 훈련",
      icon: "📊",
      desc: "기업 가치 지표(PER 15 이하, PBR 1 이하)와 모멘텀 지표(RSI 40 이하 과매도)를 결합하여 저평가 우량주를 발굴합니다.",
      missions: [
        { id: "a1", text: "PER 15 이하의 저평가 종목 1개 이상 발굴하기", completed: false },
        { id: "a2", text: "RSI 과매수(70 이상) 종목 익절 시그널 확인하기", completed: false },
        { id: "a3", text: "업종 섹터별 분산 현황 도넛 차트 확인하기", completed: false }
      ]
    },
    {
      id: "psychology-training",
      title: "4️⃣ 감정 조절 및 심리 훈련",
      subTitle: "급락장 공포 극복 및 뇌동매매 방지",
      icon: "🧘",
      desc: "주가 급락 시 패닉 셀(Panic Sell)을 멈추고 객관적 지표에 근거하여 냉정하게 리밸런싱하는 투자 심리를 훈련합니다.",
      missions: [
        { id: "p1", text: "계좌 손실 발생 시 뇌동매매 멈추고 지표 점검하기", completed: false },
        { id: "p2", text: "단일 종목 리밸런싱 처방 가이드 읽고 실행하기", completed: false },
        { id: "p3", text: "사전 설정한 목표 수익률 도달 시 원칙 분할 매도하기", completed: false }
      ]
    },
    {
      id: "goal-verification",
      title: "5️⃣ 투자 목표 설정 및 검증",
      subTitle: "월간/연간 목표 수익률 달성 퀘스트",
      icon: "🎯",
      desc: "단기 월 +3%, 분기 +8% 등 현실적인 복리 투자 목표를 설정하고 포트폴리오의 실시간 달성도를 추적합니다.",
      missions: [
        { id: "g1", text: "모의투자 첫 100만 원 수익 달성해보기", completed: false },
        { id: "g2", text: "원클릭 일괄 리밸런싱으로 목표 비중 맞추기", completed: false },
        { id: "g3", text: "승률 60% 이상 및 손익비 1.5 이상 달성하기", completed: false }
      ]
    }
  ];

  function getModules() {
    // 현재 계좌 상태를 반영하여 미션 달성 여부 자동 체크
    const summary = TradingEngine.getAccountSummary();
    const account = TradingEngine.getAccountState();

    // 1) 리스크 관리 미션
    PRACTICE_MODULES[0].missions[0].completed = summary.holdingsCount >= 3;
    PRACTICE_MODULES[0].missions[1].completed = account.openOrders.some(o => o.orderType === "STOP_LOSS");
    const maxWeight = Math.max(0, ...Object.values(account.holdings).map(h => {
      const stock = MarketDataEngine.getStockByCode(h.code);
      return (h.qty * (stock ? stock.price : h.avgPrice)) / summary.totalAssets;
    }));
    PRACTICE_MODULES[0].missions[2].completed = summary.holdingsCount >= 3 && maxWeight <= 0.35;

    // 2) 전략 테스트 미션
    PRACTICE_MODULES[1].missions[0].completed = account.tradeHistory.filter(t => t.type === "BUY").length >= 3;
    PRACTICE_MODULES[1].missions[2].completed = account.tradeNotes.length >= 1;

    // 5) 목표 달성 미션
    PRACTICE_MODULES[4].missions[0].completed = summary.totalProfit >= 1000000;

    return PRACTICE_MODULES;
  }

  return {
    getModules
  };
})();

if (typeof window !== "undefined") {
  window.PracticeModesEngine = PracticeModesEngine;
}

