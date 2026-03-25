import { useState } from 'react'

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

type TodoItem = { text: string; done: boolean; indent?: number }
type TodoPhase = { phase: string; items: TodoItem[] }

// ---------------------------------------------------------------------------
// 직장인 잔혹사 (game01) 개발 체크리스트 — 30년차 게임 PM 기준
// ---------------------------------------------------------------------------

const TODO_PHASES: TodoPhase[] = [
  {
    phase: 'P0: 출시 필수 (토스 인앱)',
    items: [
      { text: '코어 게임 루프 (시작→플레이→사망→재시작)', done: true },
      { text: 'React UI 오버레이 (메인/게임오버/일시정지/설정/HUD)', done: true },
      { text: '오디오 시스템 (BGM 1 + SFX 6)', done: true },
      { text: '토스 리더보드 연동 (submitScore + openLeaderboard)', done: true },
      { text: '토스 분석 이벤트 (game_start, game_over, revive 등)', done: true },
      { text: '부활 시스템 (세션당 1회, 하우스 광고)', done: true },
      { text: '설정 (BGM/SFX ON/OFF, localStorage 저장)', done: true },
      { text: '최고 기록 저장 (localStorage)', done: true },
      { text: '플랫폼 자동 감지 (Toss UA / 환경변수 / 쿼리파라미터)', done: true },
      { text: 'FTUE 튜토리얼 (첫 실행 시 조작법 안내)', done: false },
      { text: '로딩 화면 (BootScene 프리로드 중 스피너/로고)', done: false },
      { text: '토스 리더보드 실환경 테스트', done: false },
      { text: '토스 .ait 패키징 + 심사 제출', done: false },
    ],
  },
  {
    phase: 'P0: 출시 필수 (Google Play)',
    items: [
      { text: 'Google Play Console 게임 등록', done: false },
      { text: 'Google Play Games leaderboardId 설정', done: false },
      { text: 'Google Play Games 로그인 연동', done: false },
      { text: 'Firebase Analytics 연동 (GA4 이벤트 로깅)', done: false },
      { text: '앱 아이콘 최종 확정 (512×512)', done: false },
      { text: '스토어 스크린샷 (1080×2160, 최소 2장)', done: false },
      { text: '피처 그래픽 (1024×500)', done: false },
      { text: '스토어 등록 문구 작성 (ASO)', done: false },
      { text: '개인정보처리방침 URL', done: false },
      { text: 'Capacitor/TWA 네이티브 래핑', done: false },
      { text: '사업자등록 완료', done: false },
    ],
  },
  {
    phase: 'P1: 게임 폴리시 (리텐션 직결)',
    items: [
      { text: '콤보 카운터 팝업 (게임 중 10콤보마다 시각 피드백)', done: false },
      { text: '추락 파티클 이펙트 (먼지/별 파티클)', done: false },
      { text: 'New Record 연출 (글로우 + 축하 사운드)', done: false },
      { text: '점수 카운터 롤업 애니메이션 (게임오버)', done: false },
      { text: '게임플레이 BGM 추가 (플레이 중 별도 음악)', done: false },
      { text: '부활 카운트다운 사운드 (3-2-1 틱)', done: false },
      { text: '난이도 곡선 조정 (시간보너스 감소율 밸런싱)', done: false },
      { text: '게임오버 멘트 다양화 (R2 quotes 운영)', done: true },
    ],
  },
  {
    phase: 'P1: 수익화',
    items: [
      { text: '광고 SDK 연동 (AdMob 보상형)', done: false },
      { text: '부활 광고 stub → 실제 AdMob 연동', done: false },
      { text: '삽입 광고 (매 N게임 후 인터스티셜)', done: false },
      { text: 'IAP 검토 (광고 제거팩, 코스메틱 스킨)', done: false },
    ],
  },
  {
    phase: 'P2: 소셜 & 바이럴',
    items: [
      { text: '카카오톡/웹 공유 (점수 + 도전 링크)', done: false },
      { text: '점수 카드 이미지 캡처 공유', done: false },
      { text: '친구 챌린지 (URL 딥링크)', done: false },
      { text: '토스 인앱 챌린지 기능 활용', done: false },
    ],
  },
  {
    phase: 'P2: 비주얼 리파인',
    items: [
      { text: '캐릭터 스프라이트 리파인 (front/back/side)', done: false },
      { text: '맵 타일 디자인 리파인', done: false },
      { text: '배경 아트 업그레이드', done: false },
      { text: '메뉴 BGM 교체 (현재 placeholder)', done: false },
      { text: '화면 전환 애니메이션 (페이드/슬라이드)', done: false },
    ],
  },
  {
    phase: 'P3: 운영 & 인프라',
    items: [
      { text: '크래시 모니터링 (Sentry)', done: false },
      { text: '치트 방지 / 서버 사이드 점수 검증', done: false },
      { text: 'Rate Limiting (API 요청 제한)', done: false },
      { text: 'A/B 테스트 인프라 (난이도/UI 밸런싱)', done: false },
      { text: '다양한 해상도/비율 QA (SE~Pro Max, 갤럭시)', done: false },
      { text: '저사양 디바이스 성능 최적화', done: false },
    ],
  },
  {
    phase: '출시 전 QA 체크리스트',
    items: [
      { text: '풀 세션 플레이 (시작→사망→부활→사망→홈)', done: false },
      { text: '10콤보 달성 → 햅틱+사운드 확인', done: false },
      { text: '일시정지 → BGM/SFX 토글 → 재개 → 상태 유지 확인', done: false },
      { text: '타이머 0초 → 게임오버 정상 트리거 확인', done: false },
      { text: '3G 네트워크 → 로딩 화면/에러 없이 시작 확인', done: false },
      { text: '디바이스 회전 → 레이아웃 깨짐 없음 확인', done: false },
      { text: 'localStorage 초기화 후 첫 플레이 → 최고기록=현재기록 확인', done: false },
      { text: '연속 추락 10회 → 화면 셰이크+햅틱 정상 확인', done: false },
      { text: '리더보드 버튼 → 정상 오픈 확인 (토스/Google)', done: false },
      { text: '공유 버튼 → 챌린지 텍스트 생성 확인 (토스)', done: false },
    ],
  },
]

// ---------------------------------------------------------------------------
// Lucide-style icon
// ---------------------------------------------------------------------------

function LucideIcon({ d, size = 16, color = 'currentColor' }: { d: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  )
}

const CHECK_SQUARE_D = 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'

// ---------------------------------------------------------------------------
// LocalStorage persistence
// ---------------------------------------------------------------------------

const TODO_STORAGE_KEY = 'game01-todo-done'

function useTodoDone() {
  const [doneSet, setDoneSet] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(TODO_STORAGE_KEY)
      return raw ? new Set(JSON.parse(raw)) : new Set()
    } catch { return new Set() }
  })
  const toggle = (key: string) => {
    setDoneSet(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify([...next]))
      return next
    })
  }
  return { doneSet, toggle }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TodoHomePage() {
  const { doneSet, toggle } = useTodoDone()

  const allItems = TODO_PHASES.flatMap((p, pi) =>
    p.items.filter(it => it.indent === undefined || it.indent === 0).map((_, ii) => `${pi}-${ii}`)
  )
  const doneCount = allItems.filter(k => doneSet.has(k)).length
  const progress = Math.round((doneCount / allItems.length) * 100)

  return (
    <>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <LucideIcon d={CHECK_SQUARE_D} size={22} color="#3182F6" /> TO DO
      </h2>
      <div style={{ fontSize: 13, color: '#8B95A1', marginBottom: 20 }}>직장인 잔혹사 전체 개발 체크리스트</div>

      {/* 전체 진행률 */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E8ED', padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>전체 진행률</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#3182F6' }}>{doneCount} / {allItems.length} ({progress}%)</span>
        </div>
        <div style={{ background: '#F0F0F5', borderRadius: 100, height: 10, overflow: 'hidden' }}>
          <div style={{
            width: `${progress}%`, height: '100%', borderRadius: 100,
            background: 'linear-gradient(90deg, #3182F6, #60a5fa)',
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Phase별 체크리스트 */}
      {TODO_PHASES.map((phase, pi) => {
        let topIdx = -1
        const phaseKeys = phase.items.map((it) => {
          if (it.indent === undefined || it.indent === 0) topIdx++
          return `${pi}-${topIdx}`
        })
        const phaseTopKeys = phase.items
          .filter(it => it.indent === undefined || it.indent === 0)
          .map((_, i) => `${pi}-${i}`)
        const phaseDoneCount = phaseTopKeys.filter(k => doneSet.has(k)).length

        return (
          <div key={pi} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E8ED', padding: '20px 24px', marginBottom: 12 }}>
            {/* Phase 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#191F28' }}>{phase.phase}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: '#8B95A1' }}>{phaseDoneCount}/{phaseTopKeys.length}</span>
                <div style={{ background: '#F0F0F5', borderRadius: 100, height: 6, width: 80, overflow: 'hidden' }}>
                  <div style={{
                    width: phaseTopKeys.length > 0 ? `${Math.round((phaseDoneCount / phaseTopKeys.length) * 100)}%` : '0%',
                    height: '100%', borderRadius: 100,
                    background: phaseDoneCount === phaseTopKeys.length ? '#10b981' : '#3182F6',
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>
            </div>

            {/* 아이템 목록 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {phase.items.map((item, ii) => {
                const key = phaseKeys[ii]
                const done = doneSet.has(key)
                return (
                  <div key={ii} onClick={() => toggle(key)} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
                    marginLeft: item.indent ? item.indent * 24 : 0,
                    background: done ? '#F0FDF4' : 'transparent',
                  }}>
                    {/* 체크박스 */}
                    <div style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
                      border: done ? 'none' : '2px solid #D1D5DB',
                      background: done ? '#10b981' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 150ms',
                    }}>
                      {done && (
                        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                          <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    {/* 텍스트 */}
                    <span style={{
                      fontSize: item.indent ? 12 : 13,
                      color: done ? '#6B7280' : '#191F28',
                      textDecoration: done ? 'line-through' : 'none',
                      lineHeight: 1.5,
                      transition: 'all 150ms',
                    }}>
                      {item.text}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </>
  )
}
