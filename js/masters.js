/**
 * 천하제일 맞고전 10인의 고수 (10단 ~ 1단 역순 도장깨기)
 * 단계별 프로필, 점당 판돈, 자금력, AI 성향 메타데이터 정의
 */

const MASTERS_DATA = [
  {
    dan: 10,
    title: '10단',
    name: '동네 복덕방 김씨',
    subtitle: '초보 건달 / 복덕방 마스코트',
    avatar: '👴',
    stakePerPoint: 10000,    // 점당 1만 전
    initialMoney: 1000000,   // 자금 100만 전
    minEntryMoney: 100000,   // 최소 입장 가능 머니
    difficulty: 'beginner',   // 10~8단: 초보
    quote: '에구구, 손이 떨리는구먼... 살살 쳐주시게나.',
    winConditionWins: 1       // 1승 시 9단 해금
  },
  {
    dan: 9,
    title: '9단',
    name: '골목길 뚝배기',
    subtitle: '뒷골목 주먹 대장',
    avatar: '🥊',
    stakePerPoint: 20000,    // 점당 2만 전
    initialMoney: 2000000,   // 자금 200만 전
    minEntryMoney: 200000,
    difficulty: 'beginner',
    quote: '판돈 두둑하게 챙겨왔냐? 내 뚝배기 맛 좀 볼래?',
    winConditionWins: 1
  },
  {
    dan: 8,
    title: '8단',
    name: '마포 쌍칼',
    subtitle: '마포 나루터의 검객',
    avatar: '🗡️',
    stakePerPoint: 30000,    // 점당 3만 전
    initialMoney: 3000000,   // 자금 300만 전
    minEntryMoney: 300000,
    difficulty: 'beginner',
    quote: '내 쌍칼보다 날카로운 패맛을 보여주지.',
    winConditionWins: 1
  },
  {
    dan: 7,
    title: '7단',
    name: '남대문 번개손',
    subtitle: '빛의 속도로 패를 섞는 손',
    avatar: '⚡',
    stakePerPoint: 40000,    // 점당 4만 전
    initialMoney: 5000000,   // 자금 500만 전
    minEntryMoney: 400000,
    difficulty: 'intermediate', // 7~4단: 중수
    quote: '눈 깜짝할 사이에 판이 끝날 거다. 똑바로 보라고!',
    winConditionWins: 2
  },
  {
    dan: 6,
    title: '6단',
    name: '종로 노름마치',
    subtitle: '종로 바닥을 쥐락펴락한 베테랑',
    avatar: '🎲',
    stakePerPoint: 50000,    // 점당 5만 전
    initialMoney: 7000000,   // 자금 700만 전
    minEntryMoney: 500000,
    difficulty: 'intermediate',
    quote: '판세를 읽지 못하면 이 바닥에서 살아남지 못해.',
    winConditionWins: 2
  },
  {
    dan: 5,
    title: '5단',
    name: '청량리 흑단',
    subtitle: '밤의 화투계를 지배하는 여걸',
    avatar: '🕶️',
    stakePerPoint: 60000,    // 점당 6만 전
    initialMoney: 10000000,  // 자금 1,000만 전
    minEntryMoney: 600000,
    difficulty: 'intermediate',
    quote: '여기까지 올라온 건 용하지만, 여긴 청량리다.',
    winConditionWins: 2
  },
  {
    dan: 4,
    title: '4단',
    name: '군산 불곰',
    subtitle: '군산 항구의 괴력 타짜',
    avatar: '🐻',
    stakePerPoint: 70000,    // 점당 7만 전
    initialMoney: 15000000,  // 자금 1,500만 전
    minEntryMoney: 700000,
    difficulty: 'intermediate',
    quote: '판이 커질수록 내 피가 끓는 법이지. 한 방에 쓸어주마!',
    winConditionWins: 2
  },
  {
    dan: 3,
    title: '3단',
    name: '부산 독사',
    subtitle: '물리면 반드시 파산하는 독사',
    avatar: '🐍',
    stakePerPoint: 80000,    // 점당 8만 전
    initialMoney: 20000000,  // 자금 2,000만 전
    minEntryMoney: 800000,
    difficulty: 'expert',    // 3~1단: 고수/타짜
    quote: '피 한 방울 남기지 않고 말려주지. 슬슬 기어 나와봐라.',
    winConditionWins: 3
  },
  {
    dan: 2,
    title: '2단',
    name: '지리산 작두',
    subtitle: '서슬 퍼런 심리전의 지배자',
    avatar: '🪓',
    stakePerPoint: 90000,    // 점당 9만 전
    initialMoney: 30000000,  // 자금 3,000만 전
    minEntryMoney: 900000,
    difficulty: 'expert',
    quote: '내 작두날 위에서 춤을 출 각오는 되어 있겠지?',
    winConditionWins: 3
  },
  {
    dan: 1,
    title: '1단',
    name: '전설의 타짜 평경장',
    subtitle: '천하를 호령하는 맞고의 신',
    avatar: '🎴',
    stakePerPoint: 100000,   // 점당 10만 전
    initialMoney: 50000000,  // 자금 5,000만 전
    minEntryMoney: 1000000,
    difficulty: 'expert',
    quote: '화투는 슬픈 드라마야... 아그야, 기술 들어간다잉.',
    winConditionWins: 5
  }
];

window.MASTERS_DATA = MASTERS_DATA;
