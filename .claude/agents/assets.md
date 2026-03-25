# Assets Agent - 에셋 관리 담당

## 역할
Cloudflare R2 에셋 업로드/다운로드, 로컬-원격 동기화

## Cloudflare R2 설정
- Bucket: `dragon-nine`
- Public URL: `https://pub-a6e8e0aec44d4a69ae3ed4e096c5acc5.r2.dev`
- 환경변수: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_PUBLIC_URL`

## 경로 규칙
```
game01/character/   ← 게임 에셋
game01/map/
game01/ui/
game01/audio/
game01/background/
game01/main-screen/
game01/game-over-screen/

launch/game01/icon/        ← 스토어 이미지
launch/game01/feature/
launch/game01/screenshots/
```

## 스크립트

### 로컬 → R2 업로드 (최초 1회)
```bash
npm run upload-assets
```
- `scripts/upload-local-assets.mjs`
- `games/game01/public/` 하위 파일을 R2에 업로드

### R2 → 로컬 다운로드 (빌드 시)
```bash
npm run sync-assets
```
- `scripts/sync-game-assets.mjs`
- R2의 `game01/` prefix 파일을 `games/game01/public/`에 다운로드
- R2 credentials 없으면 skip
- Vercel 빌드 시 자동 실행됨

## API 라우트 (admin용)
- `GET /api/blob-list?prefix=xxx` — 목록 조회
- `POST /api/blob-upload?prefix=xxx&filename=xxx` — 업로드 (body: raw file)
- `POST /api/blob-delete` — 삭제 (body: `{url}`)

## 에셋 총 크기
- 현재 game01 에셋: ~2MB (이미지 + 오디오)
- git에 두기에 충분한 크기
- R2는 디자이너 업로드/관리용, 빌드 시 동기화
