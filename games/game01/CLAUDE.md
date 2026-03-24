# 직장인 잔혹사 (game01)

2레인 도로 러너 게임. Phaser 3 + React 하이브리드.

## 게임 정보
- 이름: "직장인 잔혹사"
- 장르: 2레인 도로 러너
- 기준 해상도: 390×844 (iPhone 14)

## 현재 상태 (전환 중)
- 게임플레이: Phaser 3 ✅
- UI 화면 (메인, 게임오버, 설정): Phaser → React 전환 예정

## 주요 파일
- `src/game/config.ts` — Phaser 설정
- `src/game/scenes/BootScene.ts` — 메인 화면 (→ React 전환 예정)
- `src/game/scenes/CommuteScene.ts` — 게임플레이 + 게임오버
- `src/game/layout-types.ts` — 레이아웃 엔진 (computeLayout)
- `src/game/layout-loader.ts` — 레이아웃 JSON 로드
- `src/game/default-layouts.ts` — 기본 레이아웃 값
- `src/game/HUD.ts` — 게임 중 HUD
- `src/game/Player.ts` / `Road.ts` — 게임 로직

## 에셋 경로
```
public/
├── main-screen/      — main-bg, main-text, main-char, main-btn
├── game-over-screen/ — gameover-rabbit, btn-revive/home/challenge/ranking
├── character/        — rabbit-front/back/side
├── map/              — straight, corner tiles
├── ui/               — btn-settings, gauge, settings/
├── audio/bgm/        — menu.mp3, gameplay.mp3
├── audio/sfx/        — click, switch, forward, crash, combo 등
└── layout/           — main-screen.json, game-over.json
```

## 레이아웃 시스템
- 그룹 요소: order 순 세로 배치, gapPx 간격 (마이너스 허용), 화면 중앙 정렬
- 앵커 요소: 화면 모서리 기준 offset
- 모든 px는 `screenWidth / 390` 비율로 스케일
- admin 에디터에서 조절 → `public/layout/{screen}.json` 저장
- 텍스트 fontSize도 같은 비율로 스케일링 필요

## Phaser 설정
- antialias: true, roundPixels: false
- resolution: devicePixelRatio (레티나 지원)
- 모든 텍스처에 LINEAR 필터 적용
- 에셋 크기: 표시 크기의 2~3x 준비

## Cloudflare R2 Storage
- bucket: dragon-nine
- public URL: https://pub-a6e8e0aec44d4a69ae3ed4e096c5acc5.r2.dev
- 경로: game01/{category}/{filename}
