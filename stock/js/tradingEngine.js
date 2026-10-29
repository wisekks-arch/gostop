/**
 * StockCraft (스톡크래프트) 가상 주문 및 체결 엔진 (tradingEngine.js)
 * 1억 원 가상 시드머니, 위탁수수료(0.015%), 증권거래세(0.18%),
 * 시장가/지정가/스탑로스 체결 처리 및 실제 보유종목 직접 등록/동기화(importOrUpdateHolding)
 */

const TradingEngine = (() => {
  const STORAGE_KEY = "stockcraft_account_v1";

  // 기본 수수료 및 세율 설정
  const BROKERAGE_FEE_RATE = 0.00015; // 가상 위탁수수료 0.015%
  const TRANSACTION_TAX_RATE = 0.0018; // 증권거래세 0.18% (매도 시 부과)
  const INITIAL_SEED_MONEY_KRW = 100000000; // 가상 시드머니 1억 원

  // 계좌 기본 상태
  let accountState = {
    cashKRW: INITIAL_SEED_MONEY_KRW,
    lockedCashKRW: 0,
    holdings: {},
    openOrders: [],
    tradeHistory: [],
    tradeNotes: [],
    initialCapital: INITIAL_SEED_MONEY_KRW,
    isCustomPortfolio: false
  };

  function loadAccount() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        accountState = JSON.parse(saved);
        if (!accountState.initialCapital) {
          accountState.initialCapital = INITIAL_SEED_MONEY_KRW;
        }
      } else {
        initDefaultHoldings();
        saveAccount();
      }
    } catch (e) {
      console.warn("계좌 불러오기 실패, 기본 계좌로 초기화:", e);
      resetAccount();
    }
  }

  // 초기 데모 포트폴리오 (최신 주가 반영)
  function initDefaultHoldings() {
    accountState.cashKRW = 45000000; // 4천 5백만원 예수금
    accountState.holdings = {
      "005930": {
        code: "005930",
        name: "삼성전자",
        qty: 150,
        avgPrice: 220000, // 매입단가 220,000원 -> 현재가 233,500원 대비 수익 구간
        currency: "KRW"
      },
      "000660": {
        code: "000660",
        name: "SK하이닉스",
        qty: 60,
        avgPrice: 182000,
        currency: "KRW"
      },
      "005380": {
        code: "005380",
        name: "현대차",
        qty: 40,
        avgPrice: 242000,
        currency: "KRW"
      }
    };
  }

  function saveAccount() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accountState));
    } catch (e) {
      console.error("계좌 저장 에러:", e);
    }
  }

  function resetAccount() {
    accountState = {
      cashKRW: INITIAL_SEED_MONEY_KRW,
      lockedCashKRW: 0,
      holdings: {},
      openOrders: [],
      tradeHistory: [],
      tradeNotes: [],
      initialCapital: INITIAL_SEED_MONEY_KRW,
      isCustomPortfolio: false
    };
    initDefaultHoldings();
    saveAccount();
    return accountState;
  }

  /**
   * [대안 2 핵심] 실제 보유 종목 및 매입단가 직접 등록/수정
   * @param {string} code 종목 코드
   * @param {number} qty 보유 수량
   * @param {number} avgPrice 평균 매입단가
   */
  /**
   * [신규 기능] 실제 보유 주식 등록 / 수정 / 엑셀 주입
   * 미등록 종목인 경우 자동으로 MarketDataEngine에 동적 등록 후 안전 주입
   */
  function importOrUpdateHolding(code, qty, avgPrice, optName, optCurPrice) {
    let stock = MarketDataEngine.getStockByCode(code);
    if (!stock) {
      // 미등록 종목 자동 동적 등록
      stock = MarketDataEngine.registerDynamicStock({
        code,
        name: optName || code,
        price: optCurPrice || avgPrice,
        prevClose: avgPrice
      });
    }

    if (!stock) return { success: false, message: "종목 등록에 실패하였습니다." };

    if (qty <= 0) {
      // 수량 0이면 보유 종목에서 삭제
      delete accountState.holdings[code];
      saveAccount();
      return { success: true, message: `${stock.name} 보유 항목이 삭제되었습니다.` };
    }

    accountState.holdings[code] = {
      code,
      name: stock.name,
      qty: Number(qty),
      avgPrice: Number(avgPrice),
      currency: stock.currency
    };
    saveAccount();
    return { success: true, message: `${stock.name} ${qty}주(평단가: ${avgPrice.toLocaleString()}원)가 등록/수정되었습니다.` };
  }

  /**
   * [신규 기능] 기존 보유 주식 전체 삭제 및 엑셀 모드 전환
   */
  function clearHoldings(isCustom = true) {
    accountState.holdings = {};
    accountState.openOrders = [];
    accountState.lockedCashKRW = 0;
    if (isCustom) {
      // 엑셀 업로드 시 기존 가상 예수금 완전 삭제(0원) 및 사용자 자산 단독 모드 가동
      accountState.cashKRW = 0;
      accountState.isCustomPortfolio = true;
    }
    saveAccount();
    return true;
  }

  function calculateTradingCosts(type, price, qty, currency) {
    const totalAmount = price * qty;
    const fee = totalAmount * BROKERAGE_FEE_RATE;
    const tax = type === "SELL" ? totalAmount * TRANSACTION_TAX_RATE : 0;
    return {
      totalAmount,
      fee: currency === "KRW" ? Math.round(fee) : Number(fee.toFixed(2)),
      tax: currency === "KRW" ? Math.round(tax) : Number(tax.toFixed(2)),
      netCost: currency === "KRW" ? Math.round(fee + tax) : Number((fee + tax).toFixed(2))
    };
  }

  function submitOrder(orderParam) {
    const { code, type, orderType, price, qty, stopPrice } = orderParam;
    const stock = MarketDataEngine.getStockByCode(code);
    if (!stock) return { success: false, message: "존재하지 않는 종목입니다." };
    if (!qty || qty <= 0) return { success: false, message: "주문 수량을 1주 이상 입력해 주세요." };

    const execPrice = orderType === "MARKET" ? stock.price : price;
    if (!execPrice || execPrice <= 0) return { success: false, message: "주문 가격이 올바르지 않습니다." };

    const costs = calculateTradingCosts(type, execPrice, qty, stock.currency);

    if (type === "BUY") {
      const requiredCash = costs.totalAmount + costs.fee;
      const availableCash = accountState.cashKRW - accountState.lockedCashKRW;

      if (availableCash < requiredCash) {
        return {
          success: false,
          message: `주문 가능 예수금이 부족합니다. (필요: ${requiredCash.toLocaleString()}원 / 가능: ${availableCash.toLocaleString()}원)`
        };
      }

      if (orderType === "LIMIT") {
        accountState.lockedCashKRW += requiredCash;
      }
    }

    if (type === "SELL") {
      const holding = accountState.holdings[code];
      const availableQty = holding ? holding.qty : 0;

      const pendingSellQty = accountState.openOrders
        .filter(o => o.code === code && o.type === "SELL")
        .reduce((sum, o) => sum + o.qty, 0);

      if (availableQty - pendingSellQty < qty) {
        return {
          success: false,
          message: `매도 가능 보유 수량이 부족합니다. (보유: ${availableQty}주 / 출고대기: ${pendingSellQty}주)`
        };
      }
    }

    const newOrder = {
      orderId: "ORD-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      code,
      name: stock.name,
      type,
      orderType,
      orderPrice: execPrice,
      stopPrice: stopPrice || null,
      qty,
      createdAt: new Date().toISOString(),
      status: "OPEN"
    };

    if (orderType === "MARKET") {
      return executeFilled(newOrder, execPrice);
    } else {
      accountState.openOrders.push(newOrder);
      saveAccount();
      return {
        success: true,
        message: `${stock.name} ${qty}주 ${orderType === "LIMIT" ? "지정가" : "스탑로스"} 주문이 접수되었습니다.`,
        order: newOrder
      };
    }
  }

  function executeFilled(order, filledPrice) {
    const stock = MarketDataEngine.getStockByCode(order.code);
    const costs = calculateTradingCosts(order.type, filledPrice, order.qty, stock.currency);

    if (order.type === "BUY") {
      const totalOutflow = costs.totalAmount + costs.fee;
      if (order.orderType === "LIMIT") {
        accountState.lockedCashKRW = Math.max(0, accountState.lockedCashKRW - (order.orderPrice * order.qty + costs.fee));
      }
      accountState.cashKRW -= totalOutflow;

      if (!accountState.holdings[order.code]) {
        accountState.holdings[order.code] = {
          code: order.code,
          name: stock.name,
          qty: order.qty,
          avgPrice: filledPrice,
          currency: stock.currency
        };
      } else {
        const prev = accountState.holdings[order.code];
        const newTotalQty = prev.qty + order.qty;
        const newTotalCost = prev.qty * prev.avgPrice + order.qty * filledPrice;
        prev.qty = newTotalQty;
        prev.avgPrice = Math.round(newTotalCost / newTotalQty);
      }
    } else if (order.type === "SELL") {
      const netInflow = costs.totalAmount - costs.netCost;
      accountState.cashKRW += netInflow;

      const holding = accountState.holdings[order.code];
      if (holding) {
        holding.qty -= order.qty;
        if (holding.qty <= 0) {
          delete accountState.holdings[order.code];
        }
      }
    }

    order.status = "FILLED";
    order.filledPrice = filledPrice;
    order.filledAt = new Date().toISOString();
    order.costs = costs;

    accountState.openOrders = accountState.openOrders.filter(o => o.orderId !== order.orderId);
    accountState.tradeHistory.unshift(order);

    saveAccount();

    return {
      success: true,
      message: `[체결완료] ${stock.name} ${order.qty}주 ${order.type === "BUY" ? "매수" : "매도"} 체결! (체결가: ${filledPrice.toLocaleString()}원)`,
      order
    };
  }

  function cancelOrder(orderId) {
    const orderIndex = accountState.openOrders.findIndex(o => o.orderId === orderId);
    if (orderIndex === -1) return { success: false, message: "주문을 찾을 수 없습니다." };

    const order = accountState.openOrders[orderIndex];
    if (order.type === "BUY" && order.orderType === "LIMIT") {
      const costs = calculateTradingCosts("BUY", order.orderPrice, order.qty, "KRW");
      accountState.lockedCashKRW = Math.max(0, accountState.lockedCashKRW - (costs.totalAmount + costs.fee));
    }

    accountState.openOrders.splice(orderIndex, 1);
    saveAccount();
    return { success: true, message: `주문 #${orderId.slice(-4)}이 정상 취소되었습니다.` };
  }

  function checkOpenOrders() {
    const filledResults = [];
    const openOrdersCopy = [...accountState.openOrders];

    for (const order of openOrdersCopy) {
      const stock = MarketDataEngine.getStockByCode(order.code);
      if (!stock) continue;

      let shouldFill = false;
      if (order.type === "BUY" && order.orderType === "LIMIT" && stock.price <= order.orderPrice) {
        shouldFill = true;
      } else if (order.type === "SELL" && order.orderType === "LIMIT" && stock.price >= order.orderPrice) {
        shouldFill = true;
      } else if (order.type === "SELL" && order.orderType === "STOP_LOSS" && stock.price <= order.stopPrice) {
        shouldFill = true;
      }

      if (shouldFill) {
        const res = executeFilled(order, stock.price);
        filledResults.push(res);
      }
    }

    return filledResults;
  }

  function getAccountSummary() {
    let stockEvalTotal = 0;
    let totalInvested = 0;

    Object.values(accountState.holdings).forEach(h => {
      const stock = MarketDataEngine.getStockByCode(h.code);
      const curPrice = stock ? stock.price : h.avgPrice;
      const evalValue = curPrice * h.qty;
      const invested = h.avgPrice * h.qty;

      stockEvalTotal += evalValue;
      totalInvested += invested;
    });

    let totalAssets = 0;
    let totalProfit = 0;
    let totalReturnRate = 0;

    if (accountState.isCustomPortfolio) {
      // [엑셀 단독 기준] 총평가자산 = 내가 등록한 종목들의 순수 평가금액
      totalAssets = stockEvalTotal;
      totalProfit = stockEvalTotal - totalInvested;
      totalReturnRate = totalInvested > 0 ? Number(((totalProfit / totalInvested) * 100).toFixed(2)) : 0;
    } else {
      // 기본 모의투자 모드
      totalAssets = accountState.cashKRW + stockEvalTotal;
      totalProfit = totalAssets - accountState.initialCapital;
      totalReturnRate = Number(((totalProfit / accountState.initialCapital) * 100).toFixed(2));
    }

    const stockUnrealizedProfit = stockEvalTotal - totalInvested;
    const stockReturnRate = totalInvested > 0 ? Number(((stockUnrealizedProfit / totalInvested) * 100).toFixed(2)) : 0;

    return {
      cashKRW: accountState.cashKRW,
      lockedCashKRW: accountState.lockedCashKRW,
      availableCashKRW: accountState.cashKRW - accountState.lockedCashKRW,
      stockEvalTotal,
      totalInvested,
      totalAssets,
      totalProfit,
      totalReturnRate,
      stockUnrealizedProfit,
      stockReturnRate,
      isCustomPortfolio: !!accountState.isCustomPortfolio,
      holdingsCount: Object.keys(accountState.holdings).length
    };
  }

  loadAccount();

  return {
    getAccountState: () => accountState,
    getAccountSummary,
    submitOrder,
    cancelOrder,
    checkOpenOrders,
    calculateTradingCosts,
    importOrUpdateHolding,
    clearHoldings,
    resetAccount
  };
})();

if (typeof window !== "undefined") {
  window.TradingEngine = TradingEngine;
}
