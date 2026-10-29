/**
 * StockCraft (스톡크래프트) 인터랙티브 차트 매니저 (chartManager.js)
 * 고해상도 Canvas 캔들스틱, 이동평균선(MA), 거래량(Volume),
 * [보조선 & 작도 툴킷] 수평 지지/저항선, 자유 추세선, 피보나치 되돌림선,
 * 내 평균 매입단가선, 볼린저 밴드(20, 2) 렌더러
 */

const ChartManager = (() => {
  let canvas = null;
  let ctx = null;
  let currentStockCode = "005930";
  let currentTimeframe = "1D"; // '1D'(일봉), '1W'(주봉), '60M'(60분봉)
  let mousePos = { x: -1, y: -1 };
  let isHovered = false;

  // 보조선 및 작도 상태 관리
  let currentTool = "NONE"; // 'NONE', 'HORIZONTAL', 'TREND', 'FIBONACCI'
  let drawTempStart = null; // 추세선 및 피보나치 시작점 임시 보관
  let drawings = []; // 저장된 작도 객체 목록
  let showBollingerBands = false; // 볼린저 밴드 토글
  let showMyBuyPrice = true; // 내 평단가선 기본 활성

  // 이동평균선 계산 헬퍼
  function calculateMA(candles, period) {
    const ma = [];
    for (let i = 0; i < candles.length; i++) {
      if (i < period - 1) {
        ma.push(null);
      } else {
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += candles[i - j].close;
        }
        ma.push(Math.round(sum / period));
      }
    }
    return ma;
  }

  // 볼린저 밴드 (20일, 2 표준편차) 계산 헬퍼
  function calculateBollingerBands(candles, period = 20, multiplier = 2) {
    const bands = [];
    const ma20 = calculateMA(candles, period);

    for (let i = 0; i < candles.length; i++) {
      if (i < period - 1 || ma20[i] === null) {
        bands.push(null);
      } else {
        let sumSqDiff = 0;
        const mean = ma20[i];
        for (let j = 0; j < period; j++) {
          const diff = candles[i - j].close - mean;
          sumSqDiff += diff * diff;
        }
        const stdDev = Math.sqrt(sumSqDiff / period);
        bands.push({
          upper: Math.round(mean + multiplier * stdDev),
          middle: mean,
          lower: Math.round(mean - multiplier * stdDev)
        });
      }
    }
    return bands;
  }

  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext("2d");

    // 마우스 이벤트 바인딩
    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      mousePos.x = e.clientX - rect.left;
      mousePos.y = e.clientY - rect.top;
      isHovered = true;
      render();
    });

    canvas.addEventListener("mouseleave", () => {
      isHovered = false;
      render();
    });

    // 캔버스 클릭 작도 이벤트
    canvas.addEventListener("click", (e) => {
      handleCanvasClick(e);
    });

    window.addEventListener("resize", () => {
      resizeCanvas();
      render();
    });

    resizeCanvas();
    render();
  }

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    const parent = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;

    const pWidth = parent ? parent.clientWidth : 0;
    const pHeight = parent ? parent.clientHeight : 0;
    const width = pWidth > 50 ? pWidth : 800;
    const height = pHeight > 50 ? pHeight : 480;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  function setStock(code) {
    currentStockCode = code;
    resizeCanvas();
    render();
  }

  /**
   * [신규 기능] 차트 주기(Timeframe: 일봉/주봉/60분봉) 설정
   */
  function setTimeframe(tf) {
    currentTimeframe = tf || "1D";
    render();
  }

  /**
   * 작도 도구 모드 설정
   */
  function setDrawingTool(toolName) {
    currentTool = toolName;
    drawTempStart = null;
    const viewport = canvas ? canvas.parentElement : null;
    if (viewport) {
      if (toolName !== "NONE") {
        viewport.classList.add("drawing-active");
      } else {
        viewport.classList.remove("drawing-active");
      }
    }
    render();
  }

  function toggleBollingerBands() {
    showBollingerBands = !showBollingerBands;
    render();
    return showBollingerBands;
  }

  function toggleMyBuyPrice() {
    showMyBuyPrice = !showMyBuyPrice;
    render();
    return showMyBuyPrice;
  }

  function clearDrawings() {
    drawings = [];
    drawTempStart = null;
    currentTool = "NONE";
    const viewport = canvas ? canvas.parentElement : null;
    if (viewport) viewport.classList.remove("drawing-active");
    render();
  }

  // 마우스 클릭 시 보조선 생성 핸들러
  function handleCanvasClick(e) {
    if (currentTool === "NONE" || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const candles = MarketDataEngine.getCandles(currentStockCode, currentTimeframe);
    if (!candles || candles.length === 0) return;

    const width = rect.width;
    const height = rect.height;
    const mainHeight = height * 0.72;
    const paddingRight = 65;
    const chartWidth = width - paddingRight;

    if (x > chartWidth || y > mainHeight) return;

    // Y좌표 -> 가격 역산출
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    candles.forEach(c => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    });
    const priceRange = maxPrice - minPrice || 1;
    minPrice -= priceRange * 0.05;
    maxPrice += priceRange * 0.05;
    const adjustedRange = maxPrice - minPrice;

    const clickedPrice = Math.round(maxPrice - (y / mainHeight) * adjustedRange);

    // 1. 수평 지지/저항선 (1회 클릭으로 즉시 완성)
    if (currentTool === "HORIZONTAL") {
      drawings.push({
        id: "DW-" + Date.now(),
        type: "HORIZONTAL",
        price: clickedPrice,
        color: "#f0883e"
      });
      setDrawingTool("NONE");
    }
    // 2. 자유 추세선 (2회 클릭 연결)
    else if (currentTool === "TREND") {
      if (!drawTempStart) {
        drawTempStart = { x, y, price: clickedPrice };
      } else {
        drawings.push({
          id: "DW-" + Date.now(),
          type: "TREND",
          x1: drawTempStart.x,
          y1: drawTempStart.y,
          x2: x,
          y2: y,
          price1: drawTempStart.price,
          price2: clickedPrice,
          color: "#58a6ff"
        });
        drawTempStart = null;
        setDrawingTool("NONE");
      }
    }
    // 3. 피보나치 되돌림선 (2회 클릭: 고점 - 저점)
    else if (currentTool === "FIBONACCI") {
      if (!drawTempStart) {
        drawTempStart = { x, y, price: clickedPrice };
      } else {
        const highPrice = Math.max(drawTempStart.price, clickedPrice);
        const lowPrice = Math.min(drawTempStart.price, clickedPrice);
        drawings.push({
          id: "DW-" + Date.now(),
          type: "FIBONACCI",
          highPrice,
          lowPrice
        });
        drawTempStart = null;
        setDrawingTool("NONE");
      }
    }

    render();
  }

  // 메인 렌더링 파이프라인
  function render() {
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || (canvas.parentElement ? canvas.parentElement.clientWidth : 800);
    const height = rect.height || (canvas.parentElement ? canvas.parentElement.clientHeight : 480);

    ctx.clearRect(0, 0, width, height);

    const candles = MarketDataEngine.getCandles(currentStockCode, currentTimeframe);
    if (!candles || candles.length === 0) return;

    const isLight = document.body.classList.contains("light-theme");
    const mainHeight = height * 0.72;
    const volumeHeight = height * 0.22;
    const volumeTop = height * 0.75;
    const paddingRight = 65;

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;

    candles.forEach(c => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVolume) maxVolume = c.volume;
    });

    const priceRange = maxPrice - minPrice || 1;
    minPrice -= priceRange * 0.05;
    maxPrice += priceRange * 0.05;
    const adjustedRange = maxPrice - minPrice;

    // 1. 그리드 배경
    drawGrid(width - paddingRight, mainHeight, volumeTop, volumeHeight, isLight);

    const candleCount = candles.length;
    const chartWidth = width - paddingRight;
    const candleWidth = Math.max((chartWidth / candleCount) * 0.7, 3);
    const stepX = chartWidth / candleCount;

    // 2. 볼린저 밴드 (활성화 시 렌더링)
    if (showBollingerBands) {
      const bb = calculateBollingerBands(candles, 20, 2);
      drawBollingerBands(candles, bb, stepX, minPrice, adjustedRange, mainHeight);
    }

    // 3. 거래량 바 차트
    candles.forEach((c, idx) => {
      const x = idx * stepX + stepX / 2;
      const vH = (c.volume / maxVolume) * volumeHeight;
      const y = height - vH;

      ctx.fillStyle = c.close >= c.open ? "rgba(248, 81, 73, 0.45)" : "rgba(88, 166, 255, 0.45)";
      ctx.fillRect(x - candleWidth / 2, y, candleWidth, vH);
    });

    // 4. 캔들스틱 본체
    candles.forEach((c, idx) => {
      const x = idx * stepX + stepX / 2;
      const isUp = c.close >= c.open;
      const color = isUp ? "#f85149" : "#58a6ff";

      const yOpen = mainHeight - ((c.open - minPrice) / adjustedRange) * mainHeight;
      const yClose = mainHeight - ((c.close - minPrice) / adjustedRange) * mainHeight;
      const yHigh = mainHeight - ((c.high - minPrice) / adjustedRange) * mainHeight;
      const yLow = mainHeight - ((c.low - minPrice) / adjustedRange) * mainHeight;

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.3;

      ctx.beginPath();
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      ctx.fillStyle = color;
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(Math.abs(yClose - yOpen), 2);
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    // 5. 이동평균선 (MA 5, 20, 60)
    const ma5 = calculateMA(candles, 5);
    const ma20 = calculateMA(candles, 20);
    const ma60 = calculateMA(candles, 60);

    drawLine(candles, ma5, stepX, minPrice, adjustedRange, mainHeight, "#d29922");
    drawLine(candles, ma20, stepX, minPrice, adjustedRange, mainHeight, "#f0883e");
    drawLine(candles, ma60, stepX, minPrice, adjustedRange, mainHeight, "#a371f7");

    // 6. [보조선] 내 보유 평균 매입단가선 (황금색 점선 및 뱃지)
    if (showMyBuyPrice) {
      drawMyBuyPriceLine(chartWidth, minPrice, adjustedRange, mainHeight);
    }

    // 7. [보조선] 사용자 작도선 (수평선, 추세선, 피보나치)
    drawUserDrawings(chartWidth, minPrice, adjustedRange, mainHeight);

    // 8. 작도 진행 중 임시선 미리보기
    if (drawTempStart && isHovered && mousePos.x <= chartWidth && mousePos.y <= mainHeight) {
      drawTempPreview(drawTempStart, mousePos, chartWidth, minPrice, adjustedRange, mainHeight);
    }

    // 9. 우측 가격 축
    drawPriceAxis(width, paddingRight, mainHeight, minPrice, maxPrice, isLight);

    // 10. 십자선 마우스 툴팁
    if (isHovered && mousePos.x >= 0 && mousePos.x <= chartWidth && mousePos.y <= height) {
      drawCrosshair(mousePos.x, mousePos.y, chartWidth, height, candles, stepX, isLight);
    }
  }

  // 볼린저 밴드 렌더링
  function drawBollingerBands(candles, bb, stepX, minPrice, adjustedRange, mainHeight) {
    ctx.lineWidth = 1.2;

    // 상단 밴드선
    ctx.strokeStyle = "rgba(163, 113, 247, 0.6)";
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < candles.length; i++) {
      if (!bb[i]) continue;
      const x = i * stepX + stepX / 2;
      const y = mainHeight - ((bb[i].upper - minPrice) / adjustedRange) * mainHeight;
      if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
    }
    ctx.stroke();

    // 하단 밴드선
    ctx.strokeStyle = "rgba(163, 113, 247, 0.6)";
    ctx.beginPath();
    started = false;
    for (let i = 0; i < candles.length; i++) {
      if (!bb[i]) continue;
      const x = i * stepX + stepX / 2;
      const y = mainHeight - ((bb[i].lower - minPrice) / adjustedRange) * mainHeight;
      if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
    }
    ctx.stroke();
  }

  // 내 평균 매입단가선 (황금색 점선 및 수익률 뱃지)
  function drawMyBuyPriceLine(chartWidth, minPrice, adjustedRange, mainHeight) {
    const holding = TradingEngine.getAccountState().holdings[currentStockCode];
    if (!holding || holding.qty <= 0) return;

    const avgPrice = holding.avgPrice;
    const y = mainHeight - ((avgPrice - minPrice) / adjustedRange) * mainHeight;

    if (y < 0 || y > mainHeight) return;

    ctx.strokeStyle = "#e3b341";
    ctx.lineWidth = 1.6;
    ctx.setLineDash([6, 4]);

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(chartWidth, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 평단가 뱃지 렌더링
    const stock = MarketDataEngine.getStockByCode(currentStockCode);
    const pnlRate = stock ? (((stock.price - avgPrice) / avgPrice) * 100).toFixed(1) : "0.0";
    const badgeText = `내 평단: ${avgPrice.toLocaleString()}원 (${pnlRate >= 0 ? '+' : ''}${pnlRate}%)`;

    ctx.fillStyle = "#e3b341";
    ctx.fillRect(8, y - 10, 150, 20);
    ctx.fillStyle = "#0b0e14";
    ctx.font = "bold 10px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(badgeText, 14, y + 4);
  }

  // 사용자 작도선 렌더링
  function drawUserDrawings(chartWidth, minPrice, adjustedRange, mainHeight) {
    drawings.forEach(d => {
      // 수평선
      if (d.type === "HORIZONTAL") {
        const y = mainHeight - ((d.price - minPrice) / adjustedRange) * mainHeight;
        ctx.strokeStyle = d.color || "#f0883e";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(chartWidth, y);
        ctx.stroke();

        // 가격 라벨 뱃지
        ctx.fillStyle = d.color || "#f0883e";
        ctx.fillRect(chartWidth - 65, y - 9, 60, 18);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(d.price.toLocaleString(), chartWidth - 35, y + 4);
      }
      // 추세선
      else if (d.type === "TREND") {
        ctx.strokeStyle = d.color || "#58a6ff";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(d.x1, d.y1);
        ctx.lineTo(d.x2, d.y2);
        ctx.stroke();

        // 시작점 끝점 핸들 점
        ctx.fillStyle = d.color || "#58a6ff";
        ctx.beginPath();
        ctx.arc(d.x1, d.y1, 4, 0, Math.PI * 2);
        ctx.arc(d.x2, d.y2, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      // 피보나치 되돌림선 (0%, 23.6%, 38.2%, 50%, 61.8%, 100%)
      else if (d.type === "FIBONACCI") {
        const diff = d.highPrice - d.lowPrice;
        const levels = [
          { ratio: 1.0, label: "100.0%", color: "#f85149" },
          { ratio: 0.618, label: "61.8%", color: "#d29922" },
          { ratio: 0.5, label: "50.0%", color: "#3fb950" },
          { ratio: 0.382, label: "38.2%", color: "#58a6ff" },
          { ratio: 0.236, label: "23.6%", color: "#a371f7" },
          { ratio: 0.0, label: "0.0%", color: "#f85149" }
        ];

        levels.forEach(lv => {
          const price = d.lowPrice + diff * lv.ratio;
          const y = mainHeight - ((price - minPrice) / adjustedRange) * mainHeight;

          ctx.strokeStyle = lv.color;
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 3]);

          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(chartWidth, y);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = lv.color;
          ctx.font = "10px sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(`Fibo ${lv.label} (${Math.round(price).toLocaleString()})`, 10, y - 4);
        });
      }
    });
  }

  // 임시 작도 미리보기
  function drawTempPreview(start, mouse, chartWidth, minPrice, adjustedRange, mainHeight) {
    ctx.setLineDash([4, 4]);

    if (currentTool === "TREND") {
      ctx.strokeStyle = "#58a6ff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(mouse.x, mouse.y);
      ctx.stroke();
    } else if (currentTool === "FIBONACCI") {
      ctx.strokeStyle = "#a371f7";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, start.y);
      ctx.lineTo(chartWidth, start.y);
      ctx.moveTo(0, mouse.y);
      ctx.lineTo(chartWidth, mouse.y);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  }

  function drawGrid(chartWidth, mainHeight, volumeTop, volumeHeight, isLight) {
    ctx.strokeStyle = isLight ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const y = (mainHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();
    }

    ctx.strokeStyle = isLight ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.12)";
    ctx.beginPath();
    ctx.moveTo(0, volumeTop);
    ctx.lineTo(chartWidth, volumeTop);
    ctx.stroke();
  }

  function drawLine(candles, maList, stepX, minPrice, adjustedRange, mainHeight, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();

    let started = false;
    for (let i = 0; i < candles.length; i++) {
      const val = maList[i];
      if (val === null) continue;

      const x = i * stepX + stepX / 2;
      const y = mainHeight - ((val - minPrice) / adjustedRange) * mainHeight;

      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  function drawPriceAxis(width, paddingRight, mainHeight, minPrice, maxPrice, isLight) {
    const x = width - paddingRight + 8;
    ctx.fillStyle = isLight ? "#59636e" : "#8b949e";
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "left";

    for (let i = 0; i <= 4; i++) {
      const ratio = i / 4;
      const price = maxPrice - (maxPrice - minPrice) * ratio;
      const y = mainHeight * ratio + 4;
      ctx.fillText(Math.round(price).toLocaleString(), x, y);
    }
  }

  function drawCrosshair(mouseX, mouseY, chartWidth, height, candles, stepX, isLight) {
    ctx.strokeStyle = isLight ? "rgba(0, 0, 0, 0.35)" : "rgba(255, 255, 255, 0.3)";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(mouseX, 0);
    ctx.lineTo(mouseX, height);
    ctx.moveTo(0, mouseY);
    ctx.lineTo(chartWidth, mouseY);
    ctx.stroke();
    ctx.setLineDash([]);

    const idx = Math.min(Math.floor(mouseX / stepX), candles.length - 1);
    if (idx >= 0 && idx < candles.length) {
      const target = candles[idx];
      const overlayEl = document.getElementById("chartInfoOverlay");
      if (overlayEl) {
        overlayEl.innerHTML = `
          <strong>${target.time}</strong> | 
          시가: <span>${target.open.toLocaleString()}</span> | 
          고가: <span style="color:#f85149">${target.high.toLocaleString()}</span> | 
          저가: <span style="color:#58a6ff">${target.low.toLocaleString()}</span> | 
          종가: <span style="color:${target.close >= target.open ? '#f85149' : '#58a6ff'}">${target.close.toLocaleString()}</span> | 
          거래량: <span>${target.volume.toLocaleString()}</span>
        `;
      }
    }
  }

  return {
    init,
    resizeCanvas,
    setStock,
    setTimeframe,
    getCurrentTimeframe: () => currentTimeframe,
    setDrawingTool,
    getCurrentDrawingTool: () => currentTool,
    toggleBollingerBands,
    toggleMyBuyPrice,
    clearDrawings,
    render
  };
})();

if (typeof window !== "undefined") {
  window.ChartManager = ChartManager;
}
