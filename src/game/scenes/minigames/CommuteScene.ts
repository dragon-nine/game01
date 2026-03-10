import Phaser from 'phaser';
import { GameManager } from '../../GameManager';
import { emitGameState } from '../../GameBridge';

/* ══════════════════════════════════════
   STAGE 1: 천국의 계단 — 2-Lane Road Runner

   조작: 왼쪽 버튼 = 레인 전환, 오른쪽 버튼 = 전진
   2레인 도로가 위로 꼬불꼬불 이어지고,
   토끼가 올바른 레인에서 전진해야 살아남음
   ══════════════════════════════════════ */

type Lane = 'left' | 'right';
type RoadType = 'left' | 'right';

interface RoadRow {
  type: RoadType;
  isTurn: boolean;   // 꺾이는 칸 (양쪽 레인 모두 이동 가능)
  y: number;
  leftTile?: Phaser.GameObjects.Image;
  rightTile?: Phaser.GameObjects.Image;
  decoration?: Phaser.GameObjects.Container;
}

// Layout constants
const FALL_PENALTY_SEC = 3;

export class CommuteScene extends Phaser.Scene {
  private stageId!: number;
  private timeLeft = 60;
  private timerEvent?: Phaser.Time.TimerEvent;
  private timerText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private score = 0;
  private gameOver = false;
  private debugMode = false;

  // Road
  private rows: RoadRow[] = [];
  private currentRowIdx = 0;
  private roadContainer!: Phaser.GameObjects.Container;

  // Player
  private player!: Phaser.GameObjects.Image;
  private currentLane: Lane = 'left';

  // Lane X positions
  private laneX = { left: 0, right: 0 };
  private laneW = 0;
  private tileH = 0;

  // State
  private isFalling = false;
  private comboCount = 0;
  private bestCombo = 0;
  private justSwitched = false; // 레인 전환 직후 여부

  // Background grid
  private gridGfx!: Phaser.GameObjects.Graphics;
  private padding = 0;

  constructor() {
    super({ key: 'CommuteScene' });
  }

  preload() {
    // 이미 로드됐으면 스킵
    if (!this.textures.exists('tile-straight')) {
      this.load.image('tile-straight', 'tiles/straight.png');
    }
    if (!this.textures.exists('tile-corner-tl')) {
      this.load.image('tile-corner-tl', 'tiles/corner-tl.png');
    }
    if (!this.textures.exists('tile-corner-tr')) {
      this.load.image('tile-corner-tr', 'tiles/corner-tr.png');
    }
    if (!this.textures.exists('tile-corner-bl')) {
      this.load.image('tile-corner-bl', 'tiles/corner-bl.png');
    }
    if (!this.textures.exists('tile-corner-br')) {
      this.load.image('tile-corner-br', 'tiles/corner-br.png');
    }
    if (!this.textures.exists('building1')) {
      this.load.image('building1', 'tiles/building1.png');
    }
    if (!this.textures.exists('building2')) {
      this.load.image('building2', 'tiles/building2.png');
    }
    if (!this.textures.exists('rabbit')) {
      this.load.image('rabbit', 'tiles/rabbit.png');
    }
    if (!this.textures.exists('btn-forward')) {
      this.load.image('btn-forward', 'tiles/btn-forward.png');
    }
    if (!this.textures.exists('btn-switch')) {
      this.load.image('btn-switch', 'tiles/btn-switch.png');
    }
  }

  init(data: { stageId: number; debug?: boolean }) {
    this.stageId = data.stageId;
    this.debugMode = data.debug ?? false;
    this.timeLeft = 60;
    this.score = 0;
    this.gameOver = false;
    this.rows = [];
    this.currentRowIdx = 0;
    this.isFalling = false;
    this.comboCount = 0;
    this.bestCombo = 0;
    this.currentLane = 'left';
    this.straightRemaining = 0;
    this.justSwitched = false;
  }

  create() {
    const { width, height } = this.scale;
    const stage = GameManager.getCurrentStage();
    this.cameras.main.setBackgroundColor('#000000');

    // Lane dimensions — 양쪽 패딩 후 정사각형 타일
    this.padding = 30;
    const padding = this.padding;
    const roadW = width - padding * 2;
    this.laneW = roadW / 2;
    this.tileH = this.laneW; // 정사각형 타일
    this.laneX = {
      left: padding + this.laneW / 2,
      right: padding + this.laneW + this.laneW / 2,
    };

    // ── Dark grid background (비활성) ──
    this.gridGfx = this.add.graphics().setDepth(0);

    // ── 도로 영역 뒤 검정 차단막: 격자선이 코너 타일 투명부분으로 비치는 것 방지 ──
    const roadMask = this.add.rectangle(
      padding + this.laneW, height / 2,
      this.laneW * 2, height * 10,
      0x000000, 1,
    ).setDepth(1);

    // ── Road container (scrolls) ──
    this.roadContainer = this.add.container(0, 0).setDepth(5);
    this.generateInitialRoad(height);

    // ── Player ──
    this.createPlayer();

    // ── HUD ──
    this.createHUD(width);

    // ── Buttons ──
    this.createButtons(width, height);

    this.emitState();
  }

  /* ══════════════════════════════════════
     Background grid
     ══════════════════════════════════════ */

  private startY = 0; // 첫 타일 Y 위치 저장

  private drawGrid(w: number, h: number) {
    this.gridGfx.clear();
    this.gridGfx.lineStyle(1, 0x333355, 0.3);

    // 세로선: 패딩 안쪽 타일 가장자리
    const p = this.padding;
    this.gridGfx.lineBetween(p, 0, p, h);
    this.gridGfx.lineBetween(p + this.laneW, 0, p + this.laneW, h);
    this.gridGfx.lineBetween(p + this.laneW * 2, 0, p + this.laneW * 2, h);

    // 가로선: 타일 가장자리에 맞춰 스크롤
    const containerY = this.roadContainer ? this.roadContainer.y : 0;
    const tileTopBase = this.startY - this.tileH / 2 + containerY;
    const offsetY = ((tileTopBase % this.tileH) + this.tileH) % this.tileH;
    for (let y = offsetY; y <= h + this.tileH; y += this.tileH) {
      this.gridGfx.lineBetween(0, y, w, y);
    }
  }

  update() {
    // grid disabled
  }

  /* ══════════════════════════════════════
     Road generation
     ══════════════════════════════════════ */

  private generateInitialRoad(height: number) {
    this.startY = height - 200;
    const startY = this.startY;

    // First row: left lane, 초반에 바로 꺾임 나오도록
    this.straightRemaining = 1;
    this.addRoadRow('left', startY);

    // Generate ahead
    for (let i = 0; i < 25; i++) {
      this.addNextRow();
    }
  }

  private addRoadRow(type: RoadType, y: number) {
    const prev = this.rows.length > 0 ? this.rows[this.rows.length - 1] : null;
    const isTurn = prev !== null && prev.type !== type;
    const row: RoadRow = { type, y, isTurn };

    if (isTurn) {
      // 꺾이는 칸: 코너 타일 2개로 ㄱ/ㄴ자 표현
      if (prev!.type === 'left' && type === 'right') {
        // 좌→우 전환
        row.leftTile = this.createTileImage(this.laneX.left, y, 'tile-corner-tl');
        row.rightTile = this.createTileImage(this.laneX.right, y, 'tile-corner-br');
      } else {
        // 우→좌 전환
        row.leftTile = this.createTileImage(this.laneX.left, y, 'tile-corner-bl');
        row.rightTile = this.createTileImage(this.laneX.right, y, 'tile-corner-tr');
      }
      this.roadContainer.add(row.leftTile);
      this.roadContainer.add(row.rightTile);
    } else if (type === 'left') {
      // 직선 왼쪽 레인
      row.leftTile = this.createTileImage(this.laneX.left, y, 'tile-straight');
      this.roadContainer.add(row.leftTile);
    } else {
      // 직선 오른쪽 레인 (좌우 반전)
      row.rightTile = this.createTileImage(this.laneX.right, y, 'tile-straight', true);
      this.roadContainer.add(row.rightTile);
    }

    // 빈 레인(길이 없는 쪽)에 빌딩 장애물 배치
    if (!isTurn) {
      this.placeObstacle(row, type, y);
    }

    this.rows.push(row);
  }

  private createTileImage(
    x: number, y: number, key: string, flipX = false,
  ): Phaser.GameObjects.Image {
    const img = this.add.image(x, y, key)
      .setDisplaySize(this.laneW, this.tileH)
      .setOrigin(0.5, 0.5)
      .setFlipX(flipX);
    return img;
  }

  private addNextRow() {
    const last = this.rows[this.rows.length - 1];
    const nextY = last.y - this.tileH;
    const nextType = this.pickNextRoadType(last.type);
    this.addRoadRow(nextType, nextY);
  }

  // 직선 구간 남은 칸 수
  private straightRemaining = 0;

  private pickNextRoadType(prevType: RoadType): RoadType {
    // 직선 구간이 남아있으면 같은 레인 유지
    if (this.straightRemaining > 0) {
      this.straightRemaining--;
      return prevType;
    }

    // 직선 구간 끝 → 반대 레인으로 꺾고, 새 직선 구간 시작 (0~4칸, 0이면 바로 또 꺾임)
    this.straightRemaining = Math.floor(Math.random() * 5);
    return prevType === 'left' ? 'right' : 'left';
  }

  /* ══════════════════════════════════════
     Obstacles (빌딩 이미지)
     ══════════════════════════════════════ */

  private placeObstacle(row: RoadRow, type: RoadType, y: number) {
    const emptyX = type === 'left' ? this.laneX.right : this.laneX.left;
    const key = Math.random() < 0.5 ? 'building1' : 'building2';
    const size = this.laneW * 0.55 + Math.random() * this.laneW * 0.2;
    const obstacle = this.add.image(emptyX, y, key)
      .setDisplaySize(size, size)
      .setOrigin(0.5, 0.5)
      .setDepth(6);
    this.roadContainer.add(obstacle);
    row.decoration = this.add.container(0, 0);
    row.decoration.add(obstacle);
    this.roadContainer.add(row.decoration);
  }

  /* ══════════════════════════════════════
     Player (Rabbit)
     ══════════════════════════════════════ */

  private createPlayer() {
    const { height } = this.scale;
    const startX = this.laneX.left;
    const startY = height - 200;
    const rabbitSize = this.laneW * 0.45;

    this.player = this.add.image(startX, startY, 'rabbit')
      .setDisplaySize(rabbitSize, rabbitSize)
      .setOrigin(0.5, 0.5)
      .setDepth(150);
  }

  private setPlayerHurt(hurt: boolean) {
    this.player.setTint(hurt ? 0xff4444 : 0xffffff);
  }

  /* ══════════════════════════════════════
     HUD
     ══════════════════════════════════════ */

  private createHUD(width: number) {
    // Stage number
    const stageBg = this.add.rectangle(50, 30, 50, 32, 0x000000, 0.7)
      .setStrokeStyle(2, 0xffffff).setDepth(200);
    this.scoreText = this.add.text(50, 30, '01', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(201);

    // Timer bar
    const barBg = this.add.rectangle(width / 2, 30, width - 160, 24, 0x333333, 0.8)
      .setStrokeStyle(2, 0x555555).setDepth(200);
    this.timerText = this.add.text(width / 2, 30, '', {
      fontFamily: 'monospace', fontSize: '1px', color: '#00000000',
    }).setOrigin(0.5).setDepth(201);

    // Green timer fill (will shrink over time)
    const barW = width - 164;
    const timerFill = this.add.rectangle(
      width / 2 - barW / 2 + barW / 2, 30,
      barW, 18, 0x44cc44, 1
    ).setDepth(201);

    // Score / alarm icon
    const alarmBg = this.add.rectangle(width - 50, 30, 60, 32, 0x000000, 0.7)
      .setStrokeStyle(2, 0xffffff).setDepth(200);
    const alarmText = this.add.text(width - 50, 30, '⏰ 60', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(201);

    // Diagonal stripes on timer bar
    const stripeGfx = this.add.graphics().setDepth(202);

    this.timerEvent = this.time.addEvent({
      delay: 1000, repeat: 59,
      callback: () => {
        this.timeLeft--;
        alarmText.setText(`⏰ ${this.timeLeft}`);
        // Shrink timer fill
        const pct = this.timeLeft / 60;
        timerFill.setScale(pct, 1);
        timerFill.x = width / 2 - barW / 2 + (barW * pct) / 2;

        if (this.timeLeft <= 10) {
          timerFill.setFillStyle(0xff4444);
          alarmText.setColor('#ff4444');
        }
        if (this.timeLeft <= 0) this.endGame();
      },
    });
  }

  /* ══════════════════════════════════════
     Buttons
     ══════════════════════════════════════ */

  private createButtons(width: number, height: number) {
    const btnSize = 200;
    const btnY = height - 115;

    // ── Left button: 레인전환 ──
    const leftBtnX = btnSize / 2 + 10;
    const leftBtn = this.add.image(leftBtnX, btnY, 'btn-switch')
      .setDisplaySize(btnSize, btnSize)
      .setInteractive({ useHandCursor: true }).setDepth(200);

    leftBtn.on('pointerdown', () => {
      if (this.gameOver || this.isFalling) return;
      this.switchLane();
      const small = btnSize * 0.85;
      this.tweens.add({
        targets: leftBtn, displayWidth: small, displayHeight: small,
        duration: 80, yoyo: true, ease: 'Quad.easeOut',
      });
    });

    // ── Right button: 전진 ──
    const rightBtnX = width - btnSize / 2 - 10;
    const rightBtn = this.add.image(rightBtnX, btnY, 'btn-forward')
      .setDisplaySize(btnSize, btnSize)
      .setInteractive({ useHandCursor: true }).setDepth(200);

    rightBtn.on('pointerdown', () => {
      if (this.gameOver || this.isFalling) return;
      this.moveForward();
      const small = btnSize * 0.85;
      this.tweens.add({
        targets: rightBtn, displayWidth: small, displayHeight: small,
        duration: 80, yoyo: true, ease: 'Quad.easeOut',
      });
    });
  }

  /* ══════════════════════════════════════
     Movement logic
     ══════════════════════════════════════ */

  /** ↔ 버튼: 옆으로만 이동 (꺾이는 칸에서만 가능, 연속 전환 불가) */
  private switchLane() {
    const opposite: Lane = this.currentLane === 'left' ? 'right' : 'left';

    // 이미 전환한 상태에서 또 전환 = 회전 후 부딪힘
    // 현재 칸이 꺾이는 칸이 아니면 = 회전 후 부딪힘
    const currentRow = this.rows[this.currentRowIdx];
    const canSwitch = !this.justSwitched && currentRow?.isTurn;

    const targetAngle = opposite === 'right' ? 90 : -90;

    if (!canSwitch) {
      // 회전 → 살짝 이동 시도 → 부딪힘
      this.isFalling = true;
      this.tweens.add({
        targets: this.player,
        angle: targetAngle,
        duration: 100, ease: 'Quad.easeOut',
        onComplete: () => {
          const bumpX = this.player.x + (opposite === 'right' ? 30 : -30);
          this.tweens.add({
            targets: this.player,
            x: bumpX,
            duration: 80, ease: 'Quad.easeOut',
            onComplete: () => {
              this.onCrash(opposite);
            },
          });
        },
      });
      return;
    }

    this.currentLane = opposite;
    this.justSwitched = true;

    // 1) 먼저 이동 방향으로 회전
    this.tweens.add({
      targets: this.player,
      angle: targetAngle,
      duration: 100, ease: 'Quad.easeOut',
      onComplete: () => {
        // 2) 회전 끝나면 옆으로 이동
        this.tweens.add({
          targets: this.player,
          x: this.laneX[opposite],
          duration: 120, ease: 'Quad.easeOut',
        });
      },
    });
  }

  /** ▲ 버튼: 위로만 이동 (현재 레인 유지) */
  private moveForward() {
    // 현재 꺾이는 칸에 있으면 → 레인 전환 안 했으면 충돌
    const currentRow = this.rows[this.currentRowIdx];
    if (currentRow.isTurn && this.currentLane !== currentRow.type) {
      this.onForwardCrash();
      return;
    }

    const nextIdx = this.currentRowIdx + 1;
    const nextRow = this.rows[nextIdx];
    if (!nextRow) return;

    // 다음 칸 진입 가능 체크: 꺾이는 칸은 양쪽 허용, 직선은 해당 레인만
    const canPass = nextRow.isTurn || nextRow.type === this.currentLane;
    if (!canPass) {
      this.onForwardCrash();
      return;
    }

    // Success — advance one row
    this.justSwitched = false;
    this.currentRowIdx = nextIdx;
    this.score++;
    this.comboCount++;
    if (this.comboCount > this.bestCombo) this.bestCombo = this.comboCount;

    // Ensure more road ahead
    while (this.rows.length - this.currentRowIdx < 15) {
      this.addNextRow();
    }

    // 1) 먼저 위를 향하도록 회전 복귀
    this.tweens.add({
      targets: this.player,
      angle: 0,
      duration: 80, ease: 'Quad.easeOut',
      onComplete: () => {
        // 2) 회전 끝나면 전진 스크롤
        this.scrollToCurrentRow(nextRow);
      },
    });

    // Combo popup
    if (this.comboCount > 0 && this.comboCount % 10 === 0) {
      this.showPopup(`${this.comboCount} 콤보! 🔥`, '#ffd700');
    }

    this.cleanupOldRows();
  }

  private scrollToCurrentRow(row: RoadRow) {
    const { height } = this.scale;
    const screenY = height * 0.5;
    const targetContainerY = -(row.y - screenY);

    this.tweens.add({
      targets: this.roadContainer,
      y: targetContainerY,
      duration: 100, ease: 'Quad.easeOut',
    });

    // Keep player at screen center Y, correct lane X
    this.tweens.add({
      targets: this.player,
      x: this.laneX[this.currentLane],
      y: screenY,
      duration: 100, ease: 'Quad.easeOut',
    });
  }

  private cleanupOldRows() {
    while (this.currentRowIdx > 10) {
      const old = this.rows.shift()!;
      old.leftTile?.destroy();
      old.rightTile?.destroy();
      old.decoration?.destroy();
      this.currentRowIdx--;
    }
  }

  /* ══════════════════════════════════════
     Crash (wrong lane)
     ══════════════════════════════════════ */

  /** 위로 충돌: 살짝 올라갔다 돌아옴 */
  private onForwardCrash() {
    this.isFalling = true;
    this.comboCount = 0;
    this.setPlayerHurt(true);
    this.cameras.main.shake(200, 0.015);

    const originY = this.player.y;

    // 살짝 위로 올라갔다 돌아옴
    this.tweens.add({
      targets: this.player,
      y: originY - 25,
      duration: 100, ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: () => {
        this.timeLeft = Math.max(0, this.timeLeft - FALL_PENALTY_SEC);
        this.showPopup(`충돌! -${FALL_PENALTY_SEC}초`, '#ff6b6b');

        if (this.timeLeft <= 0) { this.endGame(); return; }

        this.time.delayedCall(300, () => {
          this.player.setAngle(0);
          this.setPlayerHurt(false);
          this.player.setAlpha(1);
          this.isFalling = false;
        });
      },
    });
  }

  private onCrash(_attemptedLane: Lane) {
    this.isFalling = true;
    this.comboCount = 0;
    this.setPlayerHurt(true);
    this.cameras.main.shake(200, 0.015);

    // 제자리에서 멈춤 — 도로 밖으로 안 나감
    this.timeLeft = Math.max(0, this.timeLeft - FALL_PENALTY_SEC);
    this.showPopup(`충돌! -${FALL_PENALTY_SEC}초`, '#ff6b6b');

    if (this.timeLeft <= 0) { this.endGame(); return; }

    // 원래 위치 + 각도로 복귀
    this.time.delayedCall(300, () => {
      this.player.x = this.laneX[this.currentLane];
      this.player.setAngle(0);
      this.setPlayerHurt(false);
      this.player.setAlpha(1);
      this.isFalling = false;
    });
  }

  /* ══════════════════════════════════════
     Popup
     ══════════════════════════════════════ */

  private showPopup(message: string, color: string) {
    const { width } = this.scale;
    const popup = this.add.text(width / 2, 70, message, {
      fontFamily: 'sans-serif', fontSize: '22px', color, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(300);

    this.tweens.add({
      targets: popup, y: 40, alpha: 0, scale: 1.3,
      duration: 700, onComplete: () => popup.destroy(),
    });
  }

  /* ══════════════════════════════════════
     Game end
     ══════════════════════════════════════ */

  private endGame() {
    this.gameOver = true;
    this.timerEvent?.remove();

    this.time.delayedCall(500, () => {
      if (this.debugMode) {
        this.scene.start('BootScene');
      } else {
        this.scene.start('ResultScene', {
          stageId: this.stageId,
          score: this.score,
          completed: true,
          timeRemaining: this.timeLeft,
        });
      }
    });
  }

  private emitState() {
    const stage = GameManager.getCurrentStage();
    emitGameState({
      scene: 'CommuteScene',
      stageId: this.stageId,
      progress: GameManager.progress,
      allCleared: false,
      stress: 0,
      time: stage.time,
      period: stage.period,
    });
  }
}
