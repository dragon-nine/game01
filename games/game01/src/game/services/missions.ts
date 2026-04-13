/**
 * 미션 정의 + 진행도 계산 헬퍼.
 *
 * 단일 진실 원천 — MissionModal과 HomeTab 뱃지 양쪽에서 동일한 데이터를 사용.
 */

import { storage, type PlayStats } from './storage';

export type MissionPeriod = 'daily' | 'weekly';

/** 어떤 통계로 진행도를 측정할지 결정하는 키 */
export type MissionStatKey =
  | 'plays'        // 플레이 횟수
  | 'bestScore'    // 최고 점수
  | 'challenges';  // 도전장 횟수

export interface MissionReward {
  coin?: number;
  gem?: number;
}

export interface MissionDef {
  id: string;
  /** 짧은 라벨 (예: "출근 도장") — 디버그/내부용 */
  title: string;
  /** 화면에 표시되는 조건 텍스트 */
  desc: string;
  /** 어떤 통계로 측정 */
  statKey: MissionStatKey;
  /** 목표 값 */
  target: number;
  /** 보상 */
  reward: MissionReward;
  /** 같은 기간의 다른 미션을 모두 받아야 활성화되는 메타 미션 */
  isAllClear?: boolean;
}

/* ── 일일 미션 (매일 00시 리셋, 총 코인 150) ── */

export const DAILY_MISSIONS: MissionDef[] = [
  { id: 'd1',    title: '출근 도장',  desc: '첫 판 플레이',        statKey: 'plays',     target: 1,   reward: { coin: 30 } },
  { id: 'd2',    title: '연속 퇴근',  desc: '10판 플레이',         statKey: 'plays',     target: 10,  reward: { coin: 50 } },
  { id: 'd3',    title: '오늘의 목표', desc: '100점 이상 달성',     statKey: 'bestScore', target: 100, reward: { coin: 40 } },
  { id: 'd_all', title: '올클리어',    desc: '오늘 미션 3개 모두',  statKey: 'plays',     target: 3,   reward: { coin: 30 }, isAllClear: true },
];

/* ── 주간 미션 (월요일 리셋, 총 코인 1000 + 보석 5) ── */

export const WEEKLY_MISSIONS: MissionDef[] = [
  { id: 'w1',    title: '주간 근무',   desc: '50판 플레이',        statKey: 'plays',      target: 50,  reward: { coin: 200 } },
  { id: 'w2',    title: '실력 인정',   desc: '300점 이상 1회',     statKey: 'bestScore',  target: 300, reward: { coin: 150 } },
  { id: 'w3',    title: '도전장 장인', desc: '도전장 3회 공유',    statKey: 'challenges', target: 3,   reward: { coin: 150 } },
  { id: 'w4',    title: '야근 마스터', desc: '100판 플레이',       statKey: 'plays',      target: 100, reward: { coin: 200, gem: 2 } },
  { id: 'w5',    title: '에이스 사원', desc: '800점 이상 1회',     statKey: 'bestScore',  target: 800, reward: { coin: 100, gem: 3 } },
  { id: 'w_all', title: '올클리어',    desc: '주간 미션 5개 모두', statKey: 'plays',      target: 5,   reward: { coin: 200 }, isAllClear: true },
];

/** 통계 객체에서 특정 statKey 값 추출 */
export function readStat(stats: PlayStats, period: MissionPeriod, key: MissionStatKey): number {
  return stats[period][key];
}

/**
 * 미션 진행도 계산.
 * - 일반 미션: 통계값 사용
 * - 올클리어: 같은 기간의 일반 미션 중 받은 개수
 */
export function computeMissionCurrent(
  mission: MissionDef,
  period: MissionPeriod,
  stats: PlayStats,
  claimedIds: ReadonlySet<string>,
): number {
  if (mission.isAllClear) {
    const list = period === 'daily' ? DAILY_MISSIONS : WEEKLY_MISSIONS;
    return list.filter((m) => !m.isAllClear && claimedIds.has(m.id)).length;
  }
  return readStat(stats, period, mission.statKey);
}

/** 단일 미션이 받기 가능한 상태인지 (완료 + 미수령) */
export function isClaimable(
  mission: MissionDef,
  period: MissionPeriod,
  stats: PlayStats,
  claimedIds: ReadonlySet<string>,
): boolean {
  if (claimedIds.has(mission.id)) return false;
  const current = computeMissionCurrent(mission, period, stats, claimedIds);
  return current >= mission.target;
}

/** 받기 가능한 미션의 총 개수 (홈 뱃지용) */
export function getClaimableMissionCount(): number {
  const stats = storage.getPlayStats();
  const ms = storage.getMissionState();
  const dailyClaimed = new Set(ms.daily.claimed);
  const weeklyClaimed = new Set(ms.weekly.claimed);

  let count = 0;
  for (const m of DAILY_MISSIONS) {
    if (isClaimable(m, 'daily', stats, dailyClaimed)) count++;
  }
  for (const m of WEEKLY_MISSIONS) {
    if (isClaimable(m, 'weekly', stats, weeklyClaimed)) count++;
  }
  return count;
}
