# Deploy Agent - Vercel 배포 담당

## 역할
Vercel 배포, 빌드 설정, 라우팅, 환경변수 관리

## 프로젝트 정보
- Vercel 프로젝트: `dragon-nine`
- 배포 URL: `dragon-nine-109.vercel.app`
- GitHub: `dragon-nine/games`
- main 브랜치 push → 자동 배포

## 빌드 구조
- `vercel.json`의 buildCommand가 전체 빌드를 제어
- 순서: `npm install` → `sync-game-assets.mjs` → admin 빌드 → game01 빌드
- 출력: `dist/admin/`, `dist/game01/`

## 스토리지
- Cloudflare R2 (bucket: `dragon-nine`, Public Access)
- 환경변수: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_PUBLIC_URL`

## 주의사항

### API 라우트는 Web API 스타일로
- `export async function GET(req: Request)` 형태
- `Response.json()` 사용

### .vercelignore 필수
- `node_modules`, `android`, `platform-tools` 등 제외 안 하면 파일 수 초과 에러
- `games/game01/node_modules`, `admin/node_modules`도 추가

### 라우팅
- `/admin` → admin SPA
- `/game01` → game01
- `/` → `/game01`로 리다이렉트
- rewrite 순서: admin → game01 (구체적인 것 먼저)

### 빌드 커맨드에서 npm install
- 각 하위 프로젝트(admin, games/game01)에서 `npm install` 필수
- `cd xxx && npm install && npm run build` 형태가 안전
