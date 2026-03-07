import Phaser from 'phaser';
import { GameManager } from '../../GameManager';
import { emitGameState } from '../../GameBridge';

const MENU_POOL = [
  '김치찌개', '된장찌개', '비빔밥', '불고기', '떡볶이',
  '삼겹살', '냉면', '짜장면', '짬뽕', '칼국수',
  '김밥', '라면', '제육볶음', '순두부', '갈비탕',
  '돈까스', '치킨', '피자', '햄버거', '초밥',
];

/**
 * 헷갈리는 오답 변형 맵
 * 정답 메뉴 → 비슷하게 생긴 가짜들
 */
const CONFUSING_VARIANTS: Record<string, string[]> = {
  '김치찌개': ['김치찌겨', '김치볶음', '김치전'],
  '된장찌개': ['된장찌겨', '된장국', '된장전'],
  '비빔밥':   ['비빔면', '비빔국수', '바빔밥'],
  '불고기':   ['불곡이', '볼고기', '풀고기'],
  '떡볶이':   ['떡볶기', '떡뽁이', '떡국'],
  '삼겹살':   ['삼겁살', '삼겹쌀', '삼겹탕'],
  '냉면':     ['랭면', '냉국', '냉밀'],
  '짜장면':   ['짜짱면', '짜장밥', '자장면'],
  '짬뽕':     ['짬뽁', '짬봉', '짱뽕'],
  '칼국수':   ['칼궁수', '칼국숫', '갈국수'],
  '김밥':     ['김빱', '김빱', '깁밥'],
  '라면':     ['라멘', '나면', '라볶이'],
  '제육볶음': ['제육볶엄', '제육복음', '재육볶음'],
  '순두부':   ['순투부', '순두봅', '슨두부'],
  '갈비탕':   ['갈비팡', '갈비찜', '갈비당'],
  '돈까스':   ['돈가스', '돈까쓰', '톤까스'],
  '치킨':     ['치킹', '치켄', 'BBQ'],
  '피자':     ['핏자', '피짜', '파자'],
  '햄버거':   ['햄버겨', '헴버거', '행버거'],
  '초밥':     ['초봅', '쵸밥', '초밤'],
};

/** 완전 다른 오답 풀 (주문 풀에 없는 음식들) */
const RANDOM_WRONG = [
  '콜라', '사이다', '탕수육', '군만두', '볶음밥',
  '카레', '오므라이스', '샌드위치', '떡국', '잡채',
  '감자탕', '부대찌개', '곱창', '족발', '보쌈',
];

/** 캐릭터 그룹 구성: 1 → 2 → 3 → 2 = 총 8명 */
const GROUP_SIZES = [1, 2, 3, 2];

/** 캐릭터 이모지 풀 */
const FACE_EMOJIS = ['😀','😃','😄','😁','😆','😊','🤗','🤩','😎','🥳','😺','🐶'];

/** 낙하속도, 생성간격 */
// Speed is dynamic: base 200 + elapsed * 3, per-item variation 0.6x~1.5x
// Spawn interval is dynamic: max(500, 1100 - elapsed * 15)
/** 오답 비율: 이 확률로 오답이 나옴 */
const WRONG_RATIO = 0.45;
/** 오답 중 헷갈리는 변형 vs 완전 다른 것 (50:50) */
const CONFUSING_RATIO = 0.5;

interface FallingItem {
  container: Phaser.GameObjects.Container;
  label: string;
  isCorrect: boolean;
  speed: number;
}

interface OrderEntry {
  menu: string;
  remaining: number;
}

export class LunchScene extends Phaser.Scene {
  private stageId!: number;
  private debugMode = false;
  private timeLeft = 60;
  private score = 0;
  private gameOver = false;
  private catchStartTime = 0;

  // Phase 1
  private orders: OrderEntry[] = [];
  private orderMenus: string[] = []; // flat list of 8 menus

  // Phase 2 — 남은 정답 풀 (못 받은 메뉴)
  private remainingPool: string[] = [];
  private fallingItems: FallingItem[] = [];
  private spawnEvent?: Phaser.Time.TimerEvent;
  private timerEvent?: Phaser.Time.TimerEvent;

  // UI
  private timerText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private basket!: Phaser.GameObjects.Image;
  private basketBounds!: Phaser.Geom.Rectangle;
  private dragOffsetX = 0;
  // Phase tracking
  private phase: 'memorize' | 'catch' = 'memorize';
  private phaseContainer: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'LunchScene' });
  }

  init(data: { stageId: number; debug?: boolean }) {
    this.stageId = data.stageId;
    this.debugMode = data.debug ?? false;
    this.timeLeft = 60;
    this.score = 0;
    this.fallingItems = [];
    this.gameOver = false;
    this.phase = 'memorize';
    this.remainingPool = [];
    this.orders = [];
    this.orderMenus = [];
    this.phaseContainer = null;
    this.catchStartTime = 0;
  }

  preload() {
    if (!this.textures.exists('basket-cooky')) {
      this.load.image('basket-cooky', 'basket-cooky.png');
    }
  }

  create() {
    const { width, height } = this.scale;
    const stage = GameManager.getCurrentStage();
    this.cameras.main.setBackgroundColor(stage.bgColor);

    // Basket (hidden during Phase 1) — Cooky character image
    const basketW = 100;
    const basketH = 120;
    this.basket = this.add.image(width / 2, height - 70, 'basket-cooky');
    this.basket.setDisplaySize(basketW, basketH);
    this.basket.setVisible(false);
    this.basketBounds = new Phaser.Geom.Rectangle(
      this.basket.x - basketW / 2, this.basket.y - basketH / 2, basketW, basketH,
    );

    // HUD — Score
    this.scoreText = this.add.text(20, 20, '점수: 0', {
      fontFamily: 'sans-serif', fontSize: '24px', color: '#ffd700', fontStyle: 'bold',
    }).setDepth(100);

    // HUD — Timer
    this.timerText = this.add.text(width - 20, 20, '60', {
      fontFamily: 'sans-serif', fontSize: '28px', color: '#e94560', fontStyle: 'bold',
    }).setOrigin(1, 0).setDepth(100);

    // Touch/drag input for basket
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.phase !== 'catch') return;
      this.dragOffsetX = this.basket.x - pointer.x;
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.phase !== 'catch' || !pointer.isDown) return;
      const halfW = 50;
      this.basket.x = Phaser.Math.Clamp(pointer.x + this.dragOffsetX, halfW, width - halfW);
      this.basketBounds.x = this.basket.x - halfW;
      this.basketBounds.y = this.basket.y - 60;
    });

    // Timer countdown
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      repeat: 59,
      callback: () => {
        this.timeLeft--;
        this.timerText.setText(`${this.timeLeft}`);
        if (this.timeLeft <= 10) this.timerText.setColor('#ff0000');
        if (this.timeLeft <= 0) this.endGame();
      },
    });

    this.emitState();

    // Generate orders & start memorize phase
    this.generateOrders();
    this.showCharacterGroups();
  }

  update(_time: number, delta: number) {
    if (this.gameOver || this.phase !== 'catch') return;

    const dt = delta / 1000;
    const { height } = this.scale;

    for (let i = this.fallingItems.length - 1; i >= 0; i--) {
      const item = this.fallingItems[i];
      item.container.y += item.speed * dt;

      // Collision with basket
      const bounds = new Phaser.Geom.Rectangle(
        item.container.x - 25, item.container.y - 12, 50, 24,
      );
      if (Phaser.Geom.Rectangle.Overlaps(bounds, this.basketBounds)) {
        this.catchItem(item, i);
        if (this.phase !== 'catch') return; // cleared
        continue;
      }

      // Off-screen
      if (item.container.y > height + 30) {
        item.container.destroy();
        this.fallingItems.splice(i, 1);
      }
    }
  }

  /* ══════════════════════════════════════
     Phase 1: 주문 암기
     ══════════════════════════════════════ */

  private generateOrders() {
    const selected: string[] = [];
    const counts = new Map<string, number>();
    const shuffled = Phaser.Utils.Array.Shuffle([...MENU_POOL]);

    let poolIdx = 0;
    while (selected.length < 8) {
      if (selected.length >= 3 && Math.random() < 0.25) {
        const existing = selected[Math.floor(Math.random() * selected.length)];
        if ((counts.get(existing) || 0) < 2) {
          selected.push(existing);
          counts.set(existing, (counts.get(existing) || 0) + 1);
          continue;
        }
      }
      const menu = shuffled[poolIdx % shuffled.length];
      poolIdx++;
      if ((counts.get(menu) || 0) < 2) {
        selected.push(menu);
        counts.set(menu, (counts.get(menu) || 0) + 1);
      }
    }

    this.orderMenus = selected;

    // Aggregate by menu
    const orderMap = new Map<string, number>();
    for (const m of selected) {
      orderMap.set(m, (orderMap.get(m) || 0) + 1);
    }
    this.orders = Array.from(orderMap.entries()).map(([menu, remaining]) => ({ menu, remaining }));

    // 남은 정답 풀 초기화
    this.remainingPool = [...selected];
  }

  private showCharacterGroups() {
    this.phase = 'memorize';
    this.phaseContainer = this.add.container(0, 0);

    let menuIdx = 0;
    let delay = 300;

    for (let g = 0; g < GROUP_SIZES.length; g++) {
      const size = GROUP_SIZES[g];
      const groupMenus: string[] = [];
      for (let c = 0; c < size; c++) {
        groupMenus.push(this.orderMenus[menuIdx++]);
      }

      this.time.delayedCall(delay, () => {
        if (this.gameOver) return;
        this.showGroup(groupMenus);
      });

      delay += 2200;
    }

    // After all groups → summary
    this.time.delayedCall(delay, () => {
      if (this.gameOver) return;
      this.showOrderSummary();
    });
  }

  private showGroup(menus: string[]) {
    const { width, height } = this.scale;
    const container = this.add.container(0, 0);
    this.phaseContainer?.add(container);

    const count = menus.length;
    const spacing = Math.min(120, (width - 80) / count);
    const startX = width / 2 - (spacing * (count - 1)) / 2;
    const centerY = height * 0.4;

    for (let i = 0; i < count; i++) {
      const x = startX + i * spacing;

      const circle = this.add.graphics();
      circle.fillStyle(0xffeaa7, 1);
      circle.fillCircle(0, 0, 30);
      circle.setPosition(x, centerY);
      container.add(circle);

      const emoji = FACE_EMOJIS[Phaser.Math.Between(0, FACE_EMOJIS.length - 1)];
      const face = this.add.text(x, centerY, emoji, {
        fontSize: '28px',
      }).setOrigin(0.5);
      container.add(face);

      const bubbleBg = this.add.graphics();
      const bubbleW = 100;
      const bubbleH = 36;
      const bubbleX = x - bubbleW / 2;
      const bubbleY = centerY - 70;
      bubbleBg.fillStyle(0xffffff, 0.95);
      bubbleBg.fillRoundedRect(bubbleX, bubbleY, bubbleW, bubbleH, 10);
      bubbleBg.fillTriangle(x - 6, bubbleY + bubbleH, x + 6, bubbleY + bubbleH, x, bubbleY + bubbleH + 10);
      container.add(bubbleBg);

      const menuText = this.add.text(x, bubbleY + bubbleH / 2, `나는 ${menus[i]}!`, {
        fontFamily: 'sans-serif', fontSize: '14px', color: '#333333', fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(menuText);
    }

    container.x = width;
    container.alpha = 0;
    this.tweens.add({
      targets: container, x: 0, alpha: 1, duration: 300, ease: 'Power2',
    });

    this.time.delayedCall(1700, () => {
      this.tweens.add({
        targets: container, alpha: 0, duration: 400,
        onComplete: () => container.destroy(),
      });
    });
  }

  private showOrderSummary() {
    if (this.gameOver) return;
    const { width, height } = this.scale;

    this.phaseContainer?.destroy();
    this.phaseContainer = this.add.container(0, 0);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRoundedRect(width * 0.1, height * 0.2, width * 0.8, height * 0.45, 16);
    this.phaseContainer.add(bg);

    const title = this.add.text(width / 2, height * 0.25, '📋 주문표', {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#ffd700', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.phaseContainer.add(title);

    let y = height * 0.33;
    for (const order of this.orders) {
      const line = this.add.text(width / 2, y, `${order.menu} × ${order.remaining}`, {
        fontFamily: 'sans-serif', fontSize: '18px', color: '#ffffff',
      }).setOrigin(0.5);
      this.phaseContainer.add(line);
      y += 28;
    }

    this.time.delayedCall(1500, () => {
      if (this.gameOver) return;
      this.phaseContainer?.destroy();
      this.phaseContainer = null;
      this.showStartBanner();
    });
  }

  private showStartBanner() {
    const { width, height } = this.scale;

    const banner = this.add.text(width / 2, height * 0.4, '시작!', {
      fontFamily: 'sans-serif', fontSize: '48px', color: '#ffd700', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    this.tweens.add({
      targets: banner,
      alpha: 1, scale: 1.2, duration: 300,
      yoyo: true, hold: 400,
      onComplete: () => {
        banner.destroy();
        this.startCatchPhase();
      },
    });
  }

  /* ══════════════════════════════════════
     Phase 2: 바구니 캐치
     ══════════════════════════════════════ */

  private startCatchPhase() {
    this.phase = 'catch';
    this.catchStartTime = this.time.now;
    this.basket.setVisible(true);

    this.scheduleSpawn();
  }

  /** 다음에 떨어뜨릴 아이템 하나 결정 */
  private pickNextItem(): { label: string; isCorrect: boolean } {
    // 정답 풀이 비어있으면 → 이미 클리어 (여기 올 일 없음)
    // 오답 확률 체크
    if (this.remainingPool.length > 0 && Math.random() < WRONG_RATIO) {
      return { label: this.pickWrongMenu(), isCorrect: false };
    }

    // 정답: 남은 풀에서 랜덤
    if (this.remainingPool.length > 0) {
      const idx = Phaser.Math.Between(0, this.remainingPool.length - 1);
      return { label: this.remainingPool[idx], isCorrect: true };
    }

    // 풀이 비었으면 오답만
    return { label: this.pickWrongMenu(), isCorrect: false };
  }

  /** 오답 메뉴 하나 고르기: 65% 헷갈리는 변형, 35% 완전 다른 것 */
  private pickWrongMenu(): string {
    if (Math.random() < CONFUSING_RATIO) {
      // 남은 주문 중 하나의 헷갈리는 변형 (더 혼란스럽게)
      const pool = this.remainingPool.length > 0 ? this.remainingPool : this.orderMenus;
      const orderMenu = pool[Phaser.Math.Between(0, pool.length - 1)];
      const variants = CONFUSING_VARIANTS[orderMenu];
      if (variants && variants.length > 0) {
        return variants[Phaser.Math.Between(0, variants.length - 1)];
      }
    }
    // 완전 다른 오답
    return RANDOM_WRONG[Phaser.Math.Between(0, RANDOM_WRONG.length - 1)];
  }

  private scheduleSpawn() {
    if (this.gameOver || this.phase !== 'catch') return;

    const elapsed = this.catchStartTime > 0 ? (this.time.now - this.catchStartTime) / 1000 : 0;
    const interval = Math.max(500, 1100 - elapsed * 15);
    this.spawnEvent = this.time.delayedCall(interval, () => {
      this.spawnItem();
      this.scheduleSpawn();
    });
  }

  private spawnItem() {
    if (this.gameOver || this.phase !== 'catch') return;

    const { width } = this.scale;
    const { label, isCorrect } = this.pickNextItem();
    const x = Phaser.Math.Between(40, width - 40);

    // 모든 아이템 동일한 외관 — 기억으로 구분
    const text = this.add.text(0, 0, label, {
      fontFamily: 'sans-serif',
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#3182f6',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5);

    const container = this.add.container(x, -20, [text]);
    const elapsed = this.catchStartTime > 0 ? (this.time.now - this.catchStartTime) / 1000 : 0;
    const baseSpeed = 200 + elapsed * 3;
    const speed = baseSpeed * Phaser.Math.FloatBetween(0.6, 1.5);
    this.fallingItems.push({ container, label, isCorrect, speed });
  }

  /* ── Catch / Effects ── */

  private catchItem(item: FallingItem, index: number) {
    const orderEntry = this.orders.find(o => o.menu === item.label);
    const isCorrectCatch = orderEntry && orderEntry.remaining > 0;

    let points: number;
    let popupColor: string;
    let popupStr: string;

    if (isCorrectCatch) {
      points = 10;
      popupColor = '#55efc4';
      popupStr = '+10';
      orderEntry!.remaining--;
      // 남은 정답 풀에서 하나 제거
      const poolIdx = this.remainingPool.indexOf(item.label);
      if (poolIdx !== -1) this.remainingPool.splice(poolIdx, 1);
    } else if (orderEntry && orderEntry.remaining <= 0) {
      // 이미 다 받은 메뉴 초과 캐치
      points = -10;
      popupColor = '#ff6b6b';
      popupStr = '-10';
    } else {
      // 오답 (주문에 없는 메뉴)
      points = -10;
      popupColor = '#ff6b6b';
      popupStr = '-10';
    }

    this.score += points;
    this.scoreText.setText(`점수: ${this.score}`);

    // Popup
    const popup = this.add.text(item.container.x, item.container.y - 10, popupStr, {
      fontFamily: 'sans-serif', fontSize: '22px', color: popupColor, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(200);

    if (points > 0) {
      this.tweens.add({
        targets: popup, y: popup.y - 50, alpha: 0, scale: 1.6,
        duration: 500, onComplete: () => popup.destroy(),
      });
    } else {
      this.tweens.add({
        targets: popup, x: popup.x + 5, duration: 50,
        yoyo: true, repeat: 3,
      });
      this.tweens.add({
        targets: popup, y: popup.y - 40, alpha: 0,
        duration: 600, onComplete: () => popup.destroy(),
      });
    }

    // Remove falling item
    this.tweens.add({
      targets: item.container,
      scale: points > 0 ? 1.5 : 0.8, alpha: 0, duration: 200,
      onComplete: () => item.container.destroy(),
    });
    this.fallingItems.splice(index, 1);

    // 전부 받았으면 클리어!
    if (this.remainingPool.length === 0 && this.orders.every(o => o.remaining <= 0)) {
      this.gameClear();
    }
  }

  /* ── Clear & End ── */

  private gameClear() {
    this.spawnEvent?.remove();
    this.phase = 'memorize';

    for (const item of this.fallingItems) {
      item.container.destroy();
    }
    this.fallingItems = [];

    // 보너스: 남은 시간 기반
    const elapsed = (this.time.now - this.catchStartTime) / 1000;
    const timeBonus = Math.max(0, Math.round((30 - elapsed) * 3));
    const bonus = 50 + timeBonus;
    this.score += bonus;
    this.scoreText.setText(`점수: ${this.score}`);

    const { width, height } = this.scale;

    const clearText = this.add.text(width / 2, height * 0.35, '주문 완료!', {
      fontFamily: 'sans-serif', fontSize: '36px', color: '#ffd700', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0).setScale(0.5).setDepth(200);

    const bonusText = this.add.text(width / 2, height * 0.45,
      `+${bonus} 보너스!${timeBonus > 0 ? ` (빠른 배달 +${timeBonus})` : ''}`, {
        fontFamily: 'sans-serif', fontSize: '20px', color: '#55efc4', fontStyle: 'bold',
      }).setOrigin(0.5).setAlpha(0).setDepth(200);

    this.tweens.add({
      targets: clearText, alpha: 1, scale: 1.1, duration: 400, ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: bonusText, alpha: 1, delay: 300, duration: 300,
    });

    this.time.delayedCall(2000, () => {
      clearText.destroy();
      bonusText.destroy();
      if (!this.gameOver) {
        this.endGame();
      }
    });
  }

  private endGame() {
    this.gameOver = true;
    this.timerEvent?.remove();
    this.spawnEvent?.remove();

    for (const item of this.fallingItems) {
      item.container.destroy();
    }
    this.fallingItems = [];
    this.phaseContainer?.destroy();

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
      scene: 'LunchScene',
      stageId: this.stageId,
      progress: GameManager.progress,
      allCleared: false,
      stress: 0,
      time: stage.time,
      period: stage.period,
    });
  }
}
