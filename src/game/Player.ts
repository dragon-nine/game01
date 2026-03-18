import Phaser from 'phaser';
import { RABBIT_SIZE_RATIO } from './constants';

export class Player {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Image;
  private rabbitSize: number;
  currentLane = 0;

  constructor(scene: Phaser.Scene, laneW: number, startX: number, startY: number, startLane: number) {
    this.scene = scene;
    this.currentLane = startLane;

    this.rabbitSize = laneW * RABBIT_SIZE_RATIO;
    this.sprite = scene.add.image(startX, startY, 'rabbit-front')
      .setDisplaySize(this.rabbitSize, this.rabbitSize)
      .setOrigin(0.5, 0.5)
      .setDepth(150);
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  setHurt(hurt: boolean) {
    this.sprite.setTint(hurt ? 0xff4444 : 0xffffff);
  }

  /** 부활 시 스프라이트 상태 복구 */
  resetSprite() {
    this.sprite.setAlpha(1);
    this.sprite.setScale(1);
    this.sprite.setAngle(0);
    this.sprite.setTexture('rabbit-front');
    this.sprite.setDisplaySize(this.rabbitSize, this.rabbitSize);
  }

  switchTo(lane: number) {
    this.currentLane = lane;
  }

  /** 전환 성공: 타겟 화면 X로 이동 */
  animateSwitch(targetScreenX: number) {
    const goingRight = targetScreenX > this.sprite.x;
    this.sprite.setTexture('rabbit-side');
    this.sprite.setDisplaySize(this.rabbitSize, this.rabbitSize);
    this.sprite.setFlipX(!goingRight);
    this.sprite.setAngle(0);
    this.scene.tweens.add({
      targets: this.sprite,
      x: targetScreenX,
      duration: 120, ease: 'Quad.easeOut',
    });
  }

  /** 전환 실패: 길에서 떨어짐 → onDone */
  animateCrashSwitch(bumpX: number, onDone: () => void) {
    this.animateFall(bumpX, onDone);
  }

  /** 전진 성공: 뒷면 → scrollTo */
  animateForward(onDone: () => void) {
    this.sprite.setTexture('rabbit-back');
    this.sprite.setDisplaySize(this.rabbitSize, this.rabbitSize);
    this.sprite.setFlipX(false);
    this.sprite.setAngle(0);
    onDone();
  }

  /** 전진 충돌: 길에서 떨어짐 → onDone */
  animateForwardCrash(onDone: () => void) {
    this.animateFall(this.sprite.x, onDone);
  }

  /** 공통 낙하 애니메이션: 정면 → 아래로 떨어짐 + 축소 + 회전 + 페이드아웃 */
  private animateFall(targetX: number, onDone: () => void) {
    this.sprite.setTexture('rabbit-front');
    this.sprite.setDisplaySize(this.rabbitSize, this.rabbitSize);
    this.sprite.setFlipX(false);
    this.sprite.setAngle(0);
    this.sprite.setAlpha(1);

    this.scene.tweens.add({
      targets: this.sprite,
      x: targetX,
      y: this.sprite.y + 300,
      scaleX: 0.2,
      scaleY: 0.2,
      angle: 180,
      alpha: 0,
      duration: 600,
      ease: 'Quad.easeIn',
      onComplete: onDone,
    });
  }

  /** 스크롤 후 위치 맞추기 */
  scrollTo(screenX: number, screenY: number) {
    this.scene.tweens.add({
      targets: this.sprite,
      x: screenX,
      y: screenY,
      duration: 100, ease: 'Quad.easeOut',
    });
  }
}
