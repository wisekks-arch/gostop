/**
 * StockCraft (스톡크래프트) 리밸런싱 전략 엔진 (rebalancingEngine.js)
 * [옵션 1] 개별 단일 종목에 대한 향후 전망 및 리밸런싱 전략 제시
 * [옵션 2] 전체 보유 종목에 대한 포트폴리오 일괄 리밸런싱 전략 제시
 */

const RebalancingEngine = (() => {
  const CONFIG_STORAGE_KEY = "stockcraft_rebalance_config_v1";

  // 기본 기술적 지표 & 전략 파라미터 표준 프리셋
  const DEFAULT_CONFIG = {
    rsiOverbought: 70,     // 과매수 (익절 검토) 기준 (pt)
    rsiOversold: 40,       // 과매도 (추가매수 검토) 기준 (pt)
    rsiPeriod: 14,         // RSI 계산 기간 (일)
    maShort: 5,            // 단기 이동평균선 (일)
    maMid: 20,             // 중기 이동평균선 (일)
    maLong: 60,            // 장기 이동평균선 (일)
    profitTarget: 15.0,    // 목표 익절 수익률 (%)
    profitSellRatio: 30,   // 분할 익절 매도 비율 (%)
    stopLoss: -8.0,        // 손절 제한선 (%)
    stopLossRatio: 50,     // 손절 매도 비율 (%)
    scaleInDip: -5.0,      // 추가 매수 진입 하락폭 (%)
    maxWeight: 30.0,       // 단일 종목 최대 편중도 제한 (%)
    cashBuffer: 10         // 목표 현금 유동성 비중 (%)
  };

  let activeConfig = { ...DEFAULT_CONFIG };

  function loadConfig() {
    try {
      if (typeof localStorage !== "undefined") {
        const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
        if (saved) {
          activeConfig = { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
        }
      }
    } catch (e) {
      console.warn("리밸런싱 설정 로드 실패:", e);
    }
  }

  function saveConfig(newConfig) {
    activeConfig = { ...activeConfig, ...newConfig };
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(activeConfig));
      }
    } catch (e) {
      console.error("리밸런싱 설정 저장 실패:", e);
    }
    return activeConfig;
  }

  function resetConfig() {
    activeConfig = { ...DEFAULT_CONFIG };
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(CONFIG_STORAGE_KEY);
      }
    } catch (e) {}
    return activeConfig;
  }

  function getConfig() {
    return { ...activeConfig };
  }

  loadConfig();

  // 기본 자산 배분 모델 프리셋
  const ALLOCATION_PRESETS = {
    AGGRESSIVE: {
      name: "공격 성장형 (Aggressive Growth)",
      desc: "고성장 IT/반도체 중심의 수익 극대화 모델",
      targets: {
        "005930": 25, // 삼성전자 25%
        "000660": 25, // SK하이닉스 25%
        "AAPL": 15,   // 애플 15%
        "NVDA": 15,   // 엔비디아 15%
        "005380": 10, // 현대차 10%
        "CASH": 10    // 안전 현금 10%
      }
    },
    BALANCED: {
      name: "중립 균형형 (Balanced Core)",
      desc: "대형 우량주와 성장주의 균형 잡힌 분산 모델",
      targets: {
        "005930": 30, // 삼성전자 30%
        "005380": 20, // 현대차 20%
        "000660": 15, // SK하이닉스 15%
        "MSFT": 15,   // 마이크로소프트 15%
        "CASH": 20    // 현금 버퍼 20%
      }
    },
    DEFENSIVE: {
      name: "안정 방어형 (Defensive Shield)",
      desc: "시장 변동성 방어 및 현금 유동성 확보 모델",
      targets: {
        "005930": 20, // 삼성전자 20%
        "005380": 20, // 현대차 20%
        "AAPL": 15,   // 애플 15%
        "MSFT": 15,   // 마이크로소프트 15%
        "CASH": 30    // 현금 30%
      }
    }
  };

  /**
   * 일봉 캔들스틱 기반 실제 RSI(Relative Strength Index) 정밀 산출
   */
  function calculateRSI(candles, period = 14) {
    if (!candles || candles.length < 2) return 50.0;
    const closes = candles.map(c => c.close).filter(p => typeof p === "number" && !isNaN(p));
    if (closes.length < 2) return 50.0;

    const n = Math.min(period, closes.length - 1);
    if (n < 2) return 50.0;

    const recentCloses = closes.slice(-n - 1);
    let totalGain = 0;
    let totalLoss = 0;

    for (let i = 1; i < recentCloses.length; i++) {
      const diff = recentCloses[i] - recentCloses[i - 1];
      if (diff > 0) {
        totalGain += diff;
      } else {
        totalLoss += Math.abs(diff);
      }
    }

    if (totalLoss === 0) return 100.0;
    if (totalGain === 0) return 0.0;

    const avgGain = totalGain / n;
    const avgLoss = totalLoss / n;
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return Number(rsi.toFixed(1));
  }

  /**
   * 이동평균선(MA) 계산
   */
  function calculateMA(candles, period) {
    if (!candles || candles.length === 0) return 0;
    const closes = candles.map(c => c.close).filter(p => typeof p === "number" && !isNaN(p));
    if (closes.length === 0) return 0;
    const slice = closes.slice(-period);
    const sum = slice.reduce((acc, v) => acc + v, 0);
    return Math.round(sum / slice.length);
  }

  /**
   * ============================================================
   * [옵션 1] 개별 단일 종목 리밸런싱 전략 분석기 (Single Stock Strategy)
   * ============================================================
   */
  function analyzeSingleStock(stockCode) {
    const stock = MarketDataEngine.getStockByCode(stockCode);
    const summary = TradingEngine.getAccountSummary();
    const holding = TradingEngine.getAccountState().holdings[stockCode];

    if (!stock) return null;

    // 현재 보유 현황
    const qty = holding ? holding.qty : 0;
    const avgPrice = holding ? holding.avgPrice : 0;
    const currentPrice = stock.price;
    const evalAmount = qty * currentPrice;
    const profitRate = avgPrice > 0 ? Number((((currentPrice - avgPrice) / avgPrice) * 100).toFixed(2)) : 0;
    const weightInPortfolio = summary.totalAssets > 0 ? Number(((evalAmount / summary.totalAssets) * 100).toFixed(1)) : 0;

    // 1. 실제 일봉 캔들스틱 데이터를 바탕으로 동적 RSI 및 이평선 계산 (설정 파라미터 rsiPeriod, ma 주기 즉시 반영)
    const candles = (typeof MarketDataEngine !== "undefined" && MarketDataEngine.getCandles) 
      ? MarketDataEngine.getCandles(stockCode, "1D") 
      : [];

    let rsi = calculateRSI(candles, activeConfig.rsiPeriod);
    if (isNaN(rsi) || rsi <= 0 || rsi >= 100) {
      rsi = typeof stock.rsi === "number" ? stock.rsi : 50.0;
    }
    stock.rsi = rsi;

    const maShort = calculateMA(candles, activeConfig.maShort);
    const maMid = calculateMA(candles, activeConfig.maMid);
    const maLong = calculateMA(candles, activeConfig.maLong);
    const maDisparity = maMid > 0 ? Number((((currentPrice - maMid) / maMid) * 100).toFixed(1)) : 0;

    let signal = "HOLD"; // BUY, SELL, HOLD, TAKE_PROFIT, STOP_LOSS
    let signalText = "비중 유지 (관망)";
    let outlookScore = 60; // 0 ~ 100
    let outlookDesc = "";
    let actionRecommendation = {};

    // 기술적 지표 & 수익률 기반 전망 판정 로직 (사용자 설정 지표 반영)
    if (rsi >= activeConfig.rsiOverbought) {
      signal = "TAKE_PROFIT";
      signalText = `부분 익절 권고 (RSI ${rsi}pt ≥ 기준 ${activeConfig.rsiOverbought}pt 과매수)`;
      outlookScore = 45;
      outlookDesc = `현재 RSI(${rsi}pt)가 설정된 과매수 기준선(${activeConfig.rsiOverbought}pt)을 초과하여 단기 과열 구간에 진입했습니다. 차익 실현 매물이 출회될 가능성이 높아 분할 매도를 권장합니다.`;
    } else if (rsi <= activeConfig.rsiOversold) {
      signal = "SCALE_IN";
      signalText = `분할 매수 권고 (RSI ${rsi}pt ≤ 기준 ${activeConfig.rsiOversold}pt 과매도)`;
      outlookScore = 80;
      outlookDesc = `RSI(${rsi}pt)가 설정된 과매도 기준선(${activeConfig.rsiOversold}pt) 이하 국면으로, 기술적 반등 및 저가 매수세 유입이 기대되는 침체 구간입니다.`;
    } else {
      signal = "HOLD";
      signalText = "보유 및 추세 관망";
      outlookScore = 65;
      const maDesc = maMid > 0 ? (currentPrice >= maMid ? `생명선(${activeConfig.maMid}일선: ${maMid.toLocaleString()}원) 위에서 견조한 지지` : `생명선(${activeConfig.maMid}일선: ${maMid.toLocaleString()}원) 하회 중 이격도(${maDisparity}%)`) : "추세 대기";
      outlookDesc = `현재 RSI(${rsi}pt) 기준 중립 구간이며, ${maDesc} 흐름을 유지하고 있어 추가 모멘텀 형성을 대기하는 관망 구간입니다.`;
    }

    // 2. 단일 종목 포트폴리오 편중(쏠림도) 진단 (사용자 설정 기준 반영)
    const isOverweight = weightInPortfolio > activeConfig.maxWeight;
    let weightWarning = null;
    if (isOverweight) {
      weightWarning = `⚠️ 총 자산의 ${weightInPortfolio}%가 해당 종목에 집중되어 있어 포트폴리오 변동성 위험이 높습니다. 설정된 최대 한도(${activeConfig.maxWeight}%) 이하로 분산하는 것을 권장합니다.`;
    }

    // 3. 구체적인 실행 처방 (사용자 설정 매매 규칙 반영)
    if (qty > 0) {
      if (profitRate >= activeConfig.profitTarget || signal === "TAKE_PROFIT" || isOverweight) {
        // 비중 축소 / 분할 익절 처방
        const sellRatio = activeConfig.profitSellRatio / 100;
        const targetSellQty = Math.max(1, Math.round(qty * sellRatio));
        const expectedCash = targetSellQty * currentPrice;
        const expectedRealizedProfit = Math.round(targetSellQty * (currentPrice - avgPrice));

        actionRecommendation = {
          type: "SELL",
          actionName: `분할 차익 실현 (${activeConfig.profitSellRatio}%)`,
          recommendedQty: targetSellQty,
          targetPrice: currentPrice,
          expectedCash,
          expectedProfit: expectedRealizedProfit,
          guideMessage: `수익 보존 및 리스크 관리를 위해 보유 수량의 약 ${activeConfig.profitSellRatio}%인 ${targetSellQty}주 매도를 권장합니다. (목표수익률: +${activeConfig.profitTarget}%, 예상 확정 수익: +${expectedRealizedProfit.toLocaleString()}원)`
        };
      } else if (profitRate <= activeConfig.stopLoss) {
        // 손실 방어 / 손절 처방
        const cutRatio = activeConfig.stopLossRatio / 100;
        const cutQty = Math.max(1, Math.round(qty * cutRatio));
        actionRecommendation = {
          type: "SELL",
          actionName: `리스크 방어 손절 (${activeConfig.stopLossRatio}%)`,
          recommendedQty: cutQty,
          targetPrice: currentPrice,
          expectedCash: cutQty * currentPrice,
          expectedProfit: Math.round(cutQty * (currentPrice - avgPrice)),
          guideMessage: `설정된 손절 제한선(${activeConfig.stopLoss}%) 도달에 따라 리스크 관리를 위해 보유 수량의 ${activeConfig.stopLossRatio}%인 ${cutQty}주 비중 축소를 권고합니다.`
        };
      } else {
        // 홀딩 또는 소액 추가 매수
        actionRecommendation = {
          type: "HOLD",
          actionName: "현 포지션 유지",
          recommendedQty: 0,
          targetPrice: currentPrice,
          expectedCash: 0,
          expectedProfit: 0,
          guideMessage: `현재 추세가 유효하므로 기존 보유 수량을 유지하며 목표가 도달 시까지 보유하세요.`
        };
      }
    } else {
      // 신규 매수 가이드
      const buyBudget = summary.availableCashKRW * 0.1; // 가용 자금의 10%
      const buyQty = Math.floor(buyBudget / currentPrice);
      actionRecommendation = {
        type: "BUY",
        actionName: "분할 신규 매수",
        recommendedQty: Math.max(1, buyQty),
        targetPrice: currentPrice,
        expectedCash: Math.max(1, buyQty) * currentPrice,
        expectedProfit: 0,
        guideMessage: `과매도 구간 진입에 따른 1차 분할 매수(${Math.max(1, buyQty)}주)를 추천합니다.`
      };
    }

    return {
      stock,
      holdingInfo: {
        qty,
        avgPrice,
        currentPrice,
        evalAmount,
        profitRate,
        weightInPortfolio
      },
      indicators: {
        rsi,
        maShort,
        maMid,
        maLong,
        maDisparity,
        trend: maDisparity > 2 ? `단기 상승추세 (20일선 대비 +${maDisparity}%)` : (maDisparity < -2 ? `단기 조정국면 (20일선 대비 ${maDisparity}%)` : "중립 횡보 박스권"),
        per: stock.per,
        pbr: stock.pbr
      },
      diagnostics: {
        signal,
        signalText,
        outlookScore,
        outlookDesc,
        isOverweight,
        weightWarning
      },
      actionRecommendation
    };
  }

  /**
   * ============================================================
   * [옵션 2] 전체 보유 종목 포트폴리오 리밸런싱 전략 (Whole Portfolio Strategy)
   * ============================================================
   */
  function analyzePortfolioRebalance(presetKey = "BALANCED", customTargets = null) {
    const summary = TradingEngine.getAccountSummary();
    const accountState = TradingEngine.getAccountState();
    const allStocks = MarketDataEngine.getAllStocks();

    const preset = ALLOCATION_PRESETS[presetKey] || ALLOCATION_PRESETS.BALANCED;
    const initialTargets = customTargets || preset.targets;

    const totalAssets = summary.totalAssets;
    const rebalanceItems = [];
    let totalSellAmount = 0;
    let totalBuyAmount = 0;

    // 1. 현재 계좌 내 종목별 평가 비중 및 괴리율(Drift Rate) 계산
    const currentWeights = {};
    Object.values(accountState.holdings).forEach(h => {
      const stock = MarketDataEngine.getStockByCode(h.code);
      const price = stock ? stock.price : h.avgPrice;
      const evalAmt = h.qty * price;
      currentWeights[h.code] = totalAssets > 0 ? (evalAmt / totalAssets) * 100 : 0;
    });

    // 2. [핵심] 오직 내가 실제로 등록한 보유 종목들만을 100% 분석 대상으로 설정
    const holdingCodes = Object.keys(accountState.holdings);

    if (holdingCodes.length === 0) {
      return {
        presetName: preset.name,
        presetDesc: preset.desc,
        totalAssets,
        cashKRW: accountState.cashKRW,
        totalSellAmount: 0,
        totalBuyAmount: 0,
        netCashImpact: 0,
        items: []
      };
    }

    // 선택된 프리셋 모델에 맞춰 내가 등록한 종목들의 목표 비중 동적 배분
    const targetWeights = {};
    const cashTarget = presetKey === "DEFENSIVE" ? 20 : (presetKey === "AGGRESSIVE" ? 5 : 10);
    targetWeights["CASH"] = cashTarget;

    const stockBudget = 100 - cashTarget;
    const weightPerStock = Number((stockBudget / holdingCodes.length).toFixed(1));
    holdingCodes.forEach((c, idx) => {
      if (idx === holdingCodes.length - 1) {
        targetWeights[c] = Number((stockBudget - weightPerStock * (holdingCodes.length - 1)).toFixed(1));
      } else {
        targetWeights[c] = weightPerStock;
      }
    });

    // 3. 내가 등록한 종목들만 단독 순회 (외부 미등록 종목 100% 배제)
    holdingCodes.forEach(code => {
      const stock = MarketDataEngine.getStockByCode(code);
      if (!stock) return;

      const holding = accountState.holdings[code];
      const curQty = holding ? holding.qty : 0;
      const curPrice = stock.price;
      const curWeight = currentWeights[code] || 0;
      const targetWeight = targetWeights[code] || 0;
      const driftRate = Number((curWeight - targetWeight).toFixed(1)); // 양수: 초과(매도 필요), 음수: 부족(매수 필요)

      const targetAmount = (totalAssets * (targetWeight / 100));
      const currentAmount = curQty * curPrice;
      const diffAmount = targetAmount - currentAmount; // +면 매수, -면 매도

      let action = "MATCH"; // SELL, BUY, MATCH
      let orderQty = 0;

      if (diffAmount < -curPrice * 0.5) {
        // 목표보다 비중이 높아 매도 필요
        action = "SELL";
        orderQty = Math.min(curQty, Math.round(Math.abs(diffAmount) / curPrice));
        totalSellAmount += orderQty * curPrice;
      } else if (diffAmount > curPrice * 0.5) {
        // 목표보다 비중이 낮아 매수 필요
        action = "BUY";
        orderQty = Math.round(diffAmount / curPrice);
        totalBuyAmount += orderQty * curPrice;
      }

      rebalanceItems.push({
        code,
        name: stock.name,
        price: curPrice,
        currentQty: curQty,
        currentWeight: Number(curWeight.toFixed(1)),
        targetWeight: Number(targetWeight.toFixed(1)),
        driftRate,
        action,
        orderQty,
        orderAmount: orderQty * curPrice
      });
    });

    // 괴리율 절대값 큰 순으로 정렬
    rebalanceItems.sort((a, b) => Math.abs(b.driftRate) - Math.abs(a.driftRate));

    return {
      presetName: preset.name,
      presetDesc: preset.desc,
      totalAssets,
      cashKRW: accountState.cashKRW,
      totalSellAmount,
      totalBuyAmount,
      netCashImpact: totalSellAmount - totalBuyAmount,
      items: rebalanceItems
    };
  }

  /**
   * 원클릭 일괄 리밸런싱 실행 (One-Click Batch Execution)
   * 선택된 종목만 필터링 실행 지원 (selectedCodes)
   * 정합성 보장: 매도 주문을 먼저 체결하여 예수금을 확보한 뒤, 매수 주문을 순차 체결
   */
  function executeBatchRebalance(rebalanceAnalysis, selectedCodes = null) {
    const results = [];
    let items = rebalanceAnalysis.items || [];

    // [신규 기능] 선택된 종목들만 필터링하여 리밸런싱 실행
    if (Array.isArray(selectedCodes) && selectedCodes.length > 0) {
      items = items.filter(item => selectedCodes.includes(item.code));
    }

    // 1단계: 초과 종목 매도 일괄 실행 (예수금 확보)
    items.filter(item => item.action === "SELL" && item.orderQty > 0).forEach(item => {
      const res = TradingEngine.submitOrder({
        code: item.code,
        type: "SELL",
        orderType: "MARKET",
        price: item.price,
        qty: item.orderQty
      });
      results.push({ item, res });
    });

    // 2단계: 부족 종목 매수 일괄 실행
    items.filter(item => item.action === "BUY" && item.orderQty > 0).forEach(item => {
      const res = TradingEngine.submitOrder({
        code: item.code,
        type: "BUY",
        orderType: "MARKET",
        price: item.price,
        qty: item.orderQty
      });
      results.push({ item, res });
    });

    return {
      success: true,
      executedCount: results.length,
      details: results
    };
  }

  return {
    ALLOCATION_PRESETS,
    getConfig,
    saveConfig,
    resetConfig,
    calculateRSI,
    calculateMA,
    analyzeSingleStock,
    analyzePortfolioRebalance,
    executeBatchRebalance
  };
})();

if (typeof window !== "undefined") {
  window.RebalancingEngine = RebalancingEngine;
}

