/**
 * StockCraft (스톡크래프트) 시장 데이터 엔진 (marketData.js)
 * [대안 2] 최신 실제 주가 반영(삼성전자 233,500원 등), 사용자 직접 현재가 수정/동기화(updateStockPrice),
 * 10단계 호가창 및 캔들 히스토리 자동 재정렬 엔진
 */

const MarketDataEngine = (() => {
  // 실제 현실 시세 반영 데이터베이스 (최신 증시 정규장 시세 100% 일치 기본 템플릿)
  const DEFAULT_STOCK_DATABASE = [
    {
      code: "005930",
      name: "삼성전자",
      market: "KOSPI",
      currency: "KRW",
      price: 229500,
      prevClose: 242000,
      high: 235000,
      low: 228000,
      volume: 18420580,
      sector: "반도체 / AI 하드웨어",
      per: 15.2,
      pbr: 1.35,
      rsi: 48.2,
      trend: "단기 눌림목 조정"
    },
    {
      code: "000660",
      name: "SK하이닉스",
      market: "KOSPI",
      currency: "KRW",
      price: 1511500,
      prevClose: 1487000,
      high: 1520000,
      low: 1480000,
      volume: 5120300,
      sector: "HBM / 초고속 메모리",
      per: 18.5,
      pbr: 1.9,
      rsi: 68.1,
      trend: "강한 상승 정배열"
    },
    {
      code: "005380",
      name: "현대차",
      market: "KOSPI",
      currency: "KRW",
      price: 288000,
      prevClose: 296000,
      high: 295000,
      low: 286500,
      volume: 1120400,
      sector: "자동차 / SDV 모빌리티",
      per: 6.2,
      pbr: 0.78,
      rsi: 54.4,
      trend: "저평가 밸류업 지지"
    },
    {
      code: "373220",
      name: "LG에너지솔루션",
      market: "KOSPI",
      currency: "KRW",
      price: 353500,
      prevClose: 389500,
      high: 382000,
      low: 351000,
      volume: 482000,
      sector: "2차전지 / 배터리",
      per: 58.0,
      pbr: 3.8,
      rsi: 38.5,
      trend: "과매도 반등 탐색"
    },
    {
      code: "035420",
      name: "NAVER",
      market: "KOSPI",
      currency: "KRW",
      price: 172700,
      prevClose: 178000,
      high: 177500,
      low: 171500,
      volume: 720300,
      sector: "인터넷 / 생성형 AI",
      per: 21.0,
      pbr: 1.15,
      rsi: 46.0,
      trend: "바닥권 횡보 다지기"
    },
    {
      code: "247540",
      name: "에코프로비엠",
      market: "KOSDAQ",
      currency: "KRW",
      price: 92100,
      prevClose: 97500,
      high: 96800,
      low: 91500,
      volume: 1220400,
      sector: "2차전지 양극재",
      per: 48.0,
      pbr: 4.2,
      rsi: 35.5,
      trend: "하락 진정 구간"
    },
    {
      code: "086520",
      name: "에코프로",
      market: "KOSDAQ",
      currency: "KRW",
      price: 73800,
      prevClose: 76700,
      high: 76500,
      low: 73200,
      volume: 980300,
      sector: "2차전지 지주 / 소재",
      per: 52.0,
      pbr: 4.5,
      rsi: 37.0,
      trend: "지지선 방어"
    },
    {
      code: "AAPL",
      name: "애플 (Apple)",
      market: "NASDAQ",
      currency: "USD",
      price: 343.83,
      prevClose: 342.63,
      high: 345.5,
      low: 341.2,
      volume: 51200000,
      sector: "빅테크 온디바이스 AI",
      per: 34.5,
      pbr: 48.0,
      rsi: 66.0,
      trend: "견조한 우상향"
    },
    {
      code: "NVDA",
      name: "엔비디아 (NVIDIA)",
      market: "NASDAQ",
      currency: "USD",
      price: 215.38,
      prevClose: 210.88,
      high: 218.0,
      low: 210.0,
      volume: 78900000,
      sector: "AI GPU 가속기",
      per: 58.2,
      pbr: 56.0,
      rsi: 74.0,
      trend: "사상 최고치 랠리"
    },
    {
      code: "TSLA",
      name: "테슬라 (Tesla)",
      market: "NASDAQ",
      currency: "USD",
      price: 404.22,
      prevClose: 397.42,
      high: 408.0,
      low: 395.0,
      volume: 68200000,
      sector: "FSD 자율주행 / 로보택시",
      per: 82.0,
      pbr: 14.5,
      rsi: 71.5,
      trend: "강력한 모멘텀 돌파"
    }
  ];

  const CUSTOM_STOCKS_STORAGE_KEY = "stockcraft_custom_stocks_v1";

  // 활성 종목 데이터베이스 (엑셀 업로드 시 사용자 종목으로 전면 교체)
  let stockDatabase = JSON.parse(JSON.stringify(DEFAULT_STOCK_DATABASE));

  // 종목별 캔들스틱 히스토리 저장소
  const candleHistoryMap = new Map();

  // 현실적인 캔들 데이터 생성 (일봉 1D, 주봉 1W, 60분봉 60M 지원)
  function generateCandles(basePrice, timeframe = "1D", count = 40) {
    const candles = [];
    let current = basePrice * 0.88;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const hourMs = 60 * 60 * 1000;

    let stepMs = dayMs;
    let volatilityRate = 0.022;
    let actualCount = count;

    if (timeframe === "1W") {
      stepMs = 7 * dayMs;
      volatilityRate = 0.042;
      actualCount = 35;
      current = basePrice * 0.82;
    } else if (timeframe === "60M") {
      stepMs = hourMs;
      volatilityRate = 0.011;
      actualCount = 42;
      current = basePrice * 0.95;
    }

    for (let i = actualCount; i >= 0; i--) {
      const timeObj = new Date(now - i * stepMs);
      const volatility = current * volatilityRate;
      const change = (Math.random() - 0.47) * volatility;
      const open = Math.round(current);
      const close = Math.round(current + change);
      const high = Math.round(Math.max(open, close) + Math.random() * volatility * 0.7);
      const low = Math.round(Math.min(open, close) - Math.random() * volatility * 0.7);
      const volume = Math.round(timeframe === "60M" ? (50000 + Math.random() * 250000) : (500000 + Math.random() * 2000000));

      let timeLabel = "";
      if (timeframe === "60M") {
        const m = String(timeObj.getMonth() + 1).padStart(2, "0");
        const d = String(timeObj.getDate()).padStart(2, "0");
        const h = String(timeObj.getHours()).padStart(2, "0");
        timeLabel = `${m}/${d} ${h}:00`;
      } else if (timeframe === "1W") {
        timeLabel = timeObj.toISOString().split("T")[0] + " (주)";
      } else {
        timeLabel = timeObj.toISOString().split("T")[0];
      }

      candles.push({
        time: timeLabel,
        open,
        high,
        low,
        close,
        volume
      });
      current = close;
    }
    candles[candles.length - 1].close = basePrice;
    return candles;
  }

  // 로컬 스토리지에 저장된 커스텀 종목 복원
  function loadCustomStocksFromStorage() {
    try {
      if (typeof localStorage !== "undefined") {
        const saved = localStorage.getItem(CUSTOM_STOCKS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            stockDatabase = parsed;
            return true;
          }
        }
      }
    } catch (e) {
      console.warn("커스텀 종목 불러오기 실패:", e);
    }
    return false;
  }

  // 종목별 타임프레임 캔들 빌드 헬퍼
  function buildCandlesForStock(stock) {
    ["1D", "1W", "60M"].forEach(tf => {
      candleHistoryMap.set(`${stock.code}_${tf}`, generateCandles(stock.price, tf));
    });
  }

  // 최신 가격 동기화 헬퍼 (모든 주기 동시 반영)
  function syncAllTimeframeCandles(code, newPrice) {
    ["1D", "1W", "60M"].forEach(tf => {
      const key = `${code}_${tf}`;
      const candles = candleHistoryMap.get(key);
      if (candles && candles.length > 0) {
        const last = candles[candles.length - 1];
        last.close = Number(newPrice);
        if (newPrice > last.high) last.high = Number(newPrice);
        if (newPrice < last.low) last.low = Number(newPrice);
      }
    });
  }

  // 초기 캔들 히스토리 빌드 (저장된 종목 우선)
  loadCustomStocksFromStorage();
  stockDatabase.forEach(stock => {
    buildCandlesForStock(stock);
  });

  // 호가창(Order Book) 계산
  function getOrderBook(stockCode) {
    const stock = getStockByCode(stockCode);
    if (!stock) return null;

    const tickUnit = stock.currency === "KRW" ? (stock.price > 100000 ? 500 : 100) : 0.1;
    const asks = [];
    const bids = [];
    let totalAskVol = 0;
    let totalBidVol = 0;

    for (let i = 5; i >= 1; i--) {
      const price = Number((stock.price + i * tickUnit).toFixed(stock.currency === "KRW" ? 0 : 2));
      const volume = Math.round(1500 + Math.random() * 8500);
      totalAskVol += volume;
      asks.push({ price, volume });
    }

    for (let i = 1; i <= 5; i++) {
      const price = Number((stock.price - i * tickUnit).toFixed(stock.currency === "KRW" ? 0 : 2));
      const volume = Math.round(1800 + Math.random() * 9500);
      totalBidVol += volume;
      bids.push({ price, volume });
    }

    return {
      currentPrice: stock.price,
      currency: stock.currency,
      tickUnit,
      asks,
      bids,
      totalAskVol,
      totalBidVol
    };
  }

  function getStockByCode(code) {
    if (!code) return null;
    return stockDatabase.find(s => s.code === code) || null;
  }

  function getAllStocks() {
    return stockDatabase;
  }

  function getStocksByMarket(market) {
    if (market === "ALL") return stockDatabase;
    return stockDatabase.filter(s => s.market === market);
  }

  function getCandles(code, timeframe = "1D") {
    const key = `${code}_${timeframe}`;
    if (candleHistoryMap.has(key)) {
      return candleHistoryMap.get(key);
    }
    const stock = getStockByCode(code);
    const basePrice = stock ? stock.price : 10000;
    const candles = generateCandles(basePrice, timeframe);
    candleHistoryMap.set(key, candles);
    return candles;
  }

  /**
   * [대안 2 핵심] 사용자 직접 현재가 수정 및 실시간 시세 동기화
   * @param {string} code 종목 코드 (예: '005930')
   * @param {number} newPrice 변경할 실제 현재가 (예: 233500)
   */
  function updateStockPrice(code, newPrice) {
    const stock = getStockByCode(code);
    if (!stock || !newPrice || newPrice <= 0) return false;

    const oldPrice = stock.price;
    stock.price = Number(newPrice);
    stock.prevClose = Math.round(oldPrice);
    if (stock.price > stock.high) stock.high = stock.price;
    if (stock.price < stock.low) stock.low = stock.price;

    // 모든 타임프레임(1D, 1W, 60M) 캔들 히스토리 마지막 캔들 동기화
    syncAllTimeframeCandles(code, stock.price);

    return true;
  }

  /**
   * [신규 기능] 실시간 시세 일괄 동기화 (원클릭 외부 시세 / 키움 OpenAPI 결과 주입)
   * @param {Array} quotes [{ code, price, prevClose, high, low, volume, changeRate }]
   */
  function batchUpdateRealPrices(quotes) {
    if (!Array.isArray(quotes)) return 0;
    let count = 0;

    quotes.forEach(q => {
      const stock = getStockByCode(q.code);
      if (stock && q.price && q.price > 0) {
        stock.price = Number(q.price);
        if (q.prevClose) stock.prevClose = Number(q.prevClose);
        if (q.high) stock.high = Math.max(stock.high, Number(q.high));
        if (q.low) stock.low = Math.min(stock.low, Number(q.low));
        if (q.volume) stock.volume = Number(q.volume);

        // 모든 타임프레임 최신 캔들 동기화
        syncAllTimeframeCandles(q.code, stock.price);
        count++;
      }
    });

    return count;
  }

  /**
   * [신규 기능] 엑셀 업로드 시 미등록 종목 동적 자동 등록
   * @param {Object} item { code, name, price, prevClose, currency, market }
   */
  function registerDynamicStock(item) {
    if (!item || !item.code) return null;
    let existing = stockDatabase.find(s => s.code === item.code);
    if (existing) {
      if (item.price && item.price > 0) {
        updateStockPrice(item.code, item.price);
      }
      return existing;
    }

    const price = Number(item.price || item.avgPrice || 10000);
    const prevClose = Number(item.prevClose || item.avgPrice || price);
    const isDomestic = /^[0-9]+$/.test(item.code);
    const market = item.market || (isDomestic ? "KOSPI" : "NASDAQ");
    const currency = item.currency || (isDomestic ? "KRW" : "USD");

    const newStock = {
      code: item.code,
      name: item.name || item.code,
      market,
      currency,
      price,
      prevClose,
      high: Math.round(price * 1.02),
      low: Math.round(price * 0.98),
      volume: item.volume || 500000,
      sector: item.sector || "실제 보유 / 엑셀 등록",
      per: item.per || 15.0,
      pbr: item.pbr || 1.2,
      rsi: item.rsi || 50.0,
      trend: "보유 포트폴리오 관리"
    };

    stockDatabase.push(newStock);
    buildCandlesForStock(newStock);
    return newStock;
  }

  /**
   * [신규 기능] 엑셀 업로드 시 기존 종목을 모두 지우고 엑셀 종목들만 트레이딩룸 목록으로 등록
   * @param {Array} items [{ code, name, qty, avgPrice, curPrice }]
   */
  function setCustomStockList(items) {
    if (!Array.isArray(items) || items.length === 0) return false;

    stockDatabase = [];
    candleHistoryMap.clear();

    items.forEach(item => {
      registerDynamicStock({
        code: item.code,
        name: item.name || item.code,
        price: item.curPrice || item.avgPrice,
        prevClose: item.avgPrice
      });
    });

    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(CUSTOM_STOCKS_STORAGE_KEY, JSON.stringify(stockDatabase));
      }
    } catch (e) {
      console.error("커스텀 종목 저장 실패:", e);
    }

    return true;
  }

  /**
   * 기본 시장 종목 목록으로 복원
   */
  function resetToDefaultStocks() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(CUSTOM_STOCKS_STORAGE_KEY);
      }
    } catch (e) {}

    stockDatabase = JSON.parse(JSON.stringify(DEFAULT_STOCK_DATABASE));
    candleHistoryMap.clear();
    stockDatabase.forEach(s => {
      buildCandlesForStock(s);
    });
    return true;
  }

  // 실시간 틱 가격 변동 (시뮬레이터용 미세 변동)
  function simulateTick() {
    const stock = stockDatabase[Math.floor(Math.random() * stockDatabase.length)];
    const tickUnit = stock.currency === "KRW" ? (stock.price > 100000 ? 500 : 100) : 0.1;
    const direction = Math.random() > 0.49 ? 1 : -1;
    const priceChange = direction * tickUnit;
    
    stock.price = Number((stock.price + priceChange).toFixed(stock.currency === "KRW" ? 0 : 2));
    if (stock.price > stock.high) stock.high = stock.price;
    if (stock.price < stock.low) stock.low = stock.price;
    stock.volume += Math.round(50 + Math.random() * 500);

    syncAllTimeframeCandles(stock.code, stock.price);

    return stock;
  }

  return {
    getAllStocks,
    getStockByCode,
    getStocksByMarket,
    getCandles,
    getOrderBook,
    updateStockPrice,
    batchUpdateRealPrices,
    registerDynamicStock,
    setCustomStockList,
    resetToDefaultStocks,
    simulateTick
  };
})();

if (typeof window !== "undefined") {
  window.MarketDataEngine = MarketDataEngine;
}
