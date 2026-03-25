# Admin Agent - 어드민 페이지 담당

## 역할
Admin 페이지 UI/UX 개발, 에셋 관리, 레이아웃 에디터

## 구조
- 위치: `admin/` (Vite + React 19 + TypeScript)
- 빌드 출력: `dist/admin/`
- `base: '/admin/'`

## 페이지 구성
- `dashboard` — GameDashboard (게임 카드 그리드)
- `checklist` — TodoHomePage (Heart Rush 스타일 TO DO 체크리스트)
- `memo` — MemoTab (팀 메모)
- `shared-files` — SharedFilesTab (공유 파일)
- `game01-assets` — GameAssetsTab (에셋 관리)
- `game01-layout` — LayoutEditorTab (레이아웃 편집)
- `game01-launch` — LaunchPrepTab (출시 준비 이미지)
- `game01-content` — ContentTab (콘텐츠 관리)

## 사이드바
- Heart Rush 스타일 (Pretendard 폰트, 180px 고정)
- COMMON 섹션: 체크리스트, 메모, 공유 파일
- GAME01: 항상 펼침 / GAME02: 접힘
- 하단에 빌드 시간 표시

## UI 원칙
- **사이드바** 레이아웃 (탭 ❌)
- 카테고리 기본 **펼침**
- 이미지 교체는 **이미지 클릭** (별도 교체 버튼 ❌)
- shimmer 스켈레톤 (엑박 ❌)
- number input은 **NumInput 컴포넌트** (type="number" ❌)
- 요소 선택 시 고정 (빈 곳 클릭 해제 ❌)
- 가이드라인 ON/OFF 토글
- 마이너스 간격 허용

## 데이터 저장
- 체크리스트 (TodoHomePage): localStorage (`game01-todo-done`)
- 기존 체크리스트/메모: R2 JSON store (`admin/checklists.json`, `admin/memos.json`)
- 레이아웃: `/api/save-layout` → `public/layout/`

## 로컬 개발
- `npm run dev:admin` → localhost:5173
- vite config가 game01 dist + public 에셋 서빙
- `/game-assets/` → `games/game01/public/`

## 스토어 이미지 스펙

### Google Play
| 항목 | 크기 | 포맷 |
|------|------|------|
| 앱 로고 | 512x512 | PNG |
| 대표 이미지 | 1024x500 | JPEG/PNG |
| 스크린샷 | 1080x2160 | JPEG/PNG, 최소 2장 |

### 토스 인앱
| 항목 | 크기 | 포맷 |
|------|------|------|
| 앱 로고 | 600x600 | PNG |
| 가로형 썸네일 | 1932x828 | JPEG/PNG |
| 미리보기 | 636x1048 | JPEG/PNG, 최소 3장 |
