/**
 * 천하제일 맞고전 데이터 스토리지 매니저
 * 게스트 UUID, 보유 전, 10단~1단 도장깨기 진척도, 전적 영구 보관 (localStorage)
 */

class StorageManager {
  constructor() {
    this.STORAGE_KEY = 'CHUNHA_GOSTOP_USER_DATA_V1';
    this.userData = this.loadData();
  }

  // 초기 기본값
  getDefaultData() {
    return {
      userId: this.generateUUID(),
      nickname: '도전자 타짜',
      money: 1000000,           // 기본 시드머니 100만 전
      unlockedDan: 10,          // 10단부터 시작 (10 -> 9 -> 8 ... -> 1단)
      currentStageDan: 10,      // 현재 선택된 도전 상대
      stats: {
        totalGames: 0,
        wins: 0,
        losses: 0,
        maxWonMoney: 0
      },
      stageWins: {              // 각 단별 승리 횟수
        10: 0, 9: 0, 8: 0, 7: 0, 6: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0
      },
      createdAt: Date.now()
    };
  }

  generateUUID() {
    return 'guest_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
  }

  loadData() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...this.getDefaultData(), ...parsed };
      }
    } catch (e) {
      console.warn('로컬 스토리지 로드 실패, 기본값으로 시작:', e);
    }
    const def = this.getDefaultData();
    this.saveData(def);
    return def;
  }

  saveData(data = this.userData) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      this.userData = data;
    } catch (e) {
      console.error('로컬 스토리지 저장 실패:', e);
    }
  }

  // 보유 머니 가감
  addMoney(amount) {
    this.userData.money = Math.max(0, this.userData.money + amount);
    this.saveData();
    return this.userData.money;
  }

  // 승패 전적 기록 및 상위 단계 해금 판정
  recordGameResult(dan, isWin, wonMoney) {
    this.userData.stats.totalGames++;
    if (isWin) {
      this.userData.stats.wins++;
      this.userData.stageWins[dan] = (this.userData.stageWins[dan] || 0) + 1;
      if (wonMoney > this.userData.stats.maxWonMoney) {
        this.userData.stats.maxWonMoney = wonMoney;
      }

      // 상위 단계 해금 조건 검사 (역순 도장깨기: 10단 클리어 시 9단 해금)
      const master = (typeof MASTERS_DATA !== 'undefined') ? MASTERS_DATA.find(m => m.dan === dan) : null;
      const reqWins = master ? master.winConditionWins : 1;
      let newlyUnlockedDan = null;

      if (this.userData.stageWins[dan] >= reqWins && this.userData.unlockedDan === dan && dan > 1) {
        this.userData.unlockedDan = dan - 1; // 상위 단수 해금
        newlyUnlockedDan = dan - 1;
      }

      this.saveData();
      return { newlyUnlockedDan };
    } else {
      this.userData.stats.losses++;
      this.saveData();
      return { newlyUnlockedDan: null };
    }
  }

  // 보상형 광고 시청 완료 후 100만 전 무료 충전
  rewardAdBonus() {
    const bonus = 1000000; // 100만 전
    this.userData.money += bonus;
    this.saveData();
    return this.userData.money;
  }
}

// 싱글톤 전역 노출
window.storageManager = new StorageManager();
