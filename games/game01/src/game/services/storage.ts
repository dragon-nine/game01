/**
 * LocalStorage 서비스 — 타입 안전한 키 관리
 *
 * 도메인별 그룹:
 *  - 환경 설정 (audio/debug/tutorial)
 *  - 진행 (best score)
 *  - 재화 (coins, gems)
 *  - 캐릭터 (selected, owned)
 *  - 진척 (출석 / 미션)
 */

const KEYS = {
  // 환경 설정 / 디버그
  godMode: 'godMode',
  bgmMuted: 'bgmMuted',
  sfxMuted: 'sfxMuted',
  tutorialDone: 'tutorialDone',

  // 진행 (점수)
  bestScore: 'bestScore',

  // 재화
  coins: 'coins',
  gems: 'gems',

  // 캐릭터
  selectedCharacter: 'selectedCharacter',
  ownedCharacters: 'ownedCharacters',

  // 진척
  attendance: 'attendance',
  missionState: 'missionState',
  playStats: 'playStats',
  freeRewardState: 'freeRewardState',
} as const;

const DEFAULT_CHARACTER = 'rabbit';

type BoolKey = 'godMode' | 'bgmMuted' | 'sfxMuted' | 'tutorialDone';
type NumKey = 'coins' | 'gems' | 'bestScore';

/* ──────────────  Date helpers  ────────────── */

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 이번 주 월요일 (KST 기준) — YYYY-MM-DD */
function thisMondayStr(): string {
  const d = new Date();
  const dow = d.getDay(); // 0=일, 1=월, ..., 6=토
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ──────────────  Types (출석/미션)  ────────────── */

export interface AttendanceState {
  /** 다음 받을 일차 (1~7). 7 받으면 1로 순환. */
  nextDay: number;
  /** 마지막 수령 날짜 (YYYY-MM-DD). 빈 문자열이면 한 번도 수령 안 함. */
  lastClaimDate: string;
}

export interface MissionPeriodState {
  /** 받은 미션 ID 목록 */
  claimed: string[];
  /** 리셋 키 — daily는 YYYY-MM-DD, weekly는 월요일의 YYYY-MM-DD */
  resetKey: string;
}

export interface MissionState {
  daily: MissionPeriodState;
  weekly: MissionPeriodState;
}

/** 미션 진행도 계산용 누적 통계 — 일/주 단위로 자동 리셋 */
export interface PlayStatsPeriod {
  /** 플레이한 판 수 */
  plays: number;
  /** 최고 점수 */
  bestScore: number;
  /** 도전장 보낸 횟수 */
  challenges: number;
  /** 리셋 키 — daily는 YYYY-MM-DD, weekly는 월요일 YYYY-MM-DD */
  resetKey: string;
}

export interface PlayStats {
  daily: PlayStatsPeriod;
  weekly: PlayStatsPeriod;
}

/** 상점 무료 보상 — 일 N회 제한용 카운트 (매일 자정 리셋) */
export interface FreeRewardState {
  /** 보상 id → 오늘 수령한 횟수 */
  counts: Record<string, number>;
  /** 리셋 키 YYYY-MM-DD */
  resetKey: string;
}

const DEFAULT_ATTENDANCE: AttendanceState = { nextDay: 1, lastClaimDate: '' };

function defaultFreeRewardState(): FreeRewardState {
  return { counts: {}, resetKey: todayStr() };
}

function defaultMissionState(): MissionState {
  return {
    daily: { claimed: [], resetKey: todayStr() },
    weekly: { claimed: [], resetKey: thisMondayStr() },
  };
}

function defaultPlayStats(): PlayStats {
  return {
    daily: { plays: 0, bestScore: 0, challenges: 0, resetKey: todayStr() },
    weekly: { plays: 0, bestScore: 0, challenges: 0, resetKey: thisMondayStr() },
  };
}

export const storage = {
  /* ──────────────  Bool  ────────────── */

  getBool(key: BoolKey): boolean {
    return localStorage.getItem(KEYS[key]) === 'true';
  },

  setBool(key: BoolKey, value: boolean): void {
    localStorage.setItem(KEYS[key], String(value));
  },

  removeBool(key: BoolKey): void {
    localStorage.removeItem(KEYS[key]);
  },

  toggleBool(key: BoolKey): boolean {
    const next = !this.getBool(key);
    this.setBool(key, next);
    return next;
  },

  /* ──────────────  Number  ────────────── */

  getNum(key: NumKey): number {
    return Number(localStorage.getItem(KEYS[key]) || '0');
  },

  setNum(key: NumKey, value: number): void {
    localStorage.setItem(KEYS[key], String(value));
  },

  addNum(key: NumKey, delta: number): number {
    // 방어: NaN/Infinity 거부, 0~MAX_SAFE_INTEGER로 클램프
    if (!Number.isFinite(delta)) {
      console.warn(`[storage] addNum rejected non-finite delta: ${delta}`);
      return this.getNum(key);
    }
    const current = this.getNum(key);
    const raw = current + delta;
    const next = Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, raw));
    this.setNum(key, next);
    return next;
  },

  /* ──────────────  Best Score (편의 래퍼)  ────────────── */

  getBestScore(): number {
    return this.getNum('bestScore');
  },

  setBestScore(score: number): void {
    this.setNum('bestScore', score);
  },

  updateBestScore(score: number): number {
    const best = Math.max(score, this.getBestScore());
    this.setBestScore(best);
    return best;
  },

  /* ──────────────  Character  ────────────── */

  getSelectedCharacter(): string {
    return localStorage.getItem(KEYS.selectedCharacter) || DEFAULT_CHARACTER;
  },

  setSelectedCharacter(id: string): void {
    localStorage.setItem(KEYS.selectedCharacter, id);
  },

  getOwnedCharacters(): string[] {
    const raw = localStorage.getItem(KEYS.ownedCharacters);
    if (!raw) return [DEFAULT_CHARACTER];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [DEFAULT_CHARACTER];
      return parsed.includes(DEFAULT_CHARACTER) ? parsed : [DEFAULT_CHARACTER, ...parsed];
    } catch {
      return [DEFAULT_CHARACTER];
    }
  },

  isOwnedCharacter(id: string): boolean {
    return this.getOwnedCharacters().includes(id);
  },

  addOwnedCharacter(id: string): void {
    const current = this.getOwnedCharacters();
    if (current.includes(id)) return;
    localStorage.setItem(KEYS.ownedCharacters, JSON.stringify([...current, id]));
  },

  /* ──────────────  Attendance  ────────────── */

  getAttendance(): AttendanceState {
    const raw = localStorage.getItem(KEYS.attendance);
    if (!raw) return { ...DEFAULT_ATTENDANCE };
    try {
      const parsed = JSON.parse(raw);
      if (
        typeof parsed?.nextDay === 'number' &&
        parsed.nextDay >= 1 && parsed.nextDay <= 7 &&
        typeof parsed?.lastClaimDate === 'string'
      ) {
        return parsed;
      }
    } catch { /* fallthrough */ }
    return { ...DEFAULT_ATTENDANCE };
  },

  setAttendance(state: AttendanceState): void {
    localStorage.setItem(KEYS.attendance, JSON.stringify(state));
  },

  /** 오늘 이미 받았는지 */
  isAttendanceClaimedToday(): boolean {
    return this.getAttendance().lastClaimDate === todayStr();
  },

  /**
   * 출석 보상 받기 — 오늘 이미 받았으면 null 반환.
   * 성공 시 { day, cycled } 반환 — day는 방금 받은 일차(1~7), cycled는 7→1 순환 여부.
   */
  claimAttendance(): { day: number; cycled: boolean } | null {
    const state = this.getAttendance();
    const today = todayStr();
    if (state.lastClaimDate === today) return null;
    const day = state.nextDay;
    const cycled = day === 7;
    const nextDay = cycled ? 1 : day + 1;
    this.setAttendance({ nextDay, lastClaimDate: today });
    return { day, cycled };
  },

  /* ──────────────  Mission  ────────────── */

  /**
   * 미션 상태 조회 — 날짜/주차가 바뀌었으면 자동 리셋.
   * 따라서 매번 호출해도 안전하며, 모달 마운트 시 한 번 부르면 충분.
   */
  getMissionState(): MissionState {
    const today = todayStr();
    const monday = thisMondayStr();
    const raw = localStorage.getItem(KEYS.missionState);
    let state: MissionState;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        state = isMissionState(parsed) ? parsed : defaultMissionState();
      } catch {
        state = defaultMissionState();
      }
    } else {
      state = defaultMissionState();
    }

    let mutated = false;
    if (state.daily.resetKey !== today) {
      state.daily = { claimed: [], resetKey: today };
      mutated = true;
    }
    if (state.weekly.resetKey !== monday) {
      state.weekly = { claimed: [], resetKey: monday };
      mutated = true;
    }
    if (mutated) this.setMissionState(state);
    return state;
  },

  setMissionState(state: MissionState): void {
    localStorage.setItem(KEYS.missionState, JSON.stringify(state));
  },

  /** 미션 받음 처리 — 중복 추가 안 함. 리턴은 갱신된 상태. */
  addClaimedMission(period: 'daily' | 'weekly', id: string): MissionState {
    const state = this.getMissionState();
    if (!state[period].claimed.includes(id)) {
      state[period].claimed.push(id);
      this.setMissionState(state);
    }
    return state;
  },

  /* ──────────────  Play Stats (미션 진행도 소스)  ────────────── */

  /** 일/주 통계 조회 — 날짜/주차 변경 시 자동 리셋 */
  getPlayStats(): PlayStats {
    const today = todayStr();
    const monday = thisMondayStr();
    const raw = localStorage.getItem(KEYS.playStats);
    let state: PlayStats;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        state = isPlayStats(parsed) ? parsed : defaultPlayStats();
      } catch {
        state = defaultPlayStats();
      }
    } else {
      state = defaultPlayStats();
    }
    let mutated = false;
    if (state.daily.resetKey !== today) {
      state.daily = { plays: 0, bestScore: 0, challenges: 0, resetKey: today };
      mutated = true;
    }
    if (state.weekly.resetKey !== monday) {
      state.weekly = { plays: 0, bestScore: 0, challenges: 0, resetKey: monday };
      mutated = true;
    }
    if (mutated) this.setPlayStats(state);
    return state;
  },

  setPlayStats(state: PlayStats): void {
    localStorage.setItem(KEYS.playStats, JSON.stringify(state));
  },

  /** 한 판 시작 시 호출 — 일/주 plays 둘 다 +1 */
  recordPlayStart(): void {
    const state = this.getPlayStats();
    state.daily.plays += 1;
    state.weekly.plays += 1;
    this.setPlayStats(state);
  },

  /** 한 판 종료 시 점수 갱신 — 일/주 bestScore에 max 적용 */
  recordPlayScore(score: number): void {
    const state = this.getPlayStats();
    if (score > state.daily.bestScore) state.daily.bestScore = score;
    if (score > state.weekly.bestScore) state.weekly.bestScore = score;
    this.setPlayStats(state);
  },

  /** 도전장 보낼 때 호출 — 일/주 challenges 둘 다 +1 */
  recordChallenge(): void {
    const state = this.getPlayStats();
    state.daily.challenges += 1;
    state.weekly.challenges += 1;
    this.setPlayStats(state);
  },

  /* ──────────────  Free Reward (상점 일 N회 제한)  ────────────── */

  /** 무료 보상 상태 조회 — 날짜 바뀌면 자동 리셋 */
  getFreeRewardState(): FreeRewardState {
    const today = todayStr();
    const raw = localStorage.getItem(KEYS.freeRewardState);
    let state: FreeRewardState;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        state = isFreeRewardState(parsed) ? parsed : defaultFreeRewardState();
      } catch {
        state = defaultFreeRewardState();
      }
    } else {
      state = defaultFreeRewardState();
    }
    if (state.resetKey !== today) {
      state = { counts: {}, resetKey: today };
      localStorage.setItem(KEYS.freeRewardState, JSON.stringify(state));
    }
    return state;
  },

  /** 특정 보상의 오늘 수령 횟수 */
  getFreeRewardCount(id: string): number {
    return this.getFreeRewardState().counts[id] || 0;
  },

  /** 수령 횟수 +1 후 새 값 반환 */
  incrementFreeRewardCount(id: string): number {
    const state = this.getFreeRewardState();
    const next = (state.counts[id] || 0) + 1;
    state.counts[id] = next;
    localStorage.setItem(KEYS.freeRewardState, JSON.stringify(state));
    return next;
  },
};

function isFreeRewardState(v: unknown): v is FreeRewardState {
  if (!v || typeof v !== 'object') return false;
  const s = v as Partial<FreeRewardState>;
  return (
    !!s.counts &&
    typeof s.counts === 'object' &&
    typeof s.resetKey === 'string'
  );
}

function isPlayStats(v: unknown): v is PlayStats {
  if (!v || typeof v !== 'object') return false;
  const s = v as Partial<PlayStats>;
  const okPeriod = (p?: PlayStatsPeriod) =>
    !!p &&
    typeof p.plays === 'number' &&
    typeof p.bestScore === 'number' &&
    typeof p.challenges === 'number' &&
    typeof p.resetKey === 'string';
  return okPeriod(s.daily) && okPeriod(s.weekly);
}

function isMissionState(v: unknown): v is MissionState {
  if (!v || typeof v !== 'object') return false;
  const s = v as Partial<MissionState>;
  const okPeriod = (p?: MissionPeriodState) =>
    !!p && Array.isArray(p.claimed) && typeof p.resetKey === 'string';
  return okPeriod(s.daily) && okPeriod(s.weekly);
}
