import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MinigameIntroScene } from './scenes/MinigameIntroScene';
import { ResultScene } from './scenes/ResultScene';
import { RankingScene } from './scenes/RankingScene';
import { CommuteScene } from './scenes/minigames/CommuteScene';

// Design reference resolution (iPhone 14/15 — 9:19.5)
export const DESIGN_WIDTH = 390;
export const DESIGN_HEIGHT = 844;

export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
    parent,
    backgroundColor: '#0a0a14',
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [
      BootScene, MinigameIntroScene, ResultScene, RankingScene,
      CommuteScene,
    ],
  };
}
