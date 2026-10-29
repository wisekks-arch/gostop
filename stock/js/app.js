/**
 * StockCraft (스톡크래프트) 메인 애플리케이션 컨트롤러 (app.js)
 * SPA 탭 전환, 실시간 시세 틱 루프, 다크/화이트 테마 토글,
 * 차트 렌더링 정상화 및 엑셀 업로드 시뮬레이터 연동
 */

document.addEventListener("DOMContentLoaded", () => {
  let currentStockCode = "005930";
  let currentOrderTab = "BUY";
  let currentMarketFilter = "ALL";
  let currentRebalancePreset = "BALANCED";
  let pendingExcelItems = []; // 엑셀 파싱 대기 목록

  function initApp() {
    // 저장된 커스텀 종목(엑셀 등)이 있을 경우 기본 종목 코드 자동 보정
    const allStocks = MarketDataEngine.getAllStocks();
    if (allStocks && allStocks.length > 0) {
      if (!allStocks.some(s => s.code === currentStockCode)) {
        currentStockCode = allStocks[0].code;
      }
    }

    initTheme();
    initNavigationTabs();
    initTradingRoom();
    initChartDrawingTools();
    initOrderForm();
    initRebalancingLab();
    initMarketTicker();
    initPriceEditModal();
    initImportHoldingModal();
    initExcelImporter();
    initKiwoomApiConfig();
    initSyncRealPricesButton();
    updateHeaderAssets();

    // 차트 초기화
    ChartManager.init("tradingChartCanvas");
    ChartManager.setStock(currentStockCode);

    // 실시간 시세 시뮬레이터 루프 (1.2초 주기)
    setInterval(() => {
      MarketDataEngine.simulateTick();
      
      const filledList = TradingEngine.checkOpenOrders();
      if (filledList && filledList.length > 0) {
        filledList.forEach(item => {
          showToast(item.message, "toast-success");
        });
        updateHeaderAssets();
      }

      updateOrderBook();
      updateStockDetailHeader();
      
      // 현재 탭이 트레이딩룸일 때만 차트 렌더링
      const tradingPane = document.getElementById("tabPane-trading");
      if (tradingPane && tradingPane.classList.contains("active")) {
        ChartManager.render();
      }
      updateDashboardMiniView();
    }, 1200);

    renderStockList();
    renderPortfolioView();
    updateDashboardMiniView();
  }

  // ============================================================
  // 테마 관리 (다크 모드 / 화이트 모드)
  // ============================================================
  function initTheme() {
    const savedTheme = localStorage.getItem("stockcraft_theme");
    if (savedTheme === "light") {
      document.body.classList.add("light-theme");
    }

    const btnToggle = document.getElementById("btnThemeToggle");
    if (btnToggle) {
      updateThemeButtonLabel(btnToggle);
      btnToggle.addEventListener("click", () => {
        document.body.classList.toggle("light-theme");
        const isLight = document.body.classList.contains("light-theme");
        localStorage.setItem("stockcraft_theme", isLight ? "light" : "dark");
        updateThemeButtonLabel(btnToggle);

        // 차트 및 도넛 차트 즉시 재렌더링
        ChartManager.render();
        AnalyticsEngine.drawPortfolioDonutChart("portfolioDonutCanvas");
        showToast(`${isLight ? '화이트' : '다크'} 모드로 전환되었습니다.`, "toast-info");
      });
    }
  }

  function updateThemeButtonLabel(btn) {
    const isLight = document.body.classList.contains("light-theme");
    btn.innerHTML = isLight ? "🌙 다크 모드" : "☀️ 화이트 모드";
  }

  // 상단 자산 요약
  function updateHeaderAssets() {
    const summary = TradingEngine.getAccountSummary();
    const elTotal = document.getElementById("headerTotalAssets");
    const elCash = document.getElementById("headerCash");
    const elProfit = document.getElementById("headerProfit");

    if (elTotal) elTotal.textContent = summary.totalAssets.toLocaleString() + "원";
    if (elCash) elCash.textContent = summary.cashKRW.toLocaleString() + "원";
    if (elProfit) {
      const sign = summary.totalProfit >= 0 ? "+" : "";
      elProfit.textContent = `${sign}${summary.totalProfit.toLocaleString()}원 (${sign}${summary.totalReturnRate}%)`;
      elProfit.style.color = summary.totalProfit >= 0 ? "var(--up-red)" : "var(--down-blue)";
    }
  }

  // 탭 네비게이션
  function initNavigationTabs() {
    const tabButtons = document.querySelectorAll(".nav-tab-btn");
    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetTab = btn.getAttribute("data-tab");
        switchTab(targetTab);
      });
    });
  }

  function switchTab(tabId) {
    document.querySelectorAll(".nav-tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));

    const targetBtn = document.querySelector(`.nav-tab-btn[data-tab="${tabId}"]`);
    const targetPane = document.getElementById(`tabPane-${tabId}`);

    if (targetBtn) targetBtn.classList.add("active");
    if (targetPane) targetPane.classList.add("active");

    // [차트 정상화 핵심] 트레이딩룸 탭 활성화 시 차트 크기 재계산 및 렌더링 강제 실행
    if (tabId === "trading") {
      setTimeout(() => {
        ChartManager.resizeCanvas();
        ChartManager.render();
        renderStockList();
      }, 30);
    } else if (tabId === "home") {
      updateDashboardMiniView();
    } else if (tabId === "portfolio") {
      renderPortfolioView();
    } else if (tabId === "rebalance") {
      renderRebalancingView();
    }
    updateHeaderAssets();
  }

  function initMarketTicker() {
    const tickerContainer = document.getElementById("marketTickerBanner");
    if (!tickerContainer) return;

    const indices = [
      { name: "코스피 (KOSPI)", val: "2,612.45", change: "+14.20 (+0.55%)", up: true },
      { name: "코스닥 (KOSDAQ)", val: "745.80", change: "-3.15 (-0.42%)", up: false },
      { name: "S&P 500", val: "5,823.50", change: "+21.10 (+0.36%)", up: true },
      { name: "나스닥 (NASDAQ)", val: "18,518.60", change: "+98.40 (+0.54%)", up: true }
    ];

    tickerContainer.innerHTML = indices.map(idx => `
      <div class="ticker-chip">
        <div class="ticker-name">${idx.name}</div>
        <div class="ticker-val">${idx.val}</div>
        <div class="ticker-change ${idx.up ? 'up' : 'down'}">${idx.change}</div>
      </div>
    `).join("");
  }

  function initTradingRoom() {
    const searchInput = document.getElementById("stockSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const keyword = e.target.value.trim().toLowerCase();
        renderStockList(keyword);
      });
    }

    const filterBtns = document.querySelectorAll(".market-filter-btn");
    filterBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        filterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentMarketFilter = btn.getAttribute("data-market");
        renderStockList();
      });
    });

    // [신규 기능] 차트 주기(일봉 1D / 주봉 1W / 60분봉 60M) 전환 이벤트 바인딩
    const timeframeBtns = document.querySelectorAll(".timeframe-btn[data-timeframe]");
    timeframeBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        timeframeBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const tf = btn.getAttribute("data-timeframe") || "1D";
        ChartManager.setTimeframe(tf);
        const tfName = tf === "1W" ? "주봉 (1W)" : (tf === "60M" ? "60분봉 (60M)" : "일봉 (1D)");
        showToast(`차트 주기가 '${tfName}'으로 전환되었습니다.`, "toast-info");

        // 실제 증시 API 데이터 최신 동기화 요청
        if (currentStockCode) {
          MarketDataEngine.loadRealCandlesAsync(currentStockCode, tf, () => {
            ChartManager.render();
            updateStockDetailHeader();
          });
        }
      });
    });

    // [신규 기능] 차트 크게보기(+) / 작게보기(-) / 기본배율(100%) 줌 버튼 이벤트 바인딩
    const btnZoomIn = document.getElementById("btnZoomIn");
    const btnZoomOut = document.getElementById("btnZoomOut");
    const btnZoomReset = document.getElementById("btnZoomReset");

    if (btnZoomIn) {
      btnZoomIn.addEventListener("click", () => {
        const pct = ChartManager.zoomIn();
        showToast(`차트 확대 (크게보기): ${pct}%`, "toast-info");
      });
    }

    if (btnZoomOut) {
      btnZoomOut.addEventListener("click", () => {
        const pct = ChartManager.zoomOut();
        showToast(`차트 축소 (작게보기): ${pct}%`, "toast-info");
      });
    }

    if (btnZoomReset) {
      btnZoomReset.addEventListener("click", () => {
        const pct = ChartManager.resetZoom();
        showToast(`차트 기본 배율 복원: ${pct}%`, "toast-info");
      });
    }
  }

  // ============================================================
  // [신규 기능] 차트 보조선 및 작도 툴킷 이벤트 바인딩
  // ============================================================
  function initChartDrawingTools() {
    const btnHorizontal = document.getElementById("btnDrawHorizontal");
    const btnTrend = document.getElementById("btnDrawTrend");
    const btnFibo = document.getElementById("btnDrawFibo");
    const btnBollinger = document.getElementById("btnToggleBollinger");
    const btnMyPrice = document.getElementById("btnToggleMyPrice");
    const btnClear = document.getElementById("btnClearDrawings");

    const modeButtons = [btnHorizontal, btnTrend, btnFibo].filter(Boolean);

    function clearActiveModes() {
      modeButtons.forEach(btn => btn.classList.remove("active"));
    }

    if (btnHorizontal) {
      btnHorizontal.addEventListener("click", () => {
        const isCurrentlyActive = btnHorizontal.classList.contains("active");
        clearActiveModes();
        if (!isCurrentlyActive) {
          btnHorizontal.classList.add("active");
          ChartManager.setDrawingTool("HORIZONTAL");
          showToast("차트를 클릭하여 수평 지지/저항선을 그립니다.", "toast-info");
        } else {
          ChartManager.setDrawingTool("NONE");
        }
      });
    }

    if (btnTrend) {
      btnTrend.addEventListener("click", () => {
        const isCurrentlyActive = btnTrend.classList.contains("active");
        clearActiveModes();
        if (!isCurrentlyActive) {
          btnTrend.classList.add("active");
          ChartManager.setDrawingTool("TREND");
          showToast("차트에서 시작점과 끝점을 차례로 클릭하여 추세선을 그립니다.", "toast-info");
        } else {
          ChartManager.setDrawingTool("NONE");
        }
      });
    }

    if (btnFibo) {
      btnFibo.addEventListener("click", () => {
        const isCurrentlyActive = btnFibo.classList.contains("active");
        clearActiveModes();
        if (!isCurrentlyActive) {
          btnFibo.classList.add("active");
          ChartManager.setDrawingTool("FIBONACCI");
          showToast("차트의 고점과 저점을 차례로 클릭하여 피보나치 되돌림선을 그립니다.", "toast-info");
        } else {
          ChartManager.setDrawingTool("NONE");
        }
      });
    }

    if (btnBollinger) {
      btnBollinger.addEventListener("click", () => {
        const active = ChartManager.toggleBollingerBands();
        btnBollinger.classList.toggle("active", active);
        showToast(active ? "볼린저 밴드(20, 2)가 활성화되었습니다." : "볼린저 밴드가 비활성화되었습니다.", "toast-info");
      });
    }

    if (btnMyPrice) {
      // 기본적으로 평단가선이 켜져 있으므로 active 클래스 유지
      btnMyPrice.classList.add("active");
      btnMyPrice.addEventListener("click", () => {
        const active = ChartManager.toggleMyBuyPrice();
        btnMyPrice.classList.toggle("active", active);
        showToast(active ? "내 평균 매입단가선이 표시됩니다." : "내 평균 매입단가선이 숨겨졌습니다.", "toast-info");
      });
    }

    if (btnClear) {
      btnClear.addEventListener("click", () => {
        ChartManager.clearDrawings();
        clearActiveModes();
        showToast("모든 보조선 작도가 초기화되었습니다.", "toast-info");
      });
    }

    // 차트 클릭 시 작도가 완료되어 NONE으로 돌아가면 버튼 active 해제
    const canvas = document.getElementById("tradingChartCanvas");
    if (canvas) {
      canvas.addEventListener("click", () => {
        setTimeout(() => {
          if (ChartManager.getCurrentDrawingTool && ChartManager.getCurrentDrawingTool() === "NONE") {
            clearActiveModes();
          }
        }, 50);
      });
    }
  }

  function renderStockList(keyword = "") {
    const listContainer = document.getElementById("stockListScroll");
    if (!listContainer) return;

    let stocks = MarketDataEngine.getStocksByMarket(currentMarketFilter);
    if (keyword) {
      stocks = stocks.filter(s => s.name.toLowerCase().includes(keyword) || s.code.toLowerCase().includes(keyword));
    }

    listContainer.innerHTML = stocks.map(s => {
      const isSelected = s.code === currentStockCode;
      const isUp = s.price >= s.prevClose;
      const changeRate = (((s.price - s.prevClose) / s.prevClose) * 100).toFixed(2);
      const sign = isUp ? "+" : "";

      return `
        <div class="stock-list-item ${isSelected ? 'selected' : ''}" data-code="${s.code}">
          <div class="item-left">
            <div class="stock-name">${s.name}</div>
            <div class="stock-code">${s.code} · ${s.market}</div>
          </div>
          <div class="item-right">
            <div class="stock-price" style="color: ${isUp ? 'var(--up-red)' : 'var(--down-blue)'}">
              ${s.price.toLocaleString()} ${s.currency}
            </div>
            <div class="stock-rate" style="color: ${isUp ? 'var(--up-red)' : 'var(--down-blue)'}">
              ${sign}${changeRate}%
            </div>
          </div>
        </div>
      `;
    }).join("");

    listContainer.querySelectorAll(".stock-list-item").forEach(item => {
      item.addEventListener("click", () => {
        const code = item.getAttribute("data-code");
        selectStock(code);
      });
    });
  }

  function selectStock(code) {
    const all = MarketDataEngine.getAllStocks();
    if (!code || !MarketDataEngine.getStockByCode(code)) {
      code = (all.length > 0) ? all[0].code : "005930";
    }
    currentStockCode = code;
    renderStockList();
    updateStockDetailHeader();
    updateOrderBook();
    ChartManager.setStock(code);

    // [신규 기능] 선택된 종목의 실제 금융 API 캔들 비동기 확인 및 최신화
    const curTf = ChartManager.getCurrentTimeframe ? ChartManager.getCurrentTimeframe() : "1D";
    MarketDataEngine.loadRealCandlesAsync(code, curTf, () => {
      ChartManager.render();
      updateStockDetailHeader();
    });

    const stock = MarketDataEngine.getStockByCode(code);
    const priceInput = document.getElementById("orderPriceInput");
    if (priceInput && stock) {
      priceInput.value = stock.price;
      updateOrderEstimate();
    }
  }

  function updateStockDetailHeader() {
    const stock = MarketDataEngine.getStockByCode(currentStockCode);
    if (!stock) return;

    const elName = document.getElementById("chartStockName");
    const elCode = document.getElementById("chartStockCode");
    const elPrice = document.getElementById("chartStockPrice");
    const elChange = document.getElementById("chartStockChange");

    const isUp = stock.price >= stock.prevClose;
    const diff = stock.price - stock.prevClose;
    const rate = (((diff) / stock.prevClose) * 100).toFixed(2);
    const sign = isUp ? "+" : "";

    if (elName) elName.textContent = stock.name;
    if (elCode) elCode.textContent = `${stock.code} · ${stock.market} (${stock.sector})`;
    if (elPrice) {
      elPrice.textContent = `${stock.price.toLocaleString()} ${stock.currency}`;
      elPrice.style.color = isUp ? "var(--up-red)" : "var(--down-blue)";
    }
    if (elChange) {
      elChange.textContent = `${sign}${diff.toLocaleString()} (${sign}${rate}%)`;
      elChange.style.color = isUp ? "var(--up-red)" : "var(--down-blue)";
    }
  }

  function updateOrderBook() {
    const ob = MarketDataEngine.getOrderBook(currentStockCode);
    if (!ob) return;

    const asksTbody = document.getElementById("orderBookAsks");
    const bidsTbody = document.getElementById("orderBookBids");
    if (!asksTbody || !bidsTbody) return;

    const maxVol = Math.max(...ob.asks.map(a => a.volume), ...ob.bids.map(b => b.volume)) || 1;

    asksTbody.innerHTML = ob.asks.map(a => {
      const barWidth = Math.min(100, Math.round((a.volume / maxVol) * 100));
      return `
        <tr class="ask-row" data-price="${a.price}">
          <td class="ask-price">${a.price.toLocaleString()}</td>
          <td class="ask-vol">
            <span class="depth-bar ask" style="width: ${barWidth}%"></span>
            ${a.volume.toLocaleString()}
          </td>
        </tr>
      `;
    }).join("");

    bidsTbody.innerHTML = ob.bids.map(b => {
      const barWidth = Math.min(100, Math.round((b.volume / maxVol) * 100));
      return `
        <tr class="bid-row" data-price="${b.price}">
          <td class="bid-price">${b.price.toLocaleString()}</td>
          <td class="bid-vol">
            <span class="depth-bar bid" style="width: ${barWidth}%"></span>
            ${b.volume.toLocaleString()}
          </td>
        </tr>
      `;
    }).join("");

    document.querySelectorAll(".order-book-table tr").forEach(row => {
      row.addEventListener("click", () => {
        const p = row.getAttribute("data-price");
        if (p) {
          const priceInput = document.getElementById("orderPriceInput");
          if (priceInput) {
            priceInput.value = p;
            updateOrderEstimate();
          }
        }
      });
    });
  }

  function initOrderForm() {
    const buyTab = document.getElementById("tabOrderBuy");
    const sellTab = document.getElementById("tabOrderSell");
    const submitBtn = document.getElementById("btnOrderSubmit");
    const orderTypeSelect = document.getElementById("orderTypeSelect");
    const priceInput = document.getElementById("orderPriceInput");
    const qtyInput = document.getElementById("orderQtyInput");
    const stopPriceGroup = document.getElementById("stopPriceGroup");
    const stopPriceInput = document.getElementById("orderStopPriceInput");

    if (buyTab && sellTab) {
      buyTab.addEventListener("click", () => {
        currentOrderTab = "BUY";
        buyTab.classList.add("active-buy");
        sellTab.classList.remove("active-sell");
        if (submitBtn) {
          submitBtn.className = "btn-order-submit btn-buy";
          submitBtn.textContent = "매수 주문 실행";
        }
        updateOrderEstimate();
      });

      sellTab.addEventListener("click", () => {
        currentOrderTab = "SELL";
        sellTab.classList.add("active-sell");
        buyTab.classList.remove("active-buy");
        if (submitBtn) {
          submitBtn.className = "btn-order-submit btn-sell";
          submitBtn.textContent = "매도 주문 실행";
        }
        updateOrderEstimate();
      });
    }

    if (orderTypeSelect) {
      orderTypeSelect.addEventListener("change", (e) => {
        const type = e.target.value;
        if (stopPriceGroup) {
          stopPriceGroup.style.display = type === "STOP_LOSS" ? "block" : "none";
        }
        if (priceInput) {
          priceInput.disabled = type === "MARKET";
          if (type === "MARKET") {
            const stock = MarketDataEngine.getStockByCode(currentStockCode);
            priceInput.value = stock ? stock.price : "";
          }
        }
        updateOrderEstimate();
      });
    }

    if (priceInput) priceInput.addEventListener("input", updateOrderEstimate);
    if (qtyInput) qtyInput.addEventListener("input", updateOrderEstimate);

    document.querySelectorAll(".percent-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const percent = parseFloat(chip.getAttribute("data-pct")) / 100;
        const stock = MarketDataEngine.getStockByCode(currentStockCode);
        const curPrice = parseFloat(priceInput.value) || (stock ? stock.price : 1);

        if (currentOrderTab === "BUY") {
          const summary = TradingEngine.getAccountSummary();
          const budget = summary.availableCashKRW * percent;
          const calculatedQty = Math.floor(budget / curPrice);
          if (qtyInput) qtyInput.value = Math.max(1, calculatedQty);
        } else {
          const holding = TradingEngine.getAccountState().holdings[currentStockCode];
          const availableQty = holding ? holding.qty : 0;
          const calculatedQty = Math.floor(availableQty * percent);
          if (qtyInput) qtyInput.value = Math.max(1, calculatedQty);
        }
        updateOrderEstimate();
      });
    });

    if (submitBtn) {
      submitBtn.addEventListener("click", () => {
        const orderType = orderTypeSelect ? orderTypeSelect.value : "MARKET";
        const price = parseFloat(priceInput.value);
        const qty = parseInt(qtyInput.value, 10);
        const stopPrice = stopPriceInput ? parseFloat(stopPriceInput.value) : null;

        const res = TradingEngine.submitOrder({
          code: currentStockCode,
          type: currentOrderTab,
          orderType,
          price,
          qty,
          stopPrice
        });

        if (res.success) {
          showToast(res.message, "toast-success");
          updateHeaderAssets();
          updateOrderBook();
          renderPortfolioView();
        } else {
          showToast(res.message, "toast-error");
        }
      });
    }
  }

  function updateOrderEstimate() {
    const priceInput = document.getElementById("orderPriceInput");
    const qtyInput = document.getElementById("orderQtyInput");
    const stock = MarketDataEngine.getStockByCode(currentStockCode);
    const summaryEl = document.getElementById("orderFeeSummary");
    if (!summaryEl || !stock) return;

    const price = parseFloat(priceInput.value) || stock.price;
    const qty = parseInt(qtyInput.value, 10) || 0;

    const costs = TradingEngine.calculateTradingCosts(currentOrderTab, price, qty, stock.currency);

    summaryEl.innerHTML = `
      <div>주문 총액: <strong>${costs.totalAmount.toLocaleString()}원</strong></div>
      <div>위탁수수료(0.015%): ${costs.fee.toLocaleString()}원 | 증권거래세(0.18%): ${costs.tax.toLocaleString()}원</div>
      <div>최종 정산 예상액: <strong style="color: ${currentOrderTab === 'BUY' ? 'var(--up-red)' : 'var(--down-blue)'}">
        ${(currentOrderTab === 'BUY' ? costs.totalAmount + costs.fee : costs.totalAmount - costs.netCost).toLocaleString()}원
      </strong></div>
    `;
  }

  // 현재가 직접 수정 모달
  function initPriceEditModal() {
    const modal = document.getElementById("modalEditPrice");
    const btnOpen = document.getElementById("btnOpenEditPriceModal");
    const btnClose = document.getElementById("btnCloseEditPriceModal");
    const btnCancel = document.getElementById("btnCancelEditPrice");
    const btnSave = document.getElementById("btnSaveNewPrice");
    const inputVal = document.getElementById("inputNewPriceValue");
    const modalTitle = document.getElementById("modalEditPriceTitle");

    if (btnOpen) {
      btnOpen.addEventListener("click", () => {
        const stock = MarketDataEngine.getStockByCode(currentStockCode);
        if (stock) {
          if (modalTitle) modalTitle.textContent = `${stock.name} (${stock.code}) 실제 현재가 직접 수정`;
          if (inputVal) inputVal.value = stock.price;
        }
        if (modal) modal.classList.add("active");
      });
    }

    const closeModal = () => {
      if (modal) modal.classList.remove("active");
    };

    if (btnClose) btnClose.addEventListener("click", closeModal);
    if (btnCancel) btnCancel.addEventListener("click", closeModal);

    if (btnSave) {
      btnSave.addEventListener("click", () => {
        const newPrice = parseFloat(inputVal.value);
        if (!newPrice || newPrice <= 0) {
          showToast("유효한 현재가를 입력해 주세요.", "toast-error");
          return;
        }

        const success = MarketDataEngine.updateStockPrice(currentStockCode, newPrice);
        if (success) {
          const stock = MarketDataEngine.getStockByCode(currentStockCode);
          showToast(`${stock.name} 실제 현재가가 ${newPrice.toLocaleString()}원으로 동기화되었습니다!`, "toast-success");
          closeModal();
          
          updateStockDetailHeader();
          updateOrderBook();
          ChartManager.render();
          renderStockList();
          updateHeaderAssets();
          renderPortfolioView();
          renderRebalancingView();
        }
      });
    }
  }

  // 실제 보유 주식 등록 모달
  function initImportHoldingModal() {
    const modal = document.getElementById("modalImportHolding");
    const btnOpenHeader = document.getElementById("btnOpenImportHoldingModal");
    const btnOpenPort = document.getElementById("btnPortfolioImportHolding");
    const btnClose = document.getElementById("btnCloseImportModal");
    const btnCancel = document.getElementById("btnCancelImport");
    const btnSave = document.getElementById("btnSaveImportHolding");
    const selectStock = document.getElementById("selectImportStock");
    const inputQty = document.getElementById("inputImportQty");
    const inputAvg = document.getElementById("inputImportAvgPrice");

    if (selectStock) {
      const allStocks = MarketDataEngine.getAllStocks();
      selectStock.innerHTML = allStocks.map(s => `
        <option value="${s.code}">${s.name} (${s.code} · ${s.market}) - 현재가: ${s.price.toLocaleString()}원</option>
      `).join("");

      selectStock.addEventListener("change", () => {
        const selCode = selectStock.value;
        const stock = MarketDataEngine.getStockByCode(selCode);
        const holding = TradingEngine.getAccountState().holdings[selCode];
        if (holding) {
          if (inputQty) inputQty.value = holding.qty;
          if (inputAvg) inputAvg.value = holding.avgPrice;
        } else if (stock) {
          if (inputQty) inputQty.value = 100;
          if (inputAvg) inputAvg.value = Math.round(stock.price * 0.96);
        }
      });
    }

    const openModal = () => {
      if (selectStock) {
        selectStock.value = currentStockCode;
        selectStock.dispatchEvent(new Event("change"));
      }
      if (modal) modal.classList.add("active");
    };

    if (btnOpenHeader) btnOpenHeader.addEventListener("click", openModal);
    if (btnOpenPort) btnOpenPort.addEventListener("click", openModal);

    const closeModal = () => {
      if (modal) modal.classList.remove("active");
    };

    if (btnClose) btnClose.addEventListener("click", closeModal);
    if (btnCancel) btnCancel.addEventListener("click", closeModal);

    if (btnSave) {
      btnSave.addEventListener("click", () => {
        const code = selectStock.value;
        const qty = parseInt(inputQty.value, 10);
        const avgPrice = parseFloat(inputAvg.value);

        if (isNaN(qty) || qty < 0 || isNaN(avgPrice) || avgPrice <= 0) {
          showToast("수량과 평균단가를 올바르게 입력해 주세요.", "toast-error");
          return;
        }

        const res = TradingEngine.importOrUpdateHolding(code, qty, avgPrice);
        if (res.success) {
          showToast(res.message, "toast-success");
          closeModal();
          updateHeaderAssets();
          renderPortfolioView();
          renderRebalancingView();
        } else {
          showToast(res.message, "toast-error");
        }
      });
    }
  }

  // ============================================================
  // [신규 코너] 실제 주식 엑셀/CSV 업로드 & 시뮬레이터 연동
  // ============================================================
  function initExcelImporter() {
    const btnDownload = document.getElementById("btnDownloadSampleExcel");
    const dropZone = document.getElementById("excelDropZone");
    const fileInput = document.getElementById("inputExcelFile");
    const btnSelectFile = document.getElementById("btnSelectExcelFile");
    const previewSection = document.getElementById("excelPreviewSection");
    const previewTable = document.getElementById("excelPreviewTableBody");
    const countEl = document.getElementById("excelParsedCount");
    const btnApply = document.getElementById("btnApplyExcelHoldings");

    if (btnDownload) {
      btnDownload.addEventListener("click", () => {
        ExcelImporter.downloadSampleCSV();
        showToast("샘플 엑셀(CSV) 양식이 다운로드되었습니다.", "toast-info");
      });
    }

    if (btnSelectFile && fileInput) {
      btnSelectFile.addEventListener("click", (e) => {
        e.stopPropagation();
        fileInput.click();
      });
    }

    if (dropZone && fileInput) {
      dropZone.addEventListener("click", () => fileInput.click());

      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
      });

      dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragover");
      });

      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
        if (e.dataTransfer.files.length > 0) {
          handleExcelFile(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
          handleExcelFile(e.target.files[0]);
        }
      });
    }

    function handleExcelFile(file) {
      // 신규 파일 파싱 전 이전 미리보기 및 대기 목록 완전 초기화
      pendingExcelItems = [];
      if (previewTable) previewTable.innerHTML = "";
      if (countEl) countEl.textContent = "0";

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const items = ExcelImporter.parseCSV(content);
          pendingExcelItems = items;

          // 신규 파싱 목록만 단독 렌더링
          if (countEl) countEl.textContent = `${items.length} (적용 대기)`;
          if (previewTable) {
            previewTable.innerHTML = items.map(item => {
              const totalVal = item.qty * item.curPrice;
              return `
                <tr>
                  <td class="text-center"><strong>${item.code}</strong></td>
                  <td class="text-left"><strong>${item.name}</strong></td>
                  <td class="text-right">${item.qty.toLocaleString()}주</td>
                  <td class="text-right">${item.avgPrice.toLocaleString()}원</td>
                  <td class="text-right"><strong style="color: var(--accent-blue);">${item.curPrice.toLocaleString()}원</strong></td>
                  <td class="text-right"><strong>${totalVal.toLocaleString()}원</strong></td>
                </tr>
              `;
            }).join("");
          }

          if (previewSection) previewSection.style.display = "block";
          showToast(`엑셀 파일에서 ${items.length}개 종목을 성공적으로 읽어왔습니다!`, "toast-success");
        } catch (err) {
          showToast(err.message, "toast-error");
        }
      };
      reader.readAsText(file, "utf-8");
    }

    if (btnApply) {
      btnApply.addEventListener("click", () => {
        if (pendingExcelItems.length === 0) {
          showToast("적용할 엑셀 데이터가 없습니다.", "toast-error");
          return;
        }

        const res = ExcelImporter.importHoldings(pendingExcelItems, { replaceAll: true });
        if (res.success) {
          if (countEl) countEl.textContent = `${res.count} (내 계좌에 100% 단독 적용 완료)`;
          showToast(`기존 주식이 모두 삭제되고 엑셀의 ${res.count}개 종목만 단독 등록되었습니다!`, "toast-success");
          
          // [5대 전 화면 동시 동기화 파이프라인]
          // 1. 트레이딩룸 좌측 종목 목록 갱신 (기존 10개 종목 완전 삭제 후 엑셀 종목만 단독 출력)
          renderStockList();

          // 2. 엑셀의 첫 번째 종목을 차트/호가창 기본 종목으로 자동 선택 & 헤더 동기화
          if (res.firstCode) {
            selectStock(res.firstCode);
          }

          // 3. 상단 헤더 자산 현황 즉시 갱신
          updateHeaderAssets();
          
          // 4. 메인페이지 (홈/대시보드) 미니 포트폴리오 위젯 즉시 갱신 (엑셀 주식만 단독 출력)
          updateDashboardMiniView();
          
          // 5. 포트폴리오 분석 잔고현황 & 도넛차트 즉시 갱신 (엑셀 주식만 단독 출력)
          renderPortfolioView();
          
          // 6. 리밸런싱 전략실 처방 및 종목 정렬 즉시 갱신 (엑셀 주식만 단독 출력)
          renderRebalancingView();

          // 즉시 리밸런싱 전략실 탭으로 전환하여 처방 제시!
          switchTab("rebalance");
        }
      });
    }
  }

  // ============================================================
  // [신규 기능] 원클릭 실시간 시세 일괄 동기화 (네이버/야후/키움)
  // ============================================================
  function initSyncRealPricesButton() {
    const btnSync = document.getElementById("btnSyncAllMarketPrices");
    if (!btnSync) return;

    btnSync.addEventListener("click", async () => {
      const originalText = btnSync.innerHTML;
      btnSync.disabled = true;
      btnSync.innerHTML = "⏳ 시세 동기화 중...";

      showToast("국내/해외 최신 시장 시세(네이버/야후/키움)를 수신하는 중입니다...", "toast-info");

      try {
        const res = await KiwoomApiManager.syncAllMarketPrices((cur, total, name) => {
          btnSync.innerHTML = `⏳ 동기화 (${cur}/${total})`;
        });

        renderStockList();
        updateStockDetailHeader();
        updateOrderBook();
        ChartManager.render();
        updateHeaderAssets();
        renderPortfolioView();
        renderRebalancingView();

        showToast(`✅ ${res.successCount}개 종목의 최신 실시간 시장 시세가 성공적으로 동기화되었습니다!`, "toast-success");
      } catch (err) {
        console.error("시세 동기화 실패:", err);
        showToast("시세 동기화 중 오류가 발생했습니다: " + err.message, "toast-error");
      } finally {
        btnSync.disabled = false;
        btnSync.innerHTML = originalText;
      }
    });
  }

  // ============================================================
  // [신규 기능] 키움증권 REST OpenAPI 연동 설정 모달
  // ============================================================
  function initKiwoomApiConfig() {
    const modal = document.getElementById("modalKiwoomConfig");
    const btnOpen = document.getElementById("btnOpenKiwoomModal");
    const btnClose = document.getElementById("btnCloseKiwoomModal");
    const btnCancel = document.getElementById("btnCancelKiwoom");
    const btnSave = document.getElementById("btnSaveKiwoomConfig");
    const btnTest = document.getElementById("btnTestKiwoom");

    const chkUseKiwoom = document.getElementById("chkUseKiwoom");
    const selectServer = document.getElementById("selectKiwoomServer");
    const inputAppKey = document.getElementById("inputKiwoomAppKey");
    const inputSecretKey = document.getElementById("inputKiwoomSecretKey");
    const chkUseCors = document.getElementById("chkUseCorsProxy");
    const statusMsg = document.getElementById("kiwoomStatusMessage");

    function openModal() {
      const cfg = KiwoomApiManager.getConfig();
      if (chkUseKiwoom) chkUseKiwoom.checked = !!cfg.useKiwoom;
      if (selectServer) selectServer.value = cfg.serverType || "mock";
      if (inputAppKey) inputAppKey.value = cfg.appKey || "";
      if (inputSecretKey) inputSecretKey.value = cfg.secretKey || "";
      if (chkUseCors) chkUseCors.checked = cfg.useCorsProxy !== false;
      if (statusMsg) statusMsg.style.display = "none";
      if (modal) modal.classList.add("active");
    }

    function closeModal() {
      if (modal) modal.classList.remove("active");
    }

    if (btnOpen) btnOpen.addEventListener("click", openModal);
    if (btnClose) btnClose.addEventListener("click", closeModal);
    if (btnCancel) btnCancel.addEventListener("click", closeModal);

    if (btnSave) {
      btnSave.addEventListener("click", () => {
        const useKiwoom = chkUseKiwoom ? chkUseKiwoom.checked : false;
        const serverType = selectServer ? selectServer.value : "mock";
        const appKey = inputAppKey ? inputAppKey.value.trim() : "";
        const secretKey = inputSecretKey ? inputSecretKey.value.trim() : "";
        const useCorsProxy = chkUseCors ? chkUseCors.checked : true;

        KiwoomApiManager.saveConfig({
          useKiwoom,
          serverType,
          appKey,
          secretKey,
          useCorsProxy
        });

        closeModal();
        showToast("키움 OpenAPI 설정이 로컬 스토리지에 안전하게 저장되었습니다.", "toast-success");
      });
    }

    if (btnTest) {
      btnTest.addEventListener("click", async () => {
        if (!inputAppKey || !inputAppKey.value.trim() || !inputSecretKey || !inputSecretKey.value.trim()) {
          if (statusMsg) {
            statusMsg.style.display = "block";
            statusMsg.style.background = "rgba(248, 81, 73, 0.15)";
            statusMsg.style.color = "var(--up-red)";
            statusMsg.textContent = "AppKey와 SecretKey를 모두 입력해 주세요.";
          }
          return;
        }

        KiwoomApiManager.saveConfig({
          useKiwoom: true,
          serverType: selectServer.value,
          appKey: inputAppKey.value.trim(),
          secretKey: inputSecretKey.value.trim(),
          useCorsProxy: chkUseCors.checked
        });

        if (statusMsg) {
          statusMsg.style.display = "block";
          statusMsg.style.background = "rgba(88, 166, 255, 0.15)";
          statusMsg.style.color = "var(--down-blue)";
          statusMsg.textContent = "⏳ 키움 서버에 OAuth2 접근 토큰(au10001) 요청 중...";
        }

        const res = await KiwoomApiManager.testKiwoomConnection();
        if (statusMsg) {
          if (res.success) {
            statusMsg.style.background = "rgba(46, 160, 67, 0.15)";
            statusMsg.style.color = "var(--accent-green)";
            statusMsg.textContent = "✅ " + res.message;
          } else {
            statusMsg.style.background = "rgba(248, 81, 73, 0.15)";
            statusMsg.style.color = "var(--up-red)";
            statusMsg.textContent = "❌ " + res.message;
          }
        }
      });
    }
  }

  // ============================================================
  // 리밸런싱 전략실 로직
  // ============================================================
  function initRebalancingLab() {
    const cardOpt1 = document.getElementById("cardModeOpt1");
    const cardOpt2 = document.getElementById("cardModeOpt2");
    const viewOpt1 = document.getElementById("viewRebalanceOpt1");
    const viewOpt2 = document.getElementById("viewRebalanceOpt2");

    if (cardOpt1 && cardOpt2) {
      cardOpt1.addEventListener("click", () => {
        cardOpt1.classList.add("active-card");
        cardOpt2.classList.remove("active-card");
        if (viewOpt1) viewOpt1.style.display = "grid";
        if (viewOpt2) viewOpt2.style.display = "none";
        renderSingleStockRebalance(currentStockCode);
      });

      cardOpt2.addEventListener("click", () => {
        cardOpt2.classList.add("active-card");
        cardOpt1.classList.remove("active-card");
        if (viewOpt1) viewOpt1.style.display = "none";
        if (viewOpt2) viewOpt2.style.display = "flex";
        renderPortfolioRebalance();
      });
    }

    document.querySelectorAll(".preset-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        document.querySelectorAll(".preset-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        currentRebalancePreset = chip.getAttribute("data-preset");
        renderPortfolioRebalance();
      });
    });

    const btnExecuteBatch = document.getElementById("btnExecuteBatchRebalance");
    if (btnExecuteBatch) {
      btnExecuteBatch.addEventListener("click", () => {
        const analysis = RebalancingEngine.analyzePortfolioRebalance(currentRebalancePreset);
        if (confirm(`'${analysis.presetName}' 모델에 맞춰 총 ${analysis.items.filter(i => i.action !== 'MATCH').length}개 종목의 일괄 리밸런싱을 실행하시겠습니까?`)) {
          const execRes = RebalancingEngine.executeBatchRebalance(analysis);
          showToast(`일괄 리밸런싱 완료! 총 ${execRes.executedCount}건의 주문이 자동 체결되었습니다.`, "toast-success");
          updateHeaderAssets();
          renderPortfolioRebalance();
          renderPortfolioView();
        }
      });
    }
  }

  function renderRebalancingView() {
    const holdings = Object.keys(TradingEngine.getAccountState().holdings);
    const targetCode = (holdings.length > 0 && !holdings.includes(currentStockCode)) 
      ? holdings[0] 
      : currentStockCode;
    renderSingleStockRebalance(targetCode);
    renderPortfolioRebalance();
  }

  function renderSingleStockRebalance(code) {
    const analysis = RebalancingEngine.analyzeSingleStock(code);
    if (!analysis) return;

    const stockListEl = document.getElementById("rebalanceStockSelectList");
    if (stockListEl) {
      let allStocks = [...MarketDataEngine.getAllStocks()];
      const holdings = TradingEngine.getAccountState().holdings;

      // 보유 종목 우선 정렬
      allStocks.sort((a, b) => {
        const hasA = holdings[a.code] ? 1 : 0;
        const hasB = holdings[b.code] ? 1 : 0;
        return hasB - hasA;
      });

      stockListEl.innerHTML = allStocks.map(s => {
        const holding = holdings[s.code];
        const hasHolding = !!holding;
        const isSelected = s.code === code;
        return `
          <button class="stock-select-btn ${isSelected ? 'active' : ''}" data-code="${s.code}">
            <div>
              <div style="font-weight: 700;">${s.name} ${hasHolding ? '<span style="color: var(--accent-green); font-size: 0.72rem; font-weight: 800;">[보유 ' + holding.qty + '주]</span>' : ''}</div>
              <div style="font-size: 0.75rem; color: var(--text-secondary);">${s.price.toLocaleString()}원 · RSI ${s.rsi}</div>
            </div>
            <div style="font-size: 0.75rem; font-weight: 700; color: ${s.rsi >= 70 ? 'var(--up-red)' : (s.rsi <= 40 ? 'var(--down-blue)' : 'var(--text-muted)')}">
              ${s.rsi >= 70 ? '과매수' : (s.rsi <= 40 ? '과매도' : '중립')}
            </div>
          </button>
        `;
      }).join("");

      stockListEl.querySelectorAll(".stock-select-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          renderSingleStockRebalance(btn.getAttribute("data-code"));
        });
      });
    }

    const diagContainer = document.getElementById("singleStockDiagnosticBox");
    if (diagContainer) {
      const d = analysis.diagnostics;
      const h = analysis.holdingInfo;
      const rec = analysis.actionRecommendation;

      diagContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h3 style="font-size: 1.3rem; font-weight: 800;">${analysis.stock.name} (${analysis.stock.code})</h3>
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.2rem;">
              현재가: <strong>${analysis.stock.price.toLocaleString()}원</strong> | 
              보유 수량: <strong>${h.qty}주</strong> (평가금액: ${h.evalAmount.toLocaleString()}원) | 
              수익률: <strong style="color: ${h.profitRate >= 0 ? 'var(--up-red)' : 'var(--down-blue)'}">${h.profitRate >= 0 ? '+' : ''}${h.profitRate}%</strong>
            </div>
          </div>
          <span class="signal-pill ${d.signal === 'TAKE_PROFIT' ? 'sell' : (d.signal === 'SCALE_IN' ? 'buy' : 'hold')}">
            ${d.signalText}
          </span>
        </div>

        ${d.weightWarning ? `<div style="background: rgba(210, 153, 34, 0.15); border: 1px solid var(--accent-gold); padding: 0.75rem; border-radius: 6px; font-size: 0.85rem; color: var(--accent-gold);">${d.weightWarning}</div>` : ''}

        <div class="diagnostic-meter">
          <div style="flex: 1;">
            <div style="font-size: 0.75rem; color: var(--text-secondary);">RSI 과열/침체 지수</div>
            <div style="font-size: 1.1rem; font-weight: 800; color: ${analysis.indicators.rsi >= 70 ? 'var(--up-red)' : 'var(--down-blue)'}">
              ${analysis.indicators.rsi} pt
            </div>
          </div>
          <div style="flex: 1;">
            <div style="font-size: 0.75rem; color: var(--text-secondary);">시장 추세 상태</div>
            <div style="font-size: 0.95rem; font-weight: 700;">${analysis.indicators.trend}</div>
          </div>
          <div style="flex: 1;">
            <div style="font-size: 0.75rem; color: var(--text-secondary);">포트폴리오 비중</div>
            <div style="font-size: 1.1rem; font-weight: 800;">${h.weightInPortfolio}%</div>
          </div>
        </div>

        <div style="font-size: 0.85rem; line-height: 1.5; color: var(--text-primary);">
          <strong>전문가 전망 의견:</strong> ${d.outlookDesc}
        </div>

        <div class="action-recipe-box">
          <h4>💡 권장 리밸런싱 처방: ${rec.actionName}</h4>
          <p style="font-size: 0.85rem; color: var(--text-primary); margin-bottom: 0.75rem;">${rec.guideMessage}</p>
          ${rec.recommendedQty > 0 ? `
            <button id="btnExecuteSingleRecipe" class="btn-order-submit ${rec.type === 'SELL' ? 'btn-sell' : 'btn-buy'}" style="padding: 0.5rem 1rem; width: auto; font-size: 0.85rem;">
              처방 내용대로 ${rec.recommendedQty}주 즉시 ${rec.type === 'SELL' ? '매도' : '매수'} 실행
            </button>
          ` : ''}
        </div>
      `;

      const btnExec = document.getElementById("btnExecuteSingleRecipe");
      if (btnExec) {
        btnExec.addEventListener("click", () => {
          const res = TradingEngine.submitOrder({
            code: analysis.stock.code,
            type: rec.type,
            orderType: "MARKET",
            price: rec.targetPrice,
            qty: rec.recommendedQty
          });
          if (res.success) {
            showToast(res.message, "toast-success");
            updateHeaderAssets();
            renderSingleStockRebalance(analysis.stock.code);
            renderPortfolioView();
          } else {
            showToast(res.message, "toast-error");
          }
        });
      }
    }
  }

  function renderPortfolioRebalance() {
    const analysis = RebalancingEngine.analyzePortfolioRebalance(currentRebalancePreset);
    const tableBody = document.getElementById("rebalanceDriftTableBody");
    const summaryDesc = document.getElementById("rebalancePresetDesc");

    if (summaryDesc) {
      summaryDesc.innerHTML = `<strong>${analysis.presetName}</strong>: ${analysis.presetDesc}`;
    }

    if (tableBody) {
      if (!analysis.items || analysis.items.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
              등록된 보유 주식이 없습니다. 상단의 <strong>'📑 내 실제 주식 엑셀 업로드'</strong> 또는 <strong>'📥 직접 입력'</strong>으로 보유 주식을 등록해 보세요.
            </td>
          </tr>
        `;
        return;
      }

      tableBody.innerHTML = analysis.items.map(item => {
        let badgeClass = "match";
        let actionText = "비중 유지";
        if (item.action === "SELL") {
          badgeClass = "over";
          actionText = `매도 ${item.orderQty}주 (${item.orderAmount.toLocaleString()}원)`;
        } else if (item.action === "BUY") {
          badgeClass = "under";
          actionText = `매수 ${item.orderQty}주 (${item.orderAmount.toLocaleString()}원)`;
        }

        return `
          <tr>
            <td class="text-left"><strong>${item.name}</strong> <span style="font-size: 0.7rem; color: var(--text-muted);">${item.code}</span></td>
            <td class="text-right">${item.currentPrice.toLocaleString()}원</td>
            <td class="text-right">${item.currentQty}주 (${item.currentWeight}%)</td>
            <td class="text-right"><strong>${item.targetWeight}%</strong></td>
            <td class="text-right">
              <span class="drift-badge ${badgeClass}">
                ${item.driftRate > 0 ? '+' : ''}${item.driftRate}%
              </span>
            </td>
            <td class="text-center" style="font-weight: 700;">${actionText}</td>
          </tr>
        `;
      }).join("");
    }
  }

  function renderPortfolioView() {
    const summary = TradingEngine.getAccountSummary();
    const account = TradingEngine.getAccountState();

    const elTot = document.getElementById("portTotalAssets");
    const elInv = document.getElementById("portTotalInvested");
    const elPnl = document.getElementById("portTotalPnl");
    const elRate = document.getElementById("portTotalRate");

    if (elTot) elTot.textContent = summary.totalAssets.toLocaleString() + "원";
    if (elInv) elInv.textContent = summary.totalInvested.toLocaleString() + "원";
    if (elPnl) {
      const sign = summary.totalProfit >= 0 ? "+" : "";
      elPnl.textContent = `${sign}${summary.totalProfit.toLocaleString()}원`;
      elPnl.style.color = summary.totalProfit >= 0 ? "var(--up-red)" : "var(--down-blue)";
    }
    if (elRate) {
      const sign = summary.totalReturnRate >= 0 ? "+" : "";
      elRate.textContent = `${sign}${summary.totalReturnRate}%`;
      elRate.style.color = summary.totalReturnRate >= 0 ? "var(--up-red)" : "var(--down-blue)";
    }

    AnalyticsEngine.drawPortfolioDonutChart("portfolioDonutCanvas");

    const holdingsTbody = document.getElementById("portfolioHoldingsTableBody");
    if (holdingsTbody) {
      const holdingsList = Object.values(account.holdings);
      if (holdingsList.length === 0) {
        holdingsTbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">보유 중인 주식이 없습니다. '엑셀 일괄 업로드' 또는 트레이딩룸에서 매수해 보세요.</td></tr>`;
      } else {
        holdingsTbody.innerHTML = holdingsList.map(h => {
          const stock = MarketDataEngine.getStockByCode(h.code);
          const curPrice = stock ? stock.price : h.avgPrice;
          const evalAmt = h.qty * curPrice;
          const invested = h.qty * h.avgPrice;
          const pnl = evalAmt - invested;
          const rate = (((curPrice - h.avgPrice) / h.avgPrice) * 100).toFixed(2);
          const sign = pnl >= 0 ? "+" : "";

          return `
            <tr>
              <td class="text-left"><strong>${h.name}</strong> <span style="font-size:0.75rem; color:var(--text-muted);">${h.code}</span></td>
              <td class="text-right">${h.qty.toLocaleString()}주</td>
              <td class="text-right">${h.avgPrice.toLocaleString()}원</td>
              <td class="text-right">${curPrice.toLocaleString()}원</td>
              <td class="text-right"><strong>${evalAmt.toLocaleString()}원</strong></td>
              <td class="text-right" style="color: ${pnl >= 0 ? 'var(--up-red)' : 'var(--down-blue)'}; font-weight:700;">
                ${sign}${pnl.toLocaleString()}원
              </td>
              <td class="text-right" style="color: ${pnl >= 0 ? 'var(--up-red)' : 'var(--down-blue)'}; font-weight:700;">
                ${sign}${rate}%
              </td>
            </tr>
          `;
        }).join("");
      }
    }

    const metrics = AnalyticsEngine.calculateTradingMetrics();
    const elWinRate = document.getElementById("metricWinRate");
    const elMdd = document.getElementById("metricMdd");
    const elSharpe = document.getElementById("metricSharpe");
    const elRatio = document.getElementById("metricPlRatio");

    if (elWinRate) elWinRate.textContent = `${metrics.winRate}%`;
    if (elMdd) elMdd.textContent = `-${metrics.mdd}%`;
    if (elSharpe) elSharpe.textContent = `${metrics.sharpeRatio}`;
    if (elRatio) elRatio.textContent = `${metrics.profitLossRatio}:1`;

    renderTradingJournal();
  }

  function renderTradingJournal() {
    const journalTbody = document.getElementById("tradingJournalTableBody");
    if (!journalTbody) return;

    const trades = TradingEngine.getAccountState().tradeHistory;
    if (trades.length === 0) {
      journalTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">체결된 매매 기록이 없습니다.</td></tr>`;
      return;
    }

    journalTbody.innerHTML = trades.slice(0, 15).map(t => {
      const note = AnalyticsEngine.getTradeNote(t.orderId);
      const isBuy = t.type === "BUY";
      return `
        <tr>
          <td class="text-center"><span style="font-size:0.75rem; color:var(--text-muted);">${t.filledAt ? t.filledAt.replace('T', ' ').slice(0, 16) : '-'}</span></td>
          <td class="text-left"><strong>${t.name}</strong></td>
          <td class="text-center"><span style="color: ${isBuy ? 'var(--up-red)' : 'var(--down-blue)'}; font-weight: 700;">${isBuy ? '매수' : '매도'}</span></td>
          <td class="text-right">${t.filledPrice.toLocaleString()}원</td>
          <td class="text-right">${t.qty}주</td>
          <td class="text-center">
            <input type="text" class="journal-note-input" data-order-id="${t.orderId}" value="${note}" placeholder="매매 사유 메모 작성..." style="width: 100%; background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-primary); padding: 0.3rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">
          </td>
        </tr>
      `;
    }).join("");

    journalTbody.querySelectorAll(".journal-note-input").forEach(inp => {
      inp.addEventListener("change", (e) => {
        const orderId = inp.getAttribute("data-order-id");
        AnalyticsEngine.saveTradeNote(orderId, e.target.value.trim());
        showToast("매매 일지 메모가 저장되었습니다.", "toast-info");
      });
    });
  }

  // ============================================================
  // [신규 기능] 홈/대시보드 실시간 보유 주식 요약 미니 위젯 렌더링
  // ============================================================
  function updateDashboardMiniView() {
    const summary = TradingEngine.getAccountSummary();
    const account = TradingEngine.getAccountState();

    const elDashTot = document.getElementById("dashTotalAssets");
    const elDashProfit = document.getElementById("dashTotalProfit");
    if (elDashTot) {
      elDashTot.textContent = summary.totalAssets.toLocaleString() + "원";
      const subTot = elDashTot.parentElement.querySelector(".stat-sub");
      if (subTot) {
        subTot.textContent = summary.isCustomPortfolio ? "내 실제 등록 주식 총 평가금액" : "가상 시드머니: 1억 원";
      }
    }
    if (elDashProfit) {
      const sign = summary.totalProfit >= 0 ? "+" : "";
      elDashProfit.textContent = `${sign}${summary.totalProfit.toLocaleString()}원 (${sign}${summary.totalReturnRate}%)`;
      elDashProfit.style.color = summary.totalProfit >= 0 ? "var(--up-red)" : "var(--down-blue)";
      const subProfit = elDashProfit.parentElement.querySelector(".stat-sub");
      if (subProfit) {
        subProfit.textContent = summary.isCustomPortfolio ? "내 등록 종목 평가손익 (원금 대비 수익률)" : "위탁수수료(0.015%) 및 거래세(0.18%) 자동 반영";
      }
    }

    const homeTbody = document.getElementById("homeHoldingsTableBody");
    const badgeCount = document.getElementById("homeHoldingsCountBadge");
    if (homeTbody && account && account.holdings) {
      const holdingsList = Object.values(account.holdings);
      if (badgeCount) badgeCount.textContent = `${holdingsList.length}종목`;

      if (holdingsList.length === 0) {
        homeTbody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">
              보유 중인 주식이 없습니다. 상단의 <strong>'📑 내 실제 주식 엑셀 업로드'</strong> 또는 <strong>'📥 직접 입력'</strong>으로 주식을 등록해 보세요.
            </td>
          </tr>
        `;
      } else {
        homeTbody.innerHTML = holdingsList.map(h => {
          const stock = MarketDataEngine.getStockByCode(h.code);
          const curPrice = stock ? stock.price : h.avgPrice;
          const evalAmt = h.qty * curPrice;
          const invested = h.qty * h.avgPrice;
          const pnl = evalAmt - invested;
          const rate = (((curPrice - h.avgPrice) / h.avgPrice) * 100).toFixed(2);
          const sign = pnl >= 0 ? "+" : "";

          return `
            <tr>
              <td class="text-left"><strong>${h.name}</strong> <span style="font-size: 0.72rem; color: var(--text-muted);">${h.code}</span></td>
              <td class="text-right">${h.qty.toLocaleString()}주</td>
              <td class="text-right">${h.avgPrice.toLocaleString()}원</td>
              <td class="text-right"><strong style="color: var(--accent-blue);">${curPrice.toLocaleString()}원</strong></td>
              <td class="text-right"><strong>${evalAmt.toLocaleString()}원</strong></td>
              <td class="text-right" style="color: ${pnl >= 0 ? 'var(--up-red)' : 'var(--down-blue)'}; font-weight: 700;">
                ${sign}${pnl.toLocaleString()}원
              </td>
              <td class="text-right" style="color: ${pnl >= 0 ? 'var(--up-red)' : 'var(--down-blue)'}; font-weight: 700;">
                ${sign}${rate}%
              </td>
              <td class="text-center">
                <button class="btn-home-rebalance-link" data-code="${h.code}" style="background: rgba(163, 113, 247, 0.15); border: 1px solid var(--accent-purple); color: var(--accent-purple); padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; cursor: pointer;">
                  ⚖️ 리밸런싱
                </button>
              </td>
            </tr>
          `;
        }).join("");

        homeTbody.querySelectorAll(".btn-home-rebalance-link").forEach(btn => {
          btn.addEventListener("click", () => {
            const code = btn.getAttribute("data-code");
            switchTab("rebalance");
            renderSingleStockRebalance(code);
          });
        });
      }
    }
  }

  function showToast(message, type = "toast-info") {
    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>🔔</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  const btnReset = document.getElementById("btnResetAccount");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      if (confirm("계좌를 초기화하여 가상 시드머니 1억 원 및 기본 시장 종목으로 다시 시작하시겠습니까? (기존 매매 내역 및 엑셀 데이터가 초기화됩니다)")) {
        TradingEngine.resetAccount();
        MarketDataEngine.resetToDefaultStocks();
        currentStockCode = "005930";
        selectStock(currentStockCode);
        showToast("계좌 및 시장 종목이 초기화되었습니다.", "toast-success");
        updateHeaderAssets();
        updateDashboardMiniView();
        renderStockList();
        renderPortfolioView();
        renderRebalancingView();
      }
    });
  }

  initApp();
});
