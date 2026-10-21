/**
 * 화투패 데이터 및 SVG 그래픽 렌더러
 * 48장 정규패 + 보너스패(2피, 3피) 정의
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

// 48장 + 보너스 2장 카드 목록
const HWA_TU_CARDS = [
  // 1월 (송학 - 소나무)
  { id: 'c01_kwang', month: 1, type: CARD_TYPE.KWANG, name: '송학 광', score: 20, isKwang: true, tag: '光' },
  { id: 'c01_hong',  month: 1, type: CARD_TYPE.RIB,   name: '송학 홍단', rib: RIB_TYPE.HONG, tag: '홍단' },
  { id: 'c01_pi1',   month: 1, type: CARD_TYPE.PI,    name: '송학 피 1', piValue: 1 },
  { id: 'c01_pi2',   month: 1, type: CARD_TYPE.PI,    name: '송학 피 2', piValue: 1 },

  // 2월 (매조 - 매화)
  { id: 'c02_ten',   month: 2, type: CARD_TYPE.TEN,   name: '매화 꾀꼬리', godori: true, tag: '고도리' },
  { id: 'c02_hong',  month: 2, type: CARD_TYPE.RIB,   name: '매화 홍단', rib: RIB_TYPE.HONG, tag: '홍단' },
  { id: 'c02_pi1',   month: 2, type: CARD_TYPE.PI,    name: '매화 피 1', piValue: 1 },
  { id: 'c02_pi2',   month: 2, type: CARD_TYPE.PI,    name: '매화 피 2', piValue: 1 },

  // 3월 (벚꽃 - 사쿠라)
  { id: 'c03_kwang', month: 3, type: CARD_TYPE.KWANG, name: '벚꽃 광', score: 20, isKwang: true, tag: '光' },
  { id: 'c03_hong',  month: 3, type: CARD_TYPE.RIB,   name: '벚꽃 홍단', rib: RIB_TYPE.HONG, tag: '홍단' },
  { id: 'c03_pi1',   month: 3, type: CARD_TYPE.PI,    name: '벚꽃 피 1', piValue: 1 },
  { id: 'c03_pi2',   month: 3, type: CARD_TYPE.PI,    name: '벚꽃 피 2', piValue: 1 },

  // 4월 (흑싸리)
  { id: 'c04_ten',   month: 4, type: CARD_TYPE.TEN,   name: '흑싸리 두견새', godori: true, tag: '고도리' },
  { id: 'c04_cho',   month: 4, type: CARD_TYPE.RIB,   name: '흑싸리 초단', rib: RIB_TYPE.CHO, tag: '초단' },
  { id: 'c04_pi1',   month: 4, type: CARD_TYPE.PI,    name: '흑싸리 피 1', piValue: 1 },
  { id: 'c04_pi2',   month: 4, type: CARD_TYPE.PI,    name: '흑싸리 피 2', piValue: 1 },

  // 5월 (난초 - 창포)
  { id: 'c05_ten',   month: 5, type: CARD_TYPE.TEN,   name: '난초 다리', tag: '열끗' },
  { id: 'c05_cho',   month: 5, type: CARD_TYPE.RIB,   name: '난초 초단', rib: RIB_TYPE.CHO, tag: '초단' },
  { id: 'c05_pi1',   month: 5, type: CARD_TYPE.PI,    name: '난초 피 1', piValue: 1 },
  { id: 'c05_pi2',   month: 5, type: CARD_TYPE.PI,    name: '난초 피 2', piValue: 1 },

  // 6월 (모란)
  { id: 'c06_ten',   month: 6, type: CARD_TYPE.TEN,   name: '모란 나비', tag: '열끗' },
  { id: 'c06_cheong',month: 6, type: CARD_TYPE.RIB,   name: '모란 청단', rib: RIB_TYPE.CHEONG, tag: '청단' },
  { id: 'c06_pi1',   month: 6, type: CARD_TYPE.PI,    name: '모란 피 1', piValue: 1 },
  { id: 'c06_pi2',   month: 6, type: CARD_TYPE.PI,    name: '모란 피 2', piValue: 1 },

  // 7월 (홍싸리)
  { id: 'c07_ten',   month: 7, type: CARD_TYPE.TEN,   name: '홍싸리 멧돼지', tag: '열끗' },
  { id: 'c07_cho',   month: 7, type: CARD_TYPE.RIB,   name: '홍싸리 초단', rib: RIB_TYPE.CHO, tag: '초단' },
  { id: 'c07_pi1',   month: 7, type: CARD_TYPE.PI,    name: '홍싸리 피 1', piValue: 1 },
  { id: 'c07_pi2',   month: 7, type: CARD_TYPE.PI,    name: '홍싸리 피 2', piValue: 1 },

  // 8월 (공산 - 억새)
  { id: 'c08_kwang', month: 8, type: CARD_TYPE.KWANG, name: '공산 명월 광', score: 20, isKwang: true, tag: '光' },
  { id: 'c08_ten',   month: 8, type: CARD_TYPE.TEN,   name: '공산 기러기', godori: true, tag: '고도리' },
  { id: 'c08_pi1',   month: 8, type: CARD_TYPE.PI,    name: '공산 피 1', piValue: 1 },
  { id: 'c08_pi2',   month: 8, type: CARD_TYPE.PI,    name: '공산 피 2', piValue: 1 },

  // 9월 (국진 - 국화)
  { id: 'c09_ten',   month: 9, type: CARD_TYPE.TEN,   name: '국진 술잔 (쌍피전환 가능)', tag: '쌍피/열', canBeDoublePi: true },
  { id: 'c09_cheong',month: 9, type: CARD_TYPE.RIB,   name: '국화 청단', rib: RIB_TYPE.CHEONG, tag: '청단' },
  { id: 'c09_pi1',   month: 9, type: CARD_TYPE.PI,    name: '국화 피 1', piValue: 1 },
  { id: 'c09_pi2',   month: 9, type: CARD_TYPE.PI,    name: '국화 피 2', piValue: 1 },

  // 10월 (단풍)
  { id: 'c10_ten',   month: 10, type: CARD_TYPE.TEN,  name: '단풍 사슴', tag: '열끗' },
  { id: 'c10_cheong',month: 10, type: CARD_TYPE.RIB,  name: '단풍 청단', rib: RIB_TYPE.CHEONG, tag: '청단' },
  { id: 'c10_pi1',   month: 10, type: CARD_TYPE.PI,   name: '단풍 피 1', piValue: 1 },
  { id: 'c10_pi2',   month: 10, type: CARD_TYPE.PI,   name: '단풍 피 2', piValue: 1 },

  // 11월 (오동)
  { id: 'c11_kwang', month: 11, type: CARD_TYPE.KWANG, name: '오동 봉황 광', score: 20, isKwang: true, tag: '光' },
  { id: 'c11_pi_ssang', month: 11, type: CARD_TYPE.PI, name: '오동 쌍피 (똥쌍피)', piValue: 2, tag: '쌍피' },
  { id: 'c11_pi1',   month: 11, type: CARD_TYPE.PI,   name: '오동 피 1', piValue: 1 },
  { id: 'c11_pi2',   month: 11, type: CARD_TYPE.PI,   name: '오동 피 2', piValue: 1 },

  // 12월 (비)
  { id: 'c12_kwang', month: 12, type: CARD_TYPE.KWANG, name: '비 광', score: 20, isKwang: true, isBiKwang: true, tag: '雨光' },
  { id: 'c12_ten',   month: 12, type: CARD_TYPE.TEN,   name: '비 열끗 (제비)', tag: '열끗' },
  { id: 'c12_rib',   month: 12, type: CARD_TYPE.RIB,   name: '비 띠', rib: RIB_TYPE.NONE, tag: '비띠' },
  { id: 'c12_pi_ssang', month: 12, type: CARD_TYPE.PI, name: '비 쌍피', piValue: 2, tag: '쌍피' },

  // 보너스 패 2장
  { id: 'bonus_2pi', month: 0, type: CARD_TYPE.BONUS, name: '보너스 쌍피', piValue: 2, tag: '보너스 2皮' },
  { id: 'bonus_3pi', month: 0, type: CARD_TYPE.BONUS, name: '보너스 삼피', piValue: 3, tag: '보너스 3皮' }
];

/**
 * 카드의 고해상도 SVG 일러스트레이션 렌더링
 * @param {Object} card 카드 객체
 * @param {boolean} isBack 뒷면 여부
 * @returns {string} SVG HTML 문자열
 */
function renderCardSVG(card, isBack = false) {
  const w = 120;
  const h = 186;
  const rx = 10;

  if (isBack) {
    // 화투 뒷면 디자인 (강렬한 붉은 바탕에 전통 다이아몬드 격자/엠보싱 패턴)
    return `
      <svg class="hwatu-svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="backGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#b01b1b" />
            <stop offset="50%" stop-color="#8c1111" />
            <stop offset="100%" stop-color="#640909" />
          </linearGradient>
          <pattern id="backPattern" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M8,0 L16,8 L8,16 L0,8 Z" fill="none" stroke="#d94b4b" stroke-width="0.7" opacity="0.4"/>
            <circle cx="8" cy="8" r="1.5" fill="#e57373" opacity="0.5"/>
          </pattern>
        </defs>
        <rect width="${w}" height="${h}" rx="${rx}" fill="#111" />
        <rect x="3" y="3" width="${w-6}" height="${h-6}" rx="${rx-2}" fill="url(#backGrad)" stroke="#ff6b6b" stroke-width="1.5"/>
        <rect x="8" y="8" width="${w-16}" height="${h-16}" rx="5" fill="url(#backPattern)" />
        <circle cx="${w/2}" cy="${h/2}" r="22" fill="#600808" stroke="#ff8585" stroke-width="1.5" />
        <text x="${w/2}" y="${h/2 + 7}" font-family="'Noto Sans KR', sans-serif" font-size="20" font-weight="900" fill="#ffd166" text-anchor="middle" letter-spacing="1">花</text>
      </svg>
    `;
  }

  // 앞면 기본 팔레트
  const monthTheme = getMonthTheme(card.month);
  const tagBadge = getTagBadge(card);

  return `
    <svg class="hwatu-svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow_${card.id}" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
        </filter>
        <linearGradient id="cardBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#fffdfa"/>
          <stop offset="100%" stop-color="#f5ede0"/>
        </linearGradient>
      </defs>

      <!-- 카드 테두리 및 종이 질감 -->
      <rect width="${w}" height="${h}" rx="${rx}" fill="#222" />
      <rect x="2.5" y="2.5" width="${w-5}" height="${h-5}" rx="${rx-1}" fill="#b01b1b" />
      <rect x="6" y="6" width="${w-12}" height="${h-12}" rx="${rx-3}" fill="url(#cardBg)" stroke="#dcd0b8" stroke-width="0.8"/>

      <!-- 상단 월 표시 및 명칭 배지 -->
      <g transform="translate(10, 16)">
        <text font-family="'Noto Sans KR', sans-serif" font-size="11" font-weight="900" fill="#8c1111" opacity="0.9">${card.month > 0 ? card.month + '월' : '특수'}</text>
      </g>

      <!-- 중앙 화투 테마 일러스트레이션 -->
      ${renderIllustration(card, w, h)}

      <!-- 특수 태그 뱃지 (광/홍단/청단/초단/고도리/쌍피 등) -->
      ${tagBadge}
    </svg>
  `;
}

/**
 * 월별 대표 컬러 및 무드 반환
 */
function getMonthTheme(month) {
  const themes = {
    1: { name: '송학', color: '#1b4332' },
    2: { name: '매조', color: '#7209b7' },
    3: { name: '벚꽃', color: '#f72585' },
    4: { name: '흑싸리', color: '#2b2d42' },
    5: { name: '난초', color: '#3a0ca3' },
    6: { name: '모란', color: '#d90429' },
    7: { name: '홍싸리', color: '#9d0208' },
    8: { name: '공산', color: '#03045e' },
    9: { name: '국진', color: '#e85d04' },
    10: { name: '단풍', color: '#c1121f' },
    11: { name: '오동', color: '#480ca8' },
    12: { name: '비', color: '#14213d' },
    0: { name: '보너스', color: '#d4af37' }
  };
  return themes[month] || { name: '', color: '#333' };
}

/**
 * 카드 우측 상단/중앙 태그 배지 렌더링
 */
function getTagBadge(card) {
  if (card.isKwang) {
    // 붉은 광 엠블럼
    return `
      <g transform="translate(68, 12)">
        <circle cx="20" cy="20" r="17" fill="#d90429" stroke="#fff" stroke-width="2" />
        <circle cx="20" cy="20" r="14" fill="#ef233c" />
        <text x="20" y="27" font-family="'Noto Sans KR', 'Batang', serif" font-size="18" font-weight="900" fill="#fff" text-anchor="middle">光</text>
      </g>
    `;
  }
  if (card.godori) {
    // 고도리 새 엠블럼
    return `
      <g transform="translate(62, 12)">
        <rect x="0" y="0" width="46" height="20" rx="10" fill="#023e8a" stroke="#caf0f8" stroke-width="1.5"/>
        <text x="23" y="14" font-family="'Noto Sans KR', sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">고도리</text>
      </g>
    `;
  }
  if (card.rib === RIB_TYPE.HONG) {
    return `
      <g transform="translate(64, 12)">
        <rect x="0" y="0" width="44" height="20" rx="6" fill="#e63946" stroke="#fff" stroke-width="1"/>
        <text x="22" y="14" font-family="'Noto Sans KR', sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">홍단</text>
      </g>
    `;
  }
  if (card.rib === RIB_TYPE.CHEONG) {
    return `
      <g transform="translate(64, 12)">
        <rect x="0" y="0" width="44" height="20" rx="6" fill="#1d3557" stroke="#fff" stroke-width="1"/>
        <text x="22" y="14" font-family="'Noto Sans KR', sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">청단</text>
      </g>
    `;
  }
  if (card.rib === RIB_TYPE.CHO) {
    return `
      <g transform="translate(64, 12)">
        <rect x="0" y="0" width="44" height="20" rx="6" fill="#2a9d8f" stroke="#fff" stroke-width="1"/>
        <text x="22" y="14" font-family="'Noto Sans KR', sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">초단</text>
      </g>
    `;
  }
  if (card.piValue && card.piValue > 1) {
    // 쌍피, 삼피 뱃지
    return `
      <g transform="translate(62, 12)">
        <rect x="0" y="0" width="46" height="20" rx="6" fill="#f77f00" stroke="#fff" stroke-width="1.5"/>
        <text x="23" y="14" font-family="'Noto Sans KR', sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">${card.piValue}皮</text>
      </g>
    `;
  }
  if (card.canBeDoublePi) {
    return `
      <g transform="translate(56, 12)">
        <rect x="0" y="0" width="52" height="20" rx="6" fill="#7209b7" stroke="#fff" stroke-width="1"/>
        <text x="26" y="14" font-family="'Noto Sans KR', sans-serif" font-size="10" font-weight="900" fill="#fff" text-anchor="middle">쌍피/열</text>
      </g>
    `;
  }
  if (card.type === CARD_TYPE.TEN) {
    return `
      <g transform="translate(68, 12)">
        <circle cx="16" cy="10" r="10" fill="#fb8500" stroke="#fff" stroke-width="1"/>
        <text x="16" y="14" font-family="'Noto Sans KR', sans-serif" font-size="10" font-weight="900" fill="#fff" text-anchor="middle">十</text>
      </g>
    `;
  }
  if (card.type === CARD_TYPE.RIB) {
    return `
      <g transform="translate(68, 12)">
        <rect x="0" y="0" width="40" height="18" rx="5" fill="#6c757d" stroke="#fff" stroke-width="1"/>
        <text x="20" y="13" font-family="'Noto Sans KR', sans-serif" font-size="10" font-weight="900" fill="#fff" text-anchor="middle">띠</text>
      </g>
    `;
  }
  return '';
}

/**
 * 화투 각 장의 고유 일러스트레이션 렌더링
 */
function renderIllustration(card, w, h) {
  const cx = w / 2;
  const cy = h / 2 + 10;

  switch(card.id) {
    // 1월 송학
    case 'c01_kwang':
      return `
        <!-- 태양 -->
        <circle cx="85" cy="65" r="24" fill="#e63946" />
        <!-- 소나무 -->
        <path d="M20,165 Q40,110 50,85 Q65,115 100,145 L85,165 Z" fill="#1b4332" />
        <!-- 학 -->
        <ellipse cx="48" cy="115" rx="14" ry="24" fill="#ffffff" stroke="#222" stroke-width="1.2" transform="rotate(-15, 48, 115)"/>
        <path d="M48,93 L54,72 L44,72 Z" fill="#ffffff" />
        <circle cx="50" cy="70" r="7" fill="#ffffff" stroke="#222" stroke-width="1" />
        <circle cx="50" cy="67" r="2.5" fill="#e63946" />
        <polygon points="56,69 66,73 56,76" fill="#f4a261" />
        <path d="M42,136 L38,162 M52,135 L56,162" stroke="#222" stroke-width="2" />
      `;
    case 'c01_hong':
    case 'c01_pi1':
    case 'c01_pi2':
      return `
        <!-- 소나무 솔잎들 -->
        <path d="M15,165 C30,120 45,95 70,80 C60,115 80,140 105,165 Z" fill="#2d6a4f" />
        <circle cx="45" cy="105" r="16" fill="#1b4332" opacity="0.8"/>
        <circle cx="75" cy="125" r="20" fill="#1b4332" opacity="0.8"/>
        ${card.rib ? renderRibbon('홍단', '#d90429') : ''}
      `;

    // 2월 매화 (매조)
    case 'c02_ten':
      return `
        <!-- 매화 나뭇가지 -->
        <path d="M15,160 Q40,120 70,110 T105,70" stroke="#582f0e" stroke-width="7" fill="none" stroke-linecap="round"/>
        <!-- 매화꽃들 -->
        <circle cx="35" cy="135" r="10" fill="#e63946" />
        <circle cx="85" cy="95" r="10" fill="#e63946" />
        <circle cx="60" cy="70" r="11" fill="#e63946" />
        <!-- 꾀꼬리 (고도리) -->
        <ellipse cx="55" cy="105" rx="14" ry="9" fill="#ffd166" stroke="#333" stroke-width="1.2" transform="rotate(-15, 55, 105)"/>
        <circle cx="44" cy="99" r="6" fill="#ffd166" stroke="#333" stroke-width="1"/>
        <polygon points="38,98 30,101 38,104" fill="#e76f51" />
        <path d="M66,108 L78,116 L65,114 Z" fill="#2a9d8f" />
      `;
    case 'c02_hong':
    case 'c02_pi1':
    case 'c02_pi2':
      return `
        <path d="M20,165 Q50,110 80,85 T105,65" stroke="#7f4f24" stroke-width="6" fill="none" stroke-linecap="round"/>
        <circle cx="35" cy="140" r="9" fill="#ff4d6d" />
        <circle cx="65" cy="100" r="11" fill="#ff4d6d" />
        <circle cx="85" cy="75" r="9" fill="#ff4d6d" />
        ${card.rib ? renderRibbon('홍단', '#d90429') : ''}
      `;

    // 3월 벚꽃
    case 'c03_kwang':
      return `
        <!-- 벚꽃 만발 커튼(만막) -->
        <rect x="18" y="115" width="84" height="42" fill="#780000" rx="3"/>
        <rect x="23" y="120" width="74" height="32" fill="#669bbc" opacity="0.6"/>
        <path d="M20,115 C40,90 80,90 100,115" fill="#fdf0d5" stroke="#c1121f" stroke-width="2"/>
        <!-- 벚꽃 잎사귀들 -->
        <circle cx="35" cy="70" r="13" fill="#ff758f" />
        <circle cx="85" cy="65" r="14" fill="#ff758f" />
        <circle cx="60" cy="50" r="15" fill="#ff4d6d" />
      `;
    case 'c03_hong':
    case 'c03_pi1':
    case 'c03_pi2':
      return `
        <circle cx="35" cy="130" r="13" fill="#ff758f" />
        <circle cx="85" cy="120" r="14" fill="#ff758f" />
        <circle cx="50" cy="85" r="16" fill="#ff4d6d" />
        <circle cx="78" cy="65" r="12" fill="#ffb3c1" />
        ${card.rib ? renderRibbon('홍단', '#d90429') : ''}
      `;

    // 4월 흑싸리
    case 'c04_ten':
      return `
        <!-- 등나무 덩굴 -->
        <path d="M25,35 Q60,95 35,160 M85,35 Q50,105 85,160" stroke="#212529" stroke-width="5" fill="none"/>
        <circle cx="45" cy="65" r="8" fill="#495057" />
        <circle cx="75" cy="95" r="8" fill="#495057" />
        <!-- 두견새 (고도리) -->
        <ellipse cx="60" cy="115" rx="14" ry="9" fill="#f4a261" stroke="#222" stroke-width="1.2" transform="rotate(-30, 60, 115)"/>
        <circle cx="49" cy="108" r="6" fill="#e76f51" />
        <polygon points="44,107 36,108 44,112" fill="#d62828" />
      `;
    case 'c04_cho':
    case 'c04_pi1':
    case 'c04_pi2':
      return `
        <path d="M30,35 Q70,95 40,165 M90,40 Q55,105 80,165" stroke="#212529" stroke-width="6" fill="none"/>
        <ellipse cx="45" cy="70" rx="9" ry="6" fill="#343a40" />
        <ellipse cx="75" cy="100" rx="9" ry="6" fill="#343a40" />
        <ellipse cx="45" cy="130" rx="9" ry="6" fill="#343a40" />
        ${card.rib ? renderRibbon('초단', '#2a9d8f') : ''}
      `;

    // 5월 난초
    case 'c05_ten':
      return `
        <!-- 야츠하시(팔교/다리) -->
        <path d="M18,145 L102,125 L102,145 L18,165 Z" fill="#8d0801" stroke="#370617" stroke-width="1.5"/>
        <path d="M40,80 Q55,125 50,160 M75,65 Q60,115 80,160" stroke="#2d6a4f" stroke-width="4" fill="none"/>
        <circle cx="40" cy="80" r="10" fill="#3a0ca3" />
        <circle cx="75" cy="65" r="11" fill="#4361ee" />
      `;
    case 'c05_cho':
    case 'c05_pi1':
    case 'c05_pi2':
      return `
        <path d="M30,70 Q55,115 45,165 M65,60 Q50,110 70,165 M85,85 Q75,125 90,165" stroke="#1b4332" stroke-width="4" fill="none"/>
        <circle cx="35" cy="75" r="9" fill="#3a0ca3" />
        <circle cx="65" cy="60" r="11" fill="#4361ee" />
        <circle cx="85" cy="85" r="8" fill="#7209b7" />
        ${card.rib ? renderRibbon('초단', '#2a9d8f') : ''}
      `;

    // 6월 모란
    case 'c06_ten':
      return `
        <!-- 모란 꽃 -->
        <circle cx="50" cy="120" r="24" fill="#9d0208" />
        <circle cx="50" cy="120" r="16" fill="#d00000" />
        <circle cx="50" cy="120" r="8" fill="#ffba08" />
        <!-- 나비 -->
        <g transform="translate(68, 60)">
          <ellipse cx="14" cy="12" rx="9" ry="12" fill="#ffd166" stroke="#222" stroke-width="1" transform="rotate(-30, 14, 12)"/>
          <ellipse cx="28" cy="12" rx="9" ry="12" fill="#ffd166" stroke="#222" stroke-width="1" transform="rotate(30, 28, 12)"/>
          <ellipse cx="21" cy="16" rx="3" ry="8" fill="#222" />
        </g>
      `;
    case 'c06_cheong':
    case 'c06_pi1':
    case 'c06_pi2':
      return `
        <circle cx="55" cy="115" r="26" fill="#9d0208" />
        <circle cx="55" cy="115" r="17" fill="#dc2f02" />
        <circle cx="55" cy="115" r="8" fill="#ffdd00" />
        <path d="M30,155 Q55,130 85,155" stroke="#1b4332" stroke-width="5" fill="none"/>
        ${card.rib ? renderRibbon('청단', '#1d3557') : ''}
      `;

    // 7월 홍싸리
    case 'c07_ten':
      return `
        <!-- 홍싸리 풀숲 -->
        <path d="M20,165 Q45,100 30,55 M90,165 Q65,95 85,55" stroke="#c1121f" stroke-width="4" fill="none"/>
        <!-- 멧돼지 -->
        <ellipse cx="60" cy="125" rx="24" ry="16" fill="#582f0e" stroke="#222" stroke-width="1.5" />
        <circle cx="42" cy="123" r="10" fill="#7f4f24" />
        <polygon points="34,124 24,126 34,130" fill="#ddb892" />
        <circle cx="40" cy="120" r="2.5" fill="#000" />
        <path d="M48,138 L45,158 M68,138 L70,158" stroke="#333" stroke-width="3" />
      `;
    case 'c07_cho':
    case 'c07_pi1':
    case 'c07_pi2':
      return `
        <path d="M25,165 Q50,110 35,60 M65,165 Q50,100 70,60 M95,165 Q75,115 90,75" stroke="#ba181b" stroke-width="4" fill="none"/>
        <circle cx="35" cy="70" r="7" fill="#e5383b" />
        <circle cx="70" cy="65" r="8" fill="#e5383b" />
        <circle cx="90" cy="85" r="7" fill="#e5383b" />
        ${card.rib ? renderRibbon('초단', '#2a9d8f') : ''}
      `;

    // 8월 공산
    case 'c08_kwang':
      return `
        <!-- 칠흑의 밤하늘과 대형 보름달 -->
        <rect x="8" y="8" width="104" height="170" fill="#03071e" rx="4"/>
        <circle cx="60" cy="72" r="32" fill="#fff" />
        <circle cx="60" cy="72" r="30" fill="#ffea00" />
        <!-- 붉은 산과 억새 민둥산 -->
        <ellipse cx="60" cy="175" rx="58" ry="40" fill="#b7094c" />
        <ellipse cx="60" cy="180" rx="48" ry="32" fill="#111" />
      `;
    case 'c08_ten':
      return `
        <rect x="8" y="8" width="104" height="170" fill="#03071e" rx="4"/>
        <ellipse cx="60" cy="175" rx="55" ry="36" fill="#111" />
        <!-- 기러기 3마리 (고도리) -->
        <g stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round">
          <path d="M30,55 Q38,45 46,55 Q54,45 62,55" />
          <path d="M55,75 Q63,65 71,75 Q79,65 87,75" />
          <path d="M40,95 Q48,85 56,95 Q64,85 72,95" />
        </g>
      `;
    case 'c08_pi1':
    case 'c08_pi2':
      return `
        <rect x="8" y="8" width="104" height="170" fill="#03071e" rx="4"/>
        <ellipse cx="60" cy="170" rx="56" ry="38" fill="#a71d31" />
        <ellipse cx="60" cy="178" rx="48" ry="32" fill="#111" />
      `;

    // 9월 국진
    case 'c09_ten':
      return `
        <!-- 국화꽃 -->
        <circle cx="60" cy="100" r="26" fill="#f77f00" />
        <circle cx="60" cy="100" r="16" fill="#fcbf49" />
        <!-- 술잔(배) '壽' 각인 -->
        <ellipse cx="60" cy="138" rx="26" ry="12" fill="#d62828" stroke="#ffdd00" stroke-width="2"/>
        <text x="60" y="143" font-family="'Batang', serif" font-size="12" font-weight="900" fill="#fff" text-anchor="middle">壽</text>
      `;
    case 'c09_cheong':
    case 'c09_pi1':
    case 'c09_pi2':
      return `
        <circle cx="60" cy="110" r="26" fill="#f77f00" />
        <circle cx="60" cy="110" r="16" fill="#eae2b7" />
        <circle cx="60" cy="110" r="7" fill="#d62828" />
        ${card.rib ? renderRibbon('청단', '#1d3557') : ''}
      `;

    // 10월 단풍
    case 'c10_ten':
      return `
        <!-- 붉은 단풍잎 -->
        <circle cx="45" cy="70" r="16" fill="#ba181b" />
        <circle cx="85" cy="65" r="14" fill="#e5383b" />
        <!-- 사슴 -->
        <ellipse cx="58" cy="125" rx="18" ry="14" fill="#bb9457" stroke="#222" stroke-width="1.2"/>
        <circle cx="70" cy="110" r="8" fill="#ffe6a7" />
        <!-- 사슴 뿔 -->
        <path d="M72,104 L80,92 M78,98 L84,97" stroke="#6f1d1b" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M50,135 L48,162 M66,135 L68,162" stroke="#43281c" stroke-width="2.5" />
      `;
    case 'c10_cheong':
    case 'c10_pi1':
    case 'c10_pi2':
      return `
        <circle cx="40" cy="115" r="18" fill="#b7094c" />
        <circle cx="80" cy="105" r="16" fill="#c9184a" />
        <circle cx="60" cy="75" r="15" fill="#ff758f" />
        ${card.rib ? renderRibbon('청단', '#1d3557') : ''}
      `;

    // 11월 오동
    case 'c11_kwang':
      return `
        <!-- 오동 잎사귀 -->
        <path d="M18,160 C35,110 50,130 60,95 C70,130 85,110 102,160 Z" fill="#2b2d42" />
        <!-- 봉황의 머리와 깃털 -->
        <circle cx="60" cy="55" r="12" fill="#d90429" />
        <polygon points="68,52 82,56 68,60" fill="#ffb703" />
        <path d="M52,50 Q35,30 20,45 M55,46 Q45,20 32,25" stroke="#f72585" stroke-width="3" fill="none"/>
      `;
    case 'c11_pi_ssang':
      return `
        <!-- 오동 똥쌍피 - 세 개의 큼직한 흑오동 잎사귀 -->
        <path d="M15,160 C35,100 45,120 60,90 C75,120 85,100 105,160 Z" fill="#1d3557" />
        <ellipse cx="60" cy="80" rx="16" ry="20" fill="#e63946" opacity="0.85"/>
        <text x="60" y="86" font-family="'Noto Sans KR', sans-serif" font-size="14" font-weight="900" fill="#fff" text-anchor="middle">雙皮</text>
      `;
    case 'c11_pi1':
    case 'c11_pi2':
      return `
        <path d="M18,165 C38,115 50,130 60,105 C70,130 82,115 102,165 Z" fill="#2b2d42" />
        <circle cx="60" cy="98" r="10" fill="#f4a261" />
      `;

    // 12월 비 (오노노 토후/선비와 개구리)
    case 'c12_kwang':
      return `
        <!-- 수양버들 가지 -->
        <path d="M18,20 Q40,80 25,160 M102,20 Q80,80 95,160" stroke="#1b4332" stroke-width="4" fill="none"/>
        <!-- 삿갓 쓴 선비 (오노노 토후) -->
        <ellipse cx="50" cy="120" rx="16" ry="26" fill="#1d3557" />
        <!-- 우산/삿갓 -->
        <path d="M25,95 Q50,75 75,95 Z" fill="#d90429" stroke="#333" stroke-width="1.2"/>
        <rect x="48" y="94" width="4" height="30" fill="#f4a261" />
        <!-- 개구리 -->
        <ellipse cx="85" cy="145" rx="8" ry="6" fill="#52b788" />
        <circle cx="82" cy="142" r="2" fill="#000" />
      `;
    case 'c12_ten':
      return `
        <path d="M20,20 Q45,85 30,165 M100,20 Q75,85 90,165" stroke="#1b4332" stroke-width="4" fill="none"/>
        <!-- 제비 -->
        <path d="M50,85 L75,70 L65,95 L80,105 L55,95 Z" fill="#212529" stroke="#fff" stroke-width="0.8"/>
        <circle cx="52" cy="85" r="4" fill="#e63946" />
      `;
    case 'c12_rib':
      return `
        <path d="M22,20 Q45,85 32,165 M98,20 Q75,85 88,165" stroke="#1b4332" stroke-width="4" fill="none"/>
        <rect x="35" y="85" width="50" height="22" rx="4" fill="#c9184a" stroke="#fff" stroke-width="1"/>
        <text x="60" y="100" font-family="'Noto Sans KR', sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle">초단</text>
      `;
    case 'c12_pi_ssang':
      return `
        <!-- 비 쌍피 (라쇼몽 문/도깨비 손) -->
        <rect x="22" y="85" width="76" height="60" fill="#780000" rx="6"/>
        <path d="M22,85 L60,55 L98,85 Z" fill="#2b2d42" />
        <ellipse cx="60" cy="115" rx="14" ry="14" fill="#ffb703" />
        <text x="60" y="121" font-family="'Noto Sans KR', sans-serif" font-size="13" font-weight="900" fill="#000" text-anchor="middle">雙</text>
      `;

    // 보너스패
    case 'bonus_2pi':
      return `
        <circle cx="60" cy="100" r="34" fill="#d90429" stroke="#ffd166" stroke-width="3"/>
        <text x="60" y="96" font-family="'Noto Sans KR', sans-serif" font-size="18" font-weight="900" fill="#fff" text-anchor="middle">보너스</text>
        <text x="60" y="118" font-family="'Noto Sans KR', sans-serif" font-size="16" font-weight="900" fill="#ffd166" text-anchor="middle">2皮</text>
      `;
    case 'bonus_3pi':
      return `
        <circle cx="60" cy="100" r="34" fill="#ffd166" stroke="#d90429" stroke-width="3.5"/>
        <text x="60" y="96" font-family="'Noto Sans KR', sans-serif" font-size="18" font-weight="900" fill="#d90429" text-anchor="middle">황금</text>
        <text x="60" y="118" font-family="'Noto Sans KR', sans-serif" font-size="16" font-weight="900" fill="#6a040f" text-anchor="middle">3皮</text>
      `;

    default:
      return `
        <circle cx="60" cy="110" r="22" fill="#555" />
      `;
  }
}

/**
 * 띠(리본) 그래픽
 */
function renderRibbon(text, color) {
  return `
    <g transform="translate(20, 80)">
      <path d="M0,0 L70,-10 L80,14 L10,24 Z" fill="${color}" stroke="#fff" stroke-width="1.2" />
      <text x="42" y="10" font-family="'Noto Sans KR', sans-serif" font-size="11" font-weight="900" fill="#fff" text-anchor="middle" transform="rotate(-7, 42, 10)">${text}</text>
    </g>
  `;
}
