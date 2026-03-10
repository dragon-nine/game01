import Phaser from 'phaser';

/* ══════════════════════════════════════
   천국의 계단 — 2-Lane Road Runner

   조작: 왼쪽 버튼 = 레인 전환, 오른쪽 버튼 = 전진
   2레인 도로가 위로 꼬불꼬불 이어지고,
   토끼가 올바른 레인에서 전진해야 살아남음
   ══════════════════════════════════════ */

type Lane = 'left' | 'right';
type RoadType = 'left' | 'right';

interface RoadRow {
  type: RoadType;
  isTurn: boolean;
  y: number;
  leftTile?: Phaser.GameObjects.Image;
  rightTile?: Phaser.GameObjects.Image;
  decoration?: Phaser.GameObjects.Container;
}

const FALL_PENALTY_SEC = 3;
const GAME_DURATION = 60;

export class CommuteScene extends Phaser.Scene {
  private timeLeft = GAME_DURATION;
  private timerEvent?: Phaser.Time.TimerEvent;
  private scoreText!: Phaser.GameObjects.Text;
  private score = 0;
  private gameOver = false;

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
  private justSwitched = false;

  // Background
  private padding = 0;

  constructor() {
    super({ key: 'CommuteScene' });
  }

  preload() {
    const assets: [string, string][] = [
      ['tile-straight', 'map/straight.png'],
      ['tile-corner-tl', 'map/corner-tl.png'],
      ['tile-corner-tr', 'map/corner-tr.png'],
      ['tile-corner-bl', 'map/corner-bl.png'],
      ['tile-corner-br', 'map/corner-br.png'],
      ['building1', 'obstacles/building1.png'],
      ['building2', 'obstacles/building2.png'],
      ['rabbit', 'character/rabbit.png'],
      ['btn-forward', 'ui/btn-forward.png'],
      ['btn-switch', 'ui/btn-switch.png'],
    ];
    for (const [key, path] of assets) {
      if (!this.textures.exists(key)) this.load.image(key, path);
    }
  }

  init() {
    this.timeLeft = GAME_DURATION;
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
    this.cameras.main.setBackgroundColor('#000000');

    // Lane dimensions
    this.padding = 30;
    const padding = this.padding;
    const roadW = width - padding * 2;
    this.laneW = roadW / 2;
    this.tileH = this.laneW;
    this.laneX = {
      left: padding + this.laneW / 2,
      right: padding + this.laneW + this.laneW / 2,
    };

    // Road container (scrolls)
    this.roadContainer = this.add.container(0, 0).setDepth(5);
    this.generateInitialRoad(height);

    // Player
    this.createPlayer();

    // HUD
    this.createHUD(width);

    // Buttons
    this.createButtons(width, height);

  }

  update() {
    // reserved
  }

  /* ══════════════════════════════════════
     Road generation
     ══════════════════════════════════════ */

  private startY = 0;

  private generateInitialRoad(height: number) {
    this.startY = height - 200;
    this.straightRemaining = 1;
    this.addRoadRow('left', this.startY);

    for (let i = 0; i < 25; i++) {
      this.addNextRow();
    }
  }

  private addRoadRow(type: RoadType, y: number) {
    const prev = this.rows.length > 0 ? this.rows[this.rows.length - 1] : null;
    const isTurn = prev !== null && prev.type !== type;
    const row: RoadRow = { type, y, isTurn };

    if (isTurn) {
      if (prev!.type === 'left' && type === 'right') {
        row.leftTile = this.createTileImage(this.laneX.left, y, 'tile-corner-tl');
        row.rightTile = this.createTileImage(this.laneX.right, y, 'tile-corner-br');
      } else {
        row.leftTile = this.createTileImage(this.laneX.left, y, 'tile-corner-bl');
        row.rightTile = this.createTileImage(this.laneX.right, y, 'tile-corner-tr');
      }
      this.roadContainer.add(row.leftTile);
      this.roadContainer.add(row.rightTile);
    } else if (type === 'left') {
      row.leftTile = this.createTileImage(this.laneX.left, y, 'tile-straight');
      this.roadContainer.add(row.leftTile);
    } else {
      row.rightTile = this.createTileImage(this.laneX.right, y, 'tile-straight', true);
      this.roadContainer.add(row.rightTile);
    }

    if (!isTurn) {
      this.placeObstacle(row, type, y);
    }

    this.rows.push(row);
  }

  private createTileImage(
    x: number, y: number, key: string, flipX = false,
  ): Phaser.GameObjects.Image {
    return this.add.image(x, y, key)
      .setDisplaySize(this.laneW, this.tileH)
      .setOrigin(0.5, 0.5)
      .setFlipX(flipX);
  }

  private addNextRow() {
    const last = this.rows[this.rows.length - 1];
    const nextY = last.y - this.tileH;
    const nextType = this.pickNextRoadType(last.type);
    this.addRoadRow(nextType, nextY);
  }

  private straightRemaining = 0;

  private pickNextRoadType(prevType: RoadType): RoadType {
    if (this.straightRemaining > 0) {
      this.straightRemaining--;
      return prevType;
    }
    this.straightRemaining = Math.floor(Math.random() * 5);
    return prevType === 'left' ? 'right' : 'left';
  }

  /* ══════════════════════════════════════
     Obstacles
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
    const rabbitSize = this.laneW * 0.45;
    this.player = this.add.image(this.laneX.left, height - 200, 'rabbit')
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
    this.scoreText = this.add.text(50, 30, '0', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(201);
    this.add.rectangle(50, 30, 50, 32, 0x000000, 0.7)
      .setStrokeStyle(2, 0xffffff).setDepth(200);

    this.add.rectangle(width / 2, 30, width - 160, 24, 0x333333, 0.8)
      .setStrokeStyle(2, 0x555555).setDepth(200);

    const barW = width - 164;
    const timerFill = this.add.rectangle(
      width / 2, 30, barW, 18, 0x44cc44, 1,
    ).setDepth(201);

    this.add.rectangle(width - 50, 30, 60, 32, 0x000000, 0.7)
      .setStrokeStyle(2, 0xffffff).setDepth(200);
    const alarmText = this.add.text(width - 50, 30, `⏰ ${GAME_DURATION}`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(201);

    this.timerEvent = this.time.addEvent({
      delay: 1000, repeat: GAME_DURATION - 1,
      callback: () => {
        this.timeLeft--;
        alarmText.setText(`⏰ ${this.timeLeft}`);
        const pct = this.timeLeft / GAME_DURATION;
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

    const leftBtn = this.add.image(btnSize / 2 + 10, btnY, 'btn-switch')
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

    const rightBtn = this.add.image(width - btnSize / 2 - 10, btnY, 'btn-forward')
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

  private switchLane() {
    const opposite: Lane = this.currentLane === 'left' ? 'right' : 'left';
    const currentRow = this.rows[this.currentRowIdx];
    const canSwitch = !this.justSwitched && currentRow?.isTurn;
    const targetAngle = opposite === 'right' ? 90 : -90;

    if (!canSwitch) {
      this.isFalling = true;
      this.tweens.add({
        targets: this.player,
        angle: targetAngle,
        duration: 100, ease: 'Quad.easeOut',
        onComplete: () => {
          const bumpX = this.player.x + (opposite === 'right' ? 30 : -30);
          this.tweens.add({
            targets: this.player, x: bumpX,
            duration: 80, ease: 'Quad.easeOut',
            onComplete: () => this.onCrash(opposite),
          });
        },
      });
      return;
    }

    this.currentLane = opposite;
    this.justSwitched = true;

    this.tweens.add({
      targets: this.player,
      angle: targetAngle,
      duration: 100, ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: this.player,
          x: this.laneX[opposite],
          duration: 120, ease: 'Quad.easeOut',
        });
      },
    });
  }

  private moveForward() {
    const currentRow = this.rows[this.currentRowIdx];
    if (currentRow.isTurn && this.currentLane !== currentRow.type) {
      this.onForwardCrash();
      return;
    }

    const nextIdx = this.currentRowIdx + 1;
    const nextRow = this.rows[nextIdx];
    if (!nextRow) return;

    const canPass = nextRow.isTurn || nextRow.type === this.currentLane;
    if (!canPass) {
      this.onForwardCrash();
      return;
    }

    this.justSwitched = false;
    this.currentRowIdx = nextIdx;
    this.score++;
    this.scoreText.setText(`${this.score}`);
    this.comboCount++;
    if (this.comboCount > this.bestCombo) this.bestCombo = this.comboCount;

    while (this.rows.length - this.currentRowIdx < 15) {
      this.addNextRow();
    }

    this.tweens.add({
      targets: this.player,
      angle: 0,
      duration: 80, ease: 'Quad.easeOut',
      onComplete: () => this.scrollToCurrentRow(nextRow),
    });

    if (this.comboCount > 0 && this.comboCount % 10 === 0) {
      this.showPopup(`${this.comboCount} 콤보!`, '#ffd700');
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
     Crash
     ══════════════════════════════════════ */

  private onForwardCrash() {
    this.isFalling = true;
    this.comboCount = 0;
    this.setPlayerHurt(true);
    this.cameras.main.shake(200, 0.015);

    const originY = this.player.y;
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

    this.timeLeft = Math.max(0, this.timeLeft - FALL_PENALTY_SEC);
    this.showPopup(`충돌! -${FALL_PENALTY_SEC}초`, '#ff6b6b');
    if (this.timeLeft <= 0) { this.endGame(); return; }

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

    const { width, height } = this.scale;

    // 게임오버 오버레이
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setDepth(400);
    this.tweens.add({ targets: overlay, fillAlpha: 0.7, duration: 500 });

    const resultText = this.add.text(width / 2, height * 0.35, `점수: ${this.score}`, {
      fontFamily: 'sans-serif', fontSize: '48px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(401).setAlpha(0);

    const comboText = this.add.text(width / 2, height * 0.45, `최대 콤보: ${this.bestCombo}`, {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#aaaacc',
    }).setOrigin(0.5).setDepth(401).setAlpha(0);

    this.time.delayedCall(500, () => {
      this.tweens.add({ targets: resultText, alpha: 1, duration: 300 });
      this.tweens.add({ targets: comboText, alpha: 1, duration: 300, delay: 150 });
    });

    // 다시하기 버튼
    const retryBtn = this.add.rectangle(width / 2, height * 0.6, 220, 56, 0xe94560)
      .setInteractive({ useHandCursor: true }).setDepth(401).setAlpha(0);
    const retryText = this.add.text(width / 2, height * 0.6, '다시하기', {
      fontFamily: 'sans-serif', fontSize: '24px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(402).setAlpha(0);

    retryBtn.on('pointerover', () => retryBtn.setFillStyle(0xd63651));
    retryBtn.on('pointerout', () => retryBtn.setFillStyle(0xe94560));
    retryBtn.on('pointerdown', () => {
      this.scene.start('CommuteScene');
    });

    this.time.delayedCall(800, () => {
      this.tweens.add({ targets: [retryBtn, retryText], alpha: 1, duration: 300 });
    });
  }
}
