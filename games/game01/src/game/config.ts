import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { CommuteScene } from './scenes/CommuteScene';
import { isToss } from './platform';

export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: Math.min(window.innerWidth, 500),
    height: window.innerHeight,
    parent,
    backgroundColor: '#0a0a14',
    antialias: true,
    roundPixels: false,
    render: {
      pixelArt: false,
    },
    // 토스 WebView: Phaser canvas가 터치를 가로채는 문제 방지
    // 게임 입력은 React HUD에서 처리하므로 Phaser 입력 불필요
    ...(isToss() ? { input: { touch: false, mouse: false } } : {}),
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    loader: {
      baseURL: import.meta.env.BASE_URL,
    },
    scene: [BootScene, CommuteScene],
  };
}
