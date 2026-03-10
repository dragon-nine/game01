import type { StageDef } from '../../types/game';

export const STAGES: StageDef[] = [
  {
    id: 1,
    category: '출근',
    name: '천국의 계단',
    emoji: '🏃',
    time: '07:00',
    period: 'AM',
    bgColor: '#0a0a14',
    timeLimit: 60,
    minigame: { id: 1, sceneKey: 'CommuteScene', name: '천국의 계단', description: '아 늦었다! 출근!!', guide: '왼쪽: 방향전환+이동 | 오른쪽: 직진' },
  },
];
