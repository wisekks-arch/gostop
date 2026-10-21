/**
 * 대한민국 정통 한국 화투 48장 + 보너스패 렌더러
 * Marcus Richert의 한국 전통 화투 마스터 벡터 에셋(hwatu_deck.svg) 정밀 스프라이트 슬라이싱 연동
 */

// 카드 타입 상수
const CARD_TYPE = {
  KWANG: 'kwang',   // 광
  TEN: 'ten',       // 열끗 (십)
  RIB: 'rib',       // 띠 (단)
  PI: 'pi',         // 피
  BONUS: 'bonus'    // 보너스
};

// 띠 종류 상수
const RIB_TYPE = {
  HONG: 'hong',     // 홍단
  CHEONG: 'cheong', // 청단
  CHO: 'cho',       // 초단
  NONE: 'none'      // 일반 띠 (비띠 등)
};

// 48장 + 보너스 2장 카드 목록 (스프라이트 행/열 좌표 매핑 포함)
// col: 0~11 (1월~12월), row: 0~3 (대표패, 띠, 피1, 피2/쌍피)
const HWA_TU_CARDS = [
  // 1월 (송학 - 소나무)
  { id: 'c01_kwang', month: 1, row: 0, type: CARD_TYPE.KWANG, name: '송학 광', score: 20, isKwang: true, tag: '光' },
  { id: 'c01_hong',  month: 1, row: 1, type: CARD_TYPE.RIB,   name: '송학 홍단', rib: RIB_TYPE.HONG, tag: '홍단' },
  { id: 'c01_pi1',   month: 1, row: 2, type: CARD_TYPE.PI,    name: '송학 피 1', piValue: 1 },
  { id: 'c01_pi2',   month: 1, row: 3, type: CARD_TYPE.PI,    name: '송학 피 2', piValue: 1 },

  // 2월 (매조 - 매화)
  { id: 'c02_ten',   month: 2, row: 0, type: CARD_TYPE.TEN,   name: '매화 꾀꼬리', godori: true, tag: '고도리' },
  { id: 'c02_hong',  month: 2, row: 1, type: CARD_TYPE.RIB,   name: '매화 홍단', rib: RIB_TYPE.HONG, tag: '홍단' },
  { id: 'c02_pi1',   month: 2, row: 2, type: CARD_TYPE.PI,    name: '매화 피 1', piValue: 1 },
  { id: 'c02_pi2',   month: 2, row: 3, type: CARD_TYPE.PI,    name: '매화 피 2', piValue: 1 },

  // 3월 (벚꽃 - 사쿠라)
  { id: 'c03_kwang', month: 3, row: 0, type: CARD_TYPE.KWANG, name: '벚꽃 만막 광', score: 20, isKwang: true, tag: '光' },
  { id: 'c03_hong',  month: 3, row: 1, type: CARD_TYPE.RIB,   name: '벚꽃 홍단', rib: RIB_TYPE.HONG, tag: '홍단' },
  { id: 'c03_pi1',   month: 3, row: 2, type: CARD_TYPE.PI,    name: '벚꽃 피 1', piValue: 1 },
  { id: 'c03_pi2',   month: 3, row: 3, type: CARD_TYPE.PI,    name: '벚꽃 피 2', piValue: 1 },

  // 4월 (흑싸리)
  { id: 'c04_ten',   month: 4, row: 0, type: CARD_TYPE.TEN,   name: '흑싸리 두견새', godori: true, tag: '고도리' },
  { id: 'c04_cho',   month: 4, row: 1, type: CARD_TYPE.RIB,   name: '흑싸리 초단', rib: RIB_TYPE.CHO, tag: '초단' },
  { id: 'c04_pi1',   month: 4, row: 2, type: CARD_TYPE.PI,    name: '흑싸리 피 1', piValue: 1 },
  { id: 'c04_pi2',   month: 4, row: 3, type: CARD_TYPE.PI,    name: '흑싸리 피 2', piValue: 1 },

  // 5월 (난초 - 창포)
  { id: 'c05_ten',   month: 5, row: 0, type: CARD_TYPE.TEN,   name: '난초 다리', tag: '열끗' },
  { id: 'c05_cho',   month: 5, row: 1, type: CARD_TYPE.RIB,   name: '난초 초단', rib: RIB_TYPE.CHO, tag: '초단' },
  { id: 'c05_pi1',   month: 5, row: 2, type: CARD_TYPE.PI,    name: '난초 피 1', piValue: 1 },
  { id: 'c05_pi2',   month: 5, row: 3, type: CARD_TYPE.PI,    name: '난초 피 2', piValue: 1 },

  // 6월 (모란)
  { id: 'c06_ten',   month: 6, row: 0, type: CARD_TYPE.TEN,   name: '모란 나비', tag: '열끗' },
  { id: 'c06_cheong',month: 6, row: 1, type: CARD_TYPE.RIB,   name: '모란 청단', rib: RIB_TYPE.CHEONG, tag: '청단' },
  { id: 'c06_pi1',   month: 6, row: 2, type: CARD_TYPE.PI,    name: '모란 피 1', piValue: 1 },
  { id: 'c06_pi2',   month: 6, row: 3, type: CARD_TYPE.PI,    name: '모란 피 2', piValue: 1 },

  // 7월 (홍싸리)
  { id: 'c07_ten',   month: 7, row: 0, type: CARD_TYPE.TEN,   name: '홍싸리 멧돼지', tag: '열끗' },
  { id: 'c07_cho',   month: 7, row: 1, type: CARD_TYPE.RIB,   name: '홍싸리 초단', rib: RIB_TYPE.CHO, tag: '초단' },
  { id: 'c07_pi1',   month: 7, row: 2, type: CARD_TYPE.PI,    name: '홍싸리 피 1', piValue: 1 },
  { id: 'c07_pi2',   month: 7, row: 3, type: CARD_TYPE.PI,    name: '홍싸리 피 2', piValue: 1 },

  // 8월 (공산 - 억새)
  { id: 'c08_kwang', month: 8, row: 0, type: CARD_TYPE.KWANG, name: '공산 명월 광', score: 20, isKwang: true, tag: '光' },
  { id: 'c08_ten',   month: 8, row: 1, type: CARD_TYPE.TEN,   name: '공산 기러기', godori: true, tag: '고도리' },
  { id: 'c08_pi1',   month: 8, row: 2, type: CARD_TYPE.PI,    name: '공산 피 1', piValue: 1 },
  { id: 'c08_pi2',   month: 8, row: 3, type: CARD_TYPE.PI,    name: '공산 피 2', piValue: 1 },

  // 9월 (국진 - 국화)
  { id: 'c09_ten',   month: 9, row: 0, type: CARD_TYPE.TEN,   name: '국진 술잔 (쌍피전환 가능)', tag: '쌍피/열', canBeDoublePi: true },
  { id: 'c09_cheong',month: 9, row: 1, type: CARD_TYPE.RIB,   name: '국화 청단', rib: RIB_TYPE.CHEONG, tag: '청단' },
  { id: 'c09_pi1',   month: 9, row: 2, type: CARD_TYPE.PI,    name: '국화 피 1', piValue: 1 },
  { id: 'c09_pi2',   month: 9, row: 3, type: CARD_TYPE.PI,    name: '국화 피 2', piValue: 1 },

  // 10월 (단풍)
  { id: 'c10_ten',   month: 10, row: 0, type: CARD_TYPE.TEN,  name: '단풍 사슴', tag: '열끗' },
  { id: 'c10_cheong',month: 10, row: 1, type: CARD_TYPE.RIB,  name: '단풍 청단', rib: RIB_TYPE.CHEONG, tag: '청단' },
  { id: 'c10_pi1',   month: 10, row: 2, type: CARD_TYPE.PI,   name: '단풍 피 1', piValue: 1 },
  { id: 'c10_pi2',   month: 10, row: 3, type: CARD_TYPE.PI,   name: '단풍 피 2', piValue: 1 },

  // 11월 (오동)
  { id: 'c11_kwang', month: 11, row: 0, type: CARD_TYPE.KWANG, name: '오동 봉황 광', score: 20, isKwang: true, tag: '光' },
  { id: 'c11_pi_ssang', month: 11, row: 1, type: CARD_TYPE.PI, name: '오동 쌍피 (똥쌍피)', piValue: 2, tag: '쌍피' },
  { id: 'c11_pi1',   month: 11, row: 2, type: CARD_TYPE.PI,   name: '오동 피 1', piValue: 1 },
  { id: 'c11_pi2',   month: 11, row: 3, type: CARD_TYPE.PI,   name: '오동 피 2', piValue: 1 },

  // 12월 (비)
  { id: 'c12_kwang', month: 12, row: 0, type: CARD_TYPE.KWANG, name: '비 광 (선비/개구리)', score: 20, isKwang: true, isBiKwang: true, tag: '雨光' },
  { id: 'c12_ten',   month: 12, row: 1, type: CARD_TYPE.TEN,   name: '비 제비', tag: '열끗' },
  { id: 'c12_rib',   month: 12, row: 2, type: CARD_TYPE.RIB,   name: '비 띠', rib: RIB_TYPE.NONE, tag: '비띠' },
  { id: 'c12_pi_ssang', month: 12, row: 3, type: CARD_TYPE.PI, name: '비 쌍피', piValue: 2, tag: '쌍피' },

  // 보너스 패 2장
  { id: 'bonus_2pi', month: 0, type: CARD_TYPE.BONUS, name: '보너스 쌍피 (복돼지)', piValue: 2, tag: '보너스 2皮' },
  { id: 'bonus_3pi', month: 0, type: CARD_TYPE.BONUS, name: '황금 보너스 삼피', piValue: 3, tag: '보너스 3皮' }
];

// 정통 화투 마스터 스프라이트 좌표 테이블
// 카드 1장: width 103.2, height 168.2
const COL_X = [
  0,        // 1월
  108.55,   // 2월
  217.75,   // 3월
  326.3,    // 4월
  447.2,    // 5월
  555.75,   // 6월
  664.95,   // 7월
  773.5,    // 8월
  895.7,    // 9월
  1004.2,   // 10월
  1113.4,   // 11월
  1222.0    // 12월
];

const ROW_Y = [
  0,        // 1행 (광 / 대표 열)
  186.3,    // 2행 (띠 / 고도리 새 / 똥쌍피 / 비제비)
  373.75,   // 3행 (피 1 / 비띠)
  563.5     // 4행 (피 2 / 비쌍피)
];

/**
 * 정통 한국 화투패 SVG 렌더링
 * @param {Object} card 카드 객체
 * @param {boolean} isBack 뒷면 여부
 * @returns {string} SVG HTML 문자열
 */
function renderCardSVG(card, isBack = false) {
  const cardW = 103.2;
  const cardH = 168.2;
  const rx = 8;

  // 화투 뒷면 (한국 화투 고유의 강렬한 붉은 엠보싱 다이아몬드 질감 + 花 각인)
  if (isBack || !card) {
    return `
      <svg class="hwatu-svg" viewBox="0 0 ${cardW} ${cardH}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="backRed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#b91c1c" />
            <stop offset="50%" stop-color="#991b1b" />
            <stop offset="100%" stop-color="#7f1d1d" />
          </linearGradient>
          <pattern id="backDiamond" width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M7,0 L14,7 L7,14 L0,7 Z" fill="none" stroke="#ef4444" stroke-width="0.8" opacity="0.35"/>
            <circle cx="7" cy="7" r="1.5" fill="#fca5a5" opacity="0.4"/>
          </pattern>
        </defs>
        <!-- 검은 외곽 테두리 및 붉은 몸통 -->
        <rect width="${cardW}" height="${cardH}" rx="${rx}" fill="#18181b" />
        <rect x="2.5" y="2.5" width="${cardW - 5}" height="${cardH - 5}" rx="${rx - 1}" fill="url(#backRed)" stroke="#f87171" stroke-width="1.2"/>
        <rect x="6" y="6" width="${cardW - 12}" height="${cardH - 12}" rx="5" fill="url(#backDiamond)"/>
        
        <!-- 중앙 황금색 花 엠블럼 -->
        <circle cx="${cardW / 2}" cy="${cardH / 2}" r="20" fill="#581010" stroke="#fef08a" stroke-width="1.5"/>
        <text x="${cardW / 2}" y="${cardH / 2 + 7}" font-family="'Batang', serif" font-size="20" font-weight="900" fill="#fef08a" text-anchor="middle">花</text>
      </svg>
    `;
  }

  // 보너스 패 (복돼지 2피 / 황금 3피)
  if (card.month === 0) {
    const is3Pi = card.id === 'bonus_3pi';
    return `
      <svg class="hwatu-svg" viewBox="0 0 ${cardW} ${cardH}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="${cardW}" height="${cardH}" rx="${rx}" fill="#18181b" />
        <rect x="2" y="2" width="${cardW - 4}" height="${cardH - 4}" rx="${rx - 1}" fill="#b91c1c" />
        <rect x="5" y="5" width="${cardW - 10}" height="${cardH - 10}" rx="${rx - 2}" fill="#fffdfa" stroke="#dcd0b8" stroke-width="0.8"/>
        
        <!-- 보너스 민화 일러스트 -->
        <circle cx="${cardW / 2}" cy="${cardH / 2 - 5}" r="32" fill="${is3Pi ? '#fef08a' : '#fee2e2'}" stroke="${is3Pi ? '#ca8a04' : '#ef4444'}" stroke-width="2"/>
        <text x="${cardW / 2}" y="${cardH / 2 - 10}" font-family="'Noto Sans KR', sans-serif" font-size="14" font-weight="900" fill="#b91c1c" text-anchor="middle">보너스</text>
        <text x="${cardW / 2}" y="${cardH / 2 + 15}" font-family="'Noto Sans KR', sans-serif" font-size="22" font-weight="900" fill="${is3Pi ? '#854d0e' : '#b91c1c'}" text-anchor="middle">${is3Pi ? '3皮' : '2皮'}</text>
        
        <!-- 하단 복 문구 -->
        <rect x="18" y="${cardH - 34}" width="${cardW - 36}" height="20" rx="10" fill="#991b1b"/>
        <text x="${cardW / 2}" y="${cardH - 20}" font-family="'Batang', serif" font-size="12" font-weight="bold" fill="#fff" text-anchor="middle">福 (${is3Pi ? '삼피' : '쌍피'})</text>
      </svg>
    `;
  }

  // 1월 ~ 12월 48장 정통 한국 화투 벡터 마스터 에셋 연동
  const col = card.month - 1;
  const row = card.row !== undefined ? card.row : 0;
  const offsetX = COLX_VAL(col);
  const offsetY = ROWY_VAL(row);

  const badge = getCardTagBadge(card);

  return `
    <svg class="hwatu-svg" viewBox="0 0 ${cardW} ${cardH}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="cardClip_${card.id}">
          <rect width="${cardW}" height="${cardH}" rx="${rx}" />
        </clipPath>
      </defs>

      <!-- 불투명 순백색 카드 베이스 바탕 -->
      <rect width="${cardW}" height="${cardH}" rx="${rx}" fill="#ffffff" />

      <!-- 정통 한국 화투 슬라이스 벡터 렌더링 -->
      <g clip-path="url(#cardClip_${card.id})">
        <image href="./assets/hwatu_deck.svg" x="-${offsetX}" y="-${offsetY}" width="1326" height="732" preserveAspectRatio="none"/>
      </g>

      <!-- 모바일 가시성을 위한 상단 인덱스 태그 뱃지 -->
      ${badge}
    </svg>
  `;
}

function COLX_VAL(col) {
  return COL_X[col] !== undefined ? COL_X[col] : 0;
}

function ROWY_VAL(row) {
  return ROW_Y[row] !== undefined ? ROW_Y[row] : 0;
}

/**
 * 모바일 화면 가시성을 높이는 상단 인덱스 뱃지 (광, 고도리, 단, 쌍피 등)
 */
function getCardTagBadge(card) {
  if (card.isKwang) {
    // 붉은 광 엠블럼
    return `
      <g transform="translate(64, 8)">
        <circle cx="16" cy="16" r="14" fill="#dc2626" stroke="#fff" stroke-width="1.8" />
        <text x="16" y="22" font-family="'Batang', 'Noto Sans KR', serif" font-size="15" font-weight="900" fill="#fff" text-anchor="middle">光</text>
      </g>
    `;
  }
  if (card.godori) {
    // 고도리 엠블럼
    return `
      <g transform="translate(54, 8)">
        <rect x="0" y="0" width="44" height="18" rx="9" fill="#1e40af" stroke="#93c5fd" stroke-width="1.2"/>
        <text x="22" y="13" font-family="'Noto Sans KR', sans-serif" font-size="10" font-weight="900" fill="#fff" text-anchor="middle">고도리</text>
      </g>
    `;
  }
  if (card.rib === RIB_TYPE.HONG) {
    return `
      <g transform="translate(56, 8)">
        <rect x="0" y="0" width="42" height="18" rx="5" fill="#dc2626" stroke="#fff" stroke-width="1"/>
        <text x="21" y="13" font-family="'Noto Sans KR', sans-serif" font-size="10" font-weight="900" fill="#fff" text-anchor="middle">홍단</text>
      </g>
    `;
  }
  if (card.rib === RIB_TYPE.CHEONG) {
    return `
      <g transform="translate(56, 8)">
        <rect x="0" y="0" width="42" height="18" rx="5" fill="#1e3a8a" stroke="#fff" stroke-width="1"/>
        <text x="21" y="13" font-family="'Noto Sans KR', sans-serif" font-size="10" font-weight="900" fill="#fff" text-anchor="middle">청단</text>
      </g>
    `;
  }
  if (card.rib === RIB_TYPE.CHO) {
    return `
      <g transform="translate(56, 8)">
        <rect x="0" y="0" width="42" height="18" rx="5" fill="#047857" stroke="#fff" stroke-width="1"/>
        <text x="21" y="13" font-family="'Noto Sans KR', sans-serif" font-size="10" font-weight="900" fill="#fff" text-anchor="middle">초단</text>
      </g>
    `;
  }
  if (card.piValue && card.piValue > 1) {
    return `
      <g transform="translate(56, 8)">
        <rect x="0" y="0" width="42" height="18" rx="5" fill="#d97706" stroke="#fff" stroke-width="1.2"/>
        <text x="21" y="13" font-family="'Noto Sans KR', sans-serif" font-size="10" font-weight="900" fill="#fff" text-anchor="middle">${card.piValue}皮</text>
      </g>
    `;
  }
  if (card.canBeDoublePi) {
    return `
      <g transform="translate(50, 8)">
        <rect x="0" y="0" width="48" height="18" rx="5" fill="#7e22ce" stroke="#fff" stroke-width="1"/>
        <text x="24" y="13" font-family="'Noto Sans KR', sans-serif" font-size="9" font-weight="900" fill="#fff" text-anchor="middle">쌍피/열</text>
      </g>
    `;
  }
  return '';
}
