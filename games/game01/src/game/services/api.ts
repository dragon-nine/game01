/**
 * Dragon Nine API 클라이언트 — 익명 인증 + 점수/랭킹/프로필
 *
 * 핵심 설계:
 *  - 첫 호출 시 device_id(localStorage 영속) 자동 생성 → /v1/auth/anonymous 호출 → JWT 저장
 *  - 모든 후속 호출은 저장된 토큰 사용. 401이면 1회 재인증 시도.
 *  - 네트워크/서버 실패는 호출자에게 throw — 호출자가 폴백 결정 (로컬 캐시, 무시 등)
 */

const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ||
  'https://dragon-nine-api.dragonnine.workers.dev';
const GAME_ID = 'game01';

const KEYS = {
  deviceId: 'api.deviceId',
  token: 'api.token',
  userId: 'api.userId',
};

/* ───── 타입 ───── */
export interface ApiProfile {
  user_id: string;
  game_id: string;
  nickname: string;
  character: string | null;
  best_score: number;
  total_plays: number;
  created_at: number;
  updated_at: number;
}
export interface LeaderEntry {
  rank: number;
  user_id: string;
  nickname: string;
  character: string | null;
  score: number;
}
export interface MyRank {
  period: 'daily' | 'weekly' | 'alltime';
  my_rank: number | null;
  my_score: number;
}

/* ───── device_id / token 보관 ───── */
function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(KEYS.deviceId);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEYS.deviceId, id);
  }
  return id;
}
export function getStoredToken(): string | null {
  return localStorage.getItem(KEYS.token);
}
export function getStoredUserId(): string | null {
  return localStorage.getItem(KEYS.userId);
}
function setSession(token: string, userId: string): void {
  localStorage.setItem(KEYS.token, token);
  localStorage.setItem(KEYS.userId, userId);
}

/* ───── 저수준 fetch ───── */
async function request<T>(path: string, init: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Game-Id': GAME_ID,
    ...(init.headers as Record<string, string> | undefined),
  };
  if (init.auth) {
    const token = getStoredToken();
    if (!token) throw new Error('not authenticated');
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(`API ${status}: ${message}`);
    this.status = status;
  }
}

/* ───── 인증 ───── */

/**
 * 익명 가입/로그인. 토큰이 이미 있어도 강제로 다시 받고 싶으면 force=true.
 * 반환된 profile에서 닉네임/캐릭터/베스트점수를 캐시할 것.
 */
export async function ensureAuth(opts: { force?: boolean; defaultNickname?: string; character?: string } = {}): Promise<{ token: string; profile: ApiProfile }> {
  if (!opts.force && getStoredToken()) {
    // 이미 토큰 있음 → 프로필만 가져와서 반환
    try {
      const p = await getMyProfile();
      return { token: getStoredToken()!, profile: p };
    } catch (e) {
      if (!(e instanceof ApiError) || e.status !== 401) throw e;
      // 401 → 토큰 만료, 재발급 진행
    }
  }
  const deviceId = getOrCreateDeviceId();
  const body: Record<string, string> = { device_id: deviceId };
  if (opts.defaultNickname) body.default_nickname = opts.defaultNickname;
  if (opts.character) body.character = opts.character;

  const res = await request<{ token: string; user: { id: string }; profile: ApiProfile }>(
    '/v1/auth/anonymous',
    { method: 'POST', body: JSON.stringify(body) },
  );
  setSession(res.token, res.user.id);
  return { token: res.token, profile: res.profile };
}

/* ───── 프로필 ───── */
export async function getMyProfile(): Promise<ApiProfile> {
  const r = await request<{ profile: ApiProfile }>('/v1/users/me', { auth: true });
  return r.profile;
}
export async function updateMyProfile(input: { nickname?: string; character?: string }): Promise<ApiProfile> {
  const r = await request<{ profile: ApiProfile }>('/v1/users/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
    auth: true,
  });
  return r.profile;
}

/* ───── 점수 ───── */
export async function submitScore(score: number, meta?: Record<string, unknown>): Promise<{ ok: true; score: number; daily_key: string; weekly_key: string }> {
  return request('/v1/scores', {
    method: 'POST',
    body: JSON.stringify({ score, meta }),
    auth: true,
  });
}

/* ───── 랭킹 ───── */
export type Period = 'daily' | 'weekly' | 'alltime';

export async function fetchLeaderboard(period: Period, limit = 10): Promise<{ period: Period; ranked: LeaderEntry[] }> {
  return request(`/v1/leaderboard?period=${period}&limit=${limit}`);
}
export async function fetchMyRank(period: Period): Promise<MyRank> {
  return request(`/v1/leaderboard/me?period=${period}`, { auth: true });
}
