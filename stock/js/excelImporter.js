/**
 * StockCraft (스톡크래프트) 실제 주식 보유현황 엑셀/CSV 업로드 모듈 (excelImporter.js)
 * 증권사 HTS/MTS에서 내보낸 엑셀(CSV) 잔고 파일을 브라우저에서 안전하게 파싱하여
 * 내 계좌 포트폴리오로 일괄 주입하고 리밸런싱 전략실로 즉시 연동
 */

const ExcelImporter = (() => {
  // 샘플 엑셀(CSV) 양식 내용
  const SAMPLE_CSV_CONTENT = `종목코드,종목명,보유수량,평균매입가,현재가
005930,삼성전자,150,220000,233500
000660,SK하이닉스,50,182000,194500
005380,현대차,40,242000,252000
AAPL,애플(Apple),30,225,232.5
NVDA,엔비디아(NVIDIA),40,135,141.5`;

  /**
   * 샘플 엑셀 양식 다운로드
   */
  function downloadSampleCSV() {
    const blob = new Blob(["\uFEFF" + SAMPLE_CSV_CONTENT], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "스톡크래프트_실제주식잔고_샘플양식.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * CSV / 엑셀 텍스트 파싱
   */
  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) {
      throw new Error("파일에 유효한 주식 데이터 행이 없습니다.");
    }

    const parsedItems = [];

    // 헤더 제외하고 1번째 행부터 순회
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // 쉼표 또는 탭 구분자 분리
      const cols = line.split(/[,\t]/).map(c => c.trim().replace(/^["']|["']$/g, ""));
      if (cols.length < 4) continue;

      const code = cols[0];
      const name = cols[1];
      const qty = parseInt(cols[2].replace(/,/g, ""), 10);
      const avgPrice = parseFloat(cols[3].replace(/,/g, ""));
      const curPrice = cols[4] ? parseFloat(cols[4].replace(/,/g, "")) : null;

      if (!code || isNaN(qty) || qty <= 0 || isNaN(avgPrice) || avgPrice <= 0) {
        continue;
      }

      parsedItems.push({
        code,
        name,
        qty,
        avgPrice,
        curPrice: (!isNaN(curPrice) && curPrice > 0) ? curPrice : avgPrice
      });
    }

    if (parsedItems.length === 0) {
      throw new Error("유효한 종목 코드, 수량, 매입단가 데이터를 찾을 수 없습니다.");
    }

    return parsedItems;
  }

  /**
   * 파싱된 데이터를 내 포트폴리오로 일괄 적용
   */
  /**
   * [신규 기능] 파싱된 데이터를 내 포트폴리오로 일괄 적용
   * @param {Array} items
   * @param {Object} options { replaceAll: true } 기존 주식 삭제 후 엑셀 주식만 단독 등록
   */
  function importHoldings(items, options = { replaceAll: true }) {
    if (!Array.isArray(items) || items.length === 0) {
      return { success: false, count: 0, items: [] };
    }

    // [핵심 로직] 기존 등록 주식 전체 삭제 및 트레이딩룸 목록을 엑셀 주식으로 전면 교체
    if (options.replaceAll) {
      TradingEngine.clearHoldings();
      MarketDataEngine.setCustomStockList(items);
    }

    let successCount = 0;

    items.forEach(item => {
      // 1. 현재가 동기화
      if (item.curPrice && item.curPrice > 0) {
        MarketDataEngine.updateStockPrice(item.code, item.curPrice);
      }

      // 2. 보유 종목 주입 (미등록 종목도 자동 동적 등록)
      const res = TradingEngine.importOrUpdateHolding(item.code, item.qty, item.avgPrice, item.name, item.curPrice);
      if (res.success) successCount++;
    });

    return {
      success: true,
      count: successCount,
      firstCode: items[0] ? items[0].code : null,
      items
    };
  }

  return {
    downloadSampleCSV,
    parseCSV,
    importHoldings
  };
})();

if (typeof window !== "undefined") {
  window.ExcelImporter = ExcelImporter;
}

