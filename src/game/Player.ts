import Phaser from 'phaser';
import type { Lane, LanePositions } from './constants';
import { RABBIT_SIZE_RATIO } from './constants';

export class Player {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Image;
  private laneY: LanePositions;
  private rabbitSize: number;
  currentLane: Lane = 'mid';

  constructor(scene: Phaser.Scene, laneY: LanePositions, laneH: number, startX: number) {
    this.scene = scene;
    this.laneY = laneY;

    this.rabbitSize = laneH * RABBIT_SIZE_RATIO;
    this.sprite = scene.add.image(startX, laneY.mid, 'rabbit-front')
      .setDisplaySize(this.rabbitSize, this.rabbitSize)
      .setOrigin(0.5, 0.5)
      .setDepth(150);
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  setHurt(hurt: boolean) {
    this.sprite.setTint(hurt ? 0xff4444 : 0xffffff);
  }

  switchTo(lane: Lane) {
    this.currentLane = lane;
  }

  /** 옆면(오른쪽 향함) 텍스처 */
  private setSideTexture() {
    this.sprite.setTexture('rabbit-side');
    this.sprite.setDisplaySize(this.rabbitSize, this.rabbitSize);
    this.sprite.setFlipX(false);
  }

  /** 전환 실패: 위/아래로 부딪힘 → onDone */
  animateCrashSwitch(direction: 'up' | 'down', onDone: () => void) {
    this.setSideTexture();
    this.sprite.setAngle(0);
    const bumpY = this.sprite.y + (direction === 'up' ? -30 : 30);
    this.scene.tweens.add({
      targets: this.sprite, y: bumpY,
      duration: 80, ease: 'Quad.easeOut',
      onComplete: onDone,
    });
  }

  /** 전환 성공: 타겟 레인으로 이동 */
  animateSwitch(targetLane: Lane) {
    this.setSideTexture();
    this.sprite.setAngle(0);
    this.scene.tweens.add({
      targets: this.sprite,
      y: this.laneY[targetLane],
      duration: 120, ease: 'Quad.easeOut',
    });
  }

  /** 전진 충돌: 오른쪽으로 튕김 → onDone */
  animateForwardCrash(onDone: () => void) {
    this.setSideTexture();
    const originX = this.sprite.x;
    this.scene.tweens.add({
      targets: this.sprite,
      x: originX + 25,
      duration: 100, ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: onDone,
    });
  }

  /** 전진 성공: 옆면 텍스처 → 스크롤 */
  animateForward(onDone: () => void) {
    this.setSideTexture();
    this.sprite.setAngle(0);
    onDone();
  }

  /** 스크롤 후 위치 맞추기 */
  scrollTo(screenX: number) {
    this.scene.tweens.add({
      targets: this.sprite,
      x: screenX,
      y: this.laneY[this.currentLane],
      duration: 100, ease: 'Quad.easeOut',
    });
  }
}
